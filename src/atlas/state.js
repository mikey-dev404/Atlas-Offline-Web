// src/atlas/state.js
import {
  insertSession,
  updateSession,
  getSessionById,
  getAllSessions,
  getTotalWorkoutCount,
  getTotalWorkoutTime,
  getTotalVolume,
  insertExercise,
  getRecentExercises,
  getPRForExercise,
  insertPR,
  getTotalPRCount,
  insertTemplate,
  getAllTemplates,
  deleteTemplate,
  insertCardio,
  getRecentCardio
} from './db';

const GreekRanks = [
  { level: 1, title: 'RECRUIT', subtitle: 'Aspiring Warrior', xpRequired: 0 },
  { level: 5, title: 'HOPLITE', subtitle: 'Foot Soldier', xpRequired: 2000 },
  { level: 10, title: 'ENOMOTARCH', subtitle: 'Squad Leader', xpRequired: 5000 },
  { level: 15, title: 'LOCHAGOS', subtitle: 'Captain', xpRequired: 10000 },
  { level: 20, title: 'PENTEKONTER', subtitle: 'Commander of Fifty', xpRequired: 17000 },
  { level: 25, title: 'TAXIARCH', subtitle: 'Regiment Commander', xpRequired: 26000 },
  { level: 30, title: 'STRATEGOS', subtitle: 'General', xpRequired: 37000 },
  { level: 35, title: 'POLEMARCH', subtitle: 'War Leader', xpRequired: 50000 },
  { level: 40, title: 'SPARTAN', subtitle: 'Elite Warrior', xpRequired: 65000 },
  { level: 50, title: 'HERO', subtitle: 'Legendary Fighter', xpRequired: 85000 },
  { level: 60, title: 'DEMIGOD', subtitle: 'Half-Divine', xpRequired: 110000 },
  { level: 75, title: 'TITAN', subtitle: 'Primordial Force', xpRequired: 145000 },
  { level: 100, title: 'OLYMPIAN', subtitle: 'Divine Champion', xpRequired: 200000 }
];

function getRankForLevel(level) {
  return GreekRanks.reduce((acc, r) => (r.level <= level ? r : acc), GreekRanks[0]);
}
function getNextRank(level) {
  return GreekRanks.find((r) => r.level > level);
}

const defaultStats = {
  totalWorkouts: 0,
  totalTime: 0,
  totalExercises: 0,
  currentStreak: 0,
  personalRecords: 0,
  totalVolume: 0,
  level: 1,
  currentXP: 0,
  nextLevelXP: 500,
  rankTitle: 'RECRUIT',
  rankSubtitle: 'Aspiring Warrior'
};

const defaultChart = {
  weeklyWorkouts: {},
  volumeProgress: [],
  muscleGroups: {}
};

export const atlasState = {
  stats: defaultStats,
  chartData: defaultChart,
  recentExercises: [],
  allSessions: [],
  currentSessionId: null,
  workoutStartTime: null,
  activeExercises: [],
  restTimerActive: false,
  restTimeRemaining: 0,
  currentExerciseForTimer: null,
  newPRDetected: null,
  templates: [],
  cardioSessions: []
};

const listeners = new Set();
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function notify() {
  listeners.forEach((fn) => fn());
}

function calculateLevelFromXP(xp) {
  if (xp < 500) return 1;
  if (xp < 1000) return 2;
  if (xp < 2000) return 3 + Math.floor((xp - 1000) / 500);
  if (xp < 5000) return 5 + Math.floor((xp - 2000) / 600);
  if (xp < 10000) return 10 + Math.floor((xp - 5000) / 800);
  if (xp < 20000) return 15 + Math.floor((xp - 10000) / 1000);
  if (xp < 40000) return 20 + Math.floor((xp - 20000) / 1500);
  if (xp < 70000) return 30 + Math.floor((xp - 40000) / 2000);
  if (xp < 110000) return 40 + Math.floor((xp - 70000) / 2500);
  return Math.min(100, 50 + Math.floor((xp - 110000) / 3000));
} 

function calculateWorkoutXP(exercises, sets, volume, durationMinutes) {
  if (!exercises || !sets) return 0;
  let xp = 0;
  xp += exercises * 20;
  xp += sets * 5;
  xp += Math.floor(volume / 10);
  xp += Math.floor(Math.min(durationMinutes, 60) * 2);
  if (durationMinutes >= 20 && exercises >= 3) xp += 50;
  return xp;
}

