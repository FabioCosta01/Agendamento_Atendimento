@echo off
setlocal

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

echo ==========================================
echo  Iniciando Agendamento Atendimento
echo ==========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js nao encontrado. Instale o Node.js 22 ou superior.
  echo.
  pause
  exit /b 1
)

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo npm nao encontrado. Verifique a instalacao do Node.js.
  echo.
  pause
  exit /b 1
)

echo Versoes detectadas:
node -v
npm.cmd -v
echo.

for /f %%V in ('node -p "process.versions.node.split('.')[0]"') do set "NODE_MAJOR=%%V"
for /f %%V in ('npm.cmd -v') do set "NPM_VERSION=%%V"
for /f "tokens=1 delims=." %%V in ("%NPM_VERSION%") do set "NPM_MAJOR=%%V"

if "%NODE_MAJOR%"=="" (
  echo Nao foi possivel identificar a versao do Node.js.
  echo.
  pause
  exit /b 1
)

if "%NPM_MAJOR%"=="" (
  echo Nao foi possivel identificar a versao do npm.
  echo.
  pause
  exit /b 1
)

if %NODE_MAJOR% LSS 22 (
  echo Node.js incompativel. Este projeto exige Node.js 22 ou superior.
  echo Versao atual:
  node -v
  echo.
  pause
  exit /b 1
)

if %NPM_MAJOR% LSS 10 (
  echo npm incompativel. Este projeto exige npm 10 ou superior.
  echo Versao atual:
  npm.cmd -v
  echo.
  pause
  exit /b 1
)

if not exist "%ROOT_DIR%node_modules" (
  echo Dependencias nao encontradas. Executando npm install...
  call npm.cmd install
  if errorlevel 1 (
    echo.
    echo Falha ao instalar dependencias.
    pause
    exit /b 1
  )
)

if not exist "%ROOT_DIR%backend\.env" (
  if exist "%ROOT_DIR%backend\.env.example" (
    echo Arquivo backend\.env nao encontrado. Criando a partir de backend\.env.example...
    copy "%ROOT_DIR%backend\.env.example" "%ROOT_DIR%backend\.env" >nul
    if errorlevel 1 (
      echo Nao foi possivel criar backend\.env automaticamente.
      echo Copie backend\.env.example para backend\.env e configure DATABASE_URL e JWT_SECRET.
      echo.
      pause
      exit /b 1
    )
    echo backend\.env criado. Verifique se DATABASE_URL aponta para o banco correto do ambiente de teste.
    echo.
  ) else (
    echo Arquivo backend\.env nao encontrado.
    echo Copie backend\.env.example para backend\.env e configure DATABASE_URL e JWT_SECRET ^(minimo 32 caracteres^).
    echo.
    pause
    exit /b 1
  )
)

echo Gerando Prisma Client...
call npm.cmd run prisma:generate
if errorlevel 1 (
  echo Falha ao gerar Prisma Client.
  pause
  exit /b 1
)

if not exist "%ROOT_DIR%shared\dist\index.js" (
  echo Pacote shared sem build ^(dist^). Compilando shared...
  call npm.cmd run build -w shared
  if errorlevel 1 (
    echo Falha ao compilar o pacote shared.
    pause
    exit /b 1
  )
)

echo Liberando portas antigas, se necessario...
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":3001" ^| findstr "LISTENING"') do (
  echo Encerrando processo antigo na porta 3001: %%P
  taskkill /T /F /PID %%P >nul 2>nul
  if errorlevel 1 echo Aviso: nao foi possivel encerrar o PID %%P. Verifique manualmente.
)

for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":5173" ^| findstr "LISTENING"') do (
  echo Encerrando processo antigo na porta 5173: %%P
  taskkill /T /F /PID %%P >nul 2>nul
  if errorlevel 1 echo Aviso: nao foi possivel encerrar o PID %%P. Verifique manualmente.
)

echo Abrindo backend em http://localhost:3001/api
start "Agendamento Atendimento - Backend" /D "%ROOT_DIR%" cmd /k "npm.cmd run backend:dev"

echo Abrindo frontend em http://localhost:5173
start "Agendamento Atendimento - Frontend" /D "%ROOT_DIR%" cmd /k "npm.cmd run frontend:dev"

echo.
echo Sistema iniciando. Aguarde alguns segundos e acesse:
echo http://localhost:5173
echo.
echo Verifique se o MySQL/MariaDB esta ativo e se o banco agendamento_atendimento existe.
echo.
pause
