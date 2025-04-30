function normalizeMarkdown(text) {
  return (
    text
      // [[путь#секция|название]]
      .replace(
        /\[\[([^\[\]#|]+)#([^\[\]|]+)\|([^\[\]]+)\]\]/g,
        (_, file, section, name) => `Ссылка: ${name} (файл: ${file}, раздел: ${section})`,
      )
      // [[путь|название]]
      .replace(
        /\[\[([^\[\]|]+)\|([^\[\]]+)\]\]/g,
        (_, file, name) => `Ссылка: ${name} (файл: ${file})`,
      )
      // [[название]]
      .replace(/\[\[([^\[\]]+)\]\]/g, (_, name) => `Ссылка: ${name}`)
      // [название](путь)
      .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, (_, name, link) => `Ссылка: ${name} (файл: ${link})`)
      // чекбоксы
      .replace(/^\s*-\s*\[ \]\s*(.+)$/gm, "Невыполнено: $1")
      .replace(/^\s*-\s*\[x\]\s*(.+)$/gim, "Сделано: $1")
      // заголовки
      .replace(/^#{1,6}\s*(.+)$/gm, (match, title) => {
        const level = match.match(/^#+/)[0].length;
        return level === 1 ? `Тема: ${title}` : `Раздел ${level - 1}: ${title}`;
      })
      // bold/italic очистка
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      // удаление лишнего пустого
      .replace(/\n{3,}/g, "\n\n")
  );
}

module.exports = normalizeMarkdown;
