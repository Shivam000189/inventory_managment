import React, { useState } from 'react';
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
} from 'lucide-react';
import { ProductIcon } from '../components/common/ProductIcon';
import { Badge } from '../components/common/Badge';
import { BulkImportModal } from '../components/modals/BulkImportModal';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { formatINR, downloadCSV } from '../lib/formatters';

export const ProductsPage: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, adjustStock, suppliers } = useApp();

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'In stock' | 'Low' | 'Out'>('All');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

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
    category: 'Apparel',
    unit: 'pcs',
    purchasePrice: 100,
    sellingPrice: 199,
    taxRate: 18,
    stock: 10,
    reorderLevel: 10,
    supplierId: suppliers[0]?.id || '',
    description: '',
    active: true,
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

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      barcode: `890${Math.floor(100000000 + Math.random() * 900000000)}`,
      category: 'Apparel',
      unit: 'pcs',
      purchasePrice: 200,
      sellingPrice: 399,
      taxRate: 18,
      stock: 20,
      reorderLevel: 10,
      supplierId: suppliers[0]?.id || '',
      description: '',
      active: true,
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
      taxRate: p.taxRate,
      stock: p.stock,
      reorderLevel: p.reorderLevel,
      supplierId: p.supplierId,
      description: p.description || '',
      active: p.active,
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

  const toggleSelectAll = () => {
    if (selectedProductIds.length === filteredProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map((p) => p.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedProductIds.length} items?`)) {
      selectedProductIds.forEach((id) => deleteProduct(id));
      setSelectedProductIds([]);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150 pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold text-[#1C1B18] tracking-tight leading-tight">
            Products
          </h1>
          <p className="text-[13px] text-[#6B665E] mt-0.5">
            Manage your master catalog, stock levels, and pricing.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#EEE6DA] bg-white text-xs font-semibold text-[#1C1B18] hover:bg-[#FAF6EF] transition-colors cursor-pointer shadow-2xs"
          >
            <Download size={15} />
            <span>Export</span>
          </button>

          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#EEE6DA] bg-white text-xs font-semibold text-[#1C1B18] hover:bg-[#FAF6EF] transition-colors cursor-pointer shadow-2xs"
          >
            <Upload size={15} />
            <span>Bulk Import</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7FAE82] hover:bg-[#6C9C70] text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
          >
            <Plus size={16} />
            <span> Add product</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl p-3 border border-[#EEE6DA] flex flex-wrap items-center justify-between gap-3 shadow-2xs">
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
              <option key={c} value={c}>
                Category: {c}
              </option>
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
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${statusFilter === status
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
              className={`p-1.5 rounded-lg cursor-pointer ${viewMode === 'table' ? 'bg-white text-[#1C1B18] shadow-2xs' : 'text-[#6B665E]'
                }`}
              title="Table view"
            >
              <List size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg cursor-pointer ${viewMode === 'grid' ? 'bg-white text-[#1C1B18] shadow-2xs' : 'text-[#6B665E]'
                }`}
              title="Grid view"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedProductIds.length > 0 && (
        <div className="bg-[#FAF6EF] border border-[#DDD3C4] rounded-xl px-4 py-2.5 flex items-center justify-between animate-in fade-in duration-150">
          <div className="text-xs font-semibold text-[#1C1B18] flex items-center gap-2">
            <span>{selectedProductIds.length} products selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBulkDelete}
              className="px-3 py-1 rounded-lg bg-[#FDECEC] text-[#D64545] text-xs font-semibold hover:bg-[#fad4d4] transition-colors cursor-pointer flex items-center gap-1"
            >
              <Trash2 size={13} />
              <span>Delete Selected</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedProductIds([])}
              className="text-xs text-[#6B665E] hover:text-[#1C1B18] px-2 py-1 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Products Content: Table or Grid */}
      {filteredProducts.length === 0 ? (
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
            + Add New Product
          </button>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-[#EEE6DA] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF6EF] border-b border-[#EEE6DA] text-[#9A948A]">
                <tr>
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={
                        selectedProductIds.length === filteredProducts.length &&
                        filteredProducts.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="rounded border-[#DDD3C4] text-[#7FAE82] cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3 font-medium">Product</th>
                  <th className="py-3 px-3 font-medium">Category</th>
                  <th className="py-3 px-3 font-medium text-right">Purchase</th>
                  <th className="py-3 px-3 font-medium text-right">Selling</th>
                  <th className="py-3 px-3 font-medium">Stock Level</th>
                  <th className="py-3 px-3 font-medium text-center">Status</th>
                  <th className="py-3 px-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEE6DA]/80">
                {filteredProducts.map((p) => {
                  const isLow = p.stock > 0 && p.stock <= p.reorderLevel;
                  const isOut = p.stock === 0;
                  const statusVariant = isOut ? 'danger' : isLow ? 'warning' : 'success';
                  const statusText = isOut ? 'Out of stock' : isLow ? 'Low stock' : 'In stock';
                  const stockPercent = Math.min(100, Math.round((p.stock / (p.reorderLevel * 2.5)) * 100));

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-[#FAF6EF]/60 transition-colors group cursor-pointer"
                      onClick={() => setViewingProduct(p)}
                    >
                      <td
                        className="py-3 px-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectOne(p.id);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(p.id)}
                          onChange={() => { }}
                          className="rounded border-[#DDD3C4] text-[#7FAE82] cursor-pointer"
                        />
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <ProductIcon name={p.name} type={p.iconType} />
                          <div>
                            <div className="font-semibold text-[#1C1B18] text-[13px] group-hover:text-[#6C9C70] transition-colors">
                              {p.name}
                            </div>
                            <div className="text-[11px] text-[#9A948A]">
                              SKU: {p.sku} · Barcode: {p.barcode}
                            </div>
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

                      <td className="py-3 px-3 text-right font-bold text-[#1C1B18] tabular-nums">
                        {formatINR(p.sellingPrice)}
                      </td>

                      <td className="py-3 px-3 w-44">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-[#1C1B18] tabular-nums">
                            {p.stock} {p.unit}
                          </span>
                          <span className="text-[10.5px] text-[#9A948A]">
                            Min {p.reorderLevel}
                          </span>
                        </div>
                        <div className="w-full bg-[#EEE6DA] h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${isOut
                                ? 'bg-[#D64545]'
                                : isLow
                                  ? 'bg-[#E8772E]'
                                  : 'bg-[#7FAE82]'
                              }`}
                            style={{ width: `${Math.max(5, stockPercent)}%` }}
                          />
                        </div>
                      </td>

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
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((p) => {
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
                  <p className="text-[11px] text-[#9A948A] mt-0.5">
                    SKU: {p.sku} · {p.category}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#EEE6DA] flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-[#9A948A]">Price</div>
                    <div className="font-bold text-sm text-[#1C1B18] tabular-nums">
                      {formatINR(p.sellingPrice)}
                    </div>
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
      )}

      {/* Add / Edit Product Right Drawer (480px) */}
      {isAddDrawerOpen && (
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
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
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
                        <option key={c} value={c}>
                          {c}
                        </option>
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

                <div className="grid grid-cols-2 gap-3">
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
                </div>

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
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B665E] hover:text-[#1C1B18] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="product-form"
                  className="px-5 py-2 rounded-xl bg-[#7FAE82] hover:bg-[#6C9C70] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjust Modal */}
      {adjustingProduct && (
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
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#6B665E] hover:text-[#1C1B18]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  adjustStock(adjustingProduct.id, adjustStockValue, adjustReason);
                  setAdjustingProduct(null);
                }}
                className="px-4 py-1.5 rounded-xl bg-[#7FAE82] text-white text-xs font-semibold hover:bg-[#6C9C70] cursor-pointer"
              >
                Apply Adjustment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {viewingProduct && (
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

            <div className="space-y-2 text-xs">
              <div className="text-xs font-semibold text-[#1C1B18]">Product Details</div>
              <div className="grid grid-cols-2 gap-2 text-[#6B665E] bg-white p-3 rounded-xl border border-[#EEE6DA]">
                <div>Category: <span className="font-semibold text-[#1C1B18]">{viewingProduct.category}</span></div>
                <div>Tax Rate: <span className="font-semibold text-[#1C1B18]">{viewingProduct.taxRate}% GST</span></div>
                <div>Supplier: <span className="font-semibold text-[#1C1B18]">{viewingProduct.supplierName || 'Primary Supplier'}</span></div>
                <div>Status: <span className="font-semibold text-[#2E8B57]">{viewingProduct.active ? 'Active' : 'Archived'}</span></div>
              </div>
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
                className="px-4 py-2 rounded-xl bg-[#7FAE82] text-white text-xs font-semibold hover:bg-[#6C9C70]"
              >
                Adjust Stock
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Bulk Import Modal (CSV & PDF) */}
      <BulkImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
};
