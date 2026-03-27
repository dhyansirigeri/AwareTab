import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MoodBackground({ colors, timeOfDay, weatherCondition, mood, children }) {
  const [videoError, setVideoError] = useState(false);
  const [mediaSrc, setMediaSrc] = useState(null);
  const [rules, setRules] = useState([]);

  useEffect(() => {
    fetch('/assets/backgrounds/config.json')
      .then(r => r.ok ? r.json() : [])
      .then(data => setRules(data))
      .catch(() => setRules([]));
  }, []);

  useEffect(() => {
    setVideoError(false);
    if (!rules.length || weatherCondition === 'Loading') {
      setMediaSrc(null);
      return;
    }

    // Find the first rule that matches the current environment
    const matchedRule = rules.find(rule => {
      const timeMatch = !rule.time || rule.time === timeOfDay;
      const weatherMatch = !rule.weather || rule.weather === weatherCondition;
      const moodMatch = !rule.mood || rule.mood.toLowerCase() === mood.toLowerCase();
      return timeMatch && weatherMatch && moodMatch;
    });

    if (matchedRule) {
      setMediaSrc(`/assets/backgrounds/${matchedRule.file}`);
      if (matchedRule.theme) {
        document.documentElement.style.setProperty('--theme-text', matchedRule.theme.text || '255 255 255');
        document.documentElement.style.setProperty('--theme-bg', matchedRule.theme.bg || '0 0 0');
        document.documentElement.style.setProperty('--theme-border', matchedRule.theme.border || '255 255 255');
      } else {
        document.documentElement.style.setProperty('--theme-text', '255 255 255');
        document.documentElement.style.setProperty('--theme-bg', '0 0 0');
        document.documentElement.style.setProperty('--theme-border', '255 255 255');
      }
    } else {
      setMediaSrc(null);
      document.documentElement.style.setProperty('--theme-text', '255 255 255');
      document.documentElement.style.setProperty('--theme-bg', '0 0 0');
      document.documentElement.style.setProperty('--theme-border', '255 255 255');
    }
  }, [timeOfDay, weatherCondition, mood, rules]);

  // Determine if the media is video or image
  const isVideo = mediaSrc && (mediaSrc.endsWith('.mp4') || mediaSrc.endsWith('.webm'));
  const isImage = mediaSrc && (mediaSrc.endsWith('.gif') || mediaSrc.endsWith('.jpg') || mediaSrc.endsWith('.png') || mediaSrc.endsWith('.jpeg'));

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {/* Fallback CSS Gradient */}
      <AnimatePresence>
        <motion.div
          key={colors.join(',')}
          className="absolute inset-0 z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.8, ease: "easeInOut" }}
          style={{
            background: `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`
          }}
        />
      </AnimatePresence>

      {/* Media Background */}
      <AnimatePresence>
        {isVideo && !videoError && (
          <motion.video
            key={mediaSrc}
            src={mediaSrc}
            autoPlay
            loop
            muted
            playsInline
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 w-full h-full object-cover z-0"
            onError={() => setVideoError(true)}
          />
        )}
        {isImage && !videoError && (
          <motion.img
            key={mediaSrc}
            src={mediaSrc}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 w-full h-full object-cover z-0"
            onError={() => setVideoError(true)}
          />
        )}
      </AnimatePresence>

      {/* Overlay for better contrast */}
      <div className="absolute inset-0 z-0 bg-black/20 pointer-events-none transition-opacity duration-1000" />

      {/* Children Content */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}
