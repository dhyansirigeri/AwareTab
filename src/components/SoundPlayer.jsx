import React, { useEffect, useState, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

const SOUNDS = {
  lofi: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3', 
  brownNoise: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_511d739b6e.mp3', 
  ambient: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_169b50db11.mp3', 
  lightMusic: 'https://cdn.pixabay.com/download/audio/2022/04/27/audio_496924b94d.mp3' 
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
