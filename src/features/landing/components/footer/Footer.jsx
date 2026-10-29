import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Headphones } from 'lucide-react';

export const Footer = ({ onOpenDemo }) => {
  return (
    <footer id="contact" className="pt-10 pb-16 px-6 max-w-7xl mx-auto">
      {/* High-Contrast Warm CTA Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 20 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-[28px] sm:rounded-[32px] px-6 py-12 sm:px-12 sm:py-16 text-center mb-16 border border-[#3d3228] shadow-2xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #2a221b 0%, #1f1813 100%)'
        }}
      >
        {/* Subtle decorative concentric line arcs */}
        <svg
          aria-hidden="true"
          className="absolute inset-0 w-full h-full pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="0%" cy="50%" r="180" fill="none" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.08" />
          <circle cx="0%" cy="50%" r="300" fill="none" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.06" />
          <circle cx="0%" cy="50%" r="440" fill="none" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.04" />
          <circle cx="100%" cy="50%" r="220" fill="none" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.07" />
          <circle cx="100%" cy="50%" r="360" fill="none" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.04" />
        </svg>

        <div className="relative z-10 flex flex-col items-center">
          <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-[#382d24] border border-[#4d3d31] text-[#cfbead] text-[10px] sm:text-[11px] font-semibold tracking-widest uppercase mb-4 shadow-inner">
            READY TO GET STARTED?
          </div>

          <h2
            className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-bold text-white max-w-2xl mx-auto leading-tight mb-3"
            style={{ color: '#ffffff' }}
          >
            Take control of every product,<br className="hidden sm:inline" /> sale and supplier.
          </h2>

          <p className="text-[#c2b5a6] max-w-lg mx-auto text-xs sm:text-sm mb-7 font-normal">
            Join businesses that are growing with Inventry's all-in-one platform.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3.5">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onOpenDemo}
              className="px-6 sm:px-7 py-2.5 sm:py-3 rounded-full bg-[#ffffff] hover:bg-[#f6ecdf] text-[#1c1713] font-semibold text-xs sm:text-sm transition-all shadow-sm hover:shadow-md cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Get started for free</span>
              <span className="text-sm leading-none">&rarr;</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onOpenDemo}
              style={{ color: '#ffffff' }}
              className="px-6 sm:px-7 py-2.5 sm:py-3 rounded-full bg-transparent hover:bg-white/10 text-white font-semibold text-xs sm:text-sm border border-white/25 hover:border-white/40 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Headphones className="w-4 h-4 text-white" />
              <span style={{ color: '#ffffff' }}>Talk to a specialist</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Multi-Column Footer */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-[#e2d3c0]">
        <div className="col-span-2">
          <div className="flex items-center gap-2.5 mb-4">
            <motion.div
              whileHover={{ rotate: 12, scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 350, damping: 15 }}
              className="w-8 h-8 rounded-lg bg-[#2f2a25] flex items-center justify-center cursor-pointer shadow-sm"
            >
              <Zap className="w-4 h-4 text-[#7bbd65] fill-[#7bbd65]" />
            </motion.div>
            <span className="text-xl font-bold text-[#2f1f13]">Inventry</span>
          </div>
          <p className="text-sm text-[#2f1f13]/70 max-w-xs mb-5">
            The all-in-one inventory, warehouse, and purchase order platform crafted
            for clarity and speed.
          </p>
          <div className="text-xs text-[#2f1f13]/60 space-y-1">
            <p>hello@inventry.io • +1 (800) 555-0194</p>
            <p>San Francisco • Amsterdam • Singapore</p>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold text-[#0d0d0d] mb-4">Platform</h4>
          <ul className="space-y-2.5 text-sm text-[#2f1f13]/70">
            <li><a href="#feature" className="hover:text-[#2f1f13] transition-colors">Multi-Warehouse</a></li>
            <li><a href="#feature" className="hover:text-[#2f1f13] transition-colors">Barcode Scanning</a></li>
            <li><a href="#feature" className="hover:text-[#2f1f13] transition-colors">Purchase Orders</a></li>
            <li><a href="#feature" className="hover:text-[#2f1f13] transition-colors">Demand Forecasting</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold text-[#0d0d0d] mb-4">Integrations</h4>
          <ul className="space-y-2.5 text-sm text-[#2f1f13]/70">
            <li><a href="#feature" className="hover:text-[#2f1f13] transition-colors">Shopify Plus</a></li>
            <li><a href="#feature" className="hover:text-[#2f1f13] transition-colors">Amazon FBA</a></li>
            <li><a href="#feature" className="hover:text-[#2f1f13] transition-colors">QuickBooks & Xero</a></li>
            <li><a href="#feature" className="hover:text-[#2f1f13] transition-colors">ShipStation & DHL</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold text-[#0d0d0d] mb-4">Company</h4>
          <ul className="space-y-2.5 text-sm text-[#2f1f13]/70">
            <li><a href="#home" className="hover:text-[#2f1f13] transition-colors">About Us</a></li>
            <li><a href="#pricing" className="hover:text-[#2f1f13] transition-colors">Pricing</a></li>
            <li><a href="#contact" className="hover:text-[#2f1f13] transition-colors">Security & SOC2</a></li>
            <li><a href="#contact" className="hover:text-[#2f1f13] transition-colors">Contact Support</a></li>
          </ul>
        </div>
      </div>

      <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#2f1f13]/60 gap-4">
        <p>© {new Date().getFullYear()} Inventry Inc. All rights reserved.</p>
        <div className="flex gap-6">
          <span className="hover:text-[#2f1f13] cursor-pointer transition-colors">Privacy Policy</span>
          <span className="hover:text-[#2f1f13] cursor-pointer transition-colors">Terms of Service</span>
          <span>Status: 99.99% Uptime</span>
        </div>
      </div>
    </footer>
  );
};
