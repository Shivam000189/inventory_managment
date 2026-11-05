import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  AlertTriangle,
  ShieldAlert,
  Calendar,
  Trash2,
  Download,
  Filter,
  CheckCircle2,
  RefreshCw,
  Search,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { useApp } from '../context/AppContext';
import { formatINR } from '../lib/formatters';
import { batchApi, ProductBatch } from '../../api/batchApi';

export const ExpiryTrackingPage: React.FC = () => {
  const { products, navigate } = useApp();
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'expired' | '30days' | '60days' | '90days'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Disposal state
  const [disposeBatch, setDisposeBatch] = useState<ProductBatch | null>(null);
  const [disposeQty, setDisposeQty] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await batchApi.list();
      setBatches(data);
    } catch {
      // Fallback from products
      const fallback: ProductBatch[] = products
        .filter((p) => p.expiryDate || p.batchNumber)
        .map((p) => {
          const exp = p.expiryDate ? new Date(p.expiryDate) : new Date(Date.now() + 90 * 86400000);
          const diffDays = Math.round((exp.getTime() - Date.now()) / 86400000);
          let status: ProductBatch['status'] = 'active';
          if (p.stock <= 0) status = 'depleted';
          else if (diffDays < 0) status = 'expired';
          else if (diffDays <= 30) status = 'critical_expiry';
          else if (diffDays <= 60) status = 'expiring_soon';

          return {
            id: `batch-${p.id}`,
            businessId: '',
            productId: p.id,
            productName: p.name,
            productSku: p.sku,
            category: p.category,
            genericName: p.genericName,
            manufacturer: p.manufacturer,
            unit: p.unit || 'strip',
            batchNumber: p.batchNumber || 'LOT-01',
            manufacturingDate: null,
            expiryDate: exp.toISOString().slice(0, 10),
            mrp: p.mrp || p.sellingPrice,
            purchasePrice: p.purchasePrice,
            sellingPrice: p.sellingPrice,
            currentStock: p.stock,
            supplierName: p.supplierName || (p as any).supplier || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            daysUntilExpiry: diffDays,
            status,
          };
        });
      setBatches(fallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [products]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Metrics
  const expiredList = batches.filter((b) => b.currentStock > 0 && b.daysUntilExpiry < 0);
  const critList = batches.filter((b) => b.currentStock > 0 && b.daysUntilExpiry >= 0 && b.daysUntilExpiry <= 30);
  const soonList = batches.filter((b) => b.currentStock > 0 && b.daysUntilExpiry > 30 && b.daysUntilExpiry <= 60);
  const watchList = batches.filter((b) => b.currentStock > 0 && b.daysUntilExpiry > 60 && b.daysUntilExpiry <= 90);

  const expiredValue = expiredList.reduce((acc, b) => acc + b.currentStock * b.purchasePrice, 0);
  const atRisk30Value = critList.reduce((acc, b) => acc + b.currentStock * b.purchasePrice, 0);
  const atRisk60Value = soonList.reduce((acc, b) => acc + b.currentStock * b.purchasePrice, 0);

  const totalStockUnits = batches.reduce((acc, b) => acc + b.currentStock, 0);
  const totalExpiredUnits = expiredList.reduce((acc, b) => acc + b.currentStock, 0);
  const healthScore = totalStockUnits > 0
    ? Math.max(0, Math.round(((totalStockUnits - totalExpiredUnits - critList.reduce((acc, b) => acc + b.currentStock, 0)) / totalStockUnits) * 100))
    : 100;

  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        b.batchNumber.toLowerCase().includes(q) ||
        b.productName.toLowerCase().includes(q) ||
        (b.genericName && b.genericName.toLowerCase().includes(q));

      if (!matchSearch) return false;

      if (urgencyFilter === 'expired') return b.currentStock > 0 && b.daysUntilExpiry < 0;
      if (urgencyFilter === '30days') return b.currentStock > 0 && b.daysUntilExpiry >= 0 && b.daysUntilExpiry <= 30;
      if (urgencyFilter === '60days') return b.currentStock > 0 && b.daysUntilExpiry > 30 && b.daysUntilExpiry <= 60;
      if (urgencyFilter === '90days') return b.currentStock > 0 && b.daysUntilExpiry > 60 && b.daysUntilExpiry <= 90;
      return true;
    });
  }, [batches, searchQuery, urgencyFilter]);

  const handleExportCSV = () => {
    const headers = ['Batch Number', 'Medicine', 'Generic Molecule', 'Current Stock', 'Expiry Date', 'Days Left', 'MRP', 'Purchase Price'];
    const rows = filteredBatches.map((b) => [
      `"${b.batchNumber}"`,
      `"${b.productName}"`,
      `"${b.genericName || ''}"`,
      b.currentStock,
      b.expiryDate,
      b.daysUntilExpiry,
      b.mrp,
      b.purchasePrice,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pharmacy_expiry_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDispose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disposeBatch) return;
    try {
      await batchApi.dispose(disposeBatch.id, {
        quantity: disposeQty,
        reason: 'Outward disposal via Expiry Radar',
      });
      showToast(`Successfully disposed ${disposeQty} expired units of ${disposeBatch.productName}.`);
      setDisposeBatch(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Disposal failed');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 pb-10">
      {/* Toast Notice */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#1C1B18] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-medium animate-in slide-in-from-top-2">
          <CheckCircle2 size={16} className="text-[#7FAE82]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#D64545] bg-[#FDECEC] px-2.5 py-0.5 rounded-full">
              Drug Safety & Compliance
            </span>
            <span className="text-xs text-[#9A948A]">30 / 60 / 90-Day Radar</span>
          </div>
          <h1 className="text-[28px] font-semibold text-[#1C1B18] tracking-tight leading-tight mt-1">
            Expiry Tracking Radar
          </h1>
          <p className="text-[13px] text-[#6B665E] mt-0.5">
            Identify near-expiry medicine batches, separate expired inventory, and prevent loss via FEFO sales.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#FAF6EF] text-[#1C1B18] border border-[#EEE6DA] text-xs font-semibold transition-all cursor-pointer shadow-2xs"
          >
            <Download size={15} />
            <span>Export Report</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/batches')}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#381e12] hover:bg-[#26140c] text-white text-xs font-semibold transition-all cursor-pointer shadow-2xs"
          >
            <span>Batch Ledger</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={<ShieldAlert size={18} strokeWidth={2} />}
          iconBgColor="bg-[#FDECEC] text-[#D64545]"
          label="Expired Stock (Action Needed)"
          value={`${expiredList.length} lots`}
          trend={formatINR(expiredValue) + ' at cost'}
          isPositive={false}
          onClick={() => setUrgencyFilter('expired')}
        />
        <StatCard
          icon={<AlertTriangle size={18} strokeWidth={2} />}
          iconBgColor="bg-[#FFF4DC] text-[#D98E0B]"
          label="Critical (≤ 30 Days)"
          value={`${critList.length} lots`}
          trend={formatINR(atRisk30Value) + ' value'}
          isPositive={false}
          onClick={() => setUrgencyFilter('30days')}
        />
        <StatCard
          icon={<Clock size={18} strokeWidth={2} />}
          iconBgColor="bg-[#FFF8E6] text-[#D98E0B]"
          label="Expiring in 31–60 Days"
          value={`${soonList.length} lots`}
          trend={formatINR(atRisk60Value) + ' value'}
          isPositive={false}
          onClick={() => setUrgencyFilter('60days')}
        />
        <StatCard
          icon={<CheckCircle2 size={18} strokeWidth={2} />}
          iconBgColor="bg-[#E6F1E6] text-[#2E8B57]"
          label="Inventory Health Meter"
          value={`${healthScore}%`}
          trend="Healthy shelf-life"
          isPositive={healthScore >= 80}
        />
      </div>

      {/* Visual Shelf-Life Distribution Meter */}
      <div className="bg-white rounded-2xl border border-[#EEE6DA] p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-[#1C1B18] uppercase tracking-wider flex items-center gap-2">
            <Clock size={14} className="text-[#7FAE82]" />
            <span>Shelf-Life Distribution Radar</span>
          </div>
          <span className="text-xs text-[#6B665E]">
            {totalStockUnits} total medicine units tracked
          </span>
        </div>

        {/* Visual Multi-Segment Bar */}
        <div className="w-full h-3 rounded-full bg-[#EEE6DA] overflow-hidden flex">
          <div
            style={{ width: `${totalStockUnits > 0 ? (totalExpiredUnits / totalStockUnits) * 100 : 0}%` }}
            className="h-full bg-[#D64545] transition-all"
            title={`Expired: ${totalExpiredUnits} units`}
          />
          <div
            style={{
              width: `${totalStockUnits > 0 ? (critList.reduce((a, b) => a + b.currentStock, 0) / totalStockUnits) * 100 : 0}%`,
            }}
            className="h-full bg-[#E8772E] transition-all"
            title="≤ 30 Days"
          />
          <div
            style={{
              width: `${totalStockUnits > 0 ? (soonList.reduce((a, b) => a + b.currentStock, 0) / totalStockUnits) * 100 : 0}%`,
            }}
            className="h-full bg-[#D98E0B] transition-all"
            title="31–60 Days"
          />
          <div
            style={{
              width: `${totalStockUnits > 0 ? (watchList.reduce((a, b) => a + b.currentStock, 0) / totalStockUnits) * 100 : 0}%`,
            }}
            className="h-full bg-[#6C9C70] transition-all"
            title="61–90 Days"
          />
          <div className="h-full flex-1 bg-[#7FAE82]" title="Safe (>90 Days)" />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-[#6B665E] pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D64545]" />
            <span>Expired ({expiredList.length} lots)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E8772E]" />
            <span>≤ 30 Days ({critList.length} lots)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D98E0B]" />
            <span>31–60 Days ({soonList.length} lots)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#7FAE82]" />
            <span>Safe &gt; 60 Days ({batches.filter((b) => b.daysUntilExpiry > 60).length} lots)</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white rounded-2xl border border-[#EEE6DA] p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All Lots' },
              { id: 'expired', label: 'Expired', badge: expiredList.length, danger: true },
              { id: '30days', label: '≤ 30 Days (Critical)', badge: critList.length, warning: true },
              { id: '60days', label: '31–60 Days', badge: soonList.length },
              { id: '90days', label: '61–90 Days', badge: watchList.length },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setUrgencyFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  urgencyFilter === tab.id
                    ? 'bg-[#381e12] text-white shadow-xs'
                    : 'bg-[#FAF6EF] text-[#6B665E] hover:bg-[#F4EDE2] hover:text-[#1C1B18]'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      urgencyFilter === tab.id
                        ? 'bg-white/20 text-white'
                        : tab.danger
                        ? 'bg-[#FDECEC] text-[#D64545]'
                        : 'bg-[#FFF4DC] text-[#D98E0B]'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px] sm:max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A948A]" />
            <input
              type="text"
              placeholder="Search medicine, salt, batch #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#EEE6DA] bg-[#FAF6EF]/50 text-xs text-[#1C1B18] placeholder-[#9A948A] outline-none focus:border-[#7FAE82] focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-[#EEE6DA]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF6EF]/60 text-[#6B665E] border-b border-[#EEE6DA]">
                <th className="py-3 px-3 font-semibold">Medicine & Generic Molecule</th>
                <th className="py-3 px-3 font-semibold">Batch / Lot #</th>
                <th className="py-3 px-3 font-semibold text-right">Stock</th>
                <th className="py-3 px-3 font-semibold">Expiry Date</th>
                <th className="py-3 px-3 font-semibold">Shelf-Life Status</th>
                <th className="py-3 px-3 font-semibold text-right">Value at Cost</th>
                <th className="py-3 px-3 font-semibold text-center">Urgent Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEE6DA]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#9A948A]">
                    Scanning inventory shelf-life…
                  </td>
                </tr>
              ) : filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#9A948A]">
                    No lots found in this shelf-life radar tier.
                  </td>
                </tr>
              ) : (
                filteredBatches.map((b) => {
                  const isExp = b.daysUntilExpiry < 0;
                  const isCrit = b.daysUntilExpiry >= 0 && b.daysUntilExpiry <= 30;
                  const isSoon = b.daysUntilExpiry > 30 && b.daysUntilExpiry <= 60;

                  return (
                    <tr
                      key={b.id}
                      className={`hover:bg-[#FAF6EF]/40 transition-colors ${
                        isExp ? 'bg-[#FDECEC]/20' : isCrit ? 'bg-[#FFF4DC]/20' : ''
                      }`}
                    >
                      <td className="py-3 px-3">
                        <div className="font-semibold text-[#1C1B18]">{b.productName}</div>
                        {b.genericName && (
                          <div className="text-[11px] text-[#7FAE82] font-medium">{b.genericName}</div>
                        )}
                        {b.manufacturer && (
                          <div className="text-[10px] text-[#9A948A]">Mfr: {b.manufacturer}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-[#1C1B18]">
                        {b.batchNumber}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className={`font-bold ${isExp ? 'text-[#D64545]' : 'text-[#1C1B18]'}`}>
                          {b.currentStock}
                        </span>{' '}
                        <span className="text-[10px] text-[#9A948A]">{b.unit || 'strip'}</span>
                      </td>
                      <td className="py-3 px-3 font-medium text-[#1C1B18]">
                        {new Date(b.expiryDate).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-3">
                        {isExp ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D64545] bg-[#FDECEC] px-2.5 py-0.5 rounded-full">
                            <AlertTriangle size={11} /> Expired ({Math.abs(b.daysUntilExpiry)} days ago)
                          </span>
                        ) : isCrit ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#E8772E] bg-[#FDEEE3] px-2.5 py-0.5 rounded-full">
                            <Clock size={11} /> Critical: {b.daysUntilExpiry} days left
                          </span>
                        ) : isSoon ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#D98E0B] bg-[#FFF4DC] px-2.5 py-0.5 rounded-full">
                            <Clock size={11} /> Warning: {b.daysUntilExpiry} days left
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#2E8B57] bg-[#E6F1E6] px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 size={11} /> Healthy ({b.daysUntilExpiry}d)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-[#1C1B18]">
                        {formatINR(b.currentStock * b.purchasePrice)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {isExp ? (
                          <button
                            type="button"
                            onClick={() => {
                              setDisposeBatch(b);
                              setDisposeQty(b.currentStock);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-[#D64545] hover:bg-[#B93838] text-white text-[11px] font-semibold shadow-2xs transition-all cursor-pointer"
                          >
                            <Trash2 size={12} />
                            <span>Dispose Lot</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => navigate('/pos')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-[#EEE6DA] hover:bg-[#FAF6EF] text-[#2E8B57] text-[11px] font-semibold transition-all cursor-pointer"
                          >
                            <span>FEFO Sale</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disposal Dialog */}
      {disposeBatch && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#EEE6DA] shadow-xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-2 text-[#D64545] border-b border-[#EEE6DA] pb-3">
              <Trash2 size={20} />
              <h3 className="text-base font-bold text-[#1C1B18]">Confirm Outward Disposal</h3>
            </div>

            <form onSubmit={handleDispose} className="space-y-3.5">
              <p className="text-xs text-[#6B665E]">
                Write off expired units of <strong className="text-[#1C1B18]">{disposeBatch.productName}</strong> (Batch{' '}
                <span className="font-mono font-bold text-[#1C1B18]">{disposeBatch.batchNumber}</span>). This will log
                an outward disposal movement in the stock ledger audit trail.
              </p>

              <div>
                <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                  Units to Write Off
                </label>
                <input
                  type="number"
                  min="1"
                  max={disposeBatch.currentStock}
                  value={disposeQty}
                  onChange={(e) => setDisposeQty(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none focus:border-[#D64545]"
                  required
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#EEE6DA]">
                <button
                  type="button"
                  onClick={() => setDisposeBatch(null)}
                  className="px-4 py-2 rounded-xl border border-[#EEE6DA] text-xs font-semibold text-[#6B665E] hover:bg-[#FAF6EF]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#D64545] hover:bg-[#B93838] text-white text-xs font-semibold shadow-xs"
                >
                  Confirm Disposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpiryTrackingPage;
