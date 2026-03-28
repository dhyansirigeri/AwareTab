import React, { useEffect, useState, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

// Using reliable Google Action sounds instead of Pixabay to avoid 403 Forbidden hotlinking errors
const SOUNDS = {
  lofi: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg', 
  brownNoise: 'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg', 
  ambient: 'https://actions.google.com/sounds/v1/ambiences/outdoor_summer_ambience.ogg', 
  lightMusic: 'https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg' 
};

export default function SoundPlayer({ soundType, mood, enabled = true }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(new Audio());

  useEffect(() => {
    audioRef.current.loop = true;
    audioRef.current.volume = 0.3;
    return () => { audioRef.current.pause(); };
  }, []);

  // Respect the enabled setting from UserSettings
  useEffect(() => {
    if (!enabled && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (isPlaying) {
      audioRef.current.src = SOUNDS[soundType] || SOUNDS.lightMusic;
      audioRef.current.play().catch(e => console.log("Audio play blocked by browser:", e));
    }
  }, [soundType, isPlaying]);

  const toggleMute = () => {
    if (!enabled) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.src = SOUNDS[soundType] || SOUNDS.lightMusic;
      audioRef.current.play().catch(e => console.log("Audio play blocked by browser:", e));
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <button 
      onClick={toggleMute}
      title={!enabled ? 'Sound disabled in settings' : isPlaying ? 'Pause ambient sound' : 'Play ambient sound'}
      style={{ opacity: enabled ? 1 : 0.4 }}
      className="absolute bottom-6 right-6 p-4 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md transition-colors text-white/80 hover:text-white border border-white/10 z-50 shadow-lg cursor-pointer flex items-center justify-center pointer-events-auto"
    >
      {isPlaying ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
    </button>
  );
}
