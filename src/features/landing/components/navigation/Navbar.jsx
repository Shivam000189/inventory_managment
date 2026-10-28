import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

export const Navbar = ({
  activeNav,
  onNavClick,
  onLoginClick,
  isLoggedIn = false,
  onDashboardClick
}) => {
  const navItems = [
    { label: 'Home', href: '#home' },
    { label: 'Feature', href: '#feature' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Contact Us', href: '#contact' }
  ];

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-7xl mx-auto px-6 sm:px-10 pt-6 pb-4 flex items-center justify-between relative z-30"
    >
      {/* Brand Logo */}
      <motion.a
        href="#home"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-2.5 group focus:outline-none"
      >
        <motion.div
          whileHover={{ rotate: 12, scale: 1.08 }}
          transition={{ type: 'spring', stiffness: 350, damping: 15 }}
          className="w-8 h-8 rounded-lg bg-[#2f2a25] flex items-center justify-center shadow-sm"
        >
          <Zap className="w-4 h-4 text-[#7bbd65] fill-[#7bbd65]" />
        </motion.div>
        <span className="text-xl font-bold tracking-tight text-[#2f1f13]">
          Inventry
        </span>
      </motion.a>

      {/* Nav Links */}
      <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#2f1f13]/80">
        {navItems.map((item) => {
          const isActive = activeNav === item.label;
          return (
            <motion.a
              key={item.label}
              href={item.href}
              onClick={() => onNavClick(item.label)}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.96 }}
              className={`relative py-2 px-1 transition-colors hover:text-[#2f1f13] ${
                isActive ? 'text-[#2f1f13] font-semibold' : ''
              }`}
            >
              {item.label}
              {isActive && (
                <motion.span
                  layoutId="navbar-active-pill"
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                  className="absolute bottom-0 left-0 right-0 h-[3px] rounded-full bg-[#2f2a25]"
                />
              )}
            </motion.a>
          );
        })}
      </nav>

      {/* Login / Dashboard CTA */}
      <div className="flex items-center gap-3">
        {isLoggedIn ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            onClick={onDashboardClick}
            style={{ color: '#ffffff' }}
            className="landing-btn-dark px-6 py-2.5 rounded-xl bg-[#2f2a25] hover:bg-[#1a1714] text-white !text-white font-semibold text-sm shadow-sm transition-colors cursor-pointer"
          >
            <span style={{ color: '#ffffff' }} className="text-white !text-white">Go to Dashboard &rarr;</span>
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            onClick={onLoginClick}
            className="px-6 py-2.5 rounded-xl bg-[#fbf8f3] hover:bg-[#F6EDE1] text-[#2f1f13] font-semibold text-sm border border-[#e2d4c1] shadow-sm transition-colors cursor-pointer"
          >
            Login
          </motion.button>
        )}
      </div>
    </motion.header>
  );
};
