process.env.TRANSFORMERS_NO_IMAGE = "1";
const fs = require("fs");
const path = require("path");
const normalizeMarkdown = require("../normalizeMarkdown.cjs");
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
const { MemoryVectorStore } = require("langchain/vectorstores/memory");
const { embed } = require("./local-embeddings.cjs");

const VAULT_DIR = "./vault";

async function loadChunksFromVault() {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 100,
  });

  const results = [];

  async function scan(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        await scan(fullPath);
      } else if (file.endsWith(".md")) {
        const text = fs.readFileSync(fullPath, "utf-8");
        const clean = normalizeMarkdown(text);
        try {
          const docs = await splitter.createDocuments([clean], [{ source: fullPath }]);
          for (const doc of docs) {
            if (doc && typeof doc.pageContent === "string") {
              results.push(doc);
            } else {
              console.warn("✖️ Пропущен некорректный документ:", fullPath);
            }
          }
        } catch (err) {
          console.warn("⚠️ Ошибка при обработке:", fullPath, err.message);
        }
      }
    }
  }

  await scan(VAULT_DIR);
  return results;
}

async function buildVectorStore() {
  const docs = await loadChunksFromVault();

  const vectorStore = new MemoryVectorStore({
    embedQuery: async (text) => (await embed([text]))[0],
    embedDocuments: embed,
  });

  const validDocs = docs.filter((d) => d && typeof d.pageContent === "string");

  if (validDocs.length !== docs.length) {
    console.warn("Некорректные документы были отброшены:", docs.length - validDocs.length);
  }

  await vectorStore.addDocuments(docs);
  return vectorStore;
}

module.exports = { buildVectorStore };
