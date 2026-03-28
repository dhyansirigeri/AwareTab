import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Greeting({ phrase }) {
  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={phrase}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        style={{
          fontFamily: "'Sora', 'Inter', sans-serif",
          fontSize: 'clamp(1rem, 2vw, 1.35rem)',
          fontWeight: 300,
          lineHeight: 1.45,
          color: 'rgba(255,255,255,0.82)',
          letterSpacing: '0.01em',
          textShadow: '0 1px 12px rgba(0,0,0,0.5)',
          margin: 0,
        }}
      >
        {phrase}
      </motion.p>
    </AnimatePresence>
  );
}
