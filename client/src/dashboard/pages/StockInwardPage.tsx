import React, { useState, useMemo } from 'react';
import {
  Package,
  Layers,
  Search,
  ArrowDownLeft,
  Plus,
  CheckCircle2,
  Clock,
  X,
  Sparkles,
  FileText,
  User,
  Truck,
  Building,
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { ProductIcon } from '../components/common/ProductIcon';
import { TableSkeleton } from '../../components/ui/Feedback';
import { useApp } from '../context/AppContext';
import { formatINR } from '../lib/formatters';
import { Product, StockMovement } from '../types';

export const StockInwardPage: React.FC = () => {
  const {
    products,
    stockMovements,
    stockIn,
    suppliers,
    currentUser,
    businessProfile,
    isLoadingBackend,
    navigate,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterReason, setFilterReason] = useState('All');

  // Drawer state for recording Inward
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [reference, setReference] = useState('');
  const [reason, setReason] = useState('Supplier Receipt');
  const [notes, setNotes] = useState('');
  const [drawerError, setDrawerError] = useState('');
  const [drawerSuccess, setDrawerSuccess] = useState('');

  // Filter movements to only Inward types
  const inwardMovements = useMemo(() => {
    return stockMovements.filter((m) => {
      const isPositive = m.qtyDelta > 0;
      const typeLower = (m.type || '').toLowerCase();
      const isExplicitIn =
        typeLower.includes('in') ||
        typeLower.includes('receipt') ||
        typeLower.includes('purchase') ||
        typeLower.includes('return') ||
        typeLower.includes('initial');
      return isPositive || isExplicitIn;
    });
  }, [stockMovements]);

  // Computed metrics for 4 Stat Cards
  const totalInwardEntries = inwardMovements.length;
  const totalInwardUnits = inwardMovements.reduce(
    (sum, m) => sum + Math.max(0, m.qtyDelta),
    0
  );
  const totalInwardValue = inwardMovements.reduce(
    (sum, m) => sum + (m.amount || 0),
    0
  );
  const activeSuppliersCount = suppliers.length;

  // Filtered table data
  const filteredMovements = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return inwardMovements.filter((m) => {
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
  }, [inwardMovements, searchQuery, filterReason]);

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
    setReference(`IN-${Date.now().toString().slice(-5)}`);
    setReason('Supplier Receipt');
    setNotes('');
    setDrawerError('');
    setDrawerSuccess('');
    setIsDrawerOpen(true);
  };

  const handleSubmitInward = (e: React.FormEvent) => {
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

    try {
      const noteWithReason = `${reason}${notes ? ` - ${notes}` : ''}`;
      stockIn(selectedProductId, numQty, reference || 'STK-IN', noteWithReason);
      setDrawerSuccess(`Successfully added +${numQty} units inward!`);
      setTimeout(() => {
        setIsDrawerOpen(false);
      }, 1200);
    } catch (err: any) {
      setDrawerError(err?.message || 'Failed to record stock inward.');
    }
  };

  const filterPills = [
    'All',
    'Supplier Receipt',
    'Purchase Order',
    'Customer Return',
    'Production Intake',
    'Transfer In',
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-150 pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold text-[#1C1B18] tracking-tight leading-tight">
            Stock Inward
          </h1>
          <p className="text-[13px] text-[#6B665E] mt-0.5">
            Record, verify, and trace incoming supplier shipments, purchase deliveries, and customer returns.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenDrawer}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#381e12] hover:bg-[#2a160d] text-[#ffffff] font-medium text-[13px] rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <Plus size={16} className="text-[#ffffff]" />
            <span className="text-[#ffffff]">Record Inward</span>
          </button>
        </div>
      </div>

      {/* 4 StatCards matching Stock Ledger style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={<ArrowDownLeft size={18} strokeWidth={2.2} />}
          iconBgColor="bg-[#E6F1E6] text-[#2E8B57]"
          label="Inward Entries"
          value={totalInwardEntries.toLocaleString('en-IN')}
          trend={`${totalInwardEntries} recorded transactions`}
          isPositive={true}
        />
        <StatCard
          icon={<Package size={18} strokeWidth={2} />}
          iconBgColor="bg-[#E6F1E6] text-[#2E8B57]"
          label="Total Units Inward"
          value={totalInwardUnits.toLocaleString('en-IN')}
          trend="Total received units"
          isPositive={true}
        />
        <StatCard
          icon={<Layers size={18} strokeWidth={2} />}
          iconBgColor="bg-[#E6F1E6] text-[#2E8B57]"
          label="Inward Valuation"
          value={formatINR(totalInwardValue)}
          trend="Cumulative purchase value"
          isPositive={true}
        />
        <StatCard
          icon={<Truck size={18} strokeWidth={2} />}
          iconBgColor="bg-[#EBF3FC] text-[#2563EB]"
          label="Active Suppliers"
          value={activeSuppliersCount}
          trend={`${activeSuppliersCount} registered vendors`}
          isPositive={true}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-[#EBE8E2] p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Movement Reason Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {filterPills.map((pill) => (
              <button
                key={pill}
                onClick={() => setFilterReason(pill)}
                className={`px-3 py-1.5 text-[12px] font-medium rounded-lg transition-all ${
                  filterReason === pill
                    ? 'bg-[#381e12] text-[#ffffff] shadow-sm'
                    : 'bg-[#F7F5F0] text-[#6B665E] hover:bg-[#EFECE6] hover:text-[#1C1B18]'
                }`}
              >
                {pill}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[260px] max-w-sm">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C827A]"
            />
            <input
              type="text"
              placeholder="Search product, SKU, reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#FAF9F7] text-[13px] border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18] placeholder-[#8C827A] transition-all"
            />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-[#EBE8E2] shadow-sm overflow-hidden">
        {isLoadingBackend ? (
          <TableSkeleton rows={8} />
        ) : filteredMovements.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-[#E6F1E6] text-[#2E8B57] flex items-center justify-center mx-auto mb-3">
              <ArrowDownLeft size={22} />
            </div>
            <h3 className="text-[16px] font-semibold text-[#1C1B18]">
              No Inward Movements Found
            </h3>
            <p className="text-[13px] text-[#8C827A] mt-1 max-w-sm mx-auto">
              {searchQuery || filterReason !== 'All'
                ? 'Try adjusting your search criteria or filter pills.'
                : 'No incoming shipments recorded yet. Click "Record Inward" to log your first receipt.'}
            </p>
            <button
              onClick={handleOpenDrawer}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#381e12] hover:bg-[#2a160d] text-[#ffffff] font-medium text-[13px] rounded-lg transition-colors cursor-pointer"
            >
              <Plus size={15} className="text-[#ffffff]" />
              <span className="text-[#ffffff]">Record First Inward</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#EBE8E2] bg-[#FAF9F7] text-[11px] font-medium uppercase tracking-wider text-[#8C827A]">
                  <th className="py-3 px-4">Product / Item</th>
                  <th className="py-3 px-4">Reference / Receipt</th>
                  <th className="py-3 px-4">Type / Source</th>
                  <th className="py-3 px-4 text-right">Qty Received</th>
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
                          {m.reference || 'IN-RECEIPT'}
                        </span>
                      </td>

                      {/* Type / Source */}
                      <td className="py-3 px-4">
                        <span className="text-[12px] font-medium text-[#2E8B57] bg-[#E6F1E6] px-2 py-0.5 rounded-full inline-block">
                          {m.type || 'Stock In'}
                        </span>
                      </td>

                      {/* Qty Received */}
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center font-semibold text-[#2E8B57] bg-[#E6F1E6] px-2 py-0.5 rounded text-[12px]">
                          +{Math.abs(m.qtyDelta)} units
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

      {/* Slide-over Right Drawer for Inward */}
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
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#E6F1E6] text-[#2E8B57]">
                    <ArrowDownLeft size={20} />
                  </div>
                  <div>
                    <h2 className="text-[16px] font-semibold text-[#1C1B18]">
                      Record Stock Inward
                    </h2>
                    <p className="text-[12px] text-[#8C827A]">
                      Add received inventory quantities to the ledger
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
              <form onSubmit={handleSubmitInward} className="flex-1 overflow-y-auto p-5 space-y-4">
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
                        {p.name} ({p.sku || 'No SKU'}) - Current: {p.stock} units
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-[12px] font-medium text-[#4A443D] mb-1.5">
                    Quantity Received *
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 50"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(e.target.value === '' ? '' : parseInt(e.target.value, 10))
                    }
                    className="w-full px-3 py-2 bg-[#FAF9F7] border border-[#EBE8E2] rounded-lg text-[13px] text-[#1C1B18] focus:outline-none focus:border-[#C4BAAE] focus:bg-white"
                    required
                  />
                </div>

                {/* Reference / Invoice */}
                <div>
                  <label className="block text-[12px] font-medium text-[#4A443D] mb-1.5">
                    Reference / PO / GRN No.
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PO-2026-001 or INV-4491"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF9F7] border border-[#EBE8E2] rounded-lg text-[13px] text-[#1C1B18] focus:outline-none focus:border-[#C4BAAE] focus:bg-white"
                  />
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-[12px] font-medium text-[#4A443D] mb-1.5">
                    Inward Source / Reason
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF9F7] border border-[#EBE8E2] rounded-lg text-[13px] text-[#1C1B18] focus:outline-none focus:border-[#C4BAAE] focus:bg-white"
                  >
                    <option value="Supplier Receipt">Supplier Receipt</option>
                    <option value="Purchase Order Delivery">Purchase Order Delivery</option>
                    <option value="Customer Return">Customer Return</option>
                    <option value="Production Intake">Production Intake</option>
                    <option value="Transfer In">Transfer In</option>
                    <option value="Opening Stock">Opening Stock / Initial</option>
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[12px] font-medium text-[#4A443D] mb-1.5">
                    Remarks / Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Add batch info, courier receipt number, or inspection notes..."
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
                    <span className="text-[#ffffff]">Confirm Inward</span>
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

