import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Boxes,
  ChevronDown,
  ChevronRight,
  Cpu,
  FileText,
  Mouse,
  Package,
  Pill,
  Search,
  Shirt,
  ShoppingCart,
  Users
} from 'lucide-react';
import { useAuth } from '../../../../hooks/useAuth.js';
import { salesOrderApi } from '../../../../api/salesOrderApi.js';
import { productApi } from '../../../../api/productApi.js';

// Cube logo icon
const CubeLogo = () => (
  <svg
    className="w-5 h-5 text-[#1a1715] shrink-0"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12.3 2.1a1 1 0 0 0-.6 0l-8 3.5A1 1 0 0 0 3 6.5v11a1 1 0 0 0 .6.9l8 4.5a1 1 0 0 0 .8 0l8-4.5a1 1 0 0 0 .6-.9v-11a1 1 0 0 0-.7-.9l-8-3.5zm-.3 2.1 6.5 2.8-2.6 1.4-6.5-2.8 2.6-1.4zM5 8.1l6 2.6v8.4l-6-3.4V8.1zm14 7.6-6 3.4v-8.4l6-2.6v7.6z" />
  </svg>
);

// Overview icon (rounded square with plus)
const OverviewNavIcon = () => (
  <svg
    className="w-4 h-4 shrink-0"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

// Running shoe vector for thumbnail
const ShoeThumbnail = () => (
  <svg
    className="w-5 h-5 text-[#6b4728]"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      d="M2.5 14.5c1.2-1.5 3-2 5-2 1.8 0 3 .8 4.2 1.8l2.3 2c1.2 1 2.5 1.5 4.5 1.5h2.5c.8 0 1.5.7 1.5 1.5v.5c0 .6-.4 1.2-1 1.2H3c-.6 0-1-.6-.9-1.2l.4-3.3z"
      opacity="0.95"
    />
    <path d="M6 10.5c2-1 4.5-.5 6 1l3 2.5c1 .8 2.2 1.2 3.5 1.2h2.5c.6 0 1 .4 1 1s-.4 1-1 1h-3c-1.6 0-3-.5-4.2-1.5l-2.8-2.3C9.5 10.8 8 10.3 6.5 11l-3 1.5c-.3.2-.8 0-.9-.4l-.5-2.2c-.1-.5.3-1 .8-1.2L6 10.5z" />
  </svg>
);

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: OverviewNavIcon, hasChevron: false },
  { id: 'products', label: 'Products', icon: Package, hasChevron: false },
  { id: 'inventory', label: 'Inventory', icon: Boxes, hasChevron: false },
  { id: 'suppliers', label: 'Suppliers', icon: Users, hasChevron: false },
  { id: 'pos', label: 'POS & Sales', icon: ShoppingCart, hasChevron: false },
  { id: 'customers', label: 'Customers', icon: Users, hasChevron: true },
  { id: 'reports', label: 'Reports', icon: FileText, hasChevron: false }
];

const INVENTORY_TREND = [
  { month: 'Jan', value: '₹ 95,000', heightPct: 22 },
  { month: 'Feb', value: '₹ 1,80,000', heightPct: 34 },
  { month: 'Mar', value: '₹ 2,40,000', heightPct: 44 },
  { month: 'Apr', value: '₹ 3,60,000', heightPct: 60 },
  { month: 'May', value: '₹ 2,90,000', heightPct: 48 },
  { month: 'Jun', value: '₹ 3,10,000', heightPct: 52 },
  { month: 'Jul', value: '₹ 4,28,000', heightPct: 70 }, // Active in reference
  { month: 'Aug', value: '₹ 4,90,000', heightPct: 80 },
  { month: 'Sep', value: '₹ 5,30,000', heightPct: 86 },
  { month: 'Oct', value: '₹ 5,80,000', heightPct: 94 }
];

