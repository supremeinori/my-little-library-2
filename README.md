# My Little Library

<p align="center">
  <img src="src/web/assets/img/logo.png" width="130" alt="My Little Library Logo" />
</p>

<p align="center">
  <strong>An ultra-lightweight personal digital library and 3D physical flipbook reader for Windows 10 & 11.</strong>
  <br />
  <em>Crafted with native Win32 C, Microsoft WebView2, and an editorial manga ink aesthetic. 100% offline, zero Electron bloat.</em>
</p>

<p align="center">
  <a href="https://github.com/supremeinori/my-little-library-2/raw/main/dist/MyLittleLibrary-Setup-v2.0.0.exe">
    <img src="https://img.shields.io/badge/Download_Installer_(.exe)-v2.0.0_Ready-111111?style=for-the-badge&logo=windows&logoColor=white" alt="Download Windows Installer (.exe)" />
  </a>
  &nbsp;
  <a href="https://github.com/supremeinori/my-little-library-2/raw/main/dist/MyLittleLibrary-v2.0.0-win64.zip">
    <img src="https://img.shields.io/badge/Download_Portable_(.zip)-2.1_MB-555555?style=for-the-badge&logo=archive&logoColor=white" alt="Download Portable ZIP" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Windows_10_%2F_11-black.svg" alt="Platform" />
  <img src="https://img.shields.io/badge/Host-Win32_C_%2B_WebView2-black.svg" alt="Architecture" />
  <img src="https://img.shields.io/badge/Native_Binary-94_KB-success.svg" alt="Binary Size" />
  <img src="https://img.shields.io/badge/Idle_Memory-~19_MB_RAM-success.svg" alt="Memory" />
  <img src="https://img.shields.io/badge/Offline-100%25_Zero_CDN-informational.svg" alt="Offline" />
  <img src="https://img.shields.io/badge/License-MIT-gray.svg" alt="License" />
</p>

---

## 📖 Overview

**My Little Library** is a standalone, editorial reading ledger and personal book archive. Designed for readers who want complete ownership over their documents, it runs fully offline with no cloud tracking, no telemetries, and zero Electron overhead.

Whether organizing academic monographs, classic literature, manga, or technical papers, My Little Library presents your collection through **3D hardcover book objects**, **manga-style ink cross-hatching shadows**, and an authentic **physical page-turn 3D flipbook reader**.

---

## ✨ Key Features

### 📚 Realistic 3D Physical Flipbook Engine
- **Turn-Page Simulation:** Double-page book spread with authentic physics, dynamic spine shadows, and corner-dragging page turns.
- **Full Zoom & Pan:** Smooth zoom in, zoom out, reset, and click-and-drag panning.
- **Dual Reader Modes:** Switch between realistic **Book Spread** and continuous **Standard View** with one click.
- **100% Offline PDF & EPUB:** Powered by offline `pdf.js`, `page-flip.js`, and `epub.min.js`.

### ✒️ Signature Manga Ink Aesthetics
- **Manga Screen-Tone Shadows:** Drop shadows rendered with tactile 45° cross-hatching and crisp pen outlines.
- **Adaptive Contrast Inversion:** Ink strokes dynamically adapt between rich charcoal/black on paper (Light Mode) and radiant silver/white on inked dark paper (Dark Mode).
- **Procedural Hardcover Covers:** Books without cover art automatically render procedural engraved hardcover boards with spine depth.
- **Custom Artwork Support:** Upload custom cover artwork anytime with live preview.

### 🧭 Floating Pill Dock Navigation
- **No Cluttered Sidebars:** Replaces rigid sidebar panels with a clean, centered bottom floating pill dock.
- **Quick Switching:** Effortlessly toggle between **Overview** (reading metrics & focus desk) and **All Books** (catalog & search).
- **Auto-Concealment:** Dock intelligently disappears during reading mode so reading controls are never obstructed.

### ⚡ Blazing Fast Native Performance
- **Win32 C Host:** Pure Win32 API and WebView2 host compiling to a tiny **94 KB** executable.
- **Minimal RAM Footprint:** Consumes only **~19 MB RAM** in background idle (vs 150–300 MB in Electron alternatives).
- **System Tray Integration:** Hide-on-close to the Windows system tray with right-click restore and single-instance Named Mutex protection.
- **IndexedDB Storage:** Stores hundreds of PDF and EPUB files locally inside modern browser storage with no storage quota bottlenecks.

