@echo off
setlocal
cd /d "%~dp0"
start "Phoenix7 v3J local server" powershell -NoExit -ExecutionPolicy Bypass -File "%~dp0tools\phoenix_server.ps1" -Port 8000
timeout /t 2 /nobreak >nul
start "" "http://localhost:8000/game_v3i.html?run=30j_fort_zarya_encounter_1"
endlocal
