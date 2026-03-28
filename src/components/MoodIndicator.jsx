import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { THEMES } from '../MoodThemes';

/**
 * MoodIndicator — a small floating badge showing the current detected mood.
 * Fades in on mood change, then dimly persists.
 */
export default function MoodIndicator({ mood }) {
  const [visible, setVisible] = useState(true);
  const [dimmed, setDimmed]   = useState(false);
  const theme = THEMES[mood];

  // Flash bright on mood change, then dim after 3s
  useEffect(() => {
    setVisible(true);
    setDimmed(false);
    const t = setTimeout(() => setDimmed(true), 3000);
    return () => clearTimeout(t);
  }, [mood]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={mood}
          initial={{ opacity: 0, scale: 0.8, y: -8 }}
          animate={{ opacity: dimmed ? 0.45 : 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -8 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          title={theme?.moodHint}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.3rem 0.75rem',
            borderRadius: '999px',
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: `1px solid ${theme?.accentColor ?? '#fff'}44`,
            boxShadow: `0 0 16px ${theme?.accentColor ?? '#fff'}22`,
            fontSize: '0.72rem',
            fontWeight: 600,
            color: theme?.accentColor ?? '#fff',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            cursor: 'default',
            userSelect: 'none',
            transition: 'opacity 0.6s',
          }}
        >
          <span style={{ fontSize: '0.9rem' }}>{theme?.moodEmoji ?? '😐'}</span>
          {theme?.moodLabel ?? mood}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
