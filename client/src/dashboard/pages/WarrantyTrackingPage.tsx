import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  Calendar,
  Search,
  Filter,
  Plus,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  X,
  Edit2,
  FileText,
  User,
  Barcode,
  Sparkles,
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { ProductIcon } from '../components/common/ProductIcon';
import { TableSkeleton } from '../../components/ui/Feedback';
import { useApp } from '../context/AppContext';

export interface WarrantyRecord {
  id: string;
  policyNumber: string;
  productId: string;
  productName: string;
  sku: string;
  serialNumber?: string;
  customerName: string;
  customerPhone?: string;
  invoiceNumber: string;
  durationMonths: number;
  startDate: string;
  endDate: string;
  provider: 'Manufacturer' | 'Store In-House' | 'Extended Care';
  status: 'active' | 'expiring_soon' | 'expired' | 'claim_open';
  claimsCount: number;
  notes?: string;
}

export const WarrantyTrackingPage: React.FC = () => {
  const { products, businessProfile, isLoadingBackend } = useApp();

  const [warranties, setWarranties] = useState<WarrantyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [termFilter, setTermFilter] = useState('All');

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<WarrantyRecord | null>(null);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [durationMonths, setDurationMonths] = useState<number>(12);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [provider, setProvider] = useState<'Manufacturer' | 'Store In-House' | 'Extended Care'>('Manufacturer');
  const [drawerStatus, setDrawerStatus] = useState<'active' | 'expiring_soon' | 'expired' | 'claim_open'>('active');
  const [notes, setNotes] = useState('');
  const [drawerError, setDrawerError] = useState('');
  const [drawerSuccess, setDrawerSuccess] = useState('');

  // Initialize sample warranty records derived from products catalog
  useEffect(() => {
    setLoading(true);
    try {
      const generated: WarrantyRecord[] = [];
      const now = new Date();

      products.forEach((p, idx) => {
        const term = (p as any).warrantyMonths || (idx % 2 === 0 ? 12 : 24);
        const start = new Date(now.getTime() - (idx * 25 + 10) * 86400000);
        const end = new Date(start.getTime());
        end.setMonth(end.getMonth() + term);

        const diffDays = Math.round((end.getTime() - now.getTime()) / 86400000);
        let status: WarrantyRecord['status'] = 'active';
        if (diffDays < 0) status = 'expired';
        else if (diffDays <= 30) status = 'expiring_soon';
        else if (idx % 6 === 0) status = 'claim_open';

        generated.push({
          id: `war-${p.id}`,
          policyNumber: `WAR-${p.sku?.replace(/\D/g, '') || (1000 + idx)}-${2026}`,
          productId: p.id,
          productName: p.name,
          sku: p.sku || `SKU-${p.id.slice(-4)}`,
          serialNumber: `SN-${p.sku || 'PRD'}-${8000 + idx}`,
          customerName: idx % 3 === 0 ? 'Rahul Sharma' : idx % 3 === 1 ? 'Priya Patel' : 'Karan Verma',
          customerPhone: `+91 98${idx}12 44${idx}90`,
          invoiceNumber: `INV-${9000 + idx}`,
          durationMonths: term,
          startDate: start.toISOString().slice(0, 10),
          endDate: end.toISOString().slice(0, 10),
          provider: idx % 2 === 0 ? 'Manufacturer' : 'Store In-House',
          status,
          claimsCount: status === 'claim_open' ? 1 : 0,
          notes: `${term} months comprehensive warranty coverage`,
        });
      });

      if (generated.length === 0) {
        generated.push(
          {
            id: 'war-sample-1',
            policyNumber: 'WAR-ELC-2026-001',
            productId: 'prd-1',
            productName: 'Commercial Smart POS Terminal',
            sku: 'SKU-POS-900',
            serialNumber: 'SN-ELC-89201-01',
            customerName: 'Metro Hypermarket',
            customerPhone: '+91 98201 92840',
            invoiceNumber: 'INV-9842',
            durationMonths: 24,
            startDate: '2026-01-10',
            endDate: '2028-01-10',
            provider: 'Manufacturer',
            status: 'active',
            claimsCount: 0,
            notes: '2-year standard hardware replacement warranty',
          },
          {
            id: 'war-sample-2',
            policyNumber: 'WAR-BAR-2026-002',
            productId: 'prd-2',
            productName: 'Wireless Barcode Scanner 2D',
            sku: 'SKU-WLS-2D',
            serialNumber: 'SN-BAR-49120-01',
            customerName: 'QuickMart Retail',
            customerPhone: '+91 97182 34129',
            invoiceNumber: 'INV-9410',
            durationMonths: 12,
            startDate: '2025-11-20',
            endDate: '2026-11-20',
            provider: 'Store In-House',
            status: 'expiring_soon',
            claimsCount: 0,
            notes: 'Laser scanner head & battery warranty',
          }
        );
      }

      setWarranties(generated);
    } finally {
      setLoading(false);
    }
  }, [products]);

  // Computed metrics for 4 StatCards
  const activeCount = useMemo(() => {
    return warranties.filter((w) => w.status === 'active' || w.status === 'expiring_soon').length;
  }, [warranties]);

  const expiringSoonCount = useMemo(() => {
    return warranties.filter((w) => w.status === 'expiring_soon').length;
  }, [warranties]);

  const claimsOpenCount = useMemo(() => {
    return warranties.filter((w) => w.status === 'claim_open' || w.claimsCount > 0).length;
  }, [warranties]);

  const totalCatalogCovered = useMemo(() => {
    const set = new Set(warranties.map((w) => w.productId));
    return set.size || products.length;
  }, [warranties, products]);

  // Filtered rows
  const filteredWarranties = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return warranties.filter((w) => {
      const matchSearch =
        !q ||
        w.policyNumber.toLowerCase().includes(q) ||
        w.productName.toLowerCase().includes(q) ||
        w.customerName.toLowerCase().includes(q) ||
        (w.serialNumber && w.serialNumber.toLowerCase().includes(q)) ||
        w.invoiceNumber.toLowerCase().includes(q);

      const matchStatus =
        statusFilter === 'All' ||
        w.status.toLowerCase() === statusFilter.toLowerCase();

      const matchTerm =
        termFilter === 'All' ||
        String(w.durationMonths) === termFilter;

      return matchSearch && matchStatus && matchTerm;
    });
  }, [warranties, searchQuery, statusFilter, termFilter]);

  // Drawer handlers
  const handleOpenDrawer = (recordToEdit?: WarrantyRecord) => {
    if (recordToEdit) {
      setEditingRecord(recordToEdit);
      setSelectedProductId(recordToEdit.productId);
      setSerialNumber(recordToEdit.serialNumber || '');
      setCustomerName(recordToEdit.customerName);
      setCustomerPhone(recordToEdit.customerPhone || '');
      setInvoiceNumber(recordToEdit.invoiceNumber);
      setDurationMonths(recordToEdit.durationMonths);
      setStartDate(recordToEdit.startDate);
      setProvider(recordToEdit.provider);
      setDrawerStatus(recordToEdit.status);
      setNotes(recordToEdit.notes || '');
    } else {
      setEditingRecord(null);
      setSelectedProductId(products[0]?.id || '');
      setSerialNumber('');
      setCustomerName('');
      setCustomerPhone('');
      setInvoiceNumber(`INV-${Date.now().toString().slice(-4)}`);
      setDurationMonths(12);
      setStartDate(new Date().toISOString().slice(0, 10));
      setProvider('Manufacturer');
      setDrawerStatus('active');
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

    if (!customerName.trim()) {
      setDrawerError('Please enter the customer / company name.');
      return;
    }

    const prod = products.find((p) => p.id === selectedProductId) || products[0];
    const sDate = new Date(startDate);
    const eDate = new Date(sDate.getTime());
    eDate.setMonth(eDate.getMonth() + durationMonths);

    const diffDays = Math.round((eDate.getTime() - Date.now()) / 86400000);
    let derivedStatus: WarrantyRecord['status'] = drawerStatus;
    if (diffDays < 0) derivedStatus = 'expired';
    else if (diffDays <= 30 && derivedStatus !== 'claim_open') derivedStatus = 'expiring_soon';

    if (editingRecord) {
      setWarranties((prev) =>
        prev.map((w) =>
          w.id === editingRecord.id
            ? {
                ...w,
                productId: selectedProductId,
                productName: prod ? prod.name : w.productName,
                sku: prod ? prod.sku : w.sku,
                serialNumber: serialNumber.trim().toUpperCase() || undefined,
                customerName: customerName.trim(),
                customerPhone: customerPhone.trim() || undefined,
                invoiceNumber: invoiceNumber.trim().toUpperCase(),
                durationMonths,
                startDate,
                endDate: eDate.toISOString().slice(0, 10),
                provider,
                status: derivedStatus,
                notes: notes.trim() || undefined,
              }
            : w
        )
      );
      setDrawerSuccess('Warranty certificate updated successfully!');
    } else {
      const newRec: WarrantyRecord = {
        id: `war-${Date.now()}`,
        policyNumber: `WAR-${Date.now().toString().slice(-6)}`,
        productId: selectedProductId,
        productName: prod ? prod.name : 'Hardware Equipment',
        sku: prod ? prod.sku : 'SKU-WAR',
        serialNumber: serialNumber.trim().toUpperCase() || undefined,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
        invoiceNumber: invoiceNumber.trim().toUpperCase(),
        durationMonths,
        startDate,
        endDate: eDate.toISOString().slice(0, 10),
        provider,
        status: derivedStatus,
        claimsCount: 0,
        notes: notes.trim() || undefined,
      };
      setWarranties((prev) => [newRec, ...prev]);
      setDrawerSuccess('Warranty policy registered successfully!');
    }

    setTimeout(() => {
      setIsDrawerOpen(false);
    }, 900);
  };

  // CSV Export
  const exportCsv = () => {
    const rows = [
      ['Policy Number', 'Product Name', 'Serial Number', 'Customer', 'Phone', 'Invoice', 'Months', 'Start Date', 'End Date', 'Provider', 'Status'],
      ...filteredWarranties.map((w) => [
        w.policyNumber,
        w.productName,
        w.serialNumber || '—',
        w.customerName,
        w.customerPhone || '—',
        w.invoiceNumber,
        w.durationMonths,
        w.startDate,
        w.endDate,
        w.provider,
        w.status,
      ]),
    ];
    const url = URL.createObjectURL(
      new Blob([rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\r\n')], {
        type: 'text/csv;charset=utf-8',
      })
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `warranties-${new Date().toISOString().slice(0, 10)}.csv`;
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
            Warranty & Guarantee Tracking
          </h1>
          <p className="text-[13px] text-[#6B665E] mt-0.5">
            Track customer warranty certificates, expiry countdowns, and equipment guarantee claims for {businessProfile?.name || 'your store'}.
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
            disabled={filteredWarranties.length === 0}
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
            <span className="text-[#ffffff]">Register Warranty</span>
          </button>
        </div>
      </div>

      {/* 4 StatCards matching Stock Ledger style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={<ShieldCheck size={18} strokeWidth={2.2} />}
          iconBgColor="bg-[#E6F1E6] text-[#2E8B57]"
          label="Active Warranties"
          value={activeCount.toLocaleString('en-IN')}
          trend={`${activeCount} policies currently protected`}
          isPositive={true}
        />
        <StatCard
          icon={<Clock size={18} strokeWidth={2} />}
          iconBgColor="bg-[#FEE2E2] text-[#DC2626]"
          label="Expiring in 30 Days"
          value={expiringSoonCount}
          trend="Upcoming expiration window"
          isPositive={false}
        />
        <StatCard
          icon={<AlertTriangle size={18} strokeWidth={2} />}
          iconBgColor="bg-[#FEF3C7] text-[#D97706]"
          label="Warranty Claims Active"
          value={claimsOpenCount}
          trend="Pending repair / replacement"
          isPositive={false}
        />
        <StatCard
          icon={<ShieldAlert size={18} strokeWidth={2} />}
          iconBgColor="bg-[#EBF3FC] text-[#2563EB]"
          label="Covered Catalog SKUs"
          value={totalCatalogCovered}
          trend="Products with warranty terms"
          isPositive={true}
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
                placeholder="Search policy #, customer, serial #, invoice..."
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
                <option value="active">Active Coverage</option>
                <option value="expiring_soon">Expiring Soon (&le;30d)</option>
                <option value="expired">Expired</option>
                <option value="claim_open">Claim In Progress</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C827A] pointer-events-none text-[9px]">
                ▼
              </div>
            </div>

            {/* Duration Term Dropdown */}
            <div className="relative sm:w-36">
              <select
                value={termFilter}
                onChange={(e) => setTermFilter(e.target.value)}
                className="w-full pl-3 pr-8 py-2 bg-[#FAF9F7] text-[13px] font-medium border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18] cursor-pointer transition-all appearance-none"
              >
                <option value="All">All Terms</option>
                <option value="6">6 Months</option>
                <option value="12">12 Months</option>
                <option value="24">24 Months</option>
                <option value="36">36 Months</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C827A] pointer-events-none text-[9px]">
                ▼
              </div>
            </div>
          </div>

          {/* Reset button */}
          {(searchQuery || statusFilter !== 'All' || termFilter !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('All');
                setTermFilter('All');
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
        ) : filteredWarranties.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-[#E6F1E6] text-[#2E8B57] flex items-center justify-center mx-auto mb-3">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-[16px] font-semibold text-[#1C1B18]">No Warranties Found</h3>
            <p className="text-[13px] text-[#8C827A] mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'All' || termFilter !== 'All'
                ? 'Try adjusting your search criteria or duration filter.'
                : 'No warranty policies logged yet. Click "Register Warranty" to issue your first guarantee.'}
            </p>
            <button
              onClick={() => handleOpenDrawer()}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#381e12] hover:bg-[#2a160d] text-[#ffffff] font-medium text-[13px] rounded-lg transition-colors cursor-pointer"
            >
              <Plus size={15} className="text-[#ffffff]" />
              <span className="text-[#ffffff]">Issue First Warranty</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF6F0] border-b border-[#EBE8E2]">
                  <th className="py-3.5 px-4 text-[11px] font-bold text-[#8C7E74] uppercase tracking-wider">
                    Certificate / Policy #
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-bold text-[#8C7E74] uppercase tracking-wider">
                    Customer & Invoice
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-bold text-[#8C7E74] uppercase tracking-wider">
                    Product & Serial Number
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-bold text-[#8C7E74] uppercase tracking-wider">
                    Coverage Term
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-bold text-[#8C7E74] uppercase tracking-wider">
                    Validity Countdown
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
                {filteredWarranties.map((w, index) => {
                  const end = new Date(w.endDate);
                  const diffDays = Math.round((end.getTime() - Date.now()) / 86400000);
                  const isExpired = diffDays < 0;
                  const isExpiringSoon = diffDays >= 0 && diffDays <= 30;
                  const isClaim = w.status === 'claim_open';

                  return (
                    <tr
                      key={w.id || `war-${index}`}
                      className="hover:bg-[#FAF9F7] transition-colors"
                    >
                      {/* Policy Number */}
                      <td className="py-3 px-4">
                        <div className="font-mono text-[13px] font-bold text-[#1C1B18] bg-[#FAF6F0] px-2.5 py-1 rounded border border-[#EBE8E2] inline-block">
                          {w.policyNumber}
                        </div>
                        <div className="text-[11px] text-[#8C827A] mt-0.5">
                          {w.provider}
                        </div>
                      </td>

                      {/* Customer & Invoice */}
                      <td className="py-3 px-4">
                        <div className="text-[13px] font-semibold text-[#1C1B18]">
                          {w.customerName}
                        </div>
                        <div className="text-[11px] text-[#8C827A]">
                          Inv: <span className="font-mono text-[#2563EB]">{w.invoiceNumber}</span>{' '}
                          {w.customerPhone ? `· ${w.customerPhone}` : ''}
                        </div>
                      </td>

                      {/* Product & Serial */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <ProductIcon name={w.productName} className="w-8 h-8 shrink-0" />
                          <div>
                            <div className="text-[13px] font-semibold text-[#1C1B18]">
                              {w.productName}
                            </div>
                            {w.serialNumber && (
                              <div className="text-[11px] font-mono text-[#4A443F] flex items-center gap-1 mt-0.5">
                                <Barcode size={12} className="text-[#8C827A]" />
                                {w.serialNumber}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Coverage Term */}
                      <td className="py-3 px-4">
                        <div className="text-[13px] font-bold text-[#1C1B18]">
                          {w.durationMonths} Months
                        </div>
                        <div className="text-[11px] text-[#8C827A]">
                          {w.startDate} to {w.endDate}
                        </div>
                      </td>

                      {/* Validity Countdown */}
                      <td className="py-3 px-4">
                        {isExpired ? (
                          <span className="text-[12px] font-semibold text-[#DC2626]">
                            Expired {Math.abs(diffDays)}d ago
                          </span>
                        ) : isExpiringSoon ? (
                          <span className="text-[12px] font-bold text-[#D97706] flex items-center gap-1">
                            <Clock size={13} />
                            {diffDays} days left
                          </span>
                        ) : (
                          <span className="text-[12px] font-medium text-[#2E8B57]">
                            {diffDays} days remaining
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={isClaim ? 'danger' : isExpired ? 'neutral' : isExpiringSoon ? 'warning' : 'success'}
                          className="capitalize text-[11px]"
                        >
                          {isClaim ? 'Claim Open' : isExpired ? 'Expired' : isExpiringSoon ? 'Expiring Soon' : 'Active'}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenDrawer(w)}
                          className="p-1.5 text-[#6B665E] hover:text-[#381e12] hover:bg-[#F3EFEA] rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 text-[12px] font-medium"
                          title="Edit policy"
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

      {/* Slide-over Right Drawer for Warranty Registration */}
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
                    {editingRecord ? 'Edit Warranty Policy' : 'Issue Warranty Certificate'}
                  </h2>
                  <p className="text-[12px] text-[#6B665E] mt-0.5">
                    {editingRecord
                      ? `Updating policy ${editingRecord.policyNumber}`
                      : 'Bind a manufacturer or store warranty terms to customer equipment'}
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
                    Covered Product <span className="text-red-500">*</span>
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

                {/* Serial Number */}
                <div>
                  <label className="block text-[12px] font-medium text-[#1C1B18] mb-1.5">
                    Unit Serial # / IMEI
                  </label>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. SN-POS-9002-01"
                    className="w-full px-3 py-2 bg-[#FAF9F7] font-mono text-[13px] border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18]"
                  />
                </div>

                {/* Customer Details */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-medium text-[#1C1B18] mb-1.5">
                      Customer Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Amit Patel"
                      className="w-full px-3 py-2 bg-[#FAF9F7] text-[13px] border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-[#1C1B18] mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+91 98..."
                      className="w-full px-3 py-2 bg-[#FAF9F7] text-[13px] border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18]"
                    />
                  </div>
                </div>

                {/* Invoice Number */}
                <div>
                  <label className="block text-[12px] font-medium text-[#1C1B18] mb-1.5">
                    Sales Invoice Ref <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. INV-9842"
                    className="w-full px-3 py-2 bg-[#FAF9F7] font-mono text-[13px] border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18]"
                  />
                </div>

                {/* Duration & Start Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-medium text-[#1C1B18] mb-1.5">
                      Coverage Term (Months)
                    </label>
                    <select
                      value={durationMonths}
                      onChange={(e) => setDurationMonths(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 bg-[#FAF9F7] text-[13px] border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18] cursor-pointer"
                    >
                      <option value={6}>6 Months</option>
                      <option value={12}>12 Months (1 Year)</option>
                      <option value={24}>24 Months (2 Years)</option>
                      <option value={36}>36 Months (3 Years)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-[#1C1B18] mb-1.5">
                      Purchase / Start Date
                    </label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-[#FAF9F7] text-[13px] border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18]"
                    />
                  </div>
                </div>

                {/* Provider */}
                <div>
                  <label className="block text-[12px] font-medium text-[#1C1B18] mb-1.5">
                    Warranty Underwriter / Provider
                  </label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#FAF9F7] text-[13px] border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18] cursor-pointer"
                  >
                    <option value="Manufacturer">Manufacturer Warranty (OEM)</option>
                    <option value="Store In-House">Store In-House Guarantee</option>
                    <option value="Extended Care">Third-party Extended Care</option>
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[12px] font-medium text-[#1C1B18] mb-1.5">
                    Coverage Terms & Exclusions
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Free parts replacement, physical liquid damage excluded..."
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
                      {editingRecord ? 'Update Certificate' : 'Issue Certificate'}
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
