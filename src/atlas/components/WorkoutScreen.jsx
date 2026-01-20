// src/atlas/components/WorkoutScreen.jsx
import React, { useEffect, useState } from 'react';
import {
  atlasState,
  subscribe,
  startWorkout,
  finishWorkout,
  addExercise,
  removeExercise,
  addSet,
  removeSet,
  stopRestTimer
} from '../state';

export function WorkoutScreen({ onBackToHome }) {
  const [state, setState] = useState(atlasState);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    const unsub = subscribe(() => setState({ ...atlasState }));
    // start a session exactly once when entering screen
    if (!atlasState.currentSessionId) {
      startWorkout();
    }
    return unsub;
  }, []);

  const activeExercises = state.activeExercises || [];
  const restActive = state.restTimerActive;
  const restRemaining = state.restTimeRemaining;
  const currentExercise = state.currentExerciseForTimer;

  const totalSets = activeExercises.reduce((sum, ex) => sum + ex.sets.length, 0);

  const handleFinish = async () => {
    if (atlasState.currentSessionId && totalSets > 0) {
      await finishWorkout();      // writes to DB + updates stats/xp/calendar
    }
    onBackToHome();               // just navigate home, no new workout
  };

  const handleAddExercise = () => {
    setShowPicker(true);
  };

  return (
    <div className="minimal-bg workout-root">
      <div className="workout-topbar">
        <div>
          <div className="topbar-title">ACTIVE WORKOUT</div>
          <div className="topbar-sub">{totalSets} sets</div>
        </div>
        <button className="topbar-btn" onClick={handleFinish}>
          FINISH
        </button>
      </div>

      {restActive && currentExercise && (
        <div className="rest-overlay">
          <div className="rest-card">
            <p className="rest-title">Rest for {currentExercise}</p>
            <p className="rest-time">{restRemaining}s</p>
            <button className="chip" onClick={stopRestTimer}>
              Skip
            </button>
          </div>
        </div>
      )}

      {activeExercises.length === 0 ? (
        <div className="workout-empty">
          <div className="emoji">🏋️‍♂️</div>
          <div style={{ height: 16 }} />
          <div style={{ fontSize: 22, fontWeight: 700 }}>Ready to Start</div>
          <div style={{ fontSize: 14, color: 'rgba(148,163,184,1)', marginTop: 4 }}>
            Add exercises to begin
          </div>
          <div style={{ height: 24 }} />
          <button className="primary-pill-btn" onClick={handleAddExercise}>
            + ADD EXERCISE
          </button>
        </div>
      ) : (
        <>
          <div className="workout-list">
            {activeExercises.map((ex, index) => (
              <WorkoutExerciseCard
                key={index}
                exercise={ex}
                exerciseNumber={index + 1}
                onAddSet={(reps, weight) => addSet(index, reps, weight)}
                onRemoveSet={(setIndex) => removeSet(index, setIndex)}
                onRemove={() => removeExercise(index)}
              />
            ))}
          </div>

          <button className="fab" onClick={handleAddExercise}>
            +
          </button>
        </>
      )}

      {showPicker && (
        <ExercisePickerDialog
          onDismiss={() => setShowPicker(false)}
          onSelect={(name) => {
            addExercise(name);
            setShowPicker(false);
          }}
        />
      )}
    </div>
  );
}

function WorkoutExerciseCard({ exercise, exerciseNumber, onAddSet, onRemoveSet, onRemove }) {
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');

  const handleAdd = () => {
    if (!reps || !weight) return;
    onAddSet(reps, weight);
    setReps('');
    setWeight('');
  };

  return (
    <div className="glass-card" style={{ marginTop: 12 }}>
      <div className="exercise-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              background: 'rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700
            }}
          >
            {exerciseNumber}
          </div>
          <div>
            <div className="exercise-name">{exercise.name}</div>
            <div className="exercise-sub">{exercise.sets.length} sets</div>
          </div>
        </div>
        <button className="chip" onClick={onRemove}>
          ✕
        </button>
      </div>

      {exercise.sets.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {exercise.sets.map((s, i) => (
            <div
              key={i}
              className="set-row"
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.04)'
              }}
            >
              <span>
                Set {i + 1}: {s.reps} × {s.weight}kg
              </span>
              <button className="chip" onClick={() => onRemoveSet(i)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="set-input-row">
        <input
          type="number"
          placeholder="Reps"
          value={reps}
          onChange={(e) => setReps(e.target.value.replace(/[^0-9]/g, ''))}
        />
        <input
          type="number"
          placeholder="kg"
          value={weight}
          onChange={(e) => setWeight(e.target.value.replace(/[^0-9.]/g, ''))}
        />
        <button className="chip" onClick={handleAdd}>
          +
        </button>
      </div>
    </div>
  );
}

const DEFAULT_EXERCISES = [
  'Barbell Squat',
  'Barbell Bench Press',
  'Barbell Row',
  'Deadlift',
  'Overhead Press',
  'Lat Pulldown',
  'Pull-Ups',
  'Dumbbell Bench Press',
  'Incline Bench Press',
  'Leg Press',
  'Romanian Deadlift',
  'Lateral Raise',
  'Bicep Curl',
  'Tricep Pushdown',
  'Plank'
];

function ExercisePickerDialog({ onDismiss, onSelect }) {
  const [query, setQuery] = useState('');

  const filtered = DEFAULT_EXERCISES.filter((name) =>
    name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="dialog-backdrop" onClick={onDismiss}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0, marginBottom: 8, letterSpacing: '0.1em' }}>
          SELECT EXERCISE
        </h3>
        <input
          className="danger-input"
          placeholder="Search exercises..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ marginBottom: 12 }}
        />
        <div className="dialog-list">
          {filtered.map((name) => (
            <button
              key={name}
              className="dialog-item"
              onClick={() => onSelect(name)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
