import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FileCheck,
  ScanBarcode,
  Users,
  Warehouse
} from 'lucide-react';

export const OrderPanel = ({
  orderMode,
  onOrderModeChange,
  orderItems,
  onClearOrders,
  onQuickAction
}) => {
  const quickActions = [
    { label: 'Supplier', icon: Users },
    { label: 'Warehouse', icon: Warehouse },
    { label: 'Batch Scan', icon: ScanBarcode },
    { label: 'Save PO', icon: FileCheck }
  ];

  return (
    <div className="lg:col-span-3 bg-[#ffffff] border-t lg:border-t-0 lg:border-l border-[#ece0d0] p-4 sm:p-5 flex flex-col justify-between">
      <div>
        {/* 2x2 Quick Action Buttons Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          {quickActions.map((btn) => {
            const BtnIcon = btn.icon;
            return (
              <motion.button
                key={btn.label}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                onClick={() => onQuickAction(btn.label)}
                className="flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border border-[#ebe0d1] bg-[#fdfbf8] hover:bg-[#F6EDE1] transition-colors cursor-pointer shadow-2xs"
              >
                <BtnIcon className="w-4 h-4 text-[#2f2a25] mb-1" />
                <span className="text-[11px] font-semibold text-[#2f1f13]">
                  {btn.label}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Section Heading */}
        <h3 className="text-sm font-bold text-[#2f1f13] mb-3">Order Details</h3>

        {/* Segmented Mode Toggle (Restock In / Dispatch Out) */}
        <div className="grid grid-cols-2 bg-[#f5ece0] p-1 rounded-xl mb-4 relative">
          {['Restock In', 'Dispatch Out'].map((tab) => {
            const active = orderMode === tab;
            return (
              <button
                key={tab}
                onClick={() => onOrderModeChange(tab)}
                className={`relative py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer z-10 ${
                  active
                    ? 'text-[#2f1f13]'
                    : 'text-[#2f1f13]/60 hover:text-[#2f1f13]'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="order-mode-active-bg"
                    transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                    className="absolute inset-0 bg-[#ffffff] rounded-lg shadow-xs -z-10"
                  />
                )}
                {tab}
                {active && (
                  <motion.span
                    layoutId="order-mode-indicator-pill"
                    transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                    className="absolute bottom-1 left-1/2 -translate-x-1/2 w-5 h-[2.5px] rounded-full bg-[#7bbd65]"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Order Line Items List */}
        <div className="space-y-3 max-h-[340px] overflow-hidden pr-1">
          {orderItems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-8 text-center text-xs text-[#2f1f13]/40"
            >
              No items selected in queue
            </motion.div>
          ) : (
            <AnimatePresence initial={false}>
              {orderItems.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0, x: -20, height: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="pb-3 border-b border-[#f1e7d8] last:border-none flex items-start justify-between"
                >
                  <div>
                    <p className="text-xs font-bold text-[#2f1f13]">{item.name}</p>
                    <p className="text-[11px] text-[#2f1f13]/50 mt-0.5">
                      <span className="font-semibold text-[#2f1f13]/75">
                        X{item.qty}
                      </span>{' '}
                      ${item.unitPrice.toFixed(2)}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#2f1f13]">
                    ${(item.qty * item.unitPrice).toFixed(2)}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Clear All Action */}
      <div className="pt-4 text-center relative z-20">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClearOrders}
          className="text-xs font-medium text-[#2f1f13]/50 hover:text-[#2f1f13] transition-colors cursor-pointer"
        >
          Clear All Order
        </motion.button>
      </div>
    </div>
  );
};
