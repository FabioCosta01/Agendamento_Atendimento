# Deploy script para ambiente de produção
param(
  [string]$BackendDir = "backend",
  [string]$FrontendDir = "frontend",
  [string]$HealthUrl = "http://127.0.0.1:3001/api/health"
)

$RepoRoot = Split-Path -Parent $PSScriptRoot
Push-Location $RepoRoot
try {
Write-Host "[deploy] Raiz do repositorio: $RepoRoot"

Write-Host "[deploy] Build pacote shared (obrigatorio: shared/dist nao vai para o Git)..."
npm run build -w shared
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[deploy] Build frontend..."
npm run build -w $FrontendDir
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[deploy] Build backend..."
npm run build -w $BackendDir
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[deploy] Executando migrations de produção..."
Push-Location (Join-Path $RepoRoot $BackendDir)
npx prisma migrate deploy --schema prisma/schema.prisma
if ($LASTEXITCODE -ne 0) {
  Pop-Location
  exit $LASTEXITCODE
}
Pop-Location

if (Get-Command pm2 -ErrorAction SilentlyContinue) {
  Write-Host "[deploy] Reiniciando aplicação com pm2..."
  pm2 restart agendamento-atendimento 2>$null | Out-Null
  if ($LASTEXITCODE -ne 0) {
    Write-Host "[deploy] Aplicação pm2 não encontrada ou falha ao reiniciar. Verifique o nome do processo." -ForegroundColor Yellow
  }
} else {
  Write-Host "[deploy] pm2 não encontrado. Reinicie manualmente o backend (por exemplo, systemd ou outro service manager)." -ForegroundColor Yellow
}

Write-Host "[deploy] Validando healthcheck em $HealthUrl..."
try {
  $response = Invoke-WebRequest -Uri $HealthUrl -ErrorAction Stop
  if ($response.StatusCode -eq 200) {
    Write-Host "[deploy] Healthcheck OK" -ForegroundColor Green
  } else {
    throw "StatusCode $($response.StatusCode)"
  }
} catch {
  Write-Error "[deploy] Healthcheck falhou: $($_.Exception.Message)"
  exit 1
}
} finally {
  Pop-Location
}
