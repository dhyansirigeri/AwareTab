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
      flexDirection: 'row',
      alignItems: 'center',
      gap: '1.5rem',
      padding: '0.75rem 1.25rem',
      background: 'rgba(10, 10, 10, 0.4)',
      backdropFilter: 'blur(30px)',
      WebkitBackdropFilter: 'blur(30px)',
      borderRadius: '999px',
      border: `1px solid ${accent}44`,
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      color: '#fff',
    }}>
      {/* Header / Mode Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '85px' }}>
        <AnimatePresence mode="wait">
          <motion.span
            key={mode}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            style={{
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: accent,
              fontWeight: 700,
            }}
          >
            {mode === 'work' ? '🎯 FOCUS' : '☕ BREAK'}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Timer Text */}
      <div style={{ 
        fontSize: '1.75rem', 
        fontWeight: 600, 
        letterSpacing: '-0.02em', 
        fontVariantNumeric: 'tabular-nums',
        minWidth: '80px',
        textAlign: 'center'
      }}>
        {formatTime(seconds)}
      </div>

      {/* Controls & Sessions combined */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button
          onClick={() => setRunning(r => !r)}
          style={{
            width: 36, height: 36,
            borderRadius: '50%',
            background: running ? `${accent}22` : `rgba(255,255,255,0.1)`,
            color: running ? accent : '#fff',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s ease',
            border: 'none',
          }}
          title={running ? "Pause" : "Start"}
        >
          {running ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" style={{ marginLeft: '2px' }} />}
        </button>

        <button
          onClick={reset}
          style={{
            width: 36, height: 36,
            borderRadius: '50%',
            background: 'transparent',
            color: 'rgba(255,255,255,0.5)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
            border: 'none',
          }}
          title="Reset Timer"
          onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.background = 'transparent'; }}
        >
          <RotateCcw size={14} />
        </button>

        {sessions > 0 && (
          <div style={{ marginLeft: '0.5rem', paddingLeft: '0.75rem', borderLeft: '1px solid rgba(255,255,255,0.1)'}}>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
              {sessions}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginLeft: '2px' }}>SETS</span>
          </div>
        )}
      </div>
    </div>
  );
}
