import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export const Toast = ({ message }) => {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 450, damping: 30 }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-[#2f2a25] text-[#F6EDE1] px-4 py-3 rounded-xl shadow-2xl border border-[#4a3f36]"
        >
          <motion.span
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.8 }}
            className="w-2.5 h-2.5 rounded-full bg-[#7bbd65]"
          />
          <span className="text-sm font-medium tracking-wide">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
