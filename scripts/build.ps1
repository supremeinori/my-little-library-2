# scripts/build.ps1
# Reproducible build script for My Little Library Windows Desktop Edition.

param(
    [string]$Configuration = "Release",
    [switch]$Clean
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$BuildDir    = Join-Path $ProjectRoot "build"
$ObjDir      = Join-Path $BuildDir "obj"
$BinDir      = Join-Path $BuildDir "bin"
$DepsDir     = Join-Path $ProjectRoot "deps\webview2"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Building My Little Library Desktop (Win32 C + WebView2) " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Clean if requested
if ($Clean -and (Test-Path $BuildDir)) {
    Write-Host "Cleaning build directory: $BuildDir..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $BuildDir
}

# 2. Ensure WebView2 SDK is downloaded
if (-not (Test-Path "$DepsDir\include\WebView2.h") -or -not (Test-Path "$DepsDir\x64\WebView2Loader.dll")) {
    Write-Host "WebView2 SDK not found. Running setup-sdk.ps1..." -ForegroundColor Yellow
    & (Join-Path $PSScriptRoot "setup-sdk.ps1")
}

# 3. Locate C Compiler and Resource Compiler
$ClangPath = $null
$WindresPath = $null

# Check LLVM-MinGW from winget
$WingetLLVM = Get-ChildItem -Path "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\*llvm-mingw*" -Filter "clang.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
if ($WingetLLVM) {
    $ClangPath = $WingetLLVM.FullName
    $WindresPath = Join-Path (Split-Path $ClangPath) "windres.exe"
}

# Fallback: check PATH
if (-not $ClangPath) {
    $cmdClang = Get-Command clang -ErrorAction SilentlyContinue
    if ($cmdClang) {
        $ClangPath = $cmdClang.Source
        $WindresPath = "windres"
    }
}

if (-not $ClangPath -or -not (Test-Path $ClangPath)) {
    Write-Error "No supported C compiler (Clang/MinGW) found on this system. Please run 'winget install MartinStorsjo.LLVM-MinGW.UCRT'."
    exit 1
}

Write-Host "Using C Compiler: $ClangPath" -ForegroundColor Green
Write-Host "Using Resource Compiler: $WindresPath" -ForegroundColor Green

# 4. Prepare output directories
New-Item -ItemType Directory -Force -Path $ObjDir | Out-Null
New-Item -ItemType Directory -Force -Path $BinDir | Out-Null

# 5. Compile Windows Resources
$RcSrc = Join-Path $ProjectRoot "resources\app.rc"
$ResDst = Join-Path $ObjDir "app.res"
Write-Host "Compiling Windows resource: $RcSrc -> $ResDst" -ForegroundColor Yellow
& $WindresPath -i $RcSrc -o $ResDst -O coff
if ($LASTEXITCODE -ne 0) {
    Write-Error "Resource compilation failed."
    exit $LASTEXITCODE
}

# 6. Compile C Native Sources
$Sources = @(
    (Join-Path $ProjectRoot "src\native\main.c"),
    (Join-Path $ProjectRoot "src\native\app_window.c"),
    (Join-Path $ProjectRoot "src\native\tray_icon.c"),
    (Join-Path $ProjectRoot "src\native\webview_host.c")
)
$ExeDst = Join-Path $BinDir "MyLittleLibrary.exe"

$OptFlags = if ($Configuration -eq "Debug") { @("-O0", "-g") } else { @("-O2", "-s") }

Write-Host "Compiling native executable ($Configuration): $ExeDst" -ForegroundColor Yellow
$CompileArgs = @(
    "-Wall", "-Wextra"
) + $OptFlags + @(
    "-municode", "-mwindows",
    "-I", (Join-Path $ProjectRoot "src\native"),
    "-I", (Join-Path $DepsDir "include")
) + $Sources + @(
    $ResDst,
    "-o", $ExeDst,
    "-luser32", "-lshell32", "-lole32", "-lshlwapi", "-loleaut32", "-luuid"
)

& $ClangPath $CompileArgs
if ($LASTEXITCODE -ne 0) {
    Write-Error "C Compilation failed."
    exit $LASTEXITCODE
}

# 7. Copy Runtime Dependencies & Web Assets
Write-Host "Copying runtime dependencies..." -ForegroundColor Yellow
Copy-Item (Join-Path $DepsDir "x64\WebView2Loader.dll") $BinDir -Force

$WebDst = Join-Path $BinDir "web"
if (Test-Path $WebDst) { Remove-Item -Recurse -Force $WebDst }
Write-Host "Deploying web assets to: $WebDst" -ForegroundColor Yellow
Copy-Item (Join-Path $ProjectRoot "src\web") $WebDst -Recurse -Force

# 8. Report Status
$ExeInfo = Get-Item $ExeDst
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  Build Completed Successfully!                           " -ForegroundColor Green
Write-Host "  Executable : $($ExeInfo.FullName)" -ForegroundColor Green
Write-Host "  File Size  : $([math]::Round($ExeInfo.Length / 1KB, 1)) KB" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
