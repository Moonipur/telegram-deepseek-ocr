---
description: Launch and validate the telegram-orc bot via docker compose (type-check, Ollama model pull, compose up, live log check)
---

# Run & Validate — telegram-orc

This app runs exclusively via `docker compose`. The compose file starts two services:
- **ollama** — vision model backend (port 11434)
- **app** — Bun/TypeScript bot that polls Telegram and calls Ollama

Environment is loaded from `.env` at the project root (must contain at least `BOT_TOKEN`).

## Steps

### 1. Type-check (host)

```bash
cd /home/moonipur/Moon/WebApp/telegram-orc
bunx tsc --noEmit
```

Success: exits 0, no output.

### 2. Confirm .env is present

```bash
grep -q BOT_TOKEN .env && echo "OK" || echo "MISSING .env / BOT_TOKEN"
```

The compose file passes `BOT_TOKEN`, `OLLAMA_MODEL`, `OLLAMA_URL`, and `PORT` from `.env`.
`OLLAMA_URL` inside the stack is always `http://ollama:11434` (set in compose) — do not rely on the value in `.env` for in-container connectivity.

### 3. Start the stack

```bash
docker compose up -d --build
```

This builds the `app` image and starts both services. On first run the `ollama` container starts empty — the model must be pulled (step 4).

### 4. Pull the model into the Ollama container

```bash
source .env
docker compose exec ollama ollama pull "${OLLAMA_MODEL:-moondream:1.8b-v2-q8_0}"
```

Wait until the pull completes. Confirm:

```bash
docker compose exec ollama ollama list
```

The configured model must appear in the list.

### 5. Verify the app started cleanly

```bash
docker compose logs app
```

Expected output within a few seconds of step 3:
```
Polling for updates...
Model: <OLLAMA_MODEL> @ http://ollama:11434
```

If the app crashed before the model was ready (step 4), restart it:

```bash
docker compose restart app
docker compose logs -f app
```

### 6. OCR smoke-test inside the Ollama container

```bash
source .env
docker compose exec ollama sh -c "
  MODEL=${OLLAMA_MODEL:-moondream:1.8b-v2-q8_0}
  JPEG_B64='/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k='
  curl -sf http://localhost:11434/api/generate \
    -X POST -H 'Content-Type: application/json' \
    -d \"{\\\"model\\\":\\\"$MODEL\\\",\\\"prompt\\\":\\\"Extract text\\\",\\\"images\\\":[\\\"$JPEG_B64\\\"],\\\"stream\\\":false}\" \
    | grep -o '\"response\":\"[^\"]*\"'
"
```

Success: prints `"response":"..."` (content may be empty for a blank image — that is fine).

### 7. Live test

Send a photo to the Telegram bot. Then:

```bash
docker compose logs -f app
```

Expect:
```
Processing image...

--- OCR Result ---
<extracted text>
------------------
```

## Handy commands

```bash
docker compose ps                    # service status
docker compose logs -f app           # live app logs
docker compose logs ollama           # ollama logs
docker compose restart app           # restart bot only (model stays loaded)
docker compose down                  # stop everything
docker compose down -v               # stop + delete ollama_data volume (model deleted)
```

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `BOT_TOKEN is required` | `.env` missing or not sourced into compose | Ensure `.env` exists with `BOT_TOKEN=…` |
| `Ollama error: 500 {"error":"invalid character…"}` | Body encoding bug | Confirm `Buffer.from(…, "utf-8")` fix is in `src/index.ts` |
| `app` exits immediately | Ollama not yet ready or model missing | Pull model (step 4) then `docker compose restart app` |
| Model missing from `ollama list` | Not pulled | Run step 4 |
| `docker compose exec ollama ollama` — exec fails | Ollama container not running | `docker compose up -d ollama` first |
