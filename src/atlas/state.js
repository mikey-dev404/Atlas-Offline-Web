// src/atlas/state.js
import {
  insertSession,
  updateSession,
  getAllSessions,
  getTotalWorkoutCount,
  getTotalWorkoutTime,
  getTotalVolume,
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


// ---------- RANKS ----------

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

// ---------- DEFAULT STATE ----------

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

// ---------- SUBSCRIBE ----------

const listeners = new Set();
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function notify() {
  listeners.forEach((fn) => fn());
}

// ---------- XP / LEVEL ----------

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

function calculateWorkoutXP(exercises, sets, volume, duration) {
  if (!exercises || !sets) return 0;
  let xp = 0;
  xp += exercises * 20;
  xp += sets * 5;
  xp += Math.floor(volume / 10);
  xp += Math.floor(Math.min(duration, 60) * 2);
  if (duration >= 20 && exercises >= 3) xp += 50;
  return xp;
}

// ---------- LOADERS ----------

export async function loadStats() {
  const totalWorkouts = await getTotalWorkoutCount();
  const totalTime = (await getTotalWorkoutTime()) || 0;
  const totalVolume = (await getTotalVolume()) || 0;
  const totalPRs = await getTotalPRCount();

  const sessions = await getAllSessions();
  let totalXP = 0;
  sessions
    .filter((s) => s.endTime && s.endTime !== '' && s.totalExercises > 0)
    .forEach((s) => {
      totalXP += calculateWorkoutXP(
        s.totalExercises,
        s.totalExercises * 3,
        s.totalVolume,
        s.totalDuration
      );
    });

  const level = calculateLevelFromXP(totalXP);
  const currentRank = getRankForLevel(level);
  const nextRank = getNextRank(level);

  atlasState.stats = {
    ...atlasState.stats,
    totalWorkouts,
    totalTime,
    personalRecords: totalPRs,
    totalVolume,
    level,
    currentXP: totalXP,
    nextLevelXP: nextRank ? nextRank.xpRequired : totalXP + 1000,
    rankTitle: currentRank.title,
    rankSubtitle: currentRank.subtitle
  };
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

export async function addCardioSession(type, duration, distance) {
  await insertCardio({
    type,
    duration,
    distance,
    timestamp: new Date().toISOString()
  });
  await loadCardio();
}



// ---------- WORKOUT LIFECYCLE ----------

export async function startWorkout() {
  const now = new Date().toISOString();
  const id = await insertSession({
    startTime: now,
    endTime: '',
    totalDuration: 0,
    totalExercises: 0,
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
  if (!id || !startIso) return;
  const start = new Date(startIso).getTime();
  const end = Date.now();
  const duration = Math.floor((end - start) / 60000);

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

  await updateSession({
    id,
    startTime: startIso,
    endTime: new Date().toISOString(),
    totalDuration: duration,
    totalExercises: exerciseCount,
    totalVolume,
    notes: ''
  });

  atlasState.currentSessionId = null;
  atlasState.workoutStartTime = null;
  atlasState.activeExercises = [];
  notify();

  await loadStats();
  await loadRecentData();
}

// ---------- ACTIVE EXERCISES ----------

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
  const compounds = ['Squat', 'Deadlift', 'Bench Press', 'Row', 'Press', 'Pull-up', 'Chin-up', 'Dip'];
  const isCompound = compounds.some((k) => exerciseName.toLowerCase().includes(k.toLowerCase()));
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
  arr[exIndex] = {
    ...arr[exIndex],
    sets: [...arr[exIndex].sets, { reps, weight }]
  };
  atlasState.activeExercises = arr;
  notify();

  const name = arr[exIndex].name;
  await checkForPR(name, reps, weight);
  const rest = calculateSmartRestTime(name, reps);
  startRestTimer(rest, name);
}

export function removeSet(exIndex, setIndex) {
  const arr = [...atlasState.activeExercises];
  if (!arr[exIndex]) return;
  arr[exIndex] = {
    ...arr[exIndex],
    sets: arr[exIndex].sets.filter((_, i) => i !== setIndex)
  };
  atlasState.activeExercises = arr;
  notify();
}

// ---------- REST TIMER ----------

export function startRestTimer(seconds, exerciseName) {
  if (restTimerHandle !== null) {
    clearInterval(restTimerHandle);
  }
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

// ---------- PRs ----------

function calculateOneRepMax(weight, reps) {
  return reps === 1 ? weight : weight * (1 + reps / 30);
}

async function checkForPR(exerciseName, reps, weight) {
  const existing = await getPRForExercise(exerciseName);
  const oneRepMax = calculateOneRepMax(weight, reps);
  if (!existing || oneRepMax > existing.oneRepMax) {
    await insertPR({
      exerciseName,
      weight,
      reps,
      oneRepMax,
      timestamp: new Date().toISOString()
    });
    atlasState.newPRDetected = { name: exerciseName, oneRepMax };
    notify();
  }
}

export function clearPRNotification() {
  atlasState.newPRDetected = null;
  notify();
}

// ---------- TEMPLATES ----------

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

// ---------- RESET ALL (for MoreScreen) ----------

export async function resetAllData() {
  const sessions = await getAllSessions();
  // simplest: clear IndexedDB by deleting database key
  // (for now we just clear in-memory state)
  atlasState.currentSessionId = null;
  atlasState.workoutStartTime = null;
  atlasState.activeExercises = [];
  atlasState.stats = defaultStats;
  atlasState.recentExercises = [];
  atlasState.templates = [];
  notify();
}
