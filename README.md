# obsidian-agent
## Docker
```bash
# linux
# Пребилд (опционально)
docker compose -f docker-compose.linux.yml up --build
# Запуск
docker compose -f docker-compose.linux.yml run --rm -it agent-linux
```

```bash
# windows
# Пребилд (опционально)
docker compose -f docker-compose.windows.yml up --build
# Запуск
docker compose -f docker-compose.windows.yml run --rm -it agent-windows
```

```bash
# Запустить модель
docker compose exec ollama ollama run gemma3:4b-it-qat
# Список моделей
docker compose exec ollama ollama list
```

## Setup
```bash
npm install
```

To run:

```bash
bun agent.cjs
```

# Запуск
globals.cjs

Выбираем модель из models
```js
const MODEL = models.qwen;
```

```bash
# Смена модели
MODEL_NAME=gemma3:4b-it-qat docker compose -f docker-compose.linux.yml up --build
```

```bash
# Загрузить модель
docker compose exec ollama ollama pull gemma3:4b-it-qat
```

Внутри файла указываем name выбранной модели
```
startOllama.bash
```
