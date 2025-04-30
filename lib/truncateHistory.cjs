function countApproxTokens(text) {
  return Math.ceil(text.length / 4); // очень грубая оценка: 1 токен ≈ 4 символа
}

function truncateHistory(messages, maxTokens = 6000) {
  const systemMessages = messages.filter((m) => m.role === "system");
  const dialogue = messages.filter((m) => m.role !== "system");

  let totalTokens = dialogue.reduce((sum, msg) => sum + countApproxTokens(msg.content), 0);

  while (totalTokens > maxTokens && dialogue.length > 2) {
    dialogue.shift(); // убираем самые старые пользовательские и ассистентские сообщения
    totalTokens = dialogue.reduce((sum, msg) => sum + countApproxTokens(msg.content), 0);
  }

  return [...systemMessages, ...dialogue];
}
module.exports = { truncateHistory };
