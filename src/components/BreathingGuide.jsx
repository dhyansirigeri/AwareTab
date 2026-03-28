import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PHASES = [
  { label: 'Breathe In',  duration: 4, scale: 1.35, color: 'rgba(251,191,36,0.65)' },
  { label: 'Hold',        duration: 4, scale: 1.35, color: 'rgba(251,191,36,0.45)' },
  { label: 'Breathe Out', duration: 4, scale: 1.0,  color: 'rgba(251,191,36,0.25)' },
  { label: 'Hold',        duration: 4, scale: 1.0,  color: 'rgba(251,191,36,0.15)' },
];

export default function BreathingGuide() {
  const [phase, setPhase]     = useState(0);
  const [count, setCount]     = useState(PHASES[0].duration);
  const [active, setActive]   = useState(false);
  const intervalRef = useRef(null);
  const timerRef    = useRef(null);

  const start = () => {
    setActive(true);
    setPhase(0);
    setCount(PHASES[0].duration);
  };

  const stop = () => {
    setActive(false);
    clearInterval(intervalRef.current);
    clearTimeout(timerRef.current);
  };

  useEffect(() => {
    if (!active) return;

    let currentPhase = phase;
    let currentCount = PHASES[currentPhase].duration;
    setCount(currentCount);

    intervalRef.current = setInterval(() => {
      currentCount -= 1;
      if (currentCount <= 0) {
        currentPhase = (currentPhase + 1) % PHASES.length;
        currentCount = PHASES[currentPhase].duration;
        setPhase(currentPhase);
      }
      setCount(currentCount);
    }, 1000);

    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const currentPhase = PHASES[phase];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem',
      padding: '1.25rem',
      background: 'rgba(0,0,0,0.35)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: '20px',
      border: '1px solid rgba(251,191,36,0.25)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      width: '200px',
    }}>
      <p style={{
        fontSize: '0.7rem',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        color: 'rgba(251,191,36,0.7)',
        margin: 0,
        fontWeight: 600,
      }}>
        Box Breathing
      </p>

      {/* Ring */}
      <div style={{ position: 'relative', width: 110, height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          animate={active ? { scale: currentPhase.scale } : { scale: 1.0 }}
          transition={{ duration: currentPhase.duration * 0.9, ease: 'easeInOut' }}
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: active ? currentPhase.color : 'rgba(251,191,36,0.12)',
            border: '2px solid rgba(251,191,36,0.4)',
            boxShadow: active ? `0 0 28px ${currentPhase.color}` : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={`count-${count}`}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.2 }}
              style={{ fontSize: '1.6rem', fontWeight: 700, color: 'rgba(251,191,36,0.9)', lineHeight: 1 }}
            >
              {active ? count : '·'}
            </motion.span>
          </AnimatePresence>
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={active ? phase : 'idle'}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3 }}
          style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)', fontWeight: 500, textAlign: 'center' }}
        >
          {active ? currentPhase.label : 'Ready when you are'}
        </motion.p>
      </AnimatePresence>

      <button
        onClick={active ? stop : start}
        style={{
          padding: '0.45rem 1.2rem',
          borderRadius: '999px',
          border: '1px solid rgba(251,191,36,0.4)',
          background: active ? 'rgba(251,191,36,0.15)' : 'rgba(251,191,36,0.25)',
          color: 'rgba(251,191,36,0.9)',
          fontSize: '0.78rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s',
          letterSpacing: '0.04em',
        }}
      >
        {active ? 'Stop' : 'Start'}
      </button>
    </div>
  );
}
