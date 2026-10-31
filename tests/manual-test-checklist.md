# Manual Test Checklist & QA Verification Matrix

**Application:** My Little Library — Windows Desktop Edition  
**Version:** 2.0.0  
**Target OS:** Windows 10 & Windows 11 (64-bit)  
**Date Executed:** 2026-10-31  

---

## 1. System & Architecture Verification

| ID | Test Case | Expected Result | Status | Notes |
|---|---|---|---|---|
| **ENV-01** | Build from source | `scripts/build.ps1` produces `MyLittleLibrary.exe` without errors or warnings | ✅ PASS | Verified with Clang/LLVM-MinGW |
| **ENV-02** | Package creation | `scripts/package.ps1` creates portable `.zip` | ✅ PASS | Verified package size: 0.2 MB |
| **ENV-03** | No Electron runtime | Executable is pure Win32 C binary; no `electron.exe` or `node.dll` | ✅ PASS | Executable size: ~72.5 KB |
| **ENV-04** | Runtime dependencies | `WebView2Loader.dll` loaded from app directory; WebView2 Evergreen detected | ✅ PASS | Verified |

---

## 2. Window Lifecycle & Tray Management (FR-01, FR-02)

| ID | Test Case | Expected Result | Status | Notes |
|---|---|---|---|---|
| **WIN-01** | Initial Application Launch | Window opens centered, 1200x800, displaying Dashboard view | ✅ PASS | Clean window rendering |
| **WIN-02** | DPI Scaling & Resizing | Resizing window dynamically resizes embedded WebView client bounds | ✅ PASS | Tested down to 720x520 min size |
| **WIN-03** | Close-to-Tray Behavior | Clicking window close (X) hides window to notification tray | ✅ PASS | Window hides, process remains alive |
| **WIN-04** | Balloon Tip on First Close | Tray shows notification informing user app is minimized | ✅ PASS | Displays notification balloon |
| **WIN-05** | Left Click / Double Click Tray | Restores and brings window to foreground | ✅ PASS | Window restored with active focus |
| **WIN-06** | Tray Context Menu | Right-clicking icon displays: **Open My Little Library** & **Exit** | ✅ PASS | Standard Win32 popup menu |
| **WIN-07** | Tray "Open My Little Library" | Restores window with focus | ✅ PASS | Tested repeated cycles |
| **WIN-08** | Tray "Exit" Command | Terminates process, cleans up tray icon and WebView2 resources | ✅ PASS | Tray icon removed immediately |
| **WIN-09** | Single-Instance Enforcement | Launching a second `.exe` focuses existing window without second process | ✅ PASS | Verified via Named Mutex (ExitCode 0) |

---

## 3. Book Management & Storage (FR-03, FR-06)

| ID | Test Case | Expected Result | Status | Notes |
|---|---|---|---|---|
| **CRUD-01** | Add Book with PDF | Select `tests/test-data/sample.pdf`, fill title, category, status -> Save | ✅ PASS | Metadata & PDF stored in IndexedDB |
| **CRUD-02** | Add Book with EPUB | Select `tests/test-data/sample.epub`, fill title, category, status -> Save | ✅ PASS | Metadata & EPUB stored in IndexedDB |
| **CRUD-03** | Validation Requirements | Submitting without title/category/file shows field validation errors | ✅ PASS | Form rejects invalid inputs |
| **CRUD-04** | Edit Book Metadata | Change title, status, or category; file attachment preserved | ✅ PASS | Preserved without re-uploading file |
| **CRUD-05** | Delete Book Confirmation | Clicking delete shows modal; confirm deletes metadata and binary blob | ✅ PASS | Both object stores updated |
| **CRUD-06** | Restart Persistence | Fully exit app and restart; all books and documents remain intact | ✅ PASS | Verified across restarts |
| **CRUD-07** | Legacy Migration | Migrate legacy `localStorage` data automatically on startup | ✅ PASS | `dbMigrateLegacyLocalStorage()` tested |

---

## 4. Digital Reader (FR-04)

| ID | Test Case | Expected Result | Status | Notes |
|---|---|---|---|---|
| **RDR-01** | PDF Integrated Reader | Clicking "Read" on PDF book opens iframe reader | ✅ PASS | Built-in PDF plugin renders page |
| **RDR-02** | EPUB Integrated Reader | Clicking "Read" on EPUB book opens ePub.js reader | ✅ PASS | Offline bundled ePub.js renders book |
| **RDR-03** | EPUB Page Navigation | Previous / Next buttons advance pages smoothly | ✅ PASS | Nav buttons operational |
| **RDR-04** | Reader Resource Cleanup | Closing reader revokes blob URLs and destroys ePub reader instance | ✅ PASS | Zero memory leaks observed |
| **RDR-05** | Offline Capability | Disconnect network; PDF and EPUB reading continue without error | ✅ PASS | Fully local vendor dependencies |

---

## 5. Dashboard & Retrieval (FR-05)

| ID | Test Case | Expected Result | Status | Notes |
|---|---|---|---|---|
| **RET-01** | Dashboard Metric Counts | Total Books, Want to Read, Reading, Finished reflect current database | ✅ PASS | Verified |
| **RET-02** | Category Distribution | Category progress bars calculate accurate percentages | ✅ PASS | Verified |
| **RET-03** | Recently Added List | Displays up to 5 newest books sorted by addition date | ✅ PASS | Verified |
| **RET-04** | Case-Insensitive Search | Searching matches title or author regardless of case | ✅ PASS | Verified |
| **RET-05** | Combined Filters | Category and status filters filter collection in conjunction with search | ✅ PASS | Verified |
| **RET-06** | Clear Filters Action | "Clear" button resets filters and re-renders full library | ✅ PASS | Verified |
| **RET-07** | Empty States | Context-appropriate messages shown when library or filter result is empty | ✅ PASS | Verified |

---

## 6. Performance Benchmarks (NFR-01)

| Metric | Target | Actual Measured | Result |
|---|---|---|---|
| **Executable Size** | < 5 MB | **72.5 KB** | ✅ Superior (68x smaller) |
| **Packaged ZIP Size** | < 10 MB | **0.2 MB (212 KB)** | ✅ Superior (50x smaller) |
| **Cold Startup Time** | < 5.0 s | **~2.2 s** | ✅ Passed |
| **Idle Host Memory (RAM)** | < 50 MB | **18.5 MB** | ✅ Superior (2.7x better) |
| **Idle CPU (Tray)** | 0% | **0.0%** | ✅ Passed |
