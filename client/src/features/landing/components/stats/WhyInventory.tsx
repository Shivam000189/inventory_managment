import React from 'react';
import { motion } from 'framer-motion';

const STATS = [
  {
    id: 'time-saved',
    stat: '60%',
    line1: 'Less time on',
    line2: 'inventory management',
    icon: (
      // Rounded square with 4-corner sparkle
      <svg
        className="w-5 h-5 text-[#23201d]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
        <path d="M14.5 7.5L15.3 9.3L17.1 10.1L15.3 10.9L14.5 12.7L13.7 10.9L11.9 10.1L13.7 9.3L14.5 7.5Z" fill="currentColor" stroke="none" />
      </svg>
    )
  },
  {
    id: 'order-speed',
    stat: '3x',
    line1: 'Faster order processing',
    line2: null,
    icon: (
      // Stylized fast hourglass / speed timer
      <svg
        className="w-5 h-5 text-[#23201d]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M5 22h14" />
        <path d="M5 2h14" />
        <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
        <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
      </svg>
    )
  },
  {
    id: 'accuracy',
    stat: '99%',
    line1: 'Accurate stock records',
    line2: null,
    icon: (
      // Shield with checkmark
      <svg
        className="w-5 h-5 text-[#23201d]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    )
  },
  {
    id: 'stockout-reduction',
    stat: '40%',
    line1: 'Average reduction',
    line2: 'in stockouts',
    icon: (
      // Circular gauge / indicator with downward arrow
      <svg
        className="w-5 h-5 text-[#23201d]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 14V3" />
        <path d="m8 10 4 4 4-4" />
        <path d="M20.49 15a9 9 0 1 1-16.98 0" />
      </svg>
    )
  }
];

export const WhyInventory = () => {
  return (
    <section id="why-Inventory" className="py-12 sm:py-16 px-5 sm:px-8 max-w-6xl mx-auto select-none">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-3xl mx-auto mb-8 sm:mb-10"
      >
        <span className="text-[11px] sm:text-xs font-bold tracking-widest text-[#786f64] uppercase block mb-2">
          WHY Inventory
        </span>
        <h2 className="text-2xl sm:text-3xl md:text-[34px] font-extrabold tracking-tight text-[#1a1715] leading-tight mb-2 sm:mb-2.5">
          Spend less time managing stock. More time growing.
        </h2>
        <p className="text-xs sm:text-sm text-[#5e5852] font-normal leading-relaxed max-w-xl mx-auto">
          Join hundreds of businesses that trust Inventory to streamline their operations.
        </p>
      </motion.div>

      {/* 4 Impact Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {STATS.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{
              duration: 0.5,
              delay: idx * 0.08,
              ease: [0.16, 1, 0.3, 1]
            }}
            whileHover={{ y: -3, scale: 1.01 }}
            className="rounded-2xl bg-[#ffffff] border border-[#ede7df] shadow-[0_2px_10px_rgba(47,31,19,0.03)] hover:shadow-[0_8px_22px_rgba(47,31,19,0.07)] transition-all duration-200 p-5 sm:p-5.5 flex items-center gap-4"
          >
            {/* Pale Sage Green Icon Circle */}
            <div className="w-12 h-12 rounded-full bg-[#eaf4e7] flex items-center justify-center shrink-0">
              {item.icon}
            </div>

            {/* Stat & Description */}
            <div className="min-w-0 flex flex-col justify-center">
              <span className="text-2xl sm:text-[28px] font-extrabold text-[#1a1715] tracking-tight leading-none">
                {item.stat}
              </span>
              <p className="text-xs sm:text-[12.5px] text-[#5e5852] font-medium leading-snug mt-1.5">
                {item.line1}
                {item.line2 && (
                  <>
                    <br className="hidden sm:inline" />
                    {item.line2}
                  </>
                )}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default WhyInventory;

