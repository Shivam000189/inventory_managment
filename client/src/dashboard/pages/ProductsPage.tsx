import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Download,
  Upload,
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  MoreVertical,
  Check,
  Edit2,
  Trash2,
  Copy,
  Layers,
  ArrowUpDown,
  X,
  Sparkles,
  Calendar,
  Tag,
  Clock,
  AlertTriangle,
  MapPin,
} from 'lucide-react';
import { ProductIcon } from '../components/common/ProductIcon';
import { Badge } from '../components/common/Badge';
import { BulkImportModal } from '../components/modals/BulkImportModal';
import { Portal } from '../components/common/Portal';
import { TableSkeleton, Skeleton } from '../../components/ui/Feedback';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { formatINR, downloadCSV } from '../lib/formatters';
import { isPharmacyBusiness } from '../../shared/industryConfig';

export const ProductsPage: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, adjustStock, suppliers, isLoadingBackend, businessProfile } = useApp();

  const isPharmacy = isPharmacyBusiness(businessProfile);
  const industryStr = String((businessProfile as any)?.industry || businessProfile?.businessType || '').toLowerCase();
  const isClothing =
    industryStr.includes('cloth') ||
    industryStr.includes('apparel') ||
    industryStr.includes('fashion') ||
    industryStr.includes('garment') ||
    industryStr.includes('textile');
  const isElectronics =
    industryStr.includes('electron') ||
    industryStr.includes('mobile') ||
    industryStr.includes('gadget') ||
    industryStr.includes('computer');
  const isHardware =
    industryStr.includes('hardw') ||
    industryStr.includes('build') ||
    industryStr.includes('construct') ||
    industryStr.includes('sanitary') ||
    industryStr.includes('paint') ||
    industryStr.includes('pipe') ||
    industryStr.includes('tool');
  const isWholesale =
    industryStr.includes('whole') ||
    industryStr.includes('b2b') ||
    industryStr.includes('distribut');
  const isGrocery =
    industryStr.includes('groc') ||
    industryStr.includes('kirana') ||
    industryStr.includes('supermarket') ||
    industryStr.includes('fmcg') ||
    industryStr.includes('food');

  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return null;
    const exp = new Date(expiryDate);
    if (isNaN(exp.getTime())) return null;
    const now = new Date();
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return {
        label: `Expired (${Math.abs(diffDays)}d ago)`,
        shortLabel: 'Expired',
        days: diffDays,
        tone: 'danger' as const,
        badgeVariant: 'danger' as const,
      };
    }
    if (diffDays <= 30) {
      return {
        label: `Exp in ${diffDays} days`,
        shortLabel: `${diffDays}d left`,
        days: diffDays,
        tone: 'danger' as const,
        badgeVariant: 'danger' as const,
      };
    }
    if (diffDays <= 90) {
      return {
        label: `Exp in ${diffDays} days`,
        shortLabel: `${diffDays}d left`,
        days: diffDays,
        tone: 'warning' as const,
        badgeVariant: 'warning' as const,
      };
    }
    return {
      label: `Exp: ${exp.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}`,
      shortLabel: exp.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }),
      days: diffDays,
      tone: 'neutral' as const,
      badgeVariant: 'neutral' as const,
    };
  };
  const pageTitle = isPharmacy ? 'Medicines' : 'Products';
  const itemNoun = isPharmacy ? 'Medicine' : 'Product';
  const pageSubtitle = isPharmacy
    ? 'Manage your pharmaceutical catalog, stock levels, and batches.'
    : 'Manage your master catalog, stock levels, and pricing.';

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'In stock' | 'Low' | 'Out'>('All');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Drawer & Modals
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustStockValue, setAdjustStockValue] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('Correction');

  // Form State for Add/Edit
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: isPharmacy ? 'Medicines' : isClothing ? 'Apparel' : isGrocery ? 'Groceries' : 'General',
    unit: isPharmacy ? 'strip' : isClothing ? 'pcs' : isGrocery ? 'packet' : 'pcs',
    purchasePrice: 100,
    sellingPrice: 199,
    mrp: 199,
    taxRate: 18,
    stock: 10,
    reorderLevel: 10,
    supplierId: suppliers[0]?.id || '',
    description: '',
    active: true,
    // Industry attributes
    batchNumber: '',
    genericName: '',
    manufacturer: '',
    manufacturingDate: '',
    expiryDate: '',
    brand: '',
    model: '',
    serialNumber: '',
    imei: '',
    warrantyMonths: 12,
    size: '',
    color: '',
    dimensions: '',
    material: '',
    weight: 0,
    wholesalePrice: 0,
    wholesaleMinQuantity: 10,
    dealerPrice: 0,
    warehouse: '',
    rackLocation: '',
  });

  const categories = ['All', 'Apparel', 'Pharmacy', 'Electronics', 'Footwear', 'Groceries', 'Home & Living', 'Stationery'];

  // Filtering
  const filteredProducts = products
    .filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.includes(q);
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      let matchesStatus = true;
      if (statusFilter === 'In stock') matchesStatus = p.stock > p.reorderLevel;
      if (statusFilter === 'Low') matchesStatus = p.stock > 0 && p.stock <= p.reorderLevel;
      if (statusFilter === 'Out') matchesStatus = p.stock === 0;

      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'price') return b.sellingPrice - a.sellingPrice;
      if (sortBy === 'stock') return b.stock - a.stock;
      return 0;
    });

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, statusFilter, sortBy, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      barcode: `890${Math.floor(100000000 + Math.random() * 900000000)}`,
      category: isPharmacy ? 'Medicines' : isClothing ? 'Apparel' : isGrocery ? 'Groceries' : 'General',
      unit: isPharmacy ? 'strip' : isClothing ? 'pcs' : isGrocery ? 'packet' : 'pcs',
      purchasePrice: 200,
      sellingPrice: 399,
      mrp: 450,
      taxRate: isPharmacy ? 12 : 18,
      stock: 20,
      reorderLevel: 10,
      supplierId: suppliers[0]?.id || '',
      description: '',
      active: true,
      batchNumber: isPharmacy ? `B${new Date().getFullYear()}${String(Math.floor(100 + Math.random() * 900))}` : '',
      genericName: '',
      manufacturer: '',
      manufacturingDate: '',
      expiryDate: '',
      brand: '',
      model: '',
      serialNumber: '',
      imei: '',
      warrantyMonths: 12,
      size: '',
      color: '',
      dimensions: '',
      material: '',
      weight: 0,
      wholesalePrice: 0,
      wholesaleMinQuantity: 10,
      dealerPrice: 0,
      warehouse: '',
      rackLocation: '',
    });
    setIsAddDrawerOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      sku: p.sku,
      barcode: p.barcode,
      category: p.category,
      unit: p.unit,
      purchasePrice: p.purchasePrice,
      sellingPrice: p.sellingPrice,
      mrp: p.mrp ?? p.sellingPrice,
      taxRate: p.taxRate,
      stock: p.stock,
      reorderLevel: p.reorderLevel,
      supplierId: p.supplierId,
      description: p.description || '',
      active: p.active,
      batchNumber: p.batchNumber || '',
      genericName: p.genericName || '',
      manufacturer: p.manufacturer || '',
      manufacturingDate: p.manufacturingDate ? p.manufacturingDate.slice(0, 10) : '',
      expiryDate: p.expiryDate ? p.expiryDate.slice(0, 10) : '',
      brand: p.brand || '',
      model: p.model || '',
      serialNumber: p.serialNumber || '',
      imei: p.imei || '',
      warrantyMonths: p.warrantyMonths ?? 12,
      size: p.size || '',
      color: p.color || '',
      dimensions: p.dimensions || '',
      material: p.material || '',
      weight: p.weight ?? 0,
      wholesalePrice: p.wholesalePrice ?? 0,
      wholesaleMinQuantity: p.wholesaleMinQuantity ?? 10,
      dealerPrice: p.dealerPrice ?? 0,
      warehouse: p.warehouse || '',
      rackLocation: p.rackLocation || '',
    });
    setIsAddDrawerOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find((s) => s.id === formData.supplierId);
    if (editingProduct) {
      updateProduct(editingProduct.id, {
        ...formData,
        supplierName: sup?.name,
      });
    } else {
      addProduct({
        ...formData,
        supplierName: sup?.name,
      });
    }
    setIsAddDrawerOpen(false);
  };

  const handleExportCSV = () => {
    const headers = ['SKU', 'Name', 'Category', 'Stock', 'Unit', 'Purchase Price', 'Selling Price', 'Tax Rate %', 'Status'];
    const rows = filteredProducts.map((p) => [
      p.sku,
      p.name,
      p.category,
      p.stock,
      p.unit,
      p.purchasePrice,
      p.sellingPrice,
      p.taxRate,
      p.stock === 0 ? 'Out of stock' : p.stock <= p.reorderLevel ? 'Low stock' : 'In stock',
    ]);
    downloadCSV('Inventory-products', headers, rows);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150 pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold text-[#1C1B18] tracking-tight leading-tight">
            {pageTitle}
          </h1>
          <p className="text-[13px] text-[#6B665E] mt-0.5">
            {pageSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-1.5 w-full sm:w-auto sm:flex sm:items-center sm:gap-2.5 py-0.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-1.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-[#381e12] hover:bg-[#26140c] text-white text-[11px] sm:text-xs font-semibold transition-all cursor-pointer shadow-2xs whitespace-nowrap active:scale-95"
          >
            <Download size={15} />
            <span>Export</span>
          </button>

          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-1.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-[#381e12] hover:bg-[#26140c] text-white text-[11px] sm:text-xs font-semibold transition-all cursor-pointer shadow-2xs whitespace-nowrap active:scale-95"
          >
            <Upload size={15} />
            <span>Bulk Import</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-[#381e12] hover:bg-[#26140c] text-white text-[11px] sm:text-xs font-semibold transition-all cursor-pointer shadow-2xs whitespace-nowrap active:scale-95"
          >
            <Plus size={16} />
            <span>Add {itemNoun}</span>
          </button>
        </div>
      </div>

      {/* Mobile Toolbar (Visible on mobile only < md) */}
      <div className="md:hidden bg-white rounded-2xl p-3 border border-[#EEE6DA] flex flex-col gap-2.5 shadow-2xs">
        {/* Row 1: Search Bar + Grid/Table View Toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-2.5 text-[#9A948A]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, SKU, or barcode..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#EEE6DA] text-xs focus:border-[#7FAE82] outline-none bg-white transition-colors"
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-[#FAF6EF] p-1 rounded-xl border border-[#EEE6DA] shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg cursor-pointer transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-[#1C1B18] shadow-2xs font-semibold'
                  : 'text-[#6B665E] hover:text-[#1C1B18]'
              }`}
              title="Table view"
              aria-label="Table view"
            >
              <List size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg cursor-pointer transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-[#1C1B18] shadow-2xs font-semibold'
                  : 'text-[#6B665E] hover:text-[#1C1B18]'
              }`}
              title="Grid view"
              aria-label="Grid view"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>

        {/* Row 2: Category Dropdown + Sort Dropdown */}
        <div className="grid grid-cols-2 gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs text-[#1C1B18] bg-white cursor-pointer outline-none focus:border-[#7FAE82] transition-colors"
          >
            {categories.map((c) => (
              <option key={c} value={c}>Category: {c}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs text-[#1C1B18] bg-white cursor-pointer outline-none focus:border-[#7FAE82] transition-colors"
          >
            <option value="name">Sort: Name</option>
            <option value="price">Sort: Price (High to Low)</option>
            <option value="stock">Sort: Stock</option>
          </select>
        </div>

        {/* Row 3: Stock Status Pills */}
        <div className="grid grid-cols-4 gap-1 bg-[#FAF6EF] p-1 rounded-xl border border-[#EEE6DA]/80 w-full">
          {(['All', 'In stock', 'Low', 'Out'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`py-1.5 px-1 text-center text-xs font-semibold rounded-lg transition-all cursor-pointer truncate ${
                statusFilter === status
                  ? 'bg-white text-[#1C1B18] shadow-2xs'
                  : 'text-[#6B665E] hover:text-[#1C1B18]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Toolbar (Visible on desktop >= md) */}
      <div className="hidden md:flex bg-white rounded-2xl p-3 border border-[#EEE6DA] items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-2.5 text-[#9A948A]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, SKU, or barcode..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#EEE6DA] text-xs focus:border-[#7FAE82] outline-none"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-[#EEE6DA] text-xs text-[#1C1B18] bg-white cursor-pointer outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c}>Category: {c}</option>
            ))}
          </select>
        </div>

        {/* Stock Status Pills */}
        <div className="flex items-center gap-1 bg-[#FAF6EF] p-1 rounded-xl border border-[#EEE6DA]/80">
          {(['All', 'In stock', 'Low', 'Out'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                statusFilter === status
                  ? 'bg-white text-[#1C1B18] shadow-2xs'
                  : 'text-[#6B665E] hover:text-[#1C1B18]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl border border-[#EEE6DA] text-xs text-[#6B665E] bg-white cursor-pointer outline-none"
          >
            <option value="name">Sort: Name</option>
            <option value="price">Sort: Price (High to Low)</option>
            <option value="stock">Sort: Stock</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center bg-[#FAF6EF] p-0.5 rounded-xl border border-[#EEE6DA]">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-[#1C1B18] shadow-2xs' : 'text-[#6B665E]'
              }`}
              title="Table view"
              aria-label="Table view"
            >
              <List size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-[#1C1B18] shadow-2xs' : 'text-[#6B665E]'
              }`}
              title="Grid view"
              aria-label="Grid view"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Products Content: Table or Grid */}
      {isLoadingBackend && products.length === 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" role="status" aria-busy="true">
            <span className="sr-only">Loading products catalog...</span>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-[#EEE6DA] shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton width={36} height={36} borderRadius={10} />
                  <Skeleton width={70} height={20} borderRadius={12} />
                </div>
                <Skeleton width="80%" height={16} borderRadius={4} />
                <Skeleton width="50%" height={12} borderRadius={4} />
                <div className="pt-2 border-t border-[#EEE6DA]/70 flex justify-between">
                  <Skeleton width={60} height={16} borderRadius={4} />
                  <Skeleton width={50} height={16} borderRadius={4} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <TableSkeleton
            columns={[
              { title: 'Product', width: '30%' },
              { title: 'Category', width: '15%' },
              { title: 'Purchase', width: '12%', align: 'right' },
              { title: 'Selling', width: '12%', align: 'right' },
              { title: 'Stock Level', width: '15%' },
              { title: 'Status', width: '10%', align: 'center' },
              { title: 'Actions', width: '6%', align: 'right' },
            ]}
            rows={7}
          />
        )
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#EEE6DA]">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF6EF] text-[#6B665E] flex items-center justify-center mx-auto mb-3">
            <Search size={22} />
          </div>
          <h3 className="text-sm font-semibold text-[#1C1B18]">No products match your search</h3>
          <p className="text-xs text-[#6B665E] mt-1 max-w-sm mx-auto">
            Try adjusting filters or adding a new product to your master inventory catalog.
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="mt-4 px-4 py-2 rounded-xl bg-[#7FAE82] text-white text-xs font-semibold cursor-pointer"
          >
            + Add New {itemNoun}
          </button>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-[#EEE6DA] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[760px]">
              <thead className="sticky top-0 z-10 bg-[#FAF6EF] border-b border-[#EEE6DA] text-[#8C867A] text-[11px] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-medium">{isPharmacy ? 'Medicine & Generic' : 'Product'}</th>
                  <th className="py-3 px-3 font-medium">Category</th>
                  <th className="py-3 px-3 font-medium text-right">Purchase</th>
                  <th className="py-3 px-3 font-medium text-right">Selling / MRP</th>
                  <th className="py-3 px-3 font-medium">Stock Level</th>
                  {(isPharmacy || isGrocery || paginatedProducts.some((p) => p.batchNumber || p.expiryDate)) && (
                    <th className="py-3 px-3 font-medium">Batch & Expiry</th>
                  )}
                  <th className="py-3 px-3 font-medium text-center">Status</th>
                  <th className="py-3 px-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEE6DA]/80">
                {paginatedProducts.map((p) => {
                  const isLow = p.stock > 0 && p.stock <= p.reorderLevel;
                  const isOut = p.stock === 0;
                  const statusVariant = isOut ? 'danger' : isLow ? 'warning' : 'success';
                  const statusText = isOut ? 'Out of stock' : isLow ? 'Low stock' : 'In stock';

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-[#FAF6EF]/60 transition-colors group cursor-pointer"
                      onClick={() => setViewingProduct(p)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <ProductIcon name={p.name} type={p.iconType} />
                          <div>
                            <div className="font-semibold text-[#1C1B18] text-[13px] group-hover:text-[#6C9C70] transition-colors">
                              {p.name}
                            </div>
                            {p.genericName && (
                              <div className="text-[11px] text-[#7FAE82] font-medium flex items-center gap-1 mt-0.5">
                                <span>{p.genericName}</span>
                                {p.manufacturer && <span className="text-[#9A948A]">· {p.manufacturer}</span>}
                              </div>
                            )}
                            {!p.genericName && p.brand && (
                              <div className="text-[11px] text-[#8C867A] mt-0.5">
                                {p.brand} {p.size ? `· Size: ${p.size}` : ''} {p.color ? `· ${p.color}` : ''}
                              </div>
                            )}
                            {p.rackLocation && (
                              <div className="text-[10px] text-[#8C867A] flex items-center gap-1 mt-0.5">
                                <MapPin size={10} className="text-[#D98E0B]" /> {p.rackLocation}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-[#6B665E]">
                        <span className="bg-[#FAF6EF] px-2 py-0.5 rounded-md border border-[#EEE6DA]">
                          {p.category}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right text-[#6B665E] tabular-nums">
                        {formatINR(p.purchasePrice)}
                      </td>

                      <td className="py-3 px-3 text-right tabular-nums">
                        <div className="font-bold text-[#1C1B18] text-xs">
                          {formatINR(p.sellingPrice)}
                        </div>
                        {p.mrp && p.mrp > 0 && (
                          <div className="text-[10px] text-[#9A948A] mt-0.5">
                            <span className="line-through">MRP {formatINR(p.mrp)}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-baseline justify-between gap-3 max-w-[150px]">
                          <span
                            className={`font-bold text-sm tabular-nums ${
                              isOut
                                ? 'text-[#D64545]'
                                : isLow
                                  ? 'text-[#E8772E]'
                                  : 'text-[#7FAE82]'
                            }`}
                          >
                            {p.stock} <span className="text-xs font-normal opacity-80">{p.unit}</span>
                          </span>
                          <span className="text-[11px] text-[#9A948A] tabular-nums whitespace-nowrap">
                            Min {p.reorderLevel}
                          </span>
                        </div>
                      </td>

                      {(isPharmacy || isGrocery || paginatedProducts.some((prod) => prod.batchNumber || prod.expiryDate)) && (
                        <td className="py-3 px-3">
                          {(() => {
                            const expStatus = getExpiryStatus(p.expiryDate);
                            return (
                              <div className="space-y-1">
                                {p.batchNumber && (
                                  <span className="inline-block text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-[#FAF6EF] border border-[#EEE6DA] text-[#6B665E]">
                                    {p.batchNumber}
                                  </span>
                                )}
                                {expStatus ? (
                                  <div>
                                    <Badge variant={expStatus.badgeVariant}>{expStatus.shortLabel}</Badge>
                                  </div>
                                ) : null}
                                {!p.batchNumber && !expStatus && (
                                  <span className="text-[11px] text-[#B8B2A7]">—</span>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                      )}
                      <td className="py-3 px-3 text-center">
                        <Badge variant={statusVariant}>{statusText}</Badge>
                      </td>

                      <td
                        className="py-3 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setAdjustingProduct(p);
                              setAdjustStockValue(p.stock);
                            }}
                            className="p-1.5 rounded-lg text-[#6B665E] hover:text-[#1C1B18] hover:bg-[#FAF6EF] transition-colors cursor-pointer"
                            title="Adjust Stock"
                          >
                            <Layers size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded-lg text-[#6B665E] hover:text-[#1C1B18] hover:bg-[#FAF6EF] transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete ${p.name}?`)) deleteProduct(p.id);
                            }}
                            className="p-1.5 rounded-lg text-[#D64545] hover:bg-[#FDECEC] transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Pagination Footer */}
          <div className="p-3.5 border-t border-[#EEE6DA] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6B665E] bg-[#FAF6EF]/30">
            <div className="flex items-center gap-4">
              <span>
                Showing{' '}
                <strong className="text-[#1C1B18]">
                  {filteredProducts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                </strong>{' '}
                to{' '}
                <strong className="text-[#1C1B18]">
                  {Math.min(currentPage * pageSize, filteredProducts.length)}
                </strong>{' '}
                of <strong className="text-[#1C1B18]">{filteredProducts.length}</strong> {isPharmacy ? 'medicines' : 'products'}
              </span>

              <div className="flex items-center gap-1.5 pl-2 border-l border-[#EEE6DA]">
                <span className="text-[#6B665E]">Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="px-2 py-1 rounded-lg border border-[#EEE6DA] bg-white text-xs font-semibold text-[#1C1B18] outline-none cursor-pointer focus:border-[#7FAE82]"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded-lg bg-[#381e12] hover:bg-[#26140c] text-xs font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-95"
                >
                  Previous
                </button>

                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            currentPage === pageNum
                              ? 'bg-[#381e12] text-white shadow-2xs'
                              : 'text-[#6B665E] hover:bg-[#FAF6EF] hover:text-[#1C1B18]'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                      return (
                        <span key={pageNum} className="text-[#9A948A] px-0.5 text-xs">
                          …
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1 rounded-lg bg-[#381e12] hover:bg-[#26140c] text-xs font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-95"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedProducts.map((p) => {
            const isLow = p.stock > 0 && p.stock <= p.reorderLevel;
            const isOut = p.stock === 0;
            const statusVariant = isOut ? 'danger' : isLow ? 'warning' : 'success';
            const statusText = isOut ? 'Out of stock' : isLow ? 'Low stock' : 'In stock';

            return (
              <div
                key={p.id}
                onClick={() => setViewingProduct(p)}
                className="bg-white rounded-2xl p-4 border border-[#EEE6DA] hover:border-[#DDD3C4] transition-all cursor-pointer group shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <ProductIcon name={p.name} type={p.iconType} className="w-11 h-11 rounded-2xl bg-[#FAF6EF] text-[#6B665E] flex items-center justify-center border border-[#EEE6DA]" size={20} />
                    <Badge variant={statusVariant}>{statusText}</Badge>
                  </div>
                  <h4 className="font-semibold text-sm text-[#1C1B18] group-hover:text-[#6C9C70] transition-colors line-clamp-1">
                    {p.name}
                  </h4>
                  {p.genericName && (
                    <p className="text-[11px] text-[#7FAE82] font-medium line-clamp-1 mt-0.5">
                      {p.genericName}
                    </p>
                  )}
                  {!p.genericName && p.brand && (
                    <p className="text-[11px] text-[#8C867A] line-clamp-1 mt-0.5">
                      {p.brand} {p.size ? `(${p.size})` : ''}
                    </p>
                  )}
                  <p className="text-[11px] text-[#9A948A] mt-0.5">
                    SKU: {p.sku} · {p.category}
                  </p>
                  {(p.batchNumber || p.expiryDate) && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {p.batchNumber && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#FAF6EF] border border-[#EEE6DA] text-[#6B665E]">
                          {p.batchNumber}
                        </span>
                      )}
                      {(() => {
                        const expStatus = getExpiryStatus(p.expiryDate);
                        return expStatus ? (
                          <Badge variant={expStatus.badgeVariant}>{expStatus.shortLabel}</Badge>
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-[#EEE6DA] flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-[#9A948A]">Selling Price</div>
                    <div className="font-bold text-sm text-[#1C1B18] tabular-nums">
                      {formatINR(p.sellingPrice)}
                    </div>
                    {p.mrp && p.mrp > 0 && (
                      <div className="text-[10px] text-[#9A948A] line-through">
                        MRP {formatINR(p.mrp)}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-[#9A948A]">Stock</div>
                    <div className="font-semibold text-xs text-[#1C1B18] tabular-nums">
                      {p.stock} {p.unit}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
          <div className="bg-white rounded-2xl border border-[#EEE6DA] shadow-2xs">
          {/* Pagination Footer */}
          <div className="p-3.5 border-t border-[#EEE6DA] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6B665E] bg-[#FAF6EF]/30">
            <div className="flex items-center gap-4">
              <span>
                Showing{' '}
                <strong className="text-[#1C1B18]">
                  {filteredProducts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                </strong>{' '}
                to{' '}
                <strong className="text-[#1C1B18]">
                  {Math.min(currentPage * pageSize, filteredProducts.length)}
                </strong>{' '}
                of <strong className="text-[#1C1B18]">{filteredProducts.length}</strong> {isPharmacy ? 'medicines' : 'products'}
              </span>

              <div className="flex items-center gap-1.5 pl-2 border-l border-[#EEE6DA]">
                <span className="text-[#6B665E]">Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="px-2 py-1 rounded-lg border border-[#EEE6DA] bg-white text-xs font-semibold text-[#1C1B18] outline-none cursor-pointer focus:border-[#7FAE82]"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded-lg bg-[#381e12] hover:bg-[#26140c] text-xs font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-95"
                >
                  Previous
                </button>

                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            currentPage === pageNum
                              ? 'bg-[#381e12] text-white shadow-2xs'
                              : 'text-[#6B665E] hover:bg-[#FAF6EF] hover:text-[#1C1B18]'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                      return (
                        <span key={pageNum} className="text-[#9A948A] px-0.5 text-xs">
                          …
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1 rounded-lg bg-[#381e12] hover:bg-[#26140c] text-xs font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-95"
                >
                  Next
                </button>
              </div>
            )}
          </div></div>
        </div>
      )}

      {/* Add / Edit Product Right Drawer (480px) */}
      {isAddDrawerOpen && (
        <Portal>
          <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity"
            onClick={() => setIsAddDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-lg bg-white border-l border-[#EEE6DA] shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
              <div className="p-5 border-b border-[#EEE6DA] flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-[#1C1B18]">
                    {editingProduct ? `Edit ${itemNoun}` : `Add New ${itemNoun}`}
                  </h3>
                  <p className="text-xs text-[#6B665E]">
                    Enter master product specifications and stock thresholds.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-[#6B665E] hover:bg-[#FAF6EF]"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Body */}
              <form id="product-form" onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Men's Cotton T-Shirt"
                    className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs focus:border-[#7FAE82] outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1B18] mb-1 flex items-center justify-between">
                      <span>SKU *</span>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
                          })
                        }
                        className="text-[10px] text-[#7FAE82] hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <Sparkles size={11} /> Auto
                      </button>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs focus:border-[#7FAE82] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                      Barcode
                    </label>
                    <input
                      type="text"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      placeholder="89012345..."
                      className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs focus:border-[#7FAE82] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs bg-white outline-none"
                    >
                      {categories.filter((c) => c !== 'All').map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                      Unit of Measure
                    </label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs bg-white outline-none"
                    >
                      <option value="pcs">Pieces (pcs)</option>
                      <option value="strip">Strip</option>
                      <option value="bottle">Bottle</option>
                      <option value="pair">Pair</option>
                      <option value="box">Box</option>
                      <option value="kg">Kilogram (kg)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                      Purchase Cost (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={formData.purchasePrice}
                      onChange={(e) =>
                        setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs focus:border-[#7FAE82] outline-none tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                      Selling Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={formData.sellingPrice}
                      onChange={(e) =>
                        setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs focus:border-[#7FAE82] outline-none tabular-nums font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                      MRP (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.mrp}
                      onChange={(e) =>
                        setFormData({ ...formData, mrp: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="Max Retail Price"
                      className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs focus:border-[#7FAE82] outline-none tabular-nums"
                    />
                  </div>
                </div>

                {/* Industry-Specific Dynamic Attribute Sections */}
                {isPharmacy && (
                  <div className="p-3.5 rounded-2xl bg-[#FAF6EF]/60 border border-[#EEE6DA] space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#1C1B18]">
                      <span>💊 Pharmacy & Drug Compliance</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#1C1B18] mb-1">
                          Generic Name / Molecule
                        </label>
                        <input
                          type="text"
                          value={formData.genericName}
                          onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                          placeholder="e.g. Paracetamol 500mg"
                          className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs bg-white focus:border-[#7FAE82] outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#1C1B18] mb-1">
                          Manufacturer / Brand
                        </label>
                        <input
                          type="text"
                          value={formData.manufacturer}
                          onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                          placeholder="e.g. Cipla, Sun Pharma"
                          className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs bg-white focus:border-[#7FAE82] outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#1C1B18] mb-1">
                        Batch Number
                      </label>
                      <input
                        type="text"
                        value={formData.batchNumber}
                        onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                        placeholder="e.g. BATCH-2024-08"
                        className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs bg-white focus:border-[#7FAE82] outline-none font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#1C1B18] mb-1">
                          Mfg Date
                        </label>
                        <input
                          type="date"
                          value={formData.manufacturingDate}
                          onChange={(e) => setFormData({ ...formData, manufacturingDate: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs bg-white focus:border-[#7FAE82] outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#1C1B18] mb-1 text-[#D64545]">
                          Expiry Date *
                        </label>
                        <input
                          type="date"
                          value={formData.expiryDate}
                          onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs bg-white focus:border-[#7FAE82] outline-none font-medium"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {isClothing && (
                  <div className="p-3.5 rounded-2xl bg-[#FAF6EF]/60 border border-[#EEE6DA] space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#1C1B18]">
                      <span>👗 Apparel & Variant Attributes</span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#1C1B18] mb-1">
                          Brand
                        </label>
                        <input
                          type="text"
                          value={formData.brand}
                          onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                          placeholder="e.g. Zara"
                          className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs bg-white focus:border-[#7FAE82] outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#1C1B18] mb-1">
                          Size
                        </label>
                        <input
                          type="text"
                          value={formData.size}
                          onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                          placeholder="S, M, L, XL, 32"
                          className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs bg-white focus:border-[#7FAE82] outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#1C1B18] mb-1">
                          Color
                        </label>
                        <input
                          type="text"
                          value={formData.color}
                          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                          placeholder="Navy Blue"
                          className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs bg-white focus:border-[#7FAE82] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {isElectronics && (
                  <div className="p-3.5 rounded-2xl bg-[#FAF6EF]/60 border border-[#EEE6DA] space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#1C1B18]">
                      <span>📱 Device & Serial Tracking</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#1C1B18] mb-1">
                          Brand & Model
                        </label>
                        <input
                          type="text"
                          value={formData.model}
                          onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                          placeholder="e.g. iPhone 15 / Galaxy S24"
                          className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs bg-white focus:border-[#7FAE82] outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#1C1B18] mb-1">
                          Warranty (Months)
                        </label>
                        <input
                          type="number"
                          value={formData.warrantyMonths}
                          onChange={(e) => setFormData({ ...formData, warrantyMonths: parseInt(e.target.value) || 0 })}
                          placeholder="12"
                          className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs bg-white focus:border-[#7FAE82] outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#1C1B18] mb-1">
                          Serial Number
                        </label>
                        <input
                          type="text"
                          value={formData.serialNumber}
                          onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                          placeholder="SN-..."
                          className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs bg-white focus:border-[#7FAE82] outline-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#1C1B18] mb-1">
                          IMEI (15 digits)
                        </label>
                        <input
                          type="text"
                          value={formData.imei}
                          onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
                          placeholder="354890123456789"
                          className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs bg-white focus:border-[#7FAE82] outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {isHardware && (
                  <div className="p-3.5 rounded-2xl bg-[#FAF6EF]/60 border border-[#EEE6DA] space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#1C1B18]">
                      <span>🔧 Yard & Location Storage</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#1C1B18] mb-1">
                          Warehouse
                        </label>
                        <input
                          type="text"
                          value={formData.warehouse}
                          onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                          placeholder="Main Yard / Godown 1"
                          className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs bg-white focus:border-[#7FAE82] outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#1C1B18] mb-1">
                          Rack / Bin Location
                        </label>
                        <input
                          type="text"
                          value={formData.rackLocation}
                          onChange={(e) => setFormData({ ...formData, rackLocation: e.target.value })}
                          placeholder="Aisle 3, Rack B-12"
                          className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs bg-white focus:border-[#7FAE82] outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#1C1B18] mb-1">
                          Wholesale Price (₹)
                        </label>
                        <input
                          type="number"
                          value={formData.wholesalePrice}
                          onChange={(e) => setFormData({ ...formData, wholesalePrice: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs bg-white focus:border-[#7FAE82] outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#1C1B18] mb-1">
                          Dealer Price (₹)
                        </label>
                        <input
                          type="number"
                          value={formData.dealerPrice}
                          onChange={(e) => setFormData({ ...formData, dealerPrice: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs bg-white focus:border-[#7FAE82] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {isWholesale && !isHardware && (
                  <div className="p-3.5 rounded-2xl bg-[#FAF6EF]/60 border border-[#EEE6DA] space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#1C1B18]">
                      <span>📦 B2B Wholesale Tiers</span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#1C1B18] mb-1">
                          Wholesale Price (₹)
                        </label>
                        <input
                          type="number"
                          value={formData.wholesalePrice}
                          onChange={(e) => setFormData({ ...formData, wholesalePrice: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs bg-white focus:border-[#7FAE82] outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#1C1B18] mb-1">
                          Min Order Qty (MOQ)
                        </label>
                        <input
                          type="number"
                          value={formData.wholesaleMinQuantity}
                          onChange={(e) => setFormData({ ...formData, wholesaleMinQuantity: parseInt(e.target.value) || 1 })}
                          className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs bg-white focus:border-[#7FAE82] outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#1C1B18] mb-1">
                          Dealer Price (₹)
                        </label>
                        <input
                          type="number"
                          value={formData.dealerPrice}
                          onChange={(e) => setFormData({ ...formData, dealerPrice: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs bg-white focus:border-[#7FAE82] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {isGrocery && !isPharmacy && (
                  <div className="p-3.5 rounded-2xl bg-[#FAF6EF]/60 border border-[#EEE6DA] space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#1C1B18]">
                      <span>🛒 Grocery Shelf-life</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#1C1B18] mb-1">
                          Weight / Volume (kg / L)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.weight}
                          onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
                          placeholder="e.g. 1.0"
                          className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs bg-white focus:border-[#7FAE82] outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#1C1B18] mb-1 text-[#D64545]">
                          Expiry Date
                        </label>
                        <input
                          type="date"
                          value={formData.expiryDate}
                          onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs bg-white focus:border-[#7FAE82] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                      Opening / Current Stock
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.stock}
                      onChange={(e) =>
                        setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs focus:border-[#7FAE82] outline-none tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                      Low-stock Alert Level
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formData.reorderLevel}
                      onChange={(e) =>
                        setFormData({ ...formData, reorderLevel: parseInt(e.target.value) || 1 })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs focus:border-[#7FAE82] outline-none tabular-nums"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                    Primary Supplier
                  </label>
                  <select
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs bg-white outline-none"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.contactPerson})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                    Description & Notes
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Product details, batch handling, specifications..."
                    className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs focus:border-[#7FAE82] outline-none resize-none"
                  />
                </div>
              </form>

              {/* Sticky Footer */}
              <div className="p-4 bg-[#FAF6EF] border-t border-[#EEE6DA] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddDrawerOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#381e12] hover:bg-[#26140c] text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="product-form"
                  className="px-5 py-2 rounded-xl bg-[#381e12] hover:bg-[#26140c] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </div>
          </div>
        </div>
        </Portal>
      )}

      {/* Stock Adjust Modal */}
      {adjustingProduct && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#EEE6DA] shadow-2xl p-5 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-semibold text-[#1C1B18] mb-1">
              Adjust Stock: {adjustingProduct.name}
            </h3>
            <p className="text-xs text-[#6B665E] mb-4">
              Current stock on hand: <span className="font-bold text-[#1C1B18]">{adjustingProduct.stock} {adjustingProduct.unit}</span>
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                  New Physical Count
                </label>
                <input
                  type="number"
                  min={0}
                  value={adjustStockValue}
                  onChange={(e) => setAdjustStockValue(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-sm font-bold tabular-nums outline-none focus:border-[#7FAE82]"
                />
                <div className="text-[11px] mt-1 text-[#6B665E]">
                  Variance:{' '}
                  <span
                    className={`font-semibold ${adjustStockValue - adjustingProduct.stock >= 0
                        ? 'text-[#2E8B57]'
                        : 'text-[#D64545]'
                      }`}
                  >
                    {adjustStockValue - adjustingProduct.stock >= 0 ? '+' : ''}
                    {adjustStockValue - adjustingProduct.stock} {adjustingProduct.unit}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                  Reason for Adjustment
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs bg-white outline-none"
                >
                  <option value="Correction">Physical Count Correction</option>
                  <option value="Damage">Damaged Goods</option>
                  <option value="Theft/Loss">Theft / Unaccounted Loss</option>
                  <option value="Gift/Sample">Customer Sample / Gift</option>
                  <option value="Internal Use">Internal Store Use</option>
                </select>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setAdjustingProduct(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#381e12] hover:bg-[#26140c] text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  adjustStock(adjustingProduct.id, adjustStockValue, adjustReason);
                  setAdjustingProduct(null);
                }}
                className="px-4 py-1.5 rounded-xl bg-[#381e12] text-white text-xs font-semibold hover:bg-[#26140c] cursor-pointer"
              >
                Apply Adjustment
              </button>
            </div>
          </div>
        </div>
        </Portal>
      )}

      {/* Product Detail Modal */}
      {viewingProduct && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-[#EEE6DA] shadow-2xl p-6 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#EEE6DA] pb-4 mb-4">
              <div className="flex items-center gap-3">
                <ProductIcon name={viewingProduct.name} type={viewingProduct.iconType} className="w-12 h-12 rounded-2xl bg-[#FAF6EF] text-[#6B665E] flex items-center justify-center border border-[#EEE6DA]" size={24} />
                <div>
                  <h3 className="text-lg font-bold text-[#1C1B18]">{viewingProduct.name}</h3>
                  <div className="text-xs text-[#6B665E]">
                    SKU: {viewingProduct.sku} · Barcode: {viewingProduct.barcode}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingProduct(null)}
                className="p-1 rounded-lg text-[#6B665E] hover:bg-[#FAF6EF]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              <div className="p-3.5 rounded-2xl bg-[#FAF6EF] border border-[#EEE6DA]">
                <div className="text-[11px] text-[#6B665E]">Current Stock</div>
                <div className="text-xl font-bold text-[#1C1B18] tabular-nums mt-0.5">
                  {viewingProduct.stock} {viewingProduct.unit}
                </div>
                <div className="text-[10px] text-[#D98E0B] mt-1 font-medium">
                  Reorder level: {viewingProduct.reorderLevel}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF6EF] border border-[#EEE6DA]">
                <div className="text-[11px] text-[#6B665E]">Selling Price</div>
                <div className="text-xl font-bold text-[#2E8B57] tabular-nums mt-0.5">
                  {formatINR(viewingProduct.sellingPrice)}
                </div>
                <div className="text-[10px] text-[#6B665E] mt-1">
                  Margin: {Math.round(((viewingProduct.sellingPrice - viewingProduct.purchasePrice) / viewingProduct.sellingPrice) * 100)}%
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF6EF] border border-[#EEE6DA]">
                <div className="text-[11px] text-[#6B665E]">Total Stock Value</div>
                <div className="text-xl font-bold text-[#1C1B18] tabular-nums mt-0.5">
                  {formatINR(viewingProduct.purchasePrice * viewingProduct.stock)}
                </div>
                <div className="text-[10px] text-[#6B665E] mt-1">
                  Cost: {formatINR(viewingProduct.purchasePrice)}/unit
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="text-xs font-semibold text-[#1C1B18] mb-1.5">Product Details</div>
                <div className="grid grid-cols-2 gap-2 text-[#6B665E] bg-white p-3 rounded-xl border border-[#EEE6DA]">
                  <div>Category: <span className="font-semibold text-[#1C1B18]">{viewingProduct.category}</span></div>
                  <div>Tax Rate: <span className="font-semibold text-[#1C1B18]">{viewingProduct.taxRate}% GST</span></div>
                  <div>Supplier: <span className="font-semibold text-[#1C1B18]">{viewingProduct.supplierName || 'Primary Supplier'}</span></div>
                  <div>Status: <span className="font-semibold text-[#2E8B57]">{viewingProduct.active ? 'Active' : 'Archived'}</span></div>
                </div>
              </div>

              {/* Industry / Batch / Compliance Details */}
              {(viewingProduct.batchNumber || viewingProduct.expiryDate || viewingProduct.mrp || viewingProduct.genericName || viewingProduct.brand || viewingProduct.rackLocation || viewingProduct.wholesalePrice) && (
                <div>
                  <div className="text-xs font-semibold text-[#1C1B18] mb-1.5">
                    Industry & Compliance Specifications
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[#6B665E] bg-[#FAF6EF]/50 p-3 rounded-xl border border-[#EEE6DA]">
                    {viewingProduct.mrp ? (
                      <div>MRP: <span className="font-bold text-[#1C1B18]">{formatINR(viewingProduct.mrp)}</span></div>
                    ) : null}
                    {viewingProduct.genericName ? (
                      <div>Generic Molecule: <span className="font-semibold text-[#7FAE82]">{viewingProduct.genericName}</span></div>
                    ) : null}
                    {viewingProduct.manufacturer ? (
                      <div>Manufacturer: <span className="font-semibold text-[#1C1B18]">{viewingProduct.manufacturer}</span></div>
                    ) : null}
                    {viewingProduct.batchNumber ? (
                      <div>Batch No: <span className="font-mono font-bold text-[#1C1B18]">{viewingProduct.batchNumber}</span></div>
                    ) : null}
                    {viewingProduct.expiryDate ? (
                      <div>
                        Expiry Date:{' '}
                        <span className="font-semibold text-[#D64545]">
                          {new Date(viewingProduct.expiryDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    ) : null}
                    {viewingProduct.manufacturingDate ? (
                      <div>
                        Mfg Date:{' '}
                        <span className="font-semibold text-[#1C1B18]">
                          {new Date(viewingProduct.manufacturingDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    ) : null}
                    {viewingProduct.brand ? (
                      <div>Brand: <span className="font-semibold text-[#1C1B18]">{viewingProduct.brand}</span></div>
                    ) : null}
                    {viewingProduct.size ? (
                      <div>Size: <span className="font-semibold text-[#1C1B18]">{viewingProduct.size}</span></div>
                    ) : null}
                    {viewingProduct.color ? (
                      <div>Color: <span className="font-semibold text-[#1C1B18]">{viewingProduct.color}</span></div>
                    ) : null}
                    {viewingProduct.rackLocation ? (
                      <div>Rack / Bin: <span className="font-semibold text-[#1C1B18]">{viewingProduct.rackLocation}</span></div>
                    ) : null}
                    {viewingProduct.wholesalePrice ? (
                      <div>Wholesale Price: <span className="font-bold text-[#1C1B18]">{formatINR(viewingProduct.wholesalePrice)}</span></div>
                    ) : null}
                  </div>
                </div>
              )}

              {viewingProduct.description && (
                <p className="text-xs text-[#6B665E] bg-[#FAF6EF]/50 p-3 rounded-xl border border-[#EEE6DA] mt-2">
                  {viewingProduct.description}
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setViewingProduct(null);
                  handleOpenEdit(viewingProduct);
                }}
                className="px-4 py-2 rounded-xl border border-[#EEE6DA] text-xs font-semibold text-[#1C1B18] hover:bg-[#FAF6EF]"
              >
                Edit Product
              </button>
              <button
                type="button"
                onClick={() => {
                  const p = viewingProduct;
                  setViewingProduct(null);
                  setAdjustingProduct(p);
                  setAdjustStockValue(p.stock);
                }}
                className="px-4 py-2 rounded-xl bg-[#381e12] text-white text-xs font-semibold hover:bg-[#26140c]"
              >
                Adjust Stock
              </button>
            </div>
          </div>
        </div>
        </Portal>
      )}
      {/* Bulk Import Modal (CSV & PDF) */}
      <BulkImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
};
