import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export const RoiCalculator = ({
  monthlySKUs,
  warehousesCount,
  onSKUsChange,
  onWarehousesChange,
  onGetReport
}) => {
  const estimatedHoursSaved = Math.round(monthlySKUs * 0.045 + warehousesCount * 28);
  const estimatedCapitalSaved = Math.round(monthlySKUs * 8.4 + warehousesCount * 3200);

  return (
    <motion.section
      initial={{ opacity: 0, y: 35 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="py-16 px-6 max-w-6xl mx-auto"
    >
      <div
        className="rounded-[32px] p-8 sm:p-12 border border-[#e2d2be] shadow-md relative overflow-hidden"
        style={{
          background:
            'radial-gradient(circle at 85% 20%, #e7d7c1 0%, #F6EDE1 55%, #f6ecdf 100%)'
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <motion.span
              whileHover={{ scale: 1.05 }}
              className="inline-block px-3 py-1 rounded-full bg-[#2f2a25] text-[#F6EDE1] text-xs font-semibold mb-4 cursor-default shadow-2xs"
            >
              ROI Estimator
            </motion.span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0d0d0d] mb-3">
              Calculate your annual warehouse savings
            </h2>
            <p className="text-sm sm:text-base text-[#2f1f13]/75 mb-8">
              Adjust the sliders below to see how much dead-stock capital and manual
              reconciliation time Inventry unlocks for your team.
            </p>

            {/* Slider 1: Active SKUs */}
            <div className="mb-6">
              <div className="flex justify-between text-sm font-semibold mb-2">
                <span>Active SKUs Managed</span>
                <span className="px-3 py-0.5 rounded-lg bg-[#fbf8f3] border border-[#dfd0bc] font-bold">
                  {monthlySKUs.toLocaleString()} SKUs
                </span>
              </div>
              <input
                type="range"
                min="200"
                max="15000"
                step="100"
                value={monthlySKUs}
                onChange={(e) => onSKUsChange(Number(e.target.value))}
                className="w-full accent-[#2f2a25] cursor-pointer h-2 rounded-lg bg-[#dfd0bc]"
              />
            </div>

            {/* Slider 2: Warehouse Locations */}
            <div>
              <div className="flex justify-between text-sm font-semibold mb-2">
                <span>Warehouse / Store Locations</span>
                <span className="px-3 py-0.5 rounded-lg bg-[#fbf8f3] border border-[#dfd0bc] font-bold">
                  {warehousesCount} {warehousesCount === 1 ? 'Location' : 'Locations'}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                step="1"
                value={warehousesCount}
                onChange={(e) => onWarehousesChange(Number(e.target.value))}
                className="w-full accent-[#2f2a25] cursor-pointer h-2 rounded-lg bg-[#dfd0bc]"
              />
            </div>
          </div>

          {/* Output Card */}
          <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.3 }}
            className="lg:col-span-5 bg-[#2f2a25] text-[#F6EDE1] rounded-3xl p-8 shadow-xl border border-[#463e37]"
          >
            <p className="text-xs uppercase tracking-wider text-[#F6EDE1]/60 font-semibold mb-1">
              Projected Annual Impact
            </p>
            <div className="text-4xl sm:text-5xl font-bold text-[#7bbd65] mb-6 flex items-baseline flex-wrap">
              <motion.span
                key={estimatedCapitalSaved}
                initial={{ opacity: 0.6, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                ${estimatedCapitalSaved.toLocaleString()}
              </motion.span>
              <span className="text-sm font-normal text-[#F6EDE1]/70 ml-1">
                / year saved
              </span>
            </div>

            <div className="space-y-4 border-t border-[#463e37] pt-5 mb-7">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#F6EDE1]/75">Audit Hours Reclaimed</span>
                <span className="font-bold text-[#F6EDE1]">
                  {estimatedHoursSaved} hrs / mo
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#F6EDE1]/75">Stockout Reduction</span>
                <span className="font-bold text-[#7bbd65]">-94.2%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#F6EDE1]/75">Order Picking Accuracy</span>
                <span className="font-bold text-[#F6EDE1]">99.98%</span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.03, x: 2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              onClick={onGetReport}
              className="w-full py-3.5 rounded-xl bg-[#F6EDE1] hover:bg-[#ffffff] text-[#2f1f13] font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <span>Get Custom ROI Report</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};
