import React from 'react';
import { motion } from 'framer-motion';

export const CategorySidebar = ({
  categories,
  activeCategory,
  onSelectCategory
}) => {
  return (
    <div className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-visible sm:w-24 shrink-0 pb-2 sm:pb-0">
      {categories.map((cat) => {
        const IconComponent = cat.icon;
        const active = activeCategory === cat.name;
        return (
          <motion.button
            key={cat.name}
            onClick={() => onSelectCategory(cat.name)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`relative flex flex-col items-center justify-center py-3.5 px-2 rounded-xl transition-all cursor-pointer shrink-0 sm:w-full border ${
              active
                ? 'bg-[#ffffff] text-[#2f1f13] shadow-sm border-[#e6d8c5]'
                : 'bg-[#f1e8dc]/70 text-[#2f1f13]/65 border-transparent hover:bg-[#F6EDE1]'
            }`}
          >
            {/* Left Active Pill Indicator */}
            {active && (
              <motion.span
                layoutId="category-sidebar-active"
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                className="hidden sm:block absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-[#2f2a25]"
              />
            )}
            <IconComponent
              className={`w-5 h-5 mb-1.5 transition-colors ${
                active ? 'text-[#2f2a25]' : 'text-[#2f1f13]/55'
              }`}
            />
            <span className="text-[11px] font-medium leading-tight text-center">
              {cat.name}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
};