---

## 🚀 Quick Download & Installation

### Option 1: 1-Click Windows Installer (Recommended)
1. Download **[MyLittleLibrary-Setup-v2.0.0.exe](https://github.com/supremeinori/my-little-library-2/raw/main/dist/MyLittleLibrary-Setup-v2.0.0.exe)**.
2. Run the setup executable.
3. The wizard installs the app, creates Desktop and Start Menu shortcuts with the official Ink Book icon, and registers a clean uninstaller in Windows Settings.

### Option 2: Portable Archive (.zip)
1. Download **[MyLittleLibrary-v2.0.0-win64.zip](https://github.com/supremeinori/my-little-library-2/raw/main/dist/MyLittleLibrary-v2.0.0-win64.zip)**.
2. Extract the folder anywhere.
3. Run `MyLittleLibrary.exe` directly (no administrator privileges required).

---

## 🛠️ Building from Source

### Prerequisites
- Windows 10 (1809+) or Windows 11
- Clang / LLVM-MinGW (or MSVC)
- Windows SDK / WebView2 SDK (headers already bundled in `deps/`)
- Inno Setup 6 (optional, for compiling the `.exe` installer)

### Quick Build Commands
```powershell
# 1. Compile the native executable and assemble web assets
.\scripts\build.ps1

# 2. Run lifecycle startup and mutex test
.\tests\test-lifecycle.ps1

# 3. Create Desktop shortcut with the ink book icon
.\scripts\create-shortcut.ps1

# 4. Compile the Windows Installer (.exe)
.\scripts\build-installer.ps1

# 5. Create the standalone portable ZIP package
.\scripts\package.ps1
```

---

## 📚 Documentation

Detailed documentation is available in the [`docs/`](docs/) directory:

- 📖 **[User Guide](docs/USER_GUIDE.md)**: Cataloging books, custom artwork, 3D flipbook reading controls, and tray operation.
- 🏗️ **[Architecture & System Design](docs/ARCHITECTURE.md)**: Win32 C host, Microsoft WebView2 COM architecture, single-instance named mutex, and process lifecycle.
- ⚙️ **[Windows Build Guide](docs/BUILD_WINDOWS.md)**: Toolchain requirements, compiling with Clang/LLVM-MinGW, and Inno Setup 6 installer creation.
- 💾 **[Data Storage & Backup Guide](docs/DATA_AND_BACKUP.md)**: IndexedDB LevelDB schema, `%LOCALAPPDATA%` physical storage paths, and migration procedures.
- 🔧 **[Troubleshooting Guide](docs/TROUBLESHOOTING.md)**: Solutions for WebView2 runtime detection, background tray behavior, and flipbook rendering.
- 📋 **[Software Requirements Specification (SRS)](docs/SRS.md)**: Complete functional (FR) and non-functional (NFR) requirements breakdown.
- 🧪 **[Test Plan & Quality Assurance](docs/TEST_PLAN.md)**: Lifecycle test procedures, verification matrices, and automated test scripts.

---

## 📂 Project Structure

```
littlelibrary/
├── dist/
│   ├── MyLittleLibrary-Setup-v2.0.0.exe  # Standalone Windows Installer
│   └── MyLittleLibrary-v2.0.0-win64.zip  # Portable release package
├── installer/
│   └── MyLittleLibrary.iss               # Inno Setup 6 compilation script
├── resources/
│   ├── app.ico                           # Multi-res (16-256px) Ink Book icon
│   ├── app.rc                            # Windows native resource script
│   └── app.manifest                      # Per-Monitor V2 DPI & Win10/11 manifest
├── src/
│   ├── native/                           # Win32 C host (WebView2, tray, mutex)
│   └── web/                              # UI layer (HTML, CSS, JS, offline vendors)
│       └── assets/
│           ├── fonts/                    # Offline Open Sans WOFF2
│           └── img/logo.png              # Dynamic Ink Sketch brand logo
├── scripts/                              # Automated build, test, and package scripts
└── docs/                                 # Architectural & user documentation
```

---

## 📄 License
Released under the [MIT License](LICENSE).
