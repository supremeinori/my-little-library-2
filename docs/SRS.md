# My Little Library — Windows Desktop Edition
## Software Requirements Specification (SRS)

**Version:** 2.0  
**Status:** Proposed target specification  
**Platform:** Windows 10/11

## 1. Overview

My Little Library is a personal library and digital reader for managing book metadata and reading PDF/EPUB files. The current application is a browser-based SPA. This version proposes a lightweight Windows desktop application that reuses the existing web interface where practical and adds native Windows window and notification-area (system tray) behavior.

The key behavior is: clicking the main window's close button hides the app to the tray instead of terminating it. The tray icon can restore the window, while an explicit **Exit** command terminates the application.

## 2. Objectives

- Package the current application as a Windows desktop app.
- Minimize to the Windows notification area when the main window is closed.
- Restore and focus the existing window from the tray.
- Provide an explicit tray-menu Exit command.
- Preserve book management, search, filters, dashboard, and PDF/EPUB reading.
- Keep startup time, idle CPU/memory use, dependencies, and packaged size low.
- Provide a clear project structure and accurate build, usage, architecture, testing, and troubleshooting documentation.

## 3. Scope

### In scope
- Native Windows application window.
- System-tray icon and context menu.
- Hide-to-tray on close.
- Restore/focus via tray icon or **Open My Little Library**.
- **Exit** command that fully shuts down the process and cleans up resources.
- Existing library features: dashboard metrics, category distribution, recently added books, book CRUD, PDF/EPUB attachments and reader, search, combined category/status filters, validation, empty states, and local persistence.
- Build scripts and project documentation.
- Review of current file storage so large documents are not stored as Base64 strings in `localStorage`.

### Out of scope for the first desktop release
- Accounts, authentication, backend, cloud sync, or online metadata lookup.
- Automatic launch with Windows.
- Embedded AI features.
- DRM removal.
- Full native rewrite of the web interface.

## 4. Functional Requirements

### FR-01 — Desktop Window
- Launch as a resizable Windows desktop window.
- Display the existing My Little Library interface.
- Restore and focus the existing window when requested from the tray.
- Avoid duplicate app instances where practical.

### FR-02 — Tray Behavior
- Clicking the window close button hides the window instead of terminating the process.
- The tray menu includes **Open My Little Library** and **Exit**.
- Activating **Open My Little Library** shows, restores, and focuses the window.
- Activating **Exit** terminates the process and cleans up the tray icon, window, WebView, and other owned resources.
- Repeated hide/restore cycles must not create duplicate windows.
- Document the close-to-tray behavior so users understand that closing the window does not exit the app.

### FR-03 — Book Management
- Add, edit, and delete books.
- New books require a title, category, reading status, and a valid PDF or EPUB file, consistent with the existing specification.
- Author and notes remain optional.
- Editing metadata preserves the attached file.
- Deletion requires confirmation and removes the book record and its associated file data.

### FR-04 — Reader
- Support PDF and EPUB documents.
- PDF opens in the integrated reader.
- EPUB opens in the integrated reader with previous/next navigation.
- Reject unsupported formats with a useful error message.
- Release reader resources when the reader closes.
- Verify reader compatibility in the packaged desktop environment.

### FR-05 — Dashboard and Retrieval
- Dashboard metrics, category distribution, and recently added books reflect current data.
- Search matches title and author without case sensitivity.
- Category and status filters work together with search.
- Provide a clear-filters action and context-specific empty states.

### FR-06 — Local Data
- Book metadata and document files persist across application restarts.
- Do not use browser `localStorage` as the primary store for large document files.
- Prefer IndexedDB for a low-disruption web-side migration, or use a documented local file store if exposed through a carefully limited native bridge.
- Catch storage failures and communicate them without silently losing existing data.
- Document data location, backup/restore, and migration behavior.
- Inspect the current app before planning migration; do not assume existing browser data automatically appears in the desktop app.

## 5. Non-Functional Requirements

### NFR-01 — Lightweight Design
- Do not use Electron.
- Prefer a small native Windows host written in C using Win32 APIs.
- Reuse the current HTML/CSS/JavaScript UI through Microsoft WebView2 where practical instead of rewriting the UI.
- Avoid unnecessary background polling, heavy animation, telemetry, and dependencies.
- Load reader resources only when needed.
- When hidden in the tray, the app should remain idle without unnecessary CPU activity.
- Measure startup time, idle memory usage, and packaged size during testing; do not make unverified performance claims.

### NFR-02 — Compatibility
- Target Windows 10 and Windows 11, subject to the selected compiler and WebView2 support.
- Document WebView2 Runtime requirements and installation/verification steps.

### NFR-03 — Reliability and Security
- Hiding the window must not discard saved data or unsaved changes.
- Clean up the tray icon and native/WebView resources on Exit.
- Validate file types and treat titles, authors, and notes as user-supplied content.
- Do not execute uploaded documents as code.
- Keep any native-to-web bridge minimal and limited to required operations.

## 6. Proposed Technical Architecture

