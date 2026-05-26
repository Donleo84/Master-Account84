@echo off
title J.A.R.V.I.S. — Stark Industries AI
color 0B

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║        J.A.R.V.I.S. STARTING UP          ║
echo  ║      Just A Rather Very Intelligent       ║
echo  ║             System  v1.0                  ║
echo  ╚══════════════════════════════════════════╝
echo.

:: Find where this script lives
set JARVIS_DIR=%~dp0

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo  ERROR: Node.js not found.
    echo  Download from: https://nodejs.org
    pause
    exit /b 1
)

:: Install dependencies if missing
if not exist "%JARVIS_DIR%node_modules" (
    echo  Installing dependencies...
    cd /d "%JARVIS_DIR%"
    npm install
)

:: Kill any existing process on port 3000
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":3000 "') do (
    taskkill /F /PID %%a >nul 2>nul
)

echo  All systems online. Opening interface in 3 seconds...
echo  Close this window to shut down J.A.R.V.I.S.
echo.

:: Open browser after a 3-second delay (in background), then run server in foreground
start /MIN cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"

cd /d "%JARVIS_DIR%"
node server.js
