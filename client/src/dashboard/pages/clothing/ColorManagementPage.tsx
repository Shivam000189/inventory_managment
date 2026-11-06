import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Palette,
  Package,
  Layers,
  Search,
  Filter,
  Plus,
  AlertTriangle,
  X,
  CheckCircle2,
  Edit2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { ProductIcon } from '../../components/common/ProductIcon';
import { TableSkeleton } from '../../../components/ui/Feedback';
import { useApp } from '../../context/AppContext';
import { colorApi } from '../../../api/colorApi';

interface ColorRecord {
  id?: string;
  colorId?: string;
  name: string;
  hexCode?: string;
  status: 'active' | 'inactive';
  stockUnits?: number;
  productCount?: number;
  products?: Array<{
    productId: string;
    name: string;
    sku: string;
    category?: string;
    size?: string;
    currentStock: number;
  }>;
  matchedProducts?: Array<{
    productId: string;
    name: string;
    sku: string;
    category?: string;
    size?: string;
    currentStock: number;
  }>;
}

export const ColorManagementPage: React.FC = () => {
  const { products, businessProfile } = useApp();

  const [colors, setColors] = useState<ColorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingColor, setEditingColor] = useState<ColorRecord | null>(null);
  const [colorName, setColorName] = useState('');
  const [hexCode, setHexCode] = useState('#2563EB');
  const [colorStatus, setColorStatus] = useState<'active' | 'inactive'>('active');
  const [drawerSaving, setDrawerSaving] = useState(false);
  const [drawerError, setDrawerError] = useState('');
  const [drawerSuccess, setDrawerSuccess] = useState('');

  // Fetch colors from API with fallback to products-derived colors
  const fetchColors = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res: any = await colorApi.list();
      const list = Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : Array.isArray(res?.data) ? res.data : [];
      
      if (list.length > 0) {
        setColors(list);
      } else {
        // Fallback: derive unique colors from products catalog
        const colorMap = new Map<string, { count: number; stock: number }>();
        products.forEach((p) => {
          const c = (p.color || (p as any).attributes?.color || '').trim();
          if (c) {
            const cur = colorMap.get(c) || { count: 0, stock: 0 };
            cur.count += 1;
            cur.stock += p.stock || 0;
            colorMap.set(c, cur);
          }
        });

        const derived: ColorRecord[] = Array.from(colorMap.entries()).map(([name, data], idx) => ({
          id: `derived-${idx}`,
          name,
          hexCode: '#381e12',
          status: 'active',
          productCount: data.count,
          stockUnits: data.stock,
        }));
        setColors(derived);
      }
    } catch (err: any) {
      console.warn('Could not fetch colors from server, deriving from local state:', err);
      const colorMap = new Map<string, { count: number; stock: number }>();
      products.forEach((p) => {
        const c = (p.color || (p as any).attributes?.color || '').trim();
        if (c) {
          const cur = colorMap.get(c) || { count: 0, stock: 0 };
          cur.count += 1;
          cur.stock += p.stock || 0;
          colorMap.set(c, cur);
        }
      });

      const derived: ColorRecord[] = Array.from(colorMap.entries()).map(([name, data], idx) => ({
        id: `fallback-${idx}`,
        name,
        hexCode: '#381e12',
        status: 'active',
        productCount: data.count,
        stockUnits: data.stock,
      }));
      setColors(derived);
    } finally {
      setLoading(false);
    }
  }, [products]);

  useEffect(() => {
    fetchColors();
  }, [fetchColors]);

  // Computed metrics for 4 Stat Cards
  const totalColorsCount = colors.length;
  const activePalettesCount = useMemo(() => {
    return colors.filter((c) => c.status !== 'inactive').length;
  }, [colors]);
  const totalMappedProducts = useMemo(() => {
    return colors.reduce((acc, c) => acc + (c.productCount || 0), 0);
  }, [colors]);
  const totalColorStockUnits = useMemo(() => {
    return colors.reduce((acc, c) => acc + (c.stockUnits || 0), 0);
  }, [colors]);

  // Filtered rows
  const filteredColors = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return colors.filter((color) => {
      const matchSearch =
        !q ||
        color.name.toLowerCase().includes(q) ||
        (color.hexCode && color.hexCode.toLowerCase().includes(q));

      const matchStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Active' && color.status === 'active') ||
        (statusFilter === 'Inactive' && color.status === 'inactive');

      return matchSearch && matchStatus;
    });
  }, [colors, searchQuery, statusFilter]);

  const handleOpenDrawer = (colorToEdit?: ColorRecord) => {
    if (colorToEdit) {
      setEditingColor(colorToEdit);
      setColorName(colorToEdit.name);
      setHexCode(colorToEdit.hexCode || '#2563EB');
      setColorStatus(colorToEdit.status || 'active');
    } else {
      setEditingColor(null);
      setColorName('');
      setHexCode('#2563EB');
      setColorStatus('active');
    }
    setDrawerError('');
    setDrawerSuccess('');
    setIsDrawerOpen(true);
  };

  const handleSaveColor = async (e: React.FormEvent) => {
    e.preventDefault();
    setDrawerError('');
    setDrawerSuccess('');

    if (!colorName.trim()) {
      setDrawerError('Please enter a color name.');
      return;
    }

    setDrawerSaving(true);
    try {
      const payload = {
        name: colorName.trim(),
        hexCode: hexCode.startsWith('#') ? hexCode : `#${hexCode}`,
        status: colorStatus,
      };

      if (editingColor && (editingColor.colorId || editingColor.id)) {
        const id = editingColor.colorId || editingColor.id || '';
        await colorApi.update(id, payload);
        setDrawerSuccess('Color updated successfully!');
      } else {
        await colorApi.create(payload);
        setDrawerSuccess('New color registered successfully!');
      }

      await fetchColors();
      setTimeout(() => {
        setIsDrawerOpen(false);
      }, 900);
    } catch (err: any) {
      setDrawerError(err?.message || 'Failed to save color.');
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
            Color Management
          </h1>
          <p className="text-[13px] text-[#6B665E] mt-0.5">
            Manage reusable color palettes, hex swatches, and track color-specific inventory distribution for{' '}
            {businessProfile?.name || 'your store'}.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchColors()}
            title="Refresh Colors"
            className="p-2.5 bg-white border border-[#EBE8E2] text-[#6B665E] hover:text-[#1C1B18] hover:border-[#C4BAAE] rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw size={15} />
          </button>
          <button
            onClick={() => handleOpenDrawer()}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#381e12] hover:bg-[#2a160d] text-[#ffffff] font-medium text-[13px] rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <Plus size={16} className="text-[#ffffff]" />
            <span className="text-[#ffffff]">Add New Color</span>
          </button>
        </div>
      </div>

      {/* 4 StatCards matching Stock Ledger style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={<Palette size={18} strokeWidth={2.2} />}
          iconBgColor="bg-[#F3E8FF] text-[#9333EA]"
          label="Total Palette Colors"
          value={totalColorsCount}
          trend={`${totalColorsCount} registered swatches`}
          isPositive={true}
        />
        <StatCard
          icon={<CheckCircle2 size={18} strokeWidth={2} />}
          iconBgColor="bg-[#E6F1E6] text-[#2E8B57]"
          label="Active Palettes"
          value={activePalettesCount}
          trend={`${activePalettesCount} enabled for variants`}
          isPositive={true}
        />
        <StatCard
          icon={<Layers size={18} strokeWidth={2} />}
          iconBgColor="bg-[#FEF3C7] text-[#D97706]"
          label="Color-Mapped Items"
          value={totalMappedProducts.toLocaleString('en-IN')}
          trend="Products linked to color"
          isPositive={true}
        />
        <StatCard
          icon={<Package size={18} strokeWidth={2} />}
          iconBgColor="bg-[#EBF3FC] text-[#2563EB]"
          label="Total Stock Units"
          value={totalColorStockUnits.toLocaleString('en-IN')}
          trend="Inventory across all shades"
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
                placeholder="Search color name, hex code (#381e12)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#FAF9F7] text-[13px] border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18] placeholder-[#8C827A] transition-all"
              />
            </div>

            {/* Status Dropdown */}
            <div className="relative sm:w-48">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C827A] pointer-events-none">
                <Filter size={14} />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-8 pr-8 py-2 bg-[#FAF9F7] text-[13px] font-medium border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18] cursor-pointer transition-all appearance-none"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active Only</option>
                <option value="Inactive">Inactive Only</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C827A] pointer-events-none text-[9px]">
                ▼
              </div>
            </div>
          </div>

          {/* Reset button */}
          {(searchQuery || statusFilter !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('All');
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
        {loading ? (
          <TableSkeleton rows={6} />
        ) : filteredColors.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-[#F3E8FF] text-[#9333EA] flex items-center justify-center mb-3">
              <Palette size={22} />
            </div>
            <h3 className="text-[16px] font-semibold text-[#1C1B18] text-center w-full">No Colors Found</h3>
            <p className="text-[13px] text-[#8C827A] mt-1.5 max-w-md mx-auto text-center w-full leading-relaxed">
              {searchQuery || statusFilter !== 'All'
                ? 'Try adjusting your search query or status filter.'
                : 'No color swatches configured yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF6F0] border-b border-[#EBE8E2]">
                  <th className="py-3.5 px-4 text-[11px] font-bold text-[#8C7E74] uppercase tracking-wider">
                    Color Swatch & Name
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-bold text-[#8C7E74] uppercase tracking-wider">
                    Hex Code
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-bold text-[#8C7E74] uppercase tracking-wider">
                    Products Mapped
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-bold text-[#8C7E74] uppercase tracking-wider">
                    Live Stock Units
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-bold text-[#8C7E74] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-bold text-[#8C7E74] uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EDE8]">
                {filteredColors.map((color, index) => {
                  const hex = color.hexCode || '#64748B';
                  const isActive = color.status === 'active';
                  const pCount = color.productCount ?? (color.products?.length || 0);
                  const units = color.stockUnits ?? 0;

                  return (
                    <tr
                      key={color.id || color.colorId || `col-${index}`}
                      className="hover:bg-[#FAF9F7] transition-colors"
                    >
                      {/* Swatch & Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full border border-black/15 shadow-inner flex items-center justify-center shrink-0"
                            style={{ backgroundColor: hex }}
                          />
                          <div>
                            <div className="text-[13px] font-semibold text-[#1C1B18]">
                              {color.name}
                            </div>
                            <div className="text-[11px] text-[#8C827A]">
                              Standard Apparel Palette
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Hex Code */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono text-[11px] bg-[#FAF6F0] border border-[#EBE8E2] text-[#4A443F]">
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block border border-black/10"
                            style={{ backgroundColor: hex }}
                          />
                          {hex.toUpperCase()}
                        </span>
                      </td>

                      {/* Products Mapped */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[13px] text-[#1C1B18] font-medium">
                          <Layers size={13} className="text-[#8C827A]" />
                          {pCount} {pCount === 1 ? 'item' : 'items'}
                        </span>
                      </td>

                      {/* Live Stock Units */}
                      <td className="py-3 px-4">
                        <span className="text-[13px] font-semibold text-[#1C1B18]">
                          {units.toLocaleString('en-IN')} units
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <Badge
                          variant={isActive ? 'success' : 'neutral'}
                          className="capitalize text-[11px]"
                        >
                          {color.status}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenDrawer(color)}
                          className="p-1.5 text-[#6B665E] hover:text-[#381e12] hover:bg-[#F3EFEA] rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 text-[12px] font-medium"
                          title="Edit color"
                        >
                          <Edit2 size={14} />
                          <span>Edit</span>
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

      {/* Slide-over Right Drawer for Add / Edit Color */}
      {isDrawerOpen && (
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
                    {editingColor ? 'Edit Color' : 'Add New Color'}
                  </h2>
                  <p className="text-[12px] text-[#6B665E] mt-0.5">
                    {editingColor
                      ? 'Update swatch hex code and catalog status'
                      : 'Define a reusable color swatch for catalog items'}
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
              <form onSubmit={handleSaveColor} className="flex-1 overflow-y-auto p-5 space-y-4">
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

                {/* Color Name */}
                <div>
                  <label className="block text-[12px] font-medium text-[#1C1B18] mb-1.5">
                    Color Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Olive Green, Midnight Blue, Charcoal"
                    value={colorName}
                    onChange={(e) => setColorName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF9F7] text-[13px] border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18]"
                  />
                </div>

                {/* Hex Color Picker & Input */}
                <div>
                  <label className="block text-[12px] font-medium text-[#1C1B18] mb-1.5">
                    Color Swatch & Hex Code
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={hexCode.startsWith('#') ? hexCode : `#${hexCode}`}
                      onChange={(e) => setHexCode(e.target.value.toUpperCase())}
                      className="w-12 h-10 p-0.5 bg-white border border-[#EBE8E2] rounded-lg cursor-pointer"
                    />
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={hexCode}
                        onChange={(e) => setHexCode(e.target.value.toUpperCase())}
                        placeholder="#2563EB"
                        pattern="^#?[0-9a-fA-F]{6}$"
                        className="w-full px-3 py-2 bg-[#FAF9F7] text-[13px] font-mono border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18]"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-[#8C827A] mt-1">
                    Pick a visual shade using the swatch box or enter a 6-digit hex code.
                  </p>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-[12px] font-medium text-[#1C1B18] mb-1.5">
                    Status
                  </label>
                  <select
                    value={colorStatus}
                    onChange={(e) => setColorStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full px-3 py-2 bg-[#FAF9F7] text-[13px] border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18] cursor-pointer"
                  >
                    <option value="active">Active (Available for Catalog Items)</option>
                    <option value="inactive">Inactive (Hidden from POS / Variants)</option>
                  </select>
                </div>

                {/* Preview Box */}
                <div className="p-3.5 bg-[#FAF9F7] rounded-xl border border-[#EBE8E2] flex items-center gap-3 mt-4">
                  <div
                    className="w-10 h-10 rounded-full border border-black/15 shadow-sm"
                    style={{ backgroundColor: hexCode.startsWith('#') ? hexCode : `#${hexCode}` }}
                  />
                  <div>
                    <div className="text-[13px] font-semibold text-[#1C1B18]">
                      {colorName || 'Color Preview'}
                    </div>
                    <div className="text-[11px] font-mono text-[#8C827A]">
                      {hexCode.startsWith('#') ? hexCode : `#${hexCode}`}
                    </div>
                  </div>
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
                      {drawerSaving
                        ? 'Saving…'
                        : editingColor
                        ? 'Update Color'
                        : 'Create Color'}
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