- **Native host:** C with Win32 API for the application window, tray icon, tray menu, process lifecycle, and single-instance behavior where practical.
- **Embedded interface:** Existing HTML, CSS, and vanilla JavaScript hosted in Microsoft WebView2.
- **Reader:** Preserve the existing PDF/EPUB implementation initially, then verify it works in WebView2. Bundle required EPUB assets locally if licensing permits rather than depending on a public CDN at runtime.
- **Storage:** Prefer IndexedDB for the least disruptive web-side improvement, or a local native file store if needed. Avoid Base64 document payloads in `localStorage`.
- **Backend:** None. User data stays on the local machine.

This approach adds a native Windows shell and tray integration without the Electron runtime. WebView2 runtime availability and packaging must be validated. This SRS describes the target, not an already completed migration.

## 7. Proposed Folder Structure

```text
my-little-library/
├── README.md
├── CHANGELOG.md
├── LICENSE
├── .gitignore
├── docs/
│   ├── SRS.md
│   ├── ARCHITECTURE.md
│   ├── BUILD_WINDOWS.md
│   ├── USER_GUIDE.md
│   ├── TEST_PLAN.md
│   ├── DATA_AND_BACKUP.md
│   └── TROUBLESHOOTING.md
├── src/
│   ├── native/
│   │   ├── main.c
│   │   ├── app_window.c
│   │   ├── app_window.h
│   │   ├── tray_icon.c
│   │   ├── tray_icon.h
│   │   ├── webview_host.c
│   │   └── webview_host.h
│   └── web/
│       ├── index.html
│       ├── assets/
│       │   ├── css/style.css
│       │   ├── js/script.js
│       │   └── icons/
│       └── vendor/README.md
├── resources/
│   ├── app.ico
│   └── app.rc
├── tests/
│   ├── manual-test-checklist.md
│   └── test-data/
├── scripts/
│   ├── build.ps1
│   └── package.ps1
└── build/                 # generated output; do not commit
```

Adapt this tree after inspecting the existing repository. Do not create empty files just to match the tree; every file must serve a real purpose. Check third-party licenses before bundling dependencies.

## 8. Documentation Deliverables

- **README.md:** overview, features, prerequisites, quick start, links to docs.
- **docs/SRS.md:** approved requirements and scope.
- **docs/ARCHITECTURE.md:** native host, WebView2, reader, storage, and app lifecycle.
- **docs/BUILD_WINDOWS.md:** compiler/SDK prerequisites and reproducible build steps.
- **docs/USER_GUIDE.md:** add/edit/delete books, read documents, minimize to tray, restore, and exit.
- **docs/TEST_PLAN.md:** test cases and actual results.
- **docs/DATA_AND_BACKUP.md:** data location, backup/restore, and migration notes.
- **docs/TROUBLESHOOTING.md:** startup, WebView2, reader, storage, and tray issues.
- **CHANGELOG.md:** versioned user-visible changes.
- **.gitignore:** generated binaries, build output, temporary files, and local IDE settings.

Documentation must describe the actual implementation. Do not claim tests or builds passed unless they were performed.

## 9. Acceptance Criteria

1. The application launches in a Windows desktop window.
2. The existing library interface loads in that window.
3. Clicking the close button hides the window and leaves the tray icon available.
4. The tray menu contains **Open My Little Library** and **Exit**.
5. **Open My Little Library** restores and focuses the existing window.
6. **Exit** terminates the app and removes the tray icon.
7. Repeated hide/restore cycles do not create duplicate windows.
8. Book CRUD, dashboard, search, filters, PDF reading, and EPUB reading continue to work.
9. Metadata and attachments remain available after a full application restart.
10. Storage errors are reported without silently corrupting existing data.
11. The repository includes useful source organization, build scripts, and accurate documentation.
12. No Electron runtime is included.
13. Startup time, idle memory, and packaged size are measured and recorded.

## 10. Risks and Decisions to Validate

- **WebView2:** verify whether the target Windows systems have the runtime and document installation or packaging.
- **PDF:** verify embedded PDF rendering in the packaged environment.
- **EPUB:** ensure the EPUB library and assets load reliably without depending on a public CDN at runtime.
- **Data migration:** current records may live in the browser's `localStorage`; decide whether an explicit export/import path is needed.
- **Storage limits:** avoid storing large Base64 documents in `localStorage`.
- **Close behavior:** users may expect the close button to terminate the app; make the tray behavior clear and provide an explicit Exit command.
- **C and UI:** use C for the native shell and tray integration while retaining the existing web UI in WebView2. A full native rewrite is not required for the first release.

## 11. Implementation Plan

1. Inspect the existing source project, dependencies, and data format.
2. Confirm the WebView2 SDK/runtime approach and build environment.
3. Create the native C host and main window.
4. Implement the tray icon, context menu, hide-on-close, restore, and Exit behavior.
5. Load the existing web interface in WebView2.
6. Verify PDF and EPUB reading in the packaged app.
7. Improve file storage and plan data migration.
8. Add reproducible build/package scripts and documentation.
9. Test CRUD, reading, persistence, tray lifecycle, and resource cleanup.
10. Measure performance and package a testable Windows build.

**Status:** Proposed target specification. Finalize after inspecting the current source project and validating the technical approach.
