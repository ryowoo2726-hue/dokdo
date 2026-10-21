@echo off
cd /d "%~dp0"
set "PATH=%ProgramFiles%\nodejs;%PATH%"
where node >nul 2>nul
if errorlevel 1 (
  echo Install Node.js 24 LTS from https://nodejs.org/ then run this file again.
  pause
  exit /b 1
)
node -e "if(Number(process.versions.node.split('.')[0])<24)process.exit(1)"
if errorlevel 1 (
  echo Node.js 24 or newer is required.
  pause
  exit /b 1
)
echo Local storage API: http://localhost:8787/health
echo For a local preview, open preview.bat in another window.
echo Local quiz UI: http://127.0.0.1:4173/
echo Keep this window open. Press Ctrl+C to stop.
node home-server/server.mjs
pause
