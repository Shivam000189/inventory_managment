import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { formatINR } from '../../lib/formatters';

interface ChartDataPoint {
  month: string;
  value: number;
  highlighted?: boolean;
}

export const InventoryTrendChart: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'Last 6 months' | 'Last 10 months' | 'Last 12 months'>('Last 6 months');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('Jul');

  const data: ChartDataPoint[] = [
    { month: 'Jan', value: 240000 },
    { month: 'Feb', value: 310000 },
    { month: 'Mar', value: 385000 },
    { month: 'Apr', value: 490000 },
    { month: 'May', value: 470000 },
    { month: 'Jun', value: 440000 },
    { month: 'Jul', value: 428000, highlighted: true },
    { month: 'Aug', value: 580000 },
    { month: 'Sep', value: 575000 },
    { month: 'Oct', value: 590000 },
  ];

  const maxValue = 600000;
  const chartHeight = 160; // px
  const activePoint = data.find((d) => d.month === selectedMonth) || data[6];

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
            <span className="w-9 shrink-0 text-right pr-2">600K</span>
            <div className="w-full border-b border-dashed border-[#EEE6DA]/80" />
          </div>
          <div className="flex items-center w-full">
            <span className="w-9 shrink-0 text-right pr-2">400K</span>
            <div className="w-full border-b border-dashed border-[#EEE6DA]/80" />
          </div>
          <div className="flex items-center w-full">
            <span className="w-9 shrink-0 text-right pr-2">200K</span>
            <div className="w-full border-b border-dashed border-[#EEE6DA]/80" />
          </div>
          <div className="flex items-center w-full">
            <span className="w-9 shrink-0 text-right pr-2">0</span>
            <div className="w-full border-b border-[#EEE6DA]" />
          </div>
        </div>

        {/* Bars Container */}
        <div
          className="ml-9 flex items-end justify-between px-2 sm:px-4 relative"
          style={{ height: `${chartHeight}px` }}
        >
          {data.map((item) => {
            const barHeight = Math.round((item.value / maxValue) * chartHeight);
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
        <div className="ml-9 flex justify-between px-2 sm:px-4 pt-2 text-[11px] text-[#9A948A]">
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
