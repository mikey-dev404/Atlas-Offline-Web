import { openDB } from 'idb';

let dbPromise = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB('atlas_database', 3, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore('workout_sessions', { keyPath: 'id', autoIncrement: true });
          db.createObjectStore('exercises', { keyPath: 'id', autoIncrement: true });
          db.createObjectStore('cardio_sessions', { keyPath: 'id', autoIncrement: true });
          db.createObjectStore('body_measurements', { keyPath: 'id', autoIncrement: true });
          db.createObjectStore('personal_records', { keyPath: 'id', autoIncrement: true });
          db.createObjectStore('workout_templates', { keyPath: 'id', autoIncrement: true });
          db.createObjectStore('achievements', { keyPath: 'id', autoIncrement: true });
          db.createObjectStore('rest_timers', { keyPath: 'exerciseName' });
        }
      }
    });
  }
  return dbPromise;
}

// Sessions
export async function insertSession(session) {
  const db = await getDB();
  const id = await db.add('workout_sessions', session);
  return id;
}

export async function updateSession(session) {
  const db = await getDB();
  await db.put('workout_sessions', session);
}

export async function getAllSessions() {
  const db = await getDB();
  return db.getAll('workout_sessions');
}

export async function getTotalWorkoutCount() {
  const sessions = await getAllSessions();
  return sessions.filter((s) => s.endTime && s.endTime !== '').length;
}

export async function getTotalWorkoutTime() {
  const sessions = await getAllSessions();
  return sessions
    .filter((s) => s.endTime && s.endTime !== '')
    .reduce((sum, s) => sum + (s.totalDuration || 0), 0);
}

export async function getTotalVolume() {
  const sessions = await getAllSessions();
  const byDate = new Map();
  sessions
    .filter((s) => s.endTime && s.endTime !== '')
    .forEach((s) => {
      const date = s.startTime.substring(0, 10);
      const existing = byDate.get(date);
      if (!existing || (existing.id || 0) < (s.id || 0)) {
        byDate.set(date, s);
      }
    });
  let total = 0;
  byDate.forEach((s) => {
    total += s.totalVolume || 0;
  });
  return total;
}

// Exercises
export async function insertExercise(exercise) {
  const db = await getDB();
  await db.add('exercises', exercise);
}

export async function getRecentExercises(limit) {
  const db = await getDB();
  const all = await db.getAll('exercises');
  return all.sort((a, b) => (b.id || 0) - (a.id || 0)).slice(0, limit);
}

// PRs
export async function getPRForExercise(exerciseName) {
  const db = await getDB();
  const all = await db.getAll('personal_records');
  return all.find((p) => p.exerciseName === exerciseName);
}

export async function insertPR(pr) {
  const db = await getDB();
  await db.put('personal_records', pr);
}

export async function getTotalPRCount() {
  const db = await getDB();
  const all = await db.getAll('personal_records');
  return all.length;
}
// Templates
export async function insertTemplate(template) {
  const db = await getDB();
  await db.add('workout_templates', template);
}
export async function getAllTemplates() {
  const db = await getDB();
  return db.getAll('workout_templates');
}
export async function deleteTemplate(id) {
  const db = await getDB();
  await db.delete('workout_templates', id);
}
// Cardio
export async function insertCardio(cardio) {
  const db = await getDB();
  await db.add('cardio_sessions', cardio);
}

export async function getRecentCardio(limit) {
  const db = await getDB();
  const all = await db.getAll('cardio_sessions');
  return all
    .sort((a, b) => (b.id || 0) - (a.id || 0))
    .slice(0, limit);
}

