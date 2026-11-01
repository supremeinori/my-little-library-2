/**
 * My Little Library â€” script.js
 * Editorial black & white desktop edition with realistic physical book objects,
 * IndexedDB persistence, custom cover art support, and offline reader.
 */

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Constants
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const CATEGORIES = ['Any', 'Psychology', 'Philosophy', 'Literature', 'Cinema', 'Technology', 'Other'];

const STATUS_CLASS = {
  'New':          'badge-status-new',
  'Want to Read': 'badge-status-want',
  'Reading':      'badge-status-reading',
  'Finished':     'badge-status-finished',
};

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   State
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
let books               = [];   // array of book metadata objects
let editingId           = null;
let pendingDeleteId     = null;
let currentView         = 'dashboard';
let pendingFile         = null; // { file, type, name, size }
let pendingCoverData    = null; // Base64 dataURL or null
let quickCoverTargetId  = null; // book ID for quick cover file selection
let currentEpub         = null; // epub.js Book instance
let currentRendition    = null;
let activeBlobUrl       = null;

// PDF Flipbook & Reader State
let currentPdfDoc       = null;
let currentFlipInstance = null;
let renderedPdfPages    = new Set();
let currentReaderBook   = null;
let currentReaderBlob   = null;
let pdfReaderMode       = 'flip'; // 'flip' or 'scroll'
let currentZoom         = 1.0;
const MIN_ZOOM          = 0.5;
const MAX_ZOOM          = 2.5;
const ZOOM_STEP         = 0.15;

// Reading Progress & Focus Controls State
let progressSaveTimer   = null;
let isControlsVisible   = false; // Default: hidden in Focus Mode

// AI Companion State
let isAiSidebarOpen     = false;
let currentAiProvider   = 'gemini';
const AI_PROVIDERS = {
  gemini: {
    name: 'Gemini',
    url: 'https://gemini.google.com/app'
  },
  chatgpt: {
    name: 'ChatGPT',
    url: 'https://chatgpt.com'
  },
  claude: {
    name: 'Claude',
    url: 'https://claude.ai'
  },
  perplexity: {
    name: 'Perplexity',
    url: 'https://www.perplexity.ai'
  }
};

// Application Version & Update State
const CURRENT_APP_VERSION = 'v2.2.1';
const GITHUB_REPO = 'supremeinori/my-little-library-2';
let isCheckingUpdate = false;

/**
 * Efficiently persists reading progress to in-memory state and IndexedDB with debounce.
 * @param {Object} progressData 
 * @param {boolean} immediate 
 */
