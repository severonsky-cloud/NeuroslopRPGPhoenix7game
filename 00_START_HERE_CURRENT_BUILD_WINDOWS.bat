@echo off
setlocal
cd /d "%~dp0"

REM ============================================================
REM CLICK THIS FILE TO START THE CURRENT PHOENIX7 BUILD.
REM ============================================================
REM This repository has many old launchers and experimental HTML files.
REM For normal playtesting, ignore them.
REM
REM Current playable build:
REM   v3l.html
REM
REM Correct launcher called by this file:
REM   START_GAME_V3L_WINDOWS.bat
REM
REM What happens:
REM   1. A local PowerShell server starts on port 8000.
REM   2. The browser opens http://localhost:8000/v3l.html
REM   3. Press Ctrl+F5 in the browser after updates.
REM ============================================================

call "%~dp0START_GAME_V3L_WINDOWS.bat"
endlocal
