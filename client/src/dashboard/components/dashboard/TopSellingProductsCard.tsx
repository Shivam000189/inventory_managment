import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ProductIcon } from '../common/ProductIcon';
import { productsApi, salesOrdersApi } from '../../lib/api';
import { useApp } from '../../context/AppContext';
import { Skeleton } from '../../../components/ui/Feedback';

interface RankedProduct {
  id: string;
  name: string;
  sku: string;
  stock: number;
  reorderLevel: number;
  unit: string;
  sold: number;
  iconType?: string;
}

export const TopSellingProductsCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { navigate, products: contextProducts } = useApp();
  const [viewMode, setViewMode] = useState<'stock' | 'selling'>('stock');
  const [dbProducts, setDbProducts] = useState<RankedProduct[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchDatabaseProducts = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const [prodsRes, salesRes] = await Promise.allSettled([
        productsApi.list(),
        salesOrdersApi.list(),
      ]);

      const rawProducts: any[] =
        prodsRes.status === 'fulfilled'
          ? Array.isArray(prodsRes.value)
            ? prodsRes.value
            : Array.isArray((prodsRes.value as any)?.items)
            ? (prodsRes.value as any).items
            : Array.isArray((prodsRes.value as any)?.products)
            ? (prodsRes.value as any).products
            : []
          : [];

      const rawSales: any[] =
        salesRes.status === 'fulfilled'
          ? Array.isArray(salesRes.value)
            ? salesRes.value
            : Array.isArray((salesRes.value as any)?.items)
            ? (salesRes.value as any).items
            : Array.isArray((salesRes.value as any)?.orders)
            ? (salesRes.value as any).orders
            : []
          : [];

      // Calculate sold quantities from live sales orders
      const salesMap = new Map<string, number>();
      rawSales.forEach((order) => {
        if (order.status === 'Cancelled') return;
        (order.items || []).forEach((item: any) => {
          const qty = Number(item.quantity ?? item.qty ?? 0);
          if (qty > 0) {
            if (item.productId || item.product_id) {
              const idKey = String(item.productId || item.product_id);
              salesMap.set(idKey, (salesMap.get(idKey) || 0) + qty);
            }
            if (item.productName || item.name) {
              const nameKey = String(item.productName || item.name).trim().toLowerCase();
              salesMap.set(nameKey, (salesMap.get(nameKey) || 0) + qty);
            }
          }
        });
      });

      // Map real database products
      const mapped: RankedProduct[] = rawProducts.map((p: any) => {
        const id = String(p.productId || p.id || p._id || '');
        const name = p.name || 'Unnamed Product';
        const nameKey = name.trim().toLowerCase();
        const stock = Number(p.currentStock ?? p.current_stock ?? p.stock ?? 0);
        const reorderLevel = Number(p.minimumStock ?? p.minimum_stock ?? p.reorderLevel ?? 10);
        const sold = (salesMap.get(id) || 0) + (salesMap.get(nameKey) || 0);

        return {
          id,
          name,
          sku: p.sku || '',
          stock,
          reorderLevel,
          unit: p.unit || 'pcs',
          sold,
          iconType: p.iconType,
        };
      });

      setDbProducts(mapped);
    } catch (err) {
      console.warn('Failed to fetch top products from database API:', err);
      setDbProducts([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch from database on component mount
  useEffect(() => {
    fetchDatabaseProducts();
  }, [fetchDatabaseProducts]);

  // Keep synced silently if contextProducts changes (e.g. user added or edited a product in UI)
  useEffect(() => {
    if (contextProducts && contextProducts.length > 0) {
      fetchDatabaseProducts(true);
    }
  }, [contextProducts, fetchDatabaseProducts]);

  // Sort and pick top 4 products
  const displayProducts = useMemo(() => {
    if (dbProducts.length === 0) return [];

    const copy = [...dbProducts];
    if (viewMode === 'selling') {
      return copy
        .sort((a, b) => {
          if (b.sold !== a.sold) return b.sold - a.sold;
          return b.stock - a.stock;
        })
        .slice(0, 4);
    }

    // Default 'stock': sort by highest on-hand stock
    return copy
      .sort((a, b) => {
        if (b.stock !== a.stock) return b.stock - a.stock;
        return b.sold - a.sold;
      })
      .slice(0, 4);
  }, [dbProducts, viewMode]);

  return (
    <div
      className={`bg-white rounded-[20px] p-5 border border-[#EEE6DA] h-full flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all min-h-[300px] ${className}`.trim()}
    >
      <div className="flex-1 flex flex-col">
        {/* Header & Controls */}
        <div className="flex items-center gap-2.5 mb-3">
          <h3 className="text-[15px] font-semibold text-[#1C1B18]">
            {viewMode === 'stock' ? 'Top Stock' : 'Top Selling'}
          </h3>
          <div
            className="flex items-center bg-[#FAF6EF] p-0.5 rounded-lg border border-[#EEE6DA]"
            role="tablist"
            aria-label="Inventory ranking criteria"
          >
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

        {/* Content State: Loading, Empty, or List */}
        {isLoading ? (
          <div className="divide-y divide-[#EEE6DA] flex-1 flex flex-col justify-around">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0 pr-3">
                  <Skeleton width={36} height={36} borderRadius={12} />
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <Skeleton width="75%" height={14} borderRadius={4} />
                    <Skeleton width="45%" height={12} borderRadius={4} />
                  </div>
                </div>
                <Skeleton width={60} height={16} borderRadius={4} />
              </div>
            ))}
          </div>
        ) : displayProducts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
            <p className="text-xs text-[#9A948A]">No products recorded in database.</p>
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
