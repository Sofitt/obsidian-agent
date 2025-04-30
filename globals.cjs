const models = {
  qwen: { name: "qwen3:8b-q4_K_M", stream: true },
  gemma: { name: "gemma3:4b-it-qat", stream: false },
};
const MODEL = models.qwen;
module.exports = { MODEL };
