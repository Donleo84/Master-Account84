@echo off
title J.A.R.V.I.S.
echo.
echo  ================================
echo   J.A.R.V.I.S. Starting Up...
echo  ================================
echo.

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo  ERROR: Node.js not found.
    echo  Download from: https://nodejs.org
    pause
    exit /b 1
)

:: Check .env
if not exist "%~dp0.env" (
    copy "%~dp0.env.example" "%~dp0.env"
    echo  Created .env file - please add your ANTHROPIC_API_KEY
    notepad "%~dp0.env"
    pause
)

:: Install dependencies if needed
if not exist "%~dp0node_modules" (
    echo  Installing dependencies...
    npm install
)

echo  Open http://localhost:3000 in Chrome or Edge
echo  Press Ctrl+C to stop Jarvis
echo.
node "%~dp0server.js"
pause
