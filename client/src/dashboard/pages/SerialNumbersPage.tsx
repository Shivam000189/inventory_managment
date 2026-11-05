import React, { useState, useMemo, useEffect } from 'react';
import {
  Barcode,
  Hash,
  Package,
  Layers,
  Search,
  Filter,
  Plus,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  X,
  Edit2,
  Truck,
  Warehouse,
  Clock,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { ProductIcon } from '../components/common/ProductIcon';
import { TableSkeleton } from '../../components/ui/Feedback';
import { useApp } from '../context/AppContext';
import { formatINR } from '../lib/formatters';

export interface SerialNumberItem {
  id: string;
  serialNumber: string;
  productId: string;
  productName: string;
  sku: string;
  category: string;
  status: 'available' | 'sold' | 'rma' | 'decommissioned';
  location: string;
  orderReference?: string;
  customerName?: string;
  registeredDate: string;
  notes?: string;
}

const DEFAULT_LOCATIONS = ['Main Warehouse', 'Storefront Shelf', 'Service / RMA Bay', 'Transit Hub'];

export const SerialNumbersPage: React.FC = () => {
  const { products, businessProfile, isLoadingBackend } = useApp();

  const [serialItems, setSerialItems] = useState<SerialNumberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SerialNumberItem | null>(null);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [serialInput, setSerialInput] = useState('');
  const [drawerStatus, setDrawerStatus] = useState<'available' | 'sold' | 'rma' | 'decommissioned'>('available');
  const [location, setLocation] = useState('Main Warehouse');
  const [orderRef, setOrderRef] = useState('');
  const [notes, setNotes] = useState('');
  const [drawerError, setDrawerError] = useState('');
  const [drawerSuccess, setDrawerSuccess] = useState('');

  // Initialize sample serialized units from products catalog or fallback
  useEffect(() => {
    setLoading(true);
    try {
      const generated: SerialNumberItem[] = [];
      const now = new Date();

      products.forEach((p, pIdx) => {
        const baseSerial = (p as any).serialNumber || `SN-${p.sku || 'PRD'}-${1000 + pIdx}`;
        // Generate 1 to 3 serial records per product
        const count = Math.min(3, Math.max(1, Math.floor((p.stock || 5) / 5)));
        for (let i = 1; i <= count; i++) {
          const isSold = (pIdx + i) % 4 === 0;
          const isRma = (pIdx + i) % 7 === 0;
          const status = isRma ? 'rma' : isSold ? 'sold' : 'available';
          const regDate = new Date(now.getTime() - (pIdx * 3 + i * 5) * 86400000).toISOString().slice(0, 10);

          generated.push({
            id: `sn-${p.id}-${i}`,
            serialNumber: count === 1 ? baseSerial : `${baseSerial}-${String(i).padStart(2, '0')}`,
            productId: p.id,
            productName: p.name,
            sku: p.sku || `SKU-${p.id.slice(-4)}`,
            category: p.category || 'Electronics & Hardware',
            status,
            location: status === 'rma' ? 'Service / RMA Bay' : status === 'sold' ? 'Customer Dispatched' : (pIdx % 2 === 0 ? 'Main Warehouse' : 'Storefront Shelf'),
            orderReference: isSold ? `ORD-${9800 + pIdx * 10 + i}` : undefined,
            customerName: isSold ? 'Retail Customer' : undefined,
            registeredDate: regDate,
            notes: (p as any).warrantyMonths ? `${(p as any).warrantyMonths}M Standard Warranty` : 'Verified unit tag',
          });
        }
      });

      if (generated.length === 0) {
        // Fallback default serialized items
        generated.push(
          {
            id: 'sn-sample-1',
            serialNumber: 'SN-ELC-89201-01',
            productId: 'prd-1',
            productName: 'Commercial Smart POS Terminal',
            sku: 'SKU-POS-900',
            category: 'Point of Sale & Terminals',
            status: 'available',
            location: 'Main Warehouse',
            registeredDate: '2026-10-15',
            notes: 'Factory calibrated unit',
          },
          {
            id: 'sn-sample-2',
            serialNumber: 'SN-ELC-89201-02',
            productId: 'prd-1',
            productName: 'Commercial Smart POS Terminal',
            sku: 'SKU-POS-900',
            category: 'Point of Sale & Terminals',
            status: 'sold',
            location: 'Customer Dispatched',
            orderReference: 'ORD-9842',
            customerName: 'Metro Hypermarket',
            registeredDate: '2026-10-18',
            notes: 'Dispatched via Express Courier',
          },
          {
            id: 'sn-sample-3',
            serialNumber: 'SN-BAR-49120-01',
            productId: 'prd-2',
            productName: 'Wireless Barcode Scanner 2D',
            sku: 'SKU-WLS-2D',
            category: 'Barcode Scanners',
            status: 'rma',
            location: 'Service / RMA Bay',
            orderReference: 'RMA-3021',
            registeredDate: '2026-09-28',
            notes: 'Laser alignment repair in progress',
          }
        );
      }

      setSerialItems(generated);
    } finally {
      setLoading(false);
    }
  }, [products]);

  // Computed metrics for 4 StatCards
  const totalUnits = serialItems.length;
  const availableCount = useMemo(() => {
    return serialItems.filter((i) => i.status === 'available').length;
  }, [serialItems]);

  const soldCount = useMemo(() => {
    return serialItems.filter((i) => i.status === 'sold').length;
  }, [serialItems]);

  const rmaCount = useMemo(() => {
    return serialItems.filter((i) => i.status === 'rma').length;
  }, [serialItems]);

  // Filtered rows
  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return serialItems.filter((item) => {
      const matchSearch =
        !q ||
        item.serialNumber.toLowerCase().includes(q) ||
        item.productName.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        (item.orderReference && item.orderReference.toLowerCase().includes(q)) ||
        (item.customerName && item.customerName.toLowerCase().includes(q));

      const matchStatus =
        statusFilter === 'All' ||
        item.status.toLowerCase() === statusFilter.toLowerCase();

      const matchLocation =
        locationFilter === 'All' ||
        item.location.toLowerCase() === locationFilter.toLowerCase();

      return matchSearch && matchStatus && matchLocation;
    });
  }, [serialItems, searchQuery, statusFilter, locationFilter]);

  // Drawer open / close handlers
  const handleOpenDrawer = (itemToEdit?: SerialNumberItem) => {
    if (itemToEdit) {
      setEditingItem(itemToEdit);
      setSelectedProductId(itemToEdit.productId);
      setSerialInput(itemToEdit.serialNumber);
      setDrawerStatus(itemToEdit.status);
      setLocation(itemToEdit.location);
      setOrderRef(itemToEdit.orderReference || '');
      setNotes(itemToEdit.notes || '');
    } else {
      setEditingItem(null);
      setSelectedProductId(products[0]?.id || '');
      setSerialInput(`SN-${Date.now().toString().slice(-6)}`);
      setDrawerStatus('available');
      setLocation('Main Warehouse');
      setOrderRef('');
      setNotes('');
    }
    setDrawerError('');
    setDrawerSuccess('');
    setIsDrawerOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDrawerError('');
    setDrawerSuccess('');

    if (!serialInput.trim()) {
      setDrawerError('Please enter a valid serial number or IMEI.');
      return;
    }

    const prod = products.find((p) => p.id === selectedProductId) || products[0];

    if (editingItem) {
      setSerialItems((prev) =>
        prev.map((i) =>
          i.id === editingItem.id
            ? {
                ...i,
                serialNumber: serialInput.trim().toUpperCase(),
                productId: selectedProductId,
                productName: prod ? prod.name : i.productName,
                sku: prod ? prod.sku : i.sku,
                status: drawerStatus,
                location: drawerStatus === 'sold' ? 'Customer Dispatched' : location,
                orderReference: orderRef.trim() || undefined,
                notes: notes.trim() || undefined,
              }
            : i
        )
      );
      setDrawerSuccess('Serial number record updated successfully!');
    } else {
      const newItem: SerialNumberItem = {
        id: `sn-${Date.now()}`,
        serialNumber: serialInput.trim().toUpperCase(),
        productId: selectedProductId,
        productName: prod ? prod.name : 'Serialized Equipment',
        sku: prod ? prod.sku : 'SKU-SN',
        category: prod ? prod.category : 'Electronics',
        status: drawerStatus,
        location: drawerStatus === 'sold' ? 'Customer Dispatched' : location,
        orderReference: orderRef.trim() || undefined,
        registeredDate: new Date().toISOString().slice(0, 10),
        notes: notes.trim() || undefined,
      };
      setSerialItems((prev) => [newItem, ...prev]);
      setDrawerSuccess('Serial number registered successfully!');
    }

    setTimeout(() => {
      setIsDrawerOpen(false);
    }, 900);
  };

  // CSV Export
  const exportCsv = () => {
    const rows = [
      ['Serial Number', 'Product Name', 'SKU', 'Category', 'Status', 'Location', 'Order Ref', 'Registered Date'],
      ...filteredItems.map((i) => [
        i.serialNumber,
        i.productName,
        i.sku,
        i.category,
        i.status,
        i.location,
        i.orderReference || '—',
        i.registeredDate,
      ]),
    ];
    const url = URL.createObjectURL(
      new Blob([rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\r\n')], {
        type: 'text/csv;charset=utf-8',
      })
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `serial-numbers-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold text-[#1C1B18] tracking-tight leading-tight">
            Serial Number Tracking
          </h1>
          <p className="text-[13px] text-[#6B665E] mt-0.5">
            Trace individual unit serial numbers (SN/IMEI), warranty bindings, and lifecycle states for {businessProfile?.name || 'your inventory'}.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-[#EBE8E2] bg-white text-xs font-semibold text-[#1C1B18] hover:bg-[#FAF9F7] transition-all cursor-pointer shadow-xs whitespace-nowrap active:scale-95"
          >
            <Printer size={15} />
            <span>Print</span>
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={filteredItems.length === 0}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#EBE8E2] bg-white text-xs font-semibold text-[#1C1B18] hover:bg-[#FAF9F7] transition-all cursor-pointer shadow-xs whitespace-nowrap active:scale-95 disabled:opacity-50"
          >
            <Download size={15} />
            <span>Export</span>
          </button>
          <button
            onClick={() => handleOpenDrawer()}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#381e12] hover:bg-[#2a160d] text-[#ffffff] font-medium text-[13px] rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <Plus size={16} className="text-[#ffffff]" />
            <span className="text-[#ffffff]">Register Serial Number</span>
          </button>
        </div>
      </div>

      {/* 4 StatCards matching Stock Ledger style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={<Barcode size={18} strokeWidth={2.2} />}
          iconBgColor="bg-[#EBF3FC] text-[#2563EB]"
          label="Total Serialized Units"
          value={totalUnits.toLocaleString('en-IN')}
          trend={`${totalUnits} registered equipment tags`}
          isPositive={true}
        />
        <StatCard
          icon={<CheckCircle2 size={18} strokeWidth={2} />}
          iconBgColor="bg-[#E6F1E6] text-[#2E8B57]"
          label="Available in Stock"
          value={availableCount.toLocaleString('en-IN')}
          trend="Ready for dispatch / sale"
          isPositive={true}
        />
        <StatCard
          icon={<Truck size={18} strokeWidth={2} />}
          iconBgColor="bg-[#FAF6EF] text-[#6B665E]"
          label="Sold / Dispatched"
          value={soldCount.toLocaleString('en-IN')}
          trend="Assigned to customers"
          isPositive={true}
        />
        <StatCard
          icon={<AlertTriangle size={18} strokeWidth={2} />}
          iconBgColor="bg-[#FEF3C7] text-[#D97706]"
          label="Under Service / RMA"
          value={rmaCount}
          trend="In repair or diagnosis"
          isPositive={false}
        />
      </div>

      {/* Filter and Search Bar (Dropdown alongside Search) */}
      <div className="bg-white rounded-xl border border-[#EBE8E2] p-3.5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box & Dropdowns */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 max-w-2xl">
            {/* Search Box */}
            <div className="relative flex-1 min-w-[240px]">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C827A]"
              />
              <input
                type="text"
                placeholder="Search serial #, IMEI, product name, order ref..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#FAF9F7] text-[13px] border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18] placeholder-[#8C827A] transition-all"
              />
            </div>

            {/* Status Dropdown */}
            <div className="relative sm:w-44">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C827A] pointer-events-none">
                <Filter size={14} />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-8 pr-8 py-2 bg-[#FAF9F7] text-[13px] font-medium border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18] cursor-pointer transition-all appearance-none"
              >
                <option value="All">All Statuses</option>
                <option value="available">Available in Stock</option>
                <option value="sold">Sold / Dispatched</option>
                <option value="rma">Under RMA / Service</option>
                <option value="decommissioned">Decommissioned</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C827A] pointer-events-none text-[9px]">
                ▼
              </div>
            </div>

            {/* Location Dropdown */}
            <div className="relative sm:w-44">
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full pl-3 pr-8 py-2 bg-[#FAF9F7] text-[13px] font-medium border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18] cursor-pointer transition-all appearance-none"
              >
                <option value="All">All Locations</option>
                {DEFAULT_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C827A] pointer-events-none text-[9px]">
                ▼
              </div>
            </div>
          </div>

          {/* Reset button */}
          {(searchQuery || statusFilter !== 'All' || locationFilter !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('All');
                setLocationFilter('All');
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
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-[#EBF3FC] text-[#2563EB] flex items-center justify-center mx-auto mb-3">
              <Barcode size={24} />
            </div>
            <h3 className="text-[16px] font-semibold text-[#1C1B18]">No Serial Numbers Found</h3>
            <p className="text-[13px] text-[#8C827A] mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'All' || locationFilter !== 'All'
                ? 'Try adjusting your search query or location/status filter.'
                : 'No serial numbers registered yet. Click "Register Serial Number" to catalog your first unit.'}
            </p>
            <button
              onClick={() => handleOpenDrawer()}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#381e12] hover:bg-[#2a160d] text-[#ffffff] font-medium text-[13px] rounded-lg transition-colors cursor-pointer"
            >
              <Plus size={15} className="text-[#ffffff]" />
              <span className="text-[#ffffff]">Register First Serial #</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF6F0] border-b border-[#EBE8E2]">
                  <th className="py-3.5 px-4 text-[11px] font-bold text-[#8C7E74] uppercase tracking-wider">
                    Serial Number / IMEI
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-bold text-[#8C7E74] uppercase tracking-wider">
                    Product & Model
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-bold text-[#8C7E74] uppercase tracking-wider">
                    Warehouse Location
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-bold text-[#8C7E74] uppercase tracking-wider">
                    Customer / Order Ref
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-bold text-[#8C7E74] uppercase tracking-wider">
                    Date Logged
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-bold text-[#8C7E74] uppercase tracking-wider text-center">
                    Status
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-bold text-[#8C7E74] uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EDE8]">
                {filteredItems.map((item, index) => {
                  const isAvail = item.status === 'available';
                  const isSold = item.status === 'sold';
                  const isRma = item.status === 'rma';

                  return (
                    <tr
                      key={item.id || `sn-${index}`}
                      className="hover:bg-[#FAF9F7] transition-colors"
                    >
                      {/* Serial Number */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[13px] font-bold text-[#1C1B18] bg-[#FAF6F0] px-2.5 py-1 rounded border border-[#EBE8E2] flex items-center gap-1.5">
                            <Barcode size={14} className="text-[#8C827A]" />
                            {item.serialNumber}
                          </span>
                        </div>
                      </td>

                      {/* Product Name & SKU */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <ProductIcon name={item.productName} className="w-8 h-8 shrink-0" />
                          <div>
                            <div className="text-[13px] font-semibold text-[#1C1B18]">
                              {item.productName}
                            </div>
                            <div className="text-[11px] text-[#8C827A] font-mono">
                              {item.sku} · {item.category}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 text-[12px] text-[#4A443F]">
                          <Warehouse size={13} className="text-[#8C827A]" />
                          {item.location}
                        </span>
                      </td>

                      {/* Order Ref */}
                      <td className="py-3 px-4 text-[12px]">
                        {item.orderReference ? (
                          <div>
                            <span className="font-mono font-bold text-[#2563EB] bg-[#EBF3FC] px-1.5 py-0.5 rounded border border-[#BFDBFE]">
                              {item.orderReference}
                            </span>
                            {item.customerName && (
                              <div className="text-[11px] text-[#8C827A] mt-0.5">
                                {item.customerName}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[#8C827A]">Unassigned (In Store)</span>
                        )}
                      </td>

                      {/* Date Logged */}
                      <td className="py-3 px-4 text-[12px] text-[#6B665E]">
                        {item.registeredDate}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={isAvail ? 'success' : isSold ? 'info' : isRma ? 'warning' : 'neutral'}
                          className="capitalize text-[11px]"
                        >
                          {isAvail ? 'Available' : isSold ? 'Sold' : isRma ? 'Under RMA' : 'Decommissioned'}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenDrawer(item)}
                          className="p-1.5 text-[#6B665E] hover:text-[#381e12] hover:bg-[#F3EFEA] rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 text-[12px] font-medium"
                          title="Edit serial number"
                        >
                          <Edit2 size={13} />
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

      {/* Slide-over Right Drawer for Serial Number Registration */}
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
                    {editingItem ? 'Edit Serial Number' : 'Register Serial Number'}
                  </h2>
                  <p className="text-[12px] text-[#6B665E] mt-0.5">
                    {editingItem
                      ? `Update serial tag ${editingItem.serialNumber}`
                      : 'Bind a unique unit serial / IMEI tag to catalog inventory'}
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
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
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

                {/* Product Selection */}
                <div>
                  <label className="block text-[12px] font-medium text-[#1C1B18] mb-1.5">
                    Product / Model <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#FAF9F7] text-[13px] border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18] cursor-pointer"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku || 'No SKU'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Serial Number / IMEI Input */}
                <div>
                  <label className="block text-[12px] font-medium text-[#1C1B18] mb-1.5">
                    Serial Number / IMEI <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SN-8942-0192, IMEI: 8691029301923"
                    value={serialInput}
                    onChange={(e) => setSerialInput(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-[#FAF9F7] font-mono text-[13px] font-bold border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18]"
                  />
                  <p className="text-[11px] text-[#8C827A] mt-1">
                    Unique hardware identifier affixed to the product chassis or box.
                  </p>
                </div>

                {/* Status Selection */}
                <div>
                  <label className="block text-[12px] font-medium text-[#1C1B18] mb-1.5">
                    Unit Lifecycle State
                  </label>
                  <select
                    value={drawerStatus}
                    onChange={(e) => setDrawerStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#FAF9F7] text-[13px] border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18] cursor-pointer"
                  >
                    <option value="available">Available in Stock</option>
                    <option value="sold">Sold / Dispatched to Customer</option>
                    <option value="rma">Under RMA / Technical Service</option>
                    <option value="decommissioned">Decommissioned / Scrapped</option>
                  </select>
                </div>

                {/* Storage Location */}
                <div>
                  <label className="block text-[12px] font-medium text-[#1C1B18] mb-1.5">
                    Warehouse / Storage Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Main Warehouse Bin B-12"
                    className="w-full px-3 py-2 bg-[#FAF9F7] text-[13px] border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18]"
                  />
                </div>

                {/* Order / Invoice Ref */}
                <div>
                  <label className="block text-[12px] font-medium text-[#1C1B18] mb-1.5">
                    Sales Order / Invoice Ref (Optional)
                  </label>
                  <input
                    type="text"
                    value={orderRef}
                    onChange={(e) => setOrderRef(e.target.value.toUpperCase())}
                    placeholder="e.g. ORD-9842 or INV-2026-004"
                    className="w-full px-3 py-2 bg-[#FAF9F7] font-mono text-[13px] border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18]"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[12px] font-medium text-[#1C1B18] mb-1.5">
                    Inspection Notes / Remarks
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Tested firmware v2.4, accessories included in box..."
                    className="w-full px-3 py-2 bg-[#FAF9F7] text-[13px] border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18]"
                  />
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
                    <span className="text-[#ffffff]">
                      {editingItem ? 'Update Serial #' : 'Register Unit'}
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
