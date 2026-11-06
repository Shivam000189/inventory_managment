import React, { useState, useMemo } from 'react';
import {
  SlidersHorizontal,
  Package,
  Layers,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  X,
  AlertTriangle,
  Scale,
  FileText,
  User,
  Plus,
  ArrowUpDown,
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { ProductIcon } from '../components/common/ProductIcon';
import { TableSkeleton } from '../../components/ui/Feedback';
import { useApp } from '../context/AppContext';
import { formatINR } from '../lib/formatters';
import { Product, StockMovement } from '../types';

export const StockAdjustmentsPage: React.FC = () => {
  const {
    products,
    stockMovements,
    adjustStock,
    currentUser,
    businessProfile,
    isLoadingBackend,
    navigate,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterReason, setFilterReason] = useState('All');

  // Drawer state for recording Adjustment
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [newCount, setNewCount] = useState<number | ''>('');
  const [reference, setReference] = useState('');
  const [reason, setReason] = useState('Physical Audit');
  const [notes, setNotes] = useState('');
  const [drawerError, setDrawerError] = useState('');
  const [drawerSuccess, setDrawerSuccess] = useState('');

  // Filter movements to only Adjustment / Reconciliation types
  const adjustmentMovements = useMemo(() => {
    return stockMovements.filter((m) => {
      const typeLower = (m.type || '').toLowerCase();
      const refLower = (m.reference || '').toLowerCase();
      return (
        typeLower.includes('adjust') ||
        typeLower.includes('reconcil') ||
        refLower.includes('adj')
      );
    });
  }, [stockMovements]);

  // Selected product helper
  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || products[0];
  }, [products, selectedProductId]);

  // Compute live delta for drawer preview
  const computedDelta = useMemo(() => {
    if (!selectedProduct || newCount === '') return 0;
    const countNum = typeof newCount === 'number' ? newCount : parseInt(newCount, 10);
    if (isNaN(countNum)) return 0;
    return countNum - selectedProduct.stock;
  }, [selectedProduct, newCount]);

  // Computed metrics for 4 Stat Cards
  const totalAdjustmentsCount = adjustmentMovements.length;

  const netVarianceUnits = adjustmentMovements.reduce(
    (sum, m) => sum + (m.qtyDelta || 0),
    0
  );

  const totalValuationImpact = adjustmentMovements.reduce(
    (sum, m) => sum + (m.amount || 0),
    0
  );

  const uniqueAuditedProductsCount = useMemo(() => {
    const set = new Set(adjustmentMovements.map((m) => m.productId || m.sku));
    return set.size;
  }, [adjustmentMovements]);

  // Filtered table data
  const filteredMovements = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return adjustmentMovements.filter((m) => {
      const matchSearch =
        !q ||
        m.productName.toLowerCase().includes(q) ||
        (m.sku && m.sku.toLowerCase().includes(q)) ||
        (m.reference && m.reference.toLowerCase().includes(q)) ||
        (m.user && m.user.toLowerCase().includes(q));

      const matchFilter =
        filterReason === 'All' ||
        (m.reference && m.reference.toLowerCase().includes(filterReason.toLowerCase())) ||
        (m.type && m.type.toLowerCase().includes(filterReason.toLowerCase()));

      return matchSearch && matchFilter;
    });
  }, [adjustmentMovements, searchQuery, filterReason]);

  // Lookup product helper
  const getProduct = (productId?: string, sku?: string): Product | undefined => {
    if (productId) {
      const found = products.find((p) => p.id === productId);
      if (found) return found;
    }
    if (sku) {
      return products.find((p) => p.sku === sku);
    }
    return undefined;
  };

  const handleOpenDrawer = () => {
    const initialProd = products[0];
    setSelectedProductId(initialProd?.id || '');
    setNewCount(initialProd ? initialProd.stock : '');
    setReference(`ADJ-${Date.now().toString().slice(-5)}`);
    setReason('Physical Audit');
    setNotes('');
    setDrawerError('');
    setDrawerSuccess('');
    setIsDrawerOpen(true);
  };

  const handleSubmitAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    setDrawerError('');
    setDrawerSuccess('');

    if (!selectedProductId) {
      setDrawerError('Please select a product.');
      return;
    }
    const countNum = typeof newCount === 'number' ? newCount : parseInt(newCount, 10);
    if (isNaN(countNum) || countNum < 0) {
      setDrawerError('Please enter a valid non-negative physical count.');
      return;
    }

    if (selectedProduct && countNum === selectedProduct.stock) {
      setDrawerError('Physical count matches current stock (Variance: 0). No adjustment needed.');
      return;
    }

    try {
      const noteWithRef = `${reference ? `[${reference}] ` : ''}${notes || ''}`.trim();
      adjustStock(selectedProductId, countNum, reason, noteWithRef);
      setDrawerSuccess(
        `Adjustment logged: New stock is ${countNum} units (${computedDelta > 0 ? `+${computedDelta}` : computedDelta} variance).`
      );
      setTimeout(() => {
        setIsDrawerOpen(false);
      }, 1200);
    } catch (err: any) {
      setDrawerError(err?.message || 'Failed to record stock adjustment.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold text-[#1C1B18] tracking-tight leading-tight">
            Inventory Adjustments
          </h1>
          <p className="text-[13px] text-[#6B665E] mt-0.5">
            Reconcile physical counts vs system records, audit discrepancies, and record stock adjustments.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenDrawer}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#381e12] hover:bg-[#2a160d] text-[#ffffff] font-medium text-[13px] rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <SlidersHorizontal size={16} className="text-[#ffffff]" />
            <span className="text-[#ffffff]">Record Adjustment</span>
          </button>
        </div>
      </div>

      {/* 4 StatCards matching Stock Ledger style (2x2 on Mobile, 4 columns on Desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
        <StatCard
          icon={<SlidersHorizontal size={18} strokeWidth={2.2} />}
          iconBgColor="bg-[#EBF3FC] text-[#2563EB]"
          label="Total Adjustments"
          value={totalAdjustmentsCount.toLocaleString('en-IN')}
          trend={`${totalAdjustmentsCount} audit records`}
          isPositive={true}
        />
        <StatCard
          icon={<Scale size={18} strokeWidth={2} />}
          iconBgColor={
            netVarianceUnits >= 0
              ? 'bg-[#E6F1E6] text-[#2E8B57]'
              : 'bg-[#FDECEC] text-[#D64545]'
          }
          label="Net Variance"
          value={`${netVarianceUnits >= 0 ? '+' : ''}${netVarianceUnits.toLocaleString('en-IN')} units`}
          trend={netVarianceUnits >= 0 ? 'Net surplus' : 'Net deficit / shrinkage'}
          isPositive={netVarianceUnits >= 0}
        />
        <StatCard
          icon={<Layers size={18} strokeWidth={2} />}
          iconBgColor="bg-[#E6F1E6] text-[#2E8B57]"
          label="Valuation Impact"
          value={formatINR(totalValuationImpact)}
          trend="Cumulative value adjusted"
          isPositive={true}
        />
        <StatCard
          icon={<Package size={18} strokeWidth={2} />}
          iconBgColor="bg-[#F7F5F0] text-[#6B665E]"
          label="Products Audited"
          value={uniqueAuditedProductsCount}
          trend={`${products.length} total in catalog`}
          isPositive={true}
        />
      </div>

      {/* Filter and Search Bar (Dropdown alongside Search) */}
      <div className="bg-white rounded-xl border border-[#EBE8E2] p-3.5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box & Dropdown */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 max-w-2xl">
            {/* Search Box */}
            <div className="relative flex-1 min-w-[240px]">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C827A]"
              />
              <input
                type="text"
                placeholder="Search product, SKU, audit reference, user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#FAF9F7] text-[13px] border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18] placeholder-[#8C827A] transition-all"
              />
            </div>

            {/* Adjustment Reason Dropdown */}
            <div className="relative sm:w-60">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C827A] pointer-events-none">
                <Filter size={14} />
              </div>
              <select
                value={filterReason}
                onChange={(e) => setFilterReason(e.target.value)}
                className="w-full pl-8 pr-8 py-2 bg-[#FAF9F7] text-[13px] font-medium border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18] cursor-pointer transition-all appearance-none"
              >
                <option value="All">All Adjustment Reasons</option>
                <option value="Physical Audit">Physical Audit / Cycle Count</option>
                <option value="Shrinkage">Shrinkage / Discrepancy</option>
                <option value="Damaged">Damaged / Spoiled</option>
                <option value="Found Stock">Found Stock / Surplus</option>
                <option value="Correction">Data Entry / Correction</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C827A] pointer-events-none text-[9px]">
                ▼
              </div>
            </div>
          </div>

          {/* Reset button */}
          {(searchQuery || filterReason !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setFilterReason('All');
              }}
              className="text-[12px] font-medium text-[#8C827A] hover:text-[#381e12] px-2 py-1 transition-colors self-end sm:self-center cursor-pointer"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-[#EBE8E2] shadow-sm overflow-hidden">
        {isLoadingBackend ? (
          <TableSkeleton rows={8} />
        ) : filteredMovements.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-[#EBF3FC] text-[#2563EB] flex items-center justify-center mb-3">
              <SlidersHorizontal size={22} />
            </div>
            <h3 className="text-[16px] font-semibold text-[#1C1B18] text-center w-full">
              No Inventory Adjustments Found
            </h3>
            <p className="text-[13px] text-[#8C827A] mt-1.5 max-w-md mx-auto text-center w-full leading-relaxed">
              {searchQuery || filterReason !== 'All'
                ? 'Try adjusting your search query or selected reason filter.'
                : 'No stock variance or reconciliation entries logged yet. Click "Record Adjustment" to audit physical stock.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#EBE8E2] bg-[#FAF9F7] text-[11px] font-medium uppercase tracking-wider text-[#8C827A]">
                  <th className="py-3 px-4">Product / Item</th>
                  <th className="py-3 px-4">Audit Reference</th>
                  <th className="py-3 px-4">Reason / Type</th>
                  <th className="py-3 px-4 text-right">Variance (Delta)</th>
                  <th className="py-3 px-4 text-right">Balance After</th>
                  <th className="py-3 px-4 text-right">Value Impact</th>
                  <th className="py-3 px-4">Audited By / Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2EFE9] text-[13px] text-[#1C1B18]">
                {filteredMovements.map((m) => {
                  const product = getProduct(m.productId, m.sku);
                  const categoryName = product?.category || 'General';
                  const isPositive = m.qtyDelta > 0;
                  const isZero = m.qtyDelta === 0;

                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-[#FCFBF9] transition-colors"
                    >
                      {/* Product details with icon */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <ProductIcon category={categoryName} size="md" />
                          <div>
                            <div className="font-medium text-[#1C1B18]">
                              {m.productName}
                            </div>
                            <div className="text-[11px] text-[#8C827A] flex items-center gap-1.5">
                              <span>SKU: {m.sku || 'N/A'}</span>
                              <span>•</span>
                              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-[#F7F5F0] text-[#6B665E]">
                                {categoryName}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Reference */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded font-mono text-[11px] font-medium bg-[#FAF9F7] text-[#4A443D] border border-[#EBE8E2]">
                          {m.reference || 'ADJ-AUDIT'}
                        </span>
                      </td>

                      {/* Reason / Type */}
                      <td className="py-3 px-4">
                        <span className="text-[12px] font-medium text-[#4A443D] bg-[#F7F5F0] px-2.5 py-0.5 rounded-full inline-block border border-[#EBE8E2]">
                          {m.type || 'Adjustment'}
                        </span>
                      </td>

                      {/* Variance / Delta */}
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`inline-flex items-center font-semibold px-2 py-0.5 rounded text-[12px] ${
                            isZero
                              ? 'bg-[#F7F5F0] text-[#6B665E]'
                              : isPositive
                              ? 'bg-[#E6F1E6] text-[#2E8B57]'
                              : 'bg-[#FDECEC] text-[#D64545]'
                          }`}
                        >
                          {isPositive ? `+${m.qtyDelta}` : m.qtyDelta} units
                        </span>
                      </td>

                      {/* Balance After */}
                      <td className="py-3 px-4 text-right font-medium text-[#1C1B18]">
                        {m.balanceAfter?.toLocaleString('en-IN') ?? '-'}
                      </td>

                      {/* Value Impact */}
                      <td className="py-3 px-4 text-right text-[#4A443D]">
                        {m.amount ? formatINR(m.amount) : '-'}
                      </td>

                      {/* User & Date */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#EBE8E2] text-[#4A443D] font-medium text-[10px] flex items-center justify-center">
                            {(m.user || 'SYS').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-[12px] font-medium text-[#1C1B18]">
                              {m.user || 'System'}
                            </div>
                            <div className="text-[11px] text-[#8C827A]">
                              {m.date || 'Today'}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-over Right Drawer for Stock Adjustment */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsDrawerOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl border-l border-[#EBE8E2] flex flex-col animate-in slide-in-from-right duration-200">
              {/* Drawer Header */}
              <div className="p-5 border-b border-[#EBE8E2] flex items-center justify-between bg-[#FAF9F7]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#EBF3FC] text-[#2563EB]">
                    <SlidersHorizontal size={20} />
                  </div>
                  <div>
                    <h2 className="text-[16px] font-semibold text-[#1C1B18]">
                      Record Stock Adjustment
                    </h2>
                    <p className="text-[12px] text-[#8C827A]">
                      Audit recorded stock against actual physical counts
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-[#8C827A] hover:text-[#1C1B18] hover:bg-[#EBE8E2] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Body / Form */}
              <form onSubmit={handleSubmitAdjustment} className="flex-1 overflow-y-auto p-5 space-y-4">
                {drawerError && (
                  <div className="p-3 rounded-lg bg-[#FDECEC] text-[#D64545] text-[12px] border border-[#FAD2D2]">
                    {drawerError}
                  </div>
                )}
                {drawerSuccess && (
                  <div className="p-3 rounded-lg bg-[#E6F1E6] text-[#2E8B57] text-[12px] border border-[#BCE1BC] flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    <span>{drawerSuccess}</span>
                  </div>
                )}

                {/* Product Select */}
                <div>
                  <label className="block text-[12px] font-medium text-[#4A443D] mb-1.5">
                    Select Product to Adjust *
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedProductId(id);
                      const p = products.find((prod) => prod.id === id);
                      if (p) setNewCount(p.stock);
                    }}
                    className="w-full px-3 py-2 bg-[#FAF9F7] border border-[#EBE8E2] rounded-lg text-[13px] text-[#1C1B18] focus:outline-none focus:border-[#C4BAAE] focus:bg-white"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku || 'No SKU'}) - Current: {p.stock} units
                      </option>
                    ))}
                  </select>

                  {/* Current Balance Banner */}
                  {selectedProduct && (
                    <div className="mt-2 p-2.5 rounded-lg bg-[#FAF9F7] border border-[#EBE8E2] flex items-center justify-between text-[12px]">
                      <span className="text-[#6B665E]">Current Recorded Balance:</span>
                      <span className="font-semibold text-[#1C1B18]">
                        {selectedProduct.stock} units
                      </span>
                    </div>
                  )}
                </div>

                {/* Physical Count Input */}
                <div>
                  <label className="block text-[12px] font-medium text-[#4A443D] mb-1.5">
                    Actual Physical Count *
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Enter physical count"
                    value={newCount}
                    onChange={(e) =>
                      setNewCount(e.target.value === '' ? '' : parseInt(e.target.value, 10))
                    }
                    className="w-full px-3 py-2 bg-[#FAF9F7] border border-[#EBE8E2] rounded-lg text-[13px] text-[#1C1B18] focus:outline-none focus:border-[#C4BAAE] focus:bg-white"
                    required
                  />

                  {/* Auto-computed Variance indicator */}
                  {selectedProduct && newCount !== '' && (
                    <div
                      className={`mt-2 p-2.5 rounded-lg border flex items-center justify-between text-[12px] ${
                        computedDelta > 0
                          ? 'bg-[#E6F1E6] border-[#BCE1BC] text-[#2E8B57]'
                          : computedDelta < 0
                          ? 'bg-[#FDECEC] border-[#FAD2D2] text-[#D64545]'
                          : 'bg-[#F7F5F0] border-[#EBE8E2] text-[#6B665E]'
                      }`}
                    >
                      <span className="font-medium">Calculated Variance (Delta):</span>
                      <span className="font-semibold text-[13px]">
                        {computedDelta > 0 ? `+${computedDelta}` : computedDelta} units
                      </span>
                    </div>
                  )}
                </div>

                {/* Audit Reference */}
                <div>
                  <label className="block text-[12px] font-medium text-[#4A443D] mb-1.5">
                    Audit Reference / Memo No.
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AUDIT-Q1-01 or COUNT-12"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF9F7] border border-[#EBE8E2] rounded-lg text-[13px] text-[#1C1B18] focus:outline-none focus:border-[#C4BAAE] focus:bg-white"
                  />
                </div>

                {/* Adjustment Reason */}
                <div>
                  <label className="block text-[12px] font-medium text-[#4A443D] mb-1.5">
                    Adjustment Reason *
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF9F7] border border-[#EBE8E2] rounded-lg text-[13px] text-[#1C1B18] focus:outline-none focus:border-[#C4BAAE] focus:bg-white"
                  >
                    <option value="Physical Audit">Physical Audit / Cycle Count</option>
                    <option value="Shrinkage">Shrinkage / Inventory Discrepancy</option>
                    <option value="Damaged / Spoiled">Damaged / Expired / Spoiled</option>
                    <option value="Found Stock">Found Stock / Unaccounted Surplus</option>
                    <option value="Data Entry Correction">Data Entry / Administrative Correction</option>
                  </select>
                </div>

                {/* Remarks / Notes */}
                <div>
                  <label className="block text-[12px] font-medium text-[#4A443D] mb-1.5">
                    Remarks / Investigation Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide details on root cause or audit sheet page number..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF9F7] border border-[#EBE8E2] rounded-lg text-[13px] text-[#1C1B18] focus:outline-none focus:border-[#C4BAAE] focus:bg-white"
                  />
                </div>

                {/* Submit Action */}
                <div className="pt-4 border-t border-[#EBE8E2] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="px-4 py-2 border border-[#EBE8E2] text-[#4A443D] hover:bg-[#FAF9F7] rounded-lg text-[13px] font-medium transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#381e12] hover:bg-[#2a160d] text-[#ffffff] font-medium text-[13px] rounded-lg transition-colors cursor-pointer"
                  >
                    <span className="text-[#ffffff]">Confirm Adjustment</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

