import React, { useState } from 'react';
import { Hero } from './components/Hero';
import { Studio } from './components/Studio';
import { AnimatePresence, motion } from 'framer-motion';

export default function App() {
  const [hasStarted, setHasStarted] = useState(false);

  return (
    <div className="bg-black min-h-screen text-white">
      <AnimatePresence mode="wait">
        {!hasStarted ? (
          <motion.div
            key="hero"
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.5 }}
          >
            <Hero onStart={() => setHasStarted(true)} />
          </motion.div>
        ) : (
          <motion.div
            key="studio"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <Studio />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}