import React from 'react';
import {
  Box,
  ShoppingCart,
  AlertTriangle,
  Zap,
  FileText,
  CreditCard,
  Clock,
  Layers,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { QuickActionsRibbon } from '../components/dashboard/QuickActionsRibbon';
import { InventoryTrendChart } from '../components/dashboard/InventoryTrendChart';
import { StockAlertsCard } from '../components/dashboard/StockAlertsCard';
import { RecentTransactionsCard } from '../components/dashboard/RecentTransactionsCard';
import { TopSellingProductsCard } from '../components/dashboard/TopSellingProductsCard';
import {
  StatGridSkeleton,
  InventoryTrendSkeleton,
  StockAlertsSkeleton,
  RecentTransactionsSkeleton,
  TopStockSkeleton,
} from '../../components/ui/Feedback';
import { useApp } from '../context/AppContext';
import { formatINR } from '../lib/formatters';
import { isPharmacyBusiness } from '../../shared/industryConfig';

export const OverviewPage: React.FC = () => {
  const { metrics, loadingStates, isLoadingBackend, navigate, businessProfile, products } = useApp();

  const isPharmacy = isPharmacyBusiness(businessProfile);

  // Pharmacy specific KPIs
  const pharmacyMetrics = React.useMemo(() => {
    const now = Date.now();
    let expiredCount = 0;
    let expiring30to60Count = 0;
    let criticalExpiringCount = 0;
    let totalStock = 0;

    (products || []).forEach((p) => {
      totalStock += p.stock || 0;
      if (p.expiryDate && p.stock > 0) {
        const expTime = new Date(p.expiryDate).getTime();
        const diffDays = Math.round((expTime - now) / 86400000);
        if (diffDays < 0) {
          expiredCount += 1;
        } else if (diffDays <= 30) {
          criticalExpiringCount += 1;
        } else if (diffDays <= 60) {
          expiring30to60Count += 1;
        }
      }
    });

    const batchAlerts = expiredCount + criticalExpiringCount + expiring30to60Count;
    const healthUnits = Math.max(0, totalStock - (expiredCount + criticalExpiringCount));
    const healthMeter = totalStock > 0 ? Math.round((healthUnits / totalStock) * 100) : 100;

    return {
      expiredCount,
      expiring30to60Count,
      criticalExpiringCount,
      batchAlerts,
      healthMeter,
      totalStock,
    };
  }, [products]);

  const isStatsLoading = Boolean(loadingStates?.products || loadingStates?.salesOrders || loadingStates?.purchaseOrders);
  const isTrendLoading = Boolean(loadingStates?.products || loadingStates?.inventory);
  const isAlertsLoading = Boolean(loadingStates?.products);
  const isTransactionsLoading = Boolean(loadingStates?.inventory);
  const isTopStockLoading = Boolean(loadingStates?.products || loadingStates?.salesOrders || loadingStates?.inventory);

  const isAnyLoading =
    isStatsLoading ||
    isTrendLoading ||
    isAlertsLoading ||
    isTransactionsLoading ||
    isTopStockLoading ||
    isLoadingBackend;

  return (
    <div
      className="space-y-6 animate-in fade-in duration-150 pb-10"
      role={isAnyLoading ? 'status' : undefined}
      aria-busy={isAnyLoading ? 'true' : 'false'}
    >
      {isAnyLoading && (
        <span className="sr-only">Updating overview dashboard metrics…</span>
      )}

      {/* Top Header & Fast Sale Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold text-[#1C1B18] tracking-tight leading-tight">
            Dashboard Overview
          </h1>
          <p className="text-[13px] text-[#6B665E] mt-0.5">
            Real-time store telemetry, stock movements, and performance metrics for {businessProfile?.name || 'your store'}.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/pos')}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#381e12] hover:bg-[#26140c] text-white text-xs font-semibold transition-all cursor-pointer shadow-2xs whitespace-nowrap active:scale-95"
          >
            <ShoppingCart size={15} strokeWidth={2.5} />
            <span>Open POS Counter</span>
          </button>
        </div>
      </div>

      {/* 3D Quick Actions Ribbon */}
      <QuickActionsRibbon isPharmacy={isPharmacy} navigate={navigate} />

      {/* Row 1 — 4 Metric Stat Cards */}
      {isStatsLoading ? (
        <StatGridSkeleton count={4} />
      ) : isPharmacy ? (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              icon={<ShoppingCart size={18} strokeWidth={2} />}
              iconBgColor="bg-[#E6F1E6] text-[#2E8B57]"
              label="Today's Sales"
              value={formatINR(metrics.todaySales)}
              trend="Pharmacy counter"
              isPositive={true}
              onClick={() => navigate('/pos')}
            />

            <StatCard
              icon={<Clock size={18} strokeWidth={2} />}
              iconBgColor="bg-[#FFF4DC] text-[#D98E0B]"
              label="Expiring (30–60 Days)"
              value={`${pharmacyMetrics.expiring30to60Count} items`}
              trend="Prioritize FEFO"
              isPositive={false}
              onClick={() => navigate('/expiry')}
            />

            <StatCard
              icon={<AlertTriangle size={18} strokeWidth={2} />}
              iconBgColor="bg-[#FDECEC] text-[#D64545]"
              label="Expired Stock"
              value={`${pharmacyMetrics.expiredCount} items`}
              trend="Action needed"
              isPositive={false}
              onClick={() => navigate('/expiry')}
            />

            <StatCard
              icon={<Layers size={18} strokeWidth={2} />}
              iconBgColor="bg-[#EBF2FA] text-[#2563EB]"
              label="Batch Alerts"
              value={`${pharmacyMetrics.batchAlerts} lots`}
              trend="Lot ledger review"
              isPositive={pharmacyMetrics.batchAlerts === 0}
              onClick={() => navigate('/batches')}
            />
          </div>

          {/* Stock Health Meter Widget */}
          <div className="bg-white rounded-2xl border border-[#EEE6DA] p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E6F1E6] text-[#2E8B57] flex items-center justify-center shrink-0">
                <Activity size={20} />
              </div>
              <div>
                <div className="text-xs font-bold text-[#1C1B18] flex items-center gap-2">
                  <span>Pharmacy Stock Health Meter</span>
                  <span className="text-[11px] font-semibold text-[#2E8B57] bg-[#E6F1E6] px-2 py-0.5 rounded-full">
                    {pharmacyMetrics.healthMeter}% Optimal
                  </span>
                </div>
                <p className="text-[11px] text-[#6B665E]">
                  {pharmacyMetrics.totalStock} total units across active batches. {pharmacyMetrics.expiredCount > 0 ? `${pharmacyMetrics.expiredCount} expired lots require write-off.` : 'No critical stock hazards.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => navigate('/expiry')}
                className="px-3 py-1.5 rounded-xl bg-[#381e12] hover:bg-[#26140c] text-xs font-semibold text-white transition-all cursor-pointer shadow-2xs"
              >
                Open Expiry Radar
              </button>
              <button
                type="button"
                onClick={() => navigate('/batches')}
                className="px-3 py-1.5 rounded-xl bg-[#381e12] hover:bg-[#26140c] text-xs font-semibold text-white transition-all cursor-pointer shadow-2xs"
              >
                Manage Batches
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            icon={<Box size={18} strokeWidth={2} />}
            iconBgColor="bg-[#E6F1E6] text-[#2E8B57]"
            label="Total Stock Value"
            value={formatINR(metrics.totalStockValue)}
            trend="12%"
            isPositive={true}
            onClick={() => navigate('/inventory')}
          />

          <StatCard
            icon={<ShoppingCart size={18} strokeWidth={2} />}
            iconBgColor="bg-[#E6F1E6] text-[#2E8B57]"
            label="Today's Sales"
            value={formatINR(metrics.todaySales)}
            trend="8%"
            isPositive={true}
            onClick={() => navigate('/pos')}
          />

          <StatCard
            icon={<AlertTriangle size={18} strokeWidth={2} />}
            iconBgColor="bg-[#FDEEE3] text-[#E8772E]"
            label="Low Stock Items"
            value={metrics.lowStockCount}
            trend="4%"
            isPositive={false}
            onClick={() => navigate('/inventory')}
          />

          <StatCard
            icon={<AlertTriangle size={18} strokeWidth={2} />}
            iconBgColor="bg-[#FFF4DC] text-[#D98E0B]"
            label="Open Purchase Orders"
            value={metrics.openPOCount}
            trend="25%"
            isPositive={true}
            onClick={() => navigate('/purchase-orders')}
          />
        </div>
      )}

      {/* Row 2 & 3 — Bento Grid — 4 Core Cards in unified Bento layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-7 xl:col-span-8 h-full flex flex-col">
          {isTrendLoading ? <InventoryTrendSkeleton /> : <InventoryTrendChart />}
        </div>
        <div className="lg:col-span-5 xl:col-span-4 h-full flex flex-col">
          {isAlertsLoading ? <StockAlertsSkeleton /> : <StockAlertsCard />}
        </div>
        <div className="lg:col-span-7 xl:col-span-8 h-full flex flex-col">
          {isTransactionsLoading ? <RecentTransactionsSkeleton /> : <RecentTransactionsCard />}
        </div>
        <div className="lg:col-span-5 xl:col-span-4 h-full flex flex-col">
          {isTopStockLoading ? <TopStockSkeleton /> : <TopSellingProductsCard />}
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;
