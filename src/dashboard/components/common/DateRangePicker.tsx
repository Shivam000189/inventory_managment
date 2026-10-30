import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Calendar } from 'lucide-react';

interface DateRangePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const todayStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const yesterday = new Date(Date.now() - 86400000);
  const yesterdayStr = yesterday.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const monthStr = now.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  const currentYear = now.getFullYear();
  const nextYearShort = (currentYear + 1).toString().slice(-2);

  const options = [
    `Today, ${todayStr}`,
    `Yesterday, ${yesterdayStr}`,
    'Last 7 days',
    'Last 30 days',
    `This month (${monthStr})`,
    'Last Quarter',
    `Financial Year ${currentYear}-${nextYearShort}`,
  ];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#EEE6DA] bg-white text-[13px] font-medium text-[#1C1B18] hover:border-[#DDD3C4] transition-colors cursor-pointer shadow-2xs"
      >
        <Calendar size={14} className="text-[#6B665E]" />
        <span>{value}</span>
        <ChevronDown size={14} className="text-[#6B665E]" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-[#EEE6DA] rounded-2xl shadow-lg p-1.5 z-40">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-between ${
                value === opt
                  ? 'bg-[#FAF6EF] text-[#1C1B18] font-semibold'
                  : 'text-[#6B665E] hover:bg-[#FAF6EF] hover:text-[#1C1B18]'
              }`}
            >
              <span>{opt}</span>
              {value === opt && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#7FAE82]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