const STOCK_ALERTS = [
  {
    id: 'ts001',
    name: "Men's T-Shirt",
    sku: 'TS001',
    stockText: 'Only 5 left in stock',
    icon: Shirt
  },
  {
    id: 'pm002',
    name: 'Paracetamol 500mg',
    sku: 'PM002',
    stockText: 'Only 8 left in stock',
    icon: Pill
  },
  {
    id: 'wm003',
    name: 'Wireless Mouse',
    sku: 'WM003',
    stockText: 'Only 3 left in stock',
    icon: Mouse
  }
];

const RECENT_TRANSACTIONS = [
  {
    date: '26 Oct, 10:24 AM',
    type: 'Sale',
    item: "Men's T-Shirt",
    qty: 2,
    amount: '₹ 1,198'
  },
  {
    date: '26 Oct, 09:15 AM',
    type: 'Purchase',
    item: 'Running Shoes',
    qty: 20,
    amount: '₹ 24,000'
  },
  {
    date: '25 Oct, 06:42 PM',
    type: 'Stock In',
    item: 'Paracetamol 500mg',
    qty: 100,
    amount: '₹ 4,500'
  },
  {
    date: '25 Oct, 04:11 PM',
    type: 'Sale',
    item: 'Wireless Mouse',
    qty: 1,
    amount: '₹ 799'
  }
];

const DEFAULT_TOP_SELLING = [
  { id: '1', name: 'Classic Oxford Button-Down Shirt', sold: '118 sold', icon: Shirt },
  { id: '2', name: 'Heavyweight Cotton Graphic Tee', sold: '142 sold', icon: Shirt },
  { id: '3', name: 'Slim Fit Denim Jeans', sold: '84 sold', icon: Package },
  { id: '4', name: 'Stretch Chino Trousers', sold: '62 sold', icon: Package }
];

const getProductIconComponent = (name = '') => {
  const lower = name.toLowerCase();
  if (lower.includes('shoe') || lower.includes('sneaker') || lower.includes('footwear')) {
    return { isShoe: true };
  }
  if (
    lower.includes('shirt') ||
    lower.includes('tee') ||
    lower.includes('kurta') ||
    lower.includes('jacket') ||
    lower.includes('hoodie') ||
    lower.includes('jean') ||
    lower.includes('trouser') ||
    lower.includes('polo')
  ) {
    return { icon: Shirt };
  }
  if (
    lower.includes('paracetamol') ||
    lower.includes('tablet') ||
    lower.includes('syrup') ||
    lower.includes('capsule') ||
    lower.includes('med')
  ) {
    return { icon: Pill };
  }
  if (
    lower.includes('mouse') ||
    lower.includes('keyboard') ||
    lower.includes('headset') ||
    lower.includes('router') ||
    lower.includes('scanner')
  ) {
    return { icon: Cpu };
  }
  return { icon: Package };
};

