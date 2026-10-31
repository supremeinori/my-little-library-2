# Changelog

All notable changes to **My Little Library** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] — 2026-10-31

### Added
- **Native Windows Host (Win32 C):** Lightweight native shell compiled with Win32 APIs, replacing the need for Electron.
- **System Tray Integration:** Notification-area icon supporting left-click restore and right-click context menu (**Open My Little Library**, **Exit**).
- **Hide-on-Close Behavior:** Intercepted `WM_CLOSE` to minimize application to tray instead of terminating process, accompanied by a helpful first-close notification balloon.
- **Single-Instance Enforcement:** Process synchronization using Named Mutex (`Global\MyLittleLibrary_SingleInstance_Mutex_v2`) to focus existing instance rather than launching duplicates.
- **Per-Monitor V2 DPI Awareness:** Native manifest configuration for crisp rendering on high-DPI and scaled displays.
- **IndexedDB Storage Engine:** Migrated persistence from `localStorage` to IndexedDB (`MyLittleLibraryDB`), allowing large PDF and EPUB attachments to be stored as binary `Blob` objects without quota issues.
- **Automatic Legacy Data Migration:** Background detection and migration of legacy browser `localStorage` records into IndexedDB.
- **Offline Reader Bundling:** Bundled `epub.min.js` and `jszip.min.js` locally in `src/web/vendor/`, eliminating runtime CDN dependencies.
- **Automated Toolchain Scripts:**
  - `scripts/setup-sdk.ps1`: Automated WebView2 SDK download from NuGet.
  - `scripts/build.ps1`: Automated compilation and asset deployment.
  - `scripts/package.ps1`: Standalone portable ZIP package creation.
- **Comprehensive Documentation Suite:**
  - `docs/SRS.md`: Approved requirements specification v2.0.
  - `docs/ARCHITECTURE.md`: Detailed native host, WebView2, and storage architecture.
  - `docs/BUILD_WINDOWS.md`: Prerequisites and reproducible build guide.
  - `docs/USER_GUIDE.md`: End-user guide for library and tray management.
  - `docs/TEST_PLAN.md`: Verification matrix and execution log.
  - `docs/DATA_AND_BACKUP.md`: Database structure and backup instructions.
  - `docs/TROUBLESHOOTING.md`: Common issues and resolution steps.

### Changed
- Refactored `script.js` to asynchronously interact with IndexedDB.
- Replaced Base64 upload limits with native blob streaming and progress indicators.
- Memory management: reader now explicitly revokes Blob URLs and destroys rendition instances upon closing.

---

## [1.0.0] — 2026-10-31

### Added
- Initial browser-based SPA MVP for personal book organizing.
- Dashboard with summary counts and category distribution bars.
- Book catalog grid with search and combined category/status filters.
- File attachment support for PDF and EPUB documents.
- Basic localStorage persistence.