function saveReadingProgressDebounced(progressData, immediate = false) {
  if (!currentReaderBook) return;

  // Immediately synchronize in-memory book instances
  Object.assign(currentReaderBook, progressData);
  const cachedBook = books.find(b => b.id === currentReaderBook.id);
  if (cachedBook) {
    Object.assign(cachedBook, progressData);
  }

  const bookId = currentReaderBook.id;
  const dataToPersist = { ...progressData };

  if (immediate) {
    if (progressSaveTimer) {
      clearTimeout(progressSaveTimer);
      progressSaveTimer = null;
    }
    dbUpdateBookProgress(bookId, dataToPersist).catch(err => {
      console.warn('Error saving reading progress immediately:', err);
    });
    return;
  }

  if (progressSaveTimer) clearTimeout(progressSaveTimer);
  progressSaveTimer = setTimeout(() => {
    progressSaveTimer = null;
    dbUpdateBookProgress(bookId, dataToPersist).catch(err => {
      console.warn('Error saving reading progress debounced:', err);
    });
  }, 600);
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Initialization & Persistence
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
async function loadData() {
  try {
    await dbMigrateLegacyLocalStorage();
    books = await dbGetAllBooks();
  } catch (err) {
    console.error('Failed to load books from IndexedDB:', err);
    books = [];
  }

  renderDashboard();
  renderCollection();
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Helpers
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function generateId() {
  return 'book-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
}

function $(id) {
  return document.getElementById(id);
}

function esc(str) {
  const d = document.createElement('div');
  d.textContent = String(str || '');
  return d.innerHTML;
}

function formatDisplayTitle(str) {
  if (!str) return 'Untitled Document';
  // If the title is an unbroken filename with underscores, replace with space for display
  if (str.includes('_') && !str.includes(' ')) {
    return str.replace(/_/g, ' ');
  }
  return str;
}

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getFileType(filename) {
  const ext = (filename || '').split('.').pop().toLowerCase();
  if (ext === 'pdf')  return 'pdf';
  if (ext === 'epub') return 'epub';
  return 'unknown';
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Navigation
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function showView(viewName) {
  currentView = viewName;
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.dock-tab').forEach(b => b.classList.toggle('is-active', b.dataset.tab === viewName));

  const activeView = $('view-' + viewName);
  if (activeView) activeView.classList.remove('hidden');

  const activeBtn = document.querySelector(`.nav-item[data-view="${viewName}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  closeMobileSidebar();

  if (viewName === 'dashboard')  renderDashboard();
  if (viewName === 'collection') renderCollection();
}

function openMobileSidebar() {
  const sb = $('sidebar');
  const ov = $('sidebarOverlay');
  if (sb) sb.classList.add('open');
  if (ov) ov.classList.add('open');
}

function closeMobileSidebar() {
  const sb = $('sidebar');
  const ov = $('sidebarOverlay');
  if (sb) sb.classList.remove('open');
  if (ov) ov.classList.remove('open');
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Dashboard Rendering (Editorial Reading Desk)
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function renderDashboard() {
  const total    = books.length;
  const want     = books.filter(b => b.status === 'Want to Read').length;
  const reading  = books.filter(b => b.status === 'Reading').length;
  const finished = books.filter(b => b.status === 'Finished').length;

  $('statTotal').textContent    = total;
  $('statWant').textContent     = want;
  $('statReading').textContent  = reading;
  $('statFinished').textContent = finished;

  // 1. Active Reading Desk (Focus)
  const activeReadingSection = $('activeReadingSection');
  const activeReadingList    = $('activeReadingList');
  const activeBooks = books.filter(b => b.status === 'Reading');

  activeReadingList.innerHTML = '';
  if (activeBooks.length === 0) {
    activeReadingSection.classList.add('hidden');
  } else {
    activeReadingSection.classList.remove('hidden');
    activeBooks.forEach(book => {
      const card = document.createElement('article');
      card.className = 'desk-card';
      const displayTitle = formatDisplayTitle(book.title);
      const progressLabel = (book.fileType === 'pdf' && book.lastReadPage)
        ? `Page ${book.lastReadPage} of ${book.totalPages || '?'}`
        : (book.readingProgress ? `${Math.round(book.readingProgress)}% completed` : '');

      card.innerHTML = `
        <div class="desk-card-body">
          <h3 class="desk-card-title">${esc(displayTitle)}</h3>
          <p class="desk-card-author">${esc(book.author || 'Unknown author')}</p>
          ${progressLabel ? `<p class="desk-card-progress" style="font-size:11px;font-family:var(--font-mono);color:var(--text-muted);margin-top:4px;">${esc(progressLabel)}</p>` : ''}
        </div>
        <div class="desk-card-footer">
          <span class="badge badge-category">${esc(book.category)}</span>
          <button class="btn btn-primary btn-sm" data-action="read" data-id="${esc(book.id)}">Continue Reading</button>
        </div>
      `;
      activeReadingList.appendChild(card);
    });
  }

  // 2. Subject Distribution (Monochrome Breakdown)
  const catContainer = $('categoryBars');
  catContainer.innerHTML = '';

  CATEGORIES.forEach(cat => {
    const count = books.filter(b => b.category === cat).length;
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;

    const row = document.createElement('div');
    row.className = 'category-row';
    row.innerHTML = `
      <div class="cat-header">
        <span class="cat-name">${esc(cat)}</span>
        <span class="cat-count">${count} (${pct}%)</span>
      </div>
      <div class="cat-track">
        <div class="cat-fill" style="width: ${pct}%"></div>
      </div>
    `;
    catContainer.appendChild(row);
  });

  // 3. Recent Additions Ledger
  const recentContainer = $('recentList');
  recentContainer.innerHTML = '';

  const recent = [...books]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);

  if (recent.length === 0) {
    recentContainer.innerHTML = '<p class="book-no-file" style="text-align:left;padding:12px 0;">No additions recorded yet.</p>';
    return;
  }

  recent.forEach(book => {
    const item = document.createElement('div');
    item.className = 'recent-row';
    const displayTitle = formatDisplayTitle(book.title);

    item.innerHTML = `
      <div class="recent-info">
        <span class="recent-title">${esc(displayTitle)}</span>
        <span class="recent-author">${esc(book.author || 'Unknown author')}</span>
      </div>
      <div class="recent-badge-wrap">
        <span class="badge badge-file">${(book.fileType || 'doc').toUpperCase()}</span>
        <span class="badge ${STATUS_CLASS[book.status] || ''}">${esc(book.status)}</span>
      </div>
    `;
    recentContainer.appendChild(item);
  });
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Collection Rendering
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function getFiltered() {
  const query     = $('searchInput').value.trim().toLowerCase();
  const catFilter = $('filterCategory').value;
  const stFilter  = $('filterStatus').value;

  return books.filter(b => {
    if (catFilter && b.category !== catFilter) return false;
    if (stFilter  && b.status   !== stFilter)  return false;
    if (query) {
      const inTitle  = b.title.toLowerCase().includes(query);
      const inAuthor = (b.author || '').toLowerCase().includes(query);
      const inNotes  = (b.notes || '').toLowerCase().includes(query);
      if (!inTitle && !inAuthor && !inNotes) return false;
    }
    return true;
  });
}

function renderCollection() {
  const filtered = getFiltered();
  const grid  = $('bookGrid');
  const empty = $('emptyState');

  grid.innerHTML = '';

  if (filtered.length === 0) {
    grid.classList.add('hidden');
    empty.classList.remove('hidden');

    const hasFilters =
      $('searchInput').value.trim() !== '' ||
      $('filterCategory').value     !== '' ||
      $('filterStatus').value       !== '';

    if (hasFilters) {
      $('emptyTitle').textContent = 'No matching titles found.';
      $('emptySub').textContent   = 'Try adjusting your search query or subject filters.';
      $('emptyAddBtn').classList.add('hidden');
    } else {
      $('emptyTitle').textContent = 'Your library is empty.';
      $('emptySub').textContent   = 'Add your first PDF or EPUB document to build your personal archive.';
      $('emptyAddBtn').classList.remove('hidden');
    }
    return;
  }

  grid.classList.remove('hidden');
  empty.classList.add('hidden');
  filtered.forEach(book => grid.appendChild(buildBookCard(book)));
}

function buildBookCard(book) {
  const card = document.createElement('article');
  card.className = 'book-card';
  card.dataset.id = book.id;

  const displayTitle = formatDisplayTitle(book.title);
  const displayAuthor = book.author || 'Unknown author';
  const fileType = (book.fileType || 'pdf').toUpperCase();

  // Book cover representation (Real 3D Book Object)
  const coverHtml = book.coverImage
    ? `<img class="book-cover-img" src="${book.coverImage}" alt="${esc(displayTitle)}" />`
    : `<div class="book-cover-canvas">
        <div class="book-cover-inlay">
          <div class="book-cover-top">
            <span class="book-cover-format">${esc(fileType)}</span>
            <span class="book-cover-cat">${esc(book.category)}</span>
          </div>
          <div class="book-cover-title-wrap">
            <h4 class="book-cover-title">${esc(displayTitle)}</h4>
            <p class="book-cover-author">${esc(displayAuthor)}</p>
          </div>
          <div class="book-cover-bottom">
            <span class="book-press-mark">LITTLE LIBRARY</span>
          </div>
        </div>
      </div>`;

  const notesHtml = book.notes
    ? `<div class="book-notes">${esc(book.notes)}</div>`
    : '';

  let progressHtml = '';
  if (book.readingProgress !== undefined && book.readingProgress !== null && book.readingProgress > 0) {
    const pct = Math.min(100, Math.max(1, Math.round(book.readingProgress)));
    const label = (book.fileType === 'pdf' && book.lastReadPage)
      ? `Page ${book.lastReadPage} of ${book.totalPages || '?'}`
      : `${pct}% read`;
    progressHtml = `
      <div class="book-progress-box">
        <div class="book-progress-header">
          <span class="book-progress-label">${esc(label)}</span>
          <span class="book-progress-percent">${pct}%</span>
        </div>
        <div class="book-progress-track">
          <div class="book-progress-fill" style="width: ${pct}%"></div>
        </div>
      </div>
    `;
  }

  const isResumable = book.readingProgress && book.readingProgress > 0 && book.readingProgress < 100;
  const readBtnHtml = isResumable
    ? `<button class="book-read-btn book-read-btn--resume" data-action="read" data-id="${esc(book.id)}" title="Resume from ${book.fileType === 'pdf' && book.lastReadPage ? 'Page ' + book.lastReadPage : Math.round(book.readingProgress) + '%'}">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        Resume
       </button>`
    : `<button class="book-read-btn" data-action="read" data-id="${esc(book.id)}">Read</button>`;

  card.innerHTML = `
    <!-- Physical 3D Book Object -->
    <div class="book-object-wrap" data-action="read" data-id="${esc(book.id)}" title="Click to read ${esc(displayTitle)}">
      <div class="book-3d">
        <div class="book-spine-crease"></div>
        ${coverHtml}
        <div class="book-pages-side"></div>
      </div>
    </div>

    <!-- Book Details Container -->
    <div class="book-details">
      <div>
        <div class="book-meta-row">
          <span class="badge ${STATUS_CLASS[book.status] || ''}">${esc(book.status)}</span>
          <span class="badge badge-file">${esc(fileType)}</span>
          <span class="badge badge-category">${esc(book.category)}</span>
          <span class="book-file-size">${formatBytes(book.fileSize)}</span>
        </div>

        <div class="book-title-row">
          <h3 class="book-title" title="${esc(book.title)}">${esc(displayTitle)}</h3>
        </div>
        <p class="book-author">${esc(displayAuthor)}</p>

        ${notesHtml}
        ${progressHtml}
      </div>

      <div class="book-card-actions">
        ${readBtnHtml}
        <div class="book-card-tools">
          <button class="icon-btn" data-action="cover" data-id="${esc(book.id)}" title="Set/Change Cover Image" aria-label="Change cover for ${esc(displayTitle)}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </button>
          <button class="icon-btn" data-action="edit" data-id="${esc(book.id)}" title="Edit book metadata" aria-label="Edit ${esc(displayTitle)}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="icon-btn icon-btn--danger" data-action="delete" data-id="${esc(book.id)}" title="Remove book" aria-label="Remove ${esc(displayTitle)}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    </div>
  `;

  return card;
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   File & Cover Upload Handling
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function resetFileState() {
  pendingFile = null;
  pendingCoverData = null;
  $('fileDropInner').classList.remove('hidden');
  $('fileSelected').classList.add('hidden');
  $('errFile').textContent = '';
  $('uploadProgress').classList.add('hidden');
  $('uploadBar').style.width = '0%';
  $('fileInput').value = '';
  $('coverInput').value = '';
  updateCoverPreview(null);
}

function updateCoverPreview(dataUrl) {
  const thumb = $('coverPreviewImg');
  const text  = $('coverPreviewText');
  const clearBtn = $('removeCoverBtn');

  if (dataUrl) {
    thumb.src = dataUrl;
    thumb.classList.remove('hidden');
    text.textContent = 'Custom cover artwork selected';
    clearBtn.classList.remove('hidden');
  } else {
    thumb.src = '';
    thumb.classList.add('hidden');
    text.textContent = 'No cover image selected (Classic hardcover will be generated)';
    clearBtn.classList.add('hidden');
  }
}

function stageFile(file) {
  if (!file) return;

  const type = getFileType(file.name);
  if (type === 'unknown') {
    $('errFile').textContent = 'Only PDF and ePub documents are supported.';
    return;
  }

  $('errFile').textContent = '';
  $('fileSelName').textContent = file.name;
  $('fileSelSize').textContent = formatBytes(file.size);
  $('fileDropInner').classList.add('hidden');
  $('fileSelected').classList.remove('hidden');

  // Auto-fill title if blank, cleanly formatted
  const nameWithoutExt = file.name.replace(/\.(pdf|epub)$/i, '');
  if (!$('fieldTitle').value.trim()) {
    $('fieldTitle').value = formatDisplayTitle(nameWithoutExt);
  }

  $('uploadProgress').classList.remove('hidden');
  $('uploadBar').style.width = '100%';
  setTimeout(() => $('uploadProgress').classList.add('hidden'), 250);

  pendingFile = {
    file: file,
    type: type,
    name: file.name,
    size: file.size,
  };
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Form Modals
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function openModal(id) {
  $(id).classList.remove('hidden');
}

function closeModal(id) {
  $(id).classList.add('hidden');
}

/* ─────────────────────────────────────────────
   About & Update Management
   ───────────────────────────────────────────── */
function openAboutModal() {
  const versionBadge = $('aboutCurrentVersion');
  if (versionBadge) versionBadge.textContent = CURRENT_APP_VERSION;
  openModal('aboutModal');
}

function parseVersion(vStr) {
  if (!vStr) return [0, 0, 0];
  const clean = vStr.replace(/^v/i, '').trim();
  const parts = clean.split('.').map(n => parseInt(n, 10) || 0);
  while (parts.length < 3) parts.push(0);
  return parts;
}

function isNewerVersion(remoteStr, localStr) {
  const [rMaj, rMin, rPat] = parseVersion(remoteStr);
  const [lMaj, lMin, lPat] = parseVersion(localStr);
  if (rMaj !== lMaj) return rMaj > lMaj;
  if (rMin !== lMin) return rMin > lMin;
  return rPat > lPat;
}

async function checkForUpdates() {
  if (isCheckingUpdate) return;
  isCheckingUpdate = true;

  const btn = $('btnCheckUpdates');
  const icon = $('updateIcon');
  const statusMsg = $('updateStatusMsg');
  const releaseBox = $('updateReleaseBox');

  if (btn) btn.disabled = true;
  if (icon) icon.classList.add('is-spinning');
  if (releaseBox) releaseBox.classList.add('hidden');
  if (statusMsg) {
    statusMsg.className = 'update-status-msg update-status--checking';
    statusMsg.textContent = 'Connecting to GitHub Releases API…';
  }

  try {
    const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        // Fallback: check repository tags if no formal release object exists yet
        const tagsRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/tags`);
        if (tagsRes.ok) {
          const tags = await tagsRes.json();
          if (Array.isArray(tags) && tags.length > 0) {
            handleReleaseData({
              tag_name: tags[0].name,
              name: tags[0].name,
              body: 'Latest release from GitHub repository tags.',
              html_url: `https://github.com/${GITHUB_REPO}/releases`,
              assets: []
            });
            return;
          }
        }
      }
      throw new Error(`GitHub API responded with status ${response.status}`);
    }

    const release = await response.json();
    handleReleaseData(release);

  } catch (err) {
    console.warn('Update check failed:', err);
    if (statusMsg) {
      statusMsg.className = 'update-status-msg update-status--error';
      statusMsg.innerHTML = `
        <span>Could not check updates. Check network or <a href="https://github.com/${GITHUB_REPO}/releases" target="_blank" style="text-decoration:underline;color:inherit;font-weight:600;">visit GitHub</a>.</span>
      `;
    }
  } finally {
    isCheckingUpdate = false;
    if (btn) btn.disabled = false;
    if (icon) icon.classList.remove('is-spinning');
  }
}

