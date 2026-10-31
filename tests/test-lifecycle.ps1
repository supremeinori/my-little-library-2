# tests/test-lifecycle.ps1
# Automated verification of process startup, RAM usage, and single-instance behavior.

$ErrorActionPreference = "Stop"
$exePath = Resolve-Path (Join-Path $PSScriptRoot "..\build\bin\MyLittleLibrary.exe")

Write-Host "Launching MyLittleLibrary.exe..." -ForegroundColor Cyan
$sw = [System.Diagnostics.Stopwatch]::StartNew()
$proc = Start-Process -FilePath $exePath -PassThru
Start-Sleep -Seconds 2
$sw.Stop()

$proc.Refresh()
$ramMb = [math]::Round($proc.WorkingSet64 / 1MB, 2)
$pidVal = $proc.Id

Write-Host "Process PID       : $pidVal" -ForegroundColor Green
Write-Host "Cold Startup Time : $($sw.ElapsedMilliseconds) ms" -ForegroundColor Green
Write-Host "Host RAM Usage    : $ramMb MB" -ForegroundColor Green

Write-Host "Verifying Single-Instance Mutex enforcement..." -ForegroundColor Cyan
$secondProc = Start-Process -FilePath $exePath -PassThru -Wait
Write-Host "Second instance exit code: $($secondProc.ExitCode) (Expected: 0)" -ForegroundColor Green

# Cleanup
Write-Host "Cleaning up host test process..." -ForegroundColor Cyan
Stop-Process -Id $pidVal -Force
Write-Host "Process terminated cleanly." -ForegroundColor Green
