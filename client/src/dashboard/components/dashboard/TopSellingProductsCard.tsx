import React, { useState, useMemo } from 'react';
import { ArrowRight, PackagePlus } from 'lucide-react';
import { ProductIcon } from '../common/ProductIcon';
import { useApp } from '../../context/AppContext';

export const TopSellingProductsCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { products, bills, stockMovements, loadingStates, navigate } = useApp();
  const [viewMode, setViewMode] = useState<'stock' | 'selling'>('stock');

  const isProductsLoading = loadingStates?.products;

  // Calculate sold quantities per product from the primary source without double-counting
  const salesMap = useMemo(() => {
    const map = new Map<string, number>();

    // If bills (sales orders) are present, use bills exclusively as the primary source of sales data
    const nonCancelledBills = (bills || []).filter((b) => b.status !== 'Cancelled');
    if (nonCancelledBills.length > 0) {
      nonCancelledBills.forEach((bill) => {
        (bill.items || []).forEach((item) => {
          const qty = Number(item.quantity || 0);
          if (qty > 0) {
            if (item.productId) {
              const idKey = String(item.productId);
              map.set(idKey, (map.get(idKey) || 0) + qty);
            }
            if (item.productName) {
              const nameKey = String(item.productName).trim().toLowerCase();
              map.set(nameKey, (map.get(nameKey) || 0) + qty);
            }
          }
        });
      });
      return map;
    }

    // Fallback: If no bills exist, inspect stock movements for sales
    (stockMovements || []).forEach((movement) => {
      if (movement.type === 'Sale' && movement.qtyDelta < 0) {
        const qty = Math.abs(movement.qtyDelta);
        if (movement.productId) {
          const idKey = String(movement.productId);
          map.set(idKey, (map.get(idKey) || 0) + qty);
        }
        if (movement.productName) {
          const nameKey = String(movement.productName).trim().toLowerCase();
          map.set(nameKey, (map.get(nameKey) || 0) + qty);
        }
      }
    });

    return map;
  }, [bills, stockMovements]);

  // Derive ranked products
  const displayProducts = useMemo(() => {
    if (!products || products.length === 0) return [];

    const enriched = products.map((p) => {
      const idKey = String(p.id);
      const nameKey = String(p.name || '').trim().toLowerCase();
      const soldQty = mapGetEither(salesMap, idKey, nameKey);

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
    <div className={`bg-white rounded-[20px] p-5 border border-[#EEE6DA] h-full flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all min-h-[300px] ${className}`.trim()}>
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-semibold text-[#1C1B18]">
              {viewMode === 'stock' ? 'Top Stock' : 'Top Selling'}
            </h3>
            <div className="flex items-center bg-[#FAF6EF] p-0.5 rounded-lg border border-[#EEE6DA]" role="tablist" aria-label="Inventory ranking criteria">
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'stock'}
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
                role="tab"
                aria-selected={viewMode === 'selling'}
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
            onClick={() => navigate(viewMode === 'stock' ? '/inventory' : '/reports')}
            className="text-xs font-semibold text-[#1C1B18] hover:text-[#6C9C70] inline-flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>View all</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {displayProducts.length === 0 && !isProductsLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
            <p className="text-xs text-[#9A948A] mb-3">No products found for this business.</p>
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#381e12] text-white text-xs font-semibold hover:bg-[#26140c] transition-colors cursor-pointer shadow-2xs"
            >
              <PackagePlus size={14} />
              <span>Add First Product</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#EEE6DA] flex-1 flex flex-col justify-around">
            {displayProducts.map((p) => {
              const isOutOfStock = p.stock <= 0;
              const isLowStock = !isOutOfStock && p.stock <= p.reorderLevel;

              return (
                <div
                  key={p.id || p.name}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate('/products')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate('/products');
                    }
                  }}
                  className="py-2.5 flex items-center justify-between group cursor-pointer hover:bg-[#FAF6EF]/50 -mx-2 px-2 rounded-xl transition-colors"
                  aria-label={`${p.name}, SKU ${p.sku || 'N/A'}. ${p.stock} in stock, ${p.sold} sold.`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <ProductIcon name={p.name} type={p.iconType} />
                    <div className="min-w-0">
                      <span className="text-[13px] font-medium text-[#1C1B18] truncate block">
                        {p.name}
                      </span>
                      {p.sku && (
                        <span className="text-[11px] font-normal text-[#9A948A] truncate block">
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
            })}
          </div>
        )}
      </div>
    </div>
  );
};

function mapGetEither(map: Map<string, number>, key1: string, key2: string): number {
  if (key1 && map.has(key1)) return map.get(key1) || 0;
  if (key2 && map.has(key2)) return map.get(key2) || 0;
  return 0;
}
