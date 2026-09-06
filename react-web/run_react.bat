@echo off
title LanceBuddy React Web
echo ==============================================
echo   Starting LanceBuddy React Web Application
echo   Available at: http://localhost:3000
echo                 http://localhost:5173
echo ==============================================
echo.
cd /d "%~dp0react-web"
start /b node serve.js
powershell -Command "Start-Sleep -Seconds 2; Start-Process 'http://localhost:3000'"
node ./node_modules/vite/bin/vite.js
