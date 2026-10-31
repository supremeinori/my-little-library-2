# scripts/create-shortcut.ps1
# Creates a Windows Desktop shortcut pointing to MyLittleLibrary.exe.

$ErrorActionPreference = "Stop"

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$ExePath     = Join-Path $ProjectRoot "build\bin\MyLittleLibrary.exe"
$WorkDir     = Join-Path $ProjectRoot "build\bin"
$DesktopDir  = [Environment]::GetFolderPath("Desktop")
$ShortcutLnk = Join-Path $DesktopDir "My Little Library.lnk"

if (-not (Test-Path $ExePath)) {
    Write-Host "Executable not found at: $ExePath. Building first..." -ForegroundColor Yellow
    & (Join-Path $PSScriptRoot "build.ps1")
}

Write-Host "Creating desktop shortcut..." -ForegroundColor Cyan
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutLnk)
$Shortcut.TargetPath       = $ExePath
$Shortcut.WorkingDirectory = $WorkDir
$Shortcut.Description      = "My Little Library - Windows Desktop Edition"
$Shortcut.IconLocation     = "$ExePath,0"
$Shortcut.Save()

Write-Host "Desktop shortcut created successfully at: $ShortcutLnk" -ForegroundColor Green
