const fetch = require("node-fetch");
const { buildVectorStore } = require("./embed.cjs");
const system = require("./system.cjs");
const { MODEL } = require("../../globals.cjs");

const OLLAMA_URL = "http://localhost:11434/api/chat";

let store = null;

async function initStore() {
  if (!store) {
    store = await buildVectorStore();
  }
}

async function askWithContext(question) {
  await initStore();

  let context = "Нет подходящего контекста.";
  const results = await store.similaritySearch(question, 4);
  if (results.length > 0) {
    context = results.map((doc) => doc.pageContent).join("\n---\n");
  }

  const messages = [
    ...system,
    { role: "user", content: `Контекст:\n${context}` },
    { role: "user", content: `Вопрос: ${question}` },
  ];

  const res = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL.name,
      messages,
      temperature: 0.3,
      stream: MODEL.stream,
    }),
  });

  const data = await res.json();
  return data.message.content.trim();
}

module.exports = { askWithContext };
