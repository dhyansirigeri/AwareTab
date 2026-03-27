import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MoodBackground({ colors, children }) {
  return (
    <div className="relative w-screen h-screen overflow-hidden">
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
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}
