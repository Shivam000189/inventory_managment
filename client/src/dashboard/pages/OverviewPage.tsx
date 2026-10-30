import React from 'react';
import { Box, ShoppingCart, AlertTriangle, Clock } from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { DateRangePicker } from '../components/common/DateRangePicker';
import { InventoryTrendChart } from '../components/dashboard/InventoryTrendChart';
import { StockAlertsCard } from '../components/dashboard/StockAlertsCard';
import { RecentTransactionsCard } from '../components/dashboard/RecentTransactionsCard';
import { TopSellingProductsCard } from '../components/dashboard/TopSellingProductsCard';
import { useApp } from '../context/AppContext';
import { formatINR } from '../lib/formatters';

export const OverviewPage: React.FC = () => {
  const { metrics, selectedDateRange, setSelectedDateRange, navigate } = useApp();

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold text-[#1C1B18] tracking-tight leading-tight">
            Overview
          </h1>
          <p className="text-[13px] text-[#6B665E] mt-0.5">
            Here's what's happening with your business today.
          </p>
        </div>
        <div>
          <DateRangePicker
            value={selectedDateRange}
            onChange={setSelectedDateRange}
          />
        </div>
      </div>

      {/* Row 1 — 4 StatCards (Exact match to screenshot) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={<Box size={18} strokeWidth={2} />}
          iconBgColor="bg-[#E6F1E6] text-[#2E8B57]"
          label="Total Stock Value"
          value={formatINR(metrics.totalStockValue)}
          trend="12%"
          isPositive={true}
          onClick={() => navigate('/app/inventory')}
        />

        <StatCard
          icon={<ShoppingCart size={18} strokeWidth={2} />}
          iconBgColor="bg-[#E6F1E6] text-[#2E8B57]"
          label="Today's Sales"
          value={formatINR(metrics.todaySales)}
          trend="8%"
          isPositive={true}
          onClick={() => navigate('/app/pos')}
        />

        <StatCard
          icon={<AlertTriangle size={18} strokeWidth={2} />}
          iconBgColor="bg-[#FDEEE3] text-[#E8772E]"
          label="Low Stock Items"
          value={metrics.lowStockCount}
          trend="4%"
          isPositive={false}
          onClick={() => navigate('/app/inventory')}
        />

        <StatCard
          icon={<AlertTriangle size={18} strokeWidth={2} />}
          iconBgColor="bg-[#FFF4DC] text-[#D98E0B]"
          label="Open Purchase Orders"
          value={metrics.openPOCount}
          trend="25%"
          isPositive={true}
          onClick={() => navigate('/app/purchase-orders')}
        />
      </div>

      {/* Row 2 — Inventory Trend (2/3) & Stock Alerts (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <InventoryTrendChart />
        </div>
        <div className="lg:col-span-1">
          <StockAlertsCard />
        </div>
      </div>

      {/* Row 3 — Recent Transactions (2/3) & Top Selling Products (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <RecentTransactionsCard />
        </div>
        <div className="lg:col-span-1">
          <TopSellingProductsCard />
        </div>
      </div>
    </div>
  );
};
