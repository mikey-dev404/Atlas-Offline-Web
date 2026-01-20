import React, { useEffect, useState } from 'react';
import { resetAllData } from '../state';

export function MoreScreen({ onNavigateMeasurements, onNavigatePlateCalc }) {
  const [tapCount, setTapCount] = useState(0);
  const [showResetDialog, setShowResetDialog] = useState(false);

  // auto reset tapCount after 3s like Android
  useEffect(() => {
    if (!tapCount) return;
    const id = setTimeout(() => setTapCount(0), 3000);
    return () => clearTimeout(id);
  }, [tapCount]);

  return (
    <div className="minimal-bg more-root">
      <div className="more-scroll">
        <div style={{ height: 20 }} />
        <h1
          className="more-title"
          onClick={() => {
            const next = tapCount + 1;
            if (next >= 7) {
              setShowResetDialog(true);
              setTapCount(0);
            } else {
              setTapCount(next);
            }
          }}
        >
          MORE
        </h1>

        <SectionLabel>TOOLS</SectionLabel>

        <MoreMenuItem
          title="Body Measurements"
          subtitle="Track your progress"
          icon="⚖️"
          onClick={onNavigateMeasurements}
        />

        <MoreMenuItem
          title="Plate Calculator"
          subtitle="Calculate barbell loading"
          icon="🧮"
          onClick={onNavigatePlateCalc}
        />

        <MoreMenuItem
          title="Export Data"
          subtitle="Backup your workouts"
          icon="☁️"
          onClick={() => window.alert('Export feature coming soon!')}
        />

        <SectionLabel>ABOUT</SectionLabel>

        <div className="glass-card more-about-card">
          <div className="about-block">
            <div className="about-title">ATLAS OFFLINE</div>
            <div className="about-sub">Minimalist Fitness Tracker</div>
            <div className="about-sub2">Beta Testing Version</div>
          </div>
          <div className="about-footer">
            Built by Matic Muha using Jetpack Compose
          </div>
        </div>

        <div style={{ height: 40 }} />
      </div>

      {showResetDialog && (
        <ResetDataDialog
          onDismiss={() => setShowResetDialog(false)}
          onConfirm={() => {
            resetAllData();
            setShowResetDialog(false);
          }}
        />
      )}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div className="section-label">
      {children}
    </div>
  );
}

function MoreMenuItem({ title, subtitle, icon, onClick }) {
  return (
    <div className="glass-card more-item" onClick={onClick}>
      <div className="more-item-left">
        <div className="more-item-icon-circle">
          <span>{icon}</span>
        </div>
        <div>
          <div className="more-item-title">{title}</div>
          <div className="more-item-sub">{subtitle}</div>
        </div>
      </div>
      <div className="more-item-chevron">›</div>
    </div>
  );
}

function ResetDataDialog({ onDismiss, onConfirm }) {
  const [text, setText] = useState('');

  return (
    <div className="dialog-backdrop" onClick={onDismiss}>
      <div className="dialog danger-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="danger-header">
          <span className="danger-icon">⚠️</span>
          <span className="danger-title">DANGER ZONE</span>
        </div>

        <p>This will permanently delete ALL your data including:</p>
        <ul className="danger-list">
          <li>All workout sessions</li>
          <li>Exercise history</li>
          <li>Personal records</li>
          <li>Body measurements</li>
          <li>Achievements</li>
          <li>Templates</li>
        </ul>

        <p className="danger-instruction">Type 'DELETE' to confirm:</p>
        <input
          className="danger-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus
        />

        <div className="danger-buttons">
          <button className="chip" onClick={onDismiss}>
            Cancel
          </button>
          <button
            className="chip danger-delete"
            disabled={text !== 'DELETE'}
            onClick={onConfirm}
          >
            DELETE ALL
          </button>
        </div>
      </div>
    </div>
  );
}
