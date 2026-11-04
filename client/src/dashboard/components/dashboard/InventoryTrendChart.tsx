import React, { useState, useMemo, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { formatINR } from '../../lib/formatters';
import { useApp } from '../../context/AppContext';

interface ChartDataPoint {
  month: string;
  year: number;
  value: number;
  isCurrentMonth: boolean;
  isEstimated: boolean;
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
  const { data, hasRealHistoricalData } = useMemo(() => {
    const buckets: { month: string; year: number; monthIndex: number; key: string }[] = [];
    for (let i = monthCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        month: d.toLocaleString('en-US', { month: 'short' }),
        year: d.getFullYear(),
        monthIndex: d.getMonth(),
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      });
    }

    const currentStockVal = metrics.totalStockValue > 0
      ? metrics.totalStockValue
      : (products || []).reduce((acc, p) => acc + (Number(p.stock || 0) * Number(p.purchasePrice || p.sellingPrice || 0)), 0);

    // Group real stock transaction deltas by bucket key
    const monthDeltas = new Map<string, number>();
    let matchedTransactionCount = 0;

    stockMovements.forEach((m) => {
      let movementDate: Date | null = null;
      const rawDate = (m as any).createdAt || m.date;
      if (rawDate) {
        const parsed = new Date(rawDate);
        if (!isNaN(parsed.getTime())) {
          movementDate = parsed;
        }
      }

      if (movementDate && !isNaN(movementDate.getTime())) {
        const key = `${movementDate.getFullYear()}-${String(movementDate.getMonth() + 1).padStart(2, '0')}`;
        const val = Number(m.amount ?? 0) || (Math.abs(Number(m.qtyDelta ?? 0)) * 100);
        monthDeltas.set(key, (monthDeltas.get(key) || 0) + val);
        matchedTransactionCount++;
      }
    });

    const realHistoryAvailable = matchedTransactionCount > 0;

    // Working backwards from current month stock value to reconstruct historical points
    const points: ChartDataPoint[] = [];
    let rollingVal = Math.max(0, currentStockVal);

    for (let i = buckets.length - 1; i >= 0; i--) {
      const b = buckets[i];
      const isCurrent = b.monthIndex === now.getMonth() && b.year === now.getFullYear();

      if (isCurrent) {
        points.unshift({
          month: b.month,
          year: b.year,
          value: Math.max(0, rollingVal),
          isCurrentMonth: true,
          isEstimated: false,
        });
      } else if (realHistoryAvailable) {
        // If real delta exists for this month, adjust rolling inventory
        const delta = monthDeltas.get(b.key) || 0;
        rollingVal = Math.max(0, rollingVal - delta);
        points.unshift({
          month: b.month,
          year: b.year,
          value: rollingVal,
          isCurrentMonth: false,
          isEstimated: false,
        });
      } else {
        // When no previous month transaction history is stored, generate an explicitly labeled estimate
        const factor = Math.max(0.35, 1 - (buckets.length - 1 - i) * 0.08);
        const estVal = Math.round(Math.max(1000, currentStockVal * factor));
        points.unshift({
          month: b.month,
          year: b.year,
          value: estVal,
          isCurrentMonth: false,
          isEstimated: true,
        });
      }
    }

    return { data: points, hasRealHistoricalData: realHistoryAvailable };
  }, [now, monthCount, metrics.totalStockValue, products, stockMovements]);

  // Keep selected month synchronized when range changes
  useEffect(() => {
    if (!data.some((d) => d.month === selectedMonth)) {
      setSelectedMonth(currentMonthLabel);
    }
  }, [data, selectedMonth, currentMonthLabel]);

  const rawMax = Math.max(...data.map((d) => d.value), 100000);
  const maxValue = Math.ceil((rawMax * 1.15) / 100000) * 100000;
  const chartHeight = 160;

  const isCompletelyEmpty = data.every((d) => d.value === 0);

  return (
    <div className={`bg-white rounded-[20px] p-5 border border-[#EEE6DA] h-full flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all ${className}`.trim()}>
      {/* Card Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-[15px] font-semibold text-[#1C1B18]">Inventory Trend</h3>
          {!hasRealHistoricalData && (
            <span
              className="text-[10px] font-medium text-[#8A847A] bg-[#FAF6EF] px-2 py-0.5 rounded-full border border-[#EEE6DA]"
              title="Historical values are estimated from current inventory. Record inventory transactions to see live historical metrics."
            >
              Estimated
            </span>
          )}
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#EEE6DA] bg-white text-xs font-medium text-[#6B665E] hover:border-[#DDD3C4] transition-colors cursor-pointer"
            aria-expanded={isDropdownOpen}
            aria-haspopup="listbox"
          >
            <span>{timeRange}</span>
            <ChevronDown size={13} />
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-36 bg-white border border-[#EEE6DA] rounded-xl shadow-lg p-1 z-30" role="listbox">
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

      {isCompletelyEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-[#9A948A] text-xs">
          No inventory activity recorded yet.
        </div>
      ) : (
        /* Chart Canvas */
        <div className="relative pt-6 pb-2">
          {/* Y-axis and grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[11px] text-[#9A948A] tabular-nums" aria-hidden="true">
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
                  key={`${item.year}-${item.month}`}
                  className="flex-1 flex flex-col items-center group relative cursor-pointer"
                  onClick={() => setSelectedMonth(item.month)}
                  onMouseEnter={() => setSelectedMonth(item.month)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${item.month} ${item.year}: ${formatINR(item.value)}${item.isEstimated ? ' (Estimated)' : ''}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedMonth(item.month);
                    }
                  }}
                >
                  {/* Active Tooltip above bar */}
                  {isSelected && (
                    <div
                      className="absolute z-20 flex flex-col items-center pointer-events-none animate-in fade-in duration-150"
                      style={{ bottom: `${barHeight + 8}px` }}
                    >
                      <div className="bg-[#1C1B18] text-white text-[11px] font-semibold px-2 py-1 rounded-md shadow-md whitespace-nowrap tabular-nums">
                        {formatINR(item.value)}
                        {item.isEstimated && <span className="opacity-75 font-normal ml-1">(Est.)</span>}
                      </div>
                      {/* Tooltip triangle */}
                      <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-[#1C1B18]" />
                    </div>
                  )}

                  {/* Bar */}
                  <div
                    className={`w-3.5 sm:w-5 md:w-6 rounded-t-[5px] transition-all duration-200 ${
                      isSelected
                        ? 'bg-[#7FAE82]'
                        : item.isCurrentMonth
                        ? 'bg-[#98C49B]'
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
              <button
                key={`${item.year}-${item.month}`}
                type="button"
                className={`flex-1 text-center font-medium transition-colors cursor-pointer ${
                  selectedMonth === item.month ? 'text-[#1C1B18] font-bold' : 'hover:text-[#1C1B18]'
                }`}
                onClick={() => setSelectedMonth(item.month)}
              >
                {item.month}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
