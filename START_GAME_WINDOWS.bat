@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ===============================================
echo   Phoenix7 — START GAME
echo ===============================================
echo.
echo Folder:
echo   %CD%
echo.
echo Game URL:
echo   http://localhost:8000/game.html
echo.
echo A new server window will open.
echo Do not close the server window while playing.
echo.

start "Phoenix7 local server" cmd /k "cd /d "%~dp0" && py -3 -m http.server 8000 || python -m http.server 8000"

echo Waiting for the local server...
timeout /t 2 /nobreak >nul

echo Opening game in browser...
start "" "http://localhost:8000/game.html"

echo.
echo If the page says it cannot connect, wait a second and refresh.
echo If port 8000 is busy, close old server windows and run this again.
echo.
pause
