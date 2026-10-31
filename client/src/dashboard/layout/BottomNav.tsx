import React from 'react';
import {
  Home,
  Package,
  Layers,
  ShoppingBag,
  ShoppingCart,
  Receipt,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface NavTab {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  isActive: (route: string) => boolean;
  onSelect?: () => void;
}

export const BottomNav: React.FC = () => {
  const { activeRoute, navigate, currentUser, posActiveTab, setPosActiveTab } = useApp();

  const isAdmin = currentUser?.role === 'admin';

  const adminTabs: NavTab[] = [
    {
      id: 'overview',
      label: 'Overview',
      path: '/app/overview',
      icon: Home,
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

  const salespersonTabs: NavTab[] = [
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
      icon: Receipt,
      isActive: () => posActiveTab === 'bills',
      onSelect: () => {
        navigate('/app/pos');
        setPosActiveTab('bills');
      },
    },
  ];

  const tabs: NavTab[] = isAdmin ? adminTabs : salespersonTabs;

  return (
    <nav
      aria-label="Mobile navigation"
      className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#EEE6DA] rounded-t-[26px] shadow-[0_-4px_24px_rgba(28,27,24,0.06)] px-3 pt-2 pb-3 transition-all duration-200"
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
                if (tab.onSelect) {
                  tab.onSelect();
                } else {
                  navigate(tab.path);
                }
              }}
              className={`flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-2xl transition-all duration-150 cursor-pointer select-none active:scale-95 ${
                active
                  ? 'text-[#1C1B18]'
                  : 'text-[#8C867A] hover:text-[#1C1B18]'
              }`}
            >
              <div
                className={`flex items-center justify-center w-11 h-7 rounded-xl transition-all duration-150 ${
                  active
                    ? 'bg-[#F4EDE2] text-[#1C1B18] shadow-2xs font-semibold'
                    : 'bg-transparent text-[#8C867A]'
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.3 : 1.8} />
              </div>
              <span
                className={`text-[11px] leading-tight tracking-tight transition-colors ${
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
