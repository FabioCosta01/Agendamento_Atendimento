@echo off
setlocal EnableDelayedExpansion

set "ROOT_DIR=%~dp0"
set "BACKEND_ENV=%ROOT_DIR%backend\.env"
set "PRISMA_SCHEMA=%ROOT_DIR%backend\prisma\schema.prisma"

cd /d "%ROOT_DIR%"

echo ==========================================
echo  Aplicar migrations do banco
echo ==========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js nao encontrado. Instale o Node.js 22 ou superior.
  echo.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo npm nao encontrado. Verifique a instalacao do Node.js.
  echo.
  pause
  exit /b 1
)

if not exist "%BACKEND_ENV%" (
  echo Arquivo backend\.env nao encontrado.
  echo Configure o DATABASE_URL antes de aplicar as migrations.
  echo.
  pause
  exit /b 1
)

if not exist "%PRISMA_SCHEMA%" (
  echo Schema Prisma nao encontrado em backend\prisma\schema.prisma.
  echo.
  pause
  exit /b 1
)

if not exist "%ROOT_DIR%node_modules" (
  echo Dependencias nao encontradas. Executando npm install...
  call npm install
  if errorlevel 1 (
    echo.
    echo Falha ao instalar dependencias.
    pause
    exit /b 1
  )
)

echo Carregando variaveis do backend\.env...
for /f "usebackq tokens=1,* delims==" %%A in ("%BACKEND_ENV%") do (
  set "ENV_KEY=%%A"
  set "ENV_VALUE=%%B"
  if not "!ENV_KEY!"=="" if not "!ENV_KEY:~0,1!"=="#" (
    set "ENV_KEY=%%A"
    set "ENV_VALUE=%%B"
    set "ENV_VALUE=!ENV_VALUE:"=!"
    set "!ENV_KEY!=!ENV_VALUE!"
  )
)

if "%DATABASE_URL%"=="" (
  echo DATABASE_URL nao encontrado no backend\.env.
  echo.
  pause
  exit /b 1
)

echo.
echo Gerando Prisma Client...
call npx prisma generate --schema "%PRISMA_SCHEMA%"
if errorlevel 1 (
  echo.
  echo Falha ao gerar Prisma Client.
  echo Feche o sistema se algum processo estiver usando arquivos do Prisma e tente novamente.
  echo.
  pause
  exit /b 1
)

echo.
echo Aplicando migrations pendentes...
call npx prisma migrate deploy --schema "%PRISMA_SCHEMA%"
if errorlevel 1 (
  echo.
  echo Falha ao aplicar migrations.
  echo Se alguma migration foi executada manualmente no phpMyAdmin, talvez seja necessario marcar como aplicada no Prisma.
  echo.
  pause
  exit /b 1
)

echo.
echo Migrations aplicadas com sucesso.
echo.
pause
