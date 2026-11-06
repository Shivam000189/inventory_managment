import React from 'react';
import {
  Shirt,
  Pill,
  Mouse,
  Footprints,
  Coffee,
  Smartphone,
  Package,
  BookOpen,
  Wine,
} from 'lucide-react';

interface ProductIconProps {
  type?: string;
  name?: string;
  category?: string;
  className?: string;
  size?: number | 'sm' | 'md' | 'lg' | string;
}

export const ProductIcon: React.FC<ProductIconProps> = ({
  type,
  name = '',
  category = '',
  className = 'w-9 h-9 rounded-xl bg-[#FAF6EF] text-[#6B665E] flex items-center justify-center shrink-0 border border-[#EEE6DA]',
  size = 18,
}) => {
  const numericSize =
    typeof size === 'number'
      ? size
      : size === 'sm'
      ? 14
      : size === 'md'
      ? 18
      : size === 'lg'
      ? 24
      : Number(size) || 18;

  const lower = (type || name || category).toLowerCase();

  const getIcon = () => {
    if (
      lower.includes('shirt') ||
      lower.includes('t-shirt') ||
      lower.includes('jeans') ||
      lower.includes('apparel') ||
      lower.includes('clothing')
    ) {
      return <Shirt size={numericSize} strokeWidth={1.75} />;
    }
    if (
      lower.includes('paracetamol') ||
      lower.includes('pill') ||
      lower.includes('vitamin') ||
      lower.includes('pharmacy')
    ) {
      return <Pill size={numericSize} strokeWidth={1.75} />;
    }
    if (lower.includes('mouse') || lower.includes('earbud') || lower.includes('keyboard')) {
      return <Mouse size={numericSize} strokeWidth={1.75} />;
    }
    if (lower.includes('shoe') || lower.includes('footwear') || lower.includes('loafer')) {
      return <Footprints size={numericSize} strokeWidth={1.75} />;
    }
    if (lower.includes('coffee') || lower.includes('tea')) {
      return <Coffee size={numericSize} strokeWidth={1.75} />;
    }
    if (lower.includes('cable') || lower.includes('phone') || lower.includes('usb')) {
      return <Smartphone size={numericSize} strokeWidth={1.75} />;
    }
    if (lower.includes('bottle') || lower.includes('syrup')) {
      return <Wine size={numericSize} strokeWidth={1.75} />;
    }
    if (lower.includes('book') || lower.includes('notebook')) {
      return <BookOpen size={numericSize} strokeWidth={1.75} />;
    }
    return <Package size={numericSize} strokeWidth={1.75} />;
  };

  return <div className={className}>{getIcon()}</div>;
};
