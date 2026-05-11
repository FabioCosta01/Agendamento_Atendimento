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

where npm >nul 2>nul
if errorlevel 1 (
  echo npm nao encontrado. Verifique a instalacao do Node.js.
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

echo Liberando portas antigas, se necessario...
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":3001" ^| findstr "LISTENING"') do (
  echo Encerrando processo antigo na porta 3001: %%P
  taskkill /F /PID %%P >nul 2>nul
)

for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":5173" ^| findstr "LISTENING"') do (
  echo Encerrando processo antigo na porta 5173: %%P
  taskkill /F /PID %%P >nul 2>nul
)

echo Abrindo backend em http://localhost:3001/api
start "Agendamento Atendimento - Backend" /D "%ROOT_DIR%" cmd /k npm run backend:dev

echo Abrindo frontend em http://localhost:5173
start "Agendamento Atendimento - Frontend" /D "%ROOT_DIR%" cmd /k npm run frontend:dev

echo.
echo Sistema iniciando. Aguarde alguns segundos e acesse:
echo http://localhost:5173
echo.
echo Verifique se o MySQL/MariaDB esta ativo e se o banco agendamento_atendimento existe.
echo.
pause