export async function loadStats() {
  const totalWorkouts = await getTotalWorkoutCount();
  const totalTime = (await getTotalWorkoutTime()) || 0;
  const totalVolume = (await getTotalVolume()) || 0;
  const totalPRs = await getTotalPRCount();

  let sessions = await getAllSessions();
  if (!Array.isArray(sessions)) sessions = [];

  atlasState.allSessions = sessions;

  let totalXP = 0;
  sessions
    .filter((s) => s.endTime && s.totalExercises > 0)
    .forEach((s) => {
      totalXP += calculateWorkoutXP(
        s.totalExercises,
        s.totalSets || s.totalExercises * 3,
        s.totalVolume || 0,
        s.totalDuration || 0
      );
    });

  const level = calculateLevelFromXP(totalXP);
  const currentRank = getRankForLevel(level);
  const nextRank = getNextRank(level);

  atlasState.stats = {
    ...defaultStats,
    totalWorkouts,
    totalTime,
    totalVolume,
    personalRecords: totalPRs,
    level,
    currentXP: totalXP,
    nextLevelXP: nextRank ? nextRank.xpRequired : totalXP + 1000,
    rankTitle: currentRank.title,
    rankSubtitle: currentRank.subtitle
  };

  const weeklyWorkouts = {};
  const volumeProgress = [];
  sessions.forEach((s) => {
    if (!s.endTime) return;
    const date = (s.startTime || '').substring(0, 10);
    const d = new Date(date);
    const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
    weeklyWorkouts[weekday] = (weeklyWorkouts[weekday] || 0) + 1;
    volumeProgress.push([date, s.totalVolume || 0]);
  });

  const muscleGroups = {};
  const allExercises = await getRecentExercises(500);
  allExercises.forEach((e) => {
    const name = (e.exerciseName || '').toLowerCase();
    let group = 'Full Body';
    if (name.includes('squat') || name.includes('leg') || name.includes('deadlift'))
      group = 'Lower';
    else if (name.includes('bench') || name.includes('press') || name.includes('row'))
      group = 'Upper';
    else if (name.includes('curl') || name.includes('tricep'))
      group = 'Arms';
    else if (name.includes('lat') || name.includes('pulldown') || name.includes('pull-up'))
      group = 'Back';
    muscleGroups[group] = (muscleGroups[group] || 0) + 1;
  });

  atlasState.chartData = { weeklyWorkouts, volumeProgress, muscleGroups };
  notify();
}

export async function loadRecentData() {
  atlasState.recentExercises = await getRecentExercises(10);
  notify();
}
export async function loadTemplates() {
  atlasState.templates = await getAllTemplates();
  notify();
}
export async function loadCardio() {
  atlasState.cardioSessions = await getRecentCardio(20);
  notify();
}

export async function startWorkout() {
  const now = new Date().toISOString();
  const id = await insertSession({
    startTime: now,
    endTime: '',
    totalDuration: 0,
    totalExercises: 0,
    totalSets: 0,
    totalVolume: 0,
    notes: ''
  });
  atlasState.currentSessionId = id;
  atlasState.workoutStartTime = now;
  atlasState.activeExercises = [];
  notify();
}

export async function finishWorkout() {
  const id = atlasState.currentSessionId;
  const startIso = atlasState.workoutStartTime;

  if (!id) return; // allow missing startIso, but require a session id

  const start = startIso ? new Date(startIso).getTime() : Date.now();
  const end = Date.now();
  const duration = Math.max(1, Math.floor((end - start) / 60000));

  let totalVolume = 0;
  let totalSets = 0;
  let exerciseCount = 0;

  for (const ex of atlasState.activeExercises) {
    if (!ex.sets.length) continue;
    exerciseCount++;
    const repsStr = ex.sets.map((s) => s.reps).join(',');
    const weightsStr = ex.sets.map((s) => s.weight).join(',');

    ex.sets.forEach((s) => {
      totalVolume += s.reps * s.weight;
      totalSets++;
    });

    await insertExercise({
      sessionId: id,
      exerciseName: ex.name,
      sets: ex.sets.length,
      reps: repsStr,
      weights: weightsStr,
      restTime: ex.restTime,
      timestamp: new Date().toISOString(),
      notes: ''
    });
  }

  const session = await getSessionById(id);
  await updateSession({
    ...session,
    endTime: new Date().toISOString(),
    totalDuration: duration,
    totalExercises: exerciseCount,
    totalSets,
    totalVolume
  });

  atlasState.currentSessionId = null;
  atlasState.workoutStartTime = null;
  atlasState.activeExercises = [];
  notify();

  await loadStats();
  await loadRecentData();
}

export function addExercise(name) {
  atlasState.activeExercises = [
    ...atlasState.activeExercises,
    { name, sets: [], restTime: 90 }
  ];
  notify();
}
export function removeExercise(index) {
  atlasState.activeExercises = atlasState.activeExercises.filter((_, i) => i !== index);
  notify();
}

