# J.A.R.V.I.S. PowerShell Launcher
$JarvisDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "  ============================================" -ForegroundColor Cyan
Write-Host "    J.A.R.V.I.S. Online - Stark Industries" -ForegroundColor Cyan
Write-Host "  ============================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "  ERROR: Node.js not installed." -ForegroundColor Red
    Write-Host "  Download from: https://nodejs.org" -ForegroundColor Yellow
    Write-Host ""
    Start-Process "https://nodejs.org"
    Read-Host "Press Enter to exit"
    exit 1
}

$nodeVersion = node --version
Write-Host "  Node.js $nodeVersion detected" -ForegroundColor Green

# Setup .env if missing
$envFile = Join-Path $JarvisDir ".env"
$envExample = Join-Path $JarvisDir ".env.example"

if (-not (Test-Path $envFile)) {
    Copy-Item $envExample $envFile
    Write-Host ""
    Write-Host "  .env file created - opening for editing..." -ForegroundColor Yellow
    Write-Host "  Add your ANTHROPIC_API_KEY then save and close Notepad" -ForegroundColor Yellow
    Start-Process notepad $envFile -Wait
}

# Install node_modules if needed
$nodeModules = Join-Path $JarvisDir "node_modules"
if (-not (Test-Path $nodeModules)) {
    Write-Host ""
    Write-Host "  Installing dependencies..." -ForegroundColor Yellow
    Set-Location $JarvisDir
    npm install
}

Write-Host ""
Write-Host "  Starting Jarvis..." -ForegroundColor Green
Write-Host "  Open http://localhost:3000 in Chrome or Edge" -ForegroundColor Cyan
Write-Host "  Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

Set-Location $JarvisDir
node server.js
