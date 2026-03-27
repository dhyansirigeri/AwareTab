import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Greeting({ phrase }) {
  return (
    <div className="mt-4 text-2xl md:text-3xl font-light opacity-90 drop-shadow-md">
      <AnimatePresence mode="wait">
        <motion.p
          key={phrase}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.8 }}
        >
          {phrase}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
