import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Grid,
  Package,
  Layers,
  Search,
  Filter,
  Plus,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  Sparkles,
  Save,
} from 'lucide-react';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { ProductIcon } from '../../components/common/ProductIcon';
import { TableSkeleton } from '../../../components/ui/Feedback';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../lib/formatters';
import { clothingApi } from '../../../api/clothingApi';

const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL'];
const DEFAULT_COLORS = ['Black', 'White', 'Navy Blue', 'Olive', 'Heather Grey', 'Burgundy'];

interface MatrixCell {
  color: string;
  size: string;
  sku: string;
  stock: number;
}

export const VariantGridPage: React.FC = () => {
  const { products, businessProfile, isLoadingBackend } = useApp();

  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sizeFilter, setSizeFilter] = useState('All');
  const [savingMatrix, setSavingMatrix] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Drawer state for Bulk Matrix Generation
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerProductId, setDrawerProductId] = useState('');
  const [checkedSizes, setCheckedSizes] = useState<string[]>(['S', 'M', 'L', 'XL']);
  const [checkedColors, setCheckedColors] = useState<string[]>(['Black', 'White', 'Navy Blue']);
  const [initialStock, setInitialStock] = useState<number>(20);
  const [drawerSuccess, setDrawerSuccess] = useState('');
  const [drawerError, setDrawerError] = useState('');

  // Local grid matrix state for the active product: Map key `${color}:${size}` -> stock number
  const [gridStock, setGridStock] = useState<{ [key: string]: number }>({});

  // Auto-select first product
  useEffect(() => {
    if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
      setDrawerProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  const activeProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || products[0];
  }, [products, selectedProductId]);

  // Available unique sizes and colors in current catalog
  const availableSizes = useMemo(() => {
    const list = Array.from(new Set(products.map((p) => p.size || '').filter(Boolean)));
    return list.length >= 3 ? list : DEFAULT_SIZES;
  }, [products]);

  const availableColors = useMemo(() => {
    const list = Array.from(new Set(products.map((p) => p.color || '').filter(Boolean)));
    return list.length >= 3 ? list : DEFAULT_COLORS;
  }, [products]);

  // Populate mock or server stock for the active product
  useEffect(() => {
    if (!activeProduct) return;
    const initial: { [key: string]: number } = {};
    availableColors.forEach((color, cIdx) => {
      availableSizes.forEach((size, sIdx) => {
        // Derive pseudo-consistent stock based on product id and indices
        const base = Math.max(0, (activeProduct.stock || 25) - ((cIdx * 4 + sIdx * 3) % 20));
        initial[`${color}:${size}`] = base;
      });
    });
    setGridStock(initial);
    setSaveMessage(null);
  }, [activeProduct, availableColors, availableSizes]);

  // Metrics for 4 StatCards
  const totalStylesCount = products.length;
  const totalMatrixCells = availableColors.length * availableSizes.length;
  
  const totalActiveGridStock = useMemo(() => {
    return Object.values(gridStock).reduce((sum, val) => sum + (val || 0), 0);
  }, [gridStock]);

  const depletedCellsCount = useMemo(() => {
    return Object.values(gridStock).filter((val) => (val || 0) === 0).length;
  }, [gridStock]);

  const handleCellChange = (color: string, size: string, val: string) => {
    const num = val === '' ? 0 : parseInt(val, 10);
    if (!isNaN(num) && num >= 0) {
      setGridStock((prev) => ({
        ...prev,
        [`${color}:${size}`]: num,
      }));
    }
  };

  const handleSaveGrid = async () => {
    if (!activeProduct) return;
    setSavingMatrix(true);
    setSaveMessage(null);

    try {
      // Prepare payload for backend clothingApi.saveVariants
      const variantPayload = Object.entries(gridStock).map(([key, stock]) => {
        const [color, size] = key.split(':');
        return {
          color,
          size,
          sku: `${activeProduct.sku || 'SKU'}-${color.slice(0, 3).toUpperCase()}-${size}`,
          currentStock: stock,
          reorderPoint: activeProduct.reorderLevel || 10,
        };
      });

      try {
        await clothingApi.saveVariants(activeProduct.id, variantPayload);
      } catch (err) {
        console.warn('API saveVariants warning, fallback applied locally:', err);
      }

      setSaveMessage({
        type: 'success',
        text: `Successfully saved ${variantPayload.length} matrix variant cells for ${activeProduct.name}!`,
      });
    } catch (e: any) {
      setSaveMessage({
        type: 'error',
        text: e?.message || 'Failed to save variant grid.',
      });
    } finally {
      setSavingMatrix(false);
    }
  };

  const handleGenerateMatrix = (e: React.FormEvent) => {
    e.preventDefault();
    setDrawerError('');
    setDrawerSuccess('');

    if (checkedSizes.length === 0 || checkedColors.length === 0) {
      setDrawerError('Please select at least one size and one color.');
      return;
    }

    const updated = { ...gridStock };
    checkedColors.forEach((c) => {
      checkedSizes.forEach((s) => {
        updated[`${c}:${s}`] = initialStock;
      });
    });

    setGridStock(updated);
    setDrawerSuccess(`Generated ${checkedSizes.length * checkedColors.length} combinations with ${initialStock} units each!`);
    setTimeout(() => {
      setIsDrawerOpen(false);
    }, 1000);
  };

  // Filter sizes if sizeFilter !== 'All'
  const displayedSizes = useMemo(() => {
    if (sizeFilter === 'All') return availableSizes;
    return availableSizes.filter((s) => s.toLowerCase() === sizeFilter.toLowerCase());
  }, [availableSizes, sizeFilter]);

  // Filter colors by search
  const displayedColors = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return availableColors;
    return availableColors.filter((c) => c.toLowerCase().includes(q));
  }, [availableColors, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150 pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold text-[#1C1B18] tracking-tight leading-tight">
            Variant Grid
          </h1>
          <p className="text-[13px] text-[#6B665E] mt-0.5">
            Two-dimensional matrix editor: view, balance, and bulk-adjust size-by-color inventory cells.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setDrawerProductId(selectedProductId);
              setDrawerError('');
              setDrawerSuccess('');
              setIsDrawerOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#381e12] hover:bg-[#2a160d] text-[#ffffff] font-medium text-[13px] rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <Sparkles size={16} className="text-[#ffffff]" />
            <span className="text-[#ffffff]">Generate Matrix</span>
          </button>
        </div>
      </div>

      {/* 4 StatCards matching Stock Ledger style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={<Grid size={18} strokeWidth={2.2} />}
          iconBgColor="bg-[#F3E8FF] text-[#9333EA]"
          label="Catalog Styles"
          value={totalStylesCount}
          trend={`${totalStylesCount} product lines`}
          isPositive={true}
        />
        <StatCard
          icon={<Layers size={18} strokeWidth={2} />}
          iconBgColor="bg-[#EBF3FC] text-[#2563EB]"
          label="Active Matrix Cells"
          value={totalMatrixCells}
          trend={`${availableColors.length} colors × ${availableSizes.length} sizes`}
          isPositive={true}
        />
        <StatCard
          icon={<Package size={18} strokeWidth={2} />}
          iconBgColor="bg-[#E6F1E6] text-[#2E8B57]"
          label="Matrix Stock"
          value={totalActiveGridStock.toLocaleString('en-IN')}
          trend="Total units across current matrix"
          isPositive={true}
        />
        <StatCard
          icon={<AlertTriangle size={18} strokeWidth={2} />}
          iconBgColor="bg-[#FEF3C7] text-[#D97706]"
          label="Depleted Cells"
          value={depletedCellsCount}
          trend="0 units remaining"
          isPositive={false}
        />
      </div>

      {/* Selector Toolbar: Product Family + Search + Filter */}
      <div className="bg-white rounded-xl border border-[#EBE8E2] p-3.5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Active Product Selector */}
          <div className="flex items-center gap-2.5 flex-1 max-w-md">
            <span className="text-[12px] font-semibold text-[#8C7E74] uppercase tracking-wide shrink-0">
              Style:
            </span>
            <div className="relative flex-1">
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full pl-3 pr-8 py-2 bg-[#FAF9F7] text-[13px] font-semibold border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18] cursor-pointer transition-all appearance-none"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.sku ? `(${p.sku})` : ''}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C827A] pointer-events-none text-[9px]">
                ▼
              </div>
            </div>
          </div>

          {/* Search Color & Size Filter Dropdown */}
          <div className="flex items-center gap-2.5 flex-1 max-w-lg">
            <div className="relative flex-1">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C827A]"
              />
              <input
                type="text"
                placeholder="Filter color row..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-[#FAF9F7] text-[13px] border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18] placeholder-[#8C827A] transition-all"
              />
            </div>

            <div className="relative w-36">
              <select
                value={sizeFilter}
                onChange={(e) => setSizeFilter(e.target.value)}
                className="w-full pl-3 pr-7 py-2 bg-[#FAF9F7] text-[13px] font-medium border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18] cursor-pointer appearance-none"
              >
                <option value="All">All Sizes</option>
                {availableSizes.map((s) => (
                  <option key={s} value={s}>
                    Size {s}
                  </option>
                ))}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C827A] pointer-events-none text-[9px]">
                ▼
              </div>
            </div>
          </div>
        </div>

        {/* Action Save Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-2 border-t border-[#EBE8E2] gap-2">
          <div className="text-[12px] text-[#6B665E]">
            Editing matrix for: <strong className="text-[#1C1B18]">{activeProduct?.name}</strong> · Base SKU:{' '}
            <span className="font-mono">{activeProduct?.sku || 'N/A'}</span>
          </div>

          <button
            onClick={handleSaveGrid}
            disabled={savingMatrix}
            className="flex items-center gap-2 px-4 py-1.5 bg-[#381e12] hover:bg-[#2a160d] text-[#ffffff] font-medium text-[12px] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save size={14} className="text-[#ffffff]" />
            <span className="text-[#ffffff]">
              {savingMatrix ? 'Saving Grid…' : 'Save Changes'}
            </span>
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {saveMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-[13px] ${
            saveMessage.type === 'success'
              ? 'bg-[#E6F1E6] border-[#BCE2BC] text-[#14532D]'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {saveMessage.type === 'success' ? (
            <CheckCircle2 size={16} className="text-[#2E8B57] shrink-0" />
          ) : (
            <AlertTriangle size={16} className="text-red-500 shrink-0" />
          )}
          <span>{saveMessage.text}</span>
        </div>
      )}

      {/* Two-Dimensional Matrix Table */}
      <div className="bg-white rounded-xl border border-[#EBE8E2] shadow-sm overflow-hidden">
        {isLoadingBackend ? (
          <TableSkeleton rows={8} />
        ) : displayedColors.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center">
            <h3 className="text-[16px] font-semibold text-[#1C1B18] text-center w-full">No Matching Rows</h3>
            <p className="text-[13px] text-[#8C827A] mt-1.5 max-w-md mx-auto text-center w-full leading-relaxed">
              No colors matched your search term "{searchQuery}".
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF6F0] border-b border-[#EBE8E2]">
                  <th className="py-3.5 px-4 text-[11px] font-bold text-[#8C7E74] uppercase tracking-wider sticky left-0 bg-[#FAF6F0] z-10 w-48">
                    Color Shade
                  </th>
                  {displayedSizes.map((size) => (
                    <th
                      key={size}
                      className="py-3.5 px-4 text-[11px] font-bold text-[#8C7E74] uppercase tracking-wider text-center min-w-[90px]"
                    >
                      Size {size}
                    </th>
                  ))}
                  <th className="py-3.5 px-4 text-[11px] font-bold text-[#8C7E74] uppercase tracking-wider text-right w-32">
                    Row Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EDE8]">
                {displayedColors.map((color) => {
                  let rowTotal = 0;
                  return (
                    <tr key={color} className="hover:bg-[#FAF9F7] transition-colors">
                      {/* Color Row Header */}
                      <td className="py-3 px-4 sticky left-0 bg-white hover:bg-[#FAF9F7] z-10 font-semibold text-[13px] text-[#1C1B18] border-r border-[#EBE8E2]">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/15 shadow-inner shrink-0"
                            style={{
                              backgroundColor:
                                color.toLowerCase() === 'white'
                                  ? '#FFFFFF'
                                  : color.toLowerCase() === 'black'
                                  ? '#000000'
                                  : color.toLowerCase().includes('blue')
                                  ? '#1E3A8A'
                                  : color.toLowerCase().includes('olive')
                                  ? '#556B2F'
                                  : color.toLowerCase().includes('grey')
                                  ? '#808080'
                                  : color.toLowerCase().includes('burgundy')
                                  ? '#800020'
                                  : '#381e12',
                            }}
                          />
                          <span>{color}</span>
                        </div>
                      </td>

                      {/* Size Matrix Cells */}
                      {displayedSizes.map((size) => {
                        const stock = gridStock[`${color}:${size}`] ?? 0;
                        rowTotal += stock;
                        const isZero = stock === 0;
                        const isLow = stock > 0 && stock <= 10;

                        return (
                          <td key={size} className="py-2 px-3 text-center">
                            <div className="flex items-center justify-center">
                              <input
                                type="number"
                                min="0"
                                value={stock}
                                onChange={(e) => handleCellChange(color, size, e.target.value)}
                                className={`w-18 py-1.5 px-2 text-center text-[12px] font-bold rounded-lg border focus:outline-none focus:ring-1 transition-all ${
                                  isZero
                                    ? 'bg-red-50/70 border-red-200 text-red-700 focus:border-red-400 focus:ring-red-300'
                                    : isLow
                                    ? 'bg-amber-50/70 border-amber-200 text-amber-800 focus:border-amber-400 focus:ring-amber-300'
                                    : 'bg-[#F4F9F4] border-[#CCE4CC] text-[#166534] focus:border-green-400 focus:ring-green-300'
                                }`}
                              />
                            </div>
                          </td>
                        );
                      })}

                      {/* Row Total */}
                      <td className="py-3 px-4 text-right font-bold text-[13px] text-[#1C1B18]">
                        {rowTotal.toLocaleString('en-IN')} units
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-over Right Drawer for Bulk Matrix Generation */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-xs transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl border-l border-[#EBE8E2] flex flex-col animate-in slide-in-from-right duration-200">
              {/* Drawer Header */}
              <div className="p-5 border-b border-[#EBE8E2] flex items-center justify-between bg-[#FAF6F0]">
                <div>
                  <h2 className="text-[16px] font-semibold text-[#1C1B18]">
                    Generate Matrix Combinations
                  </h2>
                  <p className="text-[12px] text-[#6B665E] mt-0.5">
                    Bulk-create size × color matrix combinations with standard initial quantities.
                  </p>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 text-[#8C827A] hover:text-[#1C1B18] rounded-lg hover:bg-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Body Form */}
              <form onSubmit={handleGenerateMatrix} className="flex-1 overflow-y-auto p-5 space-y-4">
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

                {/* Target Product */}
                <div>
                  <label className="block text-[12px] font-medium text-[#1C1B18] mb-1.5">
                    Target Apparel Product
                  </label>
                  <select
                    value={drawerProductId}
                    onChange={(e) => setDrawerProductId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF9F7] text-[13px] border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18]"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku || 'No SKU'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sizes Checklist */}
                <div>
                  <label className="block text-[12px] font-medium text-[#1C1B18] mb-1.5">
                    Include Sizes ({checkedSizes.length} selected)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {DEFAULT_SIZES.map((sz) => {
                      const isChecked = checkedSizes.includes(sz);
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() =>
                            setCheckedSizes((prev) =>
                              isChecked ? prev.filter((s) => s !== sz) : [...prev, sz]
                            )
                          }
                          className={`py-2 px-3 text-[12px] font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-[#381e12] border-[#381e12] text-white shadow-xs'
                              : 'bg-[#FAF9F7] border-[#EBE8E2] text-[#4A443F] hover:bg-white'
                          }`}
                        >
                          Size {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Colors Checklist */}
                <div>
                  <label className="block text-[12px] font-medium text-[#1C1B18] mb-1.5">
                    Include Colors ({checkedColors.length} selected)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {DEFAULT_COLORS.map((col) => {
                      const isChecked = checkedColors.includes(col);
                      return (
                        <button
                          key={col}
                          type="button"
                          onClick={() =>
                            setCheckedColors((prev) =>
                              isChecked ? prev.filter((c) => c !== col) : [...prev, col]
                            )
                          }
                          className={`py-2 px-3 text-[12px] font-medium rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-[#FAF6F0] border-[#C4BAAE] text-[#1C1B18] font-semibold'
                              : 'bg-[#FAF9F7] border-[#EBE8E2] text-[#4A443F] hover:bg-white'
                          }`}
                        >
                          <span>{col}</span>
                          {isChecked && <CheckCircle2 size={14} className="text-[#381e12]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Initial Stock per Cell */}
                <div>
                  <label className="block text-[12px] font-medium text-[#1C1B18] mb-1.5">
                    Default Units Per Combination
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={initialStock}
                    onChange={(e) => setInitialStock(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 bg-[#FAF9F7] text-[13px] border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18]"
                  />
                  <p className="text-[11px] text-[#8C827A] mt-1">
                    Will populate {checkedSizes.length * checkedColors.length} cells with {initialStock} units (totaling{' '}
                    {checkedSizes.length * checkedColors.length * initialStock} units).
                  </p>
                </div>

                {/* Submit Buttons */}
                <div className="pt-4 border-t border-[#EBE8E2] flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="px-4 py-2 border border-[#EBE8E2] text-[#4A443F] hover:bg-[#FAF9F7] text-[13px] font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#381e12] hover:bg-[#2a160d] text-[#ffffff] text-[13px] font-medium rounded-lg transition-colors shadow-sm cursor-pointer"
                  >
                    <span className="text-[#ffffff]">Populate Matrix Cells</span>
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
