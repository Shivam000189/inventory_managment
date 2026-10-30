import React, { useState } from 'react';
import {
  Package,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  SlidersHorizontal,
  Plus,
  Minus,
  RotateCcw,
  ExternalLink,
  Search,
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { ProductIcon } from '../components/common/ProductIcon';
import { useApp } from '../context/AppContext';
import { formatINR } from '../lib/formatters';

export const InventoryPage: React.FC = () => {
  const {
    products,
    stockMovements,
    adjustStock,
    stockIn,
    stockOut,
    navigate,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'levels' | 'movements' | 'low_stock'>('levels');
  const [searchQuery, setSearchQuery] = useState('');
  const [movementTypeFilter, setMovementTypeFilter] = useState('All');

  // Modals
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [isStockOutModalOpen, setIsStockOutModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  // Modal Form State
  const [selectedProdId, setSelectedProdId] = useState(products[0]?.id || '');
  const [qtyInput, setQtyInput] = useState(10);
  const [adjustTargetInput, setAdjustTargetInput] = useState(10);
  const [reasonInput, setReasonInput] = useState('Correction');
  const [noteInput, setNoteInput] = useState('');

  // Computed
  const totalUnits = products.reduce((acc, p) => acc + p.stock, 0);
  const totalValue = products.reduce((acc, p) => acc + p.stock * p.purchasePrice, 0);
  const lowStockItems = products.filter((p) => p.stock > 0 && p.stock <= p.reorderLevel);
  const outOfStockItems = products.filter((p) => p.stock === 0);

  const selectedProd = products.find((p) => p.id === selectedProdId) || products[0];

  const handleStockInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    stockIn(selectedProdId, qtyInput, 'MANUAL-IN', noteInput);
    setIsStockInModalOpen(false);
  };

  const handleStockOutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    stockOut(selectedProdId, qtyInput, reasonInput, noteInput);
    setIsStockOutModalOpen(false);
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    adjustStock(selectedProdId, adjustTargetInput, reasonInput, noteInput);
    setIsAdjustModalOpen(false);
  };

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
  });

  const filteredMovements = stockMovements.filter((m) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      m.productName.toLowerCase().includes(q) ||
      m.reference.toLowerCase().includes(q) ||
      m.user.toLowerCase().includes(q);
    const matchType = movementTypeFilter === 'All' || m.type === movementTypeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150 pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold text-[#1C1B18] tracking-tight leading-tight">
            Inventory
          </h1>
          <p className="text-[13px] text-[#6B665E] mt-0.5">
            Monitor on-hand units, stock movements, and inventory adjustments.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedProdId(products[0]?.id || '');
              setQtyInput(10);
              setIsStockInModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#EEE6DA] text-xs font-semibold text-[#1C1B18] hover:bg-[#FAF6EF] transition-colors cursor-pointer shadow-2xs"
          >
            <ArrowDownLeft size={15} className="text-[#2E8B57]" />
            <span>Stock In</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedProdId(products[0]?.id || '');
              setQtyInput(5);
              setIsStockOutModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#EEE6DA] text-xs font-semibold text-[#1C1B18] hover:bg-[#FAF6EF] transition-colors cursor-pointer shadow-2xs"
          >
            <ArrowUpRight size={15} className="text-[#D64545]" />
            <span>Stock Out</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedProdId(products[0]?.id || '');
              setAdjustTargetInput(products[0]?.stock || 0);
              setIsAdjustModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7FAE82] hover:bg-[#6C9C70] text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
          >
            <SlidersHorizontal size={15} />
            <span>Adjust Stock</span>
          </button>
        </div>
      </div>

      {/* 4 StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={<Package size={18} strokeWidth={2} />}
          iconBgColor="bg-[#E6F1E6] text-[#2E8B57]"
          label="Total Units on Hand"
          value={totalUnits.toLocaleString('en-IN')}
          trend="8% vs last month"
          isPositive={true}
        />
        <StatCard
          icon={<Layers size={18} strokeWidth={2} />}
          iconBgColor="bg-[#E6F1E6] text-[#2E8B57]"
          label="Total Stock Value"
          value={formatINR(totalValue)}
          trend="12% growth"
          isPositive={true}
        />
        <StatCard
          icon={<AlertTriangle size={18} strokeWidth={2} />}
          iconBgColor="bg-[#FDEEE3] text-[#E8772E]"
          label="Low Stock Items"
          value={lowStockItems.length}
          trend={`${lowStockItems.length} need reorder`}
          isPositive={false}
          onClick={() => setActiveTab('low_stock')}
        />
        <StatCard
          icon={<AlertTriangle size={18} strokeWidth={2} />}
          iconBgColor="bg-[#FDECEC] text-[#D64545]"
          label="Out of Stock"
          value={outOfStockItems.length}
          trend={outOfStockItems.length === 0 ? 'Optimal' : 'Action needed'}
          isPositive={outOfStockItems.length === 0}
        />
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center justify-between border-b border-[#EEE6DA]">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('levels')}
            className={`pb-3 text-sm font-semibold transition-colors cursor-pointer border-b-2 -mb-px ${
              activeTab === 'levels'
                ? 'border-[#7FAE82] text-[#1C1B18]'
                : 'border-transparent text-[#6B665E] hover:text-[#1C1B18]'
            }`}
          >
            Stock Levels ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('movements')}
            className={`pb-3 text-sm font-semibold transition-colors cursor-pointer border-b-2 -mb-px ${
              activeTab === 'movements'
                ? 'border-[#7FAE82] text-[#1C1B18]'
                : 'border-transparent text-[#6B665E] hover:text-[#1C1B18]'
            }`}
          >
            Movements Ledger ({stockMovements.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('low_stock')}
            className={`pb-3 text-sm font-semibold transition-colors cursor-pointer border-b-2 -mb-px ${
              activeTab === 'low_stock'
                ? 'border-[#E8772E] text-[#E8772E]'
                : 'border-transparent text-[#6B665E] hover:text-[#1C1B18]'
            }`}
          >
            Low Stock Alerts ({lowStockItems.length + outOfStockItems.length})
          </button>
        </div>

        {/* Tab Search */}
        <div className="relative w-64 mb-2">
          <Search size={14} className="absolute left-3 top-2.5 text-[#9A948A]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter list..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#EEE6DA] text-xs bg-white outline-none focus:border-[#7FAE82]"
          />
        </div>
      </div>

      {/* Tab 1: Stock Levels */}
      {activeTab === 'levels' && (
        <div className="bg-white rounded-2xl border border-[#EEE6DA] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF6EF] border-b border-[#EEE6DA] text-[#9A948A]">
                <tr>
                  <th className="py-3 px-4 font-medium">Product</th>
                  <th className="py-3 px-3 font-medium">Category</th>
                  <th className="py-3 px-3 font-medium text-center">On Hand</th>
                  <th className="py-3 px-3 font-medium text-center">Reorder Level</th>
                  <th className="py-3 px-3 font-medium">Stock Bar</th>
                  <th className="py-3 px-3 font-medium text-right">Stock Value</th>
                  <th className="py-3 px-3 font-medium text-center">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEE6DA]/80">
                {filteredProducts.map((p) => {
                  const isOut = p.stock === 0;
                  const isLow = p.stock > 0 && p.stock <= p.reorderLevel;
                  const stockPercent = Math.min(100, Math.round((p.stock / (p.reorderLevel * 2.5)) * 100));

                  return (
                    <tr key={p.id} className="hover:bg-[#FAF6EF]/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <ProductIcon name={p.name} type={p.iconType} />
                          <div>
                            <div className="font-semibold text-[#1C1B18] text-[13px]">{p.name}</div>
                            <div className="text-[11px] text-[#9A948A]">SKU: {p.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-[#6B665E]">{p.category}</td>
                      <td className="py-3 px-3 text-center font-bold text-sm text-[#1C1B18] tabular-nums">
                        {p.stock} <span className="text-xs font-normal text-[#6B665E]">{p.unit}</span>
                      </td>
                      <td className="py-3 px-3 text-center text-[#6B665E] tabular-nums">
                        {p.reorderLevel} {p.unit}
                      </td>
                      <td className="py-3 px-3 w-40">
                        <div className="w-full bg-[#EEE6DA] h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isOut ? 'bg-[#D64545]' : isLow ? 'bg-[#E8772E]' : 'bg-[#7FAE82]'
                            }`}
                            style={{ width: `${Math.max(5, stockPercent)}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-[#1C1B18] tabular-nums">
                        {formatINR(p.stock * p.purchasePrice)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge variant={isOut ? 'danger' : isLow ? 'warning' : 'success'}>
                          {isOut ? 'Out of stock' : isLow ? 'Low stock' : 'In stock'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProdId(p.id);
                            setAdjustTargetInput(p.stock);
                            setIsAdjustModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg border border-[#EEE6DA] text-xs font-semibold text-[#1C1B18] hover:bg-[#FAF6EF] transition-colors cursor-pointer"
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Movements Immutable Ledger */}
      {activeTab === 'movements' && (
        <div className="space-y-3">
          {/* Movement Type Filter Pills */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#EEE6DA] w-fit">
            {(['All', 'Sale', 'Purchase', 'Stock In', 'Stock Out', 'Adjustment', 'Return'] as const).map(
              (type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setMovementTypeFilter(type)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    movementTypeFilter === type
                      ? 'bg-[#FAF6EF] text-[#1C1B18] border border-[#DDD3C4]'
                      : 'text-[#6B665E] hover:text-[#1C1B18]'
                  }`}
                >
                  {type}
                </button>
              )
            )}
          </div>

          <div className="bg-white rounded-2xl border border-[#EEE6DA] overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF6EF] border-b border-[#EEE6DA] text-[#9A948A]">
                  <tr>
                    <th className="py-3 px-4 font-medium">Date & Time</th>
                    <th className="py-3 px-3 font-medium">Type</th>
                    <th className="py-3 px-3 font-medium">Product</th>
                    <th className="py-3 px-3 font-medium text-right">Quantity Delta</th>
                    <th className="py-3 px-3 font-medium text-right">Balance After</th>
                    <th className="py-3 px-3 font-medium">Reference</th>
                    <th className="py-3 px-4 font-medium text-right">Recorded By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEE6DA]/80">
                  {filteredMovements.map((m) => (
                    <tr key={m.id} className="hover:bg-[#FAF6EF]/60 transition-colors">
                      <td className="py-3 px-4 text-[#6B665E] whitespace-nowrap">{m.date}</td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={
                            m.type === 'Sale'
                              ? 'success'
                              : m.type === 'Purchase'
                              ? 'primary'
                              : m.type === 'Stock In'
                              ? 'success'
                              : m.type === 'Return'
                              ? 'info'
                              : 'warning'
                          }
                        >
                          {m.type}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#1C1B18]">{m.productName}</td>
                      <td
                        className={`py-3 px-3 text-right font-bold tabular-nums text-sm ${
                          m.qtyDelta > 0 ? 'text-[#2E8B57]' : 'text-[#D64545]'
                        }`}
                      >
                        {m.qtyDelta > 0 ? `+${m.qtyDelta}` : m.qtyDelta}
                      </td>
                      <td className="py-3 px-3 text-right text-[#1C1B18] font-semibold tabular-nums">
                        {m.balanceAfter}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono bg-[#FAF6EF] px-2 py-0.5 rounded border border-[#EEE6DA] text-[11px] text-[#1C1B18]">
                          {m.reference}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-[#6B665E] font-medium">{m.user}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Low Stock Alerts */}
      {activeTab === 'low_stock' && (
        <div className="bg-white rounded-2xl border border-[#EEE6DA] p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#1C1B18]">
                Critical Reorder Requirements
              </h3>
              <p className="text-xs text-[#6B665E]">
                Items currently at or below their designated threshold.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/app/purchase-orders')}
              className="px-4 py-2 rounded-xl bg-[#7FAE82] text-white text-xs font-semibold hover:bg-[#6C9C70] transition-colors"
            >
              + Create Master Purchase Order
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {[...lowStockItems, ...outOfStockItems].map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-2xl border border-[#EEE6DA] bg-[#FAF6EF]/50 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <ProductIcon name={p.name} type={p.iconType} />
                    <Badge variant={p.stock === 0 ? 'danger' : 'warning'}>
                      {p.stock === 0 ? 'Out of Stock' : `Only ${p.stock} Left`}
                    </Badge>
                  </div>
                  <h4 className="font-semibold text-sm text-[#1C1B18] mt-2">{p.name}</h4>
                  <div className="text-xs text-[#6B665E] mt-0.5">
                    SKU: {p.sku} · Reorder Level: {p.reorderLevel} {p.unit}
                  </div>
                  <div className="text-xs text-[#9A948A] mt-1">
                    Supplier: {p.supplierName || 'Primary Supplier'}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#EEE6DA] flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1C1B18] tabular-nums">
                    Cost: {formatINR(p.purchasePrice)}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate('/app/purchase-orders')}
                    className="px-3 py-1 bg-white border border-[#DDD3C4] rounded-lg text-xs font-semibold text-[#1C1B18] hover:bg-[#FAF6EF]"
                  >
                    Create PO
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stock In Modal */}
      {isStockInModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <form
            onSubmit={handleStockInSubmit}
            className="bg-white rounded-3xl max-w-md w-full border border-[#EEE6DA] shadow-2xl p-6 animate-in zoom-in-95 duration-150 space-y-4"
          >
            <h3 className="text-base font-semibold text-[#1C1B18]">Stock In (Receive Inventory)</h3>
            <p className="text-xs text-[#6B665E]">
              Add units directly to on-hand inventory count.
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#1C1B18] mb-1">Select Product</label>
              <select
                value={selectedProdId}
                onChange={(e) => setSelectedProdId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs bg-white outline-none"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Current: {p.stock} {p.unit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                Quantity to Add ({selectedProd.unit})
              </label>
              <input
                type="number"
                min={1}
                required
                value={qtyInput}
                onChange={(e) => setQtyInput(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs font-bold outline-none focus:border-[#7FAE82]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1B18] mb-1">Notes / Batch No.</label>
              <input
                type="text"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="e.g. Received from warehouse delivery"
                className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsStockInModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#6B665E]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#7FAE82] hover:bg-[#6C9C70] text-white text-xs font-semibold rounded-xl"
              >
                Confirm Stock In
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stock Out Modal */}
      {isStockOutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <form
            onSubmit={handleStockOutSubmit}
            className="bg-white rounded-3xl max-w-md w-full border border-[#EEE6DA] shadow-2xl p-6 animate-in zoom-in-95 duration-150 space-y-4"
          >
            <h3 className="text-base font-semibold text-[#1C1B18]">Stock Out (Reduce Inventory)</h3>
            <p className="text-xs text-[#6B665E]">
              Remove units for damage, internal consumption, or customer samples.
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#1C1B18] mb-1">Select Product</label>
              <select
                value={selectedProdId}
                onChange={(e) => setSelectedProdId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs bg-white outline-none"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Current: {p.stock} {p.unit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                Quantity to Deduct ({selectedProd.unit})
              </label>
              <input
                type="number"
                min={1}
                max={selectedProd.stock}
                required
                value={qtyInput}
                onChange={(e) => setQtyInput(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs font-bold outline-none focus:border-[#7FAE82]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1B18] mb-1">Reason</label>
              <select
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs bg-white outline-none"
              >
                <option value="Damage">Damaged / Expired</option>
                <option value="Loss">Theft / Loss</option>
                <option value="Sample">Promotional Sample</option>
                <option value="Internal">Store Internal Use</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsStockOutModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#6B665E]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#D64545] hover:bg-[#c23939] text-white text-xs font-semibold rounded-xl"
              >
                Confirm Stock Out
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <form
            onSubmit={handleAdjustSubmit}
            className="bg-white rounded-3xl max-w-md w-full border border-[#EEE6DA] shadow-2xl p-6 animate-in zoom-in-95 duration-150 space-y-4"
          >
            <h3 className="text-base font-semibold text-[#1C1B18]">Stock Count Reconciliation</h3>
            <p className="text-xs text-[#6B665E]">
              Enter the exact physical audit count to adjust stock balances.
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#1C1B18] mb-1">Select Product</label>
              <select
                value={selectedProdId}
                onChange={(e) => {
                  setSelectedProdId(e.target.value);
                  const p = products.find((prod) => prod.id === e.target.value);
                  if (p) setAdjustTargetInput(p.stock);
                }}
                className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs bg-white outline-none"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Current: {p.stock} {p.unit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                New Physical Count ({selectedProd.unit})
              </label>
              <input
                type="number"
                min={0}
                required
                value={adjustTargetInput}
                onChange={(e) => setAdjustTargetInput(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-sm font-bold outline-none focus:border-[#7FAE82]"
              />
              <div className="text-[11px] mt-1 text-[#6B665E]">
                Variance:{' '}
                <span
                  className={`font-semibold ${
                    adjustTargetInput - selectedProd.stock >= 0
                      ? 'text-[#2E8B57]'
                      : 'text-[#D64545]'
                  }`}
                >
                  {adjustTargetInput - selectedProd.stock >= 0 ? '+' : ''}
                  {adjustTargetInput - selectedProd.stock} {selectedProd.unit}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1B18] mb-1">Reason</label>
              <select
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs bg-white outline-none"
              >
                <option value="Correction">Physical Count Audit</option>
                <option value="Damage">Discovered Damaged</option>
                <option value="Loss">Loss Discrepancy</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdjustModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#6B665E]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#7FAE82] hover:bg-[#6C9C70] text-white text-xs font-semibold rounded-xl"
              >
                Apply Reconciliation
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
