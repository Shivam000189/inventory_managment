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
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className = '',
  size = 'md',
  dot = true,
}) => {
  const variantStyles: Record<BadgeVariant, { pill: string; dot: string }> = {
    success: {
      pill: 'bg-[#E8F5EC] text-[#2E8B57] border border-[#CDEBD5]',
      dot: 'bg-[#2E8B57]',
    },
    danger: {
      pill: 'bg-[#FDECEC] text-[#D64545] border border-[#F9C2C2]',
      dot: 'bg-[#D64545]',
    },
    warning: {
      pill: 'bg-[#FFF4DC] text-[#D98E0B] border border-[#FDE3B2]',
      dot: 'bg-[#D98E0B]',
    },
    neutral: {
      pill: 'bg-[#FAF6EF] text-[#6B665E] border border-[#EEE6DA]',
      dot: 'bg-[#8C867A]',
    },
    primary: {
      pill: 'bg-[#E8F0E6] text-[#2D5A27] border border-[#C5DDC2]',
      dot: 'bg-[#2D5A27]',
    },
    info: {
      pill: 'bg-[#EBF2FA] text-[#2563EB] border border-[#BFDBFE]',
      dot: 'bg-[#2563EB]',
    },
  };

  const style = variantStyles[variant] || variantStyles.neutral;

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 rounded-full',
    md: 'text-[11px] px-2.5 py-0.5 rounded-full font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 leading-none transition-colors whitespace-nowrap ${sizeStyles[size]} ${style.pill} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
};

export default Badge;
