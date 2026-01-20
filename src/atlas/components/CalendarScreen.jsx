import React, { useMemo, useState } from 'react';
import { atlasState } from '../state';

export function CalendarScreen() {
  const sessions = atlasState.allSessions || []; // you can later fill this from DB
  const today = new Date();
  const [currentYM, setCurrentYM] = useState({ year: today.getFullYear(), month: today.getMonth() }); // month 0-11
  const [selectedDate, setSelectedDate] = useState(null); // 'YYYY-MM-DD'

  const workoutDates = useMemo(() => {
    return new Set(
      sessions.map((s) => (s.startTime || '').substring(0, 10))
    );
  }, [sessions]);

  const selectedDayWorkouts = useMemo(() => {
    if (!selectedDate) return [];
    return sessions.filter((s) => (s.startTime || '').startsWith(selectedDate));
  }, [selectedDate, sessions]);

  const ymLabel = new Date(currentYM.year, currentYM.month, 1).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long'
  });

  return (
    <div className="minimal-bg calendar-root">
      <div className="calendar-scroll">
        <div style={{ height: 20 }} />
        <h1 className="calendar-title">CALENDAR</h1>

        <div className="glass-card">
          <div className="calendar-header">
            <button
              className="chip"
              onClick={() =>
                setCurrentYM((prev) => ({
                  year: prev.month === 0 ? prev.year - 1 : prev.year,
                  month: prev.month === 0 ? 11 : prev.month - 1
                }))
              }
            >
              ‹
            </button>
            <div className="calendar-month">{ymLabel}</div>
            <button
              className="chip"
              onClick={() =>
                setCurrentYM((prev) => ({
                  year: prev.month === 11 ? prev.year + 1 : prev.year,
                  month: prev.month === 11 ? 0 : prev.month + 1
                }))
              }
            >
              ›
            </button>
          </div>

          <CalendarGrid
            year={currentYM.year}
            month={currentYM.month}
            workoutDates={workoutDates}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </div>

        {selectedDayWorkouts.length > 0 && (
          <>
            <div className="calendar-day-title">
              {new Date(selectedDate).toLocaleDateString(undefined, {
                month: 'long',
                day: '2-digit'
              })}{' '}
              WORKOUTS
            </div>
            {selectedDayWorkouts.map((s) => (
              <div key={s.id} className="glass-card calendar-session-card">
                <div className="calendar-session-top">
                  <span>{s.totalExercises} exercises</span>
                  <span>{s.totalDuration}min</span>
                </div>
                <div className="calendar-session-bottom">
                  Volume: {Math.round(s.totalVolume || 0)}kg
                </div>
              </div>
            ))}
          </>
        )}

        <div style={{ height: 80 }} />
      </div>
    </div>
  );
}

function CalendarGrid({ year, month, workoutDates, selectedDate, onSelectDate }) {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = first.getDay(); // 0 Sun - 6 Sat

  const todayStr = new Date().toISOString().substring(0, 10);

  const rows = [];
  let dayCounter = 1;
  for (let week = 0; week < 6 && dayCounter <= daysInMonth; week++) {
    const cells = [];
    for (let dow = 0; dow < 7; dow++) {
      if ((week === 0 && dow < firstDayOfWeek) || dayCounter > daysInMonth) {
        cells.push(<div key={`empty-${week}-${dow}`} className="calendar-cell empty" />);
      } else {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayCounter).padStart(2, '0')}`;
        const hasWorkout = workoutDates.has(dateStr);
        const isSelected = selectedDate === dateStr;
        const isToday = dateStr === todayStr;
        cells.push(
          <div
            key={dateStr}
            className={
              'calendar-cell' +
              (hasWorkout ? ' workout' : '') +
              (isSelected ? ' selected' : '') +
              (isToday ? ' today' : '')
            }
            onClick={() => onSelectDate(dateStr)}
          >
            <div className="calendar-day-number">{dayCounter}</div>
            {hasWorkout && <div className="calendar-dot" />}
          </div>
        );
        dayCounter++;
      }
    }
    rows.push(
      <div key={`week-${week}`} className="calendar-row">
        {cells}
      </div>
    );
  }

  return (
    <div className="calendar-grid">
      <div className="calendar-row header">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => (
          <div key={d} className="calendar-cell header">
            {d}
          </div>
        ))}
      </div>
      {rows}
    </div>
  );
}
