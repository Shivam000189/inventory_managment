import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  X,
  Trash2,
  ChevronRight,
  PackageCheck,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  CreditCard,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { useApp } from '../context/AppContext';
import { PurchaseOrder, POItem, POStatus } from '../types';
import { formatINR } from '../lib/formatters';

export const PurchaseOrdersPage: React.FC = () => {
  const {
    purchaseOrders,
    createPurchaseOrder,
    updatePOStatus,
    receivePOItems,
    suppliers,
    addSupplier,
    products,
    businessProfile,
  } = useApp();

  const [activeTab, setActiveTab] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null);
  const [receivingPO, setReceivingPO] = useState<PurchaseOrder | null>(null);
  const [receivingMap, setReceivingMap] = useState<Record<string, number>>({});

  // New PO Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [expectedDate, setExpectedDate] = useState('05 Nov 2026');
  const [poError, setPoError] = useState('');
  const [isSubmittingPO, setIsSubmittingPO] = useState(false);

  // New Vendor Form State
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [newVendorData, setNewVendorData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    gstin: '',
    address: '',
    city: '',
    state: '',
    paymentTerms: 'Net 30' as 'COD' | 'Net 15' | 'Net 30' | 'Net 60',
    notes: '',
  });
  const [vendorError, setVendorError] = useState('');
  const [isSubmittingVendor, setIsSubmittingVendor] = useState(false);

  useEffect(() => {
    if (!selectedSupplierId && suppliers.length > 0) {
      setSelectedSupplierId(suppliers[0].id);
    }
  }, [suppliers, selectedSupplierId]);

  const selectedSupplier = suppliers.find((s) => s.id === selectedSupplierId) || suppliers[0];

  const [poLines, setPoLines] = useState<
    { productId: string; quantity: number; unitCost: number; taxRate: number }[]
  >([
    {
      productId: products[0]?.id || '',
      quantity: 50,
      unitCost: products[0]?.purchasePrice || 100,
      taxRate: products[0]?.taxRate || 18,
    },
  ]);
  const [shippingFee, setShippingFee] = useState(300);
  const [discountAmount, setDiscountAmount] = useState(0);

  const statuses: (string | POStatus)[] = [
    'All',
    'Ordered',
    'Partially received',
    'Received',
    'Draft',
    'Cancelled',
  ];

  const filteredPOs = purchaseOrders.filter((po) => {
    const matchesSearch =
      po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'All' || po.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const handleAddLine = () => {
    const nextProd = products[poLines.length % products.length] || products[0];
    setPoLines([
      ...poLines,
      {
        productId: nextProd.id,
        quantity: 20,
        unitCost: nextProd.purchasePrice,
        taxRate: nextProd.taxRate,
      },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    setPoLines(poLines.filter((_, i) => i !== index));
  };

  // Calculations for new PO
  const calculatedItems: POItem[] = poLines.map((line) => {
    const prod = products.find((p) => p.id === line.productId) || products[0];
    const itemSubtotal = line.quantity * line.unitCost;
    const tax = (itemSubtotal * line.taxRate) / 100;
    return {
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      orderedQty: line.quantity,
      receivedQty: 0,
      unitCost: line.unitCost,
      taxRate: line.taxRate,
      lineTotal: Math.round(itemSubtotal + tax),
    };
  });

  const subtotal = calculatedItems.reduce(
    (acc, it) => acc + it.orderedQty * it.unitCost,
    0
  );
  const totalTax = calculatedItems.reduce(
    (acc, it) => acc + (it.orderedQty * it.unitCost * it.taxRate) / 100,
    0
  );
  const grandTotal = Math.round(subtotal + totalTax + shippingFee - discountAmount);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find((s) => s.id === selectedSupplierId) || suppliers[0];
    if (!sup) {
      setPoError('Please select or add a supplier before creating a purchase order.');
      return;
    }
    if (calculatedItems.length === 0) {
      setPoError('Please add at least one line item to the purchase order.');
      return;
    }
    setPoError('');
    setIsSubmittingPO(true);
    try {
      await createPurchaseOrder({
        supplierId: sup.id,
        supplierName: sup.name,
        orderDate: '26 Oct 2026',
        expectedDate,
        items: calculatedItems,
        subtotal,
        discount: discountAmount,
        tax: totalTax,
        shipping: shippingFee,
        total: grandTotal,
        paymentStatus: 'Unpaid',
        status: 'Ordered',
      });
      setIsCreateOpen(false);
    } catch (err: any) {
      setPoError(err?.message || 'Failed to create purchase order.');
    } finally {
      setIsSubmittingPO(false);
    }
  };

  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorData.name.trim()) {
      setVendorError('Please enter a supplier/vendor name.');
      return;
    }
    if (!newVendorData.phone.trim()) {
      setVendorError('Please enter a contact phone number.');
      return;
    }
    setVendorError('');
    setIsSubmittingVendor(true);
    try {
      const fullAddress = [
        newVendorData.address.trim(),
        newVendorData.city.trim(),
        newVendorData.state.trim()
      ].filter(Boolean).join(', ');

      const created = await addSupplier({
        name: newVendorData.name.trim(),
        contactPerson: newVendorData.contactPerson.trim(),
        phone: newVendorData.phone.trim(),
        email: newVendorData.email.trim(),
        gstin: newVendorData.gstin.trim(),
        address: fullAddress,
        paymentTerms: newVendorData.paymentTerms,
        outstandingBalance: 0,
        lastOrderDate: 'Never',
        status: 'active',
        notes: newVendorData.notes.trim(),
      });

      if (created && created.id) {
        setSelectedSupplierId(created.id);
      }
      setIsAddVendorOpen(false);
      setNewVendorData({
        name: '',
        contactPerson: '',
        phone: '',
        email: '',
        gstin: '',
        address: '',
        city: '',
        state: '',
        paymentTerms: 'Net 30',
        notes: '',
      });
    } catch (err: any) {
      setVendorError(err?.message || 'Failed to add vendor.');
    } finally {
      setIsSubmittingVendor(false);
    }
  };

  const handleReceiveConfirm = () => {
    if (!receivingPO) return;
    receivePOItems(receivingPO.id, receivingMap);
    setReceivingPO(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold text-[#1C1B18] tracking-tight leading-tight">
            Purchase Orders
          </h1>
          <p className="text-[13px] text-[#6B665E] mt-0.5">
            Procure inventory, track supplier deliveries, and receive goods.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setVendorError('');
              setIsAddVendorOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#EEE6DA] bg-white hover:bg-[#FAF6EF] text-[#1C1B18] text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
          >
            <Building2 size={15} className="text-[#6B665E]" />
            <span>Add Vendor</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setPoError('');
              setIsCreateOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7FAE82] hover:bg-[#6C9C70] !text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs self-start"
            style={{ color: '#ffffff' }}
          >
            <Plus size={16} />
            <span>New Purchase Order</span>
          </button>
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEE6DA] pb-2">
        <div className="flex items-center gap-1 bg-[#FAF6EF] p-1 rounded-xl border border-[#EEE6DA]">
          {statuses.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setActiveTab(st)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === st
                  ? 'bg-white text-[#1C1B18] shadow-2xs'
                  : 'text-[#6B665E] hover:text-[#1C1B18]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-2.5 text-[#9A948A]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search PO # or supplier..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#EEE6DA] text-xs bg-white outline-none focus:border-[#7FAE82]"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-[#EEE6DA] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF6EF] border-b border-[#EEE6DA] text-[#9A948A]">
              <tr>
                <th className="py-3 px-4 font-medium">PO Number</th>
                <th className="py-3 px-3 font-medium">Supplier</th>
                <th className="py-3 px-3 font-medium">Order Date</th>
                <th className="py-3 px-3 font-medium">Expected</th>
                <th className="py-3 px-3 font-medium text-center">Items Count</th>
                <th className="py-3 px-3 font-medium text-right">Total Amount</th>
                <th className="py-3 px-3 font-medium text-center">Payment</th>
                <th className="py-3 px-3 font-medium text-center">Status</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEE6DA]/80">
              {filteredPOs.map((po) => (
                <tr
                  key={po.id}
                  onClick={() => setViewingPO(po)}
                  className="hover:bg-[#FAF6EF]/60 transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-4 font-bold text-[#1C1B18] text-[13px] group-hover:text-[#6C9C70]">
                    {po.poNumber}
                  </td>
                  <td className="py-3 px-3 font-medium text-[#1C1B18]">{po.supplierName}</td>
                  <td className="py-3 px-3 text-[#6B665E]">{po.orderDate}</td>
                  <td className="py-3 px-3 text-[#6B665E]">{po.expectedDate}</td>
                  <td className="py-3 px-3 text-center text-[#1C1B18] font-semibold tabular-nums">
                    {po.items.length} items
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-[#1C1B18] tabular-nums text-sm">
                    {formatINR(po.total)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                        po.paymentStatus === 'Paid'
                          ? 'bg-[#E8F5EC] text-[#2E8B57]'
                          : 'bg-[#FFF4DC] text-[#D98E0B]'
                      }`}
                    >
                      {po.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <Badge
                      variant={
                        po.status === 'Received'
                          ? 'success'
                          : po.status === 'Partially received'
                          ? 'warning'
                          : po.status === 'Ordered'
                          ? 'primary'
                          : 'neutral'
                      }
                    >
                      {po.status}
                    </Badge>
                  </td>
                  <td
                    className="py-3 px-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      {po.status !== 'Received' && po.status !== 'Cancelled' && (
                        <button
                          type="button"
                          onClick={() => {
                            setReceivingPO(po);
                            const initialMap: Record<string, number> = {};
                            po.items.forEach((item) => {
                              initialMap[item.productId] = Math.max(
                                0,
                                item.orderedQty - item.receivedQty
                              );
                            });
                            setReceivingMap(initialMap);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#E6F1E6] text-[#2E8B57] hover:bg-[#d5ebd5] font-semibold text-xs cursor-pointer flex items-center gap-1"
                        >
                          <PackageCheck size={13} />
                          <span>Receive</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setViewingPO(po)}
                        className="p-1 rounded-lg text-[#6B665E] hover:text-[#1C1B18] hover:bg-[#FAF6EF]"
                        title="View details"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Purchase Order Modal / Drawer */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-3xl w-full border border-[#EEE6DA] shadow-2xl p-6 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#EEE6DA] pb-3 mb-4">
                <div>
                  <h3 className="text-base font-semibold text-[#1C1B18]">New Purchase Order</h3>
                  <p className="text-xs text-[#6B665E]">Draft order items and generate vendor PO.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="p-1.5 rounded-lg text-[#6B665E] hover:bg-[#FAF6EF]"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-[#1C1B18]">
                      Select Supplier / Vendor *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setVendorError('');
                        setIsAddVendorOpen(true);
                      }}
                      className="text-xs font-semibold text-[#7FAE82] hover:text-[#5F8B62] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Plus size={13} className="stroke-[2.5]" />
                      <span>+ Add New Vendor</span>
                    </button>
                  </div>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#EEE6DA] text-xs bg-white text-[#1C1B18] font-medium outline-none focus:border-[#7FAE82] transition-colors"
                  >
                    {suppliers.length === 0 ? (
                      <option value="">No suppliers found — click + Add New Vendor</option>
                    ) : (
                      suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} {s.contactPerson ? `(${s.contactPerson})` : ''} {s.phone ? `— ${s.phone}` : ''}
                        </option>
                      ))
                    )}
                  </select>

                  {/* Selected Supplier Preview Card */}
                  {selectedSupplier && (
                    <div className="mt-2.5 p-3 rounded-xl bg-[#FAF6EF] border border-[#EEE6DA] text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#1C1B18]">{selectedSupplier.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EBF3EB] text-[#4A784E] font-semibold">
                          Active Vendor
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[#6B665E] text-[11px] pt-1 border-t border-[#EEE6DA]/70">
                        {selectedSupplier.contactPerson && (
                          <div>Contact: <span className="text-[#1C1B18] font-medium">{selectedSupplier.contactPerson}</span></div>
                        )}
                        {selectedSupplier.phone && (
                          <div>Phone: <span className="text-[#1C1B18] font-medium">{selectedSupplier.phone}</span></div>
                        )}
                        {selectedSupplier.gstin && (
                          <div>GSTIN: <span className="text-[#1C1B18] font-medium">{selectedSupplier.gstin}</span></div>
                        )}
                        {selectedSupplier.paymentTerms && (
                          <div>Terms: <span className="text-[#1C1B18] font-medium">{selectedSupplier.paymentTerms}</span></div>
                        )}
                        {selectedSupplier.address && (
                          <div className="col-span-2 truncate">Address: <span className="text-[#1C1B18] font-medium">{selectedSupplier.address}</span></div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1B18] mb-1.5">
                    Expected Delivery Date *
                  </label>
                  <input
                    type="text"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#EEE6DA] text-xs outline-none focus:border-[#7FAE82]"
                    placeholder="e.g. 05 Nov 2026"
                  />
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-[#EEE6DA] rounded-2xl p-3 bg-[#FAF6EF]/30 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#1C1B18]">Order Line Items</span>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="text-xs font-semibold text-[#7FAE82] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {poLines.map((line, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-xl border border-[#EEE6DA] text-xs"
                    >
                      <div className="col-span-5">
                        <select
                          value={line.productId}
                          onChange={(e) => {
                            const prod = products.find((p) => p.id === e.target.value);
                            const updated = [...poLines];
                            updated[idx].productId = e.target.value;
                            if (prod) {
                              updated[idx].unitCost = prod.purchasePrice;
                              updated[idx].taxRate = prod.taxRate;
                            }
                            setPoLines(updated);
                          }}
                          className="w-full px-2 py-1.5 rounded-lg border border-[#EEE6DA] outline-none text-xs"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          min={1}
                          value={line.quantity}
                          onChange={(e) => {
                            const updated = [...poLines];
                            updated[idx].quantity = parseInt(e.target.value) || 1;
                            setPoLines(updated);
                          }}
                          className="w-full px-2 py-1.5 rounded-lg border border-[#EEE6DA] outline-none text-center font-bold tabular-nums"
                          placeholder="Qty"
                        />
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          min={0}
                          value={line.unitCost}
                          onChange={(e) => {
                            const updated = [...poLines];
                            updated[idx].unitCost = parseFloat(e.target.value) || 0;
                            setPoLines(updated);
                          }}
                          className="w-full px-2 py-1.5 rounded-lg border border-[#EEE6DA] outline-none text-right font-semibold tabular-nums"
                          placeholder="Cost"
                        />
                      </div>

                      <div className="col-span-2 text-right font-bold text-[#1C1B18] tabular-nums">
                        {formatINR(line.quantity * line.unitCost)}
                      </div>

                      <div className="col-span-1 text-right">
                        {poLines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(idx)}
                            className="text-[#D64545] p-1 hover:bg-[#FDECEC] rounded"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Breakdown */}
              <div className="bg-[#FAF6EF] rounded-2xl p-4 border border-[#EEE6DA] space-y-2 text-xs">
                <div className="flex justify-between text-[#6B665E]">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#1C1B18] tabular-nums">{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#6B665E]">
                  <span>Estimated GST Taxes</span>
                  <span className="font-semibold text-[#1C1B18] tabular-nums">{formatINR(totalTax)}</span>
                </div>
                <div className="flex justify-between text-[#6B665E] items-center">
                  <span>Shipping & Freight</span>
                  <input
                    type="number"
                    min={0}
                    value={shippingFee}
                    onChange={(e) => setShippingFee(parseFloat(e.target.value) || 0)}
                    className="w-20 px-2 py-0.5 rounded border border-[#EEE6DA] bg-white text-right text-xs font-semibold tabular-nums"
                  />
                </div>
                <div className="border-t border-[#EEE6DA] pt-2 flex justify-between text-sm font-bold text-[#1C1B18]">
                  <span>Grand Total</span>
                  <span className="text-base text-[#2E8B57] tabular-nums">{formatINR(grandTotal)}</span>
                </div>
              </div>
            </div>

            {poError && (
              <div className="mt-3 p-3 rounded-xl bg-[#FDECEC] border border-[#FAC7C7] text-xs text-[#D64545] flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{poError}</span>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-[#EEE6DA]">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-[#6B665E] hover:bg-[#FAF6EF] rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateSubmit}
                disabled={isSubmittingPO}
                className="px-5 py-2 rounded-xl bg-[#7FAE82] hover:bg-[#6C9C70] !text-white text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50"
                style={{ color: '#ffffff' }}
              >
                {isSubmittingPO ? 'Sending PO...' : 'Send Purchase Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receive Goods Modal */}
      {receivingPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-[#EEE6DA] shadow-2xl p-6 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-semibold text-[#1C1B18] mb-1">
              Receive Goods: {receivingPO.poNumber}
            </h3>
            <p className="text-xs text-[#6B665E] mb-4">
              Confirm verified items delivered from {receivingPO.supplierName}. Stock counts will immediately increment.
            </p>

            <div className="space-y-3 mb-5 max-h-72 overflow-y-auto">
              {receivingPO.items.map((item) => {
                const remaining = item.orderedQty - item.receivedQty;
                return (
                  <div
                    key={item.productId}
                    className="p-3 rounded-xl border border-[#EEE6DA] bg-[#FAF6EF]/40 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-[#1C1B18]">{item.productName}</div>
                      <div className="text-[11px] text-[#6B665E]">
                        Ordered: {item.orderedQty} · Received so far: {item.receivedQty} · Remaining: {remaining}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#6B665E]">Receiving:</span>
                      <input
                        type="number"
                        min={0}
                        max={remaining}
                        value={receivingMap[item.productId] ?? remaining}
                        onChange={(e) =>
                          setReceivingMap({
                            ...receivingMap,
                            [item.productId]: Math.min(
                              remaining,
                              parseInt(e.target.value) || 0
                            ),
                          })
                        }
                        className="w-16 px-2 py-1 rounded-lg border border-[#DDD3C4] bg-white text-center font-bold tabular-nums"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EEE6DA]">
              <button
                type="button"
                onClick={() => setReceivingPO(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#6B665E]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReceiveConfirm}
                className="px-4 py-1.5 bg-[#7FAE82] text-white text-xs font-semibold rounded-xl hover:bg-[#6C9C70] cursor-pointer"
              >
                Confirm Goods Inward
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PO Printable Detail View Modal */}
      {viewingPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-[#EEE6DA] shadow-2xl p-6 max-h-[92vh] overflow-y-auto">
            {/* Printable Sheet */}
            <div className="border border-[#EEE6DA] rounded-2xl p-6 bg-white space-y-5">
              <div className="flex items-start justify-between border-b border-[#EEE6DA] pb-4">
                <div>
                  <h2 className="text-xl font-bold text-[#1C1B18] tracking-tight">PURCHASE ORDER</h2>
                  <div className="text-xs font-mono text-[#6B665E] mt-1">{viewingPO.poNumber}</div>
                  <div className="text-xs text-[#6B665E]">Date: {viewingPO.orderDate}</div>
                </div>
                <div className="text-right text-xs text-[#6B665E]">
                  <div className="font-bold text-sm text-[#1C1B18]">{businessProfile.name}</div>
                  <div>GSTIN: {businessProfile.taxNumber}</div>
                  <div>{businessProfile.phone}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-bold text-[#1C1B18]">Vendor / Supplier:</span>
                  <div className="text-[#6B665E] mt-1">
                    <div className="font-semibold text-[#1C1B18]">{viewingPO.supplierName}</div>
                    <div>Expected Delivery: {viewingPO.expectedDate}</div>
                    <div>Status: {viewingPO.status}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-[#1C1B18]">Ship To:</span>
                  <div className="text-[#6B665E] mt-1">
                    <div>{businessProfile.address}</div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF6EF] border-b border-[#EEE6DA] text-[#9A948A]">
                  <tr>
                    <th className="py-2 px-2">Item Description</th>
                    <th className="py-2 px-2 text-center">Ordered</th>
                    <th className="py-2 px-2 text-center">Received</th>
                    <th className="py-2 px-2 text-right">Unit Cost</th>
                    <th className="py-2 px-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEE6DA]">
                  {viewingPO.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-2 font-medium text-[#1C1B18]">{it.productName}</td>
                      <td className="py-2 px-2 text-center tabular-nums">{it.orderedQty}</td>
                      <td className="py-2 px-2 text-center tabular-nums text-[#2E8B57] font-semibold">{it.receivedQty}</td>
                      <td className="py-2 px-2 text-right tabular-nums">{formatINR(it.unitCost)}</td>
                      <td className="py-2 px-2 text-right font-bold tabular-nums">{formatINR(it.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-[#EEE6DA] pt-3 flex justify-between font-bold text-sm text-[#1C1B18]">
                <span>Total Amount</span>
                <span className="text-base text-[#2E8B57] tabular-nums">{formatINR(viewingPO.total)}</span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-1.5 border border-[#EEE6DA] rounded-xl text-xs font-semibold text-[#1C1B18] hover:bg-[#FAF6EF] inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Printer size={15} />
                <span>Print PO</span>
              </button>

              <button
                type="button"
                onClick={() => setViewingPO(null)}
                className="px-4 py-1.5 bg-[#1C1B18] !text-white text-xs font-semibold rounded-xl hover:bg-black cursor-pointer"
                style={{ color: '#ffffff' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Vendor Modal */}
      {isAddVendorOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-[#EEE6DA] shadow-2xl p-6 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EEE6DA] pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FAF6EF] border border-[#EEE6DA] flex items-center justify-center text-[#7FAE82]">
                  <Building2 size={18} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#1C1B18]">Add New Vendor</h3>
                  <p className="text-xs text-[#6B665E]">Enter supplier information to save to your database.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddVendorOpen(false)}
                className="p-1.5 rounded-lg text-[#6B665E] hover:bg-[#FAF6EF] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {vendorError && (
              <div className="mb-4 p-3 rounded-xl bg-[#FDECEC] border border-[#FAC7C7] text-xs text-[#D64545] flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{vendorError}</span>
              </div>
            )}

            <form onSubmit={handleSaveVendor} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                  Vendor / Supplier Name *
                </label>
                <input
                  type="text"
                  required
                  value={newVendorData.name}
                  onChange={(e) => setNewVendorData({ ...newVendorData, name: e.target.value })}
                  placeholder="e.g. Apex Health Logistics"
                  className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none focus:border-[#7FAE82]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={newVendorData.contactPerson}
                    onChange={(e) => setNewVendorData({ ...newVendorData, contactPerson: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none focus:border-[#7FAE82]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={newVendorData.phone}
                    onChange={(e) => setNewVendorData({ ...newVendorData, phone: e.target.value })}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none focus:border-[#7FAE82]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={newVendorData.email}
                    onChange={(e) => setNewVendorData({ ...newVendorData, email: e.target.value })}
                    placeholder="vendor@example.com"
                    className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none focus:border-[#7FAE82]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                    GSTIN / Tax ID
                  </label>
                  <input
                    type="text"
                    value={newVendorData.gstin}
                    onChange={(e) => setNewVendorData({ ...newVendorData, gstin: e.target.value.toUpperCase() })}
                    placeholder="e.g. 09ABCDE1234F1Z5"
                    className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none focus:border-[#7FAE82] uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                  Address / Warehouse Location
                </label>
                <input
                  type="text"
                  value={newVendorData.address}
                  onChange={(e) => setNewVendorData({ ...newVendorData, address: e.target.value })}
                  placeholder="e.g. Plot 45, Sector 62 Industrial Area"
                  className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none focus:border-[#7FAE82]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={newVendorData.city}
                    onChange={(e) => setNewVendorData({ ...newVendorData, city: e.target.value })}
                    placeholder="e.g. Noida"
                    className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none focus:border-[#7FAE82]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={newVendorData.state}
                    onChange={(e) => setNewVendorData({ ...newVendorData, state: e.target.value })}
                    placeholder="e.g. Uttar Pradesh"
                    className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none focus:border-[#7FAE82]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={newVendorData.paymentTerms}
                    onChange={(e) => setNewVendorData({ ...newVendorData, paymentTerms: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none focus:border-[#7FAE82] bg-white"
                  >
                    <option value="Net 30">Net 30</option>
                    <option value="Net 15">Net 15</option>
                    <option value="Net 60">Net 60</option>
                    <option value="COD">COD</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                  Notes / Terms (Optional)
                </label>
                <textarea
                  rows={2}
                  value={newVendorData.notes}
                  onChange={(e) => setNewVendorData({ ...newVendorData, notes: e.target.value })}
                  placeholder="Primary supplier for pharmacy items, discount agreements, etc."
                  className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none focus:border-[#7FAE82]"
                />
              </div>

              <div className="pt-3 border-t border-[#EEE6DA] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddVendorOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#EEE6DA] text-xs font-semibold text-[#6B665E] hover:bg-[#FAF6EF] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingVendor}
                  className="px-4 py-2 rounded-xl bg-[#7FAE82] hover:bg-[#6C9C70] !text-white text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50"
                  style={{ color: '#ffffff' }}
                >
                  {isSubmittingVendor ? 'Saving Vendor...' : 'Save & Select Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
