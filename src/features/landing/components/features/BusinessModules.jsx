import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, ShieldCheck } from 'lucide-react';

const CATEGORIES = [
  'All Modules',
  'Inventory & Stock',
  'POS & Billing',
  'Purchasing & GRN',
  'Wholesale & B2B',
  'Pharma & Batches',
  'Clothing & Variants',
  'Catalog & Import',
  'Financial & Tax'
];

const MODULE_CARDS = [
  {
    id: 'multi-warehouse',
    category: 'Inventory & Stock',
    title: 'Multi-Warehouse Stock Tracking',
    rating: '4.9 (3.2k)',
    badge: 'Real-time Sync',
    bullets: [
      'Multi-location stock transfer with approval workflow',
      'Automated low-stock reorder thresholds & alerts',
      'Complete bin-level stock ledger & movement audit'
    ],
    warranty: '100% Audit Trail',
    time: '< 1s sync',
    visualBg: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    renderVisual: () => (
      <svg className="w-full h-full" viewBox="0 0 280 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Warehouse Shelving Visual */}
        <rect x="25" y="25" width="230" height="90" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
        {/* Shelf Levels */}
        <line x1="25" y1="55" x2="255" y2="55" stroke="#475569" strokeWidth="2" strokeDasharray="3 3" />
        <line x1="25" y1="85" x2="255" y2="85" stroke="#475569" strokeWidth="2" strokeDasharray="3 3" />
        {/* Stock Bins on Shelves */}
        <rect x="38" y="32" width="32" height="18" rx="3" fill="#22c55e" fillOpacity="0.8" />
        <rect x="80" y="32" width="32" height="18" rx="3" fill="#3b82f6" fillOpacity="0.8" />
        <rect x="122" y="32" width="32" height="18" rx="3" fill="#f59e0b" fillOpacity="0.8" />
        <rect x="164" y="32" width="32" height="18" rx="3" fill="#22c55e" fillOpacity="0.8" />
        <rect x="206" y="32" width="32" height="18" rx="3" fill="#64748b" fillOpacity="0.8" />

        <rect x="38" y="62" width="32" height="18" rx="3" fill="#3b82f6" fillOpacity="0.8" />
        <rect x="80" y="62" width="32" height="18" rx="3" fill="#22c55e" fillOpacity="0.8" />
        <rect x="122" y="62" width="32" height="18" rx="3" fill="#22c55e" fillOpacity="0.8" />
        <rect x="164" y="62" width="32" height="18" rx="3" fill="#f59e0b" fillOpacity="0.8" />
        <rect x="206" y="62" width="32" height="18" rx="3" fill="#3b82f6" fillOpacity="0.8" />

        <rect x="38" y="92" width="45" height="18" rx="3" fill="#22c55e" fillOpacity="0.8" />
        <rect x="93" y="92" width="45" height="18" rx="3" fill="#22c55e" fillOpacity="0.8" />
        <rect x="148" y="92" width="45" height="18" rx="3" fill="#3b82f6" fillOpacity="0.8" />
        <rect x="203" y="92" width="35" height="18" rx="3" fill="#22c55e" fillOpacity="0.8" />

        {/* Live sync pulse line */}
        <circle cx="240" cy="38" r="4" fill="#22c55e" />
        <circle cx="240" cy="38" r="7" stroke="#22c55e" strokeWidth="1" opacity="0.6" />
      </svg>
    )
  },
  {
    id: 'pos-billing',
    category: 'POS & Billing',
    title: 'High-Speed POS & Billing',
    rating: '4.8 (4.1k)',
    badge: 'Offline Ready',
    bullets: [
      'Rapid barcode scanning with custom keyboard shortcuts',
      'Split tender payments (Cash, UPI, Cards & Store Credit)',
      'Instant thermal receipt printing & digital WhatsApp bills'
    ],
    warranty: 'Zero Lag Counter',
    time: '~5s per bill',
    visualBg: 'linear-gradient(135deg, #262626 0%, #171717 100%)',
    renderVisual: () => (
      <svg className="w-full h-full" viewBox="0 0 280 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* POS Monitor */}
        <rect x="45" y="22" width="130" height="85" rx="6" fill="#171717" stroke="#404040" strokeWidth="1.5" />
        <rect x="52" y="28" width="116" height="58" rx="3" fill="#0a0a0a" />
        <rect x="95" y="107" width="30" height="14" fill="#262626" />
        <rect x="80" y="121" width="60" height="5" rx="2" fill="#404040" />

        {/* Screen lines & Total */}
        <rect x="58" y="34" width="60" height="5" rx="1" fill="#22c55e" />
        <rect x="58" y="44" width="45" height="4" rx="1" fill="#737373" />
        <rect x="58" y="52" width="55" height="4" rx="1" fill="#737373" />
        <rect x="58" y="68" width="104" height="12" rx="2" fill="#22c55e" fillOpacity="0.2" />
        <text x="62" y="77" fill="#22c55e" fontSize="9" fontWeight="bold">₹ 1,420.00 PAID</text>

        {/* Thermal Receipt Paper Roll */}
        <rect x="190" y="30" width="55" height="75" rx="4" fill="#fafafa" stroke="#e5e5e5" strokeWidth="1.5" />
        <rect x="198" y="38" width="39" height="4" rx="1" fill="#171717" />
        <line x1="198" y1="48" x2="237" y2="48" stroke="#a3a3a3" strokeDasharray="2 2" />
        <line x1="198" y1="56" x2="237" y2="56" stroke="#a3a3a3" strokeDasharray="2 2" />
        <line x1="198" y1="64" x2="237" y2="64" stroke="#a3a3a3" strokeDasharray="2 2" />
        <rect x="198" y="74" width="30" height="6" rx="1" fill="#22c55e" />
        {/* Barcode on receipt */}
        <line x1="198" y1="88" x2="200" y2="98" stroke="#171717" strokeWidth="2" />
        <line x1="203" y1="88" x2="204" y2="98" stroke="#171717" strokeWidth="1" />
        <line x1="207" y1="88" x2="210" y2="98" stroke="#171717" strokeWidth="3" />
        <line x1="213" y1="88" x2="214" y2="98" stroke="#171717" strokeWidth="1" />
        <line x1="217" y1="88" x2="220" y2="98" stroke="#171717" strokeWidth="2" />
        <line x1="223" y1="88" x2="226" y2="98" stroke="#171717" strokeWidth="3" />
      </svg>
    )
  },
  {
    id: 'purchasing-grn',
    category: 'Purchasing & GRN',
    title: 'Purchase Orders & Supplier GRN',
    rating: '4.9 (2.8k)',
    badge: '3-Way Match',
    bullets: [
      'Automated PO generation triggered by safety stock limits',
      'Goods Receipt Note (GRN) inspection with barcode check',
      'Supplier credit terms & payment due tracking'
    ],
    warranty: 'Zero Missing Inwards',
    time: 'Auto Restock',
    visualBg: 'linear-gradient(135deg, #1c1917 0%, #0c0a09 100%)',
    renderVisual: () => (
      <svg className="w-full h-full" viewBox="0 0 280 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* PO Document */}
        <rect x="40" y="24" width="90" height="95" rx="5" fill="#fafaf9" stroke="#e7e5e4" strokeWidth="1.5" />
        <rect x="50" y="34" width="45" height="6" rx="2" fill="#0c0a09" />
        <rect x="50" y="46" width="70" height="4" rx="1" fill="#a8a29e" />
        <rect x="50" y="55" width="70" height="4" rx="1" fill="#a8a29e" />
        <rect x="50" y="64" width="50" height="4" rx="1" fill="#a8a29e" />
        {/* Approved Stamp */}
        <rect x="50" y="80" width="60" height="20" rx="3" fill="#dcfce7" stroke="#22c55e" strokeWidth="1.5" />
        <text x="56" y="93" fill="#15803d" fontSize="9" fontWeight="bold">APPROVED</text>

        {/* Incoming Supplier Truck */}
        <rect x="150" y="45" width="65" height="45" rx="3" fill="#292524" stroke="#44403c" strokeWidth="1.5" />
        <path d="M215 60H235L245 75V90H215V60Z" fill="#1c1917" stroke="#44403c" strokeWidth="1.5" />
        <circle cx="170" cy="95" r="9" fill="#0c0a09" stroke="#78716c" strokeWidth="2" />
        <circle cx="230" cy="95" r="9" fill="#0c0a09" stroke="#78716c" strokeWidth="2" />
        <rect x="158" y="55" width="48" height="20" rx="2" fill="#22c55e" fillOpacity="0.2" />
        <text x="164" y="68" fill="#22c55e" fontSize="8" fontWeight="bold">GRN-8402</text>
      </svg>
    )
  },
  {
    id: 'wholesale-b2b',
    category: 'Wholesale & B2B',
    title: 'B2B Wholesale & Volume Slabs',
    rating: '4.8 (1.9k)',
    badge: 'GST E-Invoice',
    bullets: [
      'Customer-specific price tiers & bulk quantity discounts',
      'Credit limit rules & overdue payment warnings',
      'Dispatch delivery challans with GST-compliant tax invoices'
    ],
    warranty: 'B2B Ready',
    time: 'Bulk Orders',
    visualBg: 'linear-gradient(135deg, #18181b 0%, #09090b 100%)',
    renderVisual: () => (
      <svg className="w-full h-full" viewBox="0 0 280 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Tier Pricing Matrix Cards */}
        <rect x="35" y="30" width="65" height="78" rx="5" fill="#27272a" stroke="#3f3f46" strokeWidth="1.5" />
        <text x="44" y="48" fill="#a1a1aa" fontSize="9" fontWeight="medium">Tier 1: 10+</text>
        <text x="44" y="68" fill="#ffffff" fontSize="13" fontWeight="extrabold">₹ 450</text>
        <rect x="44" y="80" width="47" height="15" rx="3" fill="#3f3f46" />
        <text x="48" y="91" fill="#a1a1aa" fontSize="7.5">Standard</text>

        <rect x="108" y="24" width="70" height="88" rx="6" fill="#18181b" stroke="#22c55e" strokeWidth="2" />
        <rect x="118" y="16" width="50" height="15" rx="4" fill="#22c55e" />
        <text x="124" y="27" fill="#ffffff" fontSize="7.5" fontWeight="bold">BEST VALUE</text>
        <text x="116" y="48" fill="#22c55e" fontSize="9" fontWeight="bold">Tier 2: 100+</text>
        <text x="116" y="70" fill="#ffffff" fontSize="15" fontWeight="extrabold">₹ 380</text>
        <rect x="116" y="82" width="54" height="18" rx="3" fill="#22c55e" fillOpacity="0.2" />
        <text x="120" y="94" fill="#22c55e" fontSize="8" fontWeight="bold">-15% SAVINGS</text>

        <rect x="186" y="30" width="65" height="78" rx="5" fill="#27272a" stroke="#3f3f46" strokeWidth="1.5" />
        <text x="195" y="48" fill="#a1a1aa" fontSize="9" fontWeight="medium">Tier 3: 500+</text>
        <text x="195" y="68" fill="#ffffff" fontSize="13" fontWeight="extrabold">₹ 320</text>
        <rect x="195" y="80" width="47" height="15" rx="3" fill="#3f3f46" />
        <text x="200" y="91" fill="#22c55e" fontSize="7.5" fontWeight="bold">-28% Bulk</text>
      </svg>
    )
  },
  {
    id: 'pharma-batches',
    category: 'Pharma & Batches',
    title: 'Pharma Batch & Expiry Tracking',
    rating: '4.9 (2.4k)',
    badge: 'FEFO Compliant',
    bullets: [
      'First-Expiry-First-Out (FEFO) automated dispatch logic',
      'Multi-tier expiry alerts (30, 60, and 90 days in advance)',
      'Schedule H / H1 drug ledger with batch recall trace'
    ],
    warranty: 'Zero Expiry Loss',
    time: '100% Compliant',
    visualBg: 'linear-gradient(135deg, #134e4a 0%, #042f2e 100%)',
    renderVisual: () => (
      <svg className="w-full h-full" viewBox="0 0 280 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Blister pack */}
        <rect x="35" y="28" width="100" height="80" rx="8" fill="#115e59" stroke="#2dd4bf" strokeWidth="1.5" />
        {/* Capsules */}
        <rect x="48" y="38" width="16" height="24" rx="8" fill="#5eead4" />
        <rect x="76" y="38" width="16" height="24" rx="8" fill="#2dd4bf" />
        <rect x="104" y="38" width="16" height="24" rx="8" fill="#5eead4" />
        <rect x="48" y="72" width="16" height="24" rx="8" fill="#2dd4bf" />
        <rect x="76" y="72" width="16" height="24" rx="8" fill="#5eead4" />
        <rect x="104" y="72" width="16" height="24" rx="8" fill="#2dd4bf" />

        {/* Batch Info Card */}
        <rect x="150" y="28" width="95" height="80" rx="6" fill="#042f2e" stroke="#14b8a6" strokeWidth="1.5" />
        <text x="160" y="46" fill="#5eead4" fontSize="8" fontWeight="bold">BATCH: PH-2026-X</text>
        <rect x="160" y="54" width="75" height="18" rx="3" fill="#2dd4bf" fillOpacity="0.2" />
        <text x="165" y="66" fill="#2dd4bf" fontSize="8" fontWeight="bold">Exp: Oct 2028 (Safe)</text>
        {/* Schedule Stamp */}
        <rect x="160" y="78" width="75" height="20" rx="3" fill="#0f766e" />
        <text x="167" y="91" fill="#ffffff" fontSize="8" fontWeight="bold">Schedule H / Rx</text>
      </svg>
    )
  },
  {
    id: 'clothing-variants',
    category: 'Clothing & Variants',
    title: 'Apparel Variants & Size Matrix',
    rating: '4.7 (2.1k)',
    badge: 'Multi-SKU Matrix',
    bullets: [
      '2D grid SKU matrix for Size, Color, Brand, and Fabric',
      'Unique barcode generation for every variant combination',
      'Customer exchange, return restocking & defect quarantine'
    ],
    warranty: 'Retail & Fashion',
    time: 'Instant Matrix',
    visualBg: 'linear-gradient(135deg, #312e81 0%, #1e1b4b 100%)',
    renderVisual: () => (
      <svg className="w-full h-full" viewBox="0 0 280 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* T-Shirt Vector */}
        <path d="M50 45L70 32H100L120 45L110 60L98 52V105H72V52L60 60L50 45Z" fill="#6366f1" stroke="#a5b4fc" strokeWidth="1.5" />

        {/* Size Pills */}
        <rect x="140" y="28" width="30" height="22" rx="4" fill="#4338ca" stroke="#818cf8" strokeWidth="1" />
        <text x="151" y="42" fill="#ffffff" fontSize="9" fontWeight="bold">S</text>
        <rect x="176" y="28" width="30" height="22" rx="4" fill="#4f46e5" stroke="#a5b4fc" strokeWidth="1.5" />
        <text x="185" y="42" fill="#ffffff" fontSize="9" fontWeight="bold">M</text>
        <rect x="212" y="28" width="30" height="22" rx="4" fill="#4338ca" stroke="#818cf8" strokeWidth="1" />
        <text x="223" y="42" fill="#ffffff" fontSize="9" fontWeight="bold">L</text>

        {/* Color Palette Dots */}
        <circle cx="150" cy="70" r="8" fill="#1e293b" stroke="#ffffff" strokeWidth="1.5" />
        <circle cx="174" cy="70" r="8" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
        <circle cx="198" cy="70" r="8" fill="#dc2626" stroke="#ffffff" strokeWidth="1.5" />
        <circle cx="222" cy="70" r="8" fill="#16a34a" stroke="#ffffff" strokeWidth="1.5" />

        {/* Matrix Barcode Tag */}
        <rect x="140" y="88" width="102" height="22" rx="4" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1" />
        <text x="148" y="102" fill="#c7d2fe" fontSize="8" fontWeight="bold">SKU-TS-NAVY-M</text>
      </svg>
    )
  },
  {
    id: 'catalog-import',
    category: 'Catalog & Import',
    title: 'Instant Catalog Import & OCR',
    rating: '4.8 (3.5k)',
    badge: 'AI Auto-Mapping',
    bullets: [
      'Upload supplier purchase bills in CSV, Excel or PDF',
      'Automated field detection for SKU, HSN, MRP, and Tax',
      'Duplicate detection with bulk error correction'
    ],
    warranty: '100% Data Validated',
    time: '~30s Upload',
    visualBg: 'linear-gradient(135deg, #374151 0%, #111827 100%)',
    renderVisual: () => (
      <svg className="w-full h-full" viewBox="0 0 280 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Upload Box / Drag area */}
        <rect x="35" y="24" width="210" height="90" rx="8" fill="#1f2937" stroke="#4b5563" strokeWidth="1.5" strokeDasharray="4 4" />

        {/* 3 Supported Formats */}
        <rect x="52" y="42" width="45" height="52" rx="5" fill="#111827" stroke="#22c55e" strokeWidth="1" />
        <text x="64" y="65" fill="#22c55e" fontSize="9" fontWeight="bold">CSV</text>
        <circle cx="74" cy="78" r="4" fill="#22c55e" />

        <rect x="117" y="42" width="45" height="52" rx="5" fill="#111827" stroke="#3b82f6" strokeWidth="1" />
        <text x="127" y="65" fill="#3b82f6" fontSize="9" fontWeight="bold">XLSX</text>
        <circle cx="139" cy="78" r="4" fill="#3b82f6" />

        <rect x="182" y="42" width="45" height="52" rx="5" fill="#111827" stroke="#ef4444" strokeWidth="1" />
        <text x="194" y="65" fill="#ef4444" fontSize="9" fontWeight="bold">PDF</text>
        <circle cx="204" cy="78" r="4" fill="#ef4444" />
      </svg>
    )
  },
  {
    id: 'analytics-gst',
    category: 'Financial & Tax',
    title: 'Financial & GST Tax Analytics',
    rating: '4.9 (5.2k)',
    badge: 'Tax Ready',
    bullets: [
      'Real-time gross profit, dead stock, and holding cost reports',
      'Fast-moving vs slow-moving inventory turnover analysis',
      'One-click GSTR-1, GSTR-3B & financial statement export'
    ],
    warranty: 'Audit-Proof Books',
    time: 'Live Update',
    visualBg: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
    renderVisual: () => (
      <svg className="w-full h-full" viewBox="0 0 280 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Trend Graph Grid */}
        <rect x="35" y="24" width="210" height="92" rx="8" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
        <line x1="35" y1="50" x2="245" y2="50" stroke="#1e293b" strokeDasharray="3 3" />
        <line x1="35" y1="75" x2="245" y2="75" stroke="#1e293b" strokeDasharray="3 3" />

        {/* Upward Profit Wave Path */}
        <path d="M45 92C70 85 90 70 120 72C150 74 175 45 200 48C215 50 225 38 235 35" stroke="#22c55e" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* Shaded Area Below Curve */}
        <path d="M45 92C70 85 90 70 120 72C150 74 175 45 200 48C215 50 225 38 235 35V105H45V92Z" fill="#22c55e" fillOpacity="0.15" />

        {/* Highlight Point */}
        <circle cx="235" cy="35" r="5" fill="#22c55e" />
        <circle cx="235" cy="35" r="8" stroke="#22c55e" strokeWidth="1.5" opacity="0.6" />
        <rect x="160" y="28" width="60" height="16" rx="3" fill="#22c55e" />
        <text x="165" y="39" fill="#ffffff" fontSize="8" fontWeight="bold">+28.4% MARGIN</text>
      </svg>
    )
  }
];

