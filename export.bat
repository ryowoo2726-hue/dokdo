@echo off
cd /d "%~dp0"
set "PATH=%ProgramFiles%\nodejs;%PATH%"
node home-server/export.mjs
if errorlevel 1 (
  echo Export failed. Start the server once before exporting.
  pause
  exit /b 1
)
explorer "%LOCALAPPDATA%\MaseokDokdo\exports"
pause
