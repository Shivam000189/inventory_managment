import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  CreditCard,
  Receipt,
  ArrowUpRight,
  Clock,
  Search,
  Download,
  Printer,
  Plus,
  Filter,
  Package,
  X,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { StatCard } from '../../dashboard/components/common/StatCard.tsx';
import { Badge } from '../../dashboard/components/common/Badge.tsx';
import { TableSkeleton } from '../../components/ui/Feedback.tsx';
import { paymentApi } from '../../api/paymentApi.js';
import { salesOrderApi } from '../../api/salesOrderApi.js';
import { purchaseOrderApi } from '../../api/purchaseOrderApi.js';
import { useResource } from '../../hooks/useResource.js';
import { formatINR } from '../../dashboard/lib/formatters.ts';

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const METHODS = ['UPI', 'Cash', 'Card', 'Bank transfer', 'Credit', 'Other'];

export default function PaymentsPage({ business = {}, account = {} }) {
  const load = useCallback(
    () => Promise.all([paymentApi.list(), salesOrderApi.list(), purchaseOrderApi.list()]),
    []
  );
  const { data, loading, error, refetch, setData } = useResource(load, [], [[], [], []]);
  const [payments, salesOrders, purchaseOrders] = data;

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All'); // All, sale, purchase
  const [methodFilter, setMethodFilter] = useState('All'); // All, UPI, Cash, Card, Bank transfer

  // Slide-over Right Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState('sale'); // 'sale' or 'purchase'
  const [selectedReferenceId, setSelectedReferenceId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [drawerError, setDrawerError] = useState('');
  const [drawerSuccess, setDrawerSuccess] = useState('');
  const [globalMessage, setGlobalMessage] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const currency = business?.currency || 'INR';
  const money = (value) => {
    return formatINR(Number(value || 0));
  };

  const currentOrders = drawerType === 'sale' ? salesOrders : purchaseOrders;

  const getPaid = useCallback(
    (referenceId) =>
      payments
        .filter((payment) => payment.referenceId === referenceId)
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    [payments]
  );

  const selectedOrder = useMemo(() => {
    if (!selectedReferenceId) return null;
    return (
      currentOrders.find(
        (item) => (item.orderId || item.purchaseOrderId) === selectedReferenceId
      ) || null
    );
  }, [currentOrders, selectedReferenceId]);

  const selectedPaid = useMemo(() => {
    if (!selectedReferenceId) return 0;
    return getPaid(selectedReferenceId);
  }, [selectedReferenceId, getPaid]);

  const selectedTotal = useMemo(() => {
    if (!selectedOrder) return 0;
    return Number(selectedOrder.totalAmount || 0);
  }, [selectedOrder]);

  const selectedOutstanding = useMemo(() => {
    return Math.max(0, selectedTotal - selectedPaid);
  }, [selectedTotal, selectedPaid]);

  const handleOrderChange = (refId) => {
    setSelectedReferenceId(refId);
    const ord = currentOrders.find((o) => (o.orderId || o.purchaseOrderId) === refId);
    if (ord) {
      const out = Math.max(0, Number(ord.totalAmount || 0) - getPaid(refId));
      if (out > 0) {
        setAmount(String(out));
      }
    }
  };

  const handleDrawerTypeSwitch = (newType) => {
    setDrawerType(newType);
    setSelectedReferenceId('');
    setAmount('');
    setDrawerError('');
  };

  const orderName = (referenceId) => {
    const sale = salesOrders.find((order) => order.orderId === referenceId);
    if (sale) {
      return {
        entity: sale.customerName || 'Walk-in customer',
        ref: sale.orderNumber,
        gstin: sale.customerSnapshot?.gstin,
      };
    }
    const po = purchaseOrders.find((order) => order.purchaseOrderId === referenceId);
    if (po) return { entity: po.supplierName || 'Vendor', ref: po.orderNumber };
    return { entity: referenceId || 'Walk-in / Direct', ref: '' };
  };

  // Open Drawer handler
  const handleOpenDrawer = () => {
    setDrawerType('sale');
    setSelectedReferenceId('');
    setAmount('');
    setPaymentMethod('UPI');
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setNotes('');
    setDrawerError('');
    setDrawerSuccess('');
    setIsDrawerOpen(true);
  };

  // Drawer Form Submission
  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (saving) return;

    setDrawerError('');
    setDrawerSuccess('');

    const value = Number(amount);
    const order = currentOrders.find(
      (item) => item.orderId === selectedReferenceId || item.purchaseOrderId === selectedReferenceId
    );
    const paid = getPaid(selectedReferenceId);

    if (!order || !value || value <= 0 || paid + value > Number(order.totalAmount || 0) + 0.01) {
      setDrawerError('Please enter a valid payment amount that does not exceed the remaining due.');
      return;
    }

    setSaving(true);
    try {
      await paymentApi.create({
        type: drawerType,
        referenceId: selectedReferenceId,
        amount: value,
        paymentMethod,
        paymentDate,
        notes: notes.trim(),
      });

      const [freshPayments, freshSales, freshPurchases] = await Promise.all([
        paymentApi.list(),
        salesOrderApi.list(),
        purchaseOrderApi.list(),
      ]);
      setData([freshPayments, freshSales, freshPurchases]);
      setDrawerSuccess(`${money(value)} payment recorded and posted to ledger!`);
      setTimeout(() => {
        setIsDrawerOpen(false);
      }, 1000);
    } catch (caught) {
      setDrawerError(caught?.message || 'Could not record the payment.');
    } finally {
      setSaving(false);
    }
  };

  // Metrics for 4 StatCards
  const stats = useMemo(() => {
    const today = startOfToday();
    const isToday = (payment) => new Date(payment.paymentDate || payment.createdAt) >= today;

    const salesToday = payments
      .filter((p) => p.type === 'sale' && isToday(p))
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const salesTxns = payments.filter((p) => p.type === 'sale' && isToday(p)).length;

    const purchasePayments = payments.filter((p) => p.type === 'purchase');
    const purchasesOut = purchasePayments.reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0
    );
    const vendorCount = new Set(purchasePayments.map((p) => p.referenceId)).size;

    const dues = salesOrders
      .filter((order) => order.status !== 'Cancelled')
      .map((order) => Number(order.totalAmount || 0) - getPaid(order.orderId))
      .filter((value) => value > 0.5);

    return {
      salesToday,
      salesTxns,
      purchasesOut,
      vendorCount,
      duesTotal: dues.reduce((sum, val) => sum + val, 0),
      duesCount: dues.length,
    };
  }, [payments, salesOrders, getPaid]);

  // Filtered payments list
  const filteredPayments = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return payments.filter((payment) => {
      const info = orderName(payment.referenceId);
      const matchSearch =
        !q ||
        (payment.paymentId && payment.paymentId.toLowerCase().includes(q)) ||
        info.entity.toLowerCase().includes(q) ||
        (info.ref && info.ref.toLowerCase().includes(q)) ||
        (payment.transactionReference && payment.transactionReference.toLowerCase().includes(q)) ||
        (payment.notes && payment.notes.toLowerCase().includes(q));

      const matchType =
        typeFilter === 'All' ||
        (typeFilter === 'sale' && payment.type === 'sale') ||
        (typeFilter === 'purchase' && payment.type === 'purchase');

      const matchMethod =
        methodFilter === 'All' ||
        (payment.paymentMethod && payment.paymentMethod.toLowerCase().includes(methodFilter.toLowerCase()));

      return matchSearch && matchType && matchMethod;
    });
  }, [payments, searchQuery, typeFilter, methodFilter, salesOrders, purchaseOrders]);

  // Paginated payments
  const totalPages = Math.ceil(filteredPayments.length / pageSize) || 1;
  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPayments.slice(start, start + pageSize);
  }, [filteredPayments, currentPage, pageSize]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter, methodFilter]);

  // Export CSV helper
  const exportCsv = () => {
    const escapeCell = (value) => {
      const t = String(value ?? '');
      const s = /^[=+@\-\t\r]/.test(t) ? `'${t}` : t;
      return `"${s.replaceAll('"', '""')}"`;
    };
    const rows = [
      ['Receipt ID', 'Type', 'Entity', 'Order Ref', 'Method', 'Reference Note', 'Amount', 'Date'],
      ...filteredPayments.map((p) => {
        const info = orderName(p.referenceId);
        return [
          `RCP-${p.paymentId?.slice(-6).toUpperCase() || 'PAY'}`,
          p.type === 'sale' ? 'Customer Inflow' : 'Vendor Outflow',
          info.entity,
          info.ref,
          p.paymentMethod,
          p.transactionReference || p.notes,
          p.amount,
          p.paymentDate || new Date(p.createdAt).toLocaleDateString('en-GB'),
        ];
      }),
    ];
    const url = URL.createObjectURL(
      new Blob([rows.map((row) => row.map(escapeCell).join(',')).join('\r\n')], {
        type: 'text/csv;charset=utf-8',
      })
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 pb-10" aria-labelledby="pay-title">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 id="pay-title" className="text-[28px] font-semibold text-[#1C1B18] tracking-tight leading-tight">
            Payments Ledger
          </h1>
          <p className="text-[13px] text-[#6B665E] mt-0.5">
            Record customer sales inflows, manage vendor disbursements, and track real-time settlements.
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
            disabled={!filteredPayments.length}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#EBE8E2] bg-white text-xs font-semibold text-[#1C1B18] hover:bg-[#FAF9F7] transition-all cursor-pointer shadow-xs whitespace-nowrap active:scale-95 disabled:opacity-50"
          >
            <Download size={15} />
            <span>Export</span>
          </button>
          <button
            type="button"
            onClick={handleOpenDrawer}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#381e12] hover:bg-[#2a160d] text-[#ffffff] font-medium text-[13px] rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <Plus size={16} className="text-[#ffffff]" />
            <span className="text-[#ffffff]">Record Payment</span>
          </button>
        </div>
      </div>

      {/* Global Alert Notification */}
      {globalMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium border ${
            globalMessage.type === 'error'
              ? 'bg-[#FDECEC] text-[#D64545] border-[#F9C2C2]'
              : 'bg-[#E8F5EC] text-[#2E8B57] border-[#CDEBD5]'
          }`}
          role={globalMessage.type === 'error' ? 'alert' : 'status'}
        >
          {globalMessage.text}
        </div>
      )}

      {/* 4 StatCards matching Stock Ledger style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={<Receipt size={18} strokeWidth={2.2} />}
          iconBgColor="bg-[#E6F1E6] text-[#2E8B57]"
          label="Today's Collections"
          value={money(stats.salesToday)}
          trend={`${stats.salesTxns} collections today`}
          isPositive={true}
        />
        <StatCard
          icon={<CreditCard size={18} strokeWidth={2} />}
          iconBgColor="bg-[#EBF3FC] text-[#2563EB]"
          label="Total Receipts"
          value={payments.length.toLocaleString('en-IN')}
          trend={`${payments.filter((p) => p.type === 'sale').length} inflows recorded`}
          isPositive={true}
        />
        <StatCard
          icon={<ArrowUpRight size={18} strokeWidth={2} />}
          iconBgColor="bg-[#FEF3C7] text-[#D97706]"
          label="Vendor Outflows"
          value={money(stats.purchasesOut)}
          trend={`${stats.vendorCount} vendors paid`}
          isPositive={true}
        />
        <StatCard
          icon={<Clock size={18} strokeWidth={2} />}
          iconBgColor="bg-[#FEE2E2] text-[#DC2626]"
          label="Outstanding Dues"
          value={money(stats.duesTotal)}
          trend={`${stats.duesCount} open invoices pending`}
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
                placeholder="Search receipt #, party, customer, order ref..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#FAF9F7] text-[13px] border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18] placeholder-[#8C827A] transition-all"
              />
            </div>

            {/* Type Dropdown */}
            <div className="relative sm:w-44">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C827A] pointer-events-none">
                <Filter size={14} />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full pl-8 pr-8 py-2 bg-[#FAF9F7] text-[13px] font-medium border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18] cursor-pointer transition-all appearance-none"
              >
                <option value="All">All Transactions</option>
                <option value="sale">Customer Inflows</option>
                <option value="purchase">Vendor Outflows</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C827A] pointer-events-none text-[9px]">
                ▼
              </div>
            </div>

            {/* Mode Dropdown */}
            <div className="relative sm:w-40">
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="w-full pl-3 pr-8 py-2 bg-[#FAF9F7] text-[13px] font-medium border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18] cursor-pointer transition-all appearance-none"
              >
                <option value="All">All Modes</option>
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Bank transfer">Bank Transfer</option>
                <option value="Credit">Credit</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C827A] pointer-events-none text-[9px]">
                ▼
              </div>
            </div>
          </div>

          {/* Reset button */}
          {(searchQuery || typeFilter !== 'All' || methodFilter !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('All');
                setMethodFilter('All');
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
        {loading && payments.length === 0 ? (
          <TableSkeleton rows={8} />
        ) : filteredPayments.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-[#FAF6F0] text-[#381e12] flex items-center justify-center mx-auto mb-3">
              <Receipt size={22} />
            </div>
            <h3 className="text-[16px] font-semibold text-[#1C1B18]">No Payments Found</h3>
            <p className="text-[13px] text-[#8C827A] mt-1 max-w-sm mx-auto">
              {searchQuery || typeFilter !== 'All' || methodFilter !== 'All'
                ? 'Try adjusting your search criteria or payment method filters.'
                : 'No payments recorded yet. Click "Record Payment" to log an inflow or vendor outflow.'}
            </p>
            <button
              onClick={handleOpenDrawer}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#381e12] hover:bg-[#2a160d] text-[#ffffff] font-medium text-[13px] rounded-lg transition-colors cursor-pointer"
            >
              <Plus size={15} className="text-[#ffffff]" />
              <span className="text-[#ffffff]">Record First Payment</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF6F0] border-b border-[#EBE8E2]">
                  <th className="py-3.5 px-4 text-[11px] font-bold text-[#8C7E74] uppercase tracking-wider">
                    Receipt ID
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-bold text-[#8C7E74] uppercase tracking-wider">
                    Party / Customer / Vendor
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-bold text-[#8C7E74] uppercase tracking-wider">
                    Date & Mode
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-bold text-[#8C7E74] uppercase tracking-wider">
                    Notes / Ref
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-bold text-[#8C7E74] uppercase tracking-wider text-right">
                    Amount
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-bold text-[#8C7E74] uppercase tracking-wider text-center">
                    Type / Status
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-bold text-[#8C7E74] uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EDE8]">
                {paginatedPayments.map((payment, index) => {
                  const info = orderName(payment.referenceId);
                  const isSale = payment.type === 'sale';

                  return (
                    <tr
                      key={payment.paymentId || `pay-${index}`}
                      className="hover:bg-[#FAF9F7] transition-colors"
                    >
                      {/* Receipt ID */}
                      <td className="py-3 px-4">
                        <span className="font-mono text-[12px] font-semibold text-[#1C1B18] bg-[#FAF6F0] px-2 py-0.5 rounded border border-[#EBE8E2]">
                          #RCP-{payment.paymentId?.slice(-6).toUpperCase() || 'PAY'}
                        </span>
                      </td>

                      {/* Party / Entity */}
                      <td className="py-3 px-4">
                        <div className="text-[13px] font-semibold text-[#1C1B18]">
                          {info.entity}
                        </div>
                        <div className="text-[11px] text-[#8C827A] mt-0.5">
                          Ref: <span className="font-mono">{info.ref || 'Direct Settlement'}</span>{' '}
                          {info.gstin ? `· GSTIN ${info.gstin}` : ''}
                        </div>
                      </td>

                      {/* Date & Mode */}
                      <td className="py-3 px-4">
                        <div className="text-[12px] text-[#1C1B18]">
                          {new Date(payment.paymentDate || payment.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded bg-[#EBF3FC] text-[#2563EB] border border-[#BFDBFE]">
                          {payment.paymentMethod || 'UPI'}
                        </span>
                      </td>

                      {/* Notes / Ref */}
                      <td className="py-3 px-4 text-[12px] text-[#6B665E]">
                        {payment.transactionReference || payment.notes || '—'}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right">
                        <div
                          className={`font-bold text-[14px] tabular-nums ${
                            isSale ? 'text-[#2E8B57]' : 'text-[#DC2626]'
                          }`}
                        >
                          {isSale ? '+ ' : '− '}
                          {money(payment.amount)}
                        </div>
                        <div className="text-[10px] text-[#8C827A] uppercase tracking-wider mt-0.5">
                          {isSale ? 'Customer Inflow' : 'Vendor Outflow'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={isSale ? 'success' : 'neutral'}
                          className="text-[11px]"
                        >
                          {isSale ? 'Customer Paid' : 'Vendor Paid'}
                        </Badge>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="p-1.5 text-[#6B665E] hover:text-[#381e12] hover:bg-[#F3EFEA] rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 text-[12px] font-medium"
                          title="Print Receipt"
                        >
                          <Printer size={14} />
                          <span>Receipt</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-3.5 border-t border-[#EBE8E2] flex items-center justify-between text-xs text-[#6B665E] bg-[#FAF9F7]">
            <span>
              Showing {Math.min((currentPage - 1) * pageSize + 1, filteredPayments.length)} to{' '}
              {Math.min(currentPage * pageSize, filteredPayments.length)} of {filteredPayments.length} entries
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-[#EBE8E2] bg-white text-xs font-semibold text-[#1C1B18] hover:bg-[#FAF6EF] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Previous
              </button>
              <span className="px-2 font-medium text-[#1C1B18]">
                {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-[#EBE8E2] bg-white text-xs font-semibold text-[#1C1B18] hover:bg-[#FAF6EF] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Slide-over Right Drawer for Record Payment */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-xs transition-opacity"
            onClick={() => !saving && setIsDrawerOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl border-l border-[#EBE8E2] flex flex-col animate-in slide-in-from-right duration-200">
              {/* Drawer Header */}
              <div className="p-5 border-b border-[#EBE8E2] flex items-center justify-between bg-[#FAF6F0]">
                <div>
                  <h2 className="text-[16px] font-semibold text-[#1C1B18]">
                    Record Payment Receipt
                  </h2>
                  <p className="text-[12px] text-[#6B665E] mt-0.5">
                    Clear open invoice balances and post immediate entries to the financial ledger.
                  </p>
                </div>
                <button
                  onClick={() => !saving && setIsDrawerOpen(false)}
                  className="p-1.5 text-[#8C827A] hover:text-[#1C1B18] rounded-lg hover:bg-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Body Form */}
              <form onSubmit={handleSubmitPayment} className="flex-1 overflow-y-auto p-5 space-y-4">
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

                {/* Segmented Flow Toggle */}
                <div>
                  <label className="block text-[12px] font-medium text-[#1C1B18] mb-1.5">
                    Transaction Direction
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#FAF6F0] rounded-xl border border-[#EBE8E2]">
                    <button
                      type="button"
                      onClick={() => handleDrawerTypeSwitch('sale')}
                      className={`py-2 text-[12px] font-semibold rounded-lg transition-all cursor-pointer ${
                        drawerType === 'sale'
                          ? 'bg-[#381e12] text-white shadow-xs'
                          : 'text-[#6B665E] hover:text-[#1C1B18]'
                      }`}
                    >
                      Customer Inflow
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDrawerTypeSwitch('purchase')}
                      className={`py-2 text-[12px] font-semibold rounded-lg transition-all cursor-pointer ${
                        drawerType === 'purchase'
                          ? 'bg-[#381e12] text-white shadow-xs'
                          : 'text-[#6B665E] hover:text-[#1C1B18]'
                      }`}
                    >
                      Vendor Outflow
                    </button>
                  </div>
                </div>

                {/* Order Selector */}
                <div>
                  <label className="block text-[12px] font-medium text-[#1C1B18] mb-1.5">
                    Select {drawerType === 'sale' ? 'Sales Order / Invoice' : 'Purchase Order'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedReferenceId}
                    onChange={(e) => handleOrderChange(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#FAF9F7] text-[13px] border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18] cursor-pointer"
                  >
                    <option value="" disabled>
                      Choose {drawerType === 'sale' ? 'sales order…' : 'purchase order…'}
                    </option>
                    {currentOrders.map((order) => {
                      const id = order.orderId || order.purchaseOrderId;
                      const outstanding = Math.max(0, Number(order.totalAmount || 0) - getPaid(id));
                      return (
                        <option key={id} value={id}>
                          {order.orderNumber || id} · {drawerType === 'sale' ? (order.customerName || 'Walk-in') : (order.supplierName || 'Vendor')} · due {money(outstanding)}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Selected Order Insight Bar */}
                {selectedOrder && (
                  <div className="p-3.5 bg-[#FAF6F0] rounded-xl border border-[#EBE8E2] text-[12px] space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-[#8C827A]">Party:</span>
                      <span className="font-semibold text-[#1C1B18]">
                        {drawerType === 'sale' ? (selectedOrder.customerName || 'Walk-in') : (selectedOrder.supplierName || 'Vendor')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8C827A]">Invoice Total:</span>
                      <span className="font-medium text-[#1C1B18]">{money(selectedTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8C827A]">Settled To Date:</span>
                      <span className="text-[#2E8B57] font-semibold">{money(selectedPaid)}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-[#EBE8E2]">
                      <span className="font-semibold text-[#1C1B18]">Remaining Due:</span>
                      <span className="font-bold text-[#DC2626] text-[13px]">{money(selectedOutstanding)}</span>
                    </div>

                    {selectedOutstanding > 0 && Number(amount) !== selectedOutstanding && (
                      <button
                        type="button"
                        onClick={() => setAmount(String(selectedOutstanding))}
                        className="mt-2 w-full py-1.5 text-[11px] font-bold text-[#2E8B57] bg-white border border-[#BCE2BC] hover:bg-[#E6F1E6] rounded-lg transition-colors cursor-pointer text-center"
                      >
                        Auto-fill Full Due ({money(selectedOutstanding)})
                      </button>
                    )}
                  </div>
                )}

                {/* Amount Received Input */}
                <div>
                  <label className="block text-[12px] font-medium text-[#1C1B18] mb-1.5">
                    Amount Received / Paid <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#8C827A]">₹</span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-3 py-2 bg-[#FAF9F7] text-[14px] font-bold border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18]"
                    />
                  </div>

                  {/* Quick Presets */}
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-[11px] text-[#8C827A] font-medium">Quick:</span>
                    {[500, 1000, 2000, 5000].map((quick) => (
                      <button
                        type="button"
                        key={quick}
                        onClick={() => setAmount(String(quick))}
                        className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FAF6F0] border border-[#EBE8E2] text-[#4A443F] hover:bg-white cursor-pointer transition-colors"
                      >
                        +₹{quick.toLocaleString('en-IN')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-[12px] font-medium text-[#1C1B18] mb-1.5">
                    Payment Mode <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF9F7] text-[13px] border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18] cursor-pointer"
                  >
                    {METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Payment Date */}
                <div>
                  <label className="block text-[12px] font-medium text-[#1C1B18] mb-1.5">
                    Payment Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF9F7] text-[13px] border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18]"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[12px] font-medium text-[#1C1B18] mb-1.5">
                    Transaction Reference / Notes
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. UPI-HDFC-9940291482 or Cheque #49201"
                    className="w-full px-3 py-2 bg-[#FAF9F7] text-[13px] border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18]"
                  />
                </div>

                {/* Submit Buttons */}
                <div className="pt-4 border-t border-[#EBE8E2] flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    disabled={saving}
                    className="px-4 py-2 border border-[#EBE8E2] text-[#4A443F] hover:bg-[#FAF9F7] text-[13px] font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-[#381e12] hover:bg-[#2a160d] text-[#ffffff] text-[13px] font-medium rounded-lg transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <span className="text-[#ffffff]">
                      {saving ? 'Recording…' : 'Confirm & Record Payment'}
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
}
