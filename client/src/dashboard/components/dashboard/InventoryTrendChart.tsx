import React, { useState, useMemo, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { formatINR } from '../../lib/formatters';
import { useApp } from '../../context/AppContext';

interface MonthlyBreakdownPoint {
  month: string;
  fullMonth: string;
  year: number;
  value: number;
  isCurrentMonth: boolean;
}

export const InventoryTrendChart: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { metrics, stockMovements, products } = useApp();
  const [timeRange, setTimeRange] = useState<'Last 6 months' | 'Last 10 months' | 'Last 12 months'>('Last 6 months');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const now = useMemo(() => new Date(), []);
  const currentMonthLabel = useMemo(() => now.toLocaleString('en-US', { month: 'short' }), [now]);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthLabel);

  const monthCount = timeRange === 'Last 6 months' ? 6 : timeRange === 'Last 10 months' ? 10 : 12;

  // Build the time buckets across year boundaries
  const { data } = useMemo(() => {
    const buckets: { month: string; fullMonth: string; year: number; monthIndex: number; key: string }[] = [];
    for (let i = monthCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        month: d.toLocaleString('en-US', { month: 'short' }),
        fullMonth: d.toLocaleString('en-US', { month: 'long' }),
        year: d.getFullYear(),
        monthIndex: d.getMonth(),
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      });
    }

    const currentStockVal = metrics.totalStockValue > 0
      ? metrics.totalStockValue
      : (products || []).reduce((acc, p) => acc + (Number(p.stock || 0) * Number(p.purchasePrice || p.sellingPrice || 0)), 0);

    // Map product prices for accurate movement amount calculation if movement.amount is absent
    const productPriceMap = new Map<string, number>();
    (products || []).forEach((p) => {
      const price = Number(p.purchasePrice || p.sellingPrice || 0);
      productPriceMap.set(p.id, price);
      if (p.sku) productPriceMap.set(p.sku, price);
    });

    // Group real stock transaction deltas by bucket key (YYYY-MM)
    const monthDeltas = new Map<string, number>();

    (stockMovements || []).forEach((m) => {
      let movementDate: Date | null = null;
      const rawDate = (m as any).createdAt || (m as any).created_at || (m as any).timestamp || m.date;
      if (rawDate) {
        const parsed = new Date(rawDate);
        if (!isNaN(parsed.getTime())) {
          movementDate = parsed;
        }
      }

      if (movementDate && !isNaN(movementDate.getTime())) {
        const key = `${movementDate.getFullYear()}-${String(movementDate.getMonth() + 1).padStart(2, '0')}`;
        const unitPrice = productPriceMap.get(m.productId) || (m.sku ? productPriceMap.get(m.sku) : 0) || 0;
        const val = Number(m.amount ?? 0) || (Math.abs(Number(m.qtyDelta ?? 0)) * unitPrice);
        monthDeltas.set(key, (monthDeltas.get(key) || 0) + val);
      }
    });

    const points: MonthlyBreakdownPoint[] = [];

    for (let i = buckets.length - 1; i >= 0; i--) {
      const b = buckets[i];
      const isCurrent = b.monthIndex === now.getMonth() && b.year === now.getFullYear();

      if (isCurrent) {
        points.unshift({
          month: b.month,
          fullMonth: b.fullMonth,
          year: b.year,
          value: Math.max(0, currentStockVal),
          isCurrentMonth: true,
        });
      } else {
        // If there are real transaction records in this month, show that month's value; otherwise strictly 0
        const monthVal = monthDeltas.get(b.key) || 0;
        points.unshift({
          month: b.month,
          fullMonth: b.fullMonth,
          year: b.year,
          value: Math.max(0, monthVal),
          isCurrentMonth: false,
        });
      }
    }

    return { data: points };
  }, [now, monthCount, metrics.totalStockValue, products, stockMovements]);

  // Keep selected month synchronized when range changes
  useEffect(() => {
    if (!data.some((d) => d.month === selectedMonth)) {
      setSelectedMonth(currentMonthLabel);
    }
  }, [data, selectedMonth, currentMonthLabel]);

  // Active item for the banner card
  const activeItem = useMemo(() => {
    return data.find((d) => d.month === selectedMonth) || data[data.length - 1] || {
      month: currentMonthLabel,
      fullMonth: now.toLocaleString('en-US', { month: 'long' }),
      year: now.getFullYear(),
      value: metrics.totalStockValue,
      isCurrentMonth: true,
    };
  }, [data, selectedMonth, currentMonthLabel, now, metrics.totalStockValue]);

  return (
    <div
      className={`bg-white rounded-[20px] p-5 sm:p-6 border border-[#EEE6DA] h-full flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all ${className}`.trim()}
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-semibold text-[#1C1B18] tracking-tight">
          Inventory Trend
        </h3>

        {/* Dropdown Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#EEE6DA] bg-white text-xs font-medium text-[#6B665E] hover:border-[#DDD3C4] transition-colors cursor-pointer"
            aria-expanded={isDropdownOpen}
            aria-haspopup="listbox"
          >
            <span>{timeRange}</span>
            <ChevronDown size={13} className="text-[#6B665E]" />
          </button>

          {isDropdownOpen && (
            <div
              className="absolute right-0 mt-1.5 w-36 bg-white border border-[#EEE6DA] rounded-xl shadow-lg p-1 z-30 animate-in fade-in zoom-in-95 duration-100"
              role="listbox"
            >
              {(['Last 6 months', 'Last 10 months', 'Last 12 months'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setTimeRange(r);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg cursor-pointer transition-colors ${
                    timeRange === r
                      ? 'bg-[#FAF6EF] text-[#1C1B18] font-semibold'
                      : 'text-[#6B665E] hover:bg-[#FAF6EF]'
                  }`}
                  role="option"
                  aria-selected={timeRange === r}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hero Highlight Card: Total Inventory Value */}
      <div className="bg-[#F0F5EE] border border-[#DEEAD9] rounded-2xl p-4 sm:p-5 mb-5 transition-all">
        <div className="text-[11px] font-bold text-[#4B794E] tracking-wider uppercase mb-1.5">
          TOTAL INVENTORY VALUE
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-[#1C1B18] tracking-tight mb-1 tabular-nums">
          {formatINR(activeItem.value)}
        </div>
        <div className="text-xs text-[#6B665E] font-medium">
          {activeItem.isCurrentMonth
            ? `Current inventory valuation · ${activeItem.fullMonth}`
            : `Inventory valuation · ${activeItem.fullMonth} ${activeItem.year}`}
        </div>
      </div>

      {/* Monthly Breakdown Subheader */}
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-[#1C1B18]">Monthly breakdown</h4>
      </div>

      {/* Monthly Breakdown Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 flex-1">
        {data.map((item) => {
          const isSelected = selectedMonth === item.month;
          return (
            <div
              key={`${item.year}-${item.month}`}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedMonth(item.month)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedMonth(item.month);
                }
              }}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between text-left select-none ${
                item.isCurrentMonth
                  ? isSelected
                    ? 'bg-[#EAF3E9] border-[#2E8B57] ring-1.5 ring-[#2E8B57] shadow-2xs'
                    : 'bg-[#EDF5EC]/70 border-[#C4DFC1] hover:border-[#2E8B57]'
                  : isSelected
                  ? 'bg-white border-[#2E8B57] ring-1.5 ring-[#2E8B57] shadow-2xs'
                  : 'bg-[#F7F9F6] border-[#E8ECE6] hover:border-[#CAD8C8] hover:bg-[#F2F5F0]'
              }`}
            >
              <div>
                <span className="text-xs font-semibold text-[#6B665E] block mb-1">
                  {item.month}
                </span>
                <span className="text-[15px] sm:text-base font-bold text-[#1C1B18] tracking-tight block tabular-nums">
                  {formatINR(item.value)}
                </span>
              </div>

              <div className="mt-2.5">
                {item.isCurrentMonth ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D3EBD2] text-[#246A28]">
                    Current
                  </span>
                ) : (
                  <span className="text-[11px] text-[#9A948A] block">
                    Monthly value
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
