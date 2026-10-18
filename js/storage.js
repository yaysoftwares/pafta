/* Kalıcılık adaptörü arayüzü: her ikiside async get/set/remove(key) sunar.
 *
 * MemoryAdapter: testlerde kullanılır (jsdom'da gerçek IndexedDB yok).
 * IdbAdapter:    üretim varsayılanı. Veritabanı 'pafta', nesne mağazası 'kv';
 *                tüm proje durumu tek anahtar 'screenshot-framer-store' altında
 *                JSON olarak saklanır.
 */

export const STORAGE_KEY = 'screenshot-framer-store';

export class MemoryAdapter {
  constructor() {
    this._map = new Map();
  }

  async get(key) {
    return this._map.has(key) ? this._map.get(key) : null;
  }

  async set(key, value) {
    this._map.set(key, value);
  }

  async remove(key) {
    this._map.delete(key);
  }
}

export class IdbAdapter {
  constructor(dbName = 'pafta', storeName = 'kv') {
    this._dbName = dbName;
    this._storeName = storeName;
    this._db = null;
  }

  async _open() {
    if (this._db) return this._db;
    this._db = await new Promise((resolve, reject) => {
      const req = indexedDB.open(this._dbName, 1);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this._storeName)) {
          db.createObjectStore(this._storeName);
        }
      };
    });
    return this._db;
  }

  async get(key) {
    const db = await this._open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this._storeName, 'readonly');
      const req = tx.objectStore(this._storeName).get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  }

  async set(key, value) {
    const db = await this._open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this._storeName, 'readwrite');
      const req = tx.objectStore(this._storeName).put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async remove(key) {
    const db = await this._open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this._storeName, 'readwrite');
      const req = tx.objectStore(this._storeName).delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}
