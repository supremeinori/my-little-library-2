# Build Guide: Windows Desktop Edition

**Platform:** Windows 10 / Windows 11 (x64)  
**Binary Output:** Standalone Native Windows Executable (`MyLittleLibrary.exe`) & Windows Setup Installer (`MyLittleLibrary-Setup-v2.0.0.exe`)  

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
5. **Inno Setup 6 (Optional, for building the `.exe` installer):**
   ```powershell
   winget install JRSoftware.InnoSetup
   ```

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

### `scripts/build.ps1`
Builds the complete application:
- Auto-locates the installed Clang/MinGW toolchain.
- Compiles `resources\app.rc` into COFF resource `build\obj\app.res`.
- Compiles native C files with optimizations (`-O2 -s -municode -mwindows`).
- Copies `WebView2Loader.dll` and the entire `src\web\` tree (including offline fonts and flipbook vendors) to `build\bin\`.

```powershell
# Clean release build
powershell -ExecutionPolicy Bypass -File scripts\build.ps1 -Clean -Configuration Release
```

### `scripts/build-installer.ps1`
Compiles the official Windows setup installer executable (`.exe`):
- Uses Inno Setup 6 (`ISCC.exe`).
- Packages the native executable, dependencies, and bundled offline web app into `dist\MyLittleLibrary-Setup-v2.0.0.exe`.
- Adds Desktop & Start Menu shortcuts, icon associations, and uninstaller.

```powershell
powershell -ExecutionPolicy Bypass -File scripts\build-installer.ps1
```

### `scripts/package.ps1`
Packages the built application into a standalone, portable `.zip` distribution archive:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\package.ps1 -Version "2.0.0"
```

### `scripts/create-shortcut.ps1`
Creates a Windows Desktop shortcut pointing to the built executable with the custom ink book icon and notifies the Windows shell to refresh immediately:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\create-shortcut.ps1
```

### `scripts/make-ico.ps1`
Generates a 7-resolution Windows icon (`resources/app.ico` with 16, 24, 32, 48, 64, 128, 256px) from `src/web/assets/img/logo.png`.

```powershell
powershell -ExecutionPolicy Bypass -File scripts\make-ico.ps1
```

---

## 4. Running the Application

After building, execute:
```powershell
.\build\bin\MyLittleLibrary.exe
```

Or install using `dist\MyLittleLibrary-Setup-v2.0.0.exe` for an integrated Windows desktop experience.
