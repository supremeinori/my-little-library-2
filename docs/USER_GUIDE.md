# User Guide: My Little Library — Windows Desktop Edition

**Version:** 2.0.0  
**Platform:** Windows 10 & Windows 11  

---

## 1. Introduction

**My Little Library** is a personal digital library organizer and 3D physical flipbook reader for Windows. It lets you catalog, search, and preserve your books and documents offline in an editorial environment inspired by classical engraving and manga ink aesthetics.

---

## 2. Installation & Getting Started

### Installation
- **Setup Wizard (.exe):** Run `MyLittleLibrary-Setup-v2.0.0.exe`. The installer will install the application, create Start Menu and Desktop shortcuts with the official Ink Book icon, and register an uninstaller in Windows Settings.
- **Portable ZIP:** Extract `MyLittleLibrary-v2.0.0-win64.zip` anywhere and launch `MyLittleLibrary.exe` directly.

### Understanding the Interface
- **Top Header:**
  - Displays the **Dynamic Ink Sketch** logo and title mark.
  - Quick **+ Add Book** button.
- **Floating Bottom Dock:**
  - **Overview:** Visual dashboard with reading metrics (Total, In Progress, Completed, To Read), Currently Reading desk, and subject breakdown.
  - **All Books:** Complete collection catalog with live search, subject filters, and status filters.
  - **+ (Action):** Quick add book modal.
  - **Theme Toggle:** Switch between high-contrast Light Mode (warm paper) and Dark Mode (inked paper).
  - *Note:* The dock automatically hides when opening a book in Reader mode to ensure controls remain completely unobstructed.

---

## 3. Adding and Managing Books

### Adding a Book
1. Click any **+ Add Book** button (Header or Bottom Dock).
2. **Document Attachment:** Drag and drop a `.pdf` or `.epub` document into the drop zone, or click to browse.
3. **Cover Artwork (Optional):** Attach an image (`.jpg`, `.png`, `.webp`) as custom cover art. If left blank, a procedural hardcover with spine depth and engraving borders is automatically generated.
4. **Book Information:**
   - **Title (Required):** Automatically filled from the file name if blank.
   - **Author (Optional):** Author or translator name.
   - **Category (Optional):** Defaults to `Any`.
   - **Status (Optional):** Defaults to `New` (options: `New`, `Want to Read`, `Reading`, `Finished`).
   - **Personal Notes (Optional):** Reading thoughts, shelf locations, or quotes.
5. Click **Save Book**. The file is stored in local IndexedDB storage.

### Editing & Custom Covers
- Click the **Artwork Icon** on any book card to quickly upload or change its cover image.
- Click the **Pencil Icon** to update metadata or notes.
- Click the **Trash Icon** to permanently remove a book and its stored document.

---

## 4. Reading Books (3D Physical Flipbook Engine)

Click **Read** or click on any 3D hardcover book object to launch the integrated reader:

### PDF Books (Realistic Turn-Page Flipbook)
- **Book Spread Mode:** Displays a double-page spread with authentic physical page curling and spine shading.
  - Turn pages by clicking **Next >** / **< Prev**, pressing arrow keys (`←` / `→`), or dragging the page corners with your mouse.
- **Zoom & Pan:**
  - Click **+** or **-** on the floating bottom bar, or use `Ctrl + MouseWheel` to zoom in/out.
  - When zoomed in, click and drag with the mouse to pan across the pages. Click the percentage button to reset to 100%.
- **Standard View Mode:** Switch to continuous vertical scroll anytime using the top mode toggle.
- **Separate Window:** Open the document in a dedicated browser window.

### EPUB Books
- EPUBs open with paginated chapters and next/previous page overlay controls.

---

## 5. System Tray & Background Operation

- **Hide-on-Close:** Clicking the window's close button (`X`) minimizes the application to the Windows notification tray instead of terminating.
- **Restore:** Double-click or single-click the tray icon to bring the window back into focus.
- **Context Menu:** Right-click the tray icon to select **Open My Little Library** or **Exit**.
- **Single-Instance:** Launching a second instance automatically activates and brings the running window to the foreground.
