/**
 * My Little Library — script.js
 * Editorial black & white desktop edition with IndexedDB persistence and offline reader.
 */

/* ─────────────────────────────────────────────
   Constants
   ───────────────────────────────────────────── */
const CATEGORIES = ['Psychology', 'Philosophy', 'Literature', 'Cinema', 'Technology', 'Other'];

const STATUS_CLASS = {
  'Want to Read': 'badge-status-want',
  'Reading':      'badge-status-reading',
  'Finished':     'badge-status-finished',
};

/* ─────────────────────────────────────────────
   State
   ───────────────────────────────────────────── */
let books           = [];   // array of book metadata objects
let editingId       = null;
let pendingDeleteId = null;
let currentView     = 'dashboard';
let pendingFile     = null; // { file, type, name, size }
let currentEpub     = null; // epub.js Book instance
let currentRendition= null;
let activeBlobUrl   = null;

/* ─────────────────────────────────────────────
   Initialization & Persistence
   ───────────────────────────────────────────── */
async function loadData() {
  try {
    // Attempt legacy migration if localStorage contains old data
    await dbMigrateLegacyLocalStorage();

    // Load metadata from IndexedDB
    books = await dbGetAllBooks();
  } catch (err) {
    console.error('Failed to load books from IndexedDB:', err);
    books = [];
  }

  renderDashboard();
  renderCollection();
}

/* ─────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────
   Navigation
   ───────────────────────────────────────────── */
