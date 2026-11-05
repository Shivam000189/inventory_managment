import React, { useState, useMemo, useEffect } from 'react';
import {
  Package,
  Layers,
  AlertTriangle,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Minus,
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

interface StockMovementsPageProps {
  initialTab?: 'inward' | 'outward' | 'catalog';
}

export const StockMovementsPage: React.FC<StockMovementsPageProps> = ({ initialTab }) => {
  const {
    products,
    stockMovements,
    stockIn,
    stockOut,
    suppliers,
    customers,
    currentUser,
    businessProfile,
    isLoadingBackend,
    navigate,
  } = useApp();

  // Detect route to set initial tab if not passed explicitly
  const defaultTab = useMemo<'inward' | 'outward' | 'catalog'>(() => {
    if (initialTab) return initialTab;
    if (typeof window !== 'undefined') {
      if (window.location.pathname.includes('stock-out')) return 'outward';
      if (window.location.pathname.includes('stock-in')) return 'inward';
    }
    return 'inward';
  }, [initialTab]);

  const [activeTab, setActiveTab] = useState<'inward' | 'outward' | 'catalog'>(defaultTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterReason, setFilterReason] = useState('All');

  // Synchronize tab if initialTab or route changes
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  // Drawer state for recording Inward or Outward
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState<'inward' | 'outward'>('inward');
  const [drawerProductId, setDrawerProductId] = useState('');
  const [drawerQuantity, setDrawerQuantity] = useState<number>(1);
  const [drawerPartner, setDrawerPartner] = useState('');
  const [drawerReference, setDrawerReference] = useState('');
  const [drawerReason, setDrawerReason] = useState('');
  const [drawerError, setDrawerError] = useState('');

  // Pre-selected product in drawer
  const selectedProduct = useMemo(
    () => products.find((p) => p.id === drawerProductId) || products[0],
    [products, drawerProductId]
  );

  // Inward & Outward movement sets
  const inwardMovements = useMemo(
    () => stockMovements.filter((m) => m.type === 'Stock In' || m.type === 'Purchase' || m.qtyDelta > 0),
    [stockMovements]
  );

  const outwardMovements = useMemo(
    () => stockMovements.filter((m) => m.type === 'Stock Out' || m.type === 'Sale' || m.qtyDelta < 0),
    [stockMovements]
  );

  // Computed KPIs
  const totalUnitsOnHand = useMemo(() => products.reduce((acc, p) => acc + p.stock, 0), [products]);
  const totalStockValue = useMemo(() => products.reduce((acc, p) => acc + p.stock * p.purchasePrice, 0), [products]);
  const lowStockItems = useMemo(() => products.filter((p) => p.stock > 0 && p.stock <= p.reorderLevel), [products]);
  const outOfStockItems = useMemo(() => products.filter((p) => p.stock === 0), [products]);

  const totalInwardUnits = useMemo(
    () => inwardMovements.reduce((acc, m) => acc + Math.abs(m.qtyDelta), 0),
    [inwardMovements]
  );
  const totalInwardValue = useMemo(
    () => inwardMovements.reduce((acc, m) => acc + (m.amount || Math.abs(m.qtyDelta) * 150), 0),
    [inwardMovements]
  );

  const totalOutwardUnits = useMemo(
    () => outwardMovements.reduce((acc, m) => acc + Math.abs(m.qtyDelta), 0),
    [outwardMovements]
  );
  const totalOutwardValue = useMemo(
    () => outwardMovements.reduce((acc, m) => acc + (m.amount || Math.abs(m.qtyDelta) * 200), 0),
    [outwardMovements]
  );

  // Filtered movements for Inward tab
  const filteredInward = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return inwardMovements.filter((m) => {
      const matchSearch =
        !q ||
        m.productName.toLowerCase().includes(q) ||
        (m.sku && m.sku.toLowerCase().includes(q)) ||
        m.reference.toLowerCase().includes(q) ||
        m.user.toLowerCase().includes(q);
      const matchReason = filterReason === 'All' || m.type === filterReason || m.reference.includes(filterReason);
      return matchSearch && matchReason;
    });
  }, [inwardMovements, searchQuery, filterReason]);

  // Filtered movements for Outward tab
  const filteredOutward = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return outwardMovements.filter((m) => {
      const matchSearch =
        !q ||
        m.productName.toLowerCase().includes(q) ||
        (m.sku && m.sku.toLowerCase().includes(q)) ||
        m.reference.toLowerCase().includes(q) ||
        m.user.toLowerCase().includes(q);
      const matchReason = filterReason === 'All' || m.type === filterReason || m.reference.includes(filterReason);
      return matchSearch && matchReason;
    });
  }, [outwardMovements, searchQuery, filterReason]);

  // Filtered products for Catalog tab
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      return (
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [products, searchQuery]);

  // Handle open drawer
  const handleOpenDrawer = (type: 'inward' | 'outward', productId?: string) => {
    setDrawerType(type);
    const targetProduct = productId ? products.find((p) => p.id === productId) : products[0];
    setDrawerProductId(targetProduct?.id || products[0]?.id || '');
    setDrawerQuantity(1);
    setDrawerPartner('');
    setDrawerReference(
      type === 'inward'
        ? `IN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
        : `OUT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
    );
    setDrawerReason(type === 'inward' ? 'Supplier Receipt' : 'Sales Dispatch');
    setDrawerError('');
    setIsDrawerOpen(true);
  };

  // Submit drawer movement
  const handleRecordMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!drawerProductId) {
      setDrawerError('Please select a valid product.');
      return;
    }
    if (drawerQuantity <= 0) {
      setDrawerError('Quantity must be greater than zero.');
      return;
    }

    const currentProd = products.find((p) => p.id === drawerProductId);
    if (!currentProd) {
      setDrawerError('Product not found.');
      return;
    }

    if (drawerType === 'outward' && drawerQuantity > currentProd.stock && !businessProfile?.allowNegativeStock) {
      setDrawerError(
        `Insufficient stock! Available on hand: ${currentProd.stock} ${currentProd.unit}. You cannot dispatch ${drawerQuantity} ${currentProd.unit}.`
      );
      return;
    }

    if (drawerType === 'inward') {
      stockIn(
        drawerProductId,
        drawerQuantity,
        drawerReference || 'STK-IN',
        `${drawerReason}${drawerPartner ? ` (${drawerPartner})` : ''}`
      );
    } else {
      stockOut(
        drawerProductId,
        drawerQuantity,
        drawerReason || 'Dispatch',
        `${drawerReference}${drawerPartner ? ` · To: ${drawerPartner}` : ''}`
      );
    }

    setIsDrawerOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold text-[#1C1B18] tracking-tight leading-tight">
            {activeTab === 'inward'
              ? 'Stock Inward'
              : activeTab === 'outward'
                ? 'Stock Outward'
                : 'Stock Movements & Catalog'}
          </h1>
          <p className="text-[13px] text-[#6B665E] mt-0.5">
            {activeTab === 'inward'
              ? 'Record incoming shipments, vendor receipts, and warehouse intake.'
              : activeTab === 'outward'
                ? 'Record goods dispatch, sales fulfillment, and stock reductions.'
                : 'Monitor on-hand inventory balances, intake thresholds, and movement audit history.'}
          </p>
        </div>

        {/* Top Action Buttons (Styled in #381e12 with pure white text) */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleOpenDrawer('inward')}
            className="flex items-center gap-2 px-4 py-2 bg-[#381e12] !text-white text-xs font-semibold rounded-xl hover:bg-[#26140c] shadow-sm cursor-pointer transition-colors"
          >
            <ArrowDownLeft size={15} />
            <span>Record Stock Inward</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenDrawer('outward')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#EEE6DA] text-[#1C1B18] hover:bg-[#FAF6EF] text-xs font-semibold rounded-xl shadow-2xs cursor-pointer transition-colors"
          >
            <ArrowUpRight size={15} className="text-[#D64545]" />
            <span>Record Stock Outward</span>
          </button>
        </div>
      </div>

      {/* 4 StatCards (Matching Stock Ledger Component & Color Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {activeTab === 'inward' ? (
          <>
            <StatCard
              icon={<ArrowDownLeft size={18} strokeWidth={2.2} />}
              iconBgColor="bg-[#E6F1E6] text-[#2E8B57]"
              label="Total Inward Units"
              value={totalInwardUnits.toLocaleString('en-IN')}
              trend={`${inwardMovements.length} receipts logged`}
              isPositive={true}
            />
            <StatCard
              icon={<Layers size={18} strokeWidth={2} />}
              iconBgColor="bg-[#E6F1E6] text-[#2E8B57]"
              label="Inward Stock Value"
              value={formatINR(totalInwardValue)}
              trend="Supplier purchases"
              isPositive={true}
            />
            <StatCard
              icon={<AlertTriangle size={18} strokeWidth={2} />}
              iconBgColor="bg-[#FDEEE3] text-[#E8772E]"
              label="Low Stock Items"
              value={lowStockItems.length}
              trend={`${lowStockItems.length} need inward intake`}
              isPositive={false}
              onClick={() => setActiveTab('catalog')}
            />
            <StatCard
              icon={<Package size={18} strokeWidth={2} />}
              iconBgColor="bg-[#FAF6EF] text-[#6B665E]"
              label="Current Total on Hand"
              value={totalUnitsOnHand.toLocaleString('en-IN')}
              trend={`${products.length} distinct SKUs`}
              isPositive={true}
            />
          </>
        ) : activeTab === 'outward' ? (
          <>
            <StatCard
              icon={<ArrowUpRight size={18} strokeWidth={2.2} />}
              iconBgColor="bg-[#EAF1FB] text-[#2563EB]"
              label="Total Outward Units"
              value={totalOutwardUnits.toLocaleString('en-IN')}
              trend={`${outwardMovements.length} dispatches logged`}
              isPositive={true}
            />
            <StatCard
              icon={<Layers size={18} strokeWidth={2} />}
              iconBgColor="bg-[#EAF1FB] text-[#2563EB]"
              label="Outward Stock Value"
              value={formatINR(totalOutwardValue)}
              trend="Sales & orders issued"
              isPositive={true}
            />
            <StatCard
              icon={<AlertTriangle size={18} strokeWidth={2} />}
              iconBgColor="bg-[#FDECEC] text-[#D64545]"
              label="Out of Stock Items"
              value={outOfStockItems.length}
              trend={outOfStockItems.length === 0 ? 'No shortages' : 'Blocked from dispatch'}
              isPositive={outOfStockItems.length === 0}
              onClick={() => setActiveTab('catalog')}
            />
            <StatCard
              icon={<Package size={18} strokeWidth={2} />}
              iconBgColor="bg-[#FAF6EF] text-[#6B665E]"
              label="Current Total on Hand"
              value={totalUnitsOnHand.toLocaleString('en-IN')}
              trend={formatINR(totalStockValue)}
              isPositive={true}
            />
          </>
        ) : (
          <>
            <StatCard
              icon={<Package size={18} strokeWidth={2} />}
              iconBgColor="bg-[#E6F1E6] text-[#2E8B57]"
              label="Total Units on Hand"
              value={totalUnitsOnHand.toLocaleString('en-IN')}
              trend={`${products.length} catalog items`}
              isPositive={true}
            />
            <StatCard
              icon={<Layers size={18} strokeWidth={2} />}
              iconBgColor="bg-[#E6F1E6] text-[#2E8B57]"
              label="Total Inventory Value"
              value={formatINR(totalStockValue)}
              trend="Cost basis"
              isPositive={true}
            />
            <StatCard
              icon={<AlertTriangle size={18} strokeWidth={2} />}
              iconBgColor="bg-[#FDEEE3] text-[#E8772E]"
              label="Low Stock Items"
              value={lowStockItems.length}
              trend={`${lowStockItems.length} need replenishment`}
              isPositive={false}
            />
            <StatCard
              icon={<AlertTriangle size={18} strokeWidth={2} />}
              iconBgColor="bg-[#FDECEC] text-[#D64545]"
              label="Out of Stock"
              value={outOfStockItems.length}
              trend={outOfStockItems.length === 0 ? 'Optimal' : 'Action needed'}
              isPositive={outOfStockItems.length === 0}
            />
          </>
        )}
      </div>

      {/* Tabs Bar (Stock Ledger Component Style) */}
      <div className="flex items-center justify-between border-b border-[#EEE6DA]">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab('inward');
              setFilterReason('All');
            }}
            className={`pb-3 text-sm font-semibold transition-colors cursor-pointer border-b-2 -mb-px flex items-center gap-2 ${
              activeTab === 'inward'
                ? 'border-[#2E8B57] text-[#1C1B18]'
                : 'border-transparent text-[#6B665E] hover:text-[#1C1B18]'
            }`}
          >
            <ArrowDownLeft size={16} className={activeTab === 'inward' ? 'text-[#2E8B57]' : 'text-[#9A948A]'} />
            <span>Stock Inward Movements ({inwardMovements.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('outward');
              setFilterReason('All');
            }}
            className={`pb-3 text-sm font-semibold transition-colors cursor-pointer border-b-2 -mb-px flex items-center gap-2 ${
              activeTab === 'outward'
                ? 'border-[#D64545] text-[#1C1B18]'
                : 'border-transparent text-[#6B665E] hover:text-[#1C1B18]'
            }`}
          >
            <ArrowUpRight size={16} className={activeTab === 'outward' ? 'text-[#D64545]' : 'text-[#9A948A]'} />
            <span>Stock Outward Movements ({outwardMovements.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('catalog');
              setFilterReason('All');
            }}
            className={`pb-3 text-sm font-semibold transition-colors cursor-pointer border-b-2 -mb-px flex items-center gap-2 ${
              activeTab === 'catalog'
                ? 'border-[#7FAE82] text-[#1C1B18]'
                : 'border-transparent text-[#6B665E] hover:text-[#1C1B18]'
            }`}
          >
            <Package size={16} className={activeTab === 'catalog' ? 'text-[#7FAE82]' : 'text-[#9A948A]'} />
            <span>Product Catalog &amp; On-Hand ({products.length})</span>
          </button>
        </div>

        {/* Tab Search */}
        <div className="relative w-64 mb-2">
          <Search size={14} className="absolute left-3 top-2.5 text-[#9A948A]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'catalog'
                ? 'Search products or SKU...'
                : 'Filter movements or reference...'
            }
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#EEE6DA] text-xs bg-white outline-none focus:border-[#7FAE82]"
          />
        </div>
      </div>

      {/* Filter Reason Pills for Movements */}
      {activeTab !== 'catalog' && (
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-[#EEE6DA] w-fit overflow-x-auto">
          {(activeTab === 'inward'
            ? ['All', 'Stock In', 'Purchase', 'Supplier Receipt', 'Return Inward', 'Correction']
            : ['All', 'Stock Out', 'Sale', 'Sales Dispatch', 'Damaged', 'Loss', 'Adjustment']
          ).map((reason) => (
            <button
              key={reason}
              type="button"
              onClick={() => setFilterReason(reason)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                filterReason === reason
                  ? 'bg-[#FAF6EF] text-[#1C1B18] border border-[#DDD3C4]'
                  : 'text-[#6B665E] hover:text-[#1C1B18]'
              }`}
            >
              {reason}
            </button>
          ))}
        </div>
      )}

      {/* Tab 1: Stock Inward Table */}
      {activeTab === 'inward' && (
        isLoadingBackend && inwardMovements.length === 0 ? (
          <TableSkeleton
            columns={[
              { title: 'Date & Time', width: '18%' },
              { title: 'Product', width: '26%' },
              { title: 'Inward Qty', width: '14%', align: 'center' },
              { title: 'Balance After', width: '14%', align: 'center' },
              { title: 'Reference / Invoice', width: '14%' },
              { title: 'Recorded By', width: '14%', align: 'right' },
            ]}
            rows={6}
          />
        ) : filteredInward.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#EEE6DA] p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-[#E6F1E6] text-[#2E8B57] flex items-center justify-center mx-auto mb-3">
              <ArrowDownLeft size={24} />
            </div>
            <h3 className="text-base font-semibold text-[#1C1B18]">No inward stock movements found</h3>
            <p className="text-xs text-[#6B665E] mt-1 max-w-sm mx-auto">
              Record incoming shipments, supplier receipts, and purchase intakes to build your inward ledger.
            </p>
            <button
              type="button"
              onClick={() => handleOpenDrawer('inward')}
              className="mt-4 px-4 py-2 bg-[#381e12] !text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2 hover:bg-[#26140c] cursor-pointer"
            >
              <Plus size={14} />
              <span>Record First Inward Shipment</span>
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#EEE6DA] overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[760px]">
                <thead className="sticky top-0 z-10 bg-[#FAF6EF] border-b border-[#EEE6DA] text-[#8C867A] text-[11px] font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 font-medium">Date &amp; Time</th>
                    <th className="py-3 px-3 font-medium">Product</th>
                    <th className="py-3 px-3 font-medium text-center">Inward Quantity</th>
                    <th className="py-3 px-3 font-medium text-center">Balance After</th>
                    <th className="py-3 px-3 font-medium">Reference &amp; Reason</th>
                    <th className="py-3 px-4 font-medium text-right">Recorded By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEE6DA]/80">
                  {filteredInward.map((m) => {
                    const prod = products.find((p) => p.id === m.productId);
                    return (
                      <tr key={m.id} className="hover:bg-[#FAF6EF]/60 transition-colors">
                        <td className="py-3 px-4 text-[#6B665E] whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Clock size={13} className="text-[#9A948A]" />
                            <span>{m.date}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <ProductIcon name={m.productName} type={prod?.iconType} />
                            <div>
                              <div className="font-semibold text-[#1C1B18] text-[13px]">{m.productName}</div>
                              <div className="text-[11px] text-[#9A948A]">
                                SKU: {m.sku || prod?.sku || 'N/A'} {prod?.category ? `· ${prod.category}` : ''}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-bold text-sm text-[#2E8B57] tabular-nums inline-flex items-center gap-0.5">
                            +{Math.abs(m.qtyDelta)} <span className="text-xs font-normal opacity-80">{prod?.unit || 'pcs'}</span>
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-sm text-[#1C1B18] tabular-nums">
                          {m.balanceAfter} <span className="text-xs font-normal text-[#6B665E]">{prod?.unit || 'pcs'}</span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-[#1C1B18] text-xs">{m.reference}</span>
                            <span className="text-[11px] text-[#6B665E]">
                              <Badge variant="success" className="text-[10px] py-0 px-1.5 mr-1">
                                Inward
                              </Badge>
                              {m.type}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="inline-flex items-center gap-1.5 text-xs text-[#1C1B18] font-medium">
                            <span className="w-5 h-5 rounded-full bg-[#E6F1E6] text-[#2E8B57] text-[10px] font-bold flex items-center justify-center">
                              {m.user?.slice(0, 1).toUpperCase() || 'U'}
                            </span>
                            {m.user || 'Admin'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Tab 2: Stock Outward Table */}
      {activeTab === 'outward' && (
        isLoadingBackend && outwardMovements.length === 0 ? (
          <TableSkeleton
            columns={[
              { title: 'Date & Time', width: '18%' },
              { title: 'Product', width: '26%' },
              { title: 'Outward Qty', width: '14%', align: 'center' },
              { title: 'Balance After', width: '14%', align: 'center' },
              { title: 'Reference / Order', width: '14%' },
              { title: 'Recorded By', width: '14%', align: 'right' },
            ]}
            rows={6}
          />
        ) : filteredOutward.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#EEE6DA] p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-[#FDECEC] text-[#D64545] flex items-center justify-center mx-auto mb-3">
              <ArrowUpRight size={24} />
            </div>
            <h3 className="text-base font-semibold text-[#1C1B18]">No outward dispatch movements found</h3>
            <p className="text-xs text-[#6B665E] mt-1 max-w-sm mx-auto">
              Sales, dispatches, and warehouse distributions will automatically be logged here.
            </p>
            <button
              type="button"
              onClick={() => handleOpenDrawer('outward')}
              className="mt-4 px-4 py-2 bg-[#381e12] !text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2 hover:bg-[#26140c] cursor-pointer"
            >
              <Minus size={14} />
              <span>Record First Outward Dispatch</span>
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#EEE6DA] overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[760px]">
                <thead className="sticky top-0 z-10 bg-[#FAF6EF] border-b border-[#EEE6DA] text-[#8C867A] text-[11px] font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 font-medium">Date &amp; Time</th>
                    <th className="py-3 px-3 font-medium">Product</th>
                    <th className="py-3 px-3 font-medium text-center">Outward Quantity</th>
                    <th className="py-3 px-3 font-medium text-center">Balance After</th>
                    <th className="py-3 px-3 font-medium">Reference &amp; Reason</th>
                    <th className="py-3 px-4 font-medium text-right">Recorded By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEE6DA]/80">
                  {filteredOutward.map((m) => {
                    const prod = products.find((p) => p.id === m.productId);
                    return (
                      <tr key={m.id} className="hover:bg-[#FAF6EF]/60 transition-colors">
                        <td className="py-3 px-4 text-[#6B665E] whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Clock size={13} className="text-[#9A948A]" />
                            <span>{m.date}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <ProductIcon name={m.productName} type={prod?.iconType} />
                            <div>
                              <div className="font-semibold text-[#1C1B18] text-[13px]">{m.productName}</div>
                              <div className="text-[11px] text-[#9A948A]">
                                SKU: {m.sku || prod?.sku || 'N/A'} {prod?.category ? `· ${prod.category}` : ''}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-bold text-sm text-[#D64545] tabular-nums inline-flex items-center gap-0.5">
                            -{Math.abs(m.qtyDelta)} <span className="text-xs font-normal opacity-80">{prod?.unit || 'pcs'}</span>
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-sm text-[#1C1B18] tabular-nums">
                          {m.balanceAfter} <span className="text-xs font-normal text-[#6B665E]">{prod?.unit || 'pcs'}</span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-[#1C1B18] text-xs">{m.reference}</span>
                            <span className="text-[11px] text-[#6B665E]">
                              <Badge variant="danger" className="text-[10px] py-0 px-1.5 mr-1">
                                Outward
                              </Badge>
                              {m.type}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="inline-flex items-center gap-1.5 text-xs text-[#1C1B18] font-medium">
                            <span className="w-5 h-5 rounded-full bg-[#FDECEC] text-[#D64545] text-[10px] font-bold flex items-center justify-center">
                              {m.user?.slice(0, 1).toUpperCase() || 'U'}
                            </span>
                            {m.user || 'Admin'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Tab 3: Product Catalog & On-Hand Quick Action Table */}
      {activeTab === 'catalog' && (
        <div className="bg-white rounded-2xl border border-[#EEE6DA] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[760px]">
              <thead className="sticky top-0 z-10 bg-[#FAF6EF] border-b border-[#EEE6DA] text-[#8C867A] text-[11px] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-medium">Product</th>
                  <th className="py-3 px-3 font-medium">Category</th>
                  <th className="py-3 px-3 font-medium text-center">On Hand</th>
                  <th className="py-3 px-3 font-medium text-center">Reorder Threshold</th>
                  <th className="py-3 px-3 font-medium text-right">Stock Value</th>
                  <th className="py-3 px-3 font-medium text-center">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Quick Movement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEE6DA]/80">
                {filteredProducts.map((p) => {
                  const isOut = p.stock === 0;
                  const isLow = p.stock > 0 && p.stock <= p.reorderLevel;

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
                      <td className="py-3 px-3 text-right font-bold text-[#1C1B18] tabular-nums">
                        {formatINR(p.stock * p.purchasePrice)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge variant={isOut ? 'danger' : isLow ? 'warning' : 'success'}>
                          {isOut ? 'Out of stock' : isLow ? 'Low stock' : 'In stock'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenDrawer('inward', p.id)}
                            className="px-2.5 py-1 bg-[#E6F1E6] hover:bg-[#D5EBD5] text-[#2E8B57] font-semibold text-[11px] rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                            title="Quick Stock In"
                          >
                            <Plus size={12} /> Inward
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDrawer('outward', p.id)}
                            disabled={p.stock <= 0}
                            className={`px-2.5 py-1 font-semibold text-[11px] rounded-lg transition-colors inline-flex items-center gap-1 ${
                              p.stock <= 0
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-[#FDECEC] hover:bg-[#FCD8D8] text-[#D64545] cursor-pointer'
                            }`}
                            title="Quick Stock Out"
                          >
                            <Minus size={12} /> Outward
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
      )}

      {/* Slide-over Right Drawer to Record Inward or Outward (Stockroom Style) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-lg bg-white border-l border-[#EEE6DA] shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
              {/* Drawer Header */}
              <div className="p-5 border-b border-[#EEE6DA] flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-[#1C1B18] flex items-center gap-2">
                    {drawerType === 'inward' ? (
                      <>
                        <ArrowDownLeft size={18} className="text-[#2E8B57]" />
                        <span>Record Stock Inward</span>
                      </>
                    ) : (
                      <>
                        <ArrowUpRight size={18} className="text-[#D64545]" />
                        <span>Record Stock Outward</span>
                      </>
                    )}
                  </h3>
                  <p className="text-xs text-[#6B665E] mt-0.5">
                    {drawerType === 'inward'
                      ? 'Add incoming supplier items or inventory receipt to on-hand stock.'
                      : 'Dispatch or deduct outgoing goods from warehouse inventory.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-[#6B665E] hover:bg-[#FAF6EF]"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Form Body */}
              <form id="movement-form" onSubmit={handleRecordMovement} className="flex-1 overflow-y-auto p-5 space-y-4">
                {drawerError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                    <AlertTriangle size={15} className="shrink-0" />
                    <span>{drawerError}</span>
                  </div>
                )}

                {/* Product Selection */}
                <div>
                  <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                    Select Product *
                  </label>
                  <select
                    value={drawerProductId}
                    onChange={(e) => {
                      setDrawerProductId(e.target.value);
                      setDrawerError('');
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs bg-white outline-none focus:border-[#381e12]"
                    required
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (SKU: {p.sku}) — {p.stock} {p.unit} on hand
                      </option>
                    ))}
                  </select>

                  {selectedProduct && (
                    <div className="mt-2 p-2.5 rounded-xl bg-[#FAF6EF] border border-[#EEE6DA] flex items-center justify-between text-xs">
                      <span className="text-[#6B665E]">Current On-Hand Balance:</span>
                      <span className="font-bold text-[#1C1B18]">
                        {selectedProduct.stock} {selectedProduct.unit}
                      </span>
                    </div>
                  )}
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-xs font-semibold text-[#1C1B18] mb-1 flex items-center justify-between">
                    <span>{drawerType === 'inward' ? 'Quantity to Inward *' : 'Quantity to Dispatch *'}</span>
                    <span className="text-[11px] text-[#9A948A]">
                      Unit: <strong>{selectedProduct?.unit || 'pcs'}</strong>
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      required
                      value={drawerQuantity}
                      onChange={(e) => {
                        setDrawerQuantity(Math.max(1, parseInt(e.target.value) || 1));
                        setDrawerError('');
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs focus:border-[#381e12] outline-none font-semibold text-sm tabular-nums"
                    />
                  </div>
                  {selectedProduct && (
                    <p className="text-[11px] text-[#6B665E] mt-1">
                      New balance after {drawerType === 'inward' ? 'intake' : 'dispatch'}:{' '}
                      <strong className="text-[#1C1B18]">
                        {drawerType === 'inward'
                          ? selectedProduct.stock + drawerQuantity
                          : Math.max(0, selectedProduct.stock - drawerQuantity)}{' '}
                        {selectedProduct.unit}
                      </strong>
                    </p>
                  )}
                </div>

                {/* Source / Destination Partner */}
                <div>
                  <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                    {drawerType === 'inward' ? 'Supplier / Source (Optional)' : 'Customer / Recipient (Optional)'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={drawerPartner}
                      onChange={(e) => setDrawerPartner(e.target.value)}
                      placeholder={
                        drawerType === 'inward'
                          ? 'e.g. Apex Health Pharma, Blue Star Logistics...'
                          : 'e.g. Walk-in Customer, Retail Branch #2...'
                      }
                      className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs focus:border-[#381e12] outline-none"
                    />
                  </div>
                </div>

                {/* Reference Number */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                      Reference / Bill #
                    </label>
                    <input
                      type="text"
                      value={drawerReference}
                      onChange={(e) => setDrawerReference(e.target.value)}
                      placeholder={drawerType === 'inward' ? 'PO-1049, INV-892' : 'SO-2091, DISP-44'}
                      className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs focus:border-[#381e12] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                      Movement Reason *
                    </label>
                    <select
                      value={drawerReason}
                      onChange={(e) => setDrawerReason(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs bg-white outline-none focus:border-[#381e12]"
                    >
                      {drawerType === 'inward' ? (
                        <>
                          <option value="Supplier Receipt">Supplier Receipt</option>
                          <option value="Purchase Order Intake">Purchase Order Intake</option>
                          <option value="Customer Return Inward">Customer Return Inward</option>
                          <option value="Transfer In">Transfer from Another Branch</option>
                          <option value="Inventory Correction">Inventory Correction (+)</option>
                        </>
                      ) : (
                        <>
                          <option value="Sales Dispatch">Sales Order Dispatch</option>
                          <option value="Damaged / Expired">Damaged / Expired Goods</option>
                          <option value="Vendor Return Outward">Return to Supplier</option>
                          <option value="Transfer Out">Transfer to Branch / Hub</option>
                          <option value="Sample / Internal Use">Sample / Internal Consumption</option>
                          <option value="Inventory Correction">Inventory Correction (–)</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>
              </form>

              {/* Drawer Footer Actions */}
              <div className="p-5 border-t border-[#EEE6DA] bg-[#FAF6EF]/50 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-4 py-2 border border-[#EEE6DA] rounded-xl text-xs font-semibold text-[#6B665E] hover:bg-white cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="movement-form"
                  className="px-5 py-2 bg-[#381e12] !text-white rounded-xl text-xs font-semibold hover:bg-[#26140c] shadow-sm cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  {drawerType === 'inward' ? (
                    <>
                      <ArrowDownLeft size={14} />
                      <span>Confirm Stock Inward</span>
                    </>
                  ) : (
                    <>
                      <ArrowUpRight size={14} />
                      <span>Confirm Stock Outward</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

