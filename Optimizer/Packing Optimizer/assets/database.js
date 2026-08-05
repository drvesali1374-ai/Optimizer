var LocalDB = (function() {
  const DB_NAME = 'PackingOptimizerLocal';
  const DB_VERSION = 1;
  const STORE_NAME = 'settings';

  let dbPromise = null;

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (event) => reject(event.target.error);
    });
    return dbPromise;
  }

  async function getSetting(key) {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result ? req.result.value : undefined);
        req.onerror = (e) => reject(e.target.error);
      });
    } catch (e) {
      console.warn('IndexedDB getSetting error:', e);
      return undefined;   // بازگشت undefined به جای throw
    }
  }

  async function setSetting(key, value) {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put({ id: key, value: value });
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject(e.target.error);
      });
    } catch (e) {
      console.warn('IndexedDB setSetting error:', e);
      // بی‌صدا خطا را می‌بلعیم
    }
  }

  async function saveFileHandle(handle) {
    return setSetting('fileHandle', handle);
  }

  async function getFileHandle() {
    return getSetting('fileHandle');
  }

  async function saveLocalSettings(settings) {
    await setSetting('localSettings', settings);
  }

  async function getLocalSettings() {
    return getSetting('localSettings');
  }

  return {
    saveFileHandle: saveFileHandle,
    getFileHandle: getFileHandle,
    saveLocalSettings: saveLocalSettings,
    getLocalSettings: getLocalSettings
  };
})();