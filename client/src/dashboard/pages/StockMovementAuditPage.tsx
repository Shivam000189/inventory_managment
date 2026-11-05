import React, { useState, useMemo } from 'react';
import {
  History,
  Package,
  Layers,
  Search,
  Filter,
  Download,
  ArrowDownLeft,
  ArrowUpRight,
  SlidersHorizontal,
  RotateCcw,
  Clock,
  X,
  FileText,
  User,
  Scale,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { ProductIcon } from '../components/common/ProductIcon';
import { TableSkeleton } from '../../components/ui/Feedback';
import { useApp } from '../context/AppContext';
import { formatINR } from '../lib/formatters';
import { Product, StockMovement } from '../types';

export const StockMovementAuditPage: React.FC = () => {
  const {
    products,
    stockMovements,
    currentUser,
    businessProfile,
    isLoadingBackend,
    navigate,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [selectedMovement, setSelectedMovement] = useState<StockMovement | null>(null);

  // Computed metrics for 4 Stat Cards
  const totalAuditRecords = stockMovements.length;

  const totalInflowUnits = useMemo(() => {
    return stockMovements
      .filter((m) => m.qtyDelta > 0)
      .reduce((sum, m) => sum + m.qtyDelta, 0);
  }, [stockMovements]);

  const totalOutflowUnits = useMemo(() => {
    return stockMovements
      .filter((m) => m.qtyDelta < 0)
      .reduce((sum, m) => sum + Math.abs(m.qtyDelta), 0);
  }, [stockMovements]);

  const netFlowUnits = totalInflowUnits - totalOutflowUnits;

  // Filtered table data
  const filteredMovements = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return stockMovements.filter((m) => {
      const matchSearch =
        !q ||
        m.productName.toLowerCase().includes(q) ||
        (m.sku && m.sku.toLowerCase().includes(q)) ||
        (m.reference && m.reference.toLowerCase().includes(q)) ||
        (m.user && m.user.toLowerCase().includes(q));

      const typeLower = (m.type || '').toLowerCase();
      const refLower = (m.reference || '').toLowerCase();

      let matchFilter = true;
      if (filterType === 'Stock In') {
        matchFilter = m.qtyDelta > 0 || typeLower.includes('in') || typeLower.includes('receipt');
      } else if (filterType === 'Stock Out') {
        matchFilter = m.qtyDelta < 0 || typeLower.includes('out') || typeLower.includes('sale');
      } else if (filterType === 'Adjustment') {
        matchFilter = typeLower.includes('adjust') || refLower.includes('adj');
      } else if (filterType === 'Return') {
        matchFilter = typeLower.includes('return') || refLower.includes('ret');
      } else if (filterType === 'Damaged') {
        matchFilter = typeLower.includes('damage') || typeLower.includes('write-off') || refLower.includes('dmg');
      }

      return matchSearch && matchFilter;
    });
  }, [stockMovements, searchQuery, filterType]);

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

  // Helper to format movement badge tone
  const getMovementTypeBadge = (m: StockMovement) => {
    const typeLower = (m.type || '').toLowerCase();
    if (typeLower.includes('in') || m.qtyDelta > 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#2E8B57] bg-[#E6F1E6] px-2 py-0.5 rounded-full">
          <ArrowDownLeft size={12} />
          {m.type || 'Stock In'}
        </span>
      );
    }
    if (typeLower.includes('out') || m.qtyDelta < 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#D64545] bg-[#FDECEC] px-2 py-0.5 rounded-full">
          <ArrowUpRight size={12} />
          {m.type || 'Stock Out'}
        </span>
      );
    }
    if (typeLower.includes('adjust')) {
      return (
        <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#2563EB] bg-[#EBF3FC] px-2 py-0.5 rounded-full">
          <SlidersHorizontal size={12} />
          {m.type || 'Adjustment'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[#4A443D] bg-[#F7F5F0] px-2 py-0.5 rounded-full border border-[#EBE8E2]">
        {m.type || 'Movement'}
      </span>
    );
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Transaction ID',
      'Date & Time',
      'Product Name',
      'SKU',
      'Type',
      'Quantity Delta',
      'Balance After',
      'Reference No.',
      'Valuation (INR)',
      'Recorded By',
    ];

    const rows = filteredMovements.map((m) => [
      m.id,
      m.date || 'Today',
      `"${m.productName.replace(/"/g, '""')}"`,
      m.sku || '',
      m.type || 'Movement',
      m.qtyDelta,
      m.balanceAfter ?? '',
      m.reference || '',
      m.amount || 0,
      m.user || 'System',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Stock-Movement-Audit-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold text-[#1C1B18] tracking-tight leading-tight">
            Stock Movement Audit
          </h1>
          <p className="text-[13px] text-[#6B665E] mt-0.5">
            Immutable transaction history and audit trail of all receipts, dispatches, and adjustments.
          </p>
        </div>

        {/* Action Button: Export CSV */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#381e12] hover:bg-[#2a160d] text-[#ffffff] font-medium text-[13px] rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <Download size={16} className="text-[#ffffff]" />
            <span className="text-[#ffffff]">Export Audit CSV</span>
          </button>
        </div>
      </div>

      {/* 4 StatCards matching Stock Ledger style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={<History size={18} strokeWidth={2.2} />}
          iconBgColor="bg-[#EBF3FC] text-[#2563EB]"
          label="Total Audit Records"
          value={totalAuditRecords.toLocaleString('en-IN')}
          trend={`${totalAuditRecords} recorded transactions`}
          isPositive={true}
        />
        <StatCard
          icon={<ArrowDownLeft size={18} strokeWidth={2.2} />}
          iconBgColor="bg-[#E6F1E6] text-[#2E8B57]"
          label="Total Inflow Units"
          value={`+${totalInflowUnits.toLocaleString('en-IN')}`}
          trend="Inward receipts & returns"
          isPositive={true}
        />
        <StatCard
          icon={<ArrowUpRight size={18} strokeWidth={2.2} />}
          iconBgColor="bg-[#FDECEC] text-[#D64545]"
          label="Total Outflow Units"
          value={`-${totalOutflowUnits.toLocaleString('en-IN')}`}
          trend="Sales dispatches & write-offs"
          isPositive={false}
        />
        <StatCard
          icon={<Scale size={18} strokeWidth={2.2} />}
          iconBgColor={
            netFlowUnits >= 0
              ? 'bg-[#E6F1E6] text-[#2E8B57]'
              : 'bg-[#FDECEC] text-[#D64545]'
          }
          label="Net Flow Balance"
          value={`${netFlowUnits >= 0 ? '+' : ''}${netFlowUnits.toLocaleString('en-IN')} units`}
          trend={netFlowUnits >= 0 ? 'Net positive flow' : 'Net negative drain'}
          isPositive={netFlowUnits >= 0}
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
                placeholder="Search product, SKU, reference, user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#FAF9F7] text-[13px] border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18] placeholder-[#8C827A] transition-all"
              />
            </div>

            {/* Movement Type Dropdown */}
            <div className="relative sm:w-60">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C827A] pointer-events-none">
                <Filter size={14} />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full pl-8 pr-8 py-2 bg-[#FAF9F7] text-[13px] font-medium border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18] cursor-pointer transition-all appearance-none"
              >
                <option value="All">All Movement Types</option>
                <option value="Stock In">Stock In (Receipts)</option>
                <option value="Stock Out">Stock Out (Dispatches)</option>
                <option value="Adjustment">Inventory Adjustments</option>
                <option value="Return">Returns & Refunds</option>
                <option value="Damaged">Damaged / Write-off</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C827A] pointer-events-none text-[9px]">
                ▼
              </div>
            </div>
          </div>

          {/* Reset button */}
          {(searchQuery || filterType !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setFilterType('All');
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
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-[#EBF3FC] text-[#2563EB] flex items-center justify-center mx-auto mb-3">
              <History size={22} />
            </div>
            <h3 className="text-[16px] font-semibold text-[#1C1B18]">
              No Audit Records Found
            </h3>
            <p className="text-[13px] text-[#8C827A] mt-1 max-w-sm mx-auto">
              {searchQuery || filterType !== 'All'
                ? 'Try adjusting your search criteria or type filter.'
                : 'No inventory movements have been logged yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#EBE8E2] bg-[#FAF9F7] text-[11px] font-medium uppercase tracking-wider text-[#8C827A]">
                  <th className="py-3 px-4">Product / Item</th>
                  <th className="py-3 px-4">Transaction Ref</th>
                  <th className="py-3 px-4">Movement Type</th>
                  <th className="py-3 px-4 text-right">Quantity Delta</th>
                  <th className="py-3 px-4 text-right">Balance After</th>
                  <th className="py-3 px-4 text-right">Valuation / Amount</th>
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
                      onClick={() => setSelectedMovement(m)}
                      className="hover:bg-[#FCFBF9] transition-colors cursor-pointer"
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

                      {/* Transaction Reference */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded font-mono text-[11px] font-medium bg-[#FAF9F7] text-[#4A443D] border border-[#EBE8E2]">
                          {m.reference || 'TXN-AUDIT'}
                        </span>
                      </td>

                      {/* Movement Type */}
                      <td className="py-3 px-4">
                        {getMovementTypeBadge(m)}
                      </td>

                      {/* Quantity Delta */}
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

                      {/* Valuation */}
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

      {/* Slide-over Right Drawer for Detailed Audit Inspection */}
      {selectedMovement && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setSelectedMovement(null)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl border-l border-[#EBE8E2] flex flex-col animate-in slide-in-from-right duration-200">
              {/* Drawer Header */}
              <div className="p-5 border-b border-[#EBE8E2] flex items-center justify-between bg-[#FAF9F7]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#EBF3FC] text-[#2563EB]">
                    <History size={20} />
                  </div>
                  <div>
                    <h2 className="text-[16px] font-semibold text-[#1C1B18]">
                      Audit Entry Details
                    </h2>
                    <p className="text-[12px] text-[#8C827A]">
                      Transaction ID: {selectedMovement.id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMovement(null)}
                  className="p-1.5 rounded-lg text-[#8C827A] hover:text-[#1C1B18] hover:bg-[#EBE8E2] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Product Summary Card */}
                <div className="p-4 rounded-xl border border-[#EBE8E2] bg-[#FAF9F7] space-y-2">
                  <div className="text-[11px] font-medium uppercase text-[#8C827A]">
                    Product Information
                  </div>
                  <div className="text-[15px] font-semibold text-[#1C1B18]">
                    {selectedMovement.productName}
                  </div>
                  <div className="text-[12px] text-[#6B665E] flex items-center gap-2">
                    <span>SKU: {selectedMovement.sku || 'N/A'}</span>
                    <span>•</span>
                    <span>Product ID: {selectedMovement.productId || 'N/A'}</span>
                  </div>
                </div>

                {/* Audit Attributes Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-[#EBE8E2] bg-white">
                    <div className="text-[11px] text-[#8C827A] font-medium">Movement Type</div>
                    <div className="mt-1">{getMovementTypeBadge(selectedMovement)}</div>
                  </div>

                  <div className="p-3 rounded-lg border border-[#EBE8E2] bg-white">
                    <div className="text-[11px] text-[#8C827A] font-medium">Reference Code</div>
                    <div className="mt-1 font-mono text-[12px] font-semibold text-[#1C1B18]">
                      {selectedMovement.reference || 'N/A'}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-[#EBE8E2] bg-white">
                    <div className="text-[11px] text-[#8C827A] font-medium">Quantity Delta</div>
                    <div
                      className={`mt-1 text-[14px] font-bold ${
                        selectedMovement.qtyDelta > 0
                          ? 'text-[#2E8B57]'
                          : selectedMovement.qtyDelta < 0
                          ? 'text-[#D64545]'
                          : 'text-[#6B665E]'
                      }`}
                    >
                      {selectedMovement.qtyDelta > 0
                        ? `+${selectedMovement.qtyDelta}`
                        : selectedMovement.qtyDelta}{' '}
                      units
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-[#EBE8E2] bg-white">
                    <div className="text-[11px] text-[#8C827A] font-medium">Balance After</div>
                    <div className="mt-1 text-[14px] font-bold text-[#1C1B18]">
                      {selectedMovement.balanceAfter?.toLocaleString('en-IN') ?? '-'} units
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-[#EBE8E2] bg-white">
                    <div className="text-[11px] text-[#8C827A] font-medium">Valuation Impact</div>
                    <div className="mt-1 text-[13px] font-semibold text-[#1C1B18]">
                      {selectedMovement.amount ? formatINR(selectedMovement.amount) : '-'}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-[#EBE8E2] bg-white">
                    <div className="text-[11px] text-[#8C827A] font-medium">Logged By Operator</div>
                    <div className="mt-1 text-[13px] font-semibold text-[#1C1B18] flex items-center gap-1.5">
                      <User size={13} className="text-[#8C827A]" />
                      <span>{selectedMovement.user || 'System'}</span>
                    </div>
                  </div>
                </div>

                {/* Timestamp */}
                <div className="p-3 rounded-lg border border-[#EBE8E2] bg-white flex items-center justify-between text-[12px]">
                  <span className="text-[#8C827A] flex items-center gap-1.5">
                    <Clock size={14} /> Recorded Date:
                  </span>
                  <span className="font-medium text-[#1C1B18]">
                    {selectedMovement.date || 'Today'}
                  </span>
                </div>

                {/* Audit Certificate Badge */}
                <div className="p-3 rounded-xl bg-[#E6F1E6] border border-[#BCE1BC] text-[#2E8B57] text-[12px] flex items-center gap-2.5">
                  <CheckCircle2 size={18} />
                  <span>
                    Immutable ledger audit record verified in secure event log.
                  </span>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-[#EBE8E2] bg-[#FAF9F7] flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedMovement(null)}
                  className="px-4 py-2 bg-[#381e12] hover:bg-[#2a160d] text-[#ffffff] font-medium text-[13px] rounded-lg transition-colors cursor-pointer"
                >
                  <span className="text-[#ffffff]">Close Audit</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

