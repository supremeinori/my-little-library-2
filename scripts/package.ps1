# scripts/package.ps1
# Packages My Little Library Desktop into a standalone portable ZIP distribution.

param(
    [string]$Version = "2.0.0"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$BuildScript = Join-Path $PSScriptRoot "build.ps1"
$BinDir      = Join-Path $ProjectRoot "build\bin"
$DistRoot    = Join-Path $ProjectRoot "dist"
$PackageName = "MyLittleLibrary-v$Version-win64"
$PackageDir  = Join-Path $DistRoot $PackageName
$ZipOutput   = Join-Path $DistRoot "$PackageName.zip"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Packaging My Little Library v$Version (Standalone ZIP)  " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Run build script
Write-Host "Building release binary..." -ForegroundColor Yellow
& $BuildScript -Configuration "Release"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed during packaging."
    exit $LASTEXITCODE
}

# 2. Prepare clean staging directory
if (Test-Path $PackageDir) { Remove-Item -Recurse -Force $PackageDir }
if (Test-Path $ZipOutput)  { Remove-Item -Force $ZipOutput }
New-Item -ItemType Directory -Force -Path $PackageDir | Out-Null

# 3. Copy binaries and assets
Write-Host "Assembling package contents..." -ForegroundColor Yellow
Copy-Item (Join-Path $BinDir "MyLittleLibrary.exe") $PackageDir -Force
Copy-Item (Join-Path $BinDir "WebView2Loader.dll") $PackageDir -Force
Copy-Item (Join-Path $BinDir "web") $PackageDir -Recurse -Force

if (Test-Path (Join-Path $ProjectRoot "README.md")) {
    Copy-Item (Join-Path $ProjectRoot "README.md") $PackageDir -Force
}
if (Test-Path (Join-Path $ProjectRoot "LICENSE")) {
    Copy-Item (Join-Path $ProjectRoot "LICENSE") $PackageDir -Force
}

# 4. Create ZIP archive
Write-Host "Creating archive: $ZipOutput..." -ForegroundColor Yellow
Compress-Archive -Path "$PackageDir\*" -DestinationPath $ZipOutput -CompressionLevel Optimal

# 5. Calculate Checksum & Metrics
$ZipItem = Get-Item $ZipOutput
$Hash = (Get-FileHash -Path $ZipOutput -Algorithm SHA256).Hash

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  Package Created Successfully!                           " -ForegroundColor Green
Write-Host "  File   : $($ZipItem.FullName)" -ForegroundColor Green
Write-Host "  Size   : $([math]::Round($ZipItem.Length / 1MB, 2)) MB ($($ZipItem.Length) bytes)" -ForegroundColor Green
Write-Host "  SHA256 : $Hash" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
