import React, { useState } from 'react';
import {
  atlasState,
  startWorkout,
  addExercise,
  saveCurrentAsTemplate,
  deleteTemplateById
} from '../state';

export function TemplatesScreen({ onStartWorkoutRoute }) {
  const templates = atlasState.templates || [];
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="minimal-bg templates-root">
      <div className="templates-scroll">
        <div style={{ height: 20 }} />
        <h1 className="templates-title">TEMPLATES</h1>

        <TierHeader
          title="TIER I • FOUNDATION"
          subtitle="Beginner-friendly 3-day full body and PPL splits"
        />
        <TierRow
          templates={[
            { name: 'Full Body A', tag: 'FullBodyA', icon: '🏋️' },
            { name: 'Full Body B', tag: 'FullBodyB', icon: '⭐' },
            { name: 'PPL 3-Day', tag: 'PPL3', icon: '⭐' }
          ]}
          onUse={(tag) => {
            loadTierTemplate(tag);
            onStartWorkoutRoute();
          }}
        />

        <TierHeader
          title="TIER II • PROGRESSION"
          subtitle="Classic push / pull / legs split for hypertrophy"
        />
        <TierRow
          templates={[
            { name: 'Push Day', tag: 'PushDay', icon: '⬆️' },
            { name: 'Pull Day', tag: 'PullDay', icon: '⬇️' },
            { name: 'Legs Day', tag: 'LegDayAdvanced', icon: '🏃' }
          ]}
          onUse={(tag) => {
            loadTierTemplate(tag);
            onStartWorkoutRoute();
          }}
        />

        <TierHeader
          title="TIER III • ADVANCED"
          subtitle="Upper / Lower + specialization focus days"
        />
        <TierRow
          templates={[
            { name: 'Upper Power', tag: 'UpperPower', icon: '⭐' },
            { name: 'Lower Power', tag: 'LowerPower', icon: '⭐' },
            { name: 'Arms & Delts', tag: 'ArmsDelts', icon: '🏋️' }
          ]}
          onUse={(tag) => {
            loadTierTemplate(tag);
            onStartWorkoutRoute();
          }}
        />

        {templates.length > 0 && (
          <>
            <div className="section-label">YOUR TEMPLATES</div>
            {templates.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                onUse={() => {
                  applySavedTemplate(t);
                  onStartWorkoutRoute();
                }}
                onDelete={() => deleteTemplateById(t.id)}
              />
            ))}
          </>
        )}

        <div style={{ height: 100 }} />
      </div>

      <div className="templates-bottom">
        <button
          className="primary-pill-btn"
          style={{ width: '100%' }}
          onClick={() => setShowCreate(true)}
        >
          + Save Current Workout
        </button>
      </div>

      {showCreate && (
        <CreateTemplateDialog
          onDismiss={() => setShowCreate(false)}
          onCreate={(name, description) => {
            saveCurrentAsTemplate(name, description);
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}

// helpers

function TierHeader({ title, subtitle }) {
  return (
    <div className="tier-header">
      <div className="tier-title">{title}</div>
      <div className="tier-sub">{subtitle}</div>
    </div>
  );
}

function TierRow({ templates, onUse }) {
  return (
    <div className="tier-row">
      {templates.map((t) => (
        <TierTemplateCard key={t.tag} template={t} onUse={() => onUse(t.tag)} />
      ))}
    </div>
  );
}

function TierTemplateCard({ template, onUse }) {
  return (
    <div className="glass-card tier-card">
      <div className="tier-card-inner">
        <div className="tier-icon-circle">
          <span>{template.icon}</span>
        </div>
        <div className="tier-name">{template.name.toUpperCase()}</div>
        <button className="tier-play" onClick={onUse}>
          ▶
        </button>
      </div>
    </div>
  );
}

function TemplateCard({ template, onUse, onDelete }) {
  return (
    <div className="glass-card template-card">
      <div className="template-main">
        <div className="template-name">{template.name.toUpperCase()}</div>
        {template.description && (
          <div className="template-desc">{template.description}</div>
        )}
      </div>
      <div className="template-actions">
        <button className="chip" onClick={onUse}>
          ▶
        </button>
        <button className="chip" onClick={onDelete}>
          🗑
        </button>
      </div>
    </div>
  );
}

function CreateTemplateDialog({ onDismiss, onCreate }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  return (
    <div className="dialog-backdrop" onClick={onDismiss}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h3>CREATE TEMPLATE</h3>
        <div className="dialog-body">
          <input
            className="danger-input"
            placeholder="Template Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="danger-input"
            placeholder="Description"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
        </div>
        <div className="danger-buttons">
          <button className="chip" onClick={onDismiss}>
            CANCEL
          </button>
          <button
            className="chip"
            disabled={!name.trim()}
            onClick={() => onCreate(name.trim(), desc.trim())}
          >
            CREATE
          </button>
        </div>
      </div>
    </div>
  );
}

// Apply tier templates using same logic as Kotlin loadTierTemplate
function loadTierTemplate(tag) {
  if (tag === 'FullBodyA') {
    startWorkout();
    [
      'Barbell Squat',
      'Barbell Bench Press',
      'Barbell Row',
      'Overhead Press',
      'Plank'
    ].forEach(addExercise);
  } else if (tag === 'FullBodyB') {
    startWorkout();
    [
      'Deadlift',
      'Incline Dumbbell Press',
      'Pull-Ups',
      'Walking Lunges',
      'Hanging Leg Raises'
    ].forEach(addExercise);
  } else if (tag === 'PPL3' || tag === 'PushDay' || tag === 'PullDay' || tag === 'LegDayAdvanced') {
    // approximate: just start workout and add label exercises; you can mirror loadPrebuiltTemplate later
    startWorkout();
    // simple mapping; refine later.
  } else if (tag === 'UpperPower') {
    startWorkout();
    [
      'Barbell Bench Press',
      'Barbell Row',
      'Overhead Press',
      'Weighted Pull-Ups'
    ].forEach(addExercise);
  } else if (tag === 'LowerPower') {
    startWorkout();
    [
      'Barbell Squat',
      'Deadlift',
      'Bulgarian Split Squat',
      'Calf Raise'
    ].forEach(addExercise);
  } else if (tag === 'ArmsDelts') {
    startWorkout();
    [
      'Barbell Curl',
      'Hammer Curl',
      'Skull Crushers',
      'Overhead Tricep Extension',
      'Lateral Raise',
      'Rear Delt Fly'
    ].forEach(addExercise);
  }
}

function applySavedTemplate(template) {
  try {
    const parsed = JSON.parse(template.exercises || '[]');
    startWorkout();
    parsed.forEach((ex) => addExercise(ex.name));
  } catch {
    startWorkout();
  }
}