function showView(viewName) {
  currentView = viewName;
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));

  const activeView = $('view-' + viewName);
  if (activeView) activeView.classList.remove('hidden');

  const activeBtn = document.querySelector(`.nav-item[data-view="${viewName}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  closeMobileSidebar();

  if (viewName === 'dashboard')  renderDashboard();
  if (viewName === 'collection') renderCollection();
}

function openMobileSidebar() {
  $('sidebar').classList.add('open');
  $('sidebarOverlay').classList.add('open');
}

function closeMobileSidebar() {
  $('sidebar').classList.remove('open');
  $('sidebarOverlay').classList.remove('open');
}

/* ─────────────────────────────────────────────
   Dashboard Rendering (Editorial Reading Desk)
   ───────────────────────────────────────────── */
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
      card.innerHTML = `
        <div class="desk-card-body">
          <h3 class="desk-card-title">${esc(book.title)}</h3>
          <p class="desk-card-author">${esc(book.author || 'Unknown author')}</p>
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
    item.innerHTML = `
      <div class="recent-info">
        <span class="recent-title">${esc(book.title)}</span>
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

/* ─────────────────────────────────────────────
   Collection Rendering
   ───────────────────────────────────────────── */
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

  const fileTypeBadge = book.fileType
    ? `<span class="badge badge-file">${book.fileType.toUpperCase()}</span>`
    : '';

  const notesHtml = book.notes
    ? `<div class="book-notes">${esc(book.notes)}</div>`
    : '';

  const readAction =
    `<button class="book-read-btn" data-action="read" data-id="${esc(book.id)}">Read Document</button>`;

  card.innerHTML = `
    <div>
      <div class="book-card-header">
        <div>
          <h3 class="book-title">${esc(book.title)}</h3>
          <p class="book-author">${esc(book.author || 'Unknown author')}</p>
        </div>
        <div class="book-actions">
          <button class="icon-btn" data-action="edit" data-id="${esc(book.id)}" title="Edit book" aria-label="Edit ${esc(book.title)}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="icon-btn icon-btn--danger" data-action="delete" data-id="${esc(book.id)}" title="Remove book" aria-label="Remove ${esc(book.title)}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
      <div class="book-card-meta">
        ${fileTypeBadge}
        <span class="badge badge-category">${esc(book.category)}</span>
        <span class="badge ${STATUS_CLASS[book.status] || ''}">${esc(book.status)}</span>
      </div>
      ${notesHtml}
    </div>
    <div style="margin-top: 18px;">
      ${readAction}
    </div>
  `;

  return card;
}

/* ─────────────────────────────────────────────
   File Upload Handling
   ───────────────────────────────────────────── */
function resetFileState() {
  pendingFile = null;
  $('fileDropInner').classList.remove('hidden');
  $('fileSelected').classList.add('hidden');
  $('errFile').textContent = '';
  $('uploadProgress').classList.add('hidden');
  $('uploadBar').style.width = '0%';
  $('fileInput').value = '';
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

  // Auto-fill title if blank
  const nameWithoutExt = file.name.replace(/\.(pdf|epub)$/i, '');
  if (!$('fieldTitle').value.trim()) {
    $('fieldTitle').value = nameWithoutExt;
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

/* ─────────────────────────────────────────────
   Form Modals
   ───────────────────────────────────────────── */
function openModal(id) {
  $(id).classList.remove('hidden');
}

function closeModal(id) {
  $(id).classList.add('hidden');
}

function openAddForm() {
  editingId = null;
  pendingFile = null;
  $('formModalTitle').textContent = 'Add Book';
  $('formSaveBtn').textContent    = 'Save Book';
  $('bookForm').reset();
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
  $('formModalTitle').textContent = 'Edit Book';
  $('formSaveBtn').textContent    = 'Save Changes';

  $('bookId').value        = book.id;
  $('fieldTitle').value    = book.title;
  $('fieldAuthor').value   = book.author || '';
  $('fieldCategory').value = book.category;
  $('fieldStatus').value   = book.status;
  $('fieldNotes').value    = book.notes || '';

  $('fileUploadGroup').classList.add('hidden');

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

  const fields = [
    { input: 'fieldTitle',    error: 'errTitle',    label: 'Title' },
    { input: 'fieldCategory', error: 'errCategory', label: 'Subject' },
    { input: 'fieldStatus',   error: 'errStatus',   label: 'Reading status' },
  ];

  fields.forEach(({ input, error, label }) => {
    const el  = $(input);
    const val = el.value.trim();
    if (!val) {
      $(error).textContent = label + ' is required.';
      el.classList.add('is-error');
      valid = false;
    } else {
      $(error).textContent = '';
      el.classList.remove('is-error');
    }
  });

  return valid;
}

async function handleFormSubmit(e) {
  e.preventDefault();
  if (!validateForm()) return;

  const title    = $('fieldTitle').value.trim();
  const author   = $('fieldAuthor').value.trim();
  const category = $('fieldCategory').value;
  const status   = $('fieldStatus').value;
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

/* ─────────────────────────────────────────────
   Delete Confirmation
   ───────────────────────────────────────────── */
function openDeleteConfirm(id) {
  const book = books.find(b => b.id === id);
  if (!book) return;
  pendingDeleteId = id;
  $('deleteBookTitle').textContent = book.title;
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

/* ─────────────────────────────────────────────
   Integrated Reader (PDF & ePub)
   ───────────────────────────────────────────── */
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

  $('readerTitle').textContent  = book.title;
  $('readerAuthor').textContent = book.author || 'Unknown author';

  const body = $('readerBody');
  body.innerHTML = '';

  if (activeBlobUrl) {
    URL.revokeObjectURL(activeBlobUrl);
    activeBlobUrl = null;
  }

  activeBlobUrl = URL.createObjectURL(fileRecord.blob);

  if (book.fileType === 'pdf') {
    const iframe = document.createElement('iframe');
    iframe.src = activeBlobUrl;
    iframe.title = book.title;
    body.appendChild(iframe);

    $('readerOpenExternal').onclick = () => window.open(activeBlobUrl, '_blank');

  } else if (book.fileType === 'epub') {
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
        currentRendition.display();

        prevBtn.onclick = () => currentRendition.prev();
        nextBtn.onclick = () => currentRendition.next();
      } else {
        body.innerHTML = '<p style="padding:48px;text-align:center;color:#666;">ePub reader engine could not be initialized.</p>';
      }
    } catch (e) {
      console.error('Error rendering EPUB:', e);
      body.innerHTML = '<p style="padding:48px;text-align:center;color:#666;">Failed to load EPUB publication.</p>';
    }

    $('readerOpenExternal').onclick = () => window.open(activeBlobUrl, '_blank');
  }

  $('readerPanel').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeReader() {
  $('readerPanel').classList.add('hidden');
  document.body.style.overflow = '';

  const body = $('readerBody');

  if (activeBlobUrl) {
    URL.revokeObjectURL(activeBlobUrl);
    activeBlobUrl = null;
  }

  if (currentRendition) {
    try { currentRendition.destroy(); } catch (_) {}
    currentRendition = null;
  }
  if (currentEpub) {
    try { currentEpub.destroy(); } catch (_) {}
    currentEpub = null;
  }

  body.innerHTML = '';
}

/* ─────────────────────────────────────────────
   Event Listeners Setup
   ───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Navigation
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => showView(btn.dataset.view));
  });

  $('hamburgerBtn').addEventListener('click', openMobileSidebar);
  $('sidebarOverlay').addEventListener('click', closeMobileSidebar);

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

  // Action delegation on book grid and active reading desk
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const id     = btn.dataset.id;

    if (action === 'read')   openReader(id);
    if (action === 'edit')   openEditForm(id);
    if (action === 'delete') openDeleteConfirm(id);
  });

  // Delete modal
  $('deleteModalClose').addEventListener('click', () => closeModal('deleteModal'));
  $('deleteCancelBtn').addEventListener('click', () => closeModal('deleteModal'));
  $('deleteConfirmBtn').addEventListener('click', handleDeleteConfirm);

  // Reader panel
  $('readerCloseBtn').addEventListener('click', closeReader);
  $('readerOverlay').addEventListener('click', closeReader);

  // Keyboard shortcut: ESC to close modals or reader
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!$('readerPanel').classList.contains('hidden')) {
        closeReader();
      } else if (!$('formModal').classList.contains('hidden')) {
        closeModal('formModal');
      } else if (!$('deleteModal').classList.contains('hidden')) {
        closeModal('deleteModal');
      }
    }
  });

  // Boot
  loadData();
});
