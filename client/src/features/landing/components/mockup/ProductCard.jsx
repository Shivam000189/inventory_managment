import React from 'react';
import { motion } from 'framer-motion';
import { ProductSVG } from '../common/ProductSVG';

export const ProductCard = ({ product, onSelect }) => {
  const isSelected = product.orderQty > 0;

  return (
    <motion.div
      layout
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      onClick={() => onSelect(product)}
      className={`group relative bg-[#ffffff] rounded-xl p-3 border transition-colors cursor-pointer flex flex-col justify-between hover:shadow-md ${
        isSelected
          ? 'border-[#e2d3c0] shadow-sm'
          : 'border-[#eee4d7] hover:border-[#d5c3ac]'
      }`}
    >
      {/* Product Illustration */}
      <div className="py-2 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
        <ProductSVG type={product.svgType} />
      </div>

      {/* Product Details */}
      <div className="mt-2">
        <div className="flex items-center justify-between text-[10px] text-[#2f1f13]/45 font-mono mb-0.5">
          <span>{product.sku}</span>
          <span>{product.stock} in stock</span>
        </div>
        <h4 className="text-xs font-bold text-[#2f1f13] truncate mb-2">
          {product.name}
        </h4>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-[#2f1f13]/75">
            <span>${product.price.toFixed(2)}</span>
            {isSelected && <span className="text-[#2f1f13]/40">×</span>}
          </div>

          {isSelected && (
            <motion.span
              key={product.orderQty}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              className="w-5 h-5 rounded-full bg-[#2f2a25] text-[#F6EDE1] text-[10px] font-bold flex items-center justify-center shadow-xs"
            >
              {product.orderQty}
            </motion.span>
          )}
        </div>
      </div>

      {/* Bottom Active Green Bar matching reference image */}
      {isSelected && (
        <motion.div
          layoutId={`product-active-bar-${product.id}`}
          className="absolute bottom-0 left-2 right-2 h-[3px] rounded-t-full bg-[#7bbd65]"
        />
      )}
    </motion.div>
  );
};
