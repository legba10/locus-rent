# Скрипт быстрого запуска LOCUS (PowerShell)

Write-Host "🚀 Запуск LOCUS..." -ForegroundColor Cyan

# Проверка Node.js
Write-Host "`n📦 Проверка Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Node.js не установлен! Установите Node.js 18+" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Node.js $nodeVersion" -ForegroundColor Green

# Проверка .env файлов
Write-Host "`n📝 Проверка конфигурации..." -ForegroundColor Yellow

if (-not (Test-Path "backend\.env")) {
    Write-Host "⚠️  backend\.env не найден" -ForegroundColor Yellow
    if (Test-Path "backend\.env.example") {
        Copy-Item "backend\.env.example" "backend\.env"
        Write-Host "✓ Создан backend\.env из примера" -ForegroundColor Green
        Write-Host "⚠️  ВАЖНО: Отредактируйте backend\.env и укажите правильный DATABASE_URL!" -ForegroundColor Red
    } else {
        Write-Host "❌ backend\.env.example не найден!" -ForegroundColor Red
    }
} else {
    Write-Host "✓ backend\.env найден" -ForegroundColor Green
}

if (-not (Test-Path "frontend\.env.local")) {
    Write-Host "⚠️  frontend\.env.local не найден" -ForegroundColor Yellow
    if (Test-Path "frontend\.env.example") {
        Copy-Item "frontend\.env.example" "frontend\.env.local"
        Write-Host "✓ Создан frontend\.env.local из примера" -ForegroundColor Green
    } else {
        Write-Host "❌ frontend\.env.example не найден!" -ForegroundColor Red
    }
} else {
    Write-Host "✓ frontend\.env.local найден" -ForegroundColor Green
}

# Проверка зависимостей
Write-Host "`n📦 Проверка зависимостей..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  Зависимости не установлены. Запускаю установку..." -ForegroundColor Yellow
    npm run install:all
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Ошибка установки зависимостей!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✓ Зависимости установлены" -ForegroundColor Green
}

# Запуск
Write-Host "`n🚀 Запуск проекта..." -ForegroundColor Cyan
Write-Host "Backend: http://localhost:3001" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "`nНажмите Ctrl+C для остановки`n" -ForegroundColor Yellow

npm run dev
