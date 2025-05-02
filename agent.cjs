process.env.TRANSFORMERS_NO_IMAGE = "1";
const axios = require("axios");
const fs = require("fs");
const readline = require("readline");
const path = require("path");
const system = require("./lib/llm/system.cjs");
const { loadContext, refreshContext } = require("./lib/vault.cjs");
const { truncateHistory } = require("./lib/truncateHistory.cjs");
const { askWithContext } = require("./lib/llm/askWithContext.cjs");
const { askWithContextStream } = require("./lib/llm/askWithContextStream.cjs");
const { MODEL, API_SHOW, API_RUN, BASE_URL } = require("./globals.cjs");

const HISTORY_DIR = "./chat_rooms";
const SYS_INSTRUCTIONS = system;

const useContext = MODEL.stream ? askWithContextStream : askWithContext;

let once = false;
async function waitForOllamaReady(timeoutMs = 10000) {
  const start = Date.now();
  while (true) {
    try {
      await axios.get(`${BASE_URL}/api/tags`);
      return;
    } catch (_) {
      !once && console.error(_);
      once = true;
    }

    if (Date.now() - start > timeoutMs) {
      throw new Error("⛔ Ollama API не отвечает");
    }

    process.stdout.write(".");
    await new Promise((r) => setTimeout(r, 500));
  }
}

async function ensureModelRunning(timeoutMs = 20000) {
  // сначала проверим — активна ли модель
  try {
    const res = await axios.post(API_SHOW, { model: MODEL.name });
    console.log("ensureModelRunning res", res?.data?.details);
    if (
      res.data?.details?.model_name === MODEL.name ||
      MODEL.name.includes(res.data?.details.family)
    )
      return;
  } catch (_) {
    // continue — может ещё не готов
  }

  // запускаем модель вручную
  console.log(`Запускаем модель ${MODEL.name} через Ollama...`);
  await waitForOllamaReady();
  try {
    await axios.post(API_RUN, {
      model: MODEL.name,
      prompt: "ping",
      stream: false,
      options: { num_ctx: 2048 },
    });
    console.log("🚀 Модель запущена ping-запросом");
  } catch (err) {
    console.error(
      "❌ Не удалось отправить ping для запуска модели:",
      err.response?.data || err.message,
    );
  }

  // ждём, пока она станет активной
  const start = Date.now();
  while (true) {
    try {
      const res = await axios.post(API_SHOW, { model: MODEL.name });
      console.log("details", res.data?.details);
      if (res.data?.details?.model_name === MODEL.name) {
        console.log("Модель активна.");
        return;
      }
    } catch (_) {
      if (!_) return;
      console.error("err", { data: _.response.data, status: _.status });
    }

    if (Date.now() - start > timeoutMs) {
      console.error(`Ошибка: не удалось запустить модель ${MODEL.name}`);
      process.exit(1);
    }

    process.stdout.write(".");
    await new Promise((r) => setTimeout(r, 1000));
  }
}

if (!fs.existsSync(HISTORY_DIR)) {
  fs.mkdirSync(HISTORY_DIR);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let roomName = "";
let messages = [];

function loadHistory(room) {
  const filePath = path.join(HISTORY_DIR, `${room}.json`);
  if (fs.existsSync(filePath)) {
    messages = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } else {
    messages = SYS_INSTRUCTIONS;
  }
}

function saveHistory(room) {
  const filePath = path.join(HISTORY_DIR, `${room}.json`);
  fs.writeFileSync(filePath, JSON.stringify(messages, null, 2));
}

async function sendMessage() {
  rl.question("Ты: ", async (input) => {
    const trimmed = input.trim();
    const possibleCmd = trimmed.toLowerCase();

    if (possibleCmd === "/exit") {
      console.log("Выход из комнаты.");
      process.exit(0);
    }

    if (possibleCmd.startsWith("/switch ")) {
      roomName = trimmed.split(" ")[1];
      loadHistory(roomName);
      console.log(`\nПереключено в комнату "${roomName}".\n`);
      return sendMessage();
    }

    if (possibleCmd === "/refresh") {
      const systemMsgs = messages.filter((m) => m.role === "system");
      messages = [...systemMsgs];

      const context = refreshContext(roomName);
      messages.push({ role: "user", content: context });
      messages.push({ role: "user", content: "Ты всё понял из контекста?" });

      const clarification = await useContext("Ты всё понял из контекста?");
      console.log("ИИ (на уточнение):", clarification, "\n");

      messages.push({ role: "assistant", content: clarification });
      messages = truncateHistory(messages);
      saveHistory(roomName);

      return sendMessage();
    }

    // ⚡ по умолчанию использовать векторный поиск
    const answer = await useContext(trimmed, roomName, rl);
    if (!MODEL.stream) {
      console.log("ИИ:", answer, "\n");
    }

    messages.push({ role: "user", content: trimmed });
    messages.push({ role: "assistant", content: answer });

    messages = truncateHistory(messages);
    saveHistory(roomName);

    sendMessage();
  });
}

ensureModelRunning().then(() => {
  rl.question("Введите название комнаты: ", (input) => {
    roomName = input.trim() || "default";
    loadHistory(roomName);
    const context = loadContext(roomName);
    messages.unshift({ role: "user", content: context });
    console.log(
      `\nКомната "${roomName}" активна.\n/exit - выход\n/switch room_name - смены комнаты\n`,
    );
    sendMessage();
  });
});
