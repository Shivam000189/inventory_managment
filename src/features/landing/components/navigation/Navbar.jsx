import React from 'react';
import { motion } from 'framer-motion';

// Clean 3D cube logo matching the rest of the platform
const CubeLogo = () => (
  <svg
    className="w-5 h-5 text-[#1a1715] shrink-0"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12.3 2.1a1 1 0 0 0-.6 0l-8 3.5A1 1 0 0 0 3 6.5v11a1 1 0 0 0 .6.9l8 4.5a1 1 0 0 0 .8 0l8-4.5a1 1 0 0 0 .6-.9v-11a1 1 0 0 0-.7-.9l-8-3.5zm-.3 2.1 6.5 2.8-2.6 1.4-6.5-2.8 2.6-1.4zM5 8.1l6 2.6v8.4l-6-3.4V8.1zm14 7.6-6 3.4v-8.4l6-2.6v7.6z" />
  </svg>
);

export const Navbar = ({
  activeNav,
  onNavClick,
  onLoginClick,
  isLoggedIn = false,
  onDashboardClick
}) => {
  const navItems = [
    { label: 'Product', href: '#feature' },
    { label: 'Solutions', href: '#feature' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Contact', href: '#contact' }
  ];

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-7xl mx-auto px-6 sm:px-10 pt-6 pb-4 flex items-center justify-between relative z-30 select-none"
    >
      {/* Brand Logo */}
      <motion.a
        href="#home"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-2.5 group focus:outline-none"
      >
        <div className="w-8 h-8 rounded-lg bg-[#f0e7db] flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
          <CubeLogo />
        </div>
        <span className="text-xl font-extrabold tracking-tight text-[#1a1715]">
          Inventory
        </span>
      </motion.a>

      {/* Centered Navigation Links */}
      <nav className="hidden md:flex items-center gap-9 lg:gap-11 text-sm font-medium text-[#2d2925]">
        {navItems.map((item) => {
          const isActive = activeNav === item.label;
          return (
            <motion.a
              key={item.label}
              href={item.href}
              onClick={() => onNavClick && onNavClick(item.label)}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.96 }}
              className={`relative transition-colors hover:text-[#000000] ${
                isActive ? 'text-[#1a1715] font-semibold' : 'text-[#443e38]'
              }`}
            >
              {item.label}
              {isActive && (
                <motion.span
                  layoutId="navbar-active-pill"
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                  className="absolute -bottom-1.5 left-0 right-0 h-[2px] rounded-full bg-[#1a1715]"
                />
              )}
            </motion.a>
          );
        })}
      </nav>

      {/* Right Login / Dashboard CTA */}
      <div className="flex items-center gap-3">
        {isLoggedIn ? (
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            onClick={onDashboardClick}
            style={{ color: '#ffffff' }}
            className="landing-btn-dark px-5 sm:px-6 py-2 rounded-xl bg-[#28211b] hover:bg-[#140f0c] text-white !text-white font-semibold text-xs sm:text-sm shadow-sm transition-colors cursor-pointer"
          >
            <span style={{ color: '#ffffff' }} className="text-white !text-white">
              Go to Dashboard &rarr;
            </span>
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            onClick={onLoginClick}
            className="px-6 py-2 rounded-xl bg-[#ffffff] hover:bg-[#faf7f2] text-[#1a1715] font-semibold text-xs sm:text-sm border border-[#ede7df] shadow-2xs hover:border-[#ded6cb] transition-colors cursor-pointer"
          >
            Login
          </motion.button>
        )}
      </div>
    </motion.header>
  );
};

export default Navbar;
