const { pipeline } = require("@xenova/transformers");

let extractor = null;

async function embed(texts) {
  if (!extractor) {
    extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
      quantized: true,
    });
  }

  const results = [];
  for (const text of texts) {
    const output = await extractor(text, { pooling: "mean", normalize: true });
    results.push(Array.from(output.data));
  }

  return results;
}

module.exports = { embed };
