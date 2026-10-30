import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Zap } from 'lucide-react';

export const DemoModal = ({
  isOpen,
  onClose,
  onSubmitSuccess
}) => {
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmitSuccess(email, company);
    setEmail('');
    setCompany('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-[#0d0d0d]/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            className="bg-[#fbf8f3] border border-[#e2d3c0] rounded-3xl max-w-md w-full p-7 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="absolute top-5 right-5 text-xs font-bold px-2.5 py-1 rounded-lg bg-[#F6EDE1] text-[#2f1f13] hover:bg-[#e5d6c3] cursor-pointer"
            >
              ESC
            </motion.button>
            <div className="w-10 h-10 rounded-xl bg-[#2f2a25] flex items-center justify-center mb-4 shadow-sm">
              <Zap className="w-5 h-5 text-[#7bbd65] fill-[#7bbd65]" />
            </div>
            <h3 className="text-2xl font-bold text-[#0d0d0d] mb-1">
              Launch your Inventory workspace
            </h3>
            <p className="text-sm text-[#2f1f13]/70 mb-6">
              Get instant sandbox access or schedule a 1-on-1 guided tour with our
              inventory specialists.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2f1f13] mb-1">
                  Work Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@yourcompany.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#ffffff] border border-[#dfd0bc] text-sm focus:outline-none focus:border-[#2f2a25] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#2f1f13] mb-1">
                  Company / Warehouse Name
                </label>
                <input
                  type="text"
                  required
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Logistics Ltd."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#ffffff] border border-[#dfd0bc] text-sm focus:outline-none focus:border-[#2f2a25] transition-colors"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                style={{ color: '#ffffff' }}
                className="landing-btn-dark w-full py-3.5 rounded-xl bg-[#2f2a25] hover:bg-[#0d0d0d] text-white !text-white font-bold text-sm shadow-md transition-colors cursor-pointer"
              >
                <span style={{ color: '#ffffff' }} className="text-white !text-white">Create Free Workspace</span>
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