function handleReleaseData(release) {
  const statusMsg = $('updateStatusMsg');
  const releaseBox = $('updateReleaseBox');
  const latestTag = release.tag_name || CURRENT_APP_VERSION;

  if (isNewerVersion(latestTag, CURRENT_APP_VERSION)) {
    // New version available!
    if (statusMsg) {
      statusMsg.className = 'update-status-msg update-status--available';
      statusMsg.innerHTML = `<span><strong>Update Available!</strong> Versi baru <strong>${esc(latestTag)}</strong> siap diunduh.</span>`;
    }

    if (releaseBox) {
      releaseBox.classList.remove('hidden');
      $('updateReleaseTag').textContent = `${release.name || latestTag} (${latestTag})`;

      if (release.published_at) {
        const dateStr = new Date(release.published_at).toLocaleDateString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric'
        });
        $('updateReleaseDate').textContent = `Published: ${dateStr}`;
      } else {
        $('updateReleaseDate').textContent = '';
      }

      $('updateReleaseNotes').textContent = release.body || 'Includes performance optimizations, bug fixes, and latest reader engine updates.';

      // Determine direct installer download URL
      let downloadUrl = `https://github.com/${GITHUB_REPO}/raw/main/dist/MyLittleLibrary-Setup-v2.0.0.exe`;
      if (release.assets && release.assets.length > 0) {
        const exeAsset = release.assets.find(a => a.name.endsWith('.exe'));
        if (exeAsset && exeAsset.browser_download_url) {
          downloadUrl = exeAsset.browser_download_url;
        }
      }

      $('btnDownloadUpdate').onclick = () => {
        triggerSeamlessUpdate(downloadUrl, latestTag);
      };
      $('btnViewOnGithub').href = release.html_url || `https://github.com/${GITHUB_REPO}/releases`;
    }

  } else {
    // App is up to date!
    if (statusMsg) {
      statusMsg.className = 'update-status-msg update-status--latest';
      statusMsg.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="display:inline-block;vertical-align:middle;margin-right:6px;"><polyline points="20 6 9 17 4 12"/></svg>
        <span>My Little Library is up to date (current version <strong>${CURRENT_APP_VERSION}</strong>).</span>
      `;
    }
    if (releaseBox) releaseBox.classList.add('hidden');
  }
}

function triggerSeamlessUpdate(downloadUrl, targetTag) {
  const btn = $('btnDownloadUpdate');
  const progressBox = $('updateProgressContainer');
  const progressLabel = $('updateProgressLabel');
  const progressPct = $('updateProgressPct');
  const progressFill = $('updateProgressBarFill');
  const progressSub = $('updateProgressSubtext');

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="is-spinning"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
      <span>Mengunduh Pembaruan...</span>
    `;
  }

  if (progressBox) progressBox.classList.remove('hidden');
  if (progressLabel) progressLabel.textContent = `Mengunduh ${targetTag || 'versi terbaru'}...`;
  if (progressPct) progressPct.textContent = 'Memproses...';
  if (progressFill) progressFill.classList.add('is-indeterminate');
  if (progressSub) {
    progressSub.textContent = 'Mengunduh installer di latar belakang. Aplikasi akan ditutup sebentar dan restart otomatis dengan versi terbaru.';
  }

  // Interop with Win32 WebView2 Native Host
  if (window.chrome && window.chrome.webview && typeof window.chrome.webview.postMessage === 'function') {
    try {
      window.chrome.webview.postMessage(JSON.stringify({
        action: 'applyUpdate',
        downloadUrl: downloadUrl,
        version: targetTag
      }));
    } catch (err) {
      console.warn('Failed to communicate with WebView2 host:', err);
      window.open(downloadUrl, '_blank');
    }
  } else {
    // External browser fallback
    window.open(downloadUrl, '_blank');
  }
}

function openAddForm() {
  editingId = null;
  pendingFile = null;
  pendingCoverData = null;
  $('formModalTitle').textContent = 'Add Book';
  $('formSaveBtn').textContent    = 'Save Book';
  $('bookForm').reset();
  $('fieldCategory').value        = 'Any';
  $('fieldStatus').value          = 'New';
  clearFormErrors();
  resetFileState();
  $('fileUploadGroup').classList.remove('hidden');
  openModal('formModal');
  $('fileInput').focus();
}

