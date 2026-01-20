import React, { useEffect, useState } from 'react';
import {
  addExercise,
  addSet,
  removeSet,
  removeExercise,
  finishWorkout
} from '../state';

const EXERCISES = [
  'Barbell Bench Press', 'Incline Bench Press', 'Decline Bench Press',
  'Dumbbell Bench Press', 'Incline Dumbbell Press', 'Decline Dumbbell Press',
  'Chest Fly', 'Incline Fly', 'Cable Crossover', 'Pec Deck',
  'Push-Ups', 'Diamond Push-Ups', 'Wide Push-Ups',
  'Deadlift', 'Romanian Deadlift', 'Sumo Deadlift',
  'Barbell Row', 'Bent-Over Row', 'T-Bar Row', 'Pendlay Row',
  'Seated Cable Row', 'One-Arm Dumbbell Row', 'Chest Supported Row',
  'Lat Pulldown', 'Wide Grip Pulldown', 'Close Grip Pulldown',
  'Pull-Ups', 'Chin-Ups', 'Neutral Grip Pull-Ups',
  'Face Pulls', 'Hyperextensions', 'Back Extensions',
  'Overhead Press', 'Military Press', 'Push Press',
  'Dumbbell Shoulder Press', 'Arnold Press', 'Seated Press',
  'Lateral Raise', 'Front Raise', 'Rear Delt Fly',
  'Cable Lateral Raise', 'Upright Row', 'Shrugs',
  'Dumbbell Shrugs', 'Barbell Shrugs',
  'Barbell Squat', 'Front Squat', 'Goblet Squat', 'Box Squat',
  'Leg Press', 'Hack Squat', 'Bulgarian Split Squat',
  'Walking Lunges', 'Reverse Lunges', 'Stationary Lunges',
  'Leg Curl', 'Seated Leg Curl', 'Lying Leg Curl',
  'Leg Extension', 'Hip Thrust', 'Glute Bridge', 'Single Leg Hip Thrust',
  'Calf Raise', 'Seated Calf Raise', 'Donkey Calf Raise',
  'Barbell Curl', 'EZ Bar Curl', 'Dumbbell Curl',
  'Hammer Curl', 'Preacher Curl', 'Concentration Curl',
  'Cable Curl', 'Incline Dumbbell Curl', 'Spider Curl',
  'Close-Grip Bench Press', 'Tricep Extension', 'Overhead Tricep Extension',
  'Skull Crushers', 'Tricep Dips', 'Bench Dips',
  'Cable Pushdown', 'Rope Pushdown', 'Diamond Push-Ups',
  'Plank', 'Side Plank', 'Plank with Reach',
  'Crunches', 'Bicycle Crunches', 'Reverse Crunches',
  'Leg Raises', 'Hanging Leg Raises', 'Knee Raises',
  'Russian Twists', 'Ab Wheel Rollout', 'Cable Crunches',
  'Mountain Climbers', 'Dead Bug', 'Bird Dog'
].sort();


export function WorkoutScreen({ state, onBack }) {
  const { activeExercises, workoutStartTime, restTimerActive, restTimeRemaining, currentExerciseForTimer } =
    state;
  const [elapsed, setElapsed] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!workoutStartTime) return;
    const start = new Date(workoutStartTime).getTime();
    const update = () => {
      setElapsed(Math.floor((Date.now() - start) / 60000));
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [workoutStartTime]);

  return (
    <div className="minimal-bg workout-root">
      <header className="workout-topbar">
        <div>
          <div className="topbar-title">ACTIVE WORKOUT</div>
          <div className="topbar-sub">{elapsed}min elapsed</div>
        </div>
        <button
          className="topbar-btn"
          onClick={async () => {
            await finishWorkout();
            onBack();
          }}
        >
          FINISH
        </button>
      </header>

      {!activeExercises.length ? (
        <div className="workout-empty">
          <div className="emoji">⚡</div>
          <h2>Ready to Start</h2>
          <p>Add exercises to begin</p>
        </div>
      ) : (
        <div className="workout-list">
          {restTimerActive && currentExerciseForTimer && (
            <div className="rest-overlay">
              <div className="rest-card">
                <p className="rest-title">{currentExerciseForTimer}</p>
                <p className="rest-time">{restTimeRemaining}s</p>
              </div>
            </div>
          )}
          {activeExercises.map((ex, index) => (
            <WorkoutExerciseCard key={index} exercise={ex} index={index} />
          ))}
          <div style={{ height: 100 }} />
        </div>
      )}

      <button className="fab" onClick={() => setPickerOpen(true)}>
        +
      </button>

      {pickerOpen && (
        <ExercisePickerDialog
          onDismiss={() => setPickerOpen(false)}
          onSelect={(name) => {
            addExercise(name);
            setPickerOpen(false);
          }}
        />
      )}
    </div>
  );
}

function WorkoutExerciseCard({ exercise, index }) {
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');

  return (
    <div className="glass-card workout-card">
      <div className="workout-card-header">
        <div>{exercise.name}</div>
        <button className="chip" onClick={() => removeExercise(index)}>
          Remove
        </button>
      </div>
      <div className="sets-list">
        {exercise.sets.map((s, i) => (
          <div key={i} className="set-row">
            <span>Set {i + 1}</span>
            <span>
              {s.reps} reps @ {s.weight}kg
            </span>
            <button className="chip" onClick={() => removeSet(index, i)}>
              ×
            </button>
          </div>
        ))}
      </div>
      <div className="set-input-row">
        <input
          type="number"
          placeholder="Reps"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
        />
        <input
          type="number"
          placeholder="Weight"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />
        <button
          className="chip"
          onClick={() => {
            const r = parseInt(reps, 10);
            const w = parseFloat(weight);
            if (r > 0 && w > 0) {
              addSet(index, r, w);
              setReps('');
              setWeight('');
            }
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
}

function ExercisePickerDialog({ onDismiss, onSelect }) {
  return (
    <div className="dialog-backdrop" onClick={onDismiss}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h3>Select Exercise</h3>
        <div className="dialog-list">
          {EXERCISES.map((name) => (
            <button key={name} className="dialog-item" onClick={() => onSelect(name)}>
              {name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
