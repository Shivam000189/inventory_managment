import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  ChevronDown,
  Monitor,
  Pill,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Store,
  Upload
} from 'lucide-react';

// Crisp 3D package icon matching the reference style
const PackageIcon = () => (
  <svg
    className="w-6 h-6 text-[#1f1d1b]"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.3 7 8.7 5 8.7-5" />
    <path d="M12 22V12" />
    <path d="m7.5 4.5 9 5.2" />
  </svg>
);

// Running shoe vector matching the reorder alert card thumbnail
const RunningShoeIcon = () => (
  <svg
    className="w-7 h-7 text-[#5c3e28]"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M2.5 14.5c1.2-1.5 3-2 5-2 1.8 0 3 .8 4.2 1.8l2.3 2c1.2 1 2.5 1.5 4.5 1.5h2.5c.8 0 1.5.7 1.5 1.5v.5c0 .6-.4 1.2-1 1.2H3c-.6 0-1-.6-.9-1.2l.4-3.3z" fill="#784e2d" fillOpacity="0.25" />
    <path d="M6 10.5c2-1 4.5-.5 6 1l3 2.5c1 .8 2.2 1.2 3.5 1.2h2.5c.6 0 1 .4 1 1s-.4 1-1 1h-3c-1.6 0-3-.5-4.2-1.5l-2.8-2.3C9.5 10.8 8 10.3 6.5 11l-3 1.5c-.3.2-.8 0-.9-.4l-.5-2.2c-.1-.5.3-1 .8-1.2L6 10.5z" />
    <line x1="7" y1="12" x2="8.5" y2="13.5" />
    <line x1="9.5" y1="13" x2="11" y2="14.5" />
  </svg>
);

// Green CSV file badge icon
const CsvFileIcon = () => (
  <svg
    className="w-7 h-7 text-[#16a34a]"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="16" y2="17" />
  </svg>
);

// Green XLSX file badge icon
const XlsxFileIcon = () => (
  <svg
    className="w-7 h-7 text-[#059669]"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="12" y2="17" />
    <line x1="12" y1="13" x2="8" y2="17" />
    <line x1="15" y1="13" x2="15" y2="17" />
  </svg>
);

// Red PDF file badge icon
const PdfFileIcon = () => (
  <svg
    className="w-7 h-7 text-[#e11d48]"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="M9 13v4" />
    <path d="M9 13h2a1.5 1.5 0 0 1 0 3H9" />
    <path d="M14 13h2" />
    <path d="M14 15h1.5" />
  </svg>
);

const WAREHOUSE_LIST = [
  { name: 'Main Store', items: '1,248 items', statusColor: 'bg-[#22c55e]' },
  { name: 'Warehouse A', items: '856 items', statusColor: 'bg-[#f59e0b]' },
  { name: 'Warehouse B', items: '432 items', statusColor: 'bg-[#f97316]' },
  { name: 'Retail Outlet', items: '298 items', statusColor: 'bg-[#22c55e]' }
];

const INDUSTRIES = [
  { id: 'retail', name: 'Retail', icon: ShoppingBag },
  { id: 'grocery', name: 'Grocery', icon: ShoppingCart },
  { id: 'pharmacy', name: 'Pharmacy', icon: Pill },
  { id: 'apparel', name: 'Apparel', icon: Shirt },
  { id: 'electronics', name: 'Electronics', icon: Monitor },
  { id: 'wholesale', name: 'Wholesale', icon: Store }
];

