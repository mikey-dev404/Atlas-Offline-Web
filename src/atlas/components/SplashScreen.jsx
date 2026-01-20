import React, { useEffect, useState } from 'react';

export function SplashScreen({ onEnter }) {
  const [phase, setPhase] = useState(0);
  const [davidOffset, setDavidOffset] = useState(0);

  useEffect(() => {
    setTimeout(() => setPhase(1), 300);
    setTimeout(() => setPhase(2), 1100);
    setTimeout(() => setPhase(3), 1700);
  }, []);

  useEffect(() => {
    let dir = -1;
    const id = setInterval(() => {
      setDavidOffset((prev) => {
        if (prev <= -16) dir = 1;
        if (prev >= 0) dir = -1;
        return prev + dir;
      });
    }, 60);
    return () => clearInterval(id);
  }, []);

  const progress = phase >= 3 ? 1 : phase === 0 ? 0 : phase === 1 ? 0.4 : 0.7;

  return (
    <div className="minimal-bg splash-root">
      <div
        className="splash-david"
        style={{ transform: `translateY(${davidOffset}px)` }}
      />
      <div className="splash-content">
        <div className="splash-top">
          {phase >= 1 && (
            <div className="splash-logo-card">
              <div className="minimalist-logo" />
            </div>
          )}
          {phase >= 2 && (
            <div className="splash-title">
              <h1>ATLAS</h1>
              <h2>OFFLINE</h2>
              <p>Minimalist Strength Tracker</p>
            </div>
          )}
        </div>
        <div className="splash-bottom">
          <div className="splash-progress">
            <div
              className="splash-progress-bar"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          {phase >= 3 && (
            <button className="primary-pill-btn" onClick={onEnter}>
              ▶ ENTER ATLAS
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