function openEditForm(id) {
  const book = books.find(b => b.id === id);
  if (!book) return;

  editingId = id;
  pendingCoverData = book.coverImage || null;
  $('formModalTitle').textContent = 'Edit Book';
  $('formSaveBtn').textContent    = 'Save Changes';

  $('bookId').value        = book.id;
  $('fieldTitle').value    = book.title;
  $('fieldAuthor').value   = book.author || '';
  $('fieldCategory').value = book.category || 'Any';
  $('fieldStatus').value   = book.status || 'New';
  $('fieldNotes').value    = book.notes || '';

  $('fileUploadGroup').classList.add('hidden');
  updateCoverPreview(pendingCoverData);

  clearFormErrors();
  openModal('formModal');
}

function clearFormErrors() {
  ['errFile','errTitle','errCategory','errStatus'].forEach(id => {
    $(id).textContent = '';
  });
  ['fieldTitle','fieldCategory','fieldStatus'].forEach(id => {
    $(id).classList.remove('is-error');
  });
}

function validateForm() {
  let valid = true;

  if (!editingId && !pendingFile) {
    $('errFile').textContent = 'Please select a PDF or ePub file.';
    valid = false;
  }

  const titleEl = $('fieldTitle');
  if (!titleEl.value.trim()) {
    $('errTitle').textContent = 'Title is required.';
    titleEl.classList.add('is-error');
    valid = false;
  } else {
    $('errTitle').textContent = '';
    titleEl.classList.remove('is-error');
  }

  return valid;
}

async function handleFormSubmit(e) {
  e.preventDefault();
  if (!validateForm()) return;

  const title    = $('fieldTitle').value.trim();
  const author   = $('fieldAuthor').value.trim();
  const category = $('fieldCategory').value.trim() || 'Any';
  const status   = $('fieldStatus').value.trim() || 'New';
  const notes    = $('fieldNotes').value.trim();

  try {
    if (editingId) {
      const idx = books.findIndex(b => b.id === editingId);
      if (idx !== -1) {
        books[idx] = {
          ...books[idx],
          title,
          author,
          category,
          status,
          notes,
          coverImage: pendingCoverData,
          updatedAt: new Date().toISOString()
        };
        await dbSaveBook(books[idx]);
      }
    } else {
      const id = generateId();
      const newBook = {
        id,
        title,
        author,
        category,
        status,
        notes,
        coverImage: pendingCoverData,
        fileType: pendingFile.type,
        fileName: pendingFile.name,
        fileSize: pendingFile.size,
        createdAt: new Date().toISOString(),
      };

      await dbSaveFile(id, pendingFile.file, pendingFile.type, pendingFile.name, pendingFile.size);
      await dbSaveBook(newBook);
      books.push(newBook);
    }

    closeModal('formModal');
    renderCollection();
    renderDashboard();
  } catch (err) {
    console.error('Save failed:', err);
    alert('Failed to save book to database.');
  }
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Delete Confirmation
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function openDeleteConfirm(id) {
  const book = books.find(b => b.id === id);
  if (!book) return;
  pendingDeleteId = id;
  $('deleteBookTitle').textContent = formatDisplayTitle(book.title);
  openModal('deleteModal');
}

async function handleDeleteConfirm() {
  if (!pendingDeleteId) return;

  try {
    await dbDeleteBook(pendingDeleteId);
    books = books.filter(b => b.id !== pendingDeleteId);
    pendingDeleteId = null;
    closeModal('deleteModal');
    renderCollection();
    renderDashboard();
  } catch (err) {
    console.error('Delete failed:', err);
    alert('Could not delete the book record.');
  }
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Integrated Reader (PDF & ePub)
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   PDF Flipbook & Reader Engine
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function applyZoom(newZoom) {
  currentZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.round(newZoom * 100) / 100));
  const container = document.getElementById('flipbookContainer');
  const wrapper   = document.getElementById('flipbookWrapper');
  const label     = document.getElementById('flipbookZoomLabel');

  if (container) {
    container.style.transform = `scale(${currentZoom})`;
  }
  if (label) {
    label.textContent = `${Math.round(currentZoom * 100)}%`;
  }
  if (wrapper) {
    if (currentZoom > 1.05) {
      wrapper.classList.add('is-zoomed');
    } else {
      wrapper.classList.remove('is-zoomed');
    }
  }
}

