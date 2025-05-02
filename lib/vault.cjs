const fs = require("fs");
const path = require("path");
const normalizeMarkdown = require("./normalizeMarkdown.cjs");

const VAULT_PATH = path.resolve("./vault");
const CACHE = {};
const CONTEXT_DIR = "./context";

if (!fs.existsSync(CONTEXT_DIR)) {
  fs.mkdirSync(CONTEXT_DIR);
}
const CONTEXT_FILE = path.join(CONTEXT_DIR, `context.md`);

function extractHeader(text, filename) {
  const session = text.match(/#\s*(\d+)\s*Сессия/i)?.[1] || "не указана";
  const participants = [
    ...text.matchAll(/\b(Хамаль|Эдвард|Славян|Айрис|Мистра|Харитон|Кузьма)\b/g),
  ].map((m) => m[0]);
  const uniqueParticipants = [...new Set(participants)];

  return `Файл: ${filename}\nПерсонажи: ${uniqueParticipants.join(", ") || "—"}\n`;
}

function readMarkdownFiles(dir, depth = 0, depthInfo = { max: 0 }) {
  let content = "";
  const entries = fs.readdirSync(dir);

  for (const entry of entries) {
    if (entry.startsWith("_")) continue;

    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      depthInfo.max = Math.max(depthInfo.max, depth + 1);
      content += readMarkdownFiles(fullPath, depth + 1, depthInfo);
    } else if (entry.endsWith(".md") && depth !== 0) {
      const raw = fs.readFileSync(fullPath, "utf-8");
      const header = extractHeader(raw, entry);
      const clean = normalizeMarkdown(raw);
      content += `\n\n${header}\n${clean}`;
    }
  }

  if (depth === 0) {
    console.log("📁 Максимальная вложенность папок:", depthInfo.max);
  }

  return content;
}

function loadContext(room) {
  if (!CACHE[room]) {
    const vaultText = readMarkdownFiles(VAULT_PATH);
    fs.writeFileSync(CONTEXT_FILE, vaultText, null, 2);
    CACHE[room] = `Контекст хранилища:\n${vaultText}`;
  }
  return CACHE[room];
}

function refreshContext(room) {
  const vaultText = readMarkdownFiles(VAULT_PATH);
  CACHE[room] = `Контекст хранилища:\n${vaultText}`;
  return CACHE[room];
}

module.exports = { loadContext, refreshContext };
