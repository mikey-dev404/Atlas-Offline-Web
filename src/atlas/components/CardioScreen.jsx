import React, { useState } from 'react';
import { atlasState, addCardioSession } from '../state';


export function CardioScreen() {
  const sessions = atlasState.cardioSessions || []; // add later in state.js
  const [type, setType] = useState('Running');
  const [duration, setDuration] = useState('');
  const [distance, setDistance] = useState('');

  const types = ['Running', 'Walking', 'Cycling', 'Rowing', 'Elliptical', 'Other'];

  return (
    <div className="minimal-bg cardio-root">
      <div className="cardio-scroll">
        <div style={{ height: 20 }} />
        <h1 className="calendar-title">CARDIO</h1>

        <div className="glass-card">
          <div className="cardio-types">
            {types.map((t) => (
              <button
                key={t}
                className={'chip ' + (type === t ? 'chip-selected' : '')}
                onClick={() => setType(t)}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="cardio-inputs">
            <input
              className="danger-input"
              placeholder="Duration (min)"
              value={duration}
              onChange={(e) => setDuration(e.target.value.replace(/\D/g, ''))}
            />
            <input
              className="danger-input"
              placeholder="Distance (km, optional)"
              value={distance}
              onChange={(e) =>
                setDistance(e.target.value.replace(/[^0-9.]/g, ''))
              }
            />
          </div>

          <button
            className="primary-pill-btn"
            style={{ width: '100%', marginTop: 12 }}
            onClick={() => {
              const dur = parseInt(duration || '0', 10);
              const dist = parseFloat(distance || '0') || 0;
              if (dur > 0) {
                addCardioSession(type, dur, dist);
                setDuration('');
                setDistance('');
              }
            }}
          >
            Save Cardio Session
          </button>
        </div>

        <h4 className="section-title" style={{ marginTop: 20 }}>
          RECENT CARDIO
        </h4>
        {sessions.length === 0 ? (
          <div className="empty-chart">
            <div className="empty-text">No cardio sessions yet.</div>
          </div>
        ) : (
          sessions.map((s) => (
            <div key={s.id} className="glass-card cardio-card">
              <div>{s.type} - {s.duration} min</div>
              {s.distance > 0 && (
                <div className="cardio-secondary">{s.distance} km</div>
              )}
            </div>
          ))
        )}

        <div style={{ height: 80 }} />
      </div>
    </div>
  );
}
