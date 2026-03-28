import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw } from 'lucide-react';

const WORK_SECS = 25 * 60;
const BREAK_SECS = 5 * 60;

function formatTime(s) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const ss = (s % 60).toString().padStart(2, '0');
  return `${m}:${ss}`;
}

export default function FocusTimer() {
  const [mode, setMode]         = useState('work');   // 'work' | 'break'
  const [seconds, setSeconds]   = useState(WORK_SECS);
  const [running, setRunning]   = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef(null);

  const total = mode === 'work' ? WORK_SECS : BREAK_SECS;
  const progress = 1 - seconds / total;
  const circumference = 2 * Math.PI * 44; // r=44

  useEffect(() => {
    if (!running) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          if (mode === 'work') {
            setSessions(s => s + 1);
            setMode('break');
            setSeconds(BREAK_SECS);
          } else {
            setMode('work');
            setSeconds(WORK_SECS);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, mode]);

  const reset = () => {
    setRunning(false);
    setSeconds(mode === 'work' ? WORK_SECS : BREAK_SECS);
  };

  const accent = mode === 'work' ? '#818cf8' : '#34d399';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.85rem',
      padding: '1.25rem',
      background: 'rgba(0,0,0,0.4)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: '20px',
      border: `1px solid ${accent}33`,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      width: '200px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <AnimatePresence mode="wait">
          <motion.span
            key={mode}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            style={{
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: accent,
              fontWeight: 700,
            }}
          >
            {mode === 'work' ? '🎯 Focus' : '☕ Break'}
          </motion.span>
        </AnimatePresence>
        {sessions > 0 && (
          <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', padding: '1px 7px' }}>
            ×{sessions}
          </span>
        )}
      </div>

      {/* Ring */}
      <div style={{ position: 'relative', width: 110, height: 110 }}>
        <svg width="110" height="110" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="55" cy="55" r="44" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
          <motion.circle
            cx="55" cy="55" r="44"
            fill="none"
            stroke={accent}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset: circumference * (1 - progress) }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
            {formatTime(seconds)}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
        <button
          onClick={() => setRunning(r => !r)}
          style={{
            width: 40, height: 40,
            borderRadius: '50%',
            border: `1.5px solid ${accent}66`,
            background: `${accent}22`,
            color: accent,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
          }}
        >
          {running ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button
          onClick={reset}
          style={{
            width: 32, height: 32,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.5)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
          }}
        >
          <RotateCcw size={13} />
        </button>
      </div>
    </div>
  );
}
