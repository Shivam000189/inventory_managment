import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  Building,
  CreditCard,
  Calendar,
  MoreVertical,
  X,
  ArrowRight,
  Receipt,
  Package,
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { useApp } from '../context/AppContext';
import { Supplier } from '../types';
import { formatINR } from '../lib/formatters';

export const SuppliersPage: React.FC = () => {
  const { suppliers, addSupplier, updateSupplier, purchaseOrders, products, navigate } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);
  const [detailTab, setDetailTab] = useState<'pos' | 'products' | 'ledger'>('pos');

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    gstin: '',
    address: '',
    paymentTerms: 'Net 30' as 'COD' | 'Net 15' | 'Net 30' | 'Net 60',
    outstandingBalance: 0,
    status: 'active' as 'active' | 'inactive',
    notes: '',
  });

  const activeCount = suppliers.filter((s) => s.status === 'active').length;
  const totalPayable = suppliers.reduce((acc, s) => acc + s.outstandingBalance, 0);
  const openPOCount = purchaseOrders.filter(
    (p) => p.status === 'Ordered' || p.status === 'Partially received'
  ).length;

  const filteredSuppliers = suppliers.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.contactPerson.toLowerCase().includes(q) ||
      s.phone.includes(q)
    );
  });

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      gstin: '',
      address: '',
      paymentTerms: 'Net 30',
      outstandingBalance: 0,
      status: 'active',
      notes: '',
    });
    setIsAddDrawerOpen(true);
  };

  const handleOpenEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setFormData({
      name: s.name,
      contactPerson: s.contactPerson,
      phone: s.phone,
      email: s.email,
      gstin: s.gstin,
      address: s.address,
      paymentTerms: s.paymentTerms,
      outstandingBalance: s.outstandingBalance,
      status: s.status,
      notes: s.notes || '',
    });
    setIsAddDrawerOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSupplier) {
      updateSupplier(editingSupplier.id, formData);
    } else {
      addSupplier({
        ...formData,
        lastOrderDate: 'Never',
      });
    }
    setIsAddDrawerOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold text-[#1C1B18] tracking-tight leading-tight">
            Suppliers
          </h1>
          <p className="text-[13px] text-[#6B665E] mt-0.5">
            Manage vendor relationships, purchase agreements, and payables.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7FAE82] hover:bg-[#6C9C70] text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs self-start"
        >
          <Plus size={16} />
          <span>+ Add supplier</span>
        </button>
      </div>

      {/* StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          icon={<Users size={18} strokeWidth={2} />}
          iconBgColor="bg-[#E6F1E6] text-[#2E8B57]"
          label="Active Suppliers"
          value={activeCount}
          trend={`${suppliers.length} total vendors`}
          isPositive={true}
        />
        <StatCard
          icon={<CreditCard size={18} strokeWidth={2} />}
          iconBgColor="bg-[#FDECEC] text-[#D64545]"
          label="Outstanding Payable"
          value={formatINR(totalPayable)}
          trend="Due in Net 30 terms"
          isPositive={false}
        />
        <StatCard
          icon={<Receipt size={18} strokeWidth={2} />}
          iconBgColor="bg-[#FFF4DC] text-[#D98E0B]"
          label="Open Purchase Orders"
          value={openPOCount}
          trend="Pending delivery"
          isPositive={true}
          onClick={() => navigate('/app/purchase-orders')}
        />
      </div>

      {/* Search Toolbar */}
      <div className="bg-white rounded-2xl p-3 border border-[#EEE6DA] flex items-center justify-between shadow-2xs">
        <div className="relative max-w-md w-full">
          <Search size={15} className="absolute left-3 top-2.5 text-[#9A948A]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search suppliers by business name, contact person, or phone..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#EEE6DA] text-xs focus:border-[#7FAE82] outline-none"
          />
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-2xl border border-[#EEE6DA] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF6EF] border-b border-[#EEE6DA] text-[#9A948A]">
              <tr>
                <th className="py-3 px-4 font-medium">Supplier</th>
                <th className="py-3 px-3 font-medium">Contact Person</th>
                <th className="py-3 px-3 font-medium">Phone & Email</th>
                <th className="py-3 px-3 font-medium">Terms</th>
                <th className="py-3 px-3 font-medium text-right">Outstanding Balance</th>
                <th className="py-3 px-3 font-medium">Last Order</th>
                <th className="py-3 px-3 font-medium text-center">Status</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEE6DA]/80">
              {filteredSuppliers.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => setViewingSupplier(s)}
                  className="hover:bg-[#FAF6EF]/60 transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#FAF6EF] text-[#6B665E] border border-[#EEE6DA] flex items-center justify-center font-bold text-xs uppercase">
                        {s.name.slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-semibold text-[#1C1B18] text-[13px] group-hover:text-[#6C9C70]">
                          {s.name}
                        </div>
                        <div className="text-[11px] text-[#9A948A]">GST: {s.gstin || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-medium text-[#1C1B18]">{s.contactPerson}</td>
                  <td className="py-3 px-3 text-[#6B665E]">
                    <div>{s.phone}</div>
                    <div className="text-[11px] text-[#9A948A]">{s.email}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="bg-[#FAF6EF] px-2 py-0.5 rounded border border-[#EEE6DA] text-[11px] font-medium text-[#1C1B18]">
                      {s.paymentTerms}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-[#1C1B18] tabular-nums">
                    {s.outstandingBalance > 0 ? (
                      <span className="text-[#D64545]">{formatINR(s.outstandingBalance)}</span>
                    ) : (
                      <span className="text-[#2E8B57]">₹ 0</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-[#6B665E]">{s.lastOrderDate}</td>
                  <td className="py-3 px-3 text-center">
                    <Badge variant={s.status === 'active' ? 'success' : 'neutral'}>
                      {s.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td
                    className="py-3 px-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(s)}
                      className="px-2.5 py-1 rounded-lg border border-[#EEE6DA] text-xs font-semibold text-[#1C1B18] hover:bg-[#FAF6EF] cursor-pointer"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Drawer */}
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
                    {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
                  </h3>
                  <p className="text-xs text-[#6B665E]">
                    Save vendor profile and credit terms.
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

              <form id="supplier-form" onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                    Company / Vendor Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Apex Garments Pvt Ltd"
                    className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs focus:border-[#7FAE82] outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                      Contact Person *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      placeholder="e.g. Harish Mehta"
                      className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none focus:border-[#7FAE82]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98201 54321"
                      className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none focus:border-[#7FAE82]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="orders@vendor.com"
                      className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                      GSTIN / Tax ID
                    </label>
                    <input
                      type="text"
                      value={formData.gstin}
                      onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                      placeholder="27AAACA1234A1Z1"
                      className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                      Payment Terms
                    </label>
                    <select
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs bg-white outline-none"
                    >
                      <option value="COD">Cash On Delivery (COD)</option>
                      <option value="Net 15">Net 15 Days</option>
                      <option value="Net 30">Net 30 Days</option>
                      <option value="Net 60">Net 60 Days</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs bg-white outline-none"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                    Warehouse / Office Address
                  </label>
                  <textarea
                    rows={2}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Plot / Street / City / State"
                    className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none resize-none"
                  />
                </div>
              </form>

              <div className="p-4 bg-[#FAF6EF] border-t border-[#EEE6DA] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddDrawerOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#6B665E]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="supplier-form"
                  className="px-5 py-2 rounded-xl bg-[#7FAE82] hover:bg-[#6C9C70] text-white text-xs font-semibold cursor-pointer"
                >
                  {editingSupplier ? 'Update Supplier' : 'Save Supplier'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Detail Drawer */}
      {viewingSupplier && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-xs"
            onClick={() => setViewingSupplier(null)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xl bg-white border-l border-[#EEE6DA] shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
              <div className="p-5 border-b border-[#EEE6DA]">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#FAF6EF] text-[#6B665E] border border-[#EEE6DA] flex items-center justify-center font-bold text-sm">
                      {viewingSupplier.name.slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#1C1B18]">{viewingSupplier.name}</h3>
                      <div className="text-xs text-[#6B665E]">
                        Contact: {viewingSupplier.contactPerson} · {viewingSupplier.phone}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewingSupplier(null)}
                    className="p-1 rounded-lg text-[#6B665E] hover:bg-[#FAF6EF]"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="p-3 rounded-xl bg-[#FAF6EF] border border-[#EEE6DA]">
                    <div className="text-[11px] text-[#6B665E]">Outstanding Payable</div>
                    <div className="text-lg font-bold text-[#D64545] tabular-nums mt-0.5">
                      {formatINR(viewingSupplier.outstandingBalance)}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FAF6EF] border border-[#EEE6DA]">
                    <div className="text-[11px] text-[#6B665E]">Payment Terms</div>
                    <div className="text-base font-bold text-[#1C1B18] mt-0.5">
                      {viewingSupplier.paymentTerms}
                    </div>
                  </div>
                </div>

                {/* Sub-tabs */}
                <div className="flex gap-4 border-b border-[#EEE6DA] mt-4 pt-1">
                  <button
                    type="button"
                    onClick={() => setDetailTab('pos')}
                    className={`pb-2 text-xs font-semibold border-b-2 -mb-px ${
                      detailTab === 'pos'
                        ? 'border-[#7FAE82] text-[#1C1B18]'
                        : 'border-transparent text-[#6B665E]'
                    }`}
                  >
                    Purchase Orders
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailTab('products')}
                    className={`pb-2 text-xs font-semibold border-b-2 -mb-px ${
                      detailTab === 'products'
                        ? 'border-[#7FAE82] text-[#1C1B18]'
                        : 'border-transparent text-[#6B665E]'
                    }`}
                  >
                    Catalog Products
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                {detailTab === 'pos' ? (
                  <div className="space-y-3">
                    {purchaseOrders
                      .filter((p) => p.supplierId === viewingSupplier.id)
                      .map((po) => (
                        <div
                          key={po.id}
                          className="p-3.5 rounded-xl border border-[#EEE6DA] bg-[#FAF6EF]/40 flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold text-xs text-[#1C1B18]">{po.poNumber}</div>
                            <div className="text-[11px] text-[#6B665E]">
                              Order Date: {po.orderDate} · {po.items.length} items
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-xs text-[#1C1B18] tabular-nums">
                              {formatINR(po.total)}
                            </div>
                            <Badge variant={po.status === 'Received' ? 'success' : 'warning'}>
                              {po.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {products
                      .filter((p) => p.supplierId === viewingSupplier.id)
                      .map((prod) => (
                        <div
                          key={prod.id}
                          className="p-3 rounded-xl border border-[#EEE6DA] flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-semibold text-[#1C1B18]">{prod.name}</div>
                            <div className="text-[#9A948A]">SKU: {prod.sku}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-[#1C1B18] tabular-nums">
                              Cost: {formatINR(prod.purchasePrice)}
                            </div>
                            <span className="text-[#6B665E]">Stock: {prod.stock}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div className="p-4 bg-[#FAF6EF] border-t border-[#EEE6DA] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setViewingSupplier(null);
                    navigate('/app/purchase-orders');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#7FAE82] text-white text-xs font-semibold hover:bg-[#6C9C70]"
                >
                  Create Purchase Order
                </button>
                <button
                  type="button"
                  onClick={() => setViewingSupplier(null)}
                  className="text-xs text-[#6B665E] hover:text-[#1C1B18]"
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
