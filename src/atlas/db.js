// src/atlas/db.js

const DB_NAME = 'atlas_offline_web';
const DB_VERSION = 1;

let dbPromise = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = request.result;

        // workout sessions
        if (!db.objectStoreNames.contains('sessions')) {
          const store = db.createObjectStore('sessions', {
            keyPath: 'id',
            autoIncrement: true
          });
          store.createIndex('startTime', 'startTime', { unique: false });
        }

        // exercises per session
        if (!db.objectStoreNames.contains('exercises')) {
          const store = db.createObjectStore('exercises', {
            keyPath: 'id',
            autoIncrement: true
          });
          store.createIndex('sessionId', 'sessionId', { unique: false });
          store.createIndex('exerciseName', 'exerciseName', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // personal records
        if (!db.objectStoreNames.contains('prs')) {
          const store = db.createObjectStore('prs', {
            keyPath: 'id',
            autoIncrement: true
          });
          store.createIndex('exerciseName', 'exerciseName', { unique: false });
        }

        // templates
        if (!db.objectStoreNames.contains('workout_templates')) {
          db.createObjectStore('workout_templates', {
            keyPath: 'id',
            autoIncrement: true
          });
        }

        // cardio sessions
        if (!db.objectStoreNames.contains('cardio_sessions')) {
          const store = db.createObjectStore('cardio_sessions', {
            keyPath: 'id',
            autoIncrement: true
          });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
}

/* ---------- SESSIONS ---------- */

export async function insertSession(session) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sessions', 'readwrite');
    const store = tx.objectStore('sessions');
    const req = store.add(session);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function updateSession(session) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sessions', 'readwrite');
    const store = tx.objectStore('sessions');
    const req = store.put(session);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getSessionById(id) {
  const db = await getDB();
  return db.transaction('sessions').objectStore('sessions').get(id);
}

export async function getAllSessions() {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sessions');
    const store = tx.objectStore('sessions');
    const req = store.getAll();
    req.onsuccess = () => {
      resolve(req.result || []);
    };
    req.onerror = () => reject(req.error);
  });
}


// workouts count
export async function getTotalWorkoutCount() {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sessions');
    const store = tx.objectStore('sessions');
    const req = store.count();
    req.onsuccess = () => resolve(req.result || 0);
    req.onerror = () => reject(req.error);
  });
}

// total time
export async function getTotalWorkoutTime() {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sessions');
    const store = tx.objectStore('sessions');
    const req = store.getAll();
    req.onsuccess = () => {
      const all = req.result || [];
      const total = all.reduce((sum, s) => sum + (s.totalDuration || 0), 0);
      resolve(total);
    };
    req.onerror = () => reject(req.error);
  });
}

// total volume
export async function getTotalVolume() {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sessions');
    const store = tx.objectStore('sessions');
    const req = store.getAll();
    req.onsuccess = () => {
      const all = req.result || [];
      const total = all.reduce((sum, s) => sum + (s.totalVolume || 0), 0);
      resolve(total);
    };
    req.onerror = () => reject(req.error);
  });
}


/* ---------- EXERCISES ---------- */

export async function insertExercise(ex) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('exercises', 'readwrite');
    const store = tx.objectStore('exercises');
    const req = store.add(ex);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getRecentExercises(limit) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('exercises');
    const store = tx.objectStore('exercises');
    const req = store.getAll();
    req.onsuccess = () => {
      const all = req.result || [];
      const sorted = all
        .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
        .slice(0, limit);
      resolve(sorted);
    };
    req.onerror = () => reject(req.error);
  });
}


/* ---------- PRs ---------- */

export async function insertPR(pr) {
  const db = await getDB();
  const store = db.transaction('prs', 'readwrite').objectStore('prs');
  return new Promise((resolve, reject) => {
    const req = store.add(pr);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getPRForExercise(exerciseName) {
  const db = await getDB();
  const tx = db.transaction('prs');
  const store = tx.objectStore('prs');
  const index = store.index('exerciseName');
  return new Promise((resolve, reject) => {
    const req = index.getAll(exerciseName);
    req.onsuccess = () => {
      const list = req.result || [];
      if (!list.length) {
        resolve(null);
        return;
      }
      list.sort((a, b) => (b.oneRepMax || 0) - (a.oneRepMax || 0));
      resolve(list[0]);
    };
    req.onerror = () => reject(req.error);
  });
}

// total PRs
export async function getTotalPRCount() {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('prs');
    const store = tx.objectStore('prs');
    const req = store.count();
    req.onsuccess = () => resolve(req.result || 0);
    req.onerror = () => reject(req.error);
  });
}

/* ---------- TEMPLATES ---------- */

export async function insertTemplate(template) {
  const db = await getDB();
  await db.transaction('workout_templates', 'readwrite')
    .objectStore('workout_templates')
    .add(template);
}

export async function getAllTemplates() {
  const db = await getDB();
  return db.transaction('workout_templates')
    .objectStore('workout_templates')
    .getAll();
}

export async function deleteTemplate(id) {
  const db = await getDB();
  await db.transaction('workout_templates', 'readwrite')
    .objectStore('workout_templates')
    .delete(id);
}

/* ---------- CARDIO ---------- */

export async function insertCardio(cardio) {
  const db = await getDB();
  await db.transaction('cardio_sessions', 'readwrite')
    .objectStore('cardio_sessions')
    .add(cardio);
}

export async function getRecentCardio(limit) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cardio_sessions');
    const store = tx.objectStore('cardio_sessions');
    const req = store.getAll();
    req.onsuccess = () => {
      const all = req.result || [];
      const sorted = all
        .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
        .slice(0, limit);
      resolve(sorted);
    };
    req.onerror = () => reject(req.error);
  });
}

