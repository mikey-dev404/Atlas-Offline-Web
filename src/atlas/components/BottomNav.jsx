import React from 'react';

const ITEMS = [
  { route: 'home', label: 'Home', icon: '🏠' },
  { route: 'stats', label: 'Stats', icon: '📊' },
  { route: 'calendar', label: 'Calendar', icon: '🗓️' },
  { route: 'cardio', label: 'Cardio', icon: '🏃' },
  { route: 'templates', label: 'Templates', icon: '📁' },
  { route: 'more', label: 'More', icon: '⋯' }
];

export function BottomNav({ currentRoute, onNavigate }) {
  return (
    <div className="bottom-nav">
      {ITEMS.map((item) => {
        const selected = currentRoute === item.route;
        return (
          <button
            key={item.route}
            className={`bottom-nav-item ${selected ? 'selected' : ''}`}
            onClick={() => onNavigate(item.route)}
          >
            <span className="bottom-nav-icon">{item.icon}</span>
            <span className="bottom-nav-label">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
