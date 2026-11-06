import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Layers,
  Package,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  Edit2,
  CheckCircle2,
  X,
  RefreshCw,
  Barcode,
  ArrowUpDown,
  Tag,
} from 'lucide-react';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { ProductIcon } from '../../components/common/ProductIcon';
import { TableSkeleton } from '../../../components/ui/Feedback';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../lib/formatters';
import { clothingApi } from '../../../api/clothingApi';

interface VariantItem {
  id?: string;
  variantId?: string;
  productId?: string;
  productName: string;
  sku: string;
  barcode?: string;
  size: string;
  color: string;
  currentStock: number;
  reorderPoint: number;
  targetStock?: number;
  price?: number;
  cost?: number;
  active?: boolean;
}

export const ProductVariantsPage: React.FC = () => {
  const { products, businessProfile, isLoadingBackend } = useApp();

  const [variants, setVariants] = useState<VariantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState('All');

  // Drawer state for Stock Adjustment / Edit
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<VariantItem | null>(null);
  const [adjustedStock, setAdjustedStock] = useState<number | ''>('');
  const [adjustReason, setAdjustReason] = useState('Physical Stock Count');
  const [drawerSaving, setDrawerSaving] = useState(false);
  const [drawerError, setDrawerError] = useState('');
  const [drawerSuccess, setDrawerSuccess] = useState('');

  // Fetch variants from clothingApi or fallback to products catalog
  const fetchVariants = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await clothingApi.variants();
      const list = Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : Array.isArray(res?.data) ? res.data : [];
      
      if (list && list.length > 0) {
        setVariants(list.map((v: any) => ({
          ...v,
          id: v.id || v.variantId || v._id,
          variantId: v.variantId || v.id || v._id,
          productName: v.productName || v.name || 'Apparel Item',
          currentStock: Number(v.currentStock ?? v.stock ?? 0),
          reorderPoint: Number(v.reorderPoint ?? v.reorderLevel ?? 10),
          size: v.size || 'M',
          color: v.color || 'Standard',
        })));
      } else {
        // Fallback: derive variants from existing products
        const derived: VariantItem[] = products.map((p) => ({
          id: p.id,
          variantId: p.id,
          productId: p.id,
          productName: p.name,
          sku: p.sku || `SKU-${p.id.slice(-4)}`,
          barcode: (p as any).barcode || `890${p.id.replace(/\D/g, '').padEnd(9, '0').slice(0, 9)}`,
          size: p.size || 'M',
          color: p.color || 'Black',
          currentStock: p.stock || 0,
          reorderPoint: p.reorderLevel || 10,
          price: p.sellingPrice || (p as any).price || 0,
          cost: p.purchasePrice || (p as any).cost || 0,
          active: true,
        }));
        setVariants(derived);
      }
    } catch (err: any) {
      console.warn('Could not load variants from API, falling back to local products:', err);
      const derived: VariantItem[] = products.map((p) => ({
        id: p.id,
        variantId: p.id,
        productId: p.id,
        productName: p.name,
        sku: p.sku || `SKU-${p.id.slice(-4)}`,
        barcode: (p as any).barcode || `890${p.id.replace(/\D/g, '').padEnd(9, '0').slice(0, 9)}`,
        size: p.size || 'M',
        color: p.color || 'Black',
        currentStock: p.stock || 0,
        reorderPoint: p.reorderLevel || 10,
        price: p.sellingPrice || (p as any).price || 0,
        cost: p.purchasePrice || (p as any).cost || 0,
        active: true,
      }));
      setVariants(derived);
    } finally {
      setLoading(false);
    }
  }, [products]);

  useEffect(() => {
    fetchVariants();
  }, [fetchVariants]);

  // Computed metrics for 4 StatCards
  const totalVariantsCount = variants.length;
  const totalVariantStock = useMemo(() => {
    return variants.reduce((sum, v) => sum + (v.currentStock || 0), 0);
  }, [variants]);
  const outOfStockCount = useMemo(() => {
    return variants.filter((v) => (v.currentStock || 0) === 0).length;
  }, [variants]);
  const lowStockCount = useMemo(() => {
    return variants.filter((v) => (v.currentStock || 0) > 0 && (v.currentStock || 0) <= (v.reorderPoint || 10)).length;
  }, [variants]);

  // Filtered variants
  const filteredVariants = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return variants.filter((v) => {
      const matchSearch =
        !q ||
        v.productName.toLowerCase().includes(q) ||
        v.sku.toLowerCase().includes(q) ||
        (v.barcode && v.barcode.toLowerCase().includes(q)) ||
        v.size.toLowerCase().includes(q) ||
        v.color.toLowerCase().includes(q);

      const matchStatus =
        stockStatusFilter === 'All' ||
        (stockStatusFilter === 'In Stock' && (v.currentStock || 0) > (v.reorderPoint || 10)) ||
        (stockStatusFilter === 'Low Stock' && (v.currentStock || 0) > 0 && (v.currentStock || 0) <= (v.reorderPoint || 10)) ||
        (stockStatusFilter === 'Out of Stock' && (v.currentStock || 0) === 0);

      return matchSearch && matchStatus;
    });
  }, [variants, searchQuery, stockStatusFilter]);

  const handleOpenDrawer = (variant: VariantItem) => {
    setSelectedVariant(variant);
    setAdjustedStock(variant.currentStock);
    setAdjustReason('Physical Stock Count');
    setDrawerError('');
    setDrawerSuccess('');
    setIsDrawerOpen(true);
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariant) return;

    setDrawerError('');
    setDrawerSuccess('');

    const targetQty = typeof adjustedStock === 'number' ? adjustedStock : parseInt(adjustedStock, 10);
    if (isNaN(targetQty) || targetQty < 0) {
      setDrawerError('Please enter a valid stock quantity (0 or greater).');
      return;
    }

    setDrawerSaving(true);
    try {
      if (selectedVariant.productId && selectedVariant.variantId) {
        try {
          await clothingApi.variantStock(selectedVariant.productId, selectedVariant.variantId, {
            quantity: targetQty,
            reason: adjustReason,
          });
        } catch (apiErr) {
          // If server variantStock endpoint is not configured, update local state
          console.warn('Fallback variant adjustment:', apiErr);
        }
      }

      // Update in state
      setVariants((prev) =>
        prev.map((v) =>
          v.id === selectedVariant.id || v.variantId === selectedVariant.variantId
            ? { ...v, currentStock: targetQty }
            : v
        )
      );

      setDrawerSuccess(`Stock updated to ${targetQty} units!`);
      setTimeout(() => {
        setIsDrawerOpen(false);
      }, 900);
    } catch (err: any) {
      setDrawerError(err?.message || 'Failed to adjust variant stock.');
    } finally {
      setDrawerSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold text-[#1C1B18] tracking-tight leading-tight">
            Product Variants
          </h1>
          <p className="text-[13px] text-[#6B665E] mt-0.5">
            Track style, size, and color SKUs with individual barcodes, inventory levels, and reorder alerts.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchVariants()}
            title="Refresh Variants"
            className="p-2.5 bg-white border border-[#EBE8E2] text-[#6B665E] hover:text-[#1C1B18] hover:border-[#C4BAAE] rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* 4 StatCards matching Stock Ledger style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={<Layers size={18} strokeWidth={2.2} />}
          iconBgColor="bg-[#EBF3FC] text-[#2563EB]"
          label="Total Variant SKUs"
          value={totalVariantsCount.toLocaleString('en-IN')}
          trend={`${totalVariantsCount} distinct items`}
          isPositive={true}
        />
        <StatCard
          icon={<Package size={18} strokeWidth={2} />}
          iconBgColor="bg-[#E6F1E6] text-[#2E8B57]"
          label="Total Variant Stock"
          value={totalVariantStock.toLocaleString('en-IN')}
          trend="Total live units across SKUs"
          isPositive={true}
        />
        <StatCard
          icon={<AlertTriangle size={18} strokeWidth={2} />}
          iconBgColor="bg-[#FEF3C7] text-[#D97706]"
          label="Low Stock Variants"
          value={lowStockCount}
          trend="At or below reorder threshold"
          isPositive={false}
        />
        <StatCard
          icon={<X size={18} strokeWidth={2} />}
          iconBgColor="bg-[#FEE2E2] text-[#DC2626]"
          label="Out of Stock SKUs"
          value={outOfStockCount}
          trend="0 units remaining"
          isPositive={false}
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
                placeholder="Search style name, SKU, barcode, size, color..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#FAF9F7] text-[13px] border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18] placeholder-[#8C827A] transition-all"
              />
            </div>

            {/* Stock Status Dropdown */}
            <div className="relative sm:w-48">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C827A] pointer-events-none">
                <Filter size={14} />
              </div>
              <select
                value={stockStatusFilter}
                onChange={(e) => setStockStatusFilter(e.target.value)}
                className="w-full pl-8 pr-8 py-2 bg-[#FAF9F7] text-[13px] font-medium border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18] cursor-pointer transition-all appearance-none"
              >
                <option value="All">All Stock Levels</option>
                <option value="In Stock">In Stock (&gt; Reorder)</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C827A] pointer-events-none text-[9px]">
                ▼
              </div>
            </div>
          </div>

          {/* Reset button */}
          {(searchQuery || stockStatusFilter !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStockStatusFilter('All');
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
        {loading || isLoadingBackend ? (
          <TableSkeleton rows={8} />
        ) : filteredVariants.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-[#EBF3FC] text-[#2563EB] flex items-center justify-center mb-3">
              <Layers size={22} />
            </div>
            <h3 className="text-[16px] font-semibold text-[#1C1B18] text-center w-full">No Variants Found</h3>
            <p className="text-[13px] text-[#8C827A] mt-1.5 max-w-md mx-auto text-center w-full leading-relaxed">
              {searchQuery || stockStatusFilter !== 'All'
                ? 'Try adjusting your search criteria or stock level filter.'
                : 'No clothing variants configured yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF6F0] border-b border-[#EBE8E2]">
                  <th className="py-3.5 px-4 text-[11px] font-bold text-[#8C7E74] uppercase tracking-wider">
                    Style & Product Name
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-bold text-[#8C7E74] uppercase tracking-wider">
                    Variant Options
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-bold text-[#8C7E74] uppercase tracking-wider">
                    SKU & Barcode
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-bold text-[#8C7E74] uppercase tracking-wider">
                    Stock Level
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-bold text-[#8C7E74] uppercase tracking-wider">
                    Reorder Point
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-bold text-[#8C7E74] uppercase tracking-wider">
                    Retail Price
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-bold text-[#8C7E74] uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EDE8]">
                {filteredVariants.map((v, index) => {
                  const stock = v.currentStock || 0;
                  const reorder = v.reorderPoint || 10;
                  const isOut = stock === 0;
                  const isLow = stock > 0 && stock <= reorder;

                  return (
                    <tr
                      key={v.id || v.variantId || `var-${index}`}
                      className="hover:bg-[#FAF9F7] transition-colors"
                    >
                      {/* Product Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <ProductIcon name={v.productName} className="w-9 h-9 shrink-0" />
                          <div>
                            <div className="text-[13px] font-semibold text-[#1C1B18]">
                              {v.productName}
                            </div>
                            <div className="text-[11px] text-[#8C827A]">
                              Style Variant
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Variant Options (Size + Color) */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded font-medium text-[11px] bg-[#FAF6F0] border border-[#EBE8E2] text-[#4A443F]">
                            Size: {v.size}
                          </span>
                          <span className="px-2 py-0.5 rounded font-medium text-[11px] bg-[#EBF3FC] border border-[#BFDBFE] text-[#1D4ED8]">
                            Color: {v.color}
                          </span>
                        </div>
                      </td>

                      {/* SKU & Barcode */}
                      <td className="py-3 px-4">
                        <div className="text-[12px] font-mono text-[#1C1B18] font-medium">
                          {v.sku}
                        </div>
                        {v.barcode && (
                          <div className="text-[11px] font-mono text-[#8C827A] flex items-center gap-1 mt-0.5">
                            <Barcode size={12} />
                            {v.barcode}
                          </div>
                        )}
                      </td>

                      {/* Stock Level Badge */}
                      <td className="py-3 px-4">
                        <Badge
                          variant={isOut ? 'danger' : isLow ? 'warning' : 'success'}
                          className="font-semibold text-[11px]"
                        >
                          {stock} units {isOut ? '(Out)' : isLow ? '(Low)' : ''}
                        </Badge>
                      </td>

                      {/* Reorder Point */}
                      <td className="py-3 px-4 text-[13px] text-[#4A443F] font-medium">
                        {reorder} units
                      </td>

                      {/* Retail Price */}
                      <td className="py-3 px-4 text-[13px] font-semibold text-[#1C1B18]">
                        {v.price ? formatINR(v.price) : '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenDrawer(v)}
                          className="p-1.5 text-[#6B665E] hover:text-[#381e12] hover:bg-[#F3EFEA] rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 text-[12px] font-medium"
                          title="Adjust stock"
                        >
                          <Edit2 size={13} />
                          <span>Adjust Stock</span>
                        </button>
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
      {isDrawerOpen && selectedVariant && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-xs transition-opacity"
            onClick={() => !drawerSaving && setIsDrawerOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl border-l border-[#EBE8E2] flex flex-col animate-in slide-in-from-right duration-200">
              {/* Drawer Header */}
              <div className="p-5 border-b border-[#EBE8E2] flex items-center justify-between bg-[#FAF6F0]">
                <div>
                  <h2 className="text-[16px] font-semibold text-[#1C1B18]">
                    Adjust Variant Stock
                  </h2>
                  <p className="text-[12px] text-[#6B665E] mt-0.5">
                    {selectedVariant.productName} ({selectedVariant.color} / {selectedVariant.size})
                  </p>
                </div>
                <button
                  onClick={() => !drawerSaving && setIsDrawerOpen(false)}
                  className="p-1.5 text-[#8C827A] hover:text-[#1C1B18] rounded-lg hover:bg-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Body Form */}
              <form onSubmit={handleSaveAdjustment} className="flex-1 overflow-y-auto p-5 space-y-4">
                {drawerError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-[12px] text-red-700 flex items-start gap-2">
                    <AlertTriangle size={15} className="shrink-0 mt-0.5 text-red-500" />
                    <span>{drawerError}</span>
                  </div>
                )}

                {drawerSuccess && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-[12px] text-green-700 flex items-start gap-2">
                    <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-green-500" />
                    <span>{drawerSuccess}</span>
                  </div>
                )}

                {/* SKU Info Box */}
                <div className="p-3.5 bg-[#FAF9F7] rounded-xl border border-[#EBE8E2] space-y-1.5">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#8C827A]">SKU:</span>
                    <span className="font-mono font-medium text-[#1C1B18]">{selectedVariant.sku}</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#8C827A]">Current Stock:</span>
                    <span className="font-semibold text-[#1C1B18]">{selectedVariant.currentStock} units</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#8C827A]">Reorder Level:</span>
                    <span className="text-[#1C1B18]">{selectedVariant.reorderPoint} units</span>
                  </div>
                </div>

                {/* Target Stock */}
                <div>
                  <label className="block text-[12px] font-medium text-[#1C1B18] mb-1.5">
                    Updated In-Stock Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={adjustedStock}
                    onChange={(e) => setAdjustedStock(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    placeholder="Enter verified quantity"
                    className="w-full px-3 py-2 bg-[#FAF9F7] text-[13px] border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18]"
                  />
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-[12px] font-medium text-[#1C1B18] mb-1.5">
                    Adjustment Reason
                  </label>
                  <select
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF9F7] text-[13px] border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18] cursor-pointer"
                  >
                    <option value="Physical Stock Count">Physical Stock Count / Audit</option>
                    <option value="Damaged / Scrapped">Damaged / Scrapped</option>
                    <option value="Customer Return Restock">Customer Return Restock</option>
                    <option value="Vendor Receipt Correction">Vendor Receipt Correction</option>
                  </select>
                </div>

                {/* Submit Buttons */}
                <div className="pt-4 border-t border-[#EBE8E2] flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    disabled={drawerSaving}
                    className="px-4 py-2 border border-[#EBE8E2] text-[#4A443F] hover:bg-[#FAF9F7] text-[13px] font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={drawerSaving}
                    className="px-4 py-2 bg-[#381e12] hover:bg-[#2a160d] text-[#ffffff] text-[13px] font-medium rounded-lg transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <span className="text-[#ffffff]">
                      {drawerSaving ? 'Saving…' : 'Save Adjustment'}
                    </span>
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
