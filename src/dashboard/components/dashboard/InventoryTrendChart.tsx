import React, { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { formatINR } from '../../lib/formatters';
import { useApp } from '../../context/AppContext';

interface ChartDataPoint {
  month: string;
  value: number;
  highlighted?: boolean;
}

export const InventoryTrendChart: React.FC = () => {
  const { metrics, stockMovements } = useApp();
  const [timeRange, setTimeRange] = useState<'Last 6 months' | 'Last 10 months' | 'Last 12 months'>('Last 6 months');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('Oct');

  const monthCount = timeRange === 'Last 6 months' ? 6 : timeRange === 'Last 10 months' ? 10 : 12;

  const data: ChartDataPoint[] = useMemo(() => {
    const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    // Assuming current month is October
    const currentMonthIdx = 9; // Oct
    const result: ChartDataPoint[] = [];

    const baseVal = metrics.totalStockValue > 0 ? metrics.totalStockValue : 590000;

    // Movement deltas per month if any
    const monthlyDeltas = new Map<number, number>();
    stockMovements.forEach((m) => {
      if (m.date) {
        // e.g. "26 Oct 2026"
        for (let i = 0; i < allMonths.length; i++) {
          if (m.date.includes(allMonths[i])) {
            monthlyDeltas.set(i, (monthlyDeltas.get(i) || 0) + (m.amount || 0));
            break;
          }
        }
      }
    });

    for (let i = monthCount - 1; i >= 0; i--) {
      const idx = (currentMonthIdx - i + 12) % 12;
      const mName = allMonths[idx];
      // Generate realistic values ramping up to baseVal
      const factor = 1 - (i * 0.05);
      const val = Math.max(10000, Math.round(baseVal * Math.max(0.4, factor) + (monthlyDeltas.get(idx) || 0)));
      result.push({
        month: mName,
        value: val,
        highlighted: idx === currentMonthIdx,
      });
    }

    return result;
  }, [metrics.totalStockValue, stockMovements, monthCount]);

  const rawMax = Math.max(...data.map((d) => d.value), 100000);
  const maxValue = Math.ceil((rawMax * 1.15) / 100000) * 100000;
  const chartHeight = 160; // px

  return (
    <div className="bg-white rounded-[20px] p-5 border border-[#EEE6DA] flex flex-col justify-between">
      {/* Card Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-semibold text-[#1C1B18]">Inventory Trend</h3>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#EEE6DA] bg-white text-xs font-medium text-[#6B665E] hover:border-[#DDD3C4] transition-colors cursor-pointer"
          >
            <span>{timeRange}</span>
            <ChevronDown size={13} />
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-36 bg-white border border-[#EEE6DA] rounded-xl shadow-lg p-1 z-30">
              {(['Last 6 months', 'Last 10 months', 'Last 12 months'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setTimeRange(r);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg cursor-pointer ${
                    timeRange === r
                      ? 'bg-[#FAF6EF] text-[#1C1B18] font-semibold'
                      : 'text-[#6B665E] hover:bg-[#FAF6EF]'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative pt-6 pb-2">
        {/* Y-axis and grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[11px] text-[#9A948A] tabular-nums">
          <div className="flex items-center w-full">
            <span className="w-12 shrink-0 text-right pr-2">
              {maxValue >= 100000 ? `${Math.round(maxValue / 1000)}K` : maxValue}
            </span>
            <div className="w-full border-b border-dashed border-[#EEE6DA]/80" />
          </div>
          <div className="flex items-center w-full">
            <span className="w-12 shrink-0 text-right pr-2">
              {maxValue >= 100000 ? `${Math.round((maxValue * 2) / 3000)}K` : Math.round((maxValue * 2) / 3)}
            </span>
            <div className="w-full border-b border-dashed border-[#EEE6DA]/80" />
          </div>
          <div className="flex items-center w-full">
            <span className="w-12 shrink-0 text-right pr-2">
              {maxValue >= 100000 ? `${Math.round(maxValue / 3000)}K` : Math.round(maxValue / 3)}
            </span>
            <div className="w-full border-b border-dashed border-[#EEE6DA]/80" />
          </div>
          <div className="flex items-center w-full">
            <span className="w-12 shrink-0 text-right pr-2">0</span>
            <div className="w-full border-b border-[#EEE6DA]" />
          </div>
        </div>

        {/* Bars Container */}
        <div
          className="ml-12 flex items-end justify-between px-2 sm:px-4 relative"
          style={{ height: `${chartHeight}px` }}
        >
          {data.map((item) => {
            const barHeight = Math.max(4, Math.round((item.value / maxValue) * chartHeight));
            const isSelected = selectedMonth === item.month;

            return (
              <div
                key={item.month}
                className="flex-1 flex flex-col items-center group relative cursor-pointer"
                onClick={() => setSelectedMonth(item.month)}
                onMouseEnter={() => setSelectedMonth(item.month)}
              >
                {/* Active Tooltip above bar */}
                {isSelected && (
                  <div
                    className="absolute z-20 flex flex-col items-center pointer-events-none animate-in fade-in duration-150"
                    style={{ bottom: `${barHeight + 8}px` }}
                  >
                    <div className="bg-[#1C1B18] text-white text-[11px] font-semibold px-2 py-1 rounded-md shadow-md whitespace-nowrap tabular-nums">
                      {formatINR(item.value)}
                    </div>
                    {/* Tooltip triangle */}
                    <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-[#1C1B18]" />
                  </div>
                )}

                {/* Bar */}
                <div
                  className={`w-4 sm:w-5 md:w-6 rounded-t-[5px] transition-all duration-200 ${
                    isSelected
                      ? 'bg-[#7FAE82]'
                      : 'bg-[#B9D4BA] hover:bg-[#A6C8A7]'
                  }`}
                  style={{ height: `${barHeight}px` }}
                />
              </div>
            );
          })}
        </div>

        {/* X-axis labels */}
        <div className="ml-12 flex justify-between px-2 sm:px-4 pt-2 text-[11px] text-[#9A948A]">
          {data.map((item) => (
            <div
              key={item.month}
              className={`flex-1 text-center font-medium transition-colors cursor-pointer ${
                selectedMonth === item.month ? 'text-[#1C1B18] font-bold' : ''
              }`}
              onClick={() => setSelectedMonth(item.month)}
            >
              {item.month}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