async function renderPdfViewer(blob, book, targetPage = 0) {
  const body = $('readerBody');
  const displayTitle = formatDisplayTitle(book.title);

  // Resume last read page if not explicitly provided
  if (targetPage === 0 && book.lastReadPage && book.lastReadPage > 0) {
    targetPage = book.lastReadPage;
  }

  // Clean up previous flipbook instance if any
  if (currentFlipInstance) {
    try { currentFlipInstance.destroy(); } catch (_) {}
    currentFlipInstance = null;
  }
  renderedPdfPages.clear();
  currentZoom = 1.0;

  if (pdfReaderMode === 'scroll') {
    // Standard continuous view
    body.innerHTML = '';
    const iframe = document.createElement('iframe');
    const resumeHash = (targetPage && targetPage > 1) ? `#page=${targetPage}` : '';
    iframe.src = activeBlobUrl + resumeHash;
    iframe.title = displayTitle;
    body.appendChild(iframe);
    return;
  }

  // Flipbook Mode (3D Physical Book Spread)
  body.innerHTML = `
    <div class="flipbook-stage" id="flipbookStage">
      <div class="flipbook-page-loading" id="flipbookLoadingMsg">
        Preparing pages & binding bookâ€¦
      </div>
      <div id="flipbookWrapper" class="flipbook-wrapper is-hidden">
        <div id="flipbookContainer" class="flipbook-container"></div>
      </div>
      <div class="flipbook-toolbar hidden" id="flipbookToolbar">
        <button type="button" class="flipbook-btn" id="flipPrevBtn" title="Previous page (Left arrow)">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          Prev
        </button>
        <span class="flipbook-counter" id="flipbookCounter">Cover</span>
        <button type="button" class="flipbook-btn" id="flipNextBtn" title="Next page (Right arrow)">
          Next
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>

        <div class="flipbook-zoom-group">
          <button type="button" class="flipbook-btn flipbook-btn--zoom" id="flipZoomOut" title="Zoom out (Ctrl + - or Ctrl + Wheel Down)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
          <button type="button" class="flipbook-btn flipbook-btn--zoom-reset" id="flipZoomReset" title="Reset zoom (Ctrl + 0)">
            <span id="flipbookZoomLabel">100%</span>
          </button>
          <button type="button" class="flipbook-btn flipbook-btn--zoom" id="flipZoomIn" title="Zoom in (Ctrl + + or Ctrl + Wheel Up)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>

        <span class="flipbook-hint">Ctrl+Scroll to zoom &bull; Ctrl+Click to pan</span>
      </div>
    </div>
  `;

  try {
    if (typeof pdfjsLib !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js';
    } else {
      throw new Error('PDF.js library is not available.');
    }

    const arrayBuffer = await blob.arrayBuffer();
    currentPdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = currentPdfDoc.numPages;

    // Determine dimensions from first page aspect ratio
    const firstPage = await currentPdfDoc.getPage(1);
    const viewport1 = firstPage.getViewport({ scale: 1.0 });
    const aspect = viewport1.height / viewport1.width;

    // Live stage dimensions (readerPanel is guaranteed visible)
    const availWidth  = Math.max(300, (body.clientWidth || window.innerWidth) - 64);
    const availHeight = Math.max(300, (body.clientHeight || window.innerHeight) - 96);

    let maxPageWidth  = Math.floor(availWidth / 2);
    let maxPageHeight = availHeight;

    let singleWidth  = Math.floor(Math.min(maxPageWidth, maxPageHeight / aspect));
    singleWidth = Math.min(500, singleWidth);
    let singleHeight = Math.floor(singleWidth * aspect);

    if (singleWidth < 180) singleWidth = 180;
    if (singleHeight < 250) singleHeight = 250;

    const container = document.getElementById('flipbookContainer');
    const totalWidth = singleWidth * 2;
    container.style.width     = totalWidth + 'px';
    container.style.height    = singleHeight + 'px';
    container.style.minWidth  = totalWidth + 'px';
    container.style.minHeight = singleHeight + 'px';
    container.style.maxWidth  = totalWidth + 'px';
    container.style.maxHeight = singleHeight + 'px';

    // 1. Front Cover (Hard)
    const coverDiv = document.createElement('div');
    coverDiv.className = 'flipbook-page flipbook-cover-page';
    coverDiv.dataset.density = 'hard';

    if (book.coverImage) {
      coverDiv.innerHTML = `<img class="flipbook-cover-artwork" src="${book.coverImage}" alt="Cover" />`;
    } else {
      coverDiv.innerHTML = `
        <div class="flipbook-cover-inlay">
          <div class="book-press-mark">MY LITTLE LIBRARY</div>
          <div>
            <div class="flipbook-cover-title">${esc(displayTitle)}</div>
            <div class="flipbook-cover-author">${esc(book.author || 'Unknown author')}</div>
          </div>
          <div class="book-cover-top">
            <span>EDITION</span>
            <span>VOL. 1</span>
          </div>
        </div>
      `;
    }
    container.appendChild(coverDiv);

    // 2. Content Pages
    for (let i = 1; i <= totalPages; i++) {
      const isOdd = (i % 2 === 1);
      const sideClass = isOdd ? 'flipbook-page--right' : 'flipbook-page--left';
      const pageDiv = document.createElement('div');
      pageDiv.className = `flipbook-page ${sideClass}`;
      pageDiv.dataset.page = i;
      pageDiv.dataset.density = 'soft';
      pageDiv.innerHTML = `
        <div class="flipbook-page-loading" id="pdfPageLoading-${i}">Rendering page ${i}â€¦</div>
        <canvas class="flipbook-canvas hidden" id="pdfCanvas-${i}"></canvas>
        <span class="flipbook-page-footer">${i}</span>
      `;
      container.appendChild(pageDiv);
    }

    // 3. Back Cover & Closing Endpaper
    if (totalPages % 2 !== 0) {
      const endpaper = document.createElement('div');
      endpaper.className = 'flipbook-page flipbook-page--left';
      endpaper.dataset.density = 'soft';
      endpaper.innerHTML = `<div style="flex:1;"></div><span class="flipbook-page-footer">â€”</span>`;
      container.appendChild(endpaper);
    }

    const backCover = document.createElement('div');
    backCover.className = 'flipbook-page flipbook-cover-page';
    backCover.dataset.density = 'hard';
    backCover.innerHTML = `
      <div class="flipbook-cover-inlay" style="justify-content:center;align-items:center;">
        <div class="book-press-mark">EX LIBRIS &bull; MY LITTLE LIBRARY</div>
      </div>
    `;
    container.appendChild(backCover);

    // Initialize St.PageFlip
    if (typeof St !== 'undefined' && St.PageFlip) {
      const pageElements = container.querySelectorAll('.flipbook-page');
      currentFlipInstance = new St.PageFlip(container, {
        width: singleWidth,
        height: singleHeight,
        size: 'fixed',
        minWidth: singleWidth,
        maxWidth: singleWidth * 2,
        minHeight: singleHeight,
        maxHeight: singleHeight * 2,
        drawShadow: true,
        maxShadowOpacity: 0.55,
        showCover: true,
        usePortrait: false, // Ensure physical two-page book spread is ALWAYS preserved and centered on desktop
        startPage: targetPage,
        startZIndex: 1,
        autoSize: false,
        showPageCorners: false, // Corner curl preview on hover disabled; flips occur only on explicit user click/drag
        flippingTime: 650
      });

      currentFlipInstance.loadFromHTML(pageElements);

      // Coordinate scaling hook: ensures mouse hover and drag remain accurate at any zoom level
      if (currentFlipInstance.getUI()) {
        currentFlipInstance.getUI().getMousePos = function(clientX, clientY) {
          const rect = this.distElement.getBoundingClientRect();
          return {
            x: (clientX - rect.left) / currentZoom,
            y: (clientY - rect.top) / currentZoom
          };
        };
      }

      // Function to render page canvas on demand
      async function renderPdfPageCanvas(pageNum) {
        if (renderedPdfPages.has(pageNum) || pageNum < 1 || pageNum > totalPages) return;
        renderedPdfPages.add(pageNum);
        try {
          const page = await currentPdfDoc.getPage(pageNum);
          const canvas = document.getElementById(`pdfCanvas-${pageNum}`);
          const loader = document.getElementById(`pdfPageLoading-${pageNum}`);
          if (!canvas) return;

          const baseViewport = page.getViewport({ scale: 1.0 });
          const scale = Math.max(1.5, Math.min(2.5, (singleWidth / baseViewport.width) * 1.5));
          const viewport = page.getViewport({ scale });

          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');
          await page.render({ canvasContext: ctx, viewport }).promise;

          if (loader) loader.style.display = 'none';
          canvas.classList.remove('hidden');
        } catch (err) {
          console.warn(`Error rendering page ${pageNum}:`, err);
        }
      }

      // Initial render for opening spread (both left and right pages)
      const startRender = Math.max(1, targetPage);
      if (startRender > 1) renderPdfPageCanvas(startRender - 1);
      await renderPdfPageCanvas(startRender);
      renderPdfPageCanvas(startRender + 1);
      renderPdfPageCanvas(startRender + 2);

      // Update toolbar counter text
      function updateToolbarCounter(pageIdx) {
        const counter = document.getElementById('flipbookCounter');
        if (!counter) return;
        if (pageIdx === 0) {
          counter.textContent = 'Cover';
        } else if (pageIdx > totalPages) {
          counter.textContent = 'Back Cover';
        } else {
          counter.textContent = `Page ${pageIdx} of ${totalPages}`;
        }
      }

      updateToolbarCounter(targetPage);

      currentFlipInstance.on('flip', (e) => {
        const currentIdx = e.data;
        updateToolbarCounter(currentIdx);

        // Calculate and autosave reading progress
        let progressPct = 0;
        let pageNum = currentIdx;
        if (currentIdx === 0) {
          progressPct = 0;
          pageNum = 1;
        } else if (currentIdx > totalPages) {
          progressPct = 100;
          pageNum = totalPages;
        } else {
          pageNum = currentIdx;
          progressPct = Math.min(100, Math.max(1, Math.round((currentIdx / totalPages) * 100)));
        }

        const updates = {
          lastReadPage: pageNum,
          totalPages: totalPages,
          readingProgress: progressPct,
          lastReadAt: new Date().toISOString()
        };
        if (currentReaderBook && (currentReaderBook.status === 'New' || currentReaderBook.status === 'Want to Read')) {
          updates.status = 'Reading';
        } else if (progressPct === 100 && currentReaderBook && currentReaderBook.status !== 'Finished') {
          updates.status = 'Finished';
        }
        saveReadingProgressDebounced(updates);

        // Pre-render neighbor pages
        for (let offset = -2; offset <= 3; offset++) {
          const target = currentIdx + offset;
          if (target >= 1 && target <= totalPages) {
            renderPdfPageCanvas(target);
          }
        }
      });

      // Navigation buttons
      document.getElementById('flipPrevBtn').onclick = () => {
        if (currentFlipInstance) currentFlipInstance.flipPrev();
      };
      document.getElementById('flipNextBtn').onclick = () => {
        if (currentFlipInstance) currentFlipInstance.flipNext();
      };

      // Zoom Controls
      document.getElementById('flipZoomIn').onclick = () => applyZoom(currentZoom + ZOOM_STEP);
      document.getElementById('flipZoomOut').onclick = () => applyZoom(currentZoom - ZOOM_STEP);
      document.getElementById('flipZoomReset').onclick = () => applyZoom(1.0);

      // Ctrl + MouseWheel Zoom
      const stage = document.getElementById('flipbookStage');
      if (stage) {
        stage.addEventListener('wheel', (e) => {
          if (e.ctrlKey) {
            e.preventDefault();
            if (e.deltaY < 0) {
              applyZoom(currentZoom + ZOOM_STEP);
            } else if (e.deltaY > 0) {
              applyZoom(currentZoom - ZOOM_STEP);
            }
          }
        }, { passive: false });
      }

      // Pan to drag with Ctrl + Left Click (or middle click)
      const wrapper = document.getElementById('flipbookWrapper');
      if (wrapper && stage) {
        let isPanning = false;
        let startX = 0, startY = 0;
        let scrollLeft = 0, scrollTop = 0;

        // Use capture phase to intercept Ctrl + Left Click before St.PageFlip
        wrapper.addEventListener('mousedown', (e) => {
          const isCtrlPan = (e.ctrlKey && e.button === 0);
          const isMiddlePan = (e.button === 1);
          if (isCtrlPan || isMiddlePan) {
            e.preventDefault();
            e.stopPropagation();
            isPanning = true;
            wrapper.classList.add('is-panning');
            stage.classList.add('is-panning');
            startX = e.clientX;
            startY = e.clientY;
            scrollLeft = wrapper.scrollLeft;
            scrollTop = wrapper.scrollTop;
          }
        }, true);

        window.addEventListener('mousemove', (e) => {
          if (!isPanning) return;
          e.preventDefault();
          const dx = e.clientX - startX;
          const dy = e.clientY - startY;
          wrapper.scrollLeft = scrollLeft - dx;
          wrapper.scrollTop = scrollTop - dy;
        });

        window.addEventListener('mouseup', () => {
          if (isPanning) {
            isPanning = false;
            wrapper.classList.remove('is-panning');
            stage.classList.remove('is-panning');
          }
        });
      }

      document.getElementById('flipbookLoadingMsg').style.display = 'none';
      document.getElementById('flipbookWrapper').classList.remove('is-hidden');
      document.getElementById('flipbookToolbar').classList.remove('hidden');
      if (currentFlipInstance) {
        currentFlipInstance.update();
      }

    } else {
      throw new Error('PageFlip library is not available.');
    }

  } catch (err) {
    console.error('Error initializing flipbook:', err);
    // Graceful fallback to standard scroll view
    body.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.src = activeBlobUrl;
    iframe.title = displayTitle;
    body.appendChild(iframe);
  }
}

