# scripts/build-installer.ps1
# Automates compiling the standalone Windows setup executable (.exe installer)

$ErrorActionPreference = "Stop"

$isccCandidates = @(
    "C:\Users\HYPE AMD\AppData\Local\Programs\Inno Setup 6\ISCC.exe",
    "C:\Program Files (x86)\Inno Setup 6\ISCC.exe",
    "C:\Program Files\Inno Setup 6\ISCC.exe"
)

$isccPath = $null
foreach ($c in $isccCandidates) {
    if (Test-Path $c) {
        $isccPath = $c
        break
    }
}

if (-not $isccPath) {
    $cmd = Get-Command iscc -ErrorAction SilentlyContinue
    if ($cmd) { $isccPath = $cmd.Source }
}

if (-not $isccPath) {
    Write-Error "Inno Setup compiler (ISCC.exe) not found. Please install Inno Setup 6."
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Compiling My Little Library Windows Installer (.exe)   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Using ISCC: $isccPath" -ForegroundColor Gray

# Ensure binary and web assets are fresh
& (Join-Path $PSScriptRoot "build.ps1")

# Ensure output dist directory exists
$distDir = Join-Path $PSScriptRoot "..\dist"
if (-not (Test-Path $distDir)) {
    New-Item -ItemType Directory -Path $distDir | Out-Null
}

$issFile = Join-Path $PSScriptRoot "..\installer\MyLittleLibrary.iss"

Write-Host "Compiling installer script: $issFile..." -ForegroundColor Yellow
& $isccPath $issFile

$installerExe = (Get-ChildItem -Path $distDir -Filter "MyLittleLibrary-Setup-v*.exe" | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName
if (Test-Path $installerExe) {
    # Keep v2.0.0 filename copy for backward-compatible GitHub download links
    $legacyExe = Join-Path $distDir "MyLittleLibrary-Setup-v2.0.0.exe"
    Copy-Item $installerExe $legacyExe -Force

    $item = Get-Item $installerExe
    $sizeMb = [Math]::Round($item.Length / 1MB, 2)
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host "  Installer Created Successfully!                         " -ForegroundColor Green
    Write-Host "  File : $($item.FullName)" -ForegroundColor White
    Write-Host "  Size : $sizeMb MB ($($item.Length) bytes)" -ForegroundColor White
    Write-Host "==========================================================" -ForegroundColor Green
} else {
    Write-Error "Failed to generate installer executable."
}
