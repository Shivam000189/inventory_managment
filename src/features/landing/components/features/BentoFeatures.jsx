import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  CheckCircle2,
  Globe,
  Package,
  RefreshCw,
  ScanBarcode,
  Warehouse
} from 'lucide-react';
import { WAREHOUSE_LOCATIONS } from '../../data/inventoryData';

export const BentoFeatures = ({
  onInspectWarehouse,
  onApprovePO
}) => {
  const omnichannelBadges = [
    'Shopify Plus',
    'Amazon FBA',
    'NetSuite',
    'QuickBooks',
    'DHL Express',
    'REST API'
  ];

  return (
    <section id="feature" className="py-24 px-6 max-w-7xl mx-auto">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-2xl mx-auto mb-16"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F6EDE1] border border-[#e2d3c0] text-xs font-semibold text-[#2f2a25] mb-4 cursor-default shadow-2xs"
        >
          <Package className="w-3.5 h-3.5 text-[#7bbd65]" />
          <span>Built for Modern Supply Chains</span>
        </motion.div>
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#0d0d0d] mb-4">
          Everything you need to scale warehouse operations
        </h2>
        <p className="text-[#2f1f13]/70 text-base">
          Eliminate manual spreadsheets, prevent costly stockouts, and unify every
          sales channel and fulfillment center inside one warm, intuitive workspace.
        </p>
      </motion.div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Card 1: Multi-Warehouse Sync (7 Cols) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="md:col-span-7 rounded-3xl p-8 border border-[#e3d5c3] shadow-sm flex flex-col justify-between relative overflow-hidden"
          style={{
            background:
              'linear-gradient(135deg, #fbf8f3 0%, #F6EDE1 60%, #ecdecb 100%)'
          }}
        >
          <div>
            <motion.div
              whileHover={{ rotate: 10, scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="w-11 h-11 rounded-2xl bg-[#2f2a25] text-[#F6EDE1] flex items-center justify-center mb-6 shadow-sm"
            >
              <Warehouse className="w-5 h-5 text-[#7bbd65]" />
            </motion.div>
            <h3 className="text-2xl font-bold text-[#0d0d0d] mb-2">
              Real-Time Multi-Warehouse Tracking
            </h3>
            <p className="text-sm text-[#2f1f13]/75 max-w-lg mb-8">
              Monitor bin locations, inter-warehouse stock transfers, and regional
              safety stock levels with live millisecond synchronization.
            </p>
          </div>

          {/* Interactive Warehouse Mini Widget */}
          <div className="bg-[#ffffff]/90 backdrop-blur-xs rounded-2xl p-4 border border-[#e6d9c8] grid grid-cols-1 sm:grid-cols-3 gap-3 shadow-xs">
            {WAREHOUSE_LOCATIONS.map((wh) => (
              <motion.div
                key={wh.name}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onInspectWarehouse(wh.name)}
                className="p-3.5 rounded-xl bg-[#F6EDE1]/70 hover:bg-[#F6EDE1] border border-[#e5d6c3] cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#2f1f13]">
                    {wh.name}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#7bbd65] animate-pulse" />
                </div>
                <div className="text-lg font-bold text-[#0d0d0d] mb-1">
                  {wh.skus}
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#dfd0bc] overflow-hidden mb-1.5">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: wh.capacity }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                    className="h-full bg-[#2f2a25] rounded-full"
                  />
                </div>
                <span className="text-[11px] text-[#2f1f13]/65">
                  Capacity: {wh.capacity} • {wh.status}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Card 2: Automated Low-Stock Reorder Points (5 Cols) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="md:col-span-5 rounded-3xl p-8 bg-[#2f2a25] text-[#F6EDE1] border border-[#3f3831] shadow-sm flex flex-col justify-between"
        >
          <div>
            <motion.div
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.5 }}
              className="w-11 h-11 rounded-2xl bg-[#F6EDE1]/10 flex items-center justify-center mb-6"
            >
              <RefreshCw className="w-5 h-5 text-[#7bbd65]" />
            </motion.div>
            <h3 className="text-2xl font-bold text-[#F6EDE1] mb-2">
              Automated Reorder Points
            </h3>
            <p className="text-sm text-[#F6EDE1]/75 mb-6">
              Set dynamic minimum thresholds per SKU. Inventry drafts and dispatches
              purchase orders to preferred vendors before you ever run dry.
            </p>
          </div>

          <div className="space-y-3 bg-[#1f1b18] p-4 rounded-2xl border border-[#3d352e]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#F6EDE1]/70">Auto-Trigger Rule</span>
              <span className="px-2 py-0.5 rounded-full bg-[#7bbd65]/20 text-[#7bbd65] font-semibold">
                Active
              </span>
            </div>
            <div className="flex items-center justify-between bg-[#2f2a25] p-3 rounded-xl border border-[#3e362e]">
              <div>
                <p className="text-xs font-bold text-[#F6EDE1]">
                  Industrial Mesh Router
                </p>
                <p className="text-[11px] text-[#F6EDE1]/60">
                  Stock dropped to 9 units (Min: 15)
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onApprovePO}
                className="px-3 py-1.5 rounded-lg bg-[#7bbd65] text-[#0d0d0d] text-xs font-bold hover:bg-[#8ece76] transition-colors cursor-pointer"
              >
                Approve PO
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Card 3: Barcode & RFID Batch Scanning (4 Cols) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="md:col-span-4 rounded-3xl p-7 bg-[#fbf8f3] border border-[#e3d5c3] shadow-xs flex flex-col justify-between"
        >
          <div>
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-11 h-11 rounded-2xl bg-[#F6EDE1] border border-[#e0d0bc] flex items-center justify-center mb-5"
            >
              <ScanBarcode className="w-5 h-5 text-[#2f2a25]" />
            </motion.div>
            <h3 className="text-xl font-bold text-[#0d0d0d] mb-2">
              Instant Barcode & RFID Scan
            </h3>
            <p className="text-sm text-[#2f1f13]/70 mb-6">
              Receive 500+ cartons in seconds using mobile cameras, Zebra handheld
              terminals, or Bluetooth ring scanners.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-[#F6EDE1] border border-[#e5d6c2] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#2f2a25] text-[#F6EDE1] flex items-center justify-center font-mono text-xs font-bold">
                UPC
              </div>
              <div>
                <p className="text-xs font-bold text-[#2f1f13]">
                  Batch #B-4092 Verified
                </p>
                <p className="text-[11px] text-[#2f1f13]/60">
                  140 units scanned • 0 errors
                </p>
              </div>
            </div>
            <CheckCircle2 className="w-5 h-5 text-[#7bbd65]" />
          </div>
        </motion.div>

        {/* Card 4: Predictive Demand Analytics (4 Cols) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="md:col-span-4 rounded-3xl p-7 bg-[#fbf8f3] border border-[#e3d5c3] shadow-xs flex flex-col justify-between"
        >
          <div>
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-11 h-11 rounded-2xl bg-[#F6EDE1] border border-[#e0d0bc] flex items-center justify-center mb-5"
            >
              <BarChart3 className="w-5 h-5 text-[#2f2a25]" />
            </motion.div>
            <h3 className="text-xl font-bold text-[#0d0d0d] mb-2">
              AI Demand Forecasting
            </h3>
            <p className="text-sm text-[#2f1f13]/70 mb-6">
              Spot seasonal velocity spikes 90 days ahead and optimize working capital
              tied up in slow-moving stock.
            </p>
          </div>
          {/* Animated Mini Bar Chart */}
          <div className="p-4 rounded-2xl bg-[#F6EDE1] border border-[#e5d6c2]">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-[#2f1f13]">Turnover Velocity</span>
              <span className="text-[#7bbd65] font-bold">+34.8% YoY</span>
            </div>
            <div className="flex items-end gap-2 h-16 pt-2">
              {[
                { id: 'bar-1', val: 38 },
                { id: 'bar-2', val: 52 },
                { id: 'bar-3', val: 46 },
                { id: 'bar-4', val: 68 },
                { id: 'bar-5', val: 84 },
                { id: 'bar-6', val: 75 },
                { id: 'bar-7', val: 96 }
              ].map((bar, i) => (
                <motion.div
                  key={bar.id}
                  initial={{ height: 0 }}
                  whileInView={{ height: `${bar.val}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 + i * 0.07, ease: 'easeOut' }}
                  className="flex-1 rounded-t-md transition-colors"
                  style={{
                    backgroundColor: i === 6 ? '#7bbd65' : '#2f2a25'
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Card 5: Omnichannel ERP Sync (4 Cols) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="md:col-span-4 rounded-3xl p-7 bg-[#fbf8f3] border border-[#e3d5c3] shadow-xs flex flex-col justify-between"
        >
          <div>
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-11 h-11 rounded-2xl bg-[#F6EDE1] border border-[#e0d0bc] flex items-center justify-center mb-5"
            >
              <Globe className="w-5 h-5 text-[#2f2a25]" />
            </motion.div>
            <h3 className="text-xl font-bold text-[#0d0d0d] mb-2">
              Omnichannel & ERP Sync
            </h3>
            <p className="text-sm text-[#2f1f13]/70 mb-6">
              Connect Shopify, Amazon FBA, NetSuite, QuickBooks, and retail POS
              terminals with zero double-selling.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {omnichannelBadges.map((tag) => (
              <motion.span
                key={tag}
                whileHover={{ scale: 1.08, y: -2 }}
                transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                className="px-3 py-1.5 rounded-xl bg-[#F6EDE1] border border-[#e2d3c0] text-xs font-semibold text-[#2f1f13] cursor-default shadow-2xs"
              >
                {tag}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
