import React from 'react';
import { ChevronRight, ArrowRight } from 'lucide-react';
import { ProductIcon } from '../common/ProductIcon';
import { useApp } from '../../context/AppContext';

export const StockAlertsCard: React.FC = () => {
  const { products, navigate } = useApp();

  // Find low stock items (matching screenshot: TS001, PM002, WM003)
  const lowStockItems = products
    .filter((p) => p.stock <= p.reorderLevel)
    .slice(0, 4);

  return (
    <div className="bg-white rounded-[20px] p-5 border border-[#EEE6DA] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[15px] font-semibold text-[#1C1B18]">Stock Alerts</h3>
          <button
            type="button"
            onClick={() => navigate('/app/inventory')}
            className="text-xs font-semibold text-[#1C1B18] hover:text-[#6C9C70] inline-flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>View all</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="divide-y divide-[#EEE6DA]">
          {lowStockItems.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate('/app/inventory')}
              className="py-3 flex items-center justify-between group cursor-pointer hover:bg-[#FAF6EF]/50 -mx-2 px-2 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <ProductIcon name={item.name} type={item.iconType} />
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-[#1C1B18] truncate flex items-center gap-1.5">
                    <span>{item.name}</span>
                    <span className="text-[11px] font-normal text-[#9A948A]">
                      (SKU: {item.sku})
                    </span>
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
      </div>
    </div>
  );
};
