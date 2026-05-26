param()

$JarvisDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$PiperDir  = Join-Path $JarvisDir "piper"
$ModelDir  = Join-Path $env:USERPROFILE "piper-models"

Write-Host ""
Write-Host "  JARVIS Voice Setup - Piper TTS" -ForegroundColor Cyan
Write-Host "  ================================" -ForegroundColor Cyan
Write-Host ""

New-Item -ItemType Directory -Force -Path $PiperDir | Out-Null
New-Item -ItemType Directory -Force -Path $ModelDir | Out-Null

# Step 1: Piper binary
$PiperExe = Join-Path $PiperDir "piper.exe"
if (Test-Path $PiperExe) {
    Write-Host "  [1/3] piper.exe already present." -ForegroundColor Green
} else {
    Write-Host "  [1/3] Downloading Piper TTS binary (~8 MB)..." -ForegroundColor Yellow
    $ZipUrl  = "https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_windows_amd64.zip"
    $ZipPath = Join-Path $env:TEMP "piper_windows.zip"
    Invoke-WebRequest -Uri $ZipUrl -OutFile $ZipPath -UseBasicParsing
    Expand-Archive -Path $ZipPath -DestinationPath $PiperDir -Force
    Remove-Item $ZipPath -ErrorAction SilentlyContinue
    $Nested = Join-Path $PiperDir "piper"
    if (Test-Path $Nested) {
        Get-ChildItem $Nested | Move-Item -Destination $PiperDir -Force
        Remove-Item $Nested -Recurse -Force
    }
    Write-Host "  [1/3] Piper binary ready." -ForegroundColor Green
}

# Step 2: JARVIS model
$ModelFile = Join-Path $ModelDir "jarvis-high.onnx"
$ModelJson = Join-Path $ModelDir "jarvis-high.onnx.json"
if ((Test-Path $ModelFile) -and (Test-Path $ModelJson)) {
    Write-Host "  [2/3] JARVIS model already present." -ForegroundColor Green
} else {
    Write-Host "  [2/3] Downloading JARVIS voice model (~114 MB)..." -ForegroundColor Yellow
    $Base = "https://huggingface.co/jgkawell/jarvis/resolve/main/en/en_GB/jarvis/high"
    Invoke-WebRequest -Uri "$Base/jarvis-high.onnx"      -OutFile $ModelFile -UseBasicParsing
    Invoke-WebRequest -Uri "$Base/jarvis-high.onnx.json" -OutFile $ModelJson -UseBasicParsing
    Write-Host "  [2/3] JARVIS model ready." -ForegroundColor Green
}

# Step 3: Test
Write-Host "  [3/3] Testing JARVIS voice..." -ForegroundColor Yellow
$TestWav = Join-Path $env:TEMP "jarvis-test.wav"
$TestText = "Good day Sir. J.A.R.V.I.S. is online and fully operational."
$TestText | & $PiperExe --model $ModelFile --output_file $TestWav 2>&1 | Out-Null

if (Test-Path $TestWav) {
    Write-Host "  [3/3] Success! Playing test audio..." -ForegroundColor Green
    $player = New-Object System.Media.SoundPlayer $TestWav
    $player.PlaySync()
    Remove-Item $TestWav -ErrorAction SilentlyContinue
    Write-Host ""
    Write-Host "  Done! Restart J.A.R.V.I.S. from the desktop shortcut." -ForegroundColor Cyan
} else {
    Write-Host "  [3/3] ERROR - piper.exe did not produce output." -ForegroundColor Red
}

Write-Host ""
