const BOT_TOKEN = process.env["BOT_TOKEN"];
const OLLAMA_URL = process.env["OLLAMA_URL"] ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env["OLLAMA_MODEL"] ?? "maternion/LightOnOCR-2";

if (!BOT_TOKEN) {
  console.error("BOT_TOKEN is required");
  process.exit(1);
}

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

type TelegramPhoto = { file_id: string; width: number; height: number };
type TelegramDocument = { file_id: string; mime_type?: string };
type TelegramMessage = {
  chat: { id: number };
  photo?: TelegramPhoto[];
  document?: TelegramDocument;
  caption?: string;
};
type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
};

async function downloadPhoto(fileId: string): Promise<string> {
  const res = await fetch(`${TELEGRAM_API}/getFile?file_id=${fileId}`);
  if (!res.ok) throw new Error(`getFile error: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { result: { file_path: string } };
  const filePath = data.result.file_path;

  const imgRes = await fetch(
    `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`
  );
  if (!imgRes.ok) throw new Error(`file download error: ${imgRes.status}`);
  const buffer = await imgRes.arrayBuffer();
  return Buffer.from(new Uint8Array(buffer)).toString("base64");
}

async function sendMessage(chatId: number, text: string): Promise<void> {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

async function ocrImage(base64: string): Promise<string> {
  const payload = Buffer.from(
    JSON.stringify({
      model: OLLAMA_MODEL,
      prompt:
        "Extract all text from this image. Return only the extracted text, nothing else.",
      images: [base64],
      stream: false,
    }),
    "utf-8"
  );
  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(5 * 60 * 1000),
    body: payload,
  });

  if (!res.ok) {
    throw new Error(`Ollama error: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { response: string };
  return data.response.trim();
}

async function poll() {
  let offset = 0;
  console.log(`Polling for updates...`);
  console.log(`Model: ${OLLAMA_MODEL} @ ${OLLAMA_URL}`);

  while (true) {
    let data: { result: TelegramUpdate[] };
    try {
      const res = await fetch(
        `${TELEGRAM_API}/getUpdates?offset=${offset}&timeout=30`,
        { signal: AbortSignal.timeout(40_000) }
      );
      data = (await res.json()) as { result: TelegramUpdate[] };
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        console.warn("getUpdates timed out, retrying...");
        continue;
      }
      throw err;
    }

    for (const update of data.result) {
      offset = update.update_id + 1;

      const msg = update.message;
      console.log(`[debug] update_id=${update.update_id} msg_keys=${JSON.stringify(Object.keys(msg ?? {}))}`);

      const photos = msg?.photo;
      const doc = msg?.document;

      // resolve file_id: compressed photo (photo[]) or uncompressed file (document)
      let fileId: string | undefined;
      if (photos && photos.length > 0) {
        // last element is always the largest resolution
        fileId = photos[photos.length - 1]!.file_id;
      } else if (doc?.mime_type?.startsWith("image/")) {
        fileId = doc.file_id;
      }

      if (!fileId) continue;

      const chatId = msg!.chat.id;
      const imgName = msg!.caption ?? "untitled";
      console.log(`img_name: ${imgName}`);

      try {
        console.log(`Processing image...`);
        const base64 = await downloadPhoto(fileId);
        const text = await ocrImage(base64);
        console.log(`\n--- OCR Result ---\n${text}\n------------------\n`);
        await sendMessage(chatId, text);
      } catch (err) {
        console.error("Failed:", err);
      }
    }
  }
}

poll();
