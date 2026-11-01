# scripts/publish-release.ps1
# Automates compiling installer, portable zip, creating a formal GitHub release,
# and uploading the standalone .exe installer & .zip archive directly to the release.

param(
    [string]$Version = "2.2.1"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$DistDir     = Join-Path $ProjectRoot "dist"
$Repo        = "supremeinori/my-little-library-2"
$TagName     = "v$Version"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Publishing GitHub Release $TagName (.exe & .zip assets)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Compile installer
Write-Host "Building installer..." -ForegroundColor Yellow
& (Join-Path $PSScriptRoot "build-installer.ps1")

# 2. Package portable zip
Write-Host "Building portable package..." -ForegroundColor Yellow
& (Join-Path $PSScriptRoot "package.ps1") -Version $Version

$installerExe = Join-Path $DistDir "MyLittleLibrary-Setup-v$Version.exe"
$portableZip  = Join-Path $DistDir "MyLittleLibrary-v$Version-win64.zip"

if (-not (Test-Path $installerExe)) { Write-Error "Installer executable not found: $installerExe" }
if (-not (Test-Path $portableZip))  { Write-Error "Portable zip not found: $portableZip" }

# 3. Retrieve token from Git Credential Manager
$source = @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class WinCredHelper {
    [DllImport("Advapi32.dll", EntryPoint = "CredReadW", CharSet = CharSet.Unicode, SetLastError = true)]
    public static extern bool CredRead(string target, int type, int reservedFlag, out IntPtr credentialPtr);

    [DllImport("Advapi32.dll", EntryPoint = "CredFree", SetLastError = true)]
    public static extern void CredFree(IntPtr credentialPtr);

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct CREDENTIAL {
        public int Flags;
        public int Type;
        public string TargetName;
        public string Comment;
        public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
        public int CredentialBlobSize;
        public IntPtr CredentialBlob;
        public int Persist;
        public int AttributeCount;
        public IntPtr Attributes;
        public string TargetAlias;
        public string UserName;
    }

    public static string GetPassword(string target) {
        IntPtr credPtr;
        if (CredRead(target, 1, 0, out credPtr)) {
            var cred = (CREDENTIAL)Marshal.PtrToStructure(credPtr, typeof(CREDENTIAL));
            byte[] bytes = new byte[cred.CredentialBlobSize];
            Marshal.Copy(cred.CredentialBlob, bytes, 0, cred.CredentialBlobSize);
            CredFree(credPtr);
            return Encoding.Unicode.GetString(bytes);
        }
        return null;
    }
}
"@

if (-not ([System.Management.Automation.PSTypeName]'WinCredHelper').Type) {
    Add-Type -TypeDefinition $source
}

$token = [WinCredHelper]::GetPassword("git:https://github.com")
if (-not $token) {
    Write-Error "Could not retrieve GitHub credentials for github.com."
}

$headers = @{
    'Authorization' = "token $token"
    'User-Agent'    = 'PowerShell-Release-Script'
    'Accept'        = 'application/vnd.github.v3+json'
}

# 4. Check or create Release
$releaseUrl = "https://api.github.com/repos/$Repo/releases/tags/$TagName"
$releaseObj = $null
try {
    $releaseObj = Invoke-RestMethod -Uri $releaseUrl -Headers $headers -Method Get
    Write-Host "Found existing release for $TagName (ID: $($releaseObj.id))" -ForegroundColor Green
} catch {
    Write-Host "Creating new GitHub Release for $TagName..." -ForegroundColor Yellow
    $createUrl = "https://api.github.com/repos/$Repo/releases"
    $bodyObj = @{
        tag_name   = $TagName
        name       = "My Little Library $TagName"
        body       = "Official standalone executable installer (.exe) and portable package for Windows 10 & 11."
        draft      = $false
        prerelease = $false
    }
    $bodyJson = [System.Text.Encoding]::UTF8.GetBytes(($bodyObj | ConvertTo-Json))
    $releaseObj = Invoke-RestMethod -Uri $createUrl -Headers $headers -Method Post -Body $bodyJson -ContentType "application/json; charset=utf-8"
    Write-Host "Release created: $($releaseObj.html_url)" -ForegroundColor Green
}

$uploadBase = $releaseObj.upload_url.Split('{')[0]

# 5. Upload Assets using curl
$assets = @(
    @{ Path = $installerExe; Name = [System.IO.Path]::GetFileName($installerExe); Mime = "application/vnd.microsoft.portable-executable" },
    @{ Path = $portableZip;  Name = [System.IO.Path]::GetFileName($portableZip);  Mime = "application/zip" }
)

foreach ($a in $assets) {
    $targetUrl = "$uploadBase?name=$($a.Name)"
    $filePath  = $a.Path
    $mime      = $a.Mime

    Write-Host "Uploading $($a.Name)..." -ForegroundColor Yellow

    # Delete existing asset if needed
    $existingAsset = $releaseObj.assets | Where-Object { $_.name -eq $a.Name }
    if ($existingAsset) {
        Write-Host "Removing existing asset ID $($existingAsset.id)..." -ForegroundColor DarkGray
        Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/releases/assets/$($existingAsset.id)" -Headers $headers -Method Delete | Out-Null
    }

    & curl.exe -s -X POST `
        -H "Authorization: token $token" `
        -H "Content-Type: $mime" `
        -H "Accept: application/vnd.github.v3+json" `
        --data-binary "@$filePath" `
        "$targetUrl" | Out-Null

    Write-Host "[OK] $($a.Name) uploaded successfully!" -ForegroundColor Green
}

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  Release $TagName live at: $($releaseObj.html_url)" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
