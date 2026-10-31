/**
 * My Little Library — script.js
 * Windows Desktop Edition with IndexedDB persistence and offline reader.
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

  // Close mobile sidebar if open
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
   Dashboard Rendering
   ───────────────────────────────────────────── */
function renderDashboard() {
  const total = books.length;
  const want     = books.filter(b => b.status === 'Want to Read').length;
  const reading  = books.filter(b => b.status === 'Reading').length;
  const finished = books.filter(b => b.status === 'Finished').length;

  $('statTotal').textContent    = total;
  $('statWant').textContent     = want;
  $('statReading').textContent  = reading;
  $('statFinished').textContent = finished;

  // Category distribution bars
  const catContainer = $('categoryBars');
  catContainer.innerHTML = '';

  CATEGORIES.forEach(cat => {
    const count = books.filter(b => b.category === cat).length;
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;

    const row = document.createElement('div');
    row.className = 'category-bar-row';
    row.innerHTML =
      '<div class="cat-bar-header">' +
        '<span class="cat-bar-name">' + esc(cat) + '</span>' +
        '<span class="cat-bar-count">' + count + ' (' + pct + '%)</span>' +
      '</div>' +
      '<div class="cat-bar-track">' +
        '<div class="cat-bar-fill cat-bar-fill--' + cat.toLowerCase() + '" style="width:' + pct + '%"></div>' +
      '</div>';
    catContainer.appendChild(row);
  });

  // Recently added books (max 5)
  const recentContainer = $('recentList');
  recentContainer.innerHTML = '';

  const recent = [...books]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);

  if (recent.length === 0) {
    recentContainer.innerHTML = '<p class="recent-empty">No books added yet.</p>';
    return;
  }

  recent.forEach(book => {
    const item = document.createElement('div');
    item.className = 'recent-item';
    item.innerHTML =
      '<div class="recent-info">' +
        '<span class="recent-title">' + esc(book.title) + '</span>' +
        '<span class="recent-author">' + esc(book.author || 'Unknown author') + '</span>' +
      '</div>' +
      '<div class="recent-meta">' +
        '<span class="badge badge-category">' + esc(book.category) + '</span>' +
        '<span class="badge ' + (STATUS_CLASS[book.status] || '') + '">' + esc(book.status) + '</span>' +
      '</div>';
    recentContainer.appendChild(item);
  });
}

/* ─────────────────────────────────────────────
   Collection & Filter Rendering
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
      if (!inTitle && !inAuthor) return false;
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
      $('emptyTitle').textContent = 'No books match your search.';
      $('emptySub').textContent   = 'Try adjusting the search or filters.';
      $('emptyAddBtn').classList.add('hidden');
    } else {
      $('emptyTitle').textContent = 'Your library is empty.';
      $('emptySub').textContent   = 'Upload a PDF or ePub to get started.';
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
    ? '<span class="badge badge-file badge-file-' + book.fileType + '">' + book.fileType.toUpperCase() + '</span>'
    : '';

  const notesHtml = book.notes
    ? '<div class="book-notes">' + esc(book.notes) + '</div>'
    : '';

  const readAction =
    '<button class="book-read-btn" data-action="read" data-id="' + esc(book.id) + '">&#128214; Read</button>';

  card.innerHTML =
    '<div class="book-card-header">' +
      '<div class="book-title">' + esc(book.title) + '</div>' +
      '<div class="book-actions">' +
        '<button class="icon-btn" data-action="edit" data-id="' + esc(book.id) + '" title="Edit" aria-label="Edit ' + esc(book.title) + '">&#9998;</button>' +
        '<button class="icon-btn icon-btn--danger" data-action="delete" data-id="' + esc(book.id) + '" title="Delete" aria-label="Delete ' + esc(book.title) + '">&#128465;</button>' +
      '</div>' +
    '</div>' +
    '<div class="book-author">' + esc(book.author || 'Unknown author') + '</div>' +
    '<div class="book-card-meta">' +
      fileTypeBadge +
      '<span class="badge badge-category">' + esc(book.category) + '</span>' +
      '<span class="badge ' + (STATUS_CLASS[book.status] || '') + '">' + esc(book.status) + '</span>' +
    '</div>' +
    notesHtml +
    readAction;

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
    $('errFile').textContent = 'Only PDF and ePub files are supported.';
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

  // Quick visual feedback
  $('uploadProgress').classList.remove('hidden');
  $('uploadBar').style.width = '100%';
  setTimeout(() => $('uploadProgress').classList.add('hidden'), 300);

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

  // Preserve file when editing metadata
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
    { input: 'fieldCategory', error: 'errCategory', label: 'Category' },
    { input: 'fieldStatus',   error: 'errStatus',   label: 'Status' },
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

      // Save file blob to IndexedDB
      await dbSaveFile(id, pendingFile.file, pendingFile.type, pendingFile.name, pendingFile.size);

      // Save metadata
      await dbSaveBook(newBook);
      books.push(newBook);
    }

    closeModal('formModal');
    renderCollection();
    renderDashboard();
  } catch (err) {
    console.error('Save failed:', err);
    alert('Failed to save book. Storage might be restricted.');
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
    alert('Could not delete the book. Please try again.');
  }
}

/* ─────────────────────────────────────────────
   Offline Reader (PDF & ePub)
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
  $('readerAuthor').textContent = book.author || '';

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

    // Prev / Next controls
    const prevBtn = document.createElement('button');
    prevBtn.className = 'epub-nav epub-prev';
    prevBtn.innerHTML = '&#8249;';
    prevBtn.title = 'Previous page';

    const nextBtn = document.createElement('button');
    nextBtn.className = 'epub-nav epub-next';
    nextBtn.innerHTML = '&#8250;';
    nextBtn.title = 'Next page';

    body.appendChild(prevBtn);
    body.appendChild(nextBtn);

    // Clean previous instances
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
        body.innerHTML = '<p style="color:#fff;padding:40px;text-align:center;">ePub reader library not available.</p>';
      }
    } catch (e) {
      console.error('Error rendering EPUB:', e);
      body.innerHTML = '<p style="color:#fff;padding:40px;text-align:center;">Failed to render EPUB file.</p>';
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

  // File Drop area
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

  // Book action delegation (read / edit / delete)
  $('bookGrid').addEventListener('click', (e) => {
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

  // Keyboard shortcut ESC to close modals or reader
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

  // Start app
  loadData();
});
