const fetch = require("node-fetch");
const { Readable } = require("stream");
const { loadContext } = require("../vault.cjs");
const system = require("./system.cjs");
const { MODEL, API_CHAT } = require("../../globals.cjs");
const readline = require("readline");

async function askWithContextStream(question, room = "default", rlInterface) {
  const context = loadContext(room);

  const messages = [
    ...system,
    { role: "user", content: `Контекст:\n${context}` },
    { role: "user", content: `Вопрос: ${question}` },
  ];

  const res = await fetch(API_CHAT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL.name,
      messages,
      temperature: 0.3,
      stream: MODEL.stream,
    }),
  });

  if (!res.ok) {
    console.error("Что-то пошло не так.");
  }

  if (!res.body || typeof res.body[Symbol.asyncIterator] !== "function") {
    throw new Error("Модель не вернула потоковый ответ.");
  }

  let fullResponse = "";
  process.stdout.write("ИИ: ");

  for await (const chunk of res.body) {
    const lines = chunk.toString("utf8").split("\n").filter(Boolean);

    for (const line of lines) {
      try {
        const json = JSON.parse(line);
        if (json.error) {
          console.error(json.error);
          break;
        }
        const token = json.message?.content || "";
        const cleaned = token.replace(/<think>|<\/think>/g, "");
        if (cleaned) {
          fullResponse += cleaned;

          if (MODEL.stream) {
            process.stdout.write(cleaned);
          }
        }
      } catch {
        continue;
      }
    }
  }

  process.stdout.write("\n");
  return fullResponse.trim();
}

module.exports = { askWithContextStream };
