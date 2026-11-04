import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Plus,
  Search,
  Calendar,
  AlertTriangle,
  Clock,
  Trash2,
  X,
  CheckCircle2,
  Sparkles,
  Filter,
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { useApp } from '../context/AppContext';
import { formatINR } from '../lib/formatters';
import { batchApi, ProductBatch } from '../../api/batchApi';

export const BatchManagementPage: React.FC = () => {
  const { products, suppliers, navigate } = useApp();
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'expiring' | 'expired' | 'depleted'>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDisposeModalOpen, setIsDisposeModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<ProductBatch | null>(null);
  const [disposeQty, setDisposeQty] = useState(1);
  const [disposeReason, setDisposeReason] = useState('Expired medicine disposal');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Add form state
  const [formData, setFormData] = useState({
    productId: '',
    batchNumber: '',
    manufacturingDate: '',
    expiryDate: '',
    mrp: 0,
    purchasePrice: 0,
    sellingPrice: 0,
    quantity: 10,
    supplierId: '',
    notes: '',
  });

  const loadBatches = async () => {
    setLoading(true);
    try {
      const data = await batchApi.list();
      setBatches(data);
    } catch {
      // Fallback: derive batches from products catalog if endpoint empty
      const derived: ProductBatch[] = products
        .filter((p) => p.batchNumber)
        .map((p) => {
          const exp = p.expiryDate ? new Date(p.expiryDate) : new Date(Date.now() + 180 * 86400000);
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
      setBatches(derived);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
  }, [products]);

  const showToast = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Metrics
  const totalLots = batches.length;
  const activeLots = batches.filter((b) => b.currentStock > 0 && b.daysUntilExpiry >= 0).length;
  const expiringSoon = batches.filter((b) => b.currentStock > 0 && b.daysUntilExpiry >= 0 && b.daysUntilExpiry <= 60).length;
  const expiredLots = batches.filter((b) => b.currentStock > 0 && b.daysUntilExpiry < 0).length;

  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        b.batchNumber.toLowerCase().includes(q) ||
        b.productName.toLowerCase().includes(q) ||
        b.productSku.toLowerCase().includes(q) ||
        (b.genericName && b.genericName.toLowerCase().includes(q));

      if (!matchSearch) return false;

      if (activeTab === 'active') return b.currentStock > 0 && b.daysUntilExpiry > 60;
      if (activeTab === 'expiring') return b.currentStock > 0 && b.daysUntilExpiry >= 0 && b.daysUntilExpiry <= 60;
      if (activeTab === 'expired') return b.currentStock > 0 && b.daysUntilExpiry < 0;
      if (activeTab === 'depleted') return b.currentStock <= 0;
      return true;
    });
  }, [batches, searchQuery, activeTab]);

  const handleOpenAdd = () => {
    const firstMed = products[0];
    setFormData({
      productId: firstMed?.id || '',
      batchNumber: `B${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      manufacturingDate: new Date().toISOString().slice(0, 10),
      expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
      mrp: firstMed?.mrp || firstMed?.sellingPrice || 100,
      purchasePrice: firstMed?.purchasePrice || 60,
      sellingPrice: firstMed?.sellingPrice || 90,
      quantity: 20,
      supplierId: suppliers[0]?.id || '',
      notes: '',
    });
    setIsAddModalOpen(true);
  };

  const handleProductSelect = (prodId: string) => {
    const p = products.find((x) => x.id === prodId);
    if (!p) return;
    setFormData((prev) => ({
      ...prev,
      productId: prodId,
      mrp: p.mrp || p.sellingPrice || 100,
      purchasePrice: p.purchasePrice || 60,
      sellingPrice: p.sellingPrice || 90,
    }));
  };

  const handleSaveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId || !formData.batchNumber || !formData.expiryDate) return;
    try {
      await batchApi.create(formData);
      showToast(`Batch ${formData.batchNumber} recorded successfully.`);
      setIsAddModalOpen(false);
      loadBatches();
    } catch (err: any) {
      alert(err.message || 'Failed to save batch');
    }
  };

  const handleOpenDispose = (b: ProductBatch) => {
    setSelectedBatch(b);
    setDisposeQty(Math.min(1, b.currentStock));
    setDisposeReason('Expired medicine disposal');
    setIsDisposeModalOpen(true);
  };

  const handleConfirmDispose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;
    try {
      await batchApi.dispose(selectedBatch.id, {
        quantity: disposeQty,
        reason: disposeReason,
      });
      showToast(`Disposed ${disposeQty} units from lot ${selectedBatch.batchNumber}.`);
      setIsDisposeModalOpen(false);
      loadBatches();
    } catch (err: any) {
      alert(err.message || 'Failed to record disposal');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 pb-10">
      {/* Toast Notice */}
      {actionNotice && (
        <div className="fixed top-5 right-5 z-50 bg-[#1C1B18] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-medium animate-in slide-in-from-top-2">
          <CheckCircle2 size={16} className="text-[#7FAE82]" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7FAE82] bg-[#E6F1E6] px-2.5 py-0.5 rounded-full">
              Pharmacy Industry
            </span>
            <span className="text-xs text-[#9A948A]">Lot-wise Stock Ledger</span>
          </div>
          <h1 className="text-[28px] font-semibold text-[#1C1B18] tracking-tight leading-tight mt-1">
            Batch Management
          </h1>
          <p className="text-[13px] text-[#6B665E] mt-0.5">
            Monitor drug manufacturing lots, shelf-life expiry dates, MRP compliance, and lot-wise stock.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/expiry')}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#FAF6EF] text-[#1C1B18] border border-[#EEE6DA] text-xs font-semibold transition-all cursor-pointer shadow-2xs"
          >
            <Clock size={15} className="text-[#E8772E]" />
            <span>Expiry Radar</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#7FAE82] hover:bg-[#6C9C70] text-white text-xs font-semibold transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>New Batch Lot</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={<Layers size={18} strokeWidth={2} />}
          iconBgColor="bg-[#E6F1E6] text-[#2E8B57]"
          label="Total Tracked Lots"
          value={totalLots}
          trend="Master catalog"
          isPositive={true}
        />
        <StatCard
          icon={<CheckCircle2 size={18} strokeWidth={2} />}
          iconBgColor="bg-[#EBF2FA] text-[#2563EB]"
          label="Active In-Stock Lots"
          value={activeLots}
          trend="Healthy shelf-life"
          isPositive={true}
        />
        <StatCard
          icon={<Clock size={18} strokeWidth={2} />}
          iconBgColor="bg-[#FFF4DC] text-[#D98E0B]"
          label="Expiring Soon (≤60 Days)"
          value={expiringSoon}
          trend="Prioritize FEFO sales"
          isPositive={false}
          onClick={() => setActiveTab('expiring')}
        />
        <StatCard
          icon={<AlertTriangle size={18} strokeWidth={2} />}
          iconBgColor="bg-[#FDECEC] text-[#D64545]"
          label="Expired Lots"
          value={expiredLots}
          trend="Requires disposal"
          isPositive={false}
          onClick={() => setActiveTab('expired')}
        />
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-2xl border border-[#EEE6DA] p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All Lots', count: batches.length },
              { id: 'active', label: 'Active', count: activeLots },
              { id: 'expiring', label: 'Expiring Soon', count: expiringSoon },
              { id: 'expired', label: 'Expired', count: expiredLots },
              { id: 'depleted', label: 'Depleted', count: batches.filter((b) => b.currentStock <= 0).length },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-[#1C1B18] text-white shadow-xs'
                    : 'bg-[#FAF6EF] text-[#6B665E] hover:bg-[#F4EDE2] hover:text-[#1C1B18]'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-[#EEE6DA] text-[#6B665E]'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative min-w-[240px] sm:max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A948A]" />
            <input
              type="text"
              placeholder="Search batch #, medicine, molecule..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#EEE6DA] bg-[#FAF6EF]/50 text-xs text-[#1C1B18] placeholder-[#9A948A] outline-none focus:border-[#7FAE82] focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Batches Table */}
        <div className="overflow-x-auto rounded-xl border border-[#EEE6DA]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF6EF]/60 text-[#6B665E] border-b border-[#EEE6DA]">
                <th className="py-3 px-3 font-semibold">Batch / Lot #</th>
                <th className="py-3 px-3 font-semibold">Medicine & Generic Molecule</th>
                <th className="py-3 px-3 font-semibold text-right">In Stock</th>
                <th className="py-3 px-3 font-semibold">Expiry Date & Shelf-Life</th>
                <th className="py-3 px-3 font-semibold">Mfg Date</th>
                <th className="py-3 px-3 font-semibold text-right">MRP / Selling</th>
                <th className="py-3 px-3 font-semibold">Supplier / Source</th>
                <th className="py-3 px-3 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEE6DA]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#9A948A]">
                    Loading medicine batches…
                  </td>
                </tr>
              ) : filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#9A948A]">
                    No batches match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredBatches.map((b) => {
                  const isExp = b.daysUntilExpiry < 0;
                  const isCrit = b.daysUntilExpiry >= 0 && b.daysUntilExpiry <= 30;
                  const isSoon = b.daysUntilExpiry > 30 && b.daysUntilExpiry <= 60;

                  return (
                    <tr key={b.id} className="hover:bg-[#FAF6EF]/40 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-[#1C1B18]">
                        {b.batchNumber}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-[#1C1B18]">{b.productName}</div>
                        {b.genericName ? (
                          <div className="text-[11px] text-[#7FAE82] font-medium">{b.genericName}</div>
                        ) : (
                          <div className="text-[10px] text-[#9A948A]">{b.productSku}</div>
                        )}
                        {b.manufacturer && (
                          <div className="text-[10px] text-[#9A948A]">Mfr: {b.manufacturer}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className={`font-bold ${b.currentStock <= 5 ? 'text-[#D64545]' : 'text-[#1C1B18]'}`}>
                          {b.currentStock}
                        </span>{' '}
                        <span className="text-[11px] text-[#9A948A]">{b.unit || 'strip'}</span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-[#1C1B18]">
                          {new Date(b.expiryDate).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                        {isExp ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#D64545] bg-[#FDECEC] px-2 py-0.5 rounded-full mt-0.5">
                            <AlertTriangle size={10} /> Expired {Math.abs(b.daysUntilExpiry)}d ago
                          </span>
                        ) : isCrit ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#D98E0B] bg-[#FFF4DC] px-2 py-0.5 rounded-full mt-0.5">
                            <Clock size={10} /> {b.daysUntilExpiry} days left (Critical)
                          </span>
                        ) : isSoon ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#D98E0B] bg-[#FFF4DC] px-2 py-0.5 rounded-full mt-0.5">
                            <Clock size={10} /> {b.daysUntilExpiry} days left
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#2E8B57] bg-[#E6F1E6] px-2 py-0.5 rounded-full mt-0.5">
                            <CheckCircle2 size={10} /> Valid ({b.daysUntilExpiry}d)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-[#6B665E]">
                        {b.manufacturingDate
                          ? new Date(b.manufacturingDate).toLocaleDateString('en-IN', {
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="font-bold text-[#1C1B18]">{formatINR(b.mrp)}</div>
                        <div className="text-[10px] text-[#6B665E]">Sell: {formatINR(b.sellingPrice)}</div>
                      </td>
                      <td className="py-3 px-3 text-[#6B665E]">
                        {b.supplierName || 'Primary Distributor'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {b.currentStock > 0 && (
                          <button
                            type="button"
                            onClick={() => handleOpenDispose(b)}
                            title="Disposal / Write-off"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#EEE6DA] hover:bg-[#FDECEC] hover:border-[#F4C5C5] text-[#D64545] text-[11px] font-semibold transition-all cursor-pointer"
                          >
                            <Trash2 size={12} />
                            <span>Dispose</span>
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

      {/* Add New Batch Lot Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#EEE6DA] shadow-xl w-full max-w-lg p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#EEE6DA] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#1C1B18]">New Medicine Batch Inward</h3>
                <p className="text-xs text-[#6B665E]">Record manufacturing lot, expiry, and initial inward units.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-[#6B665E] hover:bg-[#FAF6EF]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveBatch} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                  Medicine Catalog SKU *
                </label>
                <select
                  value={formData.productId}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none focus:border-[#7FAE82]"
                  required
                >
                  <option value="">Select a medicine...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) {p.genericName ? `• ${p.genericName}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                    Batch / Lot Number *
                  </label>
                  <input
                    type="text"
                    value={formData.batchNumber}
                    onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                    placeholder="e.g. AUG-24B01"
                    className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] font-mono text-xs outline-none focus:border-[#7FAE82]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                    Initial Units Inward
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none focus:border-[#7FAE82]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                    Manufacturing Date
                  </label>
                  <input
                    type="date"
                    value={formData.manufacturingDate}
                    onChange={(e) => setFormData({ ...formData, manufacturingDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none focus:border-[#7FAE82]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none focus:border-[#7FAE82]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                    MRP (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.mrp}
                    onChange={(e) => setFormData({ ...formData, mrp: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none focus:border-[#7FAE82]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                    Selling Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none focus:border-[#7FAE82]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                    Purchase Rate (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none focus:border-[#7FAE82]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#EEE6DA]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#EEE6DA] text-xs font-semibold text-[#6B665E] hover:bg-[#FAF6EF]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#7FAE82] hover:bg-[#6C9C70] text-white text-xs font-semibold shadow-xs"
                >
                  Record Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Disposal Modal */}
      {isDisposeModalOpen && selectedBatch && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#EEE6DA] shadow-xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#EEE6DA] pb-3">
              <div className="flex items-center gap-2 text-[#D64545]">
                <Trash2 size={18} />
                <h3 className="text-base font-bold text-[#1C1B18]">Write-off / Dispose Lot</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDisposeModalOpen(false)}
                className="p-1.5 rounded-lg text-[#6B665E] hover:bg-[#FAF6EF]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmDispose} className="space-y-3.5">
              <div className="bg-[#FAF6EF] p-3 rounded-2xl border border-[#EEE6DA] space-y-1 text-xs">
                <div>
                  <span className="text-[#6B665E]">Medicine:</span>{' '}
                  <span className="font-semibold text-[#1C1B18]">{selectedBatch.productName}</span>
                </div>
                <div>
                  <span className="text-[#6B665E]">Lot Number:</span>{' '}
                  <span className="font-mono font-bold text-[#1C1B18]">{selectedBatch.batchNumber}</span>
                </div>
                <div>
                  <span className="text-[#6B665E]">Available Stock:</span>{' '}
                  <span className="font-bold text-[#D64545]">{selectedBatch.currentStock} units</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                  Quantity to Dispose
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedBatch.currentStock}
                  value={disposeQty}
                  onChange={(e) => setDisposeQty(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none focus:border-[#D64545]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                  Disposal Reason
                </label>
                <select
                  value={disposeReason}
                  onChange={(e) => setDisposeReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none focus:border-[#7FAE82]"
                >
                  <option value="Expired medicine disposal">Expired medicine disposal</option>
                  <option value="Damaged packaging / seal broken">Damaged packaging / seal broken</option>
                  <option value="Batch recall by manufacturer">Batch recall by manufacturer</option>
                  <option value="Storage temperature excursion">Storage temperature excursion</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#EEE6DA]">
                <button
                  type="button"
                  onClick={() => setIsDisposeModalOpen(false)}
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

export default BatchManagementPage;