export const BentoFeatures = ({
  onInspectWarehouse,
  onApprovePO,
  onSelectIndustry,
  onUploadClick
}) => {
  const [selectedWarehouse, setSelectedWarehouse] = useState('All Warehouses');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleWarehouseClick = (whName) => {
    setSelectedWarehouse(whName);
    setDropdownOpen(false);
    if (onInspectWarehouse) onInspectWarehouse(whName);
  };

  const handleCreatePOClick = () => {
    if (onApprovePO) {
      onApprovePO();
    }
  };

  const handleIndustryClick = (industry) => {
    if (onSelectIndustry) {
      onSelectIndustry(industry);
    }
  };

  const handleUploadBoxClick = () => {
    if (onUploadClick) {
      onUploadClick();
    }
  };

  return (
    <section id="feature" className="pt-7 sm:pt-10 pb-16 sm:pb-24 px-5 sm:px-8 max-w-6xl mx-auto select-none">
      {/* 2x2 Asymmetric Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-7">
        {/* ============================================================ */}
        {/* CARD 1: Know what's in stock, everywhere (Wide, 7 cols)       */}
        {/* ============================================================ */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ y: -4 }}
          className="lg:col-span-7 rounded-[24px] bg-[#ffffff] border border-[#ede7df] shadow-[0_2px_12px_rgba(47,31,19,0.03)] hover:shadow-[0_12px_28px_rgba(47,31,19,0.07)] transition-all duration-300 p-7 sm:p-9 flex flex-col justify-between"
        >
          <div className="flex flex-col sm:flex-row gap-7 items-start justify-between">
            {/* Left Content Column */}
            <div className="flex-1">
              {/* Peach Icon Badge */}
              <div className="w-12 h-12 rounded-[14px] bg-[#fceddf] flex items-center justify-center mb-5 shrink-0">
                <PackageIcon />
              </div>

              {/* Title */}
              <h3 className="text-xl sm:text-[23px] font-bold text-[#1a1715] tracking-tight leading-snug mb-3">
                Know what&apos;s in stock, everywhere
              </h3>

              {/* Description */}
              <p className="text-[14px] sm:text-[14.5px] text-[#635d56] leading-[1.65] font-normal mb-6 max-w-sm">
                Track inventory across multiple locations with real-time updates and accurate stock values.
              </p>

              {/* Checkpoints with Olive/Dark Checkmark Badges */}
              <div className="space-y-3">
                {[
                  'Multi-warehouse support',
                  'Real-time stock levels',
                  'Stock movement history'
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#4e543b] text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <svg
                        className="w-3 h-3"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    <span className="text-[13.5px] font-medium text-[#2b2723]">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Warehouse Panel Widget */}
            <div className="w-full sm:w-[220px] shrink-0 bg-[#faf8f5]/85 rounded-2xl border border-[#ece4d9] p-4 flex flex-col gap-3 shadow-2xs relative">
              {/* Dropdown Selector */}
              <button
                type="button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#ffffff] border border-[#e5dcd0] text-xs font-semibold text-[#1a1715] shadow-2xs cursor-pointer hover:border-[#d6c9b8] transition-colors"
              >
                <span>{selectedWarehouse}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#78726b]" />
              </button>

              {/* Dropdown Menu (if open) */}
              {dropdownOpen && (
                <div className="absolute top-[52px] left-3 right-3 z-20 bg-[#ffffff] rounded-xl border border-[#e5dcd0] shadow-lg py-1 text-xs">
                  <div
                    onClick={() => handleWarehouseClick('All Warehouses')}
                    className="px-3 py-1.5 hover:bg-[#faf8f5] cursor-pointer font-medium text-[#1a1715]"
                  >
                    All Warehouses
                  </div>
                  {WAREHOUSE_LIST.map((wh) => (
                    <div
                      key={`drop-${wh.name}`}
                      onClick={() => handleWarehouseClick(wh.name)}
                      className="px-3 py-1.5 hover:bg-[#faf8f5] cursor-pointer text-[#635d56]"
                    >
                      {wh.name}
                    </div>
                  ))}
                </div>
              )}

              {/* Warehouse Items List */}
              <div className="space-y-2.5 pt-1">
                {WAREHOUSE_LIST.map((wh) => (
                  <div
                    key={wh.name}
                    onClick={() => handleWarehouseClick(wh.name)}
                    className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-[#ffffff]/80 cursor-pointer transition-colors"
                  >
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${wh.statusColor} shrink-0`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-[#1a1715] truncate leading-tight">
                        {wh.name}
                      </div>
                      <div className="text-[11px] text-[#78726b] font-medium leading-tight">
                        {wh.items}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ============================================================ */}
        {/* CARD 2: Never miss a reorder (Dark Espresso, 5 cols)          */}
        {/* ============================================================ */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ y: -4 }}
          className="lg:col-span-5 rounded-[24px] bg-[#28211b] border border-[#3d332a] shadow-[0_4px_24px_rgba(40,33,27,0.18)] hover:shadow-[0_16px_32px_rgba(40,33,27,0.25)] transition-all duration-300 p-7 sm:p-9 flex flex-col justify-between text-white"
        >
          <div>
            {/* Dark Icon Badge */}
            <div className="w-11 h-11 rounded-[14px] bg-[#3a3229] border border-[#4d4439] flex items-center justify-center mb-5 text-[#f6ecdf]">
              <Bell className="w-5 h-5 text-[#f6ecdf]" />
            </div>

            {/* Title */}
            <h3 className="text-xl sm:text-[23px] font-bold text-white tracking-tight leading-snug mb-3">
              Never miss a reorder
            </h3>

            {/* Description */}
            <p className="text-[14px] sm:text-[14.5px] text-[#bfb5ab] leading-[1.65] font-normal mb-6">
              Set low-stock thresholds and get instant alerts when items need to be replenished.
            </p>
          </div>

          {/* Floating White Alert Card */}
          <div className="bg-[#ffffff] rounded-2xl p-4 sm:p-4.5 shadow-md text-[#1a1715]">
            {/* Top Row: Shoe Thumbnail + Name + Red Badge */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#f7f2ea] flex items-center justify-center shrink-0 border border-[#ede6dc]">
                  <RunningShoeIcon />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#1a1715] leading-tight">
                    Running Shoes
                  </h4>
                  <p className="text-xs text-[#78726b] font-medium mt-0.5">
                    SKU: RS001
                  </p>
                </div>
              </div>

              {/* Red Alert Pill */}
              <span className="rounded-full px-2.5 py-1 bg-[#fee2e2] border border-[#fecaca] text-[#dc2626] text-[11px] font-bold shrink-0">
                Only 5 left
              </span>
            </div>

            {/* Bottom Row: Reorder Threshold + Create PO Button */}
            <div className="mt-3.5 pt-3 border-t border-[#f0eae1] flex items-center justify-between">
              <div>
                <span className="text-[11px] text-[#78726b] block font-medium">
                  Reorder at
                </span>
                <span className="text-xs font-bold text-[#1a1715]">
                  20 units
                </span>
              </div>

              <button
                type="button"
                onClick={handleCreatePOClick}
                className="bg-[#28211b] hover:bg-[#15110d] text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
              >
                <ShoppingCart className="w-3.5 h-3.5 text-white" />
                <span>Create Purchase Order</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* ============================================================ */}
        {/* CARD 3: Import products in seconds (6 cols)                  */}
        {/* ============================================================ */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.55, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ y: -4 }}
          className="lg:col-span-6 rounded-[24px] bg-[#ffffff] border border-[#ede7df] shadow-[0_2px_12px_rgba(47,31,19,0.03)] hover:shadow-[0_12px_28px_rgba(47,31,19,0.07)] transition-all duration-300 p-7 sm:p-9 flex flex-col justify-between"
        >
          {/* Header Row */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-[14px] bg-[#fceddf] flex items-center justify-center shrink-0">
              <Upload className="w-6 h-6 text-[#1f1d1b]" strokeWidth={1.8} />
            </div>

            <div>
              <h3 className="text-xl sm:text-[22px] font-bold text-[#1a1715] tracking-tight leading-snug mb-1.5">
                Import products in seconds
              </h3>
              <p className="text-[14px] text-[#635d56] leading-[1.6] font-normal">
                Upload your product catalog using CSV, Excel or PDF supplier invoices with auto-mapping and validation.
              </p>
            </div>
          </div>

          {/* Dashed Drag & Drop Box */}
          <div
            onClick={handleUploadBoxClick}
            className="mt-6 border-2 border-dashed border-[#e6ded3] rounded-2xl p-6 sm:p-7 bg-[#faf7f2]/60 hover:bg-[#faf7f2] hover:border-[#c5bdaf] transition-all flex flex-col items-center justify-center text-center cursor-pointer group"
          >
            {/* 3 File Type Badges */}
            <div className="flex items-center justify-center gap-8 sm:gap-10 mb-4">
              <div className="flex flex-col items-center group-hover:-translate-y-0.5 transition-transform">
                <CsvFileIcon />
                <span className="text-xs font-bold text-[#3f3a35] mt-1.5">
                  CSV
                </span>
              </div>
              <div className="flex flex-col items-center group-hover:-translate-y-0.5 transition-transform">
                <XlsxFileIcon />
                <span className="text-xs font-bold text-[#3f3a35] mt-1.5">
                  XLSX
                </span>
              </div>
              <div className="flex flex-col items-center group-hover:-translate-y-0.5 transition-transform">
                <PdfFileIcon />
                <span className="text-xs font-bold text-[#3f3a35] mt-1.5">
                  PDF
                </span>
              </div>
            </div>

            {/* Drag & Drop Prompt */}
            <p className="text-xs sm:text-[13.5px] text-[#78726b] font-medium leading-relaxed">
              Drag & drop your file here
              <br />
              <span className="text-[#968f86]">or click to browse</span>
            </p>
          </div>
        </motion.div>

        {/* ============================================================ */}
        {/* CARD 4: Built for every industry (6 cols)                    */}
        {/* ============================================================ */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.55, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ y: -4 }}
          className="lg:col-span-6 rounded-[24px] bg-[#ffffff] border border-[#ede7df] shadow-[0_2px_12px_rgba(47,31,19,0.03)] hover:shadow-[0_12px_28px_rgba(47,31,19,0.07)] transition-all duration-300 p-7 sm:p-9 flex flex-col justify-between"
        >
          {/* Header Row */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[14px] bg-[#fceddf] flex items-center justify-center shrink-0">
              <Upload className="w-6 h-6 text-[#1f1d1b]" strokeWidth={1.8} />
            </div>

            <h3 className="text-xl sm:text-[22px] font-bold text-[#1a1715] tracking-tight leading-snug">
              Built for every industry
            </h3>
          </div>

          {/* 6 Industry Tiles (3 cols x 2 rows) */}
          <div className="grid grid-cols-3 gap-3.5 sm:gap-4 mt-6">
            {INDUSTRIES.map((ind) => {
              const Icon = ind.icon;
              return (
                <div
                  key={ind.id}
                  onClick={() => handleIndustryClick(ind.name)}
                  className="rounded-2xl p-4 sm:p-5 bg-[#faf7f2]/80 hover:bg-[#ffffff] border border-[#ede7df] shadow-2xs hover:shadow-md hover:scale-[1.03] transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer group"
                >
                  <Icon className="w-5 h-5 text-[#1a1715] group-hover:scale-110 transition-transform" />
                  <span className="text-xs sm:text-[13px] font-semibold text-[#1a1715] mt-2">
                    {ind.name}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default BentoFeatures;
