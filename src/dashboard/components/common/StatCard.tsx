import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  icon: React.ReactNode;
  iconBgColor?: string;
  label: string;
  value: string | number;
  trend?: string;
  isPositive?: boolean;
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  iconBgColor = 'bg-[#E6F1E6] text-[#2E8B57]',
  label,
  value,
  trend,
  isPositive = true,
  onClick,
  className = '',
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-[20px] p-5 border border-[#EEE6DA] transition-all duration-150 ${
        onClick ? 'cursor-pointer hover:border-[#DDD3C4] hover:shadow-xs' : ''
      } ${className}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBgColor}`}>
          {icon}
        </div>
        <span className="text-[12px] font-medium text-[#6B665E]">{label}</span>
      </div>

      <div className="text-[26px] font-bold text-[#1C1B18] tracking-tight tabular-nums mb-2 leading-none">
        {value}
      </div>

      {trend && (
        <div>
          <span
            className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
              isPositive
                ? 'bg-[#E8F5EC] text-[#2E8B57]'
                : 'bg-[#FDECEC] text-[#D64545]'
            }`}
          >
            {isPositive ? (
              <ArrowUpRight size={13} strokeWidth={2.5} />
            ) : (
              <ArrowDownRight size={13} strokeWidth={2.5} />
            )}
            {trend}
          </span>
        </div>
      )}
    </div>
  );
};
