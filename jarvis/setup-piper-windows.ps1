# setup-piper-windows.ps1
# Downloads Piper TTS binary + JARVIS MCU voice model (free, local, no API key needed)

$JarvisDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$PiperDir  = "$JarvisDir\piper"
$ModelDir  = "$env:USERPROFILE\piper-models"

Write-Host ""
Write-Host "  ╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║   JARVIS Voice Setup — Piper TTS          ║" -ForegroundColor Cyan
Write-Host "  ╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Create directories
New-Item -ItemType Directory -Force -Path $PiperDir  | Out-Null
New-Item -ItemType Directory -Force -Path $ModelDir  | Out-Null

# ── Step 1: Download Piper Windows binary ──────────────────────────────────
if (Test-Path "$PiperDir\piper.exe") {
    Write-Host "  [1/3] piper.exe already present — skipping download." -ForegroundColor Green
} else {
    Write-Host "  [1/3] Downloading Piper TTS binary (~8 MB)..." -ForegroundColor Yellow
    $ZipUrl  = "https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_windows_amd64.zip"
    $ZipPath = "$env:TEMP\piper_windows.zip"
    try {
        Invoke-WebRequest -Uri $ZipUrl -OutFile $ZipPath -UseBasicParsing
        Expand-Archive -Path $ZipPath -DestinationPath $PiperDir -Force
        Remove-Item $ZipPath -ErrorAction SilentlyContinue

        # Zip extracts to a nested piper\ folder — flatten it
        $Nested = "$PiperDir\piper"
        if (Test-Path $Nested) {
            Get-ChildItem $Nested | Move-Item -Destination $PiperDir -Force
            Remove-Item $Nested -Recurse -Force
        }
        Write-Host "  [1/3] Piper binary ready." -ForegroundColor Green
    } catch {
        Write-Host "  [1/3] ERROR downloading Piper: $_" -ForegroundColor Red
        exit 1
    }
}

# ── Step 2: Download JARVIS voice model ───────────────────────────────────
if ((Test-Path "$ModelDir\jarvis-high.onnx") -and (Test-Path "$ModelDir\jarvis-high.onnx.json")) {
    Write-Host "  [2/3] JARVIS model already present — skipping download." -ForegroundColor Green
} else {
    Write-Host "  [2/3] Downloading JARVIS voice model (~114 MB)..." -ForegroundColor Yellow
    $Base = "https://huggingface.co/jgkawell/jarvis/resolve/main/en/en_GB/jarvis/high"
    try {
        Invoke-WebRequest -Uri "$Base/jarvis-high.onnx"      -OutFile "$ModelDir\jarvis-high.onnx"      -UseBasicParsing
        Invoke-WebRequest -Uri "$Base/jarvis-high.onnx.json" -OutFile "$ModelDir\jarvis-high.onnx.json" -UseBasicParsing
        Write-Host "  [2/3] JARVIS model ready." -ForegroundColor Green
    } catch {
        Write-Host "  [2/3] ERROR downloading model: $_" -ForegroundColor Red
        exit 1
    }
}

# ── Step 3: Test the voice ────────────────────────────────────────────────
Write-Host "  [3/3] Testing JARVIS voice..." -ForegroundColor Yellow
$TestWav = "$env:TEMP\jarvis-test.wav"
$TestText = "Good day, Sir. J.A.R.V.I.S. is online and fully operational."

$TestText | & "$PiperDir\piper.exe" --model "$ModelDir\jarvis-high.onnx" --output_file $TestWav 2>&1 | Out-Null

if (Test-Path $TestWav) {
    Write-Host "  [3/3] SUCCESS — playing test audio now..." -ForegroundColor Green
    Write-Host ""
    $player = New-Object System.Media.SoundPlayer $TestWav
    $player.PlaySync()
    Remove-Item $TestWav -ErrorAction SilentlyContinue
} else {
    Write-Host "  [3/3] ERROR — piper.exe did not produce output. Check errors above." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "  Setup complete! Restart J.A.R.V.I.S. to use the JARVIS voice." -ForegroundColor Cyan
Write-Host "  (Close the Jarvis window and double-click the desktop shortcut)" -ForegroundColor Cyan
Write-Host ""
