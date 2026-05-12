param(
  [string]$EnvFile = "backend/.env",
  [string]$OutputDir = "backups"
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$EnvPath = Join-Path $RepoRoot $EnvFile
$BackupDir = Join-Path $RepoRoot $OutputDir

if (-not (Test-Path $EnvPath)) {
  throw "Arquivo de ambiente nao encontrado: $EnvPath"
}

if (-not (Get-Command mysqldump -ErrorAction SilentlyContinue)) {
  throw "mysqldump nao encontrado no PATH."
}

$databaseUrlLine = Get-Content $EnvPath | Where-Object { $_ -match "^\s*DATABASE_URL\s*=" } | Select-Object -First 1
if (-not $databaseUrlLine) {
  throw "DATABASE_URL nao encontrada em $EnvPath"
}

$databaseUrl = ($databaseUrlLine -replace "^\s*DATABASE_URL\s*=\s*", "").Trim().Trim('"')
$uri = [Uri]$databaseUrl
$database = $uri.AbsolutePath.TrimStart("/")
$userInfo = $uri.UserInfo.Split(":", 2)
$user = [Uri]::UnescapeDataString($userInfo[0])
$password = if ($userInfo.Length -gt 1) { [Uri]::UnescapeDataString($userInfo[1]) } else { "" }
$hostName = $uri.Host
$port = if ($uri.Port -gt 0) { $uri.Port } else { 3306 }

New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outputFile = Join-Path $BackupDir "$database-$timestamp.sql"

$args = @(
  "--host=$hostName",
  "--port=$port",
  "--user=$user",
  "--default-character-set=utf8mb4",
  "--single-transaction",
  "--routines",
  "--triggers",
  $database
)

if ($password) {
  $env:MYSQL_PWD = $password
}

try {
  Write-Host "[backup] Gerando backup em $outputFile"
  & mysqldump @args | Out-File -FilePath $outputFile -Encoding utf8
  if ($LASTEXITCODE -ne 0) {
    throw "mysqldump falhou com codigo $LASTEXITCODE"
  }
  Write-Host "[backup] Backup concluido." -ForegroundColor Green
} finally {
  Remove-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue
}
