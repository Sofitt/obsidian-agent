const models = {
  // stream - способ отправки сообщений. true это побуквенно, false целое сообщение
  qwen: { name: "qwen3:8b-q4_K_M", stream: true },
  gemma: { name: "gemma3:4b-it-qat", stream: false },
};
// Укажи модель которую хочешь
const MODEL = models.qwen;
const OLLAMA_HOST = process.env.OLLAMA_HOST;

const BASE_URL = OLLAMA_HOST || "http://localhost:11434";
const API_CHAT = `${BASE_URL}/api/chat`;
const API_SHOW = `${BASE_URL}/api/show`;
const API_RUN = `${BASE_URL}/api/generate`;
module.exports = { MODEL, BASE_URL, API_CHAT, API_SHOW, API_RUN };
