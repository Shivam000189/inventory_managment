import React from 'react';
import { ChevronRight, ArrowRight, CheckCircle2 } from 'lucide-react';
import { ProductIcon } from '../common/ProductIcon';
import { useApp } from '../../context/AppContext';

export const StockAlertsCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { products, loadingStates, navigate } = useApp();

  const isProductsLoading = loadingStates?.products;

  // Find low stock items
  const lowStockItems = products
    .filter((p) => Number(p.stock ?? 0) <= Number(p.reorderLevel ?? 10))
    .slice(0, 4);

  return (
    <div className={`bg-white rounded-[20px] p-5 border border-[#EEE6DA] h-full flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all min-h-[280px] ${className}`.trim()}>
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[15px] font-semibold text-[#1C1B18]">Stock Alerts</h3>
          <button
            type="button"
            onClick={() => navigate('/inventory')}
            className="text-xs font-semibold text-[#1C1B18] hover:text-[#6C9C70] inline-flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>View all</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {lowStockItems.length === 0 && !isProductsLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-[#8C867A] text-xs">
            <CheckCircle2 size={24} className="text-[#2E8B57] mb-2 opacity-80" />
            <span className="font-medium text-[#1C1B18]">No low stock alerts</span>
            <span className="text-[11px] text-[#9A948A] mt-0.5">All products are adequately stocked.</span>
          </div>
        ) : (
          <div className="divide-y divide-[#EEE6DA] flex-1 flex flex-col justify-around">
            {lowStockItems.map((item) => (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate('/inventory')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate('/inventory');
                  }
                }}
                className="py-3 flex items-center justify-between group cursor-pointer hover:bg-[#FAF6EF]/50 -mx-2 px-2 rounded-xl transition-colors"
                aria-label={`${item.name}, SKU ${item.sku}. Only ${item.stock} left in stock.`}
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <ProductIcon name={item.name} type={item.iconType} />
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-[#1C1B18] truncate flex items-center gap-1.5">
                      <span>{item.name}</span>
                      {item.sku && (
                        <span className="text-[11px] font-normal text-[#9A948A] truncate">
                          (SKU: {item.sku})
                        </span>
                      )}
                    </div>
                    <div className="text-[12px] text-[#D64545] font-medium">
                      Only {item.stock} left in stock
                    </div>
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  className="text-[#9A948A] group-hover:text-[#1C1B18] group-hover:translate-x-0.5 transition-all shrink-0"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
