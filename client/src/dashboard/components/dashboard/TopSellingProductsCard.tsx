import React, { useState, useMemo } from 'react';
import { ArrowRight, PackagePlus } from 'lucide-react';
import { ProductIcon } from '../common/ProductIcon';
import { useApp } from '../../context/AppContext';

export const TopSellingProductsCard: React.FC = () => {
  const { products, bills, stockMovements, isLoadingBackend, navigate } = useApp();
  const [viewMode, setViewMode] = useState<'stock' | 'selling'>('stock');

  // Calculate sold quantities per product from bills and stock movements
  const salesMap = useMemo(() => {
    const map = new Map<string, number>();
    bills.forEach((bill) => {
      if (bill.status !== 'Cancelled') {
        bill.items.forEach((item) => {
          const keyId = item.productId;
          const keyName = item.productName;
          if (keyId) map.set(keyId, (map.get(keyId) || 0) + item.quantity);
          if (keyName) map.set(keyName, (map.get(keyName) || 0) + item.quantity);
        });
      }
    });
    stockMovements.forEach((movement) => {
      if (movement.type === 'Sale' && movement.qtyDelta < 0) {
        const qty = Math.abs(movement.qtyDelta);
        if (movement.productId) map.set(movement.productId, (map.get(movement.productId) || 0) + qty);
        if (movement.productName) map.set(movement.productName, (map.get(movement.productName) || 0) + qty);
      }
    });
    return map;
  }, [bills, stockMovements]);

  // Derive ranked products according to the business
  const displayProducts = useMemo(() => {
    if (!products || products.length === 0) return [];

    const enriched = products.map((p) => {
      const soldQty = salesMap.get(p.id) || salesMap.get(p.name) || 0;
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        stock: Number(p.stock ?? 0),
        reorderLevel: Number(p.reorderLevel ?? 10),
        unit: p.unit || 'pcs',
        sold: soldQty,
        iconType: p.iconType,
      };
    });

    if (viewMode === 'selling') {
      return enriched
        .sort((a, b) => {
          if (b.sold !== a.sold) return b.sold - a.sold;
          return b.stock - a.stock;
        })
        .slice(0, 4);
    }

    // Default 'stock': sort by highest on-hand stock
    return enriched
      .sort((a, b) => {
        if (b.stock !== a.stock) return b.stock - a.stock;
        return b.sold - a.sold;
      })
      .slice(0, 4);
  }, [products, salesMap, viewMode]);

  return (
    <div className="bg-white rounded-[20px] p-5 border border-[#EEE6DA] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-semibold text-[#1C1B18]">
              {viewMode === 'stock' ? 'Top Stock' : 'Top Selling'}
            </h3>
            <div className="flex items-center bg-[#FAF6EF] p-0.5 rounded-lg border border-[#EEE6DA]">
              <button
                type="button"
                onClick={() => setViewMode('stock')}
                className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                  viewMode === 'stock'
                    ? 'bg-white text-[#1C1B18] shadow-2xs font-bold'
                    : 'text-[#6B665E] hover:text-[#1C1B18]'
                }`}
              >
                Stock
              </button>
              <button
                type="button"
                onClick={() => setViewMode('selling')}
                className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                  viewMode === 'selling'
                    ? 'bg-white text-[#1C1B18] shadow-2xs font-bold'
                    : 'text-[#6B665E] hover:text-[#1C1B18]'
                }`}
              >
                Sales
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate(viewMode === 'stock' ? '/app/inventory' : '/app/reports')}
            className="text-xs font-semibold text-[#1C1B18] hover:text-[#6C9C70] inline-flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>View all</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="divide-y divide-[#EEE6DA]">
          {isLoadingBackend && products.length === 0 ? (
            <div className="py-3 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between animate-pulse py-1">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#FAF6EF]" />
                    <div className="space-y-1.5">
                      <div className="h-3 w-28 bg-[#FAF6EF] rounded" />
                      <div className="h-2.5 w-16 bg-[#FAF6EF] rounded" />
                    </div>
                  </div>
                  <div className="space-y-1.5 text-right">
                    <div className="h-3 w-12 bg-[#FAF6EF] rounded ml-auto" />
                    <div className="h-2.5 w-10 bg-[#FAF6EF] rounded ml-auto" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayProducts.length === 0 ? (
            <div className="py-8 text-center flex flex-col items-center justify-center">
              <p className="text-xs text-[#9A948A] mb-3">No products found for this business.</p>
              <button
                type="button"
                onClick={() => navigate('/app/products')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2E8B57] text-white text-xs font-semibold hover:bg-[#257247] transition-colors cursor-pointer shadow-2xs"
              >
                <PackagePlus size={14} />
                <span>Add First Product</span>
              </button>
            </div>
          ) : (
            displayProducts.map((p) => {
              const isOutOfStock = p.stock <= 0;
              const isLowStock = !isOutOfStock && p.stock <= p.reorderLevel;

              return (
                <div
                  key={p.id || p.name}
                  onClick={() => navigate('/app/products')}
                  className="py-2.5 flex items-center justify-between group cursor-pointer hover:bg-[#FAF6EF]/50 -mx-2 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <ProductIcon name={p.name} type={p.iconType} />
                    <div className="min-w-0">
                      <span className="text-[13px] font-medium text-[#1C1B18] truncate block">
                        {p.name}
                      </span>
                      {p.sku && (
                        <span className="text-[11px] font-normal text-[#9A948A] block">
                          SKU: {p.sku}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <span className="text-xs font-semibold text-[#1C1B18] tabular-nums block">
                      {p.stock.toLocaleString('en-IN')} {p.unit}
                    </span>
                    {viewMode === 'stock' ? (
                      isOutOfStock ? (
                        <span className="text-[11px] font-medium text-[#DC2626] block">
                          Out of Stock
                        </span>
                      ) : isLowStock ? (
                        <span className="text-[11px] font-medium text-[#D97706] block">
                          Low Stock
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-[#2E8B57] block">
                          In Stock
                        </span>
                      )
                    ) : p.sold > 0 ? (
                      <span className="text-[11px] font-medium text-[#2E8B57] tabular-nums block">
                        {p.sold} sold
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#9A948A] block">
                        0 sold
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
