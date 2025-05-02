$composeFile = "docker-compose.win.yml"
$ollamaName = "ollama"
$agentService = "agent-windows"

# Проверка — запущен ли ollama
$ollamaRunning = docker ps --format "{{.Names}}" | Select-String -Pattern "^$ollamaName$"

if (-not $ollamaRunning) {
  Write-Host "📦 Контейнер ollama не запущен — поднимаем..."
  docker compose -f $composeFile up -d $ollamaName
} else {
  Write-Host "✅ Контейнер ollama уже запущен."
}

# Запуск агента
Write-Host "🧠 Запускаем $agentService..."
docker compose -f $composeFile run --rm -it $agentService
