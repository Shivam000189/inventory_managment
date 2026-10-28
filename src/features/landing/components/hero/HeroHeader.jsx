import React from 'react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      ease: [0.16, 1, 0.3, 1]
    }
  }
};

export const HeroHeader = ({
  onGetStarted,
  onBookDemo
}) => {
  return (
    <motion.section
      id="home"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto px-6 pt-12 pb-10 text-center"
    >
      {/* Announcement Pill with subtle hover & float */}
      <motion.div variants={itemVariants} className="inline-block mb-7">
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
          whileHover={{ scale: 1.03 }}
          className="inline-flex items-center gap-2.5 p-1 pr-4 rounded-full bg-[#fbf8f3]/90 border border-[#e5d8c7] shadow-xs cursor-default backdrop-blur-xs"
        >
          <span className="px-3 py-1 rounded-full bg-[#2f2a25] text-[#F6EDE1] text-xs font-semibold tracking-wide">
            New
          </span>
          <span className="text-xs sm:text-sm font-medium text-[#2f1f13]/85">
            Effortless stock control for your business
          </span>
        </motion.div>
      </motion.div>

      {/* Main Headline */}
      <motion.h1
        variants={itemVariants}
        className="text-4xl sm:text-6xl md:text-[64px] font-bold tracking-tight leading-[1.12] text-[#0d0d0d] mb-6"
      >
        Your{' '}
        <span className="bg-gradient-to-r from-[#2f2a25] via-[#6e5239] to-[#7bbd65] bg-clip-text text-transparent">
          All-In-One
        </span>
        <br />
        Inventory Solution
      </motion.h1>

      {/* Subheadline */}
      <motion.p
        variants={itemVariants}
        className="max-w-xl mx-auto text-sm sm:text-base text-[#2f1f13]/70 leading-relaxed mb-8 font-normal"
      >
        Our solution offers a comprehensive suite of features to help you manage your
        inventory, track warehouse stock, and enhance fulfillment accuracy.
      </motion.p>

      {/* CTA Buttons Pair */}
      <motion.div
        variants={itemVariants}
        className="flex flex-wrap items-center justify-center gap-4"
      >
        <motion.button
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 18 }}
          onClick={onGetStarted}
          style={{ color: '#ffffff' }}
          className="landing-btn-dark px-7 py-3.5 rounded-xl bg-[#2f2a25] hover:bg-[#0d0d0d] text-white !text-white text-sm font-semibold shadow-md hover:shadow-xl transition-shadow cursor-pointer"
        >
          <span style={{ color: '#ffffff' }} className="text-white !text-white">Get Started</span>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 18 }}
          onClick={onBookDemo}
          className="px-7 py-3.5 rounded-xl bg-[#fbf8f3] hover:bg-[#F6EDE1] text-[#2f1f13] text-sm font-semibold border border-[#e2d4c1] shadow-xs hover:shadow-md transition-shadow cursor-pointer"
        >
          Book a Demo
        </motion.button>
      </motion.div>
    </motion.section>
  );
};
