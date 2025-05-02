# obsidian-agent
## Windows
### Следуй подсказкам
docker-compose.win.yml
globals.cjs
### Запуск в 1 клик, после первичной установки модели
scripts/run-win-agent.ps1
## Docker
```bash
# Поднимаем ollama (всегда должен быть поднят 1 экземпляр)
docker compose -f docker-compose.linux.yml up -d ollama

# Проверить запущен ли можно с помощью команды
docker ps
```

```bash
# Предварительно качаем модель
docker exec -it ollama ollama pull qwen3:8b-q4_K_M
# Или качаем И запускаем
docker exec -it ollama ollama run qwen3:8b-q4_K_M
# Список скачанных моделей
docker compose exec ollama ollama list
```

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
docker compose -f docker-compose.win.yml up --build
# Запуск
docker compose -f docker-compose.win.yml run --rm -it agent-windows
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
docker exec -it ollama ollama list
docker exec -it ollama ollama ps
docker exec -it ollama ollama stop {ps id}
docker exec -it ollama ollama run {name form list}
```

## Запуск на windows
scripts/run-win-agent.ps1
```powershell
# Открываем powershell и запускаем .ps1 в папке scripts
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
run-win-agent.ps1
```

## Запуск ollama
Внутри файла указываем name выбранной модели
```
scripts/startOllama.bash
```
