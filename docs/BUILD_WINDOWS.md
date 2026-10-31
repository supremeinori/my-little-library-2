# Build Guide: Windows Desktop Edition

**Platform:** Windows 10 / Windows 11 (x64)  
**Binary Output:** Standalone Native Windows Executable (`MyLittleLibrary.exe`)  

---

## 1. Prerequisites

To build My Little Library from source, you need:

1. **Operating System:** Windows 10 or Windows 11 (64-bit).
2. **C Compiler:** Any modern C compiler supporting Win32 and UCRT.
   - **Recommended:** **LLVM-MinGW (UCRT)**. Can be installed with a single command via Windows Package Manager:
     ```powershell
     winget install MartinStorsjo.LLVM-MinGW.UCRT
     ```
   - Alternatively, Clang with MinGW-w64 or Visual Studio MSVC (with Windows SDK).
3. **PowerShell:** PowerShell 5.1+ (built into Windows 10/11) or PowerShell 7+.
4. **Microsoft Edge WebView2 Runtime:** Pre-installed on Windows 11 and modern Windows 10 updates. If missing, install via [Evergreen Bootstrapper](https://go.microsoft.com/fwlink/p/?LinkId=2124703).

---

## 2. Quick Start: One-Command Build

From PowerShell in the project root:

```powershell
# Compiles resources, native C host, and deploys web assets
powershell -ExecutionPolicy Bypass -File scripts\build.ps1
```

If the WebView2 SDK is not present, `build.ps1` automatically calls `scripts/setup-sdk.ps1` to download and extract the required headers and `WebView2Loader.dll` from NuGet.

---

## 3. Build Scripts Reference

### `scripts/setup-sdk.ps1`
Downloads and configures the official `Microsoft.Web.WebView2` NuGet package:
- Extracts `WebView2.h` and `WebView2EnvironmentOptions.h` to `deps\webview2\include\`.
- Extracts `WebView2Loader.dll` and `WebView2Loader.dll.lib` to `deps\webview2\x64\`.

```powershell
powershell -ExecutionPolicy Bypass -File scripts\setup-sdk.ps1
```

### `scripts/build.ps1`
Builds the complete application:
- Auto-locates the installed Clang/MinGW toolchain.
- Compiles `resources\app.rc` into COFF resource `build\obj\app.res`.
- Compiles native C files with optimizations (`-O2 -s -municode -mwindows`).
- Copies `WebView2Loader.dll` and the entire `src\web\` tree to `build\bin\`.

**Parameters:**
- `-Configuration <Release|Debug>`: Default is `Release`. `Debug` includes `-g` symbols and `-O0`.
- `-Clean`: Removes `build\` directory prior to compiling.

```powershell
# Clean release build
powershell -ExecutionPolicy Bypass -File scripts\build.ps1 -Clean -Configuration Release
```

### `scripts/package.ps1`
Packages the built application into a standalone, portable `.zip` distribution archive:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\package.ps1 -Version "2.0.0"
```

The resulting zip archive is stored in `dist\MyLittleLibrary-v2.0.0-win64.zip` and includes:
```text
MyLittleLibrary-v2.0.0-win64/
├── MyLittleLibrary.exe
├── WebView2Loader.dll
├── web/
│   ├── index.html
│   ├── assets/
│   │   ├── css/style.css
│   │   └── js/
│   │       ├── db.js
│   │       └── script.js
│   └── vendor/
│       ├── epub.min.js
│       ├── jszip.min.js
│       └── README.md
├── README.md
└── LICENSE
```

---

## 4. Running the Application

After building, execute:
```powershell
.\build\bin\MyLittleLibrary.exe
```

Or extract the zip package in `dist\` to any folder and double-click `MyLittleLibrary.exe`. No installer or administrative privileges required.
