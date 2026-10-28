import React from 'react';
import { ProductCard } from './ProductCard';

export const ProductGrid = ({
  products,
  onSelectProduct
}) => {
  if (products.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#ffffff]/60 rounded-xl border border-dashed border-[#dfd0bc]">
        <p className="text-sm font-semibold text-[#2f1f13]/70">No matching SKUs found</p>
        <p className="text-xs text-[#2f1f13]/40 mt-1">Try another search keyword or category tab</p>
      </div>
    );
  }

  return (
    <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onSelect={onSelectProduct}
        />
      ))}
    </div>
  );
};
