# User Guide: My Little Library — Windows Desktop Edition

**Version:** 2.2.1  
**Platform:** Windows 10 & Windows 11  

---

## 1. Introduction

**My Little Library** is a personal digital library organizer and 3D physical flipbook reader for Windows. It lets you catalog, search, and preserve your books and documents offline in an editorial environment inspired by classical engraving and manga ink aesthetics.

---

## 2. Installation & Getting Started

### Installation
- **Setup Wizard (.exe):** Run `MyLittleLibrary-Setup-v2.2.1.exe`. The installer will install the application, create Start Menu and Desktop shortcuts with the official Ink Book icon, and register an uninstaller in Windows Settings.
- **Portable ZIP:** Extract `MyLittleLibrary-v2.2.1-win64.zip` anywhere and launch `MyLittleLibrary.exe` directly.

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
  - When zoomed in, hold `Ctrl` and drag with the mouse to pan across the pages.
- **Standard View Mode:** Switch to continuous vertical scroll anytime using the top mode toggle.
- **Separate Window:** Open the document in a dedicated browser window.

### EPUB Books
- EPUBs open with paginated chapters and next/previous page overlay controls.

### 🔄 Resume Reading (Automatic Progress Tracking)
- **Automatic Position Persistence:** Every page turn in PDF (page number) and EPUB (CFI location) is automatically saved to local IndexedDB with lightweight debouncing.
- **Library Progress Indicators:** Book cards display live reading progress percentage bars and page counters (e.g. `Page 15 of 240 (6%)`).
- **1-Click Resume:** Resumable books feature a dedicated **Resume** action button that jumps directly back to your exact last-read location.
- **Reading Desk Integration:** Books in active progress appear in the Overview Focus Desk with current reading metrics.

### 🧘 Default Focus Mode & Edge Eye Toggle
- **Zero-Distraction Reading by Default:** Opening any book immediately engages Focus Mode. Bilah kontrol (*topbar* dan *toolbar*) tersembunyi secara otomatis saat membaca.
- **No Unwanted Mouse Interruptions:** Menggerakkan kursor di layar **tidak akan** memunculkan tombol kembali, menjaga fokus membaca 100%.
- **Manual Edge Eye Toggle (`👁️`):** Klik tombol mata kecil di tepi kiri atas pembaca (atau tekan tombol `F` pada keyboard) kapan saja untuk menampilkan atau menyembunyikan bilah kontrol.
- **Zero Overlap:** Bilah kontrol memiliki indentasi khusus sehingga tidak pernah bertabrakan atau menutupi tombol mata.

---

## 5. 🤖 Integrated Multi-AI Companion

Bahas dan tanyakan isi buku langsung saat membaca tanpa perlu membuka browser luar:

- **Buka / Tutup AI Companion:** Klik tombol **AI Companion** di bilah pembaca atau tekan pintasan `Alt + A`.
- **Multi-Provider Dropdown:** Pilih asisten AI favoritmu melalui dropdown di bilah atas:
  - ♊ **Google Gemini**
  - 🟢 **OpenAI ChatGPT**
  - 🟣 **Anthropic Claude**
  - 🔍 **Perplexity AI**
- **Non-Overlapping Split Layout:** Tampilan buku di sebelah kiri dan AI di sebelah kanan berjalan berdampingan tanpa saling menimpa.
- **Workflow Snipping Screenshot:**
  1. Temukan bagian teks, grafik, atau rumus matematika yang sulit dipahami.
  2. Tekan `Win + Shift + S` untuk mengambil screenshot area buku.
  3. Klik kolom chat AI dan tekan `Ctrl + V` untuk menempelkan gambar lalu ajukan pertanyaanmu!
- **Sesi Login Tersimpan:** Semua login akun (Google, OpenAI, Claude) tersimpan secara permanen di profil native WebView2 lokal.

---

## 6. ⌨️ Keyboard & Navigation Shortcuts

Klik tombol **Shortcuts** di bilah kontrol pembaca untuk membuka kartu ringkasan shortcut lengkap:

| Kategori | Shortcut | Fungsi |
|---|---|---|
| **Navigasi Membaca** | `→` / `Page Down` / Klik Kanan | Halaman berikutnya / Balik maju |
| | `←` / `Page Up` / Klik Kiri | Halaman sebelumnya / Balik mundur |
| | `Space` / `Shift + Space` | Balik halaman maju / mundur |
| | `Ctrl` + Scroll Mouse | Zoom In / Zoom Out |
| | `Ctrl` + Klik & Geser | Pan / Geser kanvas saat zoom |
| | `Esc` | Tutup pembaca buku |
| **AI Companion** | `Alt + A` | Buka / Tutup panel samping AI Companion |
| | `Win + Shift + S` | Screenshot cuplikan buku via Windows Snipping Tool |
| | `Ctrl + V` | Tempel screenshot langsung ke chat AI |
| **Tampilan & Kontrol** | Tombol Mata (`👁️`) / `F` | Tampilkan atau sembunyikan bilah kontrol reader |

---

## 7. System Tray & Background Operation

- **Hide-on-Close:** Clicking the window's close button (`X`) minimizes the application to the Windows notification tray instead of terminating.
- **Restore:** Double-click or single-click the tray icon to bring the window back into focus.
- **Context Menu:** Right-click the tray icon to select **Open My Little Library** or **Exit**.
- **Single-Instance:** Launching a second instance automatically activates and brings the running window to the foreground.

---

## 8. Checking for Software Updates & Seamless Auto-Updater

- **About & Updates Dialog:** Click the **ⓘ** button in the bottom floating dock or click the **My Little Library** logo in the top header.
- **1-Click GitHub Verification:** Click **Check for Updates** to automatically query the official GitHub Releases API.
- **Seamless Auto-Updater:** Jika ada versi baru (misal `v2.2.1`), klik **Update Sekarang & Restart**. Aplikasi akan mengunduh paket instalasi di latar belakang, menjalankan instalasi secara senyap (*silent update*), dan me-restart aplikasi ke versi terbaru tanpa menghilangkan data buku sama sekali!
- **Safe In-Place Upgrades:** Seluruh file buku, cover art, dan progress membaca tersimpan aman di database lokal `%LOCALAPPDATA%\MyLittleLibrary\WebView2Data`.
