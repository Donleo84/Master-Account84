# Run this ONCE to create a proper desktop shortcut with icon
$JarvisDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Desktop = [Environment]::GetFolderPath("Desktop")
$Shell = New-Object -ComObject WScript.Shell

$Shortcut = $Shell.CreateShortcut("$Desktop\J.A.R.V.I.S..lnk")
$Shortcut.TargetPath = "$JarvisDir\JARVIS.bat"
$Shortcut.WorkingDirectory = $JarvisDir
$Shortcut.Description = "Start J.A.R.V.I.S. - Stark Industries AI"
$Shortcut.WindowStyle = 1

# Use a built-in Windows icon that looks techy (shell32 icon 23 = globe/network)
$Shortcut.IconLocation = "shell32.dll,23"

$Shortcut.Save()

Write-Host ""
Write-Host "  J.A.R.V.I.S. shortcut created on your Desktop!" -ForegroundColor Cyan
Write-Host "  Double-click it to launch." -ForegroundColor Cyan
Write-Host ""
