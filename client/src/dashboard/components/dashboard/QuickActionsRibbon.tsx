import React from 'react';

export interface QuickActionsRibbonProps {
  isPharmacy?: boolean;
  navigate: (route: string) => void;
}

interface ActionItem {
  id: string;
  label: string;
  path: string;
  iconSrc: string;
}

export const QuickActionsRibbon: React.FC<QuickActionsRibbonProps> = ({
  isPharmacy = false,
  navigate,
}) => {
  const actions: ActionItem[] = isPharmacy
    ? [
        {
          id: 'pos',
          label: 'POS Billing',
          path: '/pos',
          iconSrc: '/icons/3d/pos-sale.svg',
        },
        {
          id: 'medicine',
          label: 'Add Medicine',
          path: '/products',
          iconSrc: '/icons/3d/add-product.svg',
        },
        {
          id: 'batches',
          label: 'Batch Lots',
          path: '/batches',
          iconSrc: '/icons/3d/batches.svg',
        },
        {
          id: 'expiry',
          label: 'Expiry Radar',
          path: '/expiry',
          iconSrc: '/icons/3d/expiry.svg',
        },
        {
          id: 'prescriptions',
          label: 'Doctor Rx',
          path: '/prescriptions',
          iconSrc: '/icons/3d/prescription.svg',
        },
        {
          id: 'patients',
          label: 'Patients',
          path: '/customers',
          iconSrc: '/icons/3d/customers.svg',
        },
        {
          id: 'suppliers',
          label: 'Distributors',
          path: '/suppliers',
          iconSrc: '/icons/3d/suppliers.svg',
        },
        {
          id: 'returns',
          label: 'Returns',
          path: '/returns',
          iconSrc: '/icons/3d/returns.svg',
        },
      ]
    : [
        {
          id: 'pos',
          label: 'POS Sale',
          path: '/pos',
          iconSrc: '/icons/3d/pos-sale.svg',
        },
        {
          id: 'product',
          label: 'Add Product',
          path: '/products',
          iconSrc: '/icons/3d/add-product.svg',
        },
        {
          id: 'stock-in',
          label: 'Stock In',
          path: '/stock-in',
          iconSrc: '/icons/3d/stock-in.svg',
        },
        {
          id: 'purchase-order',
          label: 'Purchases',
          path: '/purchase-orders',
          iconSrc: '/icons/3d/purchase-order.svg',
        },
        {
          id: 'customers',
          label: 'Customers',
          path: '/customers',
          iconSrc: '/icons/3d/customers.svg',
        },
        {
          id: 'suppliers',
          label: 'Suppliers',
          path: '/suppliers',
          iconSrc: '/icons/3d/suppliers.svg',
        },
        {
          id: 'payments',
          label: 'Payments',
          path: '/payments',
          iconSrc: '/icons/3d/payments.svg',
        },
        {
          id: 'returns',
          label: 'Returns',
          path: '/returns',
          iconSrc: '/icons/3d/returns.svg',
        },
      ];

  return (
    <div className="w-full bg-[#FAF6EF]/60 p-2 sm:p-2.5 rounded-2xl border border-[#EEE6DA] shadow-2xs">
      {/* Single Frame Row: All actions side-by-side in 1 single row */}
      <div
        className="flex md:grid md:grid-cols-8 gap-2 sm:gap-2.5 w-full overflow-x-auto no-scrollbar scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => navigate(action.path)}
            className="group flex-1 min-w-[78px] md:min-w-0 flex flex-col items-center justify-between py-2 sm:py-2.5 px-1.5 rounded-xl sm:rounded-2xl bg-white border border-[#EEE6DA] shadow-2xs hover:shadow-md hover:border-[#DDD3C4] transition-all duration-150 cursor-pointer text-center active:scale-95 hover:-translate-y-0.5 focus:outline-none shrink-0 md:shrink"
          >
            {/* Compact 3D Rendered Illustration */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center shrink-0 my-0.5">
              <img
                src={action.iconSrc}
                alt={action.label}
                loading="eager"
                className="w-full h-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.06)] group-hover:scale-110 group-hover:drop-shadow-[0_4px_8px_rgba(0,0,0,0.12)] transition-transform duration-150 select-none pointer-events-none"
              />
            </div>

            {/* Centered label matching reference styling */}
            <span className="w-full mt-1 text-[11px] sm:text-xs font-semibold text-[#1C1B18] group-hover:text-[#381e12] tracking-tight truncate transition-colors">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActionsRibbon;
