# Project Index

## Purpose

Telegram ORC — a Telegram webhook server that receives images sent to a bot, runs OCR via a local Ollama vision model, and prints the extracted text to the terminal.

## Stack

- **Runtime:** Bun
- **Language:** TypeScript (strict mode)
- **OCR backend:** Ollama (default model: `deepseek-ocr`, configurable via env)
- **Webhook receiver:** `Bun.serve` HTTP server

## Structure

```
telegram-orc/
├── src/
│   └── index.ts      # Webhook server, Telegram photo download, Ollama OCR
├── .env.example      # Required environment variables
├── package.json
├── tsconfig.json
├── CLAUDE.md         # Behavioral guidelines for Claude Code
├── INDEX.md          # This file
└── LOG.md            # Append-only change log
```

## Environment Variables

| Variable      | Required | Default                    | Description                         |
|---------------|----------|----------------------------|-------------------------------------|
| `BOT_TOKEN`   | yes      | —                          | Telegram bot token from BotFather   |
| `OLLAMA_URL`  | no       | `http://localhost:11434`   | Ollama API base URL                 |
| `OLLAMA_MODEL`| no       | `maternion/LightOnOCR-2`   | Ollama model name for vision/OCR    |
| `PORT`        | no       | `8000`                     | Port for the webhook server         |

## How to Run

1. Copy `.env.example` to `.env` and fill in `BOT_TOKEN`.
2. Ensure Ollama is running with a vision model: `ollama run <model>`.
3. Expose the server publicly (e.g. via ngrok): `ngrok http 8000`.
4. Register the webhook with Telegram:
   ```
   curl "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://<your-ngrok>.ngrok.io"
   ```
5. Start the server: `bun dev`
6. Send an image to your bot — extracted text prints to terminal.

## Key Decisions

- Telegram sends photos in ascending size order; the last element is always the largest — that's what we download.
- Model name "maternion/LightOnOCR-2" may need to be verified with `ollama list`; swap via `OLLAMA_MODEL` env var.
