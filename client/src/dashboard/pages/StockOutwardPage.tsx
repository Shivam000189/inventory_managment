import React, { useState, useMemo } from 'react';
import {
  Filter,
  Package,
  Layers,
  Search,
  ArrowUpRight,
  Minus,
  CheckCircle2,
  Clock,
  X,
  AlertTriangle,
  FileText,
  User,
  Truck,
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { ProductIcon } from '../components/common/ProductIcon';
import { TableSkeleton } from '../../components/ui/Feedback';
import { useApp } from '../context/AppContext';
import { formatINR } from '../lib/formatters';
import { Product, StockMovement } from '../types';

export const StockOutwardPage: React.FC = () => {
  const {
    products,
    stockMovements,
    stockOut,
    currentUser,
    businessProfile,
    isLoadingBackend,
    navigate,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterReason, setFilterReason] = useState('All');

  // Drawer state for recording Outward
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [reference, setReference] = useState('');
  const [reason, setReason] = useState('Sales Dispatch');
  const [notes, setNotes] = useState('');
  const [drawerError, setDrawerError] = useState('');
  const [drawerSuccess, setDrawerSuccess] = useState('');

  // Filter movements to only Outward types
  const outwardMovements = useMemo(() => {
    return stockMovements.filter((m) => {
      const isNegative = m.qtyDelta < 0;
      const typeLower = (m.type || '').toLowerCase();
      const isExplicitOut =
        typeLower.includes('out') ||
        typeLower.includes('sale') ||
        typeLower.includes('dispatch') ||
        typeLower.includes('write-off') ||
        typeLower.includes('damage') ||
        typeLower.includes('loss');
      return isNegative || isExplicitOut;
    });
  }, [stockMovements]);

  // Selected product object for drawer
  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || products[0];
  }, [products, selectedProductId]);

  // Computed metrics for 4 Stat Cards
  const totalOutwardEntries = outwardMovements.length;
  const totalOutwardUnits = outwardMovements.reduce(
    (sum, m) => sum + Math.abs(m.qtyDelta),
    0
  );
  const totalOutwardValue = outwardMovements.reduce(
    (sum, m) => sum + (m.amount || 0),
    0
  );
  const lowStockItemsCount = products.filter(
    (p) => p.stock > 0 && p.stock <= p.reorderLevel
  ).length;

  // Filtered table data
  const filteredMovements = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return outwardMovements.filter((m) => {
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
  }, [outwardMovements, searchQuery, filterReason]);

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
    setSelectedProductId(products[0]?.id || '');
    setQuantity('');
    setReference(`OUT-${Date.now().toString().slice(-5)}`);
    setReason('Sales Dispatch');
    setNotes('');
    setDrawerError('');
    setDrawerSuccess('');
    setIsDrawerOpen(true);
  };

  const handleSubmitOutward = (e: React.FormEvent) => {
    e.preventDefault();
    setDrawerError('');
    setDrawerSuccess('');

    if (!selectedProductId) {
      setDrawerError('Please select a product.');
      return;
    }
    const numQty = typeof quantity === 'number' ? quantity : parseInt(quantity, 10);
    if (isNaN(numQty) || numQty <= 0) {
      setDrawerError('Please enter a valid positive quantity.');
      return;
    }

    const currentStock = selectedProduct ? selectedProduct.stock : 0;
    if (numQty > currentStock) {
      setDrawerError(
        `Quantity (${numQty}) exceeds available stock (${currentStock} units).`
      );
      return;
    }

    try {
      const noteWithReason = `${reason}${notes ? ` - ${notes}` : ''}`;
      stockOut(selectedProductId, numQty, reason, noteWithReason);
      setDrawerSuccess(`Successfully logged -${numQty} units outward!`);
      setTimeout(() => {
        setIsDrawerOpen(false);
      }, 1200);
    } catch (err: any) {
      setDrawerError(err?.message || 'Failed to record stock outward.');
    }
  };

  const filterPills = [
    'All',
    'Sales Dispatch',
    'Damaged / Write-off',
    'Vendor Return',
    'Transfer Out',
    'Loss / Adjustment',
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-150 pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold text-[#1C1B18] tracking-tight leading-tight">
            Stock Outward
          </h1>
          <p className="text-[13px] text-[#6B665E] mt-0.5">
            Record, dispatch, and trace outgoing sales shipments, customer deliveries, and stock write-offs.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenDrawer}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#381e12] hover:bg-[#2a160d] text-[#ffffff] font-medium text-[13px] rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <Minus size={16} className="text-[#ffffff]" />
            <span className="text-[#ffffff]">Record Outward</span>
          </button>
        </div>
      </div>

      {/* 4 StatCards matching Stock Ledger style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={<ArrowUpRight size={18} strokeWidth={2.2} />}
          iconBgColor="bg-[#FDECEC] text-[#D64545]"
          label="Outward Entries"
          value={totalOutwardEntries.toLocaleString('en-IN')}
          trend={`${totalOutwardEntries} recorded dispatches`}
          isPositive={false}
        />
        <StatCard
          icon={<Package size={18} strokeWidth={2} />}
          iconBgColor="bg-[#FDECEC] text-[#D64545]"
          label="Total Units Outward"
          value={totalOutwardUnits.toLocaleString('en-IN')}
          trend="Total dispatched units"
          isPositive={false}
        />
        <StatCard
          icon={<Layers size={18} strokeWidth={2} />}
          iconBgColor="bg-[#E6F1E6] text-[#2E8B57]"
          label="Outward Valuation"
          value={formatINR(totalOutwardValue)}
          trend="Cumulative sales value"
          isPositive={true}
        />
        <StatCard
          icon={<AlertTriangle size={18} strokeWidth={2} />}
          iconBgColor="bg-[#FDEEE3] text-[#E8772E]"
          label="Low Stock Risk"
          value={lowStockItemsCount}
          trend={`${lowStockItemsCount} items near threshold`}
          isPositive={lowStockItemsCount === 0}
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

            {/* Outward Reason Dropdown */}
            <div className="relative sm:w-56">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C827A] pointer-events-none">
                <Filter size={14} />
              </div>
              <select
                value={filterReason}
                onChange={(e) => setFilterReason(e.target.value)}
                className="w-full pl-8 pr-8 py-2 bg-[#FAF9F7] text-[13px] font-medium border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18] cursor-pointer transition-all appearance-none"
              >
                <option value="All">All Outward Types</option>
                <option value="Sales Dispatch">Sales Dispatch</option>
                <option value="Damaged / Write-off">Damaged / Write-off</option>
                <option value="Vendor Return">Vendor Return</option>
                <option value="Transfer Out">Transfer Out</option>
                <option value="Loss / Adjustment">Loss / Adjustment</option>
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
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-[#FDECEC] text-[#D64545] flex items-center justify-center mx-auto mb-3">
              <ArrowUpRight size={22} />
            </div>
            <h3 className="text-[16px] font-semibold text-[#1C1B18]">
              No Outward Movements Found
            </h3>
            <p className="text-[13px] text-[#8C827A] mt-1 max-w-sm mx-auto">
              {searchQuery || filterReason !== 'All'
                ? 'Try adjusting your search criteria or filter pills.'
                : 'No outbound shipments recorded yet. Click "Record Outward" to log your first dispatch.'}
            </p>
            <button
              onClick={handleOpenDrawer}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#381e12] hover:bg-[#2a160d] text-[#ffffff] font-medium text-[13px] rounded-lg transition-colors cursor-pointer"
            >
              <Minus size={15} className="text-[#ffffff]" />
              <span className="text-[#ffffff]">Record First Outward</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#EBE8E2] bg-[#FAF9F7] text-[11px] font-medium uppercase tracking-wider text-[#8C827A]">
                  <th className="py-3 px-4">Product / Item</th>
                  <th className="py-3 px-4">Reference / Order</th>
                  <th className="py-3 px-4">Type / Reason</th>
                  <th className="py-3 px-4 text-right">Qty Dispatched</th>
                  <th className="py-3 px-4 text-right">Balance After</th>
                  <th className="py-3 px-4 text-right">Valuation</th>
                  <th className="py-3 px-4">Logged By / Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2EFE9] text-[13px] text-[#1C1B18]">
                {filteredMovements.map((m) => {
                  const product = getProduct(m.productId, m.sku);
                  const categoryName = product?.category || 'General';

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
                          {m.reference || 'OUT-DISPATCH'}
                        </span>
                      </td>

                      {/* Type / Reason */}
                      <td className="py-3 px-4">
                        <span className="text-[12px] font-medium text-[#D64545] bg-[#FDECEC] px-2 py-0.5 rounded-full inline-block">
                          {m.type || 'Stock Out'}
                        </span>
                      </td>

                      {/* Qty Dispatched */}
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center font-semibold text-[#D64545] bg-[#FDECEC] px-2 py-0.5 rounded text-[12px]">
                          -{Math.abs(m.qtyDelta)} units
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

      {/* Slide-over Right Drawer for Outward */}
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
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#FDECEC] text-[#D64545]">
                    <ArrowUpRight size={20} />
                  </div>
                  <div>
                    <h2 className="text-[16px] font-semibold text-[#1C1B18]">
                      Record Stock Outward
                    </h2>
                    <p className="text-[12px] text-[#8C827A]">
                      Deduct dispatched or damaged inventory from the ledger
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
              <form onSubmit={handleSubmitOutward} className="flex-1 overflow-y-auto p-5 space-y-4">
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
                    Select Product *
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF9F7] border border-[#EBE8E2] rounded-lg text-[13px] text-[#1C1B18] focus:outline-none focus:border-[#C4BAAE] focus:bg-white"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku || 'No SKU'}) - Available: {p.stock} units
                      </option>
                    ))}
                  </select>
                  {selectedProduct && (
                    <div className="mt-1.5 text-[11px] text-[#8C827A] flex items-center gap-2">
                      <span>Available on hand:</span>
                      <span className="font-semibold text-[#1C1B18]">
                        {selectedProduct.stock} units
                      </span>
                    </div>
                  )}
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-[12px] font-medium text-[#4A443D] mb-1.5">
                    Quantity Dispatched *
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 10"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(e.target.value === '' ? '' : parseInt(e.target.value, 10))
                    }
                    className="w-full px-3 py-2 bg-[#FAF9F7] border border-[#EBE8E2] rounded-lg text-[13px] text-[#1C1B18] focus:outline-none focus:border-[#C4BAAE] focus:bg-white"
                    required
                  />
                </div>

                {/* Reference / Order */}
                <div>
                  <label className="block text-[12px] font-medium text-[#4A443D] mb-1.5">
                    Reference / Dispatch / Order No.
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DISP-2026-004 or INV-1092"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF9F7] border border-[#EBE8E2] rounded-lg text-[13px] text-[#1C1B18] focus:outline-none focus:border-[#C4BAAE] focus:bg-white"
                  />
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-[12px] font-medium text-[#4A443D] mb-1.5">
                    Outward Reason / Destination
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF9F7] border border-[#EBE8E2] rounded-lg text-[13px] text-[#1C1B18] focus:outline-none focus:border-[#C4BAAE] focus:bg-white"
                  >
                    <option value="Sales Dispatch">Sales Dispatch</option>
                    <option value="Damaged / Write-off">Damaged / Write-off</option>
                    <option value="Vendor Return">Vendor Return</option>
                    <option value="Transfer Out">Transfer Out</option>
                    <option value="Sample / Promotion">Sample / Promotion</option>
                    <option value="Loss / Adjustment">Loss / Stock Adjustment</option>
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[12px] font-medium text-[#4A443D] mb-1.5">
                    Remarks / Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Add delivery tracking, customer reference, or reason for write-off..."
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
                    <span className="text-[#ffffff]">Confirm Outward</span>
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

