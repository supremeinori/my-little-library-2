# Troubleshooting Guide

**Application:** My Little Library — Windows Desktop Edition  
**Platform:** Windows 10 & Windows 11  

---

## 1. Startup & Runtime Issues

### Error: "Microsoft WebView2 Runtime was not detected or failed to initialize"
- **Cause:** Your Windows installation lacks the Microsoft Edge WebView2 Evergreen Runtime.
- **Solution:** 
  1. Download the official installer from Microsoft: [WebView2 Evergreen Bootstrapper](https://go.microsoft.com/fwlink/p/?LinkId=2124703).
  2. Run the bootstrapper and allow installation to finish.
  3. Relaunch `MyLittleLibrary.exe`.

### Error: "WebView2Loader.dll could not be loaded"
- **Cause:** `WebView2Loader.dll` is missing from the folder containing `MyLittleLibrary.exe`.
- **Solution:**
  - If building from source, run `scripts\build.ps1` to ensure dependencies are copied.
  - If using a portable zip, ensure you extract all files rather than running `MyLittleLibrary.exe` from inside the compressed zip file.

### Clicking `MyLittleLibrary.exe` does not open a new window
- **Cause:** An instance of My Little Library is already running in the background.
- **Solution:**
  - Look at the Windows notification area (System Tray near the clock). If the tray overflow chevron (`^`) is present, click it.
  - Right-click the My Little Library icon and select **Open My Little Library**, or left-click it to restore the window.

---

## 2. Window & Tray Behavior

### "I clicked the close button (X), but the app didn't quit"
- **Explanation:** This is by design (FR-02). Clicking the close button hides the window to the System Tray so you can quickly reopen it without waiting for a cold start.
- **To quit completely:** Right-click the My Little Library icon in the System Tray and select **Exit**.

### The Tray Icon is missing or hidden
- **Cause:** Windows hides inactive notification icons behind the taskbar chevron (`^`).
- **Solution:**
  1. Click the `^` chevron near the clock on your taskbar.
  2. Drag the My Little Library icon out of the popup box onto the main taskbar so it remains permanently visible.

---

## 3. Reader Issues

### PDF document does not render in the reader
- **Cause:** The PDF file is corrupted or Edge PDF viewer policy is disabled.
- **Solution:**
  - Verify that the PDF opens in another PDF reader.
  - Click the **🔗 Open in tab** button at the top of the reader to open the document directly.

### EPUB document displays "ePub reader library not available"
- **Cause:** `src\web\vendor\epub.min.js` or `jszip.min.js` is missing.
- **Solution:**
  - Verify that `web\vendor\epub.min.js` and `web\vendor\jszip.min.js` exist in your application directory.
  - Run `scripts\build.ps1` to re-deploy all web assets cleanly.

---

## 4. Build & Compilation Issues

### `build.ps1` reports: "No supported C compiler found"
- **Cause:** Clang or MinGW-w64 is not installed or not present in your system PATH.
- **Solution:**
  - Install LLVM-MinGW using winget:
    ```powershell
    winget install MartinStorsjo.LLVM-MinGW.UCRT
    ```
  - Open a new PowerShell window and re-run `scripts\build.ps1`.

### Antivirus False Positives
- **Cause:** Standalone executables compiled with modern MinGW/Clang may occasionally trigger heuristic flags on aggressive antivirus scanners because they are newly compiled and unsigned.
- **Solution:** Add an exclusion for the `build\` or `dist\` folder in Windows Defender or sign the binary with a trusted code-signing certificate.