function toggleReaderControls(forceState) {
  const panel = $('readerPanel');
  if (!panel || panel.classList.contains('hidden')) return;

  const nextVisible = (forceState !== undefined) ? forceState : !isControlsVisible;
  isControlsVisible = nextVisible;

  const toggleBtn = $('readerControlsToggle');

  if (isControlsVisible) {
    panel.classList.remove('is-controls-hidden');
    if (toggleBtn) {
      toggleBtn.classList.add('is-active');
      toggleBtn.title = "Sembunyikan Bilah Kontrol";
    }
  } else {
    panel.classList.add('is-controls-hidden');
    if (toggleBtn) {
      toggleBtn.classList.remove('is-active');
      toggleBtn.title = "Tampilkan Bilah Kontrol";
    }
  }
}

/* ─────────────────────────────────────────────
   AI Companion Sidebar Controller
   ───────────────────────────────────────────── */

function toggleAiSidebar(forceState) {
  const panel = $('readerPanel');
  if (!panel || panel.classList.contains('hidden')) return;

  const nextState = (forceState !== undefined) ? forceState : !isAiSidebarOpen;
  isAiSidebarOpen = nextState;

  const toggleBtn = $('readerAiToggleBtn');
  const bar = $('aiCompanionBar');

  if (isAiSidebarOpen) {
    if (toggleBtn) toggleBtn.classList.add('is-active');
    if (bar) bar.classList.remove('hidden');
  } else {
    if (toggleBtn) toggleBtn.classList.remove('is-active');
    if (bar) bar.classList.add('hidden');
  }

  if (window.chrome && window.chrome.webview && typeof window.chrome.webview.postMessage === 'function') {
    window.chrome.webview.postMessage(JSON.stringify({
      action: 'setAISidebarVisible',
      visible: isAiSidebarOpen,
      url: AI_PROVIDERS[currentAiProvider] ? AI_PROVIDERS[currentAiProvider].url : 'https://gemini.google.com/app'
    }));
  }

  setTimeout(() => {
    handleWindowResize();
  }, 100);
}

function switchAiProvider(providerKey) {
  if (!AI_PROVIDERS[providerKey]) return;
  currentAiProvider = providerKey;

  const select = $('aiProviderSelect');
  if (select && select.value !== providerKey) {
    select.value = providerKey;
  }

  const provider = AI_PROVIDERS[providerKey];

  if (window.chrome && window.chrome.webview && typeof window.chrome.webview.postMessage === 'function') {
    window.chrome.webview.postMessage(JSON.stringify({
      action: 'navigateAI',
      url: provider.url
    }));
  }
}

function syncAiSidebarBounds() {
  // Handled automatically by native Win32 ApplySplitLayout
}

function handleReaderKeydown(e) {
  const panel = $('readerPanel');
  if (!panel || panel.classList.contains('hidden')) return;

  // Toggle AI Companion Sidebar (Alt + A or Ctrl + \)
  if ((e.altKey && (e.key === 'a' || e.key === 'A')) || (e.ctrlKey && e.key === '\\')) {
    e.preventDefault();
    toggleAiSidebar();
    return;
  }

  // Toggle Controls (F)
  if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.altKey && !e.metaKey) {
    e.preventDefault();
    toggleReaderControls();
    return;
  }

  // Zoom shortcuts
  if (e.ctrlKey && (e.key === '=' || e.key === '+')) {
    e.preventDefault();
    applyZoom(currentZoom + ZOOM_STEP);
    return;
  }
  if (e.ctrlKey && (e.key === '-' || e.key === '_')) {
    e.preventDefault();
    applyZoom(currentZoom - ZOOM_STEP);
    return;
  }
  if (e.ctrlKey && e.key === '0') {
    e.preventDefault();
    applyZoom(1.0);
    return;
  }

  // Page turn navigation
  if (e.key === 'ArrowRight' || e.key === 'PageDown') {
    if (currentFlipInstance) currentFlipInstance.flipNext();
    else if (currentRendition) currentRendition.next();
  } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
    if (currentFlipInstance) currentFlipInstance.flipPrev();
    else if (currentRendition) currentRendition.prev();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    const shortcutsModal = $('shortcutsModal');
    if (shortcutsModal && !shortcutsModal.classList.contains('hidden')) {
      closeModal('shortcutsModal');
    } else {
      closeReader();
    }
  }
}

let resizeDebounce = null;
function handleWindowResize() {
  const panel = $('readerPanel');
  if (!panel || panel.classList.contains('hidden')) return;

  syncAiSidebarBounds();

  if (currentReaderBook && currentReaderBook.fileType === 'pdf' && pdfReaderMode === 'flip' && currentFlipInstance) {
    clearTimeout(resizeDebounce);
    resizeDebounce = setTimeout(() => {
      const curPage = currentFlipInstance ? currentFlipInstance.getCurrentPageIndex() : 0;
      renderPdfViewer(currentReaderBlob, currentReaderBook, curPage);
    }, 250);
  }
}

