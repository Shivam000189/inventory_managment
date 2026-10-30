import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Printer,
  Share2,
  CreditCard,
  Banknote,
  QrCode,
  UserCheck,
  ShoppingBag,
  RotateCcw,
  X,
  FileText,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { ProductIcon } from '../components/common/ProductIcon';
import { Badge } from '../components/common/Badge';
import { useApp } from '../context/AppContext';
import { Product, PaymentMethod, Bill, BillItem } from '../types';
import { formatINR } from '../lib/formatters';

interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
}

export const PosSalesPage: React.FC = () => {
  const {
    products,
    customers,
    addCustomer,
    createBill,
    bills,
    cancelBill,
    currentUser,
    businessProfile,
    posActiveTab,
    setPosActiveTab,
  } = useApp();

  // Search & Categories for POS
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || 'cust-01');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [billNotes, setBillNotes] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // Modals & Drawers
  const [receiptBill, setReceiptBill] = useState<Bill | null>(null);
  const [selectedBillDetail, setSelectedBillDetail] = useState<Bill | null>(null);
  const [isQuickAddCustomerOpen, setIsQuickAddCustomerOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  // Bills filter
  const [billSearch, setBillSearch] = useState('');
  const [billPaymentFilter, setBillPaymentFilter] = useState('All');

  const categories = [
    'All',
    'Apparel',
    'Pharmacy',
    'Electronics',
    'Footwear',
    'Groceries',
    'Home & Living',
    'Stationery',
  ];

  // Autofocus POS search on mount
  useEffect(() => {
    if (posActiveTab === 'new_bill') {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [posActiveTab]);

  // Product filtering for POS
  const filteredProducts = products.filter((p) => {
    const q = productSearch.toLowerCase().trim();
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.barcode.includes(q);
    const matchesCategory =
      selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Keyboard shortcut: Press Enter in search bar to add first match!
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && filteredProducts.length > 0) {
      e.preventDefault();
      const firstAvailable = filteredProducts.find((p) => p.stock > 0) || filteredProducts[0];
      if (firstAvailable && firstAvailable.stock > 0) {
        addToCart(firstAvailable);
        setProductSearch('');
      }
    }
  };

  const addToCart = (product: Product) => {
    if (product.stock <= 0 && !businessProfile.allowNegativeStock) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock && !businessProfile.allowNegativeStock) {
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, discount: 0 }];
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            if (nextQty > item.product.stock && !businessProfile.allowNegativeStock) {
              return item;
            }
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  // Cart totals calculations
  const rawSubtotal = cart.reduce((acc, it) => acc + it.product.sellingPrice * it.quantity, 0);
  const totalDiscount = Math.round((rawSubtotal * discountPercent) / 100);
  const discountedSubtotal = rawSubtotal - totalDiscount;

  // Compute GST taxes
  const totalTax = Math.round(
    cart.reduce((acc, it) => {
      const itemTotal = it.product.sellingPrice * it.quantity * (1 - discountPercent / 100);
      const taxPart = (itemTotal * it.product.taxRate) / (100 + it.product.taxRate);
      return acc + taxPart;
    }, 0)
  );

  const cartTotal = discountedSubtotal;
  const changeDue = Math.max(0, (cashTendered || 0) - cartTotal);

  const handleCreateBill = () => {
    if (cart.length === 0) return;

    const customer = customers.find((c) => c.id === selectedCustomerId) || customers[0];

    const billItems: BillItem[] = cart.map((it) => ({
      productId: it.product.id,
      productName: it.product.name,
      sku: it.product.sku,
      quantity: it.quantity,
      unitPrice: it.product.sellingPrice,
      discountAmount: Math.round((it.product.sellingPrice * it.quantity * discountPercent) / 100),
      taxRate: it.product.taxRate,
      total: Math.round(it.product.sellingPrice * it.quantity * (1 - discountPercent / 100)),
    }));

    const newBill = createBill({
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      items: billItems,
      subtotal: rawSubtotal - totalTax - totalDiscount,
      discount: totalDiscount,
      tax: totalTax,
      total: cartTotal,
      paymentMethod,
      status: paymentMethod === 'Credit' ? 'Credit' : 'Paid',
      cashTendered: paymentMethod === 'Cash' ? cashTendered : undefined,
      changeDue: paymentMethod === 'Cash' ? changeDue : undefined,
      notes: billNotes,
    });

    // Reset cart and open receipt modal
    setCart([]);
    setBillNotes('');
    setCashTendered(0);
    setReceiptBill(newBill);
  };

  const handleQuickAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName) return;
    const added = addCustomer({
      name: newCustName,
      phone: newCustPhone || '+91 90000 00000',
      email: `${newCustName.toLowerCase().replace(/\s+/g, '')}@example.com`,
      type: 'Retail',
      creditLimit: 5000,
    });
    setSelectedCustomerId(added.id);
    setNewCustName('');
    setNewCustPhone('');
    setIsQuickAddCustomerOpen(false);
  };

  // Bills filtering: Salesperson only sees own bills; Admin sees all!
  const userFilteredBills = bills.filter((b) => {
    if (currentUser.role === 'salesperson') {
      return b.salespersonId === currentUser.id || b.createdBy === currentUser.name;
    }
    return true;
  });

  const displayBills = userFilteredBills.filter((b) => {
    const matchesSearch =
      b.billNumber.toLowerCase().includes(billSearch.toLowerCase()) ||
      b.customerName.toLowerCase().includes(billSearch.toLowerCase());
    const matchesPayment =
      billPaymentFilter === 'All' || b.paymentMethod === billPaymentFilter;
    return matchesSearch && matchesPayment;
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-150 pb-10">
      {/* Sub-nav Tabs: New Bill | Bills */}
      <div className="flex items-center justify-between border-b border-[#EEE6DA] pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPosActiveTab('new_bill')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              posActiveTab === 'new_bill'
                ? 'bg-[#1C1B18] text-white shadow-xs'
                : 'bg-white border border-[#EEE6DA] text-[#6B665E] hover:text-[#1C1B18]'
            }`}
          >
            New Bill (POS Terminal)
          </button>
          <button
            type="button"
            onClick={() => setPosActiveTab('bills')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              posActiveTab === 'bills'
                ? 'bg-[#1C1B18] text-white shadow-xs'
                : 'bg-white border border-[#EEE6DA] text-[#6B665E] hover:text-[#1C1B18]'
            }`}
          >
            {currentUser.role === 'salesperson' ? 'My Bills' : 'All Bills'} ({userFilteredBills.length})
          </button>
        </div>

        {posActiveTab === 'new_bill' && (
          <div className="text-xs text-[#6B665E] hidden sm:block">
            Press <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-[#EEE6DA]">Enter</kbd> to add first searched item
          </div>
        )}
      </div>

      {/* POS New Bill Two-Pane Layout */}
      {posActiveTab === 'new_bill' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Pane (≈62% / 7 cols on lg, 8 on xl): Product Search + Category Chips + Grid */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            {/* Search Input Bar */}
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3.5 top-3 text-[#9A948A] pointer-events-none"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Scan barcode or type product name, SKU (e.g. TS001, PM002)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#EEE6DA] bg-white text-xs focus:border-[#7FAE82] outline-none shadow-2xs text-[#1C1B18]"
              />
              {productSearch && (
                <button
                  type="button"
                  onClick={() => setProductSearch('')}
                  className="absolute right-3.5 top-2.5 text-[#9A948A] hover:text-[#1C1B18] p-0.5"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Category Chips (Horizontally Scrollable) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-[#1C1B18] text-white'
                      : 'bg-white border border-[#EEE6DA] text-[#6B665E] hover:bg-[#FAF6EF]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Product Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((p) => {
                const isOutOfStock = p.stock <= 0 && !businessProfile.allowNegativeStock;
                const isLow = p.stock > 0 && p.stock <= p.reorderLevel;
                const cartQty = cart.find((i) => i.product.id === p.id)?.quantity || 0;

                return (
                  <div
                    key={p.id}
                    onClick={() => !isOutOfStock && addToCart(p)}
                    className={`bg-white rounded-2xl p-3 border transition-all flex flex-col justify-between text-left relative ${
                      isOutOfStock
                        ? 'opacity-40 cursor-not-allowed border-[#EEE6DA] bg-[#FAF6EF]/50'
                        : 'border-[#EEE6DA] hover:border-[#7FAE82] hover:shadow-xs cursor-pointer active:scale-98'
                    }`}
                  >
                    {/* Cart counter badge if already in cart */}
                    {cartQty > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#7FAE82] text-white font-bold text-[10px] flex items-center justify-center shadow-xs">
                        {cartQty}
                      </span>
                    )}

                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <ProductIcon name={p.name} type={p.iconType} size={16} className="w-8 h-8 rounded-xl bg-[#FAF6EF] text-[#6B665E] flex items-center justify-center border border-[#EEE6DA]" />
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            isOutOfStock
                              ? 'bg-[#FDECEC] text-[#D64545]'
                              : isLow
                              ? 'bg-[#FFF4DC] text-[#D98E0B]'
                              : 'bg-[#E8F5EC] text-[#2E8B57]'
                          }`}
                        >
                          {isOutOfStock ? '0 stock' : `${p.stock} left`}
                        </span>
                      </div>

                      <h4 className="font-semibold text-xs text-[#1C1B18] line-clamp-1 leading-snug">
                        {p.name}
                      </h4>
                      <p className="text-[10.5px] text-[#9A948A] mt-0.5">
                        {p.sku}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[#EEE6DA] flex items-center justify-between">
                      <span className="font-bold text-[13px] text-[#1C1B18] tabular-nums">
                        {formatINR(p.sellingPrice)}
                      </span>
                      <span className="text-[10px] text-[#7FAE82] font-semibold">
                        + Add
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Pane (≈38% / 5 cols on lg, 4 on xl): Sticky Billing Cart Panel */}
          <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-3xl border border-[#EEE6DA] p-4 shadow-sm space-y-4 sticky top-20">
            {/* Cart Header & Customer Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={17} className="text-[#1C1B18]" />
                  <h3 className="font-bold text-sm text-[#1C1B18]">Current Bill</h3>
                </div>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCart([])}
                    className="text-[11px] text-[#D64545] hover:underline cursor-pointer"
                  >
                    Clear cart
                  </button>
                )}
              </div>

              {/* Customer Selector with quick add */}
              <div className="flex items-center gap-1.5">
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl border border-[#EEE6DA] text-xs bg-white text-[#1C1B18] outline-none"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone !== '—' ? `(${c.phone})` : ''}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsQuickAddCustomerOpen(true)}
                  className="p-1.5 rounded-xl border border-[#EEE6DA] hover:bg-[#FAF6EF] text-[#6B665E] cursor-pointer"
                  title="Quick add customer"
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>

            {/* Line Items List */}
            <div className="divide-y divide-[#EEE6DA] max-h-60 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-[#9A948A] text-xs space-y-1">
                  <ShoppingBag size={24} className="mx-auto text-[#DDD3C4]" />
                  <p>Cart is currently empty</p>
                  <p className="text-[11px] text-[#DDD3C4]">
                    Click items on the left to add to bill
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="py-2.5 flex items-center justify-between text-xs gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-[#1C1B18] truncate">
                        {item.product.name}
                      </div>
                      <div className="text-[11px] text-[#6B665E] tabular-nums">
                        {formatINR(item.product.sellingPrice)} × {item.quantity}
                      </div>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center border border-[#EEE6DA] rounded-lg bg-[#FAF6EF] shrink-0">
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.product.id, -1)}
                        className="p-1 text-[#6B665E] hover:text-[#1C1B18] cursor-pointer"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="px-2 font-bold text-[#1C1B18] tabular-nums text-xs">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.product.id, 1)}
                        className="p-1 text-[#6B665E] hover:text-[#1C1B18] cursor-pointer"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <div className="text-right shrink-0 w-16">
                      <div className="font-bold text-[#1C1B18] tabular-nums">
                        {formatINR(item.product.sellingPrice * item.quantity)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-[#9A948A] hover:text-[#D64545] p-1 cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Payment Method Segmented Control */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-[#6B665E]">
                Payment Method
              </label>
              <div className="grid grid-cols-4 gap-1 p-1 bg-[#FAF6EF] rounded-xl border border-[#EEE6DA]">
                {(['UPI', 'Cash', 'Card', 'Credit'] as PaymentMethod[]).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer text-center ${
                      paymentMethod === method
                        ? 'bg-white text-[#1C1B18] shadow-2xs'
                        : 'text-[#6B665E] hover:text-[#1C1B18]'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Cash Tendered & Change if Cash */}
            {paymentMethod === 'Cash' && (
              <div className="grid grid-cols-2 gap-2 bg-[#FAF6EF] p-2.5 rounded-xl border border-[#EEE6DA] text-xs">
                <div>
                  <label className="text-[10.5px] text-[#6B665E] block mb-0.5">Cash Tendered</label>
                  <input
                    type="number"
                    value={cashTendered || ''}
                    onChange={(e) => setCashTendered(parseFloat(e.target.value) || 0)}
                    placeholder="₹ 0"
                    className="w-full px-2 py-1 rounded-lg border border-[#DDD3C4] bg-white font-bold tabular-nums"
                  />
                </div>
                <div>
                  <label className="text-[10.5px] text-[#6B665E] block mb-0.5">Change Due</label>
                  <div className="px-2 py-1 font-bold text-[#2E8B57] text-sm tabular-nums">
                    {formatINR(changeDue)}
                  </div>
                </div>
              </div>
            )}

            {/* UPI QR preview notice if UPI */}
            {paymentMethod === 'UPI' && (
              <div className="p-2.5 rounded-xl bg-[#E8F5EC]/60 border border-[#b8dec0] flex items-center gap-2 text-xs text-[#2E8B57]">
                <QrCode size={18} className="shrink-0" />
                <span className="text-[11px] leading-tight">
                  UPI ID: <span className="font-mono font-bold">{businessProfile.upiId}</span>
                </span>
              </div>
            )}

            {/* Bill Summary */}
            <div className="bg-[#FAF6EF] rounded-2xl p-3 border border-[#EEE6DA] space-y-1.5 text-xs">
              <div className="flex justify-between text-[#6B665E]">
                <span>Items Subtotal</span>
                <span className="font-semibold text-[#1C1B18] tabular-nums">{formatINR(rawSubtotal)}</span>
              </div>
              <div className="flex justify-between text-[#6B665E]">
                <span>GST Taxes (Included)</span>
                <span className="font-semibold text-[#1C1B18] tabular-nums">{formatINR(totalTax)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-[#2E8B57]">
                  <span>Discount</span>
                  <span className="font-semibold tabular-nums">-{formatINR(totalDiscount)}</span>
                </div>
              )}
              <div className="border-t border-[#EEE6DA] pt-2 flex justify-between items-baseline">
                <span className="text-xs font-bold text-[#1C1B18]">Grand Total</span>
                <span className="text-xl font-extrabold text-[#1C1B18] tabular-nums">
                  {formatINR(cartTotal)}
                </span>
              </div>
            </div>

            {/* Create Bill Button */}
            <button
              type="button"
              disabled={cart.length === 0}
              onClick={handleCreateBill}
              className={`w-full py-3 rounded-2xl font-bold text-sm transition-all duration-150 cursor-pointer shadow-md ${
                cart.length === 0
                  ? 'bg-[#DDD3C4] text-[#9A948A] cursor-not-allowed shadow-none'
                  : 'bg-[#7FAE82] hover:bg-[#6C9C70] text-white active:scale-99'
              }`}
            >
              Create bill {cartTotal > 0 ? formatINR(cartTotal) : ''}
            </button>
          </div>
        </div>
      ) : (
        /* Bills List Tab */
        <div className="space-y-4">
          {/* Bills Toolbar */}
          <div className="bg-white rounded-2xl p-3 border border-[#EEE6DA] flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div className="relative max-w-sm w-full">
              <Search size={15} className="absolute left-3 top-2.5 text-[#9A948A]" />
              <input
                type="text"
                value={billSearch}
                onChange={(e) => setBillSearch(e.target.value)}
                placeholder="Search bills by number or customer..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#EEE6DA] text-xs outline-none focus:border-[#7FAE82]"
              />
            </div>

            <div className="flex items-center gap-1 bg-[#FAF6EF] p-1 rounded-xl border border-[#EEE6DA]">
              {(['All', 'UPI', 'Cash', 'Card', 'Credit'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setBillPaymentFilter(method)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    billPaymentFilter === method
                      ? 'bg-white text-[#1C1B18] shadow-2xs'
                      : 'text-[#6B665E] hover:text-[#1C1B18]'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Bills Table */}
          <div className="bg-white rounded-2xl border border-[#EEE6DA] overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF6EF] border-b border-[#EEE6DA] text-[#9A948A]">
                  <tr>
                    <th className="py-3 px-4 font-medium">Bill #</th>
                    <th className="py-3 px-3 font-medium">Date & Time</th>
                    <th className="py-3 px-3 font-medium">Customer</th>
                    <th className="py-3 px-3 font-medium">Items</th>
                    <th className="py-3 px-3 font-medium text-right">Total Amount</th>
                    <th className="py-3 px-3 font-medium text-center">Payment</th>
                    <th className="py-3 px-3 font-medium text-center">Status</th>
                    <th className="py-3 px-3 font-medium">Created By</th>
                    <th className="py-3 px-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEE6DA]/80">
                  {displayBills.map((b) => (
                    <tr
                      key={b.id}
                      onClick={() => setSelectedBillDetail(b)}
                      className="hover:bg-[#FAF6EF]/60 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-bold text-[#1C1B18] text-[13px] group-hover:text-[#6C9C70]">
                        {b.billNumber}
                      </td>
                      <td className="py-3 px-3 text-[#6B665E] whitespace-nowrap">{b.date}</td>
                      <td className="py-3 px-3 font-semibold text-[#1C1B18]">{b.customerName}</td>
                      <td className="py-3 px-3 text-[#6B665E]">
                        {b.items.map((i) => `${i.productName} (${i.quantity})`).join(', ')}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-[#1C1B18] tabular-nums text-sm">
                        {formatINR(b.total)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="bg-[#FAF6EF] px-2 py-0.5 rounded border border-[#EEE6DA] text-[11px] font-semibold text-[#1C1B18]">
                          {b.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge
                          variant={
                            b.status === 'Paid'
                              ? 'success'
                              : b.status === 'Credit'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {b.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-[#6B665E]">{b.createdBy}</td>
                      <td
                        className="py-3 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedBillDetail(b)}
                          className="px-2.5 py-1 rounded-lg border border-[#EEE6DA] text-xs font-semibold text-[#1C1B18] hover:bg-[#FAF6EF]"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Success Receipt Modal */}
      {receiptBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full border border-[#EEE6DA] shadow-2xl p-5 animate-in zoom-in-95 duration-150">
            {/* Printable Receipt Slip */}
            <div className="text-center border-b border-dashed border-[#DDD3C4] pb-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-[#E8F5EC] text-[#2E8B57] flex items-center justify-center mx-auto mb-1.5">
                <CheckCircle2 size={20} />
              </div>
              <h3 className="font-bold text-base text-[#1C1B18]">{businessProfile.name}</h3>
              <p className="text-[11px] text-[#6B665E]">{businessProfile.address}</p>
              <p className="text-[10px] text-[#9A948A] mt-0.5">GSTIN: {businessProfile.taxNumber}</p>
              <div className="mt-2 text-xs font-bold text-[#1C1B18] bg-[#FAF6EF] py-1 rounded-lg">
                Bill #{receiptBill.billNumber} · {receiptBill.date}
              </div>
            </div>

            {/* Receipt Items */}
            <div className="space-y-1.5 text-xs border-b border-dashed border-[#DDD3C4] pb-3 mb-3">
              {receiptBill.items.map((it, idx) => (
                <div key={idx} className="flex justify-between">
                  <span className="text-[#1C1B18] truncate pr-2">
                    {it.productName} × {it.quantity}
                  </span>
                  <span className="font-semibold text-[#1C1B18] tabular-nums shrink-0">
                    {formatINR(it.total)}
                  </span>
                </div>
              ))}
            </div>

            {/* Receipt Totals */}
            <div className="space-y-1 text-xs border-b border-dashed border-[#DDD3C4] pb-3 mb-3">
              <div className="flex justify-between text-[#6B665E]">
                <span>Taxes & GST</span>
                <span className="tabular-nums">{formatINR(receiptBill.tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-[#1C1B18]">
                <span>Total Paid ({receiptBill.paymentMethod})</span>
                <span className="text-base text-[#2E8B57] tabular-nums">{formatINR(receiptBill.total)}</span>
              </div>
              {receiptBill.cashTendered && (
                <div className="flex justify-between text-[11px] text-[#6B665E]">
                  <span>Change Given</span>
                  <span className="tabular-nums">{formatINR(receiptBill.changeDue || 0)}</span>
                </div>
              )}
            </div>

            <p className="text-center text-[10.5px] text-[#9A948A] italic mb-4">
              {businessProfile.receiptFooterText}
            </p>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="py-2 border border-[#EEE6DA] rounded-xl text-xs font-semibold text-[#1C1B18] hover:bg-[#FAF6EF] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer size={14} />
                <span>Print Slip</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  alert(`WhatsApp receipt link created for ${receiptBill.customerPhone || 'customer'}!`);
                }}
                className="py-2 bg-[#E8F5EC] text-[#2E8B57] rounded-xl text-xs font-semibold hover:bg-[#d8eedd] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Share2 size={14} />
                <span>WhatsApp</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setReceiptBill(null)}
              className="w-full py-2.5 bg-[#7FAE82] text-white rounded-xl text-xs font-bold hover:bg-[#6C9C70] cursor-pointer shadow-xs"
            >
              Start Next Bill
            </button>
          </div>
        </div>
      )}

      {/* Bill Detail Drawer */}
      {selectedBillDetail && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-xs"
            onClick={() => setSelectedBillDetail(null)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white border-l border-[#EEE6DA] shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200 p-5">
              <div>
                <div className="flex items-center justify-between border-b border-[#EEE6DA] pb-3 mb-4">
                  <div>
                    <h3 className="font-bold text-base text-[#1C1B18]">
                      Invoice: {selectedBillDetail.billNumber}
                    </h3>
                    <p className="text-xs text-[#6B665E]">{selectedBillDetail.date}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedBillDetail(null)}
                    className="p-1 rounded-lg text-[#6B665E] hover:bg-[#FAF6EF]"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF6EF] border border-[#EEE6DA] mb-4 space-y-1 text-xs">
                  <div className="font-semibold text-[#1C1B18]">
                    Customer: {selectedBillDetail.customerName}
                  </div>
                  <div className="text-[#6B665E]">
                    Billed By: {selectedBillDetail.createdBy}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Badge variant={selectedBillDetail.status === 'Paid' ? 'success' : 'warning'}>
                      {selectedBillDetail.status}
                    </Badge>
                    <span className="text-[#6B665E] font-medium">
                      via {selectedBillDetail.paymentMethod}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2 mb-4">
                  <div className="text-xs font-semibold text-[#1C1B18]">Purchased Items</div>
                  {selectedBillDetail.items.map((it, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl border border-[#EEE6DA] flex justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-[#1C1B18]">{it.productName}</div>
                        <div className="text-[#9A948A]">
                          Qty: {it.quantity} × {formatINR(it.unitPrice)}
                        </div>
                      </div>
                      <div className="font-bold text-[#1C1B18] tabular-nums">
                        {formatINR(it.total)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="bg-[#FAF6EF] p-3 rounded-xl border border-[#EEE6DA] flex justify-between font-bold text-sm text-[#1C1B18]">
                  <span>Total Amount</span>
                  <span className="text-[#2E8B57] tabular-nums">
                    {formatINR(selectedBillDetail.total)}
                  </span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-[#EEE6DA] flex items-center justify-between">
                {currentUser.role === 'admin' && selectedBillDetail.status !== 'Cancelled' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Cancel bill ${selectedBillDetail.billNumber}? Stock will be restored.`)) {
                        cancelBill(selectedBillDetail.id);
                        setSelectedBillDetail(null);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#FDECEC] text-[#D64545] text-xs font-semibold hover:bg-[#fad5d5] cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw size={13} />
                    <span>Cancel / Return</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-[#1C1B18] text-white text-xs font-semibold rounded-xl hover:bg-black cursor-pointer ml-auto"
                >
                  Print Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Customer Modal */}
      {isQuickAddCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <form
            onSubmit={handleQuickAddCustomer}
            className="bg-white rounded-3xl max-w-sm w-full border border-[#EEE6DA] shadow-2xl p-5 space-y-3"
          >
            <h3 className="text-sm font-bold text-[#1C1B18]">Quick Add Customer</h3>
            <div>
              <label className="block text-xs font-semibold text-[#1C1B18] mb-1">Customer Name *</label>
              <input
                type="text"
                required
                value={newCustName}
                onChange={(e) => setNewCustName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none focus:border-[#7FAE82]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1C1B18] mb-1">Phone Number</label>
              <input
                type="text"
                value={newCustPhone}
                onChange={(e) => setNewCustPhone(e.target.value)}
                placeholder="+91 98..."
                className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none focus:border-[#7FAE82]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsQuickAddCustomerOpen(false)}
                className="px-3 py-1.5 text-xs text-[#6B665E]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#7FAE82] text-white text-xs font-semibold rounded-xl hover:bg-[#6C9C70]"
              >
                Save Customer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
