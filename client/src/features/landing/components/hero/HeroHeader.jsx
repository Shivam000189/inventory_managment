import React from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
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
      className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-4 sm:pb-6 text-center select-none"
    >
      {/* ======================================================== */}
      {/* CENTERED CONTENT BLOCK                                   */}
      {/* ======================================================== */}
      <div className="max-w-3xl mx-auto relative z-10">
        {/* Announcement Pill */}
        <motion.div variants={itemVariants} className="inline-block mb-4 sm:mb-5">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#ede4d8]/85 border border-[#ded3c3] shadow-2xs text-[#544d45] text-xs sm:text-[13px] font-medium cursor-default">
            Inventory, sales &amp; purchasing — all in one place
          </div>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          variants={itemVariants}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-extrabold tracking-tight leading-[1.14] text-[#1a1715] mb-4 sm:mb-5"
        >
          Run your entire business
          <br />
          from one{' '}
          <span className="text-[#526040] inline-block font-extrabold">
            inventory platform
          </span>
        </motion.h1>

        {/* Subtitle Paragraph */}
        <motion.p
          variants={itemVariants}
          className="max-w-5xl mx-auto text-center text-sm sm:text-base text-[#5e5852] leading-relaxed mb-10 font-normal"
        >
          Manage your stock, suppliers, purchases, sales and business insights
          <br className="hidden sm:inline" />
          with Inventory — a modern, all-in-one solution for growing businesses.
        </motion.p>

        {/* Action CTA Buttons */}
        <motion.div
          variants={itemVariants}
          className="flex flex-wrap items-center justify-center gap-3.5 sm:gap-4 mt-3 sm:mt-4"
        >
          {/* Explore Platform Primary Button */}
          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            onClick={onGetStarted}
            style={{ color: '#ffffff' }}
            className="landing-btn-dark px-7 py-3 rounded-2xl bg-[#28211b] hover:bg-[#140f0c] text-white !text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span style={{ color: '#ffffff' }} className="text-white !text-white">
              Explore platform &rarr;
            </span>
          </motion.button>

          {/* Book a Demo Secondary Button */}
          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            onClick={onBookDemo}
            className="px-6 py-3 rounded-2xl bg-[#ffffff] hover:bg-[#faf7f2] text-[#1a1715] text-sm font-semibold border border-[#ede7df] shadow-2xs hover:border-[#ded6cb] hover:shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-[#1a1715]" />
            <span>Book a demo</span>
          </motion.button>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default HeroHeader;
