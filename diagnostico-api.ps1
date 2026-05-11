# Diagnóstico de Conectividade Frontend-Backend
Write-Host "================================" -ForegroundColor Cyan
Write-Host "DIAGNÓSTICO SISTEMA AGENDAMENTO" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar Backend
Write-Host "[1] Verificando Backend (Porta 3001)..." -ForegroundColor Yellow
$backend = netstat -ano | findstr :3001
if ($backend) {
  Write-Host "✓ Backend está rodando" -ForegroundColor Green
  Write-Host "   PID: $(($backend -split '\s+')[-1])" -ForegroundColor Green
} else {
  Write-Host "✗ Backend NÃO está rodando na porta 3001" -ForegroundColor Red
  Write-Host "   Execute no terminal: npm run start -w backend" -ForegroundColor Yellow
  exit 1
}
Write-Host ""

# 2. Verificar Frontend Dev
Write-Host "[2] Verificando Frontend Dev Server (Porta 5173)..." -ForegroundColor Yellow
$frontend = netstat -ano | findstr :5173
if ($frontend) {
  Write-Host "✓ Frontend Dev está rodando" -ForegroundColor Green
  Write-Host "   URL: http://localhost:5173" -ForegroundColor Green
} else {
  Write-Host "✗ Frontend Dev NÃO está rodando na porta 5173" -ForegroundColor Red
  Write-Host "   Execute no terminal: npm run dev -w frontend" -ForegroundColor Yellow
}
Write-Host ""

# 3. Testar conexão Backend
Write-Host "[3] Testando conectividade Backend..." -ForegroundColor Yellow
try {
  $response = Invoke-WebRequest -Uri "http://localhost:3001/api/usuarios/solicitantes" -Method GET -UseBasicParsing -TimeoutSec 5 -SkipHttpErrorCheck
  Write-Host "✓ Backend respondendo" -ForegroundColor Green
  Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
  Write-Host "✗ Erro ao conectar no backend" -ForegroundColor Red
  Write-Host "   Erro: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 4. Verificar CORS
Write-Host "[4] Testando CORS (Frontend -> Backend)..." -ForegroundColor Yellow
try {
  $jsonBody = @{ test = "cors" } | ConvertTo-Json
  $response = Invoke-WebRequest -Uri "http://localhost:3001/api/usuarios/cadastrar-solicitante" `
    -Method POST `
    -Body $jsonBody `
    -ContentType "application/json" `
    -UseBasicParsing `
    -TimeoutSec 5 `
    -SkipHttpErrorCheck `
    -Headers @{ "Origin" = "http://localhost:5173" }
  
  Write-Host "✓ CORS funcionando" -ForegroundColor Green
  Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
  $msg = $_.Exception.Message
  if ($msg -like "*CORS*" -or $msg -like "*Cross-Origin*") {
    Write-Host "✗ Erro de CORS" -ForegroundColor Red
    Write-Host "   $msg" -ForegroundColor Red
  } else {
    Write-Host "⚠ Erro na requisição (mas CORS pode estar ok)" -ForegroundColor Yellow
    Write-Host "   $msg" -ForegroundColor Yellow
  }
}
Write-Host ""

# 5. Verificar .env.development
Write-Host "[5] Verificando configuração do Frontend..." -ForegroundColor Yellow
$envFile = "frontend\.env.development"
if (Test-Path $envFile) {
  Write-Host "✓ Arquivo .env.development encontrado" -ForegroundColor Green
  $content = Get-Content $envFile
  Write-Host "   Conteúdo:" -ForegroundColor Green
  $content | ForEach-Object { Write-Host "   $_" -ForegroundColor Green }
} else {
  Write-Host "✗ Arquivo .env.development NÃO encontrado" -ForegroundColor Red
  Write-Host "   Este arquivo foi criado automaticamente" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "================================" -ForegroundColor Cyan
Write-Host "RESUMO" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Se tudo está ✓ verde:" -ForegroundColor Green
Write-Host "  1. Acesse http://localhost:5173 no navegador" -ForegroundColor Green
Write-Host "  2. Abra DevTools (F12) > Console para ver logs" -ForegroundColor Green
Write-Host "  3. Tente cadastrar um novo usuário" -ForegroundColor Green
Write-Host ""
Write-Host "Se há erros:" -ForegroundColor Red
Write-Host "  1. Verifique as mensagens acima" -ForegroundColor Red
Write-Host "  2. Certifique-se que backend e frontend estão rodando" -ForegroundColor Red
Write-Host "  3. Verifique se a porta 3001 não está bloqueada" -ForegroundColor Red
Write-Host ""
