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
  iconBgColor = 'bg-[#4F86F7] text-white',
  label,
  value,
  trend,
  isPositive = true,
  onClick,
  className = '',
}) => {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`bg-white rounded-2xl sm:rounded-[22px] p-3 sm:p-4 md:p-5 border border-[#EEE6DA] shadow-2xs hover:shadow-xs transition-all duration-150 ${
        onClick
          ? 'cursor-pointer hover:border-[#DDD3C4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7FAE82]'
          : ''
      } ${className}`}
    >
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {/* Round circular icon container */}
        <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shrink-0 ${iconBgColor}`}>
          {icon}
        </div>

        {/* Big number on top, label on bottom, badge on its own line on desktop */}
        <div className="min-w-0 flex-1">
          <div className="text-[17px] xs:text-[19px] sm:text-[22px] font-bold text-[#1C1B18] tracking-tight tabular-nums leading-tight truncate">
            {value}
          </div>

          <div
            className="text-[11px] sm:text-xs font-medium text-[#6B665E] truncate leading-tight mt-0.5"
            title={label}
          >
            {label}
          </div>

          {trend && (
            <div className="hidden md:block mt-1 pt-0.5 min-w-0">
              <span
                className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md truncate max-w-full ${
                  isPositive
                    ? 'bg-[#E8F5EC] text-[#2E8B57]'
                    : 'bg-[#FDECEC] text-[#D64545]'
                }`}
                title={trend}
              >
                {isPositive ? (
                  <ArrowUpRight size={11} strokeWidth={2.5} className="shrink-0" />
                ) : (
                  <ArrowDownRight size={11} strokeWidth={2.5} className="shrink-0" />
                )}
                <span className="truncate">{trend}</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
