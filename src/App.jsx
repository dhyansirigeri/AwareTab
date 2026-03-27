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

function App() {
  const [mood, setMood] = useState(MOODS.RELAXED);
  const [weatherCondition, setWeatherCondition] = useState('Loading');
  const engineRef = useRef(null);

  useEffect(() => {
    try {
      if (typeof EmotionEngine !== 'undefined') {
        engineRef.current = new EmotionEngine();
        
        const handleMoodChange = (event) => {
          setMood(event.detail);
        };

        window.addEventListener('moodChanged', handleMoodChange);
        engineRef.current.start();

        return () => {
          window.removeEventListener('moodChanged', handleMoodChange);
          if (engineRef.current) {
            engineRef.current.destroy();
          }
        };
      } else {
        console.error("EmotionEngine is not defined.");
      }
    } catch (e) {
      console.error("Error initializing EmotionEngine", e);
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

  return (
    <MoodBackground 
      colors={theme.colors} 
      timeOfDay={timeOfDay} 
      weatherCondition={weatherCondition} 
      mood={mood}
    >
      <div className="relative w-full h-full flex flex-col p-8 transition-colors duration-1000 text-theme-text">
        
        {/* Top Left Area */}
        <div className="absolute top-8 left-8 flex flex-col items-start space-y-4 z-10">
          <Greeting phrase={theme.greeting} />
          <Weather onWeatherUpdate={setWeatherCondition} />
        </div>

        {/* Top Right Area */}
        <div className="absolute top-8 right-8 z-10">
          <TopRightIcons />
        </div>

        {/* Center Content */}
        <div className="flex flex-col flex-1 items-center justify-center z-10 mt-12">
          <div className="scale-125 md:scale-150 mb-8 transform">
             <Clock />
          </div>
          <SearchBar />
          
          <div className={`transition-all duration-700 w-full max-w-4xl flex justify-center ${theme.clutter === 'none' ? 'opacity-0 pointer-events-none translate-y-4' : 'opacity-100 translate-y-0'}`}>
            <Shortcuts clutterLevel={theme.clutter} />
          </div>
        </div>

        {/* Bottom Left Area */}
        <div className="absolute bottom-8 left-8 z-10">
          <UsageStats />
        </div>

        {/* Bottom Center Area */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
          <UserSettings />
        </div>

        {/* Bottom Right Area */}
        <div className="absolute bottom-8 right-8 flex items-center z-10">
          <ControlPanel 
            currentMood={mood} 
            engine={engineRef.current} 
          />
        </div>

        {/* Hidden Audio Player */}
        <SoundPlayer soundType={theme.soundType} mood={mood} />

      </div>
    </MoodBackground>
  );
}

export default App;
