import React from 'react';
import { ArrowRight } from 'lucide-react';
import { ProductIcon } from '../common/ProductIcon';
import { useApp } from '../../context/AppContext';

export const TopSellingProductsCard: React.FC = () => {
  const { navigate } = useApp();

  const topProducts = [
    { name: "Men's T-Shirt", iconType: 'shirt', sold: 124 },
    { name: 'Running Shoes', iconType: 'shoe', sold: 96 },
    { name: 'Paracetamol 500mg', iconType: 'pill', sold: 76 },
    { name: 'Wireless Mouse', iconType: 'mouse', sold: 61 },
  ];

  return (
    <div className="bg-white rounded-[20px] p-5 border border-[#EEE6DA] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[15px] font-semibold text-[#1C1B18]">Top Selling Products</h3>
          <button
            type="button"
            onClick={() => navigate('/app/reports')}
            className="text-xs font-semibold text-[#1C1B18] hover:text-[#6C9C70] inline-flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>View all</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="divide-y divide-[#EEE6DA]">
          {topProducts.map((p) => (
            <div
              key={p.name}
              onClick={() => navigate('/app/products')}
              className="py-2.5 flex items-center justify-between group cursor-pointer hover:bg-[#FAF6EF]/50 -mx-2 px-2 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <ProductIcon name={p.name} type={p.iconType} />
                <span className="text-[13px] font-medium text-[#1C1B18] truncate">
                  {p.name}
                </span>
              </div>
              <span className="text-xs font-semibold text-[#6B665E] tabular-nums whitespace-nowrap">
                {p.sold} sold
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
