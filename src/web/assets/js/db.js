/**
 * My Little Library — IndexedDB Storage Engine (db.js)
 * Provides robust, asynchronous persistence for book metadata and large binary documents (PDF & EPUB).
 */

const DB_NAME = 'MyLittleLibraryDB';
const DB_VERSION = 1;
const STORE_BOOKS = 'books';
const STORE_FILES = 'files';

let dbInstance = null;

/**
 * Open or initialize the IndexedDB instance.
 * @returns {Promise<IDBDatabase>}
 */
function openDB() {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Metadata store
      if (!db.objectStoreNames.contains(STORE_BOOKS)) {
        const bookStore = db.createObjectStore(STORE_BOOKS, { keyPath: 'id' });
        bookStore.createIndex('category', 'category', { unique: false });
        bookStore.createIndex('status', 'status', { unique: false });
        bookStore.createIndex('addedAt', 'addedAt', { unique: false });
      }

      // Binary files store (Blobs/ArrayBuffers for PDF and EPUB)
      if (!db.objectStoreNames.contains(STORE_FILES)) {
        db.createObjectStore(STORE_FILES, { keyPath: 'bookId' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Fetch all book metadata records.
 * @returns {Promise<Array>}
 */
async function dbGetAllBooks() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_BOOKS, 'readonly');
    const store = tx.objectStore(STORE_BOOKS);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save or update a book metadata record.
 * @param {Object} book 
 * @returns {Promise<void>}
 */
async function dbSaveBook(book) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_BOOKS, 'readwrite');
    const store = tx.objectStore(STORE_BOOKS);
    const request = store.put(book);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete a book and its corresponding document file.
 * @param {string} bookId 
 * @returns {Promise<void>}
 */
async function dbDeleteBook(bookId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_BOOKS, STORE_FILES], 'readwrite');
    const bookStore = tx.objectStore(STORE_BOOKS);
    const fileStore = tx.objectStore(STORE_FILES);

    bookStore.delete(bookId);
    fileStore.delete(bookId);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Store binary document file.
 * @param {string} bookId 
 * @param {Blob|File} fileBlob 
 * @param {string} fileType ('pdf' | 'epub')
 * @param {string} fileName 
 * @param {number} fileSize 
 * @returns {Promise<void>}
 */
async function dbSaveFile(bookId, fileBlob, fileType, fileName, fileSize) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_FILES, 'readwrite');
    const store = tx.objectStore(STORE_FILES);
    const record = {
      bookId,
      blob: fileBlob,
      fileType,
      fileName,
      fileSize,
      savedAt: new Date().toISOString()
    };
    const request = store.put(record);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieve document file record.
 * @param {string} bookId 
 * @returns {Promise<Object|null>}
 */
async function dbGetFile(bookId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_FILES, 'readonly');
    const store = tx.objectStore(STORE_FILES);
    const request = store.get(bookId);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Helper to convert Base64 dataURL to Blob.
 * @param {string} dataURL 
 * @returns {Blob}
 */
function dataURLToBlob(dataURL) {
  const parts = dataURL.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
}

/**
 * Automatically migrate legacy localStorage data (if present) to IndexedDB.
 * @returns {Promise<boolean>} True if migration occurred
 */
async function dbMigrateLegacyLocalStorage() {
  const STORAGE_KEY = 'myLittleLibrary_books';
  const FILE_STORAGE_KEY = 'myLittleLibrary_files';

  let rawBooks = null;
  let rawFiles = null;

  try {
    rawBooks = localStorage.getItem(STORAGE_KEY);
    rawFiles = localStorage.getItem(FILE_STORAGE_KEY);
  } catch (e) {
    console.warn('Could not read localStorage for migration:', e);
    return false;
  }

  if (!rawBooks) return false;

  try {
    const books = JSON.parse(rawBooks);
    const files = rawFiles ? JSON.parse(rawFiles) : {};

    if (Array.isArray(books) && books.length > 0) {
      console.log(`Migrating ${books.length} books from localStorage to IndexedDB...`);
      for (const book of books) {
        await dbSaveBook(book);

        if (files && files[book.id]) {
          const dataURL = files[book.id];
          const blob = dataURLToBlob(dataURL);
          await dbSaveFile(book.id, blob, book.fileType || 'pdf', book.fileName, blob.size);
        }
      }

      // Cleanup localStorage after successful migration
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(FILE_STORAGE_KEY);
      console.log('Migration to IndexedDB completed successfully.');
      return true;
    }
  } catch (err) {
    console.error('Error during localStorage migration to IndexedDB:', err);
  }

  return false;
}