async function openReader(bookId) {
  const book = books.find(b => b.id === bookId);
  if (!book) return;

  let fileRecord = null;
  try {
    fileRecord = await dbGetFile(bookId);
  } catch (err) {
    console.error('Failed to retrieve file from IndexedDB:', err);
  }

  if (!fileRecord || !fileRecord.blob) {
    alert('Document file could not be found in local storage.');
    return;
  }

  currentReaderBook = book;
  currentReaderBlob = fileRecord.blob;

  // Reveal reader panel early so viewport geometry and client dimensions are exact
  const readerPanel = $('readerPanel');
  readerPanel.classList.remove('hidden');

  // Start in Focus Mode by default (controls hidden)
  isControlsVisible = false;
  readerPanel.classList.add('is-controls-hidden');
  const toggleBtn = $('readerControlsToggle');
  if (toggleBtn) {
    toggleBtn.classList.remove('is-active');
    toggleBtn.title = "Tampilkan Bilah Kontrol";
  }

  document.body.style.overflow = 'hidden';
  document.body.classList.add('reader-open');
  const dockWrap = document.querySelector('.bottom-dock-wrap');
  if (dockWrap) dockWrap.style.display = 'none';
  window.addEventListener('keydown', handleReaderKeydown);
  window.addEventListener('resize', handleWindowResize);

  const displayTitle = formatDisplayTitle(book.title);
  $('readerTitle').textContent  = displayTitle;
  $('readerAuthor').textContent = book.author || 'Unknown author';

  const body = $('readerBody');
  body.innerHTML = '';

  if (activeBlobUrl) {
    URL.revokeObjectURL(activeBlobUrl);
    activeBlobUrl = null;
  }

  activeBlobUrl = URL.createObjectURL(fileRecord.blob);
  $('readerOpenExternal').onclick = () => window.open(activeBlobUrl, '_blank');

  if (book.fileType === 'pdf') {
    $('readerModeToggle').classList.remove('hidden');
    $('btnModeFlip').classList.toggle('is-active', pdfReaderMode === 'flip');
    $('btnModeScroll').classList.toggle('is-active', pdfReaderMode === 'scroll');

    await renderPdfViewer(currentReaderBlob, currentReaderBook);

  } else if (book.fileType === 'epub') {
    $('readerModeToggle').classList.add('hidden');

    const viewerDiv = document.createElement('div');
    viewerDiv.id = 'epubViewer';
    body.appendChild(viewerDiv);

    const prevBtn = document.createElement('button');
    prevBtn.className = 'epub-nav epub-prev';
    prevBtn.innerHTML = '&#8249;';
    prevBtn.title = 'Previous page';
    prevBtn.setAttribute('aria-label', 'Previous page');

    const nextBtn = document.createElement('button');
    nextBtn.className = 'epub-nav epub-next';
    nextBtn.innerHTML = '&#8250;';
    nextBtn.title = 'Next page';
    nextBtn.setAttribute('aria-label', 'Next page');

    body.appendChild(prevBtn);
    body.appendChild(nextBtn);

    if (currentRendition) { try { currentRendition.destroy(); } catch (_) {} }
    if (currentEpub)      { try { currentEpub.destroy();      } catch (_) {} }

    try {
      if (typeof ePub !== 'undefined') {
        const arrayBuffer = await fileRecord.blob.arrayBuffer();
        currentEpub = ePub(arrayBuffer);
        currentRendition = currentEpub.renderTo('epubViewer', {
          width:  '100%',
          height: '100%',
          spread: 'none',
        });

        // Resume from saved CFI position if available
        if (book.lastReadCfi) {
          currentRendition.display(book.lastReadCfi);
        } else {
          currentRendition.display();
        }

        prevBtn.onclick = () => currentRendition.prev();
        nextBtn.onclick = () => currentRendition.next();

        // Track EPUB relocation and calculate reading progress
        currentRendition.on('relocated', (location) => {
          if (!location || !location.start) return;
          const cfi = location.start.cfi;
          let pct = 0;
          if (currentEpub.locations && currentEpub.locations.length()) {
            pct = Math.round(currentEpub.locations.percentageFromCfi(cfi) * 100);
          } else if (location.start.percentage) {
            pct = Math.round(location.start.percentage * 100);
          }
          const updates = {
            lastReadCfi: cfi,
            readingProgress: pct || (currentReaderBook.readingProgress || 1),
            lastReadAt: new Date().toISOString()
          };
          if (currentReaderBook && (currentReaderBook.status === 'New' || currentReaderBook.status === 'Want to Read')) {
            updates.status = 'Reading';
          }
          saveReadingProgressDebounced(updates);
        });

        // Generate locations in background for percentage calculations
        currentEpub.ready.then(() => {
          return currentEpub.locations.generate(1000);
        }).then(() => {
          if (currentRendition) {
            const loc = currentRendition.currentLocation();
            if (loc && loc.start && currentEpub.locations) {
              const pct = Math.round(currentEpub.locations.percentageFromCfi(loc.start.cfi) * 100);
              saveReadingProgressDebounced({
                lastReadCfi: loc.start.cfi,
                readingProgress: pct,
                lastReadAt: new Date().toISOString()
              });
            }
          }
        }).catch(() => {});

      } else {
        body.innerHTML = '<p style="padding:48px;text-align:center;color:#666;">ePub reader engine could not be initialized.</p>';
      }
    } catch (e) {
      console.error('Error rendering EPUB:', e);
      body.innerHTML = '<p style="padding:48px;text-align:center;color:#666;">Failed to load EPUB publication.</p>';
    }
  }
}

