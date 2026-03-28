import React, { useEffect, useState, useRef } from 'react';
import EmotionEngine from './EmotionEngine';
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

import { storageGet, recordDomainVisit } from './utils/chromeApi';

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
  const engineRef = useRef(null);

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

  // ─── Emotion Engine ─────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      if (typeof EmotionEngine !== 'undefined') {
        engineRef.current = new EmotionEngine({
          debug: true,
          calibrationMs: 5000,
          manualOverrideMs: 8000,
        });

        const handleMoodChange = (event) => {
          console.log('🎭 Mood change detected:', event.detail);
          setMood(event.detail);
        };

        window.addEventListener('moodChanged', handleMoodChange);
        engineRef.current.start();
        console.log('🚀 Emotion Engine started successfully');

        return () => {
          window.removeEventListener('moodChanged', handleMoodChange);
          if (engineRef.current) engineRef.current.destroy();
        };
      }
    } catch (e) {
      console.error('Error initializing EmotionEngine', e);
    }
  }, []);

  const getAppTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  };

  const theme = THEMES[mood] || THEMES[MOODS.RELAXED];
  const timeOfDay = getAppTimeOfDay();

  // Clutter level: user setting overrides mood theme
  const clutterLevel = settings.clutterLevel || theme.clutter;

  const handleSettingsChange = (updated) => {
    setSettings((prev) => ({ ...prev, ...updated }));
  };

  return (
    <MoodBackground
      colors={theme.colors}
      timeOfDay={timeOfDay}
      weatherCondition={weatherCondition}
      mood={mood}
    >
      <div className="relative w-full h-full flex flex-col p-8 transition-colors duration-1000 text-theme-text">

        {/* Top Left Area */}
        <div className="absolute top-8 left-8 flex flex-col items-start z-10" style={{ gap: '1rem', maxWidth: '300px' }}>
          <Greeting phrase={settings.userName ? `Welcome, ${settings.userName}.` : theme.greeting} />
          <Weather onWeatherUpdate={setWeatherCondition} />
        </div>

        {/* Top Right Area */}
        <div className="absolute top-8 right-8 z-10">
          <TopRightIcons
            onBookmarksClick={() => setBookmarksOpen(true)}
            onAppsClick={() => setAppsOpen(true)}
          />
        </div>

        {/* Center Content */}
        <div className="flex flex-col flex-1 items-center justify-center z-10 mt-6">
          <div className="scale-110 md:scale-125 mb-6 transform">
            <Clock clockFormat={settings.clockFormat} />
          </div>

          <SearchBar
            searchEngine={settings.searchEngine}
            onEngineChange={(eng) => handleSettingsChange({ searchEngine: eng })}
          />

          <div className={`transition-all duration-700 w-full max-w-4xl flex justify-center mt-4 ${clutterLevel === 'none' ? 'opacity-0 pointer-events-none translate-y-4' : 'opacity-100 translate-y-0'}`}>
            <Shortcuts clutterLevel={clutterLevel} />
          </div>
        </div>

        {/* Bottom Left Area */}
        <div className="absolute bottom-8 left-8 z-10">
          <UsageStats />
        </div>

        {/* Bottom Center Area */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
          <UserSettings
            settings={settings}
            onSettingsChange={handleSettingsChange}
          />
        </div>

        {/* Bottom Right Area */}
        <div className="absolute bottom-8 right-8 flex items-center z-10">
          <ControlPanel
            currentMood={mood}
            engine={engineRef.current}
          />
        </div>

        {/* Audio Player */}
        <SoundPlayer
          soundType={theme.soundType}
          mood={mood}
          enabled={settings.soundEnabled !== false}
        />

      </div>

      {/* Panels (rendered outside normal flow, inside MoodBackground for z-index) */}
      <BookmarksPanel
        isOpen={bookmarksOpen}
        onClose={() => setBookmarksOpen(false)}
      />
      <GoogleAppsPanel
        isOpen={appsOpen}
        onClose={() => setAppsOpen(false)}
      />

    </MoodBackground>
  );
}

export default App;
