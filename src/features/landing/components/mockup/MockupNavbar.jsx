import React from 'react';
import { Menu, Search, Zap } from 'lucide-react';

export const MockupNavbar = ({
  searchQuery,
  onSearchChange,
  onToggleMenu
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pb-5">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMenu}
          className="p-2 rounded-lg text-[#2f1f13]/70 hover:bg-[#F6EDE1] transition-colors cursor-pointer"
          title="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-[#2f2a25] fill-[#7bbd65]" />
          <span className="font-bold text-lg text-[#2f1f13]">Inventry</span>
        </div>
      </div>

      {/* Interactive Search Input inside Mockup */}
      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 text-[#2f1f13]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search SKU or Product.."
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#ffffff] border border-[#ebe0d2] text-xs sm:text-sm text-[#2f1f13] placeholder-[#2f1f13]/40 focus:outline-none focus:border-[#2f2a25]"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#2f1f13]/50 hover:text-[#2f1f13] cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};
