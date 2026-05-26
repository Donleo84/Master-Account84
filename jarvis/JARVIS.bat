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

:: Kill any existing Jarvis on port 3000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000 " 2^>nul') do (
    taskkill /F /PID %%a >nul 2>nul
)

echo  Starting J.A.R.V.I.S. server...
cd /d "%JARVIS_DIR%"
start /B node server.js

:: Wait for server to be ready
echo  Waiting for systems to come online...
:WAITLOOP
timeout /t 1 /nobreak >nul
curl -sf http://localhost:3000/api/status >nul 2>nul
if %errorlevel% neq 0 goto WAITLOOP

echo.
echo  ✓  J.A.R.V.I.S. is online.
echo  Opening interface...
echo.
start http://localhost:3000

echo  Press Ctrl+C or close this window to shut down J.A.R.V.I.S.
echo.
node server.js
