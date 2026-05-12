param(
  [switch]$SkipDatabase
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot

function Invoke-Step {
  param(
    [string]$Name,
    [scriptblock]$Command
  )

  Write-Host "[predeploy] $Name..." -ForegroundColor Cyan
  & $Command
  if ($LASTEXITCODE -ne 0) {
    throw "[predeploy] Falha em: $Name"
  }
}

Push-Location $RepoRoot
try {
  $nodeVersion = node -v
  $npmVersion = npm -v
  Write-Host "[predeploy] Node $nodeVersion | npm $npmVersion"

  $nodeMajor = [int]($nodeVersion.TrimStart("v").Split(".")[0])
  $npmMajor = [int]($npmVersion.Split(".")[0])
  if ($nodeMajor -lt 22) { throw "Node.js 22 ou superior e obrigatorio." }
  if ($npmMajor -lt 10) { throw "npm 10 ou superior e obrigatorio." }

  Invoke-Step "Instalacao consistente" { npm install }
  Invoke-Step "Prisma schema validate" {
    Push-Location (Join-Path $RepoRoot "backend")
    try {
      npx prisma validate --schema prisma/schema.prisma
    } finally {
      Pop-Location
    }
  }
  Invoke-Step "Build shared" { npm run build -w shared }
  Invoke-Step "Lint completo" { npm run lint }
  Invoke-Step "Testes backend" { npm run test -w backend }
  Invoke-Step "Build completo" { npm run build }

  if (-not $SkipDatabase) {
    Invoke-Step "Validacao do banco" { npm run db:validate }
  } else {
    Write-Host "[predeploy] Validacao do banco ignorada por parametro." -ForegroundColor Yellow
  }

  Write-Host "[predeploy] Validacao concluida com sucesso." -ForegroundColor Green
} finally {
  Pop-Location
}
