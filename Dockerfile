FROM oven/bun:1.0

WORKDIR /app
ENV TRANSFORMERS_NO_IMAGE=1

COPY . .

# Устанавливаем зависимости
RUN bun install --ignore-scripts

# Жестко выпиливаем все инстансы sharp и ставим заглушку
RUN find node_modules -type d -name "sharp" -exec rm -rf {} + && \
    mkdir -p node_modules/sharp && \
    echo "module.exports = {};" > node_modules/sharp/index.js && \
    echo "{}" > node_modules/sharp/package.json

CMD ["bun", "agent.cjs"]