export const BusinessModules = ({ onSelectModule, onViewAll }) => {
  const [activeCategory, setActiveCategory] = useState('All Modules');

  const filteredCards = MODULE_CARDS.filter((card) => {
    if (activeCategory === 'All Modules') return true;
    return card.category === activeCategory;
  });

  return (
    <section id="modules" className="py-14 sm:py-20 px-5 sm:px-8 max-w-7xl mx-auto select-none">
      {/* ======================================================== */}
      {/* SECTION HEADER                                           */}
      {/* ======================================================== */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8 sm:mb-10">
        <div>
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider text-[#16a34a] uppercase mb-2">
            <span className="w-2 h-2 rounded-full bg-[#16a34a] animate-pulse" />
            <span>VERIFIED &amp; PRODUCTION READY</span>
          </div>

          {/* Main Title */}
          <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-extrabold tracking-tight text-[#1a1715] leading-tight mb-2">
            Most Used Business Modules
          </h2>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-[#5e5852] font-normal max-w-2xl leading-relaxed">
            From multi-warehouse inventory to high-speed POS billing and automated GST tax filing —
            tailored for retail, wholesale, pharmacy, and apparel.
          </p>
        </div>

        {/* View All Button (top right) */}
        <button
          type="button"
          onClick={() => {
            if (onViewAll) onViewAll();
          }}
          className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#ffffff] hover:bg-[#faf7f2] border border-[#d6c9b8] hover:border-[#1a1715] text-xs font-semibold text-[#1a1715] shadow-2xs hover:shadow-xs transition-all cursor-pointer"
        >
          <span>View all services</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#5e5852]" />
        </button>
      </div>

      {/* ======================================================== */}
      {/* FILTER TABS ROW                                          */}
      {/* ======================================================== */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 no-scrollbar">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-[#1a1715] text-[#ffffff] shadow-sm'
                  : 'bg-[#ffffff] text-[#5e5852] hover:text-[#1a1715] hover:bg-[#faf7f2] border border-[#ede7df]'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* 8 MODULE CARDS GRID                                      */}
      {/* ======================================================== */}
      <motion.div
        layout
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6"
      >
        <AnimatePresence mode="popLayout">
          {filteredCards.map((card) => (
            <motion.div
              layout
              key={card.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              whileHover={{ y: -4 }}
              onClick={() => {
                if (onSelectModule) onSelectModule(card.title);
              }}
              className="rounded-2xl bg-[#ffffff] border border-[#ede7df] shadow-[0_2px_12px_rgba(47,31,19,0.03)] hover:shadow-[0_12px_28px_rgba(47,31,19,0.08)] transition-all duration-300 overflow-hidden flex flex-col justify-between cursor-pointer group"
            >
              {/* Card Top: Visual Banner with Badges */}
              <div>
                <div
                  className="relative h-[135px] sm:h-[145px] w-full overflow-hidden flex items-center justify-center p-2"
                  style={{ background: card.visualBg }}
                >
                  {/* Custom Graphic */}
                  <div className="w-full h-full transform group-hover:scale-105 transition-transform duration-500">
                    {card.renderVisual()}
                  </div>

                  {/* Floating Badges at Bottom of Banner */}
                  <div className="absolute inset-x-3 bottom-2.5 flex items-center justify-between pointer-events-none z-10">
                    {/* Star Rating Badge */}
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-xs text-[#1a1715] font-bold text-[11px] shadow-sm">
                      <span className="text-[#f59e0b]">★</span>
                      <span>{card.rating}</span>
                    </div>

                    {/* Green Feature/Guarantee Badge */}
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#16a34a] text-white font-semibold text-[10.5px] shadow-sm">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>{card.badge}</span>
                    </div>
                  </div>
                </div>

                {/* Card Body: Title & 3 Bullet Inclusions */}
                <div className="p-4 sm:p-5">
                  <h3 className="text-sm sm:text-base font-bold text-[#1a1715] tracking-tight leading-snug mb-3 group-hover:text-[#16a34a] transition-colors">
                    {card.title}
                  </h3>

                  <ul className="space-y-1.5 text-xs text-[#5e5852] font-normal leading-relaxed">
                    {card.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] mt-1.5 shrink-0" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Card Footer: Warranty Tag + Turnaround Time */}
              <div className="px-4 sm:px-5 pb-4 pt-3 border-t border-[#f0eae1] flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#eaf4e7] border border-[#d2e8cd] text-[10.5px] font-semibold text-[#1e5822]">
                  <ShieldCheck className="w-3 h-3 text-[#16a34a]" />
                  <span>{card.warranty}</span>
                </div>

                <span className="text-[11px] font-semibold text-[#786f64]">
                  {card.time}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </section>
  );
};

export default BusinessModules;
