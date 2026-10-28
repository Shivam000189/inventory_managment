import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Boxes,
  Factory,
  ShieldCheck,
  ClipboardList,
  TrendingUp,
  Truck,
  Wrench,
  ArrowRight,
  X
} from 'lucide-react';

const MANUFACTURING_STEPS = [
  {
    id: 'purchase',
    stepNumber: '01',
    title: 'Purchase',
    category: 'Procurement & Raw Materials',
    tagline: 'Supplier Requisitions & Automated POs',
    metric: '99.8%',
    metricLabel: 'BOM Match Rate',
    description:
      'Automated vendor RFQs, raw material supply contracts, and purchase order synchronization directly with master BOM schedules.',
    icon: ShoppingCart,
    badge: 'Raw Sourcing',
    kpi: '1.2h Turnaround',
    color: '#b45309'
  },
  {
    id: 'inventory',
    stepNumber: '02',
    title: 'Inventory',
    category: 'Stock & Multi-Bin Warehousing',
    tagline: 'Real-Time Bin, Lot & RFID Tracking',
    metric: '100%',
    metricLabel: 'Stock Visibility',
    description:
      'Multi-facility bin mapping, safety-stock buffers, dynamic reorder triggers, automated cycle counts, and real-time scrap tracking.',
    icon: Boxes,
    badge: 'Warehousing',
    kpi: 'Zero Stockouts',
    color: '#15803d'
  },
  {
    id: 'production',
    stepNumber: '03',
    title: 'Production',
    category: 'Shop Floor & Assembly Lines',
    tagline: 'CNC Routing, Work Orders & Machine BOM',
    metric: '94.6%',
    metricLabel: 'OEE Efficiency',
    description:
      'Shop floor execution system (MES), multi-level BOM explosion, CNC station routing, shift schedules, and machine cycle telemetry.',
    icon: Factory,
    badge: 'Assembly Line',
    kpi: '24/7 Line Sync',
    color: '#0369a1'
  },
  {
    id: 'quality',
    stepNumber: '04',
    title: 'Quality Control',
    category: 'Inspection & Tolerance Checks',
    tagline: 'Batch Audits, ISO Verification & QA',
    metric: '<0.03%',
    metricLabel: 'Defect Rate',
    description:
      'First-article inspection protocols, optical coordinate measurement audits, digital non-conformance reports, and ISO compliance.',
    icon: ShieldCheck,
    badge: 'Quality Gate',
    kpi: 'ISO 9001 Audited',
    color: '#4338ca'
  },
  {
    id: 'orders',
    stepNumber: '05',
    title: 'Orders',
    category: 'B2B & Wholesale Fulfillment',
    tagline: 'Automated Pick-Pack & Barcode Validation',
    metric: '99.4%',
    metricLabel: 'On-Time Dispatch',
    description:
      'Wave and zone picking algorithms, cartonization optimization, automated packing slip generation, and EDI trading partner sync.',
    icon: ClipboardList,
    badge: 'Fulfillment',
    kpi: 'Same-Day Pack',
    color: '#c2410c'
  },
  {
    id: 'sales',
    stepNumber: '06',
    title: 'Sales',
    category: 'Commercial Distribution & Invoicing',
    tagline: 'Account Portals, Tiers & Ledger Sync',
    metric: '$14.8M',
    metricLabel: 'Monthly Volume',
    description:
      'Multi-tier wholesale distributor pricing, commercial contract schedules, customer credit validation, and automated ERP invoicing.',
    icon: TrendingUp,
    badge: 'Commercial',
    kpi: 'Instant Invoicing',
    color: '#0f766e'
  },
  {
    id: 'logistics',
    stepNumber: '07',
    title: 'Logistics',
    category: 'Fleet & Outbound Freight',
    tagline: 'Multi-Carrier Dispatch & Live GPS Tracking',
    metric: '48 States',
    metricLabel: 'Freight Network',
    description:
      'LTL/FTL consolidated freight dispatch, electronic bill of lading (eBOL), dynamic pallet optimization, and delivery milestone alerts.',
    icon: Truck,
    badge: 'Freight & Fleet',
    kpi: 'Live Telematics',
    color: '#1e3a8a'
  },
  {
    id: 'maintenance',
    stepNumber: '08',
    title: 'Maintenance',
    category: 'Plant & Equipment Upkeep',
    tagline: 'IoT Vibration Telemetry & Spare Parts',
    metric: '99.9%',
    metricLabel: 'Machine Uptime',
    description:
      'Preventative maintenance schedules, MTBF sensor monitoring, automated toolroom spare parts reorders, and mobile technician dispatch.',
    icon: Wrench,
    badge: 'Plant Upkeep',
    kpi: 'Zero Unplanned Stops',
    color: '#7c2d12'
  }
];

