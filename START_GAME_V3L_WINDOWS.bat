@echo off
setlocal
cd /d "%~dp0"

REM ============================================================
REM PHOENIX7 / THE ELDER NEUROSLOPS — CURRENT PLAYABLE BUILD
REM ============================================================
REM THIS IS THE CORRECT WINDOWS LAUNCHER FOR THE CURRENT BUILD.
REM It starts a local server and opens the real game entrypoint:
REM
REM   http://localhost:8000/v3l.html
REM
REM Do NOT open v3l.html by double-clicking it.
REM Do NOT use old files like game.html, real3d.html, act1_*.html,
REM game_v3.html, game_v3i.html unless you are deliberately checking
REM old prototypes.
REM
REM Easiest file to click in the repository root:
REM   00_START_HERE_CURRENT_BUILD_WINDOWS.bat
REM It simply calls this launcher.
REM ============================================================

echo.
echo Phoenix7 current playable build: v3L / v3l.html
echo Starting local server on http://localhost:8000 ...
echo If the browser shows an old version, press Ctrl+F5.
echo.

start "Phoenix7 v3L local server" powershell -NoExit -ExecutionPolicy Bypass -File "%~dp0tools\phoenix_server.ps1" -Port 8000
timeout /t 2 /nobreak >nul
start "" "http://localhost:8000/v3l.html"
endlocal
