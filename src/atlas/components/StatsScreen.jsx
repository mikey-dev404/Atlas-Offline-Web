import React from 'react';
import { atlasState } from '../state';

export function StatsScreen() {
  const { chartData } = atlasState;
  const weekly = chartData.weeklyWorkouts || {};
  const volume = chartData.volumeProgress || [];
  const muscle = chartData.muscleGroups || {};

  return (
    <div className="minimal-bg stats-root">
      <div className="stats-scroll">
        <div style={{ height: 20 }} />
        <h1 className="stats-title">STATS</h1>

        <WeeklyWorkoutChart data={weekly} title="Weekly Activity" />
        <VolumeChart data={volume} title="Training Volume" />
        <MuscleGroupChart data={muscle} title="Muscle Focus" />

        <div style={{ height: 80 }} />
      </div>
    </div>
  );
}

// ------- Weekly bar chart --------

function WeeklyWorkoutChart({ data, title }) {
  const entries = Object.entries(data);
  if (!entries.length) {
    return <EmptyChart title={title} message="No workouts logged yet" />;
  }
  const maxValue = Math.max(...entries.map(([, v]) => v || 0)) || 1;

  return (
    <div className="glass-card chart-card">
      <div className="chart-title">{title.toUpperCase()}</div>
      <div className="chart-bar-area">
        {entries.map(([day, value]) => {
          const h = (value / maxValue) * 100;
          return (
            <div key={day} className="chart-bar-wrapper">
              <div className="chart-bar" style={{ height: `${h}%` }} />
              <div className="chart-label">{day.slice(0, 3)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ------- Volume column chart --------

function VolumeChart({ data, title }) {
  if (!data.length) {
    return <EmptyChart title={title} message="No volume data" />;
  }
  const maxVal = Math.max(...data.map(([, v]) => v || 0)) || 1;
  const total = Math.round(data.reduce((sum, [, v]) => sum + (v || 0), 0));

  return (
    <div className="glass-card chart-card">
      <div className="chart-title">{title.toUpperCase()}</div>
      <div className="chart-bar-area">
        {data.map(([label, value]) => {
          const h = (value / maxVal) * 100;
          return (
            <div key={label} className="chart-bar-wrapper">
              <div className="chart-bar" style={{ height: `${h}%` }} />
              <div className="chart-label">{label}</div>
            </div>
          );
        })}
      </div>
      <div className="chart-footer">Total: {total} kg</div>
    </div>
  );
}

// ------- “Pie” legend (simple version) --------

function MuscleGroupChart({ data, title }) {
  const entries = Object.entries(data);
  if (!entries.length) {
    return <EmptyChart title={title} message="No muscle data" />;
  }
  const total = entries.reduce((sum, [, v]) => sum + (v || 0), 0) || 1;

  return (
    <div className="glass-card chart-card">
      <div className="chart-title">{title.toUpperCase()}</div>
      <div className="muscle-list">
        {entries.map(([group, count], i) => {
          const pct = Math.round(((count || 0) / total) * 100);
          return (
            <div key={group} className="muscle-row">
              <div className="muscle-dot" style={{ opacity: 1 - i * 0.12 }} />
              <div className="muscle-name">{group}</div>
              <div className="muscle-count">{count} • {pct}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EmptyChart({ title, message }) {
  return (
    <div className="glass-card chart-card">
      <div className="chart-title">{title.toUpperCase()}</div>
      <div className="empty-chart">
        <div className="emoji">📊</div>
        <div className="empty-text">{message}</div>
      </div>
    </div>
  );
}
