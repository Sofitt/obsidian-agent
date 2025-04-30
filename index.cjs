const axios = require("axios");
const fs = require("fs");
const readline = require("readline");
const path = require("path");
const system = require("./lib/llm/system.cjs");
const { loadContext, refreshContext } = require("./lib/vault.cjs");
const { truncateHistory } = require("./lib/truncateHistory.cjs");
const { askWithContext } = require("./lib/llm/askWithContext.cjs");
const { askWithContextStream } = require("./lib/llm/askWithContextStream.cjs");
const { MODEL } = require("./globals.cjs");

const API_URL = "http://localhost:11434/api/chat";
const HISTORY_DIR = "./chat_rooms";
const SYS_INSTRUCTIONS = system;

const useContext = MODEL.stream ? askWithContextStream : askWithContext;

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
    const answer = await useContext(trimmed);
    console.log("ИИ:", answer, "\n");

    messages.push({ role: "user", content: trimmed });
    messages.push({ role: "assistant", content: answer });

    messages = truncateHistory(messages);
    saveHistory(roomName);

    sendMessage();
  });
}

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
