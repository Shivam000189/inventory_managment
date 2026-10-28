import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

export const Footer = ({ onOpenDemo }) => {
  return (
    <footer id="contact" className="pt-10 pb-16 px-6 max-w-7xl mx-auto">
      {/* High-Contrast Warm CTA Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 25 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-[32px] p-10 sm:p-16 text-center mb-16 border border-[#3e3730] shadow-xl relative overflow-hidden"
        style={{
          background:
            'radial-gradient(circle at 50% 0%, #4a3f35 0%, #2f2a25 65%, #1c1916 100%)'
        }}
      >
        <motion.span
          whileHover={{ scale: 1.05 }}
          className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F6EDE1]/10 text-[#F6EDE1] text-xs font-medium mb-5 cursor-default backdrop-blur-xs"
        >
          <span className="w-2 h-2 rounded-full bg-[#7bbd65] animate-pulse" />
          Ready in under 5 minutes
        </motion.span>
        <h2 className="text-3xl sm:text-5xl font-bold text-[#F6EDE1] max-w-2xl mx-auto leading-tight mb-4">
          Take full command of every SKU and warehouse today
        </h2>
        <p className="text-[#F6EDE1]/70 max-w-xl mx-auto text-sm sm:text-base mb-8">
          Join over 1,000 modern commerce brands and distributors running leaner,
          faster operations on Inventry.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <motion.button
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            onClick={onOpenDemo}
            className="px-8 py-4 rounded-xl bg-[#F6EDE1] hover:bg-[#ffffff] text-[#0d0d0d] font-bold text-sm shadow-md hover:shadow-xl transition-shadow cursor-pointer"
          >
            Get Started for Free
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            onClick={onOpenDemo}
            style={{ color: '#F6EDE1' }}
            className="px-8 py-4 rounded-xl bg-transparent hover:bg-[#F6EDE1]/10 text-[#F6EDE1] !text-[#F6EDE1] font-semibold text-sm border border-[#F6EDE1]/25 transition-colors cursor-pointer"
          >
            <span style={{ color: '#F6EDE1' }}>Talk to Supply Chain Expert</span>
          </motion.button>
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
