import React, { useEffect, useSyncExternalStore } from 'react';
import { atlasState, subscribe, loadStats, loadRecentData, loadTemplates, loadCardio } from './atlas/state';
import { SplashScreen } from './atlas/components/SplashScreen';
import { HomeScreen } from './atlas/components/HomeScreen';
import { WorkoutScreen } from './atlas/components/WorkoutScreen';
import { TemplatesScreen } from './atlas/components/TemplatesScreen';
import { MoreScreen } from './atlas/components/MoreScreen';
import { BottomNav } from './atlas/components/BottomNav';
import { StatsScreen } from './atlas/components/StatsScreen';
import { CalendarScreen } from './atlas/components/CalendarScreen';
import { CardioScreen } from './atlas/components/CardioScreen';



// TODO: add StatsScreen, CalendarScreen, CardioScreen, TemplatesScreen, MoreScreen later

export default function App() {
  const state = useSyncExternalStore(subscribe, () => atlasState);
  const [route, setRoute] = React.useState('splash');

  useEffect(() => {
  loadStats();
  loadRecentData();
  loadTemplates();
  loadCardio();
}, []);


  const navigate = (r) => setRoute(r);

  if (route === 'splash') {
    return <SplashScreen onEnter={() => navigate('home')} />;
  }

  let content = null;
  if (route === 'home') content = <HomeScreen state={state} onStartWorkout={() => navigate('workout')} />;
  else if (route === 'workout') content = <WorkoutScreen state={state} onBack={() => navigate('home')} />;
  // placeholders so nav works
  else if (route === 'stats') content = <StatsScreen />;
  else if (route === 'calendar') content = <CalendarScreen />;
  else if (route === 'cardio') content = <CardioScreen />;
  else if (route === 'templates') {
  content = <TemplatesScreen onStartWorkoutRoute={() => setRoute('workout')} />;
} else if (route === 'more') {
  content = (
    <MoreScreen
      onNavigateMeasurements={() => setRoute('measurements')}
      onNavigatePlateCalc={() => setRoute('platecalc')}
    />
  );
}

  else if (route === 'more') {
  content = (
    <MoreScreen
      onNavigateMeasurements={() => navigate('measurements')}
      onNavigatePlateCalc={() => navigate('platecalc')}
    />
  );
}


  const hasActiveWorkout = state.currentSessionId != null;

  return (
    <div style={{ paddingBottom: hasActiveWorkout ? 0 : 64 }}>
      {content}
      {!hasActiveWorkout && route !== 'workout' && (
        <BottomNav currentRoute={route} onNavigate={navigate} />
      )}
    </div>
  );
}
