---
description: Launch and validate the telegram-orc bot via docker compose (type-check, compose up, live log check)
---

# Run & Validate — telegram-orc

This app runs exclusively via `docker compose`. The compose file starts two services:
- **rapidocr** — Python/Flask OCR sidecar using `rapidocr-onnxruntime` (port 8001)
- **app** — Bun/TypeScript bot that polls Telegram and calls RapidOCR

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

The compose file passes `BOT_TOKEN`, `RAPIDOCR_URL`, and `PORT` from `.env`.
`RAPIDOCR_URL` inside the stack is always `http://rapidocr:8001` (set in compose).

### 3. Start the stack

```bash
docker compose up -d --build
```

Builds both images and starts both services. No model pull needed — RapidOCR bundles its ONNX models.

### 4. Verify both services are running

```bash
docker compose ps
```

Both `rapidocr` and `app` should show status `Up`.

### 5. Verify the app started cleanly

```bash
docker compose logs app
```

Expected output:
```
Polling for updates...
RapidOCR service: http://rapidocr:8001
```

If the app crashed before `rapidocr` was ready, restart it:

```bash
docker compose restart app
docker compose logs -f app
```

### 6. OCR smoke-test against the rapidocr sidecar

```bash
docker compose exec rapidocr python -c "
from rapidocr_onnxruntime import RapidOCR
engine = RapidOCR()
print('RapidOCR OK')
"
```

Success: prints `RapidOCR OK` with no errors.

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
docker compose logs rapidocr         # rapidocr sidecar logs
docker compose restart app           # restart bot only
docker compose down                  # stop everything
docker compose up -d --build         # rebuild and restart
```

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `BOT_TOKEN is required` | `.env` missing or not sourced into compose | Ensure `.env` exists with `BOT_TOKEN=…` |
| `app` exits immediately | `rapidocr` sidecar not ready | `docker compose restart app` after sidecar is up |
| `RapidOCR error: 500` | Python crash in sidecar | Check `docker compose logs rapidocr` |
| OCR returns empty string | Image unreadable or no text detected | Expected behaviour for blank/unclear images |