export const TrustedBrands = ({ onStepClick }) => {
  const [isPaused, setIsPaused] = useState(false);
  const [selectedStep, setSelectedStep] = useState(null);

  const handleStepClick = (step) => {
    setSelectedStep(step);
    if (onStepClick) onStepClick(step);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full pt-16 pb-14 sm:pt-24 sm:pb-20 text-center select-none"
    >
      {/* Big Impactful Heading */}
      <div className="max-w-5xl mx-auto px-6 mb-10 sm:mb-14 text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#2f1f13] leading-[1.15]">
          Steps By Step Process in the Management System
        </h2>
        <p className="mt-3.5 text-sm sm:text-base md:text-lg text-[#2f1f13]/70 max-w-2xl mx-auto font-normal leading-relaxed">
          The end-to-end operational lifecycle powering modern discrete & process manufacturing
        </p>
      </div>

      {/* CAROUSEL TRACK WRAPPER */}
      <div
        className="relative w-full overflow-hidden py-6"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Left Gradient Fade Mask */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-20 sm:w-32 md:w-44 bg-gradient-to-r from-[#f6ecdf] via-[#f6ecdf]/90 to-transparent z-10" />

        {/* Right Gradient Fade Mask */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-20 sm:w-32 md:w-44 bg-gradient-to-l from-[#f6ecdf] via-[#f6ecdf]/90 to-transparent z-10" />

        {/* Continuous Infinite Marquee with Larger Cards */}
        <div className="flex overflow-x-auto no-scrollbar scroll-smooth">
          <div
            className={`flex items-center gap-5 sm:gap-7 shrink-0 ${
              isPaused ? 'pause-marquee' : ''
            }`}
            style={{
              animation: 'marquee 36s linear infinite',
              animationPlayState: isPaused ? 'paused' : 'running'
            }}
          >
            {/* First Set of Steps */}
            {MANUFACTURING_STEPS.map((step) => {
              const IconComponent = step.icon;
              return (
                <div
                  key={`step-a-${step.id}`}
                  onClick={() => handleStepClick(step)}
                  className="group relative flex flex-col justify-between w-[320px] sm:w-[380px] md:w-[410px] p-6 sm:p-7 rounded-3xl bg-[#fdfbf7]/85 hover:bg-[#ffffff] border border-[#2f1f13]/12 hover:border-[#7bbd65] shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer text-left shrink-0 backdrop-blur-md transform hover:-translate-y-2"
                >
                  {/* Top Step Meta */}
                  <div className="flex items-center gap-2.5 mb-4">
                    <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#2f2a25] text-[#F6EDE1] text-sm font-mono font-bold shadow-inner">
                      {step.stepNumber}
                    </span>
                    <span className="text-xs font-semibold text-[#2f1f13]/65 uppercase tracking-wider">
                      {step.badge}
                    </span>
                  </div>

                  {/* Icon & Title */}
                  <div className="flex items-start gap-4 mb-3.5">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-black/5"
                      style={{
                        backgroundColor: `${step.color}18`,
                        color: step.color
                      }}
                    >
                      <IconComponent className="w-6 h-6" />
                    </div>

                    <div className="flex-1">
                      <h4 className="text-xl sm:text-2xl font-bold text-[#2f1f13] group-hover:text-[#18110b] flex items-center gap-2">
                        {step.title}
                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-[#7bbd65]" />
                      </h4>
                      <p className="text-xs sm:text-sm font-medium text-[#2f1f13]/60 line-clamp-1 mt-0.5">
                        {step.tagline}
                      </p>
                    </div>
                  </div>

                  {/* Description preview */}
                  <p className="text-xs sm:text-sm text-[#2f1f13]/75 line-clamp-2 leading-relaxed mb-4">
                    {step.description}
                  </p>

                  {/* Bottom Stat Footer */}
                  <div className="pt-3.5 border-t border-[#2f1f13]/10 flex items-center justify-between text-xs sm:text-sm">
                    <div>
                      <span className="font-mono font-bold text-base sm:text-lg text-[#2f1f13]">
                        {step.metric}
                      </span>{' '}
                      <span className="text-xs text-[#2f1f13]/60 font-medium">
                        {step.metricLabel}
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-[#7bbd65] group-hover:underline flex items-center gap-1">
                      Explore Spec &rarr;
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Second Set of Steps (Duplicated for seamless continuous loop) */}
            {MANUFACTURING_STEPS.map((step) => {
              const IconComponent = step.icon;
              return (
                <div
                  key={`step-b-${step.id}`}
                  onClick={() => handleStepClick(step)}
                  className="group relative flex flex-col justify-between w-[320px] sm:w-[380px] md:w-[410px] p-6 sm:p-7 rounded-3xl bg-[#fdfbf7]/85 hover:bg-[#ffffff] border border-[#2f1f13]/12 hover:border-[#7bbd65] shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer text-left shrink-0 backdrop-blur-md transform hover:-translate-y-2"
                >
                  <div className="flex items-center gap-2.5 mb-4">
                    <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#2f2a25] text-[#F6EDE1] text-sm font-mono font-bold shadow-inner">
                      {step.stepNumber}
                    </span>
                    <span className="text-xs font-semibold text-[#2f1f13]/65 uppercase tracking-wider">
                      {step.badge}
                    </span>
                  </div>

                  <div className="flex items-start gap-4 mb-3.5">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-black/5"
                      style={{
                        backgroundColor: `${step.color}18`,
                        color: step.color
                      }}
                    >
                      <IconComponent className="w-6 h-6" />
                    </div>

                    <div className="flex-1">
                      <h4 className="text-xl sm:text-2xl font-bold text-[#2f1f13] group-hover:text-[#18110b] flex items-center gap-2">
                        {step.title}
                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-[#7bbd65]" />
                      </h4>
                      <p className="text-xs sm:text-sm font-medium text-[#2f1f13]/60 line-clamp-1 mt-0.5">
                        {step.tagline}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-[#2f1f13]/75 line-clamp-2 leading-relaxed mb-4">
                    {step.description}
                  </p>

                  <div className="pt-3.5 border-t border-[#2f1f13]/10 flex items-center justify-between text-xs sm:text-sm">
                    <div>
                      <span className="font-mono font-bold text-base sm:text-lg text-[#2f1f13]">
                        {step.metric}
                      </span>{' '}
                      <span className="text-xs text-[#2f1f13]/60 font-medium">
                        {step.metricLabel}
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-[#7bbd65] group-hover:underline flex items-center gap-1">
                      Explore Spec &rarr;
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* STEP DETAILS MODAL / DIALOG */}
      <AnimatePresence>
        {selectedStep && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="relative w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-[#fdfbf7] border border-[#2f1f13]/15 shadow-2xl text-left overflow-hidden"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedStep(null)}
                className="absolute top-5 right-5 p-2 rounded-full bg-[#2f2a25]/5 hover:bg-[#2f2a25]/10 text-[#2f1f13] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Step Header */}
              <div className="flex items-center gap-3.5 mb-5">
                <span className="flex items-center justify-center w-11 h-11 rounded-2xl bg-[#2f2a25] text-[#F6EDE1] font-mono font-bold text-base shadow-sm">
                  {selectedStep.stepNumber}
                </span>
                <div>
                  <span className="text-xs font-bold text-[#7bbd65] uppercase tracking-wider block">
                    {selectedStep.category}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-bold text-[#2f1f13]">
                    {selectedStep.title} Stage
                  </h3>
                </div>
              </div>

              {/* Tagline */}
              <p className="text-sm sm:text-base font-semibold text-[#2f1f13]/85 mb-4">
                {selectedStep.tagline}
              </p>

              {/* Full Description */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#2f2a25]/5 border border-[#2f2a25]/8 mb-6 text-xs sm:text-sm text-[#2f1f13]/85 leading-relaxed">
                {selectedStep.description}
              </div>

              {/* Key Specs Grid */}
              <div className="grid grid-cols-2 gap-3.5 mb-6">
                <div className="p-4 rounded-2xl bg-[#ffffff] border border-[#2f1f13]/10 shadow-xs">
                  <span className="text-[11px] font-semibold text-[#2f1f13]/55 uppercase block mb-1">
                    {selectedStep.metricLabel}
                  </span>
                  <span className="text-xl sm:text-2xl font-mono font-bold text-[#2f1f13]">
                    {selectedStep.metric}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-[#ffffff] border border-[#2f1f13]/10 shadow-xs">
                  <span className="text-[11px] font-semibold text-[#2f1f13]/55 uppercase block mb-1">
                    Manufacturing Target
                  </span>
                  <span className="text-base sm:text-lg font-bold text-[#15803d]">
                    {selectedStep.kpi}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setSelectedStep(null)}
                  className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-[#2f1f13]/70 hover:bg-[#2f2a25]/5 transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => setSelectedStep(null)}
                  style={{ color: '#ffffff' }}
                  className="landing-btn-dark px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#2f2a25] text-white !text-white hover:bg-[#1a1714] transition-colors shadow-sm cursor-pointer"
                >
                  <span style={{ color: '#ffffff' }}>Configure {selectedStep.title} Workflow &rarr;</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
