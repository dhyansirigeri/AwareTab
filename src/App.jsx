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

function App() {
  const [mood, setMood] = useState(MOODS.RELAXED);
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

  const theme = THEMES[mood] || THEMES[MOODS.RELAXED];

  return (
    <MoodBackground colors={theme.colors}>
      <div className={`relative w-full h-full flex flex-col items-center justify-center p-8 transition-colors duration-1000 ${theme.textColor}`}>
        
        {/* Top bar */}
        <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-10">
          <Weather />
          <ControlPanel 
            currentMood={mood} 
            engine={engineRef.current} 
          />
        </div>

        {/* Center content */}
        <div className="flex flex-col items-center text-center z-10 space-y-4">
          <Clock />
          <Greeting phrase={theme.greeting} />
        </div>

        {/* Bottom content */}
        <div className={`absolute bottom-12 w-full max-w-4xl px-8 transition-all duration-700 ${theme.clutter === 'none' ? 'opacity-0 pointer-events-none translate-y-4' : 'opacity-100 translate-y-0'}`}>
          <Shortcuts clutterLevel={theme.clutter} />
        </div>

        {/* Hidden Audio Player */}
        <SoundPlayer soundType={theme.soundType} mood={mood} />

      </div>
    </MoodBackground>
  );
}

export default App;
