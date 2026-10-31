import React from 'react';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  ShoppingCart,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const BottomNav: React.FC = () => {
  const { activeRoute, navigate, currentUser, posActiveTab, setPosActiveTab } = useApp();

  const isAdmin = currentUser?.role === 'admin' || (currentUser?.role as any) === 'owner';

  const adminTabs = [
    {
      id: 'overview',
      label: 'Overview',
      path: '/app/overview',
      icon: LayoutDashboard,
      isActive: (r: string) =>
        r === '/' ||
        r === '/app' ||
        r === '/app/' ||
        r === '/app/overview' ||
        r === '/overview' ||
        r === '/dashboard',
    },
    {
      id: 'products',
      label: 'Products',
      path: '/app/products',
      icon: Package,
      isActive: (r: string) =>
        r.startsWith('/app/products') ||
        r.startsWith('/products') ||
        r.startsWith('/medicines'),
    },
    {
      id: 'inventory',
      label: 'Inventory',
      path: '/app/inventory',
      icon: Layers,
      isActive: (r: string) =>
        r.startsWith('/app/inventory') ||
        r.startsWith('/inventory') ||
        r.startsWith('/app/stock') ||
        r.startsWith('/stock') ||
        r.startsWith('/categories'),
    },
    {
      id: 'purchases',
      label: 'Purchases',
      path: '/app/purchase-orders',
      icon: ShoppingBag,
      isActive: (r: string) =>
        r.startsWith('/app/purchase-orders') ||
        r.startsWith('/purchase-orders') ||
        r.startsWith('/app/purchases') ||
        r.startsWith('/purchases') ||
        r.startsWith('/receiving'),
    },
  ];

  const salespersonTabs = [
    {
      id: 'pos',
      label: 'New Bill',
      path: '/app/pos',
      icon: ShoppingCart,
      isActive: () => posActiveTab === 'new_bill',
      onSelect: () => {
        navigate('/app/pos');
        setPosActiveTab('new_bill');
      },
    },
    {
      id: 'bills',
      label: 'My Bills',
      path: '/app/pos',
      icon: Layers,
      isActive: () => posActiveTab === 'bills',
      onSelect: () => {
        navigate('/app/pos');
        setPosActiveTab('bills');
      },
    },
  ];

  const tabs = isAdmin ? adminTabs : salespersonTabs;

  return (
    <nav
      aria-label="Mobile navigation"
      className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#EEE6DA] rounded-t-[22px] shadow-[0_-4px_24px_rgba(0,0,0,0.06)] px-2 pt-1.5 pb-2 transition-all duration-200"
    >
      <div
        className={`max-w-md mx-auto grid ${
          tabs.length === 4 ? 'grid-cols-4' : 'grid-cols-2'
        } items-center gap-1`}
      >
        {tabs.map((tab) => {
          const active = tab.isActive(activeRoute);
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                if ('onSelect' in tab && tab.onSelect) {
                  tab.onSelect();
                } else {
                  navigate(tab.path);
                }
              }}
              className={`flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-2xl transition-all duration-150 cursor-pointer select-none ${
                active
                  ? 'text-[#1C1B18]'
                  : 'text-[#8C867A] hover:text-[#1C1B18] active:scale-95'
              }`}
            >
              <div
                className={`flex items-center justify-center w-10 h-7 rounded-xl transition-all duration-150 ${
                  active
                    ? 'bg-[#F4EDE2] text-[#1C1B18] shadow-2xs'
                    : 'bg-transparent text-[#8C867A]'
                }`}
              >
                <Icon size={19} strokeWidth={active ? 2.2 : 1.8} />
              </div>
              <span
                className={`text-[11px] leading-none tracking-tight transition-colors ${
                  active
                    ? 'font-bold text-[#1C1B18]'
                    : 'font-medium text-[#8C867A]'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
