@echo off
setlocal

echo ==========================================
echo  Parando Agendamento Atendimento
echo ==========================================
echo.

echo Verificando backend na porta 3001...
set "FOUND_BACKEND="
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":3001" ^| findstr "LISTENING"') do (
  set "FOUND_BACKEND=1"
  echo Encerrando backend: PID %%P
  taskkill /F /PID %%P >nul 2>nul
)

if not defined FOUND_BACKEND (
  echo Nenhum backend ativo na porta 3001.
)

echo.
echo Verificando frontend na porta 5173...
set "FOUND_FRONTEND="
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":5173" ^| findstr "LISTENING"') do (
  set "FOUND_FRONTEND=1"
  echo Encerrando frontend: PID %%P
  taskkill /F /PID %%P >nul 2>nul
)

if not defined FOUND_FRONTEND (
  echo Nenhum frontend ativo na porta 5173.
)

echo.
echo Sistema parado.
echo.
pause
