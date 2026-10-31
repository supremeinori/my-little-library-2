# Data Storage, Backup, and Migration Guide

**Application:** My Little Library — Windows Desktop Edition  
**Database Engine:** IndexedDB (Chromium LevelDB Engine)  

---

## 1. Physical Data Location

My Little Library stores all user metadata and document files locally on your machine. User data is isolated to the standard Windows application data directory:

```text
%LOCALAPPDATA%\MyLittleLibrary\WebView2Data\
```

Typically resolving to:
```text
C:\Users\<YourUsername>\AppData\Local\MyLittleLibrary\WebView2Data\
```

Within this folder, IndexedDB stores book records and document blobs inside:
```text
%LOCALAPPDATA%\MyLittleLibrary\WebView2Data\Default\IndexedDB\https_app.assets_0.indexeddb\
```

---

## 2. Database Schema

The database is named **`MyLittleLibraryDB`** (version 1) and consists of two primary Object Stores:

### 2.1 Object Store: `books`
Stores the metadata for every book in the library.
- **Key:** `id` (String, e.g. `"book-m2a8k7-9d2f1"`)
- **Indexes:**
  - `category` (String)
  - `status` (String)
  - `addedAt` (ISO 8601 String)
- **Record Structure:**
  ```json
  {
    "id": "book-m2a8k7-9d2f1",
    "title": "Clean Architecture",
    "author": "Robert C. Martin",
    "category": "Technology",
    "status": "Reading",
    "notes": "Key principles of software structure and design.",
    "fileType": "pdf",
    "fileName": "clean_architecture.pdf",
    "fileSize": 4194304,
    "createdAt": "2026-10-31T04:20:00.000Z",
    "updatedAt": "2026-10-31T04:25:00.000Z"
  }
  ```

### 2.2 Object Store: `files`
Stores the raw binary payloads for PDF and EPUB attachments.
- **Key:** `bookId` (String, matching `id` in `books`)
- **Record Structure:**
  ```javascript
  {
    bookId: "book-m2a8k7-9d2f1",
    blob: Blob, // Raw binary Blob
    fileType: "pdf",
    fileName: "clean_architecture.pdf",
    fileSize: 4194304,
    savedAt: "2026-10-31T04:20:00.000Z"
  }
  ```

---

## 3. Migration from Legacy Browser Data (`localStorage`)

The original browser SPA stored book records and document Base64 strings in `localStorage`. 

In the Windows Desktop Edition:
1. At application launch, `dbMigrateLegacyLocalStorage()` automatically checks if `myLittleLibrary_books` and `myLittleLibrary_files` exist in `localStorage`.
2. If found, all records are parsed.
3. Large Base64 file strings are converted directly into binary `Blob` objects and persisted to IndexedDB.
4. Legacy entries are removed from `localStorage`, freeing up browser quota and preventing memory leaks.
5. Migration is non-destructive: if an error occurs during migration, existing data is preserved.

---

## 4. Backup & Restore Procedures

### 4.1 Complete Directory Backup (Recommended)
To backup your entire library, including all books, reading statuses, and uploaded PDF/EPUB documents:

1. Close My Little Library completely via tray icon -> **Exit**.
2. Press `Win + R`, type `%LOCALAPPDATA%`, and press Enter.
3. Locate the folder named `MyLittleLibrary`.
4. Copy `MyLittleLibrary` to your backup drive or cloud storage.

### 4.2 Restoring from Backup
1. Ensure My Little Library is not running.
2. Copy your saved `MyLittleLibrary` folder into `%LOCALAPPDATA%\`.
3. Start `MyLittleLibrary.exe`. Your complete collection and documents will be available immediately.

---

## 5. Storage Quotas & Limits

Unlike `localStorage` (which is capped at 5MB–10MB), IndexedDB in WebView2 can utilize up to **60% of available free disk space**. You can comfortably store hundreds of PDF and EPUB books without running into storage limits.
