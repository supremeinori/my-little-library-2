# scripts/create-shortcut.ps1
# Creates a Windows Desktop shortcut pointing to MyLittleLibrary.exe with the new ink book icon.

$ErrorActionPreference = "Stop"

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$ExePath     = Join-Path $ProjectRoot "build\bin\MyLittleLibrary.exe"
$WorkDir     = Join-Path $ProjectRoot "build\bin"
$IcoPath     = Join-Path $ProjectRoot "resources\app.ico"
$DesktopDir  = [Environment]::GetFolderPath("Desktop")
$ShortcutLnk = Join-Path $DesktopDir "My Little Library.lnk"

if (-not (Test-Path $ExePath)) {
    Write-Host "Executable not found at: $ExePath. Building first..." -ForegroundColor Yellow
    & (Join-Path $PSScriptRoot "build.ps1")
}

Write-Host "Creating desktop shortcut..." -ForegroundColor Cyan

# Remove old shortcut if exists
if (Test-Path $ShortcutLnk) {
    Remove-Item $ShortcutLnk -Force
}

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutLnk)
$Shortcut.TargetPath       = $ExePath
$Shortcut.WorkingDirectory = $WorkDir
$Shortcut.Description      = "My Little Library - Windows Desktop Edition"
$Shortcut.IconLocation     = "$IcoPath,0"
$Shortcut.Save()

# Notify Windows Explorer shell to refresh icons immediately
try {
    Add-Type -TypeDefinition @"
    using System;
    using System.Runtime.InteropServices;
    public class ShellNotifier {
        [DllImport("shell32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        public static extern void SHChangeNotify(int wEventId, uint uFlags, IntPtr dwItem1, IntPtr dwItem2);
    }
"@ -ErrorAction SilentlyContinue
    [ShellNotifier]::SHChangeNotify(0x08000000, 0, [IntPtr]::Zero, [IntPtr]::Zero)
} catch {
    Start-Process "ie4uinit.exe" -ArgumentList "-show" -NoNewWindow -Wait -ErrorAction SilentlyContinue
}

Write-Host "Desktop shortcut created successfully at: $ShortcutLnk" -ForegroundColor Green
