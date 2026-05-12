@echo off
setlocal

set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%backend"
set "PRISMA_SCHEMA=%BACKEND_DIR%\prisma\schema.prisma"

cd /d "%BACKEND_DIR%"

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

if not exist "%BACKEND_DIR%\.env" (
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
  echo Dependencias nao encontradas. Executando npm install na raiz do projeto...
  cd /d "%ROOT_DIR%"
  call npm install
  if errorlevel 1 (
    echo.
    echo Falha ao instalar dependencias.
    pause
    exit /b 1
  )
  cd /d "%BACKEND_DIR%"
)

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
