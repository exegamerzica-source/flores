@echo off
setlocal
cd /d "%~dp0"

set "NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

if not exist "%NODE%" (
  echo Node nao encontrado em:
  echo %NODE%
  echo.
  echo Instale o Node.js ou rode pelo ambiente do Codex.
  exit /b 1
)

"%NODE%" bot/src/build-catalog.js
