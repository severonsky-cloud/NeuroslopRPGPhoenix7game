@echo off
title Phoenix7 Local Server
echo Starting Phoenix7 local server on http://localhost:8000/real3d.html
echo.
py -m http.server 8000
pause
