@echo off
setlocal
cd /d "%~dp0"
set "PHOENIX_PORT=8033"
start "Phoenix7 v3L3 local server" powershell -NoExit -ExecutionPolicy Bypass -File "%~dp0tools\phoenix_server.ps1" -Port %PHOENIX_PORT%
timeout /t 2 /nobreak >nul
start "" "http://localhost:%PHOENIX_PORT%/v3k.html?v=30l3_player_body_1"
endlocal
