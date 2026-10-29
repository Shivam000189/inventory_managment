import React from 'react';
import { motion } from 'framer-motion';

// Pixel-matched icons inspired directly by the reference design
const PackageIcon = () => (
  <svg
    className="w-6 h-6 text-[#1f1d1b]"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.3 7 8.7 5 8.7-5" />
    <path d="M12 22V12" />
    <path d="m7.5 4.5 9 5.2" />
  </svg>
);

const CoinsStackIcon = () => (
  <svg
    className="w-6 h-6 text-[#1f1d1b]"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <ellipse cx="12" cy="6" rx="6.5" ry="2.5" />
    <path d="M5.5 6v4c0 1.38 2.91 2.5 6.5 2.5s6.5-1.12 6.5-2.5V6" />
    <path d="M5.5 10v4c0 1.38 2.91 2.5 6.5 2.5s6.5-1.12 6.5-2.5v-4" />
    <path d="M5.5 14v4c0 1.38 2.91 2.5 6.5 2.5s6.5-1.12 6.5-2.5v-4" />
  </svg>
);

const DeliveryTruckIcon = () => (
  <svg
    className="w-6 h-6 text-[#1f1d1b]"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
    <path d="M14 8h4.5a2 2 0 0 1 1.6.8l2.4 3.2a2 2 0 0 1 .5 1.3V17a1 1 0 0 1-1 1h-2" />
    <circle cx="7" cy="18" r="2" />
    <circle cx="17" cy="18" r="2" />
  </svg>
);

const ShoppingCartIcon = () => (
  <svg
    className="w-6 h-6 text-[#1f1d1b]"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="8" cy="21" r="1.2" />
    <circle cx="19" cy="21" r="1.2" />
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
  </svg>
);

const BarChartIcon = () => (
  <svg
    className="w-6 h-6 text-[#1f1d1b]"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <rect x="4" y="14" width="3.5" height="7" rx="1.75" />
    <rect x="10.25" y="9" width="3.5" height="12" rx="1.75" />
    <rect x="16.5" y="4" width="3.5" height="17" rx="1.75" />
  </svg>
);

const TeamUsersIcon = () => (
  <svg
    className="w-6 h-6 text-[#1f1d1b]"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const FEATURE_CARDS = [
  {
    id: 'product-catalog',
    title: 'Product & Catalog Management',
    description:
      'Create, organize and manage products with SKU, barcode, GST, categories and more.',
    icon: PackageIcon
  },
  {
    id: 'stock-tracking',
    title: 'Stock Tracking',
    description:
      'Real-time stock levels, multi-warehouse support and automated low-stock alerts.',
    icon: CoinsStackIcon
  },
  {
    id: 'supplier-purchase-orders',
    title: 'Supplier & Purchase Orders',
    description:
      'Manage suppliers, create purchase orders and track deliveries with ease.',
    icon: DeliveryTruckIcon
  },
  {
    id: 'pos-billing',
    title: 'POS & Billing',
    description:
      'Fast and simple billing with multiple payment methods, GST invoicing and returns.',
    icon: ShoppingCartIcon
  },
  {
    id: 'reports-analytics',
    title: 'Reports & Analytics',
    description:
      'Get detailed insights on sales, stock, purchases and business performance.',
    icon: BarChartIcon
  },
  {
    id: 'team-permissions',
    title: 'Team & Permissions',
    description:
      'Invite team members and control access with role-based permissions.',
    icon: TeamUsersIcon
  }
];

export const FeaturesGrid = () => {
  return (
    <section className="relative w-full pt-14 sm:pt-20 pb-8 sm:pb-12 select-none">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        {/* Header Block */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto mb-12 sm:mb-16"
        >
          {/* Subtle Tag */}
          <span className="text-[11px] sm:text-xs font-semibold tracking-[0.2em] text-[#6e6760] uppercase block mb-3">
            FEATURES
          </span>

          {/* Main Title */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-extrabold tracking-tight text-[#1a1715] leading-[1.18]">
            Everything you need to keep business moving
          </h2>

          {/* Subtitle */}
          <p className="mt-3.5 sm:mt-4 text-sm sm:text-base md:text-[17px] text-[#635d56] max-w-2xl mx-auto font-normal leading-relaxed">
            From inventory and purchasing to sales and analytics — Inventry gives
            you all the tools to run and grow your business efficiently.
          </p>
        </motion.div>

        {/* 6-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {FEATURE_CARDS.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.06,
                  ease: [0.16, 1, 0.3, 1]
                }}
                whileHover={{ y: -4 }}
                className="group relative flex flex-col items-start text-left p-7 sm:p-8 rounded-[22px] bg-[#ffffff] border border-[#eee8df] shadow-[0_2px_12px_rgba(47,31,19,0.03)] hover:shadow-[0_12px_28px_rgba(47,31,19,0.07)] transition-all duration-300"
              >
                {/* Peach-tinted Icon Container */}
                <div className="w-12 h-12 rounded-[14px] bg-[#fceddf] flex items-center justify-center shrink-0 mb-6 group-hover:scale-105 transition-transform duration-200">
                  <Icon />
                </div>

                {/* Card Title */}
                <h3 className="text-xl sm:text-[21px] font-bold text-[#1a1715] tracking-tight leading-snug mb-2.5">
                  {card.title}
                </h3>

                {/* Card Description */}
                <p className="text-[14.5px] text-[#635d56] leading-[1.65] font-normal">
                  {card.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;

