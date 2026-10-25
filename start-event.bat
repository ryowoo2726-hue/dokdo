@echo off
chcp 65001 >nul
title Dokdo Quiz Server
cd /d "%~dp0"
set "PATH=%ProgramFiles%\nodejs;%PATH%"
node home-server/controller.mjs
pause
