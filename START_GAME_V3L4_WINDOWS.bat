@echo off
setlocal
cd /d "%~dp0"
set "PHOENIX_PORT=8044"
start "Phoenix7 v3L4 local server" powershell -NoExit -ExecutionPolicy Bypass -File "%~dp0tools\phoenix_server.ps1" -Port %PHOENIX_PORT%
timeout /t 2 /nobreak >nul
start "" "http://localhost:%PHOENIX_PORT%/v3k.html?v=30l4_visual_atmosphere_1"
endlocal
