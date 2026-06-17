@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ===============================================
echo   Phoenix7 — local game launcher
echo ===============================================
echo.
echo This window starts a local server for the game.
echo Do not close it while playing.
echo.
echo Game URL:
echo   http://localhost:8000/game.html
echo.
echo Opening browser...
start "" "http://localhost:8000/game.html"
echo.
echo Starting server in this folder:
echo   %CD%
echo.

py -3 -m http.server 8000
if errorlevel 1 (
  echo.
  echo py command failed, trying python...
  python -m http.server 8000
)

echo.
echo Server stopped. Press any key to close.
pause >nul
