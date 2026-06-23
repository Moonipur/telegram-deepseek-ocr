# Change Log

[2026-06-19] Added rules 5 (INDEX.md session orientation) and 6 (LOG.md change log) to CLAUDE.md; created INDEX.md and LOG.md — CLAUDE.md, INDEX.md, LOG.md
[2026-06-19] Initial project scaffold: Bun+TypeScript webhook server with Telegram photo download and Ollama OCR; prints extracted text to terminal — src/index.ts, package.json, .env.example, INDEX.md
[2026-06-19] Added Dockerfile and docker-compose.yml with Ollama service; both default model to deepseek-ocr — Dockerfile, docker-compose.yml
[2026-06-20] Switched from webhook to long-polling mode; removed Bun.serve, added getUpdates loop — src/index.ts
[2026-06-20] Changed OLLAMA_MODEL from glm-ocr to minicpm-v — .env
[2026-06-22] Changed OLLAMA_MODEL from minicpm-v to moondream:1.8b-v2-q8_0 — .env
[2026-06-22] Fixed Ollama 500 "invalid character '\x00'" error: explicitly encode fetch body as UTF-8 Buffer and use Uint8Array for ArrayBuffer→base64 conversion; added HTTP error checks for getFile and file download — src/index.ts
[2026-06-22] Updated OLLAMA_MODEL from moondream:1.8b-v2-q8_0 to moondream:latest — .env
[2026-06-22] Reverted OLLAMA_MODEL to moondream:1.8b-v2-q8_0; wiped ollama_data volume and did clean pull to fix corrupted blobs — .env
[2026-06-22] Print image caption as img_name on receive; add sendMessage to reply OCR result back to the chat — src/index.ts
[2026-06-22] Added debug log for incoming update keys; fixed document image support (was only handling photo[], now also handles document with image/* mime_type) — src/index.ts
[2026-06-22] Switched OLLAMA_MODEL from moondream:1.8b-v2-q8_0 to deepseek-ocr (moondream is a description model, not OCR) — .env
[2026-06-22] Changed default port from 3000 to 8000 — .env.example, docker-compose.yml, INDEX.md
[2026-06-23] Changed OLLAMA_MODEL from deepseek-ocr to maternion/LightOnOCR-2 — src/index.ts, .env, .env.example, INDEX.md
[2026-06-23] Added 40s AbortSignal.timeout to getUpdates fetch; loop continues on AbortError instead of hanging — src/index.ts
[2026-06-23] Replaced Ollama OCR backend with RapidOCR Python sidecar (rapidocr-onnxruntime, CPU-only); added rapidocr_service/; updated docker-compose.yml to remove ollama service; updated src/index.ts ocrImage to POST to RAPIDOCR_URL/ocr — rapidocr_service/main.py, rapidocr_service/Dockerfile, docker-compose.yml, src/index.ts, INDEX.md
[2026-06-23] Fixed missing spaces in OCR output: group boxes by vertical position and join same-line words with spaces instead of newlines — rapidocr_service/main.py
