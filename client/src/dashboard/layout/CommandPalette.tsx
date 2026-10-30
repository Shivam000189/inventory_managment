import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Package, Users, Building2, UserCheck, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatINR } from '../lib/formatters';

export const CommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    products,
    suppliers,
    purchaseOrders,
    customers,
    navigate,
  } = useApp();

  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const q = query.trim().toLowerCase();

  const filteredProducts = q
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.barcode.includes(q)
      ).slice(0, 4)
    : products.slice(0, 3);

  const filteredSuppliers = q
    ? suppliers.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.contactPerson.toLowerCase().includes(q) ||
          s.phone.includes(q)
      ).slice(0, 3)
    : suppliers.slice(0, 2);

  const filteredPOs = q
    ? purchaseOrders.filter(
        (po) =>
          po.poNumber.toLowerCase().includes(q) ||
          po.supplierName.toLowerCase().includes(q)
      ).slice(0, 3)
    : purchaseOrders.slice(0, 2);

  const filteredCustomers = q
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.email.toLowerCase().includes(q)
      ).slice(0, 3)
    : customers.slice(0, 2);

  const handleSelect = (route: string) => {
    navigate(route);
    setCommandPaletteOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={() => setCommandPaletteOpen(false)}
      />

      <div className="relative w-full max-w-2xl bg-white border border-[#EEE6DA] rounded-2xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#EEE6DA] gap-3">
          <Search size={18} className="text-[#9A948A] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, suppliers, purchase orders, customers..."
            className="w-full text-sm text-[#1C1B18] placeholder-[#9A948A] outline-none bg-transparent"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-[#9A948A] hover:text-[#1C1B18] p-1 cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
          <kbd className="text-[10px] text-[#9A948A] bg-[#FAF6EF] px-1.5 py-0.5 rounded border border-[#EEE6DA]">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-3">
          {/* Products Group */}
          {filteredProducts.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-bold text-[#9A948A] uppercase tracking-wider flex items-center gap-1.5">
                <Package size={13} />
                <span>Products</span>
              </div>
              <div className="space-y-0.5 mt-1">
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelect('/app/products')}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#FAF6EF] flex items-center justify-between text-xs transition-colors cursor-pointer group"
                  >
                    <div>
                      <div className="font-semibold text-[#1C1B18] flex items-center gap-2">
                        <span>{p.name}</span>
                        <span className="text-[11px] font-normal text-[#9A948A]">
                          SKU: {p.sku}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#6B665E]">
                        {p.category} · Stock: {p.stock} {p.unit}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[#1C1B18] tabular-nums">
                        {formatINR(p.sellingPrice)}
                      </div>
                      <span className="text-[10px] text-[#7FAE82] group-hover:underline inline-flex items-center gap-0.5">
                        View <ArrowRight size={10} />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Suppliers Group */}
          {filteredSuppliers.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-bold text-[#9A948A] uppercase tracking-wider flex items-center gap-1.5">
                <Users size={13} />
                <span>Suppliers</span>
              </div>
              <div className="space-y-0.5 mt-1">
                {filteredSuppliers.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelect('/app/suppliers')}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#FAF6EF] flex items-center justify-between text-xs transition-colors cursor-pointer group"
                  >
                    <div>
                      <div className="font-semibold text-[#1C1B18]">{s.name}</div>
                      <div className="text-[11px] text-[#6B665E]">
                        {s.contactPerson} · {s.phone}
                      </div>
                    </div>
                    <span className="text-[10px] text-[#7FAE82] group-hover:underline inline-flex items-center gap-0.5">
                      Open <ArrowRight size={10} />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Purchase Orders Group */}
          {filteredPOs.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-bold text-[#9A948A] uppercase tracking-wider flex items-center gap-1.5">
                <Building2 size={13} />
                <span>Purchase Orders</span>
              </div>
              <div className="space-y-0.5 mt-1">
                {filteredPOs.map((po) => (
                  <button
                    key={po.id}
                    type="button"
                    onClick={() => handleSelect('/app/purchase-orders')}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#FAF6EF] flex items-center justify-between text-xs transition-colors cursor-pointer group"
                  >
                    <div>
                      <div className="font-semibold text-[#1C1B18]">{po.poNumber}</div>
                      <div className="text-[11px] text-[#6B665E]">
                        Supplier: {po.supplierName} · Status: {po.status}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[#1C1B18] tabular-nums">
                        {formatINR(po.total)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Customers Group */}
          {filteredCustomers.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-bold text-[#9A948A] uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck size={13} />
                <span>Customers</span>
              </div>
              <div className="space-y-0.5 mt-1">
                {filteredCustomers.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelect('/app/customers')}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#FAF6EF] flex items-center justify-between text-xs transition-colors cursor-pointer group"
                  >
                    <div>
                      <div className="font-semibold text-[#1C1B18]">{c.name}</div>
                      <div className="text-[11px] text-[#6B665E]">
                        {c.phone} · {c.type}
                      </div>
                    </div>
                    <div className="text-right">
                      {c.outstanding > 0 ? (
                        <div className="text-[#D64545] font-semibold tabular-nums text-[11px]">
                          Due: {formatINR(c.outstanding)}
                        </div>
                      ) : (
                        <div className="text-[#6B665E] tabular-nums text-[11px]">
                          Spent: {formatINR(c.totalSpent)}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-[#FAF6EF] border-t border-[#EEE6DA] text-[11px] text-[#6B665E] flex items-center justify-between">
          <span>Tip: Press <kbd className="font-mono bg-white px-1 py-0.5 rounded border border-[#EEE6DA]">↑</kbd> <kbd className="font-mono bg-white px-1 py-0.5 rounded border border-[#EEE6DA]">↓</kbd> to navigate</span>
          <span>Click any item to jump directly</span>
        </div>
      </div>
    </div>
  );
};