export const DashboardMockup = ({
  searchQuery = '',
  onSearchChange,
  onQuickAction,
  topSelling: propTopSelling
}) => {
  const { session, account } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [activeMonthIdx, setActiveMonthIdx] = useState(6); // Default July (index 6)
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const [userTopSelling, setUserTopSelling] = useState([]);
  const [userRecentTransactions, setUserRecentTransactions] = useState([]);

  useEffect(() => {
    let active = true;

    async function loadUserData() {
      if (session?.user) {
        try {
          const [salesRes, prodRes] = await Promise.allSettled([
            salesOrderApi.list({ limit: 50 }),
            productApi.list({ limit: 50 })
          ]);

          const salesOrders =
            salesRes.status === 'fulfilled' && Array.isArray(salesRes.value?.data || salesRes.value)
              ? (salesRes.value?.data || salesRes.value)
              : [];
          const products =
            prodRes.status === 'fulfilled' && Array.isArray(prodRes.value?.data || prodRes.value)
              ? (prodRes.value?.data || prodRes.value)
              : [];

          // Aggregate sales count per product from user's actual orders
          const productSalesMap = new Map();
          salesOrders.forEach((order) => {
            if (order.status !== 'Cancelled') {
              (order.items || []).forEach((item) => {
                const name = item.productName || item.name;
                const qty = Number(item.quantity) || 0;
                if (name) {
                  productSalesMap.set(name, (productSalesMap.get(name) || 0) + qty);
                }
              });
            }
          });

          let calculatedTop = [];
          if (productSalesMap.size > 0) {
            calculatedTop = Array.from(productSalesMap.entries())
              .map(([name, soldQty], idx) => {
                const iconInfo = getProductIconComponent(name);
                return {
                  id: `user-top-${idx}`,
                  name,
                  sold: `${soldQty} sold`,
                  count: soldQty,
                  ...iconInfo
                };
              })
              .sort((a, b) => b.count - a.count)
              .slice(0, 4);
          }

          // If fewer than 4 sales, backfill with user's actual product catalog sorted by top stock
          if (calculatedTop.length < 4 && products.length > 0) {
            const seen = new Set(calculatedTop.map((item) => item.name));
            const sortedByStock = [...products].sort(
              (a, b) => Number(b.currentStock || b.stock || 0) - Number(a.currentStock || a.stock || 0)
            );
            for (const prod of sortedByStock) {
              if (calculatedTop.length >= 4) break;
              if (!seen.has(prod.name)) {
                const iconInfo = getProductIconComponent(prod.name);
                calculatedTop.push({
                  id: prod.id || prod.productId || `prod-${calculatedTop.length}`,
                  name: prod.name,
                  sold: `${prod.currentStock || prod.stock || 0} in stock`,
                  ...iconInfo
                });
                seen.add(prod.name);
              }
            }
          }

          if (active && calculatedTop.length > 0) {
            setUserTopSelling(calculatedTop);
          }

          // Live transactions from actual orders
          if (salesOrders.length > 0) {
            const recent = salesOrders.slice(0, 4).map((order) => ({
              date: new Date(order.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              }),
              type: order.channel === 'POS' ? 'Sale (POS)' : 'Sale',
              item: order.items?.[0]?.productName || 'Order Items',
              qty: order.items?.reduce((s, it) => s + (Number(it.quantity) || 0), 0) || 1,
              amount: `₹ ${Number(order.totalAmount || 0).toLocaleString('en-IN')}`
            }));
            if (active && recent.length > 0) {
              setUserRecentTransactions(recent);
            }
          }
        } catch (err) {
          console.warn('Could not load user data for mockup:', err);
        }
      }
    }

    loadUserData();
    return () => {
      active = false;
    };
  }, [session]);

  const displayTopSelling = useMemo(() => {
    if (propTopSelling && propTopSelling.length > 0) return propTopSelling;
    if (userTopSelling.length > 0) return userTopSelling;
    return DEFAULT_TOP_SELLING;
  }, [propTopSelling, userTopSelling]);

  const displayTransactions = useMemo(() => {
    if (userRecentTransactions.length > 0) return userRecentTransactions;
    return RECENT_TRANSACTIONS;
  }, [userRecentTransactions]);

  const handleNavClick = (navId, label) => {
    setActiveTab(navId);
    if (onQuickAction) onQuickAction(`Navigated to ${label}`);
  };

  const handleActionClick = (actionName) => {
    if (onQuickAction) onQuickAction(actionName);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 35, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full max-w-6xl mx-auto px-3 sm:px-6 pt-2 lg:pt-14 select-none"
    >
      {/* HANDWRITTEN ANNOTATION (LEFT) - pointing to Dashboard */}
      <motion.div
        initial={{ opacity: 0, rotate: -4, y: 10 }}
        animate={{ opacity: 1, rotate: -2, y: 0 }}
        transition={{ duration: 0.8, delay: 0.35 }}
        className="hidden lg:flex flex-col items-start absolute -top-6 lg:-top-8 xl:-top-10 left-3 sm:left-6 xl:left-8 z-20 select-none pointer-events-none text-left"
      >
        <div className="font-serif italic text-[13.5px] xl:text-[14.5px] leading-tight text-[#786f64] tracking-wide">
          Simple
          <br />
          Powerful
          <br />
          Built for your
          <br />
          business
        </div>
        {/* Curved Hand-Drawn Arrow pointing down-right toward the dashboard */}
        <svg
          className="w-10 h-10 text-[#8c8275] ml-12 mt-1"
          viewBox="0 0 45 45"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M8 8 C 12 22, 20 30, 32 34" />
          <path d="M24 35 L 32 34 L 30 26" />
        </svg>
      </motion.div>

      {/* HANDWRITTEN ANNOTATION (RIGHT) - pointing to Dashboard */}
      <motion.div
        initial={{ opacity: 0, rotate: 4, y: 10 }}
        animate={{ opacity: 1, rotate: 2, y: 0 }}
        transition={{ duration: 0.8, delay: 0.35 }}
        className="hidden lg:flex flex-col items-start absolute -top-6 lg:-top-8 xl:-top-10 right-3 sm:right-6 xl:right-8 z-20 select-none pointer-events-none text-left"
      >
        <div className="font-serif italic text-[13.5px] xl:text-[14.5px] leading-tight text-[#786f64] tracking-wide">
          From stock
          <br />
          to sales
          <br />
          — all in sync
        </div>
        {/* Curved Loop Hand-Drawn Arrow pointing down toward the dashboard */}
        <svg
          className="w-10 h-12 text-[#8c8275] ml-6 mt-1"
          viewBox="0 0 45 55"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 6 C 16 18, 14 28, 24 30 C 30 31, 31 22, 22 24 C 16 26, 14 36, 18 46" />
          <path d="M12 41 L 18 46 L 23 39" />
        </svg>
      </motion.div>

      {/* Subtle Warm Breathing Glow Behind Mockup */}
      <motion.div
        animate={{ opacity: [0.55, 0.75, 0.55] }}
        transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
        className="absolute -inset-4 sm:-inset-6 rounded-[36px] -z-10 blur-2xl pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 30%, #e2d1ba 0%, #F6EDE1 55%, transparent 80%)'
        }}
      />

      {/* Main Complete Window Card */}
      <div className="relative rounded-[22px] sm:rounded-[26px] bg-[#ffffff] border border-[#ede7df] shadow-[0_16px_48px_rgba(47,31,19,0.07)] overflow-hidden w-full">
        <div className="flex flex-col lg:flex-row min-h-[480px]">
          {/* ======================================================== */}
          {/* LEFT SIDEBAR                                              */}
          {/* ======================================================== */}
          <aside className="w-full lg:w-[195px] xl:w-[205px] shrink-0 bg-[#faf8f5]/85 border-b lg:border-b-0 lg:border-r border-[#f0eae1] p-3.5 sm:p-4 flex flex-col justify-between">
            <div>
              {/* Brand Logo */}
              <div className="flex items-center gap-2 px-2 mb-4">
                <div className="w-6 h-6 rounded-lg bg-[#f0e7db] flex items-center justify-center shadow-2xs">
                  <CubeLogo />
                </div>
                <span className="text-base font-extrabold tracking-tight text-[#1a1715]">
                  Inventry
                </span>
              </div>

              {/* Navigation Items */}
              <nav className="space-y-0.5">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavClick(item.id, item.label)}
                      className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                        isActive
                          ? 'bg-[#f4ebe2] text-[#1a1715] font-bold shadow-2xs'
                          : 'text-[#6e6862] hover:text-[#1a1715] hover:bg-[#f5ede4]/50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{item.label}</span>
                      {item.hasChevron && (
                        <ChevronDown className="w-3 h-3 text-[#9e978f] ml-auto shrink-0" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* ======================================================== */}
          {/* MAIN CONTENT AREA                                         */}
          {/* ======================================================== */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#ffffff]">
            {/* TOP HEADER / SEARCH BAR */}
            <header className="px-4 sm:px-6 py-2.5 border-b border-[#f0eae1] flex items-center justify-between gap-4">
              {/* Search Input */}
              <div className="relative w-full max-w-sm">
                <Search className="w-3.5 h-3.5 text-[#9c9489] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={localSearch}
                  onChange={(e) => {
                    setLocalSearch(e.target.value);
                    if (onSearchChange) onSearchChange(e.target.value);
                  }}
                  placeholder="Search products, suppliers, orders..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#faf8f5] border border-[#eee7dd] text-xs text-[#1a1715] placeholder:text-[#9c9489] focus:outline-none focus:border-[#d6c9b8] transition-colors"
                />
              </div>

              {/* Right Profile & Notification Controls */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => handleActionClick('Notifications')}
                  className="w-7 h-7 rounded-xl flex items-center justify-center text-[#4a453f] hover:bg-[#faf8f5] transition-colors cursor-pointer relative"
                >
                  <Bell className="w-3.5 h-3.5" />
                </button>

                <div
                  onClick={() => handleActionClick('User Profile')}
                  className="flex items-center gap-2 pl-2 border-l border-[#ede7df] cursor-pointer hover:opacity-90 transition-opacity"
                >
                  <div className="w-6 h-6 rounded-full bg-[#302922] text-[#f7f2ea] font-bold text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
                    {account?.name
                      ? account.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                      : 'SS'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <span className="text-[11px] font-bold text-[#1a1715] leading-tight block">
                      {account?.name || 'Shivam'}
                    </span>
                    <span className="text-[9px] text-[#78726b] font-medium leading-tight block">
                      {account?.role ? (account.role.charAt(0).toUpperCase() + account.role.slice(1)) : 'Owner'}
                    </span>
                  </div>
                  <ChevronDown className="w-3 h-3 text-[#78726b] hidden sm:block shrink-0" />
                </div>
              </div>
            </header>

            {/* DASHBOARD BODY */}
            <div className="p-4 sm:p-5 space-y-3.5 sm:space-y-4 bg-[#faf8f5]/40 flex-1 overflow-y-auto">
              {/* Overview Header & Date Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h1 className="text-lg sm:text-xl font-extrabold text-[#1a1715] tracking-tight leading-snug">
                    Overview
                  </h1>
                  <p className="text-[11px] text-[#78726b] font-normal leading-tight">
                    Here&apos;s what&apos;s happening with your business today.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleActionClick('Date Filter')}
                  className="self-start sm:self-auto px-2.5 py-1 rounded-lg bg-[#ffffff] border border-[#ede7df] text-[11px] font-semibold text-[#2b2723] flex items-center gap-1.5 shadow-2xs hover:border-[#d6c9b8] transition-colors cursor-pointer"
                >
                  <span>Today, 26 Oct 2026</span>
                  <ChevronDown className="w-3 h-3 text-[#78726b]" />
                </button>
              </div>

              {/* 4 STAT CARDS IN A ROW */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 min-w-0">
                {/* 1. Total Stock Value */}
                <div className="rounded-xl sm:rounded-2xl bg-[#ffffff] border border-[#ede7df] p-3 sm:p-3.5 shadow-2xs flex flex-col justify-between min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 rounded-lg bg-[#eef7ee] border border-[#d6ebd6] text-[#2e7d32] flex items-center justify-center shrink-0">
                      <Package className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[10.5px] font-medium text-[#78726b] truncate">
                      Total Stock Value
                    </span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm sm:text-base lg:text-[17px] font-extrabold text-[#1a1715] tracking-tight block truncate">
                      ₹ 12,48,500
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-[9.5px] font-bold text-[#16a34a] bg-[#ecfdf5] border border-[#d1fae5] px-1 py-0.5 rounded mt-1">
                      <ArrowUpRight className="w-2.5 h-2.5" />
                      12%
                    </span>
                  </div>
                </div>

                {/* 2. Today's Sales */}
                <div className="rounded-xl sm:rounded-2xl bg-[#ffffff] border border-[#ede7df] p-3 sm:p-3.5 shadow-2xs flex flex-col justify-between min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 rounded-lg bg-[#eef7ee] border border-[#d6ebd6] text-[#2e7d32] flex items-center justify-center shrink-0">
                      <ShoppingCart className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[10.5px] font-medium text-[#78726b] truncate">
                      Today&apos;s Sales
                    </span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm sm:text-base lg:text-[17px] font-extrabold text-[#1a1715] tracking-tight block truncate">
                      ₹ 28,400
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-[9.5px] font-bold text-[#16a34a] bg-[#ecfdf5] border border-[#d1fae5] px-1 py-0.5 rounded mt-1">
                      <ArrowUpRight className="w-2.5 h-2.5" />
                      8%
                    </span>
                  </div>
                </div>

                {/* 3. Low Stock Items */}
                <div className="rounded-xl sm:rounded-2xl bg-[#ffffff] border border-[#ede7df] p-3 sm:p-3.5 shadow-2xs flex flex-col justify-between min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 rounded-lg bg-[#fff4eb] border border-[#fed7aa] text-[#ea580c] flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[10.5px] font-medium text-[#78726b] truncate">
                      Low Stock Items
                    </span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm sm:text-base lg:text-[17px] font-extrabold text-[#1a1715] tracking-tight block truncate">
                      12
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-[9.5px] font-bold text-[#e11d48] bg-[#fff1f2] border border-[#ffe4e6] px-1 py-0.5 rounded mt-1">
                      <ArrowDownRight className="w-2.5 h-2.5" />
                      4%
                    </span>
                  </div>
                </div>

                {/* 4. Open Purchase Orders */}
                <div className="rounded-xl sm:rounded-2xl bg-[#ffffff] border border-[#ede7df] p-3 sm:p-3.5 shadow-2xs flex flex-col justify-between min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 rounded-lg bg-[#fffbeb] border border-[#fef08a] text-[#ca8a04] flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[10.5px] font-medium text-[#78726b] truncate">
                      Open Purchase Orders
                    </span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm sm:text-base lg:text-[17px] font-extrabold text-[#1a1715] tracking-tight block truncate">
                      5
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-[9.5px] font-bold text-[#16a34a] bg-[#ecfdf5] border border-[#d1fae5] px-1 py-0.5 rounded mt-1">
                      <ArrowUpRight className="w-2.5 h-2.5" />
                      25%
                    </span>
                  </div>
                </div>
              </div>

              {/* MIDDLE ROW: INVENTORY TREND + STOCK ALERTS */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 min-w-0">
                {/* Inventory Trend Chart (7 cols) */}
                <div className="lg:col-span-7 min-w-0 rounded-xl sm:rounded-2xl bg-[#ffffff] border border-[#ede7df] p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-bold text-xs sm:text-[13.5px] text-[#1a1715]">
                      Inventory Trend
                    </h2>
                    <button
                      type="button"
                      onClick={() => handleActionClick('Trend Range Filter')}
                      className="px-2 py-0.5 rounded-lg bg-[#faf8f5] border border-[#ede7df] text-[10.5px] font-semibold text-[#635d56] flex items-center gap-1 hover:border-[#d6c9b8] cursor-pointer"
                    >
                      <span>Last 6 months</span>
                      <ChevronDown className="w-2.5 h-2.5 text-[#78726b]" />
                    </button>
                  </div>

                  {/* Bar Chart Visual with Y-axis */}
                  <div className="relative pt-4 pb-1">
                    {/* Y-Axis guide lines */}
                    <div className="absolute inset-x-7 top-4 bottom-5 flex flex-col justify-between pointer-events-none">
                      <div className="border-b border-dashed border-[#f2ede4] w-full" />
                      <div className="border-b border-dashed border-[#f2ede4] w-full" />
                      <div className="border-b border-dashed border-[#f2ede4] w-full" />
                      <div className="border-b border-dashed border-[#f2ede4] w-full" />
                    </div>

                    <div className="flex items-end h-[105px] pl-7 pr-1 relative">
                      {/* Y-Axis labels */}
                      <div className="absolute left-0 inset-y-0 flex flex-col justify-between text-[9px] text-[#9c9489] font-medium pr-1.5 text-right">
                        <span>600K</span>
                        <span>400K</span>
                        <span>200K</span>
                        <span>0</span>
                      </div>

                      {/* 10 Month Bars */}
                      <div className="flex-1 flex items-end justify-between gap-1 sm:gap-1.5 h-full z-10">
                        {INVENTORY_TREND.map((item, idx) => {
                          const isHovered = activeMonthIdx === idx;
                          return (
                            <div
                              key={item.month}
                              onMouseEnter={() => setActiveMonthIdx(idx)}
                              className="flex-1 flex flex-col items-center h-full justify-end cursor-pointer group relative"
                            >
                              {/* Floating Tooltip */}
                              {isHovered && (
                                <motion.div
                                  initial={{ opacity: 0, y: 3 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="absolute -top-6 z-20 bg-[#1c1815] text-white text-[9.5px] font-bold px-1.5 py-0.5 rounded shadow-md whitespace-nowrap"
                                >
                                  {item.value}
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-[3px] border-transparent border-t-[#1c1815]" />
                                </motion.div>
                              )}

                              {/* Bar */}
                              <div
                                style={{ height: `${item.heightPct}%` }}
                                className={`w-full max-w-[15px] rounded-t transition-all duration-200 ${
                                  isHovered
                                    ? 'bg-[#8fb888]'
                                    : 'bg-[#b8d6b4] group-hover:bg-[#a3c99e]'
                                }`}
                              />

                              {/* Month Label */}
                              <span
                                className={`text-[9px] mt-1.5 block transition-colors ${
                                  isHovered
                                    ? 'text-[#1a1715] font-bold'
                                    : 'text-[#9c9489] font-medium'
                                }`}
                              >
                                {item.month}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stock Alerts (5 cols) */}
                <div className="lg:col-span-5 min-w-0 rounded-xl sm:rounded-2xl bg-[#ffffff] border border-[#ede7df] p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="font-bold text-xs sm:text-[13.5px] text-[#1a1715]">
                      Stock Alerts
                    </h2>
                    <button
                      type="button"
                      onClick={() => handleActionClick('View All Alerts')}
                      className="text-[11px] font-semibold text-[#635d56] hover:text-[#1a1715] flex items-center gap-1 cursor-pointer"
                    >
                      <span>View all</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  {/* 3 Alerts List */}
                  <div className="space-y-1.5 sm:space-y-2">
                    {STOCK_ALERTS.map((alert) => {
                      const Icon = alert.icon;
                      return (
                        <div
                          key={alert.id}
                          onClick={() => handleActionClick(`Alert: ${alert.name}`)}
                          className="flex items-center justify-between p-1.5 rounded-lg hover:bg-[#faf8f5] transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-[#f5ede4] flex items-center justify-center shrink-0 border border-[#eee7dd]">
                              <Icon className="w-3.5 h-3.5 text-[#1a1715]" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-[11px] text-[#1a1715] truncate leading-tight">
                                {alert.name} <span className="font-normal text-[#8a837b] text-[10px]">(SKU: {alert.sku})</span>
                              </h3>
                              <p className="text-[10px] font-semibold text-[#dc2626] leading-tight mt-0.5">
                                {alert.stockText}
                              </p>
                            </div>
                          </div>

                          <ChevronRight className="w-3 h-3 text-[#9c9489] group-hover:translate-x-0.5 transition-transform shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* BOTTOM ROW: RECENT TRANSACTIONS + TOP SELLING PRODUCTS */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 min-w-0">
                {/* Recent Transactions (7 cols) */}
                <div className="lg:col-span-7 min-w-0 rounded-xl sm:rounded-2xl bg-[#ffffff] border border-[#ede7df] p-3.5 sm:p-4 shadow-2xs">
                  <div className="flex items-center justify-between mb-2.5">
                    <h2 className="font-bold text-xs sm:text-[13.5px] text-[#1a1715]">
                      Recent Transactions
                    </h2>
                    <button
                      type="button"
                      onClick={() => handleActionClick('View All Transactions')}
                      className="text-[11px] font-semibold text-[#635d56] hover:text-[#1a1715] flex items-center gap-1 cursor-pointer"
                    >
                      <span>View all</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  {/* Transactions Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead>
                        <tr className="border-b border-[#f0eae1] text-[10px] font-semibold text-[#8a837b]">
                          <th className="pb-1.5 font-medium">Date</th>
                          <th className="pb-1.5 font-medium">Type</th>
                          <th className="pb-1.5 font-medium">Item</th>
                          <th className="pb-1.5 font-medium text-center">Qty</th>
                          <th className="pb-1.5 font-medium text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f7f2ea]">
                        {displayTransactions.map((tx, idx) => (
                          <tr
                            key={`${tx.date}-${tx.item}-${idx}`}
                            className="hover:bg-[#faf8f5]/60 transition-colors"
                          >
                            <td className="py-1.5 text-[#78726b] whitespace-nowrap">
                              {tx.date}
                            </td>
                            <td className="py-1.5 font-medium text-[#2d2824] whitespace-nowrap">
                              {tx.type}
                            </td>
                            <td className="py-1.5 font-semibold text-[#1a1715] whitespace-nowrap max-w-[140px] truncate">
                              {tx.item}
                            </td>
                            <td className="py-1.5 font-medium text-[#2d2824] text-center whitespace-nowrap">
                              {tx.qty}
                            </td>
                            <td className="py-1.5 font-bold text-[#1a1715] text-right whitespace-nowrap">
                              {tx.amount}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Top Selling Products (5 cols) */}
                <div className="lg:col-span-5 min-w-0 rounded-xl sm:rounded-2xl bg-[#ffffff] border border-[#ede7df] p-3.5 sm:p-4 shadow-2xs">
                  <div className="flex items-center justify-between mb-2.5">
                    <h2 className="font-bold text-xs sm:text-[13.5px] text-[#1a1715]">
                      Top Selling Products
                    </h2>
                    <button
                      type="button"
                      onClick={() => handleActionClick('View All Top Selling')}
                      className="text-[11px] font-semibold text-[#635d56] hover:text-[#1a1715] flex items-center gap-1 cursor-pointer"
                    >
                      <span>View all</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  {/* Top Selling Products List */}
                  <div className="space-y-2">
                    {displayTopSelling.map((prod) => {
                      const Icon = prod.icon || Package;
                      return (
                        <div
                          key={prod.id || prod.name}
                          className="flex items-center justify-between p-1 rounded-lg hover:bg-[#faf8f5] transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-[#f5ede4] flex items-center justify-center shrink-0 border border-[#eee7dd]">
                              {prod.isShoe ? (
                                <ShoeThumbnail />
                              ) : (
                                <Icon className="w-3.5 h-3.5 text-[#1a1715]" />
                              )}
                            </div>
                            <span className="text-[11px] font-bold text-[#1a1715] truncate">
                              {prod.name}
                            </span>
                          </div>
                          <span className="text-[11px] font-semibold text-[#78726b] shrink-0 ml-2">
                            {prod.sold}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardMockup;
