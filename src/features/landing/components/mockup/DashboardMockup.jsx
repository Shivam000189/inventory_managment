import React from 'react';
import { motion } from 'framer-motion';
import { CategorySidebar } from './CategorySidebar';
import { MockupNavbar } from './MockupNavbar';
import { OrderPanel } from './OrderPanel';
import { ProductGrid } from './ProductGrid';

export const DashboardMockup = ({
  categories,
  activeCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  filteredInventory,
  onSelectProduct,
  orderMode,
  onOrderModeChange,
  orderItems,
  onClearOrders,
  onQuickAction,
  onToggleMenu
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 35, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="relative max-w-6xl mx-auto px-4 sm:px-6 mt-2"
    >
      {/* Subtle Warm Glow Behind Mockup with gentle breathing animation */}
      <motion.div
        animate={{ opacity: [0.65, 0.85, 0.65] }}
        transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
        className="absolute -inset-6 rounded-[36px] -z-10 blur-2xl"
        style={{
          background:
            'radial-gradient(circle at 50% 35%, #e2d1ba 0%, #F6EDE1 55%, transparent 80%)'
        }}
      />

      {/* Outer Translucent Frame */}
      <div className="relative rounded-t-[28px] p-3 sm:p-5 bg-[#fbf7f0]/85 border border-[#e5d8c6] shadow-2xl backdrop-blur-md overflow-hidden">
        {/* Inner App Window */}
        <div className="bg-[#faf6f0] rounded-t-2xl border border-[#ece0d0] overflow-hidden shadow-inner">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Left + Center Area (9 Cols) */}
            <div className="lg:col-span-9 p-4 sm:p-5 flex flex-col">
              <MockupNavbar
                searchQuery={searchQuery}
                onSearchChange={onSearchChange}
                onToggleMenu={onToggleMenu}
              />

              <div className="flex flex-col sm:flex-row gap-4">
                <CategorySidebar
                  categories={categories}
                  activeCategory={activeCategory}
                  onSelectCategory={onSelectCategory}
                />

                <ProductGrid
                  products={filteredInventory}
                  onSelectProduct={onSelectProduct}
                />
              </div>
            </div>

            {/* Right Panel (3 Cols) */}
            <OrderPanel
              orderMode={orderMode}
              onOrderModeChange={onOrderModeChange}
              orderItems={orderItems}
              onClearOrders={onClearOrders}
              onQuickAction={onQuickAction}
            />
          </div>
        </div>

        {/* Bottom Soft Cream Fade-Out Overlay */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-32 z-10"
          style={{
            background:
              'linear-gradient(to bottom, rgba(246, 236, 223, 0) 0%, rgba(246, 236, 223, 0.85) 65%, #f6ecdf 100%)'
          }}
        />
      </div>
    </motion.div>
  );
};
