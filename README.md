# My Little Library — Windows Desktop Edition

[![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%2F%2011-blue.svg)](https://microsoft.com)
[![Architecture](https://img.shields.io/badge/Arch-Win32%20C%20%2B%20WebView2-informational.svg)](docs/ARCHITECTURE.md)
[![Size](https://img.shields.io/badge/Executable%20Size-72.5%20KB-success.svg)](docs/TEST_PLAN.md)
[![Memory](https://img.shields.io/badge/Idle%20RAM-18.5%20MB-success.svg)](docs/TEST_PLAN.md)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**My Little Library** is a personal digital library organizer and reader for Windows 10 and 11. It packages a responsive modern web application inside an ultra-lightweight native C host using Win32 and Microsoft WebView2—**completely free of Electron**.

---

## 🌟 Key Features

- **⚡ Ultra-Lightweight & Fast:**
  - Standalone executable size of only **~72.5 KB**.
  - Total portable distribution archive under **0.25 MB**.
  - Idle background memory consumption of just **~18.5 MB RAM** (vs 150MB–300MB in typical Electron apps).
  - Cold startup in **~2.2 seconds**.
- **🔔 Native System Tray Integration:**
  - **Hide-on-Close:** Clicking the window's close button (X) minimizes the application to the notification tray instead of quitting.
  - **Context Menu:** Right-click the tray icon to restore (**Open My Little Library**) or quit (**Exit**).
  - **Quick Restore:** Single-click or double-click the tray icon to bring the window into focus.
- **🔒 Single-Instance Protection:**
  - Uses a Named Mutex to prevent duplicate processes. Launching the executable while running simply restores the existing window.
- **📚 Modern Storage Engine (IndexedDB):**
  - Replaces fragile Base64 `localStorage` with native **IndexedDB**, supporting multi-megabyte PDF and EPUB files without storage quota errors.
  - Automatic background migration for existing library records.
- **📖 100% Offline Reader:**
  - Integrated PDF reader powered by the built-in Chromium engine.
  - Integrated EPUB reader with next/prev page navigation, powered by locally bundled `epub.min.js`.
  - Zero external CDN network dependencies at runtime.
- **🔍 Organization & Discovery:**
  - Live search across title and author.
  - Combined category and reading status filters (*Want to Read*, *Reading*, *Finished*).
  - Visual dashboard with reading metrics, category progress bars, and recent additions.

---

## 📊 Performance Benchmark Comparison

| Metric | My Little Library (Win32 C) | Typical Electron App | Improvement |
|---|---|---|---|
| **Binary Executable Size** | **72.5 KB** | ~120,000 KB | **~1,600x smaller** |
| **Packaged ZIP Distribution** | **0.2 MB (212 KB)** | ~95.0 MB | **~450x smaller** |
| **Idle Memory (Private RAM)** | **18.5 MB** | 150 MB – 250 MB | **~10x less RAM** |
| **Cold Startup Time** | **~2.2 s** | 4.5 s – 8.0 s | **~3x faster** |
| **Background CPU (in Tray)** | **0.0%** | 0.5% – 2.0% | **Completely idle** |

---

## 🚀 Quick Start

### 1. Prerequisites
- **Windows 10** (with WebView2) or **Windows 11** (64-bit).
- Compiler for building from source: **LLVM-MinGW (UCRT)**, Clang, or MSVC.
  ```powershell
  winget install MartinStorsjo.LLVM-MinGW.UCRT
  ```

### 2. Building from Source
Run the automated build script:
```powershell
powershell -ExecutionPolicy Bypass -File scripts\build.ps1
```
The compiled executable and web assets will be ready at `build\bin\MyLittleLibrary.exe`.

### 3. Creating a Portable Distribution
To produce a clean, redistributable ZIP file:
```powershell
powershell -ExecutionPolicy Bypass -File scripts\package.ps1 -Version "2.0.0"
```
The package is generated at `dist\MyLittleLibrary-v2.0.0-win64.zip`.

---

## 📁 Project Structure

```text
littlelibrary/
├── README.md               # Project overview and quick start
├── CHANGELOG.md            # Release version history
├── LICENSE                 # MIT License
├── .gitignore              # Git ignore rules
├── my_little_library_windows_srs.md # Source SRS
├── docs/                   # Full documentation suite
│   ├── SRS.md              # Software Requirements Specification v2.0
│   ├── ARCHITECTURE.md     # Native host, WebView2, and storage architecture
│   ├── BUILD_WINDOWS.md    # Build instructions and toolchain configuration
│   ├── USER_GUIDE.md       # Comprehensive user guide
│   ├── TEST_PLAN.md        # Test execution report and verification matrix
│   ├── DATA_AND_BACKUP.md  # Database schema, backup, and restore guide
│   └── TROUBLESHOOTING.md  # Troubleshooting common errors
├── src/
│   ├── native/             # Pure Win32 C native host
│   │   ├── main.c          # WinMain, Single-instance Mutex, Message Loop
│   │   ├── app_window.c    # Window creation, WM_CLOSE intercept, resizing
│   │   ├── app_window.h
│   │   ├── tray_icon.c     # Shell_NotifyIconW, popup context menu
│   │   ├── tray_icon.h
│   │   ├── webview_host.c  # WebView2 COM host, virtual host mapping
│   │   └── webview_host.h
│   └── web/                # Embedded Web UI
│       ├── index.html      # Layout and modals
│       ├── assets/
│       │   ├── css/style.css
│       │   └── js/
│       │       ├── db.js   # IndexedDB storage engine
│       │       └── script.js # Application logic & reader
│       └── vendor/         # Bundled offline libraries
│           ├── epub.min.js # ePub.js reader engine
│           ├── jszip.min.js
│           └── README.md
├── resources/              # Win32 Application Resources
│   ├── app.ico             # High-resolution application icon
│   ├── app.manifest        # DPI-awareness & common controls manifest
│   └── app.rc              # Resource definition script
├── scripts/                # Automated PowerShell Toolchain
│   ├── setup-sdk.ps1       # Downloads official WebView2 NuGet SDK
│   ├── build.ps1           # Reproducible build script
│   └── package.ps1         # Portable ZIP packaging script
└── tests/                  # QA Verification & Test Fixtures
    ├── manual-test-checklist.md # Manual QA test checklist
    ├── test-lifecycle.ps1  # Automated process & benchmark test
    └── test-data/          # Test PDF and EPUB fixtures
```

---

## 📖 Documentation Index

- [Architecture & Design](docs/ARCHITECTURE.md)
- [Build Guide](docs/BUILD_WINDOWS.md)
- [User Guide](docs/USER_GUIDE.md)
- [Test Plan & Results](docs/TEST_PLAN.md)
- [Data Storage & Backup](docs/DATA_AND_BACKUP.md)
- [Troubleshooting Guide](docs/TROUBLESHOOTING.md)
- [SRS Specification](docs/SRS.md)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
Third-party libraries in `src/web/vendor/` are subject to their respective open-source licenses (see [Vendor README](src/web/vendor/README.md)).
