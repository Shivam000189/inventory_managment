import React, { useState, useMemo } from 'react';
import {
  Ruler,
  Package,
  Layers,
  Search,
  Filter,
  Plus,
  AlertTriangle,
  X,
  CheckCircle2,
  Tag,
  ArrowUpDown,
  Edit2,
  Trash2,
} from 'lucide-react';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { ProductIcon } from '../../components/common/ProductIcon';
import { TableSkeleton } from '../../../components/ui/Feedback';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../lib/formatters';
import { Product } from '../../types';

export const SizeManagementPage: React.FC = () => {
  const { products, updateProduct, isLoadingBackend, businessProfile } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [sizeFilter, setSizeFilter] = useState('All');

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [sizeValue, setSizeValue] = useState('M');
  const [stockValue, setStockValue] = useState<number | ''>('');
  const [reorderValue, setReorderValue] = useState<number | ''>('');
  const [drawerError, setDrawerError] = useState('');
  const [drawerSuccess, setDrawerSuccess] = useState('');

  // Extract products relevant to sizing
  const sizedProducts = useMemo(() => {
    return products.map((p) => ({
      ...p,
      size: p.size || 'M',
    }));
  }, [products]);

  // Computed metrics for 4 StatCards
  const totalSizedItems = sizedProducts.length;

  const activeSizeTagsCount = useMemo(() => {
    const set = new Set(sizedProducts.map((p) => (p.size || '').trim()).filter(Boolean));
    return set.size;
  }, [sizedProducts]);

  const lowStockSizesCount = useMemo(() => {
    return sizedProducts.filter((p) => p.stock > 0 && p.stock <= p.reorderLevel).length;
  }, [sizedProducts]);

  const totalSizedUnits = useMemo(() => {
    return sizedProducts.reduce((sum, p) => sum + (p.stock || 0), 0);
  }, [sizedProducts]);

  // Filtered list
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return sizedProducts.filter((p) => {
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.size && p.size.toLowerCase().includes(q));

      const matchFilter =
        sizeFilter === 'All' ||
        (sizeFilter === 'Tops' && ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'].includes(p.size.toUpperCase())) ||
        (sizeFilter === 'Bottoms' && ['28', '30', '32', '34', '36', '38', '40'].includes(p.size)) ||
        (sizeFilter === 'Free Size' && ['FREE', 'ONESIZE', 'FREE SIZE'].includes(p.size.toUpperCase())) ||
        p.size.toUpperCase() === sizeFilter.toUpperCase();

      return matchSearch && matchFilter;
    });
  }, [sizedProducts, searchQuery, sizeFilter]);

  const handleOpenDrawer = (product?: Product) => {
    const prod = product || products[0];
    setSelectedProductId(prod?.id || '');
    setSizeValue(prod?.size || 'M');
    setStockValue(prod ? prod.stock : '');
    setReorderValue(prod ? prod.reorderLevel : 10);
    setDrawerError('');
    setDrawerSuccess('');
    setIsDrawerOpen(true);
  };

  const handleSaveSize = (e: React.FormEvent) => {
    e.preventDefault();
    setDrawerError('');
    setDrawerSuccess('');

    if (!selectedProductId) {
      setDrawerError('Please select a product.');
      return;
    }
    if (!sizeValue.trim()) {
      setDrawerError('Please enter or select a valid size code.');
      return;
    }

    try {
      const target = products.find((p) => p.id === selectedProductId);
      if (target) {
        updateProduct({
          ...target,
          size: sizeValue.trim().toUpperCase(),
          stock: typeof stockValue === 'number' ? stockValue : target.stock,
          reorderLevel: typeof reorderValue === 'number' ? reorderValue : target.reorderLevel,
        });
      }
      setDrawerSuccess(`Size scale updated for ${target?.name || 'product'}!`);
      setTimeout(() => {
        setIsDrawerOpen(false);
      }, 1000);
    } catch (err: any) {
      setDrawerError(err?.message || 'Failed to update size configuration.');
    }
  };

  const commonSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38', 'Free Size'];

  return (
    <div className="space-y-6 animate-in fade-in duration-150 pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold text-[#1C1B18] tracking-tight leading-tight">
            Size Management
          </h1>
          <p className="text-[13px] text-[#6B665E] mt-0.5">
            Configure apparel size scales (Alpha, Numeric, Waist/Inseam) and monitor inventory distribution by size.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenDrawer()}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#381e12] hover:bg-[#2a160d] text-[#ffffff] font-medium text-[13px] rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <Plus size={16} className="text-[#ffffff]" />
            <span className="text-[#ffffff]">Assign Size Range</span>
          </button>
        </div>
      </div>

      {/* 4 StatCards matching Stock Ledger style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={<Ruler size={18} strokeWidth={2.2} />}
          iconBgColor="bg-[#EBF3FC] text-[#2563EB]"
          label="Sized Products"
          value={totalSizedItems.toLocaleString('en-IN')}
          trend={`${totalSizedItems} styles configured`}
          isPositive={true}
        />
        <StatCard
          icon={<Tag size={18} strokeWidth={2.2} />}
          iconBgColor="bg-[#E6F1E6] text-[#2E8B57]"
          label="Active Size Tags"
          value={activeSizeTagsCount}
          trend={`${activeSizeTagsCount} scales in rotation`}
          isPositive={true}
        />
        <StatCard
          icon={<AlertTriangle size={18} strokeWidth={2.2} />}
          iconBgColor="bg-[#FDEEE3] text-[#E8772E]"
          label="Low Stock Sizes"
          value={lowStockSizesCount}
          trend={`${lowStockSizesCount} items need replenishment`}
          isPositive={lowStockSizesCount === 0}
        />
        <StatCard
          icon={<Package size={18} strokeWidth={2.2} />}
          iconBgColor="bg-[#F7F5F0] text-[#6B665E]"
          label="Total Sized Units"
          value={totalSizedUnits.toLocaleString('en-IN')}
          trend="On-hand inventory volume"
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
                placeholder="Search style, SKU, size tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#FAF9F7] text-[13px] border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18] placeholder-[#8C827A] transition-all"
              />
            </div>

            {/* Size Scale Dropdown */}
            <div className="relative sm:w-60">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C827A] pointer-events-none">
                <Filter size={14} />
              </div>
              <select
                value={sizeFilter}
                onChange={(e) => setSizeFilter(e.target.value)}
                className="w-full pl-8 pr-8 py-2 bg-[#FAF9F7] text-[13px] font-medium border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18] cursor-pointer transition-all appearance-none"
              >
                <option value="All">All Size Scales</option>
                <option value="Tops">Tops / Tees (XS, S, M, L, XL, XXL)</option>
                <option value="Bottoms">Bottoms / Denim (28, 30, 32...)</option>
                <option value="Free Size">Free Size / One Size</option>
                <option value="S">Size S Only</option>
                <option value="M">Size M Only</option>
                <option value="L">Size L Only</option>
                <option value="XL">Size XL Only</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C827A] pointer-events-none text-[9px]">
                ▼
              </div>
            </div>
          </div>

          {/* Reset button */}
          {(searchQuery || sizeFilter !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSizeFilter('All');
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
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-[#EBF3FC] text-[#2563EB] flex items-center justify-center mx-auto mb-3">
              <Ruler size={22} />
            </div>
            <h3 className="text-[16px] font-semibold text-[#1C1B18]">
              No Sized Garments Found
            </h3>
            <p className="text-[13px] text-[#8C827A] mt-1 max-w-sm mx-auto">
              {searchQuery || sizeFilter !== 'All'
                ? 'Try adjusting your search criteria or size category filter.'
                : 'No clothing items with size scales configured yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#EBE8E2] bg-[#FAF9F7] text-[11px] font-medium uppercase tracking-wider text-[#8C827A]">
                  <th className="py-3 px-4">Garment / Style</th>
                  <th className="py-3 px-4">Size Code</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Stock On Hand</th>
                  <th className="py-3 px-4 text-right">Reorder Point</th>
                  <th className="py-3 px-4 text-right">Retail Price</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2EFE9] text-[13px] text-[#1C1B18]">
                {filteredProducts.map((p) => {
                  const isOutOfStock = p.stock === 0;
                  const isLow = p.stock > 0 && p.stock <= p.reorderLevel;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-[#FCFBF9] transition-colors"
                    >
                      {/* Product details with icon */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <ProductIcon category="Clothing" size="md" />
                          <div>
                            <div className="font-medium text-[#1C1B18]">
                              {p.name}
                            </div>
                            <div className="text-[11px] text-[#8C827A] flex items-center gap-1.5">
                              <span>SKU: {p.sku || 'N/A'}</span>
                              {p.color && (
                                <>
                                  <span>•</span>
                                  <span>Color: {p.color}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Size Tag Badge */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center justify-center min-w-[32px] px-2.5 py-1 rounded-md font-mono text-[12px] font-bold bg-[#FAF9F7] text-[#1C1B18] border border-[#EBE8E2] shadow-2xs">
                          {p.size}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="text-[12px] text-[#6B665E] bg-[#F7F5F0] px-2.5 py-0.5 rounded-full inline-block">
                          {p.category || 'Apparel'}
                        </span>
                      </td>

                      {/* Stock on Hand */}
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`inline-flex items-center font-semibold px-2 py-0.5 rounded text-[12px] ${
                            isOutOfStock
                              ? 'bg-[#FDECEC] text-[#D64545]'
                              : isLow
                              ? 'bg-[#FDEEE3] text-[#E8772E]'
                              : 'bg-[#E6F1E6] text-[#2E8B57]'
                          }`}
                        >
                          {p.stock} units
                        </span>
                      </td>

                      {/* Reorder Point */}
                      <td className="py-3 px-4 text-right font-medium text-[#6B665E]">
                        {p.reorderLevel} units
                      </td>

                      {/* Retail Price */}
                      <td className="py-3 px-4 text-right font-semibold text-[#1C1B18]">
                        {formatINR(p.sellingPrice)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenDrawer(p)}
                          className="p-1.5 rounded-lg text-[#8C827A] hover:text-[#381e12] hover:bg-[#F7F5F0] transition-colors cursor-pointer inline-flex items-center gap-1 text-[12px] font-medium"
                          title="Edit Size Settings"
                        >
                          <Edit2 size={14} />
                          <span>Configure</span>
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

      {/* Slide-over Right Drawer */}
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
                    <Ruler size={20} />
                  </div>
                  <div>
                    <h2 className="text-[16px] font-semibold text-[#1C1B18]">
                      Configure Garment Size
                    </h2>
                    <p className="text-[12px] text-[#8C827A]">
                      Assign standard size tags and safety stock
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
              <form onSubmit={handleSaveSize} className="flex-1 overflow-y-auto p-5 space-y-4">
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
                    Garment Style *
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedProductId(id);
                      const prod = products.find((p) => p.id === id);
                      if (prod) {
                        setSizeValue(prod.size || 'M');
                        setStockValue(prod.stock);
                        setReorderValue(prod.reorderLevel);
                      }
                    }}
                    className="w-full px-3 py-2 bg-[#FAF9F7] border border-[#EBE8E2] rounded-lg text-[13px] text-[#1C1B18] focus:outline-none focus:border-[#C4BAAE] focus:bg-white"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku || 'No SKU'}) - Current: {p.size || 'None'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Size Selector / Quick Presets */}
                <div>
                  <label className="block text-[12px] font-medium text-[#4A443D] mb-1.5">
                    Size Tag *
                  </label>
                  <input
                    type="text"
                    value={sizeValue}
                    onChange={(e) => setSizeValue(e.target.value)}
                    placeholder="e.g. M, XL, 32, 34"
                    className="w-full px-3 py-2 bg-[#FAF9F7] border border-[#EBE8E2] rounded-lg text-[13px] text-[#1C1B18] font-bold focus:outline-none focus:border-[#C4BAAE] focus:bg-white mb-2"
                    required
                  />

                  {/* Preset Pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {commonSizes.map((sz) => (
                      <button
                        type="button"
                        key={sz}
                        onClick={() => setSizeValue(sz)}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                          sizeValue.toUpperCase() === sz.toUpperCase()
                            ? 'bg-[#381e12] text-[#ffffff]'
                            : 'bg-[#FAF9F7] text-[#6B665E] border border-[#EBE8E2] hover:bg-[#EFECE6]'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stock On Hand */}
                <div>
                  <label className="block text-[12px] font-medium text-[#4A443D] mb-1.5">
                    Stock On Hand (Units)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 50"
                    value={stockValue}
                    onChange={(e) =>
                      setStockValue(e.target.value === '' ? '' : parseInt(e.target.value, 10))
                    }
                    className="w-full px-3 py-2 bg-[#FAF9F7] border border-[#EBE8E2] rounded-lg text-[13px] text-[#1C1B18] focus:outline-none focus:border-[#C4BAAE] focus:bg-white"
                  />
                </div>

                {/* Reorder Level */}
                <div>
                  <label className="block text-[12px] font-medium text-[#4A443D] mb-1.5">
                    Reorder Point / Safety Stock
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 15"
                    value={reorderValue}
                    onChange={(e) =>
                      setReorderValue(e.target.value === '' ? '' : parseInt(e.target.value, 10))
                    }
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
                    <span className="text-[#ffffff]">Save Size Settings</span>
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