function closeReader() {
  const readerPanel = $('readerPanel');
  if (readerPanel) {
    readerPanel.classList.remove('is-controls-hidden');
  }
  isControlsVisible = false;
  const toggleBtn = $('readerControlsToggle');
  if (toggleBtn) {
    toggleBtn.classList.remove('is-active');
  }

  const shortcutsModal = $('shortcutsModal');
  if (shortcutsModal && !shortcutsModal.classList.contains('hidden')) {
    closeModal('shortcutsModal');
  }

  if (isAiSidebarOpen) {
    toggleAiSidebar(false);
  }

  // Flush any pending progress save immediately
  if (progressSaveTimer && currentReaderBook) {
    clearTimeout(progressSaveTimer);
    progressSaveTimer = null;
    const bookId = currentReaderBook.id;
    const progressData = {
      lastReadPage: currentReaderBook.lastReadPage,
      totalPages: currentReaderBook.totalPages,
      readingProgress: currentReaderBook.readingProgress,
      lastReadCfi: currentReaderBook.lastReadCfi,
      lastReadAt: currentReaderBook.lastReadAt,
      status: currentReaderBook.status
    };
    dbUpdateBookProgress(bookId, progressData).catch(() => {});
  }

  $('readerPanel').classList.add('hidden');
  $('readerModeToggle').classList.add('hidden');
  syncAiSidebarBounds();
  document.body.style.overflow = '';
  document.body.classList.remove('reader-open');
  const dockWrap = document.querySelector('.bottom-dock-wrap');
  if (dockWrap) dockWrap.style.display = '';
  window.removeEventListener('keydown', handleReaderKeydown);
  window.removeEventListener('resize', handleWindowResize);

  const body = $('readerBody');

  if (activeBlobUrl) {
    URL.revokeObjectURL(activeBlobUrl);
    activeBlobUrl = null;
  }

  if (currentFlipInstance) {
    try { currentFlipInstance.destroy(); } catch (_) {}
    currentFlipInstance = null;
  }
  renderedPdfPages.clear();
  currentPdfDoc = null;
  currentReaderBook = null;
  currentReaderBlob = null;

  if (currentRendition) {
    try { currentRendition.destroy(); } catch (_) {}
    currentRendition = null;
  }
  if (currentEpub) {
    try { currentEpub.destroy(); } catch (_) {}
    currentEpub = null;
  }

  body.innerHTML = '';

  // Synchronize shelf cards and overview desk cards immediately
  renderCollection();
  renderDashboard();
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Theme Management (Light / Dark Mode)
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function initTheme() {
  const saved = localStorage.getItem('my_little_library_theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = saved ? saved : (prefersDark ? 'dark' : 'light');
  applyTheme(initialTheme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('my_little_library_theme', theme);
  const textEl = $('themeToggleText');
  if (textEl) {
    textEl.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Event Listeners Setup
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
document.addEventListener('DOMContentLoaded', () => {
  // Theme initialization
  initTheme();
  const themeToggle = $('themeToggleBtn');
  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

  const dockThemeToggle = $('dockThemeToggle');
  if (dockThemeToggle) dockThemeToggle.addEventListener('click', toggleTheme);

  const headerAdd = $('headerAddBtn');
  if (headerAdd) headerAdd.addEventListener('click', openAddForm);

  const dockAdd = $('dockAddBtn');
  if (dockAdd) dockAdd.addEventListener('click', openAddForm);

  const dockAbout = $('dockAboutBtn');
  if (dockAbout) dockAbout.addEventListener('click', openAboutModal);

  const headerBrand = $('headerBrand');
  if (headerBrand) headerBrand.addEventListener('click', openAboutModal);

  const aboutClose = $('aboutModalClose');
  if (aboutClose) aboutClose.addEventListener('click', () => closeModal('aboutModal'));

  const checkUpdatesBtn = $('btnCheckUpdates');
  if (checkUpdatesBtn) checkUpdatesBtn.addEventListener('click', checkForUpdates);

  // Navigation
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => showView(btn.dataset.view));
  });

  document.querySelectorAll('.dock-tab').forEach(btn => {
    btn.addEventListener('click', () => showView(btn.dataset.tab));
  });

  const hamburger = $('hamburgerBtn');
  if (hamburger) hamburger.addEventListener('click', openMobileSidebar);

  const sidebarOv = $('sidebarOverlay');
  if (sidebarOv) sidebarOv.addEventListener('click', closeMobileSidebar);

  // Search & Filter
  $('searchInput').addEventListener('input', renderCollection);
  $('filterCategory').addEventListener('change', renderCollection);
  $('filterStatus').addEventListener('change', renderCollection);

  $('clearFiltersBtn').addEventListener('click', () => {
    $('searchInput').value    = '';
    $('filterCategory').value = '';
    $('filterStatus').value   = '';
    renderCollection();
  });

  // Modal triggers
  $('addBookBtn').addEventListener('click', openAddForm);
  $('emptyAddBtn').addEventListener('click', openAddForm);
  $('formModalClose').addEventListener('click', () => closeModal('formModal'));
  $('formCancelBtn').addEventListener('click', () => closeModal('formModal'));
  $('bookForm').addEventListener('submit', handleFormSubmit);

  // File Dropzone
  const dropArea  = $('fileDropArea');
  const fileInput = $('fileInput');

  dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.classList.add('drag-over');
  });

  dropArea.addEventListener('dragleave', () => {
    dropArea.classList.remove('drag-over');
  });

  dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dropArea.classList.remove('drag-over');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      stageFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files[0]) {
      stageFile(fileInput.files[0]);
    }
  });

  $('fileSelRemove').addEventListener('click', (e) => {
    e.stopPropagation();
    resetFileState();
  });

  // Cover Image Input in Modal
  const coverInput = $('coverInput');
  coverInput.addEventListener('change', () => {
    if (coverInput.files && coverInput.files[0]) {
      const imgFile = coverInput.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        pendingCoverData = e.target.result;
        updateCoverPreview(pendingCoverData);
      };
      reader.readAsDataURL(imgFile);
    }
  });

  $('removeCoverBtn').addEventListener('click', () => {
    pendingCoverData = null;
    coverInput.value = '';
    updateCoverPreview(null);
  });

  // Quick Cover Upload Input
  const quickCoverInput = $('quickCoverInput');
  quickCoverInput.addEventListener('change', async () => {
    if (quickCoverInput.files && quickCoverInput.files[0] && quickCoverTargetId) {
      const file = quickCoverInput.files[0];
      const reader = new FileReader();
      reader.onload = async (e) => {
        const coverData = e.target.result;
        const targetBook = books.find(b => b.id === quickCoverTargetId);
        if (targetBook) {
          targetBook.coverImage = coverData;
          await dbSaveBook(targetBook);
          renderCollection();
          renderDashboard();
        }
        quickCoverTargetId = null;
        quickCoverInput.value = '';
      };
      reader.readAsDataURL(file);
    }
  });

  // Action delegation on book grid and active reading desk
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const id     = btn.dataset.id;

    if (action === 'read')   openReader(id);
    if (action === 'edit')   openEditForm(id);
    if (action === 'delete') openDeleteConfirm(id);
    if (action === 'cover') {
      quickCoverTargetId = id;
      quickCoverInput.click();
    }
  });

  // Delete modal
  $('deleteModalClose').addEventListener('click', () => closeModal('deleteModal'));
  $('deleteCancelBtn').addEventListener('click', () => closeModal('deleteModal'));
  $('deleteConfirmBtn').addEventListener('click', handleDeleteConfirm);

  // Reader panel controls
  $('readerCloseBtn').addEventListener('click', closeReader);
  $('readerOverlay').addEventListener('click', closeReader);

  // Edge Controls Toggle Button (Left edge eye button)
  const controlsToggle = $('readerControlsToggle');
  if (controlsToggle) {
    controlsToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleReaderControls();
    });
  }

  // Shortcuts Modal Controls
  const shortcutsBtn = $('readerShortcutsBtn');
  if (shortcutsBtn) {
    shortcutsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openModal('shortcutsModal');
    });
  }
  const shortcutsModalClose = $('shortcutsModalClose');
  if (shortcutsModalClose) {
    shortcutsModalClose.addEventListener('click', () => closeModal('shortcutsModal'));
  }
  const shortcutsCloseBtn = $('shortcutsCloseBtn');
  if (shortcutsCloseBtn) {
    shortcutsCloseBtn.addEventListener('click', () => closeModal('shortcutsModal'));
  }
  const shortcutsModal = $('shortcutsModal');
  if (shortcutsModal) {
    shortcutsModal.addEventListener('click', (e) => {
      if (e.target === shortcutsModal) closeModal('shortcutsModal');
    });
  }

  // AI Companion Controls
  const aiToggleBtn = $('readerAiToggleBtn');
  if (aiToggleBtn) {
    aiToggleBtn.addEventListener('click', () => toggleAiSidebar());
  }

  const aiSelect = $('aiProviderSelect');
  if (aiSelect) {
    aiSelect.addEventListener('change', (e) => {
      switchAiProvider(e.target.value);
    });
  }

  const aiCloseBtn = $('aiCloseBtn');
  if (aiCloseBtn) {
    aiCloseBtn.addEventListener('click', () => toggleAiSidebar(false));
  }

  const aiReloadBtn = $('aiReloadBtn');
  if (aiReloadBtn) {
    aiReloadBtn.addEventListener('click', () => {
      if (window.chrome && window.chrome.webview && typeof window.chrome.webview.postMessage === 'function') {
        window.chrome.webview.postMessage(JSON.stringify({ action: 'reloadAI' }));
      }
    });
  }

  const aiExternalBtn = $('aiExternalBtn');
  if (aiExternalBtn) {
    aiExternalBtn.addEventListener('click', () => {
      const p = AI_PROVIDERS[currentAiProvider];
      if (p) window.open(p.url, '_blank');
    });
  }

  window.addEventListener('beforeunload', () => {
    if (progressSaveTimer && currentReaderBook) {
      clearTimeout(progressSaveTimer);
      progressSaveTimer = null;
      dbUpdateBookProgress(currentReaderBook.id, {
        lastReadPage: currentReaderBook.lastReadPage,
        totalPages: currentReaderBook.totalPages,
        readingProgress: currentReaderBook.readingProgress,
        lastReadCfi: currentReaderBook.lastReadCfi,
        lastReadAt: currentReaderBook.lastReadAt,
        status: currentReaderBook.status
      }).catch(() => {});
    }
  });

  $('btnModeFlip').addEventListener('click', () => {
    if (pdfReaderMode !== 'flip' && currentReaderBlob && currentReaderBook) {
      pdfReaderMode = 'flip';
      $('btnModeFlip').classList.add('is-active');
      $('btnModeScroll').classList.remove('is-active');
      renderPdfViewer(currentReaderBlob, currentReaderBook);
    }
  });

  $('btnModeScroll').addEventListener('click', () => {
    if (pdfReaderMode !== 'scroll' && currentReaderBlob && currentReaderBook) {
      pdfReaderMode = 'scroll';
      $('btnModeScroll').classList.add('is-active');
      $('btnModeFlip').classList.remove('is-active');
      renderPdfViewer(currentReaderBlob, currentReaderBook);
    }
  });

  // Keyboard shortcut: ESC to close modals or reader
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const shortcutsModal = $('shortcutsModal');
      if (shortcutsModal && !shortcutsModal.classList.contains('hidden')) {
        closeModal('shortcutsModal');
      } else if (!$('formModal').classList.contains('hidden')) {
        closeModal('formModal');
      } else if (!$('deleteModal').classList.contains('hidden')) {
        closeModal('deleteModal');
      } else if (!$('aboutModal').classList.contains('hidden')) {
        closeModal('aboutModal');
      } else if (!$('readerPanel').classList.contains('hidden')) {
        closeReader();
      }
    }
  });

  // Dynamic pan cursor indicator when holding Ctrl over reader
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Control') {
      const stage = document.getElementById('flipbookStage');
      if (stage) stage.classList.add('ctrl-active');
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.key === 'Control') {
      const stage = document.getElementById('flipbookStage');
      if (stage) stage.classList.remove('ctrl-active');
    }
  });

  // Boot
  loadData();
});
