# scripts/setup-sdk.ps1
# Automatically downloads and extracts Microsoft.Web.WebView2 NuGet package for C/C++ native development.

$ErrorActionPreference = "Stop"

$SdkDir = Join-Path $PSScriptRoot "..\deps\webview2"
$PackageVersion = "1.0.2903.40" # Proven stable version
$PackageUrl = "https://www.nuget.org/api/v2/package/Microsoft.Web.WebView2/$PackageVersion"
$TempZip = Join-Path $env:TEMP "webview2_package_$PackageVersion.zip"

Write-Host "Setting up WebView2 SDK v$PackageVersion..." -ForegroundColor Cyan

if ((Test-Path "$SdkDir\include\WebView2.h") -and (Test-Path "$SdkDir\x64\WebView2Loader.dll")) {
    Write-Host "WebView2 SDK is already downloaded and present in $SdkDir." -ForegroundColor Green
    exit 0
}

if (-not (Test-Path $SdkDir)) {
    New-Item -ItemType Directory -Path $SdkDir -Force | Out-Null
}

Write-Host "Downloading WebView2 NuGet package from $PackageUrl..." -ForegroundColor Yellow
Invoke-WebRequest -Uri $PackageUrl -OutFile $TempZip -UseBasicParsing

Write-Host "Extracting headers and loader libraries..." -ForegroundColor Yellow
$ExtractTemp = Join-Path $env:TEMP "webview2_extract_$PackageVersion"
if (Test-Path $ExtractTemp) { Remove-Item -Recurse -Force $ExtractTemp }

Expand-Archive -Path $TempZip -DestinationPath $ExtractTemp -Force

# Copy include directory
$IncludeSrc = Join-Path $ExtractTemp "build\native\include"
$IncludeDst = Join-Path $SdkDir "include"
if (-not (Test-Path $IncludeDst)) { New-Item -ItemType Directory -Path $IncludeDst -Force | Out-Null }
Copy-Item -Path "$IncludeSrc\*" -Destination $IncludeDst -Recurse -Force

# Copy x64 binaries
$X64Src = Join-Path $ExtractTemp "build\native\x64"
$X64Dst = Join-Path $SdkDir "x64"
if (-not (Test-Path $X64Dst)) { New-Item -ItemType Directory -Path $X64Dst -Force | Out-Null }
Copy-Item -Path "$X64Src\*" -Destination $X64Dst -Recurse -Force

# Cleanup temp files
Remove-Item -Force $TempZip -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force $ExtractTemp -ErrorAction SilentlyContinue

Write-Host "WebView2 SDK successfully configured at: $SdkDir" -ForegroundColor Green
