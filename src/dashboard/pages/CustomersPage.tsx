import React, { useState } from 'react';
import {
  UserCheck,
  Plus,
  Search,
  Phone,
  Mail,
  CreditCard,
  History,
  X,
  Share2,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { useApp } from '../context/AppContext';
import { Customer } from '../types';
import { formatINR } from '../lib/formatters';

export const CustomersPage: React.FC = () => {
  const {
    customers,
    addCustomer,
    updateCustomer,
    recordCustomerPayment,
    customersActiveTab,
    setCustomersActiveTab,
    bills,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [recordingPaymentCust, setRecordingPaymentCust] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('UPI');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    type: 'Retail' as 'Retail' | 'Wholesale',
    gstin: '',
    address: '',
    creditLimit: 10000,
  });

  const totalSpentAll = customers.reduce((acc, c) => acc + c.totalSpent, 0);
  const totalOutstanding = customers.reduce((acc, c) => acc + c.outstanding, 0);
  const creditCustomers = customers.filter((c) => c.outstanding > 0);

  const filteredCustomers = (
    customersActiveTab === 'credit' ? creditCustomers : customers
  ).filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  });

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    addCustomer(formData);
    setIsAddDrawerOpen(false);
    setFormData({
      name: '',
      phone: '',
      email: '',
      type: 'Retail',
      gstin: '',
      address: '',
      creditLimit: 10000,
    });
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordingPaymentCust || paymentAmount <= 0) return;
    recordCustomerPayment(recordingPaymentCust.id, paymentAmount, paymentMethod);
    setRecordingPaymentCust(null);
    setPaymentAmount(0);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold text-[#1C1B18] tracking-tight leading-tight">
            {customersActiveTab === 'credit' ? 'Credit & Dues Ledger' : 'Customers'}
          </h1>
          <p className="text-[13px] text-[#6B665E] mt-0.5">
            Manage your customer database, wholesale credits, and payment receivables.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddDrawerOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7FAE82] hover:bg-[#6C9C70] text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs self-start"
        >
          <Plus size={16} />
          <span>+ Add customer</span>
        </button>
      </div>

      {/* StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={<UserCheck size={18} strokeWidth={2} />}
          iconBgColor="bg-[#E6F1E6] text-[#2E8B57]"
          label="Total Customers"
          value={customers.length}
          trend="+15% this quarter"
          isPositive={true}
        />
        <StatCard
          icon={<TrendingUp size={18} strokeWidth={2} />}
          iconBgColor="bg-[#E6F1E6] text-[#2E8B57]"
          label="Repeat Purchase Rate"
          value="68%"
          trend="High loyalty"
          isPositive={true}
        />
        <StatCard
          icon={<CreditCard size={18} strokeWidth={2} />}
          iconBgColor="bg-[#FDECEC] text-[#D64545]"
          label="Total Credit Outstanding"
          value={formatINR(totalOutstanding)}
          trend={`${creditCustomers.length} accounts with dues`}
          isPositive={false}
          onClick={() => setCustomersActiveTab('credit')}
        />
        <StatCard
          icon={<DollarSign size={18} strokeWidth={2} />}
          iconBgColor="bg-[#E6F1E6] text-[#2E8B57]"
          label="Avg Lifetime Value"
          value={formatINR(Math.round(totalSpentAll / (customers.length || 1)))}
          trend="Per customer"
          isPositive={true}
        />
      </div>

      {/* Sub Tabs: All Customers | Credit / Ledger */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEE6DA] pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCustomersActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
              customersActiveTab === 'all'
                ? 'bg-[#1C1B18] text-white'
                : 'bg-white border border-[#EEE6DA] text-[#6B665E]'
            }`}
          >
            All Customers ({customers.length})
          </button>
          <button
            type="button"
            onClick={() => setCustomersActiveTab('credit')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
              customersActiveTab === 'credit'
                ? 'bg-[#1C1B18] text-white'
                : 'bg-white border border-[#EEE6DA] text-[#6B665E]'
            }`}
          >
            Credit / Ledger ({creditCustomers.length})
          </button>
        </div>

        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-2.5 text-[#9A948A]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#EEE6DA] text-xs bg-white outline-none focus:border-[#7FAE82]"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-[#EEE6DA] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF6EF] border-b border-[#EEE6DA] text-[#9A948A]">
              <tr>
                <th className="py-3 px-4 font-medium">Customer Name</th>
                <th className="py-3 px-3 font-medium">Contact Phone</th>
                <th className="py-3 px-3 font-medium text-center">Type</th>
                <th className="py-3 px-3 font-medium text-right">Total Spent</th>
                <th className="py-3 px-3 font-medium">Last Purchase</th>
                <th className="py-3 px-3 font-medium text-right">Outstanding Due</th>
                {customersActiveTab === 'credit' && (
                  <th className="py-3 px-3 font-medium text-center">Aging Bucket</th>
                )}
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEE6DA]/80">
              {filteredCustomers.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setViewingCustomer(c)}
                  className="hover:bg-[#FAF6EF]/60 transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#1C1B18] text-white flex items-center justify-center font-bold text-xs uppercase">
                        {c.name.slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-semibold text-[#1C1B18] text-[13px] group-hover:text-[#6C9C70]">
                          {c.name}
                        </div>
                        <div className="text-[11px] text-[#9A948A]">{c.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-[#6B665E]">{c.phone}</td>
                  <td className="py-3 px-3 text-center">
                    <Badge variant={c.type === 'Wholesale' ? 'primary' : 'neutral'}>
                      {c.type}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-[#1C1B18] tabular-nums">
                    {formatINR(c.totalSpent)}
                  </td>
                  <td className="py-3 px-3 text-[#6B665E]">{c.lastPurchase}</td>
                  <td className="py-3 px-3 text-right font-bold tabular-nums">
                    {c.outstanding > 0 ? (
                      <span className="text-[#D64545]">{formatINR(c.outstanding)}</span>
                    ) : (
                      <span className="text-[#2E8B57]">₹ 0</span>
                    )}
                  </td>
                  {customersActiveTab === 'credit' && (
                    <td className="py-3 px-3 text-center">
                      <span className="bg-[#FFF4DC] text-[#D98E0B] text-[10px] font-bold px-2 py-0.5 rounded-full">
                        0–30 Days
                      </span>
                    </td>
                  )}
                  <td
                    className="py-3 px-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      {c.outstanding > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setRecordingPaymentCust(c);
                            setPaymentAmount(c.outstanding);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#E6F1E6] text-[#2E8B57] hover:bg-[#d5ebd5] font-semibold text-xs cursor-pointer"
                        >
                          Record Payment
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setViewingCustomer(c)}
                        className="px-2.5 py-1 rounded-lg border border-[#EEE6DA] text-xs font-semibold text-[#1C1B18] hover:bg-[#FAF6EF]"
                      >
                        Ledger
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Drawer */}
      {isAddDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-xs"
            onClick={() => setIsAddDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white border-l border-[#EEE6DA] shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
              <div className="p-5 border-b border-[#EEE6DA] flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-[#1C1B18]">Add Customer</h3>
                  <p className="text-xs text-[#6B665E]">Create customer account and credit limits.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-[#6B665E] hover:bg-[#FAF6EF]"
                >
                  <X size={18} />
                </button>
              </div>

              <form id="cust-form" onSubmit={handleSaveCustomer} className="flex-1 overflow-y-auto p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1C1B18] mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Anand Kumar"
                    className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none focus:border-[#7FAE82]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1B18] mb-1">Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98..."
                      className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none focus:border-[#7FAE82]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1B18] mb-1">Customer Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs bg-white outline-none"
                    >
                      <option value="Retail">Retail</option>
                      <option value="Wholesale">Wholesale</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1B18] mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="customer@email.com"
                    className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1B18] mb-1">Credit Limit (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.creditLimit}
                      onChange={(e) => setFormData({ ...formData, creditLimit: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1B18] mb-1">GSTIN (Optional)</label>
                    <input
                      type="text"
                      value={formData.gstin}
                      onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                      placeholder="29ABC..."
                      className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1B18] mb-1">Billing Address</label>
                  <textarea
                    rows={2}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Street, City, Pincode"
                    className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none resize-none"
                  />
                </div>
              </form>

              <div className="p-4 bg-[#FAF6EF] border-t border-[#EEE6DA] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddDrawerOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#6B665E]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="cust-form"
                  className="px-5 py-2 rounded-xl bg-[#7FAE82] hover:bg-[#6C9C70] text-white text-xs font-semibold"
                >
                  Save Customer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {recordingPaymentCust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <form
            onSubmit={handleRecordPayment}
            className="bg-white rounded-3xl max-w-sm w-full border border-[#EEE6DA] shadow-2xl p-6 animate-in zoom-in-95 duration-150 space-y-4"
          >
            <h3 className="text-base font-semibold text-[#1C1B18]">
              Record Payment: {recordingPaymentCust.name}
            </h3>
            <p className="text-xs text-[#6B665E]">
              Current outstanding due: <span className="font-bold text-[#D64545]">{formatINR(recordingPaymentCust.outstanding)}</span>
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#1C1B18] mb-1">Payment Amount (₹)</label>
              <input
                type="number"
                min={1}
                max={recordingPaymentCust.outstanding}
                required
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-base font-bold tabular-nums outline-none focus:border-[#7FAE82]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1B18] mb-1">Payment Mode</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs bg-white outline-none"
              >
                <option value="UPI">UPI Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">NEFT / RTGS</option>
                <option value="Cheque">Bank Cheque</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRecordingPaymentCust(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#6B665E]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#7FAE82] text-white text-xs font-semibold rounded-xl hover:bg-[#6C9C70]"
              >
                Clear Dues
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Customer Detail & Purchase Ledger Drawer */}
      {viewingCustomer && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-xs"
            onClick={() => setViewingCustomer(null)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-lg bg-white border-l border-[#EEE6DA] shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200 p-5">
              <div>
                <div className="flex items-start justify-between border-b border-[#EEE6DA] pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1C1B18] text-white flex items-center justify-center font-bold text-sm">
                      {viewingCustomer.name.slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#1C1B18]">{viewingCustomer.name}</h3>
                      <div className="text-xs text-[#6B665E]">
                        {viewingCustomer.phone} · {viewingCustomer.type}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewingCustomer(null)}
                    className="p-1 rounded-lg text-[#6B665E] hover:bg-[#FAF6EF]"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-2xl bg-[#FAF6EF] border border-[#EEE6DA]">
                    <div className="text-[11px] text-[#6B665E]">Total Lifetime Spend</div>
                    <div className="text-lg font-bold text-[#1C1B18] tabular-nums mt-0.5">
                      {formatINR(viewingCustomer.totalSpent)}
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#FAF6EF] border border-[#EEE6DA]">
                    <div className="text-[11px] text-[#6B665E]">Current Outstanding Due</div>
                    <div className="text-lg font-bold text-[#D64545] tabular-nums mt-0.5">
                      {formatINR(viewingCustomer.outstanding)}
                    </div>
                  </div>
                </div>

                {/* Purchase History */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-[#1C1B18]">Invoices & Bills</div>
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {bills
                      .filter((b) => b.customerId === viewingCustomer.id)
                      .map((b) => (
                        <div
                          key={b.id}
                          className="p-3 rounded-xl border border-[#EEE6DA] bg-[#FAF6EF]/40 flex justify-between text-xs"
                        >
                          <div>
                            <div className="font-semibold text-[#1C1B18]">{b.billNumber}</div>
                            <div className="text-[11px] text-[#6B665E]">{b.date}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-[#1C1B18] tabular-nums">
                              {formatINR(b.total)}
                            </div>
                            <Badge variant={b.status === 'Paid' ? 'success' : 'warning'}>
                              {b.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#EEE6DA] flex justify-between">
                <button
                  type="button"
                  onClick={() => alert(`Opening WhatsApp to ${viewingCustomer.phone}`)}
                  className="px-3.5 py-1.5 rounded-xl border border-[#EEE6DA] text-xs font-semibold text-[#2E8B57] hover:bg-[#E8F5EC] flex items-center gap-1.5"
                >
                  <Share2 size={14} />
                  <span>WhatsApp Reminder</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingCustomer(null)}
                  className="px-4 py-1.5 bg-[#1C1B18] text-white text-xs font-semibold rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
