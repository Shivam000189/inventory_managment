import React, { type ReactNode, type HTMLAttributes } from 'react'
import { Icon } from './icons'
import './Feedback.css'

export interface EmptyStateProps {
  title?: string;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title = 'No items found',
  description = null,
  icon = 'package',
  action = null,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`ui-empty-state ${className}`}>
      <div className="ui-empty-icon" aria-hidden="true">
        {typeof icon === 'string' ? <Icon name={icon} size={28} /> : icon}
      </div>
      <h3 className="ui-empty-title">{title}</h3>
      {description && <p className="ui-empty-desc">{description}</p>}
      {action && <div style={{ marginTop: '8px' }}>{action}</div>}
    </div>
  )
}

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: number;
  className?: string;
  [key: string]: unknown;
}

export function Spinner({ size = 24, className = '', ...props }: SpinnerProps) {
  return (
    <span
      className={`ui-spinner ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      role="status"
      aria-label="Loading"
      {...props}
    />
  )
}

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  circle?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius,
  circle = false,
  className = '',
  style = {},
}: SkeletonProps) {
  const actualRadius = circle ? '50%' : borderRadius !== undefined ? borderRadius : 'var(--radius-xs, 6px)';
  const actualWidth = circle && height ? height : width;
  return (
    <div
      className={`ui-skeleton-pulse ${className}`}
      style={{ width: actualWidth, height, borderRadius: actualRadius, ...style }}
      aria-hidden="true"
    />
  )
}

export interface StatCardSkeletonProps {
  className?: string;
}

export function StatCardSkeleton({ className = '' }: StatCardSkeletonProps) {
  return (
    <div
      className={`bg-white rounded-2xl sm:rounded-[22px] p-3 sm:p-4 md:p-5 border border-[#EEE6DA] shadow-2xs ${className}`}
      aria-hidden="true"
    >
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        <Skeleton width={40} height={40} borderRadius={9999} />
        <div className="flex-1 space-y-1.5 min-w-0">
          <Skeleton width="55%" height={20} borderRadius={6} />
          <Skeleton width="75%" height={12} borderRadius={4} />
        </div>
      </div>
    </div>
  )
}

export interface StatGridSkeletonProps {
  count?: number;
  className?: string;
}

export function StatGridSkeleton({ count = 4, className = '' }: StatGridSkeletonProps) {
  return (
    <div
      className={`grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5 ${className}`}
      role="status"
      aria-busy="true"
    >
      <span className="sr-only">Loading metrics...</span>
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  )
}

export interface TableColumnSkeleton {
  title?: string;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
}

export interface TableSkeletonProps {
  columns?: TableColumnSkeleton[] | number;
  rows?: number;
  showHeader?: boolean;
  className?: string;
}

export function TableSkeleton({
  columns = 5,
  rows = 5,
  showHeader = true,
  className = '',
}: TableSkeletonProps) {
  const cols: TableColumnSkeleton[] = Array.isArray(columns)
    ? columns
    : Array.from({ length: columns }, (_, i) => ({
        width: i === 0 ? '30%' : i === columns - 1 ? '15%' : '20%',
        align: i === columns - 1 ? 'right' : 'left',
      }));

  return (
    <div
      className={`bg-white rounded-2xl border border-[#EEE6DA] overflow-hidden shadow-2xs ${className}`}
      role="status"
      aria-busy="true"
    >
      <span className="sr-only">Loading table data...</span>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[700px]">
          {showHeader && (
            <thead className="bg-[#FAF6EF] border-b border-[#EEE6DA]">
              <tr>
                {cols.map((col, idx) => (
                  <th
                    key={idx}
                    className="py-3.5 px-4"
                    style={{
                      width: col.width,
                      textAlign: col.align || 'left',
                    }}
                  >
                    <Skeleton
                      width={typeof col.title === 'string' ? Math.max(40, col.title.length * 8) : '60%'}
                      height={14}
                      borderRadius={4}
                      style={{
                        margin: col.align === 'center' ? '0 auto' : col.align === 'right' ? '0 0 0 auto' : undefined,
                      }}
                    />
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="divide-y divide-[#EEE6DA]/80">
            {Array.from({ length: rows }).map((_, rIdx) => (
              <tr key={rIdx}>
                {cols.map((col, cIdx) => (
                  <td
                    key={cIdx}
                    className="py-3 px-4"
                    style={{ textAlign: col.align || 'left' }}
                  >
                    <Skeleton
                      width={
                        cIdx === 0
                          ? '75%'
                          : col.align === 'center'
                          ? '40%'
                          : col.align === 'right'
                          ? '50%'
                          : '60%'
                      }
                      height={16}
                      borderRadius={4}
                      style={{
                        margin: col.align === 'center' ? '0 auto' : col.align === 'right' ? '0 0 0 auto' : undefined,
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export interface ChartSkeletonProps {
  className?: string;
}

export function ChartSkeleton({ className = '' }: ChartSkeletonProps) {
  const barHeights = [45, 60, 75, 90, 80, 85];
  return (
    <div
      className={`bg-white rounded-[20px] p-5 border border-[#EEE6DA] shadow-2xs h-full flex flex-col justify-between ${className}`}
      role="status"
      aria-busy="true"
    >
      <span className="sr-only">Loading chart data...</span>
      <div className="flex items-center justify-between mb-4">
        <Skeleton width={140} height={20} borderRadius={6} />
        <Skeleton width={110} height={26} borderRadius={20} />
      </div>
      <div className="flex items-end justify-between px-6 pt-8 pb-4 h-[180px] border-b border-[#EEE6DA]/70">
        {barHeights.map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <Skeleton width={24} height={`${h}%`} borderRadius="6px 6px 0 0" />
            <Skeleton width={28} height={12} borderRadius={4} />
          </div>
        ))}
      </div>
    </div>
  )
}

export interface CardListSkeletonProps {
  title?: string;
  items?: number;
  className?: string;
}

export function CardListSkeleton({ title, items = 4, className = '' }: CardListSkeletonProps) {
  return (
    <div
      className={`bg-white rounded-[20px] p-5 border border-[#EEE6DA] shadow-2xs h-full flex flex-col justify-between ${className}`}
      role="status"
      aria-busy="true"
    >
      <span className="sr-only">Loading ${title || 'items'}...</span>
      <div className="flex items-center justify-between mb-4">
        {title ? (
          <h3 className="text-[15px] font-semibold text-[#1C1B18]">{title}</h3>
        ) : (
          <Skeleton width={120} height={18} borderRadius={6} />
        )}
        <Skeleton width={60} height={16} borderRadius={4} />
      </div>
      <div className="divide-y divide-[#EEE6DA] flex-1 flex flex-col justify-around">
        {Array.from({ length: items }).map((_, i) => (
          <div key={i} className="py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0 pr-3">
              <Skeleton width={36} height={36} borderRadius={10} />
              <div className="space-y-1.5 flex-1">
                <Skeleton width="70%" height={14} borderRadius={4} />
                <Skeleton width="40%" height={12} borderRadius={4} />
              </div>
            </div>
            <Skeleton width={32} height={16} borderRadius={4} />
          </div>
        ))}
      </div>
    </div>
  )
}

export interface PageHeaderSkeletonProps {
  className?: string;
  withAction?: boolean;
}

export function PageHeaderSkeleton({ className = '', withAction = true }: PageHeaderSkeletonProps) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${className}`} aria-hidden="true">
      <div className="space-y-1.5">
        <Skeleton width={180} height={28} borderRadius={8} />
        <Skeleton width={260} height={14} borderRadius={4} />
      </div>
      {withAction && <Skeleton width={130} height={38} borderRadius={12} />}
    </div>
  )
}

export function TablePageSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-6 ${className}`} role="status" aria-busy="true">
      <span className="sr-only">Loading page...</span>
      <PageHeaderSkeleton withAction={true} />
      <div className="flex items-center justify-between gap-3">
        <Skeleton width={240} height={36} borderRadius={10} />
        <Skeleton width={110} height={36} borderRadius={10} />
      </div>
      <TableSkeleton rows={6} />
    </div>
  )
}

export function InventoryTrendSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-white rounded-[20px] p-5 sm:p-6 border border-[#EEE6DA] shadow-2xs h-full flex flex-col justify-between ${className}`.trim()}
      role="status"
      aria-busy="true"
    >
      <span className="sr-only">Loading inventory trend...</span>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Skeleton width={130} height={20} borderRadius={6} />
        <Skeleton width={110} height={28} borderRadius={20} />
      </div>

      {/* Hero Highlight Card */}
      <div className="bg-[#F0F5EE]/60 border border-[#DEEAD9]/60 rounded-2xl p-4 sm:p-5 mb-5 space-y-2">
        <Skeleton width={150} height={12} borderRadius={4} />
        <Skeleton width={180} height={32} borderRadius={6} />
        <Skeleton width={220} height={14} borderRadius={4} />
      </div>

      {/* Monthly Breakdown Subheader */}
      <div className="mb-3">
        <Skeleton width={130} height={16} borderRadius={4} />
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 flex-1">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="p-3.5 rounded-xl border border-[#E8ECE6] bg-[#F7F9F6] flex flex-col justify-between space-y-3">
            <div className="space-y-1.5">
              <Skeleton width={32} height={12} borderRadius={4} />
              <Skeleton width="80%" height={20} borderRadius={4} />
            </div>
            <Skeleton width={50} height={12} borderRadius={4} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function StockAlertsSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-white rounded-[20px] p-5 border border-[#EEE6DA] shadow-2xs h-full flex flex-col justify-between min-h-[280px] ${className}`.trim()}
      role="status"
      aria-busy="true"
    >
      <span className="sr-only">Loading stock alerts...</span>
      <div className="flex items-center justify-between mb-3">
        <Skeleton width={110} height={20} borderRadius={6} />
        <Skeleton width={60} height={14} borderRadius={4} />
      </div>
      <div className="divide-y divide-[#EEE6DA] flex-1 flex flex-col justify-around">
        {[1, 2, 3].map((i) => (
          <div key={i} className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0 pr-3">
              <Skeleton width={36} height={36} borderRadius={12} />
              <div className="space-y-1.5 flex-1 min-w-0">
                <Skeleton width="80%" height={14} borderRadius={4} />
                <Skeleton width="45%" height={12} borderRadius={4} />
              </div>
            </div>
            <Skeleton width={14} height={14} borderRadius={4} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function RecentTransactionsSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-white rounded-[20px] p-5 border border-[#EEE6DA] shadow-2xs h-full flex flex-col justify-between min-h-[300px] ${className}`.trim()}
      role="status"
      aria-busy="true"
    >
      <span className="sr-only">Loading recent transactions...</span>
      <div className="flex items-center justify-between mb-4">
        <Skeleton width={160} height={20} borderRadius={6} />
        <Skeleton width={60} height={14} borderRadius={4} />
      </div>
      <div className="overflow-x-auto min-w-0">
        <table className="w-full text-left text-xs min-w-[320px]">
          <thead>
            <tr className="border-b border-[#EEE6DA] pb-2">
              <th className="py-2"><Skeleton width={40} height={12} borderRadius={4} /></th>
              <th className="py-2"><Skeleton width={45} height={12} borderRadius={4} /></th>
              <th className="py-2"><Skeleton width={50} height={12} borderRadius={4} /></th>
              <th className="py-2 text-center"><Skeleton width={30} height={12} borderRadius={4} style={{ margin: '0 auto' }} /></th>
              <th className="py-2 text-right"><Skeleton width={45} height={12} borderRadius={4} style={{ marginLeft: 'auto' }} /></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEE6DA]/70">
            {[1, 2, 3, 4].map((i) => (
              <tr key={i}>
                <td className="py-3"><Skeleton width={70} height={13} borderRadius={4} /></td>
                <td className="py-3"><Skeleton width={60} height={13} borderRadius={4} /></td>
                <td className="py-3"><Skeleton width="90%" height={13} borderRadius={4} /></td>
                <td className="py-3 text-center"><Skeleton width={20} height={13} borderRadius={4} style={{ margin: '0 auto' }} /></td>
                <td className="py-3 text-right"><Skeleton width={35} height={13} borderRadius={4} style={{ marginLeft: 'auto' }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function TopStockSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-white rounded-[20px] p-5 border border-[#EEE6DA] shadow-2xs h-full flex flex-col justify-between min-h-[300px] ${className}`.trim()}
      role="status"
      aria-busy="true"
    >
      <span className="sr-only">Loading top stock items...</span>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Skeleton width={90} height={20} borderRadius={6} />
          <Skeleton width={95} height={24} borderRadius={8} />
        </div>
        <Skeleton width={60} height={14} borderRadius={4} />
      </div>
      <div className="divide-y divide-[#EEE6DA] flex-1 flex flex-col justify-around">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0 pr-3">
              <Skeleton width={36} height={36} borderRadius={12} />
              <div className="space-y-1.5 flex-1 min-w-0">
                <Skeleton width="75%" height={14} borderRadius={4} />
                <Skeleton width="45%" height={12} borderRadius={4} />
              </div>
            </div>
            <Skeleton width={60} height={16} borderRadius={4} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardOverviewSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-6 ${className}`.trim()} role="status" aria-busy="true">
      <span className="sr-only">Loading overview dashboard...</span>

      {/* Top Metric Cards Skeleton */}
      <StatGridSkeleton count={4} />

      {/* Bento Grid — 4 Core Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* 1. Inventory Trend Skeleton (Top-Left) */}
        <div className="lg:col-span-7 xl:col-span-8 h-full flex flex-col">
          <InventoryTrendSkeleton />
        </div>

        {/* 2. Stock Alerts Skeleton (Top-Right) */}
        <div className="lg:col-span-5 xl:col-span-4 h-full flex flex-col">
          <StockAlertsSkeleton />
        </div>

        {/* 3. Recent Transactions Skeleton (Bottom-Left) */}
        <div className="lg:col-span-7 xl:col-span-8 h-full flex flex-col">
          <RecentTransactionsSkeleton />
        </div>

        {/* 4. Top Stock Skeleton (Bottom-Right) */}
        <div className="lg:col-span-5 xl:col-span-4 h-full flex flex-col">
          <TopStockSkeleton />
        </div>
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return <DashboardOverviewSkeleton />;
}

export interface FormStatusProps {
  type?: string;
  variant?: string;
  message?: ReactNode;
  children?: ReactNode;
  onClose?: (() => void) | null;
  className?: string;
}

export function FormStatus({ type = 'success', variant = type, message, children, onClose = null, className = '' }: FormStatusProps) {
  const content = message || children
  if (!content) return null
  const statusType = variant || type
  return (
    <div
      className={`ui-form-status ui-form-status-${statusType} form-status ${statusType === 'error' ? 'error' : ''} ${className}`}
      role={statusType === 'error' ? 'alert' : 'status'}
      aria-live="polite"
    >
      <Icon name={statusType === 'error' ? 'alert-circle' : statusType === 'warning' ? 'warning' : 'check'} size={18} />
      <span style={{ flex: '1 1 auto' }}>{content}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}
          aria-label="Dismiss message"
        >
          <Icon name="close" size={16} />
        </button>
      )}
    </div>
  )
}

export const Toast = FormStatus
export const Alert = FormStatus
