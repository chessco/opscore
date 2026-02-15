# start-dev.ps1
# Script para iniciar el entorno de desarrollo local (API + Frontend + DB)

Write-Host "🚀 Iniciando entorno de desarrollo de PitayaCall..." -ForegroundColor Cyan

# 1. Iniciar Base de Datos (Docker)
Write-Host "📦 Iniciando contenedores de base de datos..." -ForegroundColor Yellow
docker-compose up -d

# 2. Iniciar API (Puerto 3008)
Write-Host "📡 Iniciando API en una nueva ventana..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd api; Write-Host '--- NestJS API (3008) ---' -ForegroundColor Green; npm run start:dev"

# 3. Iniciar Frontend (Puerto 3000)
Write-Host "💻 Iniciando Frontend en una nueva ventana..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; Write-Host '--- React Frontend (3000) ---' -ForegroundColor Blue; npm run dev"

Write-Host "✅ Servicios en proceso de inicio." -ForegroundColor Cyan
Write-Host "API: http://localhost:3008"
Write-Host "Frontend: http://localhost:3000"