function calculateSmartRestTime(exerciseName, reps) {
  const compounds = ['squat', 'deadlift', 'bench', 'row', 'press', 'pull-up', 'chin-up', 'dip'];
  const lowerName = exerciseName.toLowerCase();
  const isCompound = compounds.some((k) => lowerName.includes(k));
  const isHeavy = reps <= 5;
  const isMedium = reps >= 6 && reps <= 10;
  if (isCompound && isHeavy) return 180;
  if (isCompound && isMedium) return 150;
  if (isCompound) return 120;
  if (isHeavy) return 120;
  if (isMedium) return 90;
  return 60;
}

let restTimerHandle = null;

export async function addSet(exIndex, reps, weight) {
  const arr = [...atlasState.activeExercises];
  if (!arr[exIndex]) return;

  const r = Number(reps) || 0;
  const w = Number(weight) || 0;
  if (r <= 0 || w <= 0) return;

  const updated = { ...arr[exIndex] };
  updated.sets = [...updated.sets, { reps: r, weight: w }];
  arr[exIndex] = updated;
  atlasState.activeExercises = arr;
  notify();

  const name = updated.name;
  await checkForPR(name, r, w);

  const rest = calculateSmartRestTime(name, r);
  startRestTimer(rest, name);
}

export function removeSet(exIndex, setIndex) {
  const arr = [...atlasState.activeExercises];
  if (!arr[exIndex]) return;
  const updated = { ...arr[exIndex] };
  updated.sets = updated.sets.filter((_, i) => i !== setIndex);
  arr[exIndex] = updated;
  atlasState.activeExercises = arr;
  notify();
}

export function startRestTimer(seconds, exerciseName) {
  if (restTimerHandle !== null) clearInterval(restTimerHandle);
  atlasState.restTimerActive = true;
  atlasState.currentExerciseForTimer = exerciseName;
  atlasState.restTimeRemaining = seconds;
  notify();
  restTimerHandle = setInterval(() => {
    atlasState.restTimeRemaining -= 1;
    if (atlasState.restTimeRemaining <= 0) {
      stopRestTimer();
    } else {
      notify();
    }
  }, 1000);
}
export function stopRestTimer() {
  if (restTimerHandle !== null) {
    clearInterval(restTimerHandle);
    restTimerHandle = null;
  }
  atlasState.restTimerActive = false;
  atlasState.currentExerciseForTimer = null;
  atlasState.restTimeRemaining = 0;
  notify();
}

function calculateOneRepMax(weight, reps) {
  return reps === 1 ? weight : weight * (1 + reps / 30);
}
async function checkForPR(exerciseName, reps, weight) {
  const existing = await getPRForExercise(exerciseName);
  const oneRepMax = calculateOneRepMax(weight, reps);
  if (!existing || oneRepMax > (existing.oneRepMax || 0)) {
    await insertPR({
      exerciseName,
      weight,
      reps,
      oneRepMax,
      timestamp: new Date().toISOString()
    });
    atlasState.newPRDetected = { name: exerciseName, oneRepMax };
    notify();
    await loadStats();
  }
}
export function clearPRNotification() {
  atlasState.newPRDetected = null;
  notify();
}

export async function saveCurrentAsTemplate(name, description) {
  const exercises = atlasState.activeExercises;
  if (!exercises.length) return;
  const exercisesJson = JSON.stringify(
    exercises.map((ex) => ({
      name: ex.name,
      sets: ex.sets.length,
      rest: ex.restTime
    }))
  );
  await insertTemplate({
    name,
    description,
    exercises: exercisesJson,
    category: 'Custom',
    createdAt: new Date().toISOString()
  });
  await loadTemplates();
}
export async function deleteTemplateById(id) {
  await deleteTemplate(id);
  await loadTemplates();
}

export async function addCardioSession(type, duration, distance) {
  await insertCardio({
    type,
    duration,
    distance,
    timestamp: new Date().toISOString()
  });
  await loadCardio();
}
export async function resetAllData() {
  // Soft reset of in‑memory state (IndexedDB remains unless you also clear it elsewhere)
  atlasState.currentSessionId = null;
  atlasState.workoutStartTime = null;
  atlasState.activeExercises = [];
  atlasState.restTimerActive = false;
  atlasState.restTimeRemaining = 0;
  atlasState.currentExerciseForTimer = null;
  atlasState.newPRDetected = null;
  atlasState.stats = { ...defaultStats };
  atlasState.chartData = { ...defaultChart };
  atlasState.recentExercises = [];
  atlasState.allSessions = [];
  atlasState.templates = [];
  atlasState.cardioSessions = [];
  notify();
}
