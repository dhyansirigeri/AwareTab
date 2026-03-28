import React, { useEffect, useState, useRef } from 'react';

import { MOODS, THEMES } from './MoodThemes';
import MoodBackground from './components/MoodBackground';
import Clock from './components/Clock';
import Greeting from './components/Greeting';
import Weather from './components/Weather';
import Shortcuts from './components/Shortcuts';
import ControlPanel from './components/ControlPanel';
import SoundPlayer from './components/SoundPlayer';
import SearchBar from './components/SearchBar';
import UsageStats from './components/UsageStats';
import TopRightIcons from './components/TopRightIcons';
import UserSettings from './components/UserSettings';
import BookmarksPanel from './components/BookmarksPanel';
import GoogleAppsPanel from './components/AppsGrid';
import BreathingGuide from './components/BreathingGuide';
import FocusTimer from './components/FocusTimer';
import MoodIndicator from './components/MoodIndicator';

import { storageGet, localStorageGet, recordDomainVisit } from './utils/chromeApi';

const DEFAULT_SETTINGS = {
  userName: '',
  searchEngine: 'google',
  clockFormat: '12h',
  soundEnabled: true,
  clutterLevel: 'minimal',
};

function App() {
  const [mood, setMood]                     = useState(MOODS.RELAXED);
  const [weatherCondition, setWeatherCondition] = useState('Loading');
  const [settings, setSettings]             = useState(DEFAULT_SETTINGS);
  const [bookmarksOpen, setBookmarksOpen]   = useState(false);
  const [appsOpen, setAppsOpen]             = useState(false);
  const [engine, setEngine]                 = useState(null);

  // ─── Load settings ─────────────────────────────────────────────────────────
  useEffect(() => {
    storageGet(Object.keys(DEFAULT_SETTINGS)).then((saved) => {
      setSettings({ ...DEFAULT_SETTINGS, ...saved });
    });
  }, []);

  // ─── Track this page visit ──────────────────────────────────────────────────
  useEffect(() => {
    // Record a visit for 'newtab' domain each time the tab opens
    recordDomainVisit('https://newtab.local/');
  }, []);

  // ─── Global Background Emotion Engine ───────────────────────────────────────
  useEffect(() => {
    // Initial fetch
    localStorageGet('globalRawMood').then((res) => {
      if (res.globalRawMood) setMood(res.globalRawMood);
    });

    // Listen to changes from any tab
    const handleStorageChange = (changes, areaName) => {
      if (areaName === 'local' && changes.globalRawMood) {
        console.log('🎭 Global mood change detected:', changes.globalRawMood.newValue);
        setMood(changes.globalRawMood.newValue);
      }
    };

    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
        chrome.storage.onChanged.addListener(handleStorageChange);
      }
    } catch (e) {}

    return () => {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
          chrome.storage.onChanged.removeListener(handleStorageChange);
        }
      } catch (e) {}
    };
  }, []);

  const getAppTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  };

  const isMoodLocked = () => {
    if (!settings.manualMood || settings.manualMood === 'AUTO') return false;
    if (settings.manualMoodUntil === 'forever') return true;
    if (settings.manualMoodUntil && Date.now() < settings.manualMoodUntil) return true;
    return false;
  };

  const effectiveMood = isMoodLocked() ? settings.manualMood : mood;
  const theme = THEMES[effectiveMood] || THEMES[MOODS.RELAXED];
  const timeOfDay = getAppTimeOfDay();

  // Clutter level: user setting overrides mood theme
  const clutterLevel = settings.clutterLevel || theme.clutter;
  
  // Safe helper to check component visibility
  const showComponent = (name) => theme?.components?.show?.includes(name);

  const handleSettingsChange = (updated) => {
    setSettings((prev) => ({ ...prev, ...updated }));
  };

  return (
    <MoodBackground
      colors={theme.colors}
      timeOfDay={timeOfDay}
      weatherCondition={weatherCondition}
      mood={effectiveMood}
    >
      <div className="relative w-full h-full flex flex-col transition-colors duration-1000 text-theme-text" style={{ padding: '2rem' }}>
        
        {/* ── Top indicator ── */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20">
           <MoodIndicator mood={effectiveMood} />
        </div>

        {/* ── Left Column: Greeting → Weather → Usage Stats ── */}
        <div
          style={{
            position: 'absolute',
            top: '2rem',
            left: '2rem',
            bottom: '2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '1.25rem',
            zIndex: 10,
            width: '240px',
          }}
        >
          {/* Greeting */}
          <Greeting phrase={settings.userName ? `Welcome, ${settings.userName}.` : theme.greeting} />

          {/* Weather card */}
          {showComponent('weather') && (
            <Weather onWeatherUpdate={setWeatherCondition} />
          )}

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Usage Stats card */}
          {showComponent('usageStats') && (
            <UsageStats />
          )}
        </div>

        {/* ── Top Right ── */}
        <div className="absolute top-8 right-8 z-50 flex gap-4">
          <TopRightIcons
            onBookmarksClick={() => setBookmarksOpen(true)}
            onAppsClick={() => setAppsOpen(true)}
            hideBookmarks={!showComponent('bookmarks')}
            hideApps={!showComponent('googleApps')}
          />
        </div>

        {/* ── Center: Clock + Search + Shortcuts + Breathing/Focus ── */}
        <div className="flex flex-col flex-1 items-center justify-center z-10" style={{ marginTop: '-2rem' }}>
          
          <div style={{ marginBottom: showComponent('breathingGuide') || showComponent('focusTimer') ? '1.5rem' : '2.5rem' }}>
            {showComponent('clock') && <Clock clockFormat={settings.clockFormat} />}
          </div>

          {showComponent('searchBar') && (
            <SearchBar
              searchEngine={settings.searchEngine}
              onEngineChange={(eng) => handleSettingsChange({ searchEngine: eng })}
            />
          )}

          {showComponent('breathingGuide') && (
             <div className="mt-8 transition-opacity duration-700 opacity-100">
               <BreathingGuide />
             </div>
          )}

          {showComponent('focusTimer') && (
             <div className="mt-8 transition-opacity duration-700 opacity-100">
               <FocusTimer />
             </div>
          )}

          <div className={`transition-all duration-700 w-full max-w-4xl flex justify-center mt-4 ${clutterLevel === 'none' || !showComponent('shortcuts') ? 'opacity-0 pointer-events-none translate-y-4 hidden' : 'opacity-100 translate-y-0'}`}>
            <Shortcuts clutterLevel={clutterLevel} />
          </div>
        </div>

        {/* ── Bottom Center ── */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
          <UserSettings
            settings={settings}
            onSettingsChange={handleSettingsChange}
          />
        </div>

        {/* ── Bottom Right ── */}
        <div className="absolute bottom-8 right-8 flex items-center z-10">
          <ControlPanel
            currentMood={effectiveMood}
            engine={engine}
          />
        </div>

        {/* ── Audio Player ── */}
        {showComponent('music') && (
          <SoundPlayer
            soundType={theme.soundType}
            mood={effectiveMood}
            enabled={settings.soundEnabled !== false}
          />
        )}

      </div>

      {/* Panels (rendered outside normal flow, inside MoodBackground for z-index) */}
      <BookmarksPanel
        isOpen={bookmarksOpen && showComponent('bookmarks')}
        onClose={() => setBookmarksOpen(false)}
      />
      <GoogleAppsPanel
        isOpen={appsOpen && showComponent('googleApps')}
        onClose={() => setAppsOpen(false)}
      />

    </MoodBackground>
  );
}

export default App;
