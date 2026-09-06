@echo off
title LanceBuddy Dev Server
echo Starting LanceBuddy Server at http://localhost:8000 ...
echo.
powershell -Command "Start-Sleep -Seconds 1; Start-Process 'http://localhost:8000'"
python dev_server.py