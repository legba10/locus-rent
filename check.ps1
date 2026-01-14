# Скрипт проверки LOCUS (PowerShell)

Write-Host "🔍 Проверка LOCUS..." -ForegroundColor Cyan

# Проверка Backend
Write-Host "`n1️⃣ Проверка Backend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✓ Backend работает (HTTP $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend не отвечает на http://localhost:3001" -ForegroundColor Red
    Write-Host "   Убедитесь, что backend запущен: npm run dev:backend" -ForegroundColor Yellow
}

# Проверка Frontend
Write-Host "`n2️⃣ Проверка Frontend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✓ Frontend работает (HTTP $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend не отвечает на http://localhost:3000" -ForegroundColor Red
    Write-Host "   Убедитесь, что frontend запущен: npm run dev:frontend" -ForegroundColor Yellow
}

# Проверка API endpoints
Write-Host "`n3️⃣ Проверка API endpoints..." -ForegroundColor Yellow

$endpoints = @(
    @{ Path = "/api/auth/register"; Method = "POST"; Auth = $false },
    @{ Path = "/api/listings"; Method = "GET"; Auth = $false },
    @{ Path = "/api/recommendation/listings"; Method = "GET"; Auth = $false }
)

foreach ($endpoint in $endpoints) {
    try {
        $uri = "http://localhost:3001$($endpoint.Path)"
        if ($endpoint.Method -eq "GET") {
            $response = Invoke-WebRequest -Uri $uri -Method GET -TimeoutSec 3 -ErrorAction Stop
        } else {
            # Для POST просто проверяем доступность
            $response = Invoke-WebRequest -Uri $uri -Method OPTIONS -TimeoutSec 3 -ErrorAction Stop
        }
        Write-Host "✓ $($endpoint.Path)" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  $($endpoint.Path) - $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host "`n✅ Проверка завершена!" -ForegroundColor Green
Write-Host "`nДля полной проверки:" -ForegroundColor Cyan
Write-Host "1. Откройте http://localhost:3000" -ForegroundColor White
Write-Host "2. Зарегистрируйтесь" -ForegroundColor White
Write-Host "3. Перейдите на /smart-search" -ForegroundColor White
Write-Host "4. Заполните форму и проверьте результаты" -ForegroundColor White
