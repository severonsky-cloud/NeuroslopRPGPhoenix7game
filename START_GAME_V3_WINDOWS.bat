@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ===============================================
echo   Phoenix7 v3 — START ARCHITECTURE BUILD
echo ===============================================
echo.
echo Folder:
echo   %CD%
echo.
echo Game URL:
echo   http://localhost:8000/game_v3.html
echo.
echo This launcher does NOT require Python.
echo It uses Windows PowerShell as a local static server.
echo.

if not exist "%~dp0tools\phoenix_server.ps1" (
  echo ERROR: tools\phoenix_server.ps1 not found.
  echo Please pull/download the latest repository files.
  pause
  exit /b 1
)

echo Starting Phoenix7 PowerShell server...
start "Phoenix7 v3 local server" powershell -NoExit -ExecutionPolicy Bypass -File "%~dp0tools\phoenix_server.ps1" -Port 8000

echo Waiting for the local server...
timeout /t 3 /nobreak >nul

echo Opening Phoenix7 v3 in browser...
start "" "http://localhost:8000/game_v3.html"

echo.
echo If the page says it cannot connect:
echo   1. Wait 2 seconds and press Ctrl+F5 in browser.
echo   2. Check the server window for errors.
echo   3. If port 8000 is busy, close old Phoenix7 server windows.
echo.
echo You can close this launcher window. Keep the server window open while playing.
pause
