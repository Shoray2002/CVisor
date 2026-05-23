const DB_NAME = 'cvisor';
const DB_VERSION = 1;
const STORE_ROSTER = 'roster';
const STORE_EVENTS = 'events';

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_ROSTER)) {
        db.createObjectStore(STORE_ROSTER, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(STORE_EVENTS)) {
        const evt = db.createObjectStore(STORE_EVENTS, { keyPath: 'id', autoIncrement: true });
        evt.createIndex('by-ts', 'ts');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(store, mode) {
  return openDB().then((db) => db.transaction(store, mode).objectStore(store));
}

function reqAsPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function listRoster() {
  const store = await tx(STORE_ROSTER, 'readonly');
  const all = await reqAsPromise(store.getAll());
  // embedding may have been stored as a plain object; rehydrate to Float32Array
  return all.map((entry) => ({
    ...entry,
    embedding:
      entry.embedding instanceof Float32Array
        ? entry.embedding
        : new Float32Array(Object.values(entry.embedding)),
  }));
}

export async function addToRoster({ name, embedding, thumbnail }) {
  const store = await tx(STORE_ROSTER, 'readwrite');
  const id = await reqAsPromise(
    store.add({
      name,
      embedding,
      thumbnail,
      createdAt: new Date(),
    }),
  );
  return id;
}

export async function deleteFromRoster(id) {
  const store = await tx(STORE_ROSTER, 'readwrite');
  await reqAsPromise(store.delete(id));
}

export async function renameRosterEntry(id, name) {
  const store = await tx(STORE_ROSTER, 'readwrite');
  const entry = await reqAsPromise(store.get(id));
  if (!entry) return;
  entry.name = name;
  await reqAsPromise(store.put(entry));
}

export async function appendEvent({ kind, trackId, identityId = null, name = null, thumbnail }) {
  const store = await tx(STORE_EVENTS, 'readwrite');
  return reqAsPromise(
    store.add({
      kind,
      trackId,
      identityId,
      name,
      thumbnail,
      ts: new Date(),
    }),
  );
}

export async function listEvents({ limit = 100 } = {}) {
  const store = await tx(STORE_EVENTS, 'readonly');
  const index = store.index('by-ts');
  return new Promise((resolve, reject) => {
    const results = [];
    const req = index.openCursor(null, 'prev');
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor && results.length < limit) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        resolve(results);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export async function clearEvents() {
  const store = await tx(STORE_EVENTS, 'readwrite');
  await reqAsPromise(store.clear());
}
