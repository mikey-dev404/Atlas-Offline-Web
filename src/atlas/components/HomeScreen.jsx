import React from 'react';

export function HomeScreen({ state, onStartWorkout }) {
  const { stats, recentExercises, restTimerActive, restTimeRemaining, currentExerciseForTimer } =
    state;

  return (
    <div className="minimal-bg home-root">
      <div className="home-scroll">
        <div className="home-header">
          <div>
            <h1>ATLAS</h1>
            <span className="subtitle">Minimalist Fitness Tracker</span>
          </div>
        </div>

        <LevelCard
          level={stats.level}
          currentXP={stats.currentXP % stats.nextLevelXP}
          maxXP={stats.nextLevelXP}
          rankTitle={stats.rankTitle}
          rankSubtitle={stats.rankSubtitle}
        />

        <div className="home-stats-row">
          <StatCard title="Workouts" value={String(stats.totalWorkouts)} icon="🏋️" />
          <StatCard title="Records" value={String(stats.personalRecords)} icon="🏆" />
        </div>
        <div className="home-stats-row">
          <StatCard title="Time" value={`${stats.totalTime}m`} icon="⏱️" />
          <StatCard title="Volume" value={`${Math.floor(stats.totalVolume)}kg`} icon="📈" />
        </div>

        <h4 className="section-title">RECENT ACTIVITY</h4>
        {recentExercises.slice(0, 5).map((ex) => (
          <MinimalExerciseCard key={ex.id} exercise={ex} />
        ))}
        <div style={{ height: 100 }} />
      </div>

      {restTimerActive && currentExerciseForTimer && (
        <div className="rest-overlay">
          <div className="rest-card">
            <p className="rest-title">{currentExerciseForTimer}</p>
            <p className="rest-time">{restTimeRemaining}s</p>
          </div>
        </div>
      )}

      <div className="home-bottom">
        <button className="primary-pill-btn" onClick={onStartWorkout}>
          + Start Workout
        </button>
      </div>
    </div>
  );
}

function LevelCard({ level, currentXP, maxXP, rankTitle, rankSubtitle }) {
  const progress = maxXP > 0 ? Math.min(1, currentXP / maxXP) : 0;
  return (
    <div className="glass-card level-card">
      <div className="level-left-circle">
        <div className="level-avatar-overlay">
          <span>LVL {level}</span>
        </div>
      </div>
      <div className="level-right">
        <h3>{rankTitle}</h3>
        <p>{rankSubtitle}</p>
        <div className="xp-bar">
          <div className="xp-bar-inner" style={{ width: `${progress * 100}%` }} />
        </div>
        <span className="xp-text">
          Level {level} • {currentXP} / {maxXP} XP
        </span>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="glass-card stat-card">
      <div className="stat-icon">{icon}</div>
      <div>
        <div className="stat-title">{title}</div>
        <div className="stat-value">{value}</div>
      </div>
    </div>
  );
}

function MinimalExerciseCard({ exercise }) {
  const firstWeight = String(exercise.weights || '').split(',')[0] || '0';
  const date = String(exercise.timestamp || '').split('T')[0] || '';
  return (
    <div className="glass-card exercise-card">
      <div>
        <div className="exercise-name">{exercise.exerciseName}</div>
        <div className="exercise-sub">
          {exercise.sets} sets • {firstWeight}kg
        </div>
      </div>
      <div className="exercise-date">{date}</div>
    </div>
  );
}
