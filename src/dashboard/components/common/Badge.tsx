import React from 'react';

export type BadgeVariant =
  | 'success'
  | 'danger'
  | 'warning'
  | 'neutral'
  | 'primary'
  | 'info';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className = '',
  size = 'md',
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    success: 'bg-[#E8F5EC] text-[#2E8B57]',
    danger: 'bg-[#FDECEC] text-[#D64545]',
    warning: 'bg-[#FFF4DC] text-[#D98E0B]',
    neutral: 'bg-[#FAF6EF] text-[#6B665E] border border-[#EEE6DA]',
    primary: 'bg-[#E6F1E6] text-[#2E8B57]',
    info: 'bg-[#FDEEE3] text-[#E8772E]',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-1.5 py-0.5 rounded',
    md: 'text-[11px] px-2 py-0.5 rounded-md font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 leading-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
