# Project Index

## Purpose

Telegram ORC — a Telegram webhook server that receives images sent to a bot, runs OCR via a local Ollama vision model, and prints the extracted text to the terminal.

## Stack

- **Runtime:** Bun
- **Language:** TypeScript (strict mode)
- **OCR backend:** RapidOCR (Python sidecar via `rapidocr-onnxruntime`, CPU-only)
- **Webhook receiver:** `Bun.serve` HTTP server

## Structure

```
telegram-orc/
├── src/
│   └── index.ts              # Polling server, Telegram photo download, RapidOCR call
├── rapidocr_service/
│   ├── main.py               # Flask HTTP wrapper around RapidOCR
│   └── Dockerfile            # Python 3.11-slim + rapidocr-onnxruntime
├── package.json
├── tsconfig.json
├── docker-compose.yml
├── Dockerfile                # Bun app image
├── CLAUDE.md                 # Behavioral guidelines for Claude Code
├── INDEX.md                  # This file
└── LOG.md                    # Append-only change log
```

## Environment Variables

| Variable        | Required | Default                  | Description                       |
|-----------------|----------|--------------------------|-----------------------------------|
| `BOT_TOKEN`     | yes      | —                        | Telegram bot token from BotFather |
| `RAPIDOCR_URL`  | no       | `http://localhost:8001`  | RapidOCR service base URL         |
| `PORT`          | no       | `8000`                   | Port for the webhook server       |

## How to Run

1. Create `.env` with `BOT_TOKEN=<your token>`.
2. Build and start: `docker compose up --build`
3. Send an image to your bot — extracted text prints to terminal and is sent back as a reply.

## Key Decisions

- Telegram sends photos in ascending size order; the last element is always the largest — that's what we download.
- RapidOCR (`rapidocr-onnxruntime`) is CPU-only and bundles its ONNX models — no separate model download needed.
- The RapidOCR sidecar listens on port 8001; the Bun app calls it at `RAPIDOCR_URL/ocr`.
