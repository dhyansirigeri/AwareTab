import React, { useState } from 'react';
import { Settings, X } from 'lucide-react';
import { MOODS } from '../MoodThemes';
import { motion, AnimatePresence } from 'framer-motion';

export default function ControlPanel({ currentMood, engine }) {
  const [isOpen, setIsOpen] = useState(false);

  const forceMood = (mood) => {
    if (engine && typeof engine.forceMood === 'function') {
      engine.forceMood(mood);
    } else {
      const event = new CustomEvent('moodChanged', { detail: mood });
      window.dispatchEvent(event);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="p-3 rounded-full bg-black/10 hover:bg-black/30 backdrop-blur-md transition-colors border border-white/10"
      >
        <Settings className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-80 bg-black/80 backdrop-blur-xl border-l border-white/10 z-50 p-6 text-white overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-semibold">AURA Control</h2>
                <button onClick={() => setIsOpen(false)} className="opacity-70 hover:opacity-100 p-2">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm uppercase tracking-wider opacity-60 mb-3 font-semibold">Debug: Force Mood</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.values(MOODS).map(m => (
                      <button
                        key={m}
                        onClick={() => forceMood(m)}
                        className={`py-3 px-3 rounded-lg text-sm font-medium transition-colors shadow-sm ${
                          currentMood === m 
                            ? 'bg-white text-black' 
                            : 'bg-white/10 hover:bg-white/20 border border-white/5'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="pt-6 border-t border-white/10">
                  <p className="text-sm opacity-80 leading-relaxed">
                    AURA automatically detects your mood based on your browsing behavior using the Emotion Engine.
                  </p>
                  <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-xs opacity-60 uppercase tracking-wider mb-1">Current State</p>
                    <p className="font-bold text-lg text-green-400">{currentMood}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
