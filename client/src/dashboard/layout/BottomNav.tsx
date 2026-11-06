import React, { useState } from 'react';
import {
  Home,
  Package,
  Layers,
  ShoppingBag,
  ShoppingCart,
  Receipt,
  User,
  Store,
  LogOut,
  X,
  ChevronRight,
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
  const {
    activeRoute,
    navigate,
    currentUser,
    businessProfile,
    logout,
    posActiveTab,
    setPosActiveTab,
  } = useApp();

  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);

  const isAdmin = currentUser?.role === 'admin' || (currentUser?.role as any) === 'owner';

  const adminTabs: NavTab[] = [
    {
      id: 'overview',
      label: 'Overview',
      path: '/overview',
      icon: Home,
      isActive: (r: string) =>
        r === '/' ||
        r === '/app' ||
        r === '/overview' ||
        r === '/dashboard',
    },
    {
      id: 'products',
      label: 'Products',
      path: '/products',
      icon: Package,
      isActive: (r: string) =>
        r.startsWith('/products') ||
        r.startsWith('/medicines'),
    },
    {
      id: 'inventory',
      label: 'Inventory',
      path: '/inventory',
      icon: Layers,
      isActive: (r: string) =>
        r.startsWith('/inventory') ||
        r.startsWith('/stock') ||
        r.startsWith('/categories'),
    },
    {
      id: 'purchases',
      label: 'Purchases',
      path: '/purchase-orders',
      icon: ShoppingBag,
      isActive: (r: string) =>
        r.startsWith('/purchase-orders') ||
        r.startsWith('/purchases') ||
        r.startsWith('/receiving'),
    },
    {
      id: 'profile',
      label: 'Profile',
      path: '/settings',
      icon: User,
      isActive: (r: string) =>
        isProfileSheetOpen ||
        r.startsWith('/settings') ||
        r.startsWith('/business-profile'),
      onSelect: () => {
        setIsProfileSheetOpen((prev) => !prev);
      },
    },
  ];

  const salespersonTabs: NavTab[] = [
    {
      id: 'pos',
      label: 'New Bill',
      path: '/pos',
      icon: ShoppingCart,
      isActive: () => posActiveTab === 'new_bill' && !isProfileSheetOpen,
      onSelect: () => {
        setIsProfileSheetOpen(false);
        navigate('/pos');
        setPosActiveTab('new_bill');
      },
    },
    {
      id: 'bills',
      label: 'My Bills',
      path: '/pos',
      icon: Receipt,
      isActive: () => posActiveTab === 'bills' && !isProfileSheetOpen,
      onSelect: () => {
        setIsProfileSheetOpen(false);
        navigate('/pos');
        setPosActiveTab('bills');
      },
    },
    {
      id: 'profile',
      label: 'Profile',
      path: '/pos',
      icon: User,
      isActive: () => isProfileSheetOpen,
      onSelect: () => {
        setIsProfileSheetOpen((prev) => !prev);
      },
    },
  ];

  const tabs: NavTab[] = isAdmin ? adminTabs : salespersonTabs;

  return (
    <>
      {/* Mobile Profile Bottom Sheet Backdrop */}
      {isProfileSheetOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setIsProfileSheetOpen(false)}
        />
      )}

      {/* Mobile Profile Bottom Sheet Drawer */}
      {isProfileSheetOpen && (
        <div className="fixed bottom-0 inset-x-0 z-50 lg:hidden bg-white rounded-t-[32px] border-t border-[#EEE6DA] shadow-2xl p-5 pb-8 max-w-lg mx-auto animate-in slide-in-from-bottom duration-200">
          {/* Top Grab Handle */}
          <div className="w-12 h-1.5 bg-[#DDD3C4] rounded-full mx-auto mb-3" />

          {/* Sheet Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#EEE6DA]">
            <span className="text-xs font-bold text-[#1C1B18] uppercase tracking-wider">
              Profile & Account
            </span>
            <button
              type="button"
              onClick={() => setIsProfileSheetOpen(false)}
              className="p-1.5 rounded-xl text-[#9A948A] hover:text-[#1C1B18] hover:bg-[#FAF6EF] transition-colors cursor-pointer"
              aria-label="Close profile sheet"
            >
              <X size={18} />
            </button>
          </div>

          {/* User Info Card */}
          <div className="mt-4 p-4 rounded-2xl bg-[#FAF6EF] border border-[#EEE6DA] flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-[#1C1B18] text-white flex items-center justify-center font-bold text-base shrink-0 tracking-wider shadow-xs">
              {currentUser?.avatarInitials || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-[#1C1B18] truncate">
                {currentUser?.name || 'User'}
              </div>
              <div className="text-xs text-[#6B665E] truncate">
                {currentUser?.email || ''}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#E8F5EC] text-[#2E8B57] capitalize">
                  {isAdmin ? 'Owner / Admin' : 'Salesperson'}
                </span>
                {businessProfile?.name && (
                  <span className="text-[11px] text-[#8C8479] truncate">
                    · {businessProfile.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-3.5 space-y-2">
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setIsProfileSheetOpen(false);
                  navigate('/settings');
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white hover:bg-[#FAF6EF] border border-[#EEE6DA] transition-colors cursor-pointer group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FAF6EF] text-[#1C1B18] flex items-center justify-center shrink-0 group-hover:bg-[#F4EDE2] transition-colors">
                    <Store size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#1C1B18]">
                      Business Profile & Settings
                    </div>
                    <div className="text-[11px] text-[#6B665E]">
                      Store identity, billing rules, UPI & inventory
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-[#9A948A] group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}

            <button
              type="button"
              onClick={async () => {
                setIsProfileSheetOpen(false);
                await logout();
              }}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white hover:bg-[#FDECEC] border border-[#EEE6DA] hover:border-[#f5c6c6] transition-colors cursor-pointer group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#FAF6EF] text-[#6B665E] group-hover:bg-[#FDECEC] group-hover:text-[#D64545] flex items-center justify-center shrink-0 transition-colors">
                  <LogOut size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1C1B18] group-hover:text-[#D64545] transition-colors">
                    Sign Out
                  </div>
                  <div className="text-[11px] text-[#6B665E] group-hover:text-[#D64545]/70 transition-colors">
                    End your current session safely
                  </div>
                </div>
              </div>
              <ChevronRight size={16} className="text-[#9A948A] group-hover:text-[#D64545] group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#EEE6DA] rounded-t-[26px] shadow-[0_-4px_24px_rgba(28,27,24,0.06)] px-2.5 pt-2 pb-3 transition-all duration-200"
      >
        <div
          className={`max-w-md mx-auto grid ${
            tabs.length === 5
              ? 'grid-cols-5'
              : tabs.length === 4
              ? 'grid-cols-4'
              : tabs.length === 3
              ? 'grid-cols-3'
              : 'grid-cols-2'
          } items-center gap-0.5`}
        >
          {tabs.map((tab) => {
            const active = tab.isActive(activeRoute);
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  if (tab.id !== 'profile') {
                    setIsProfileSheetOpen(false);
                  }
                  if (tab.onSelect) {
                    tab.onSelect();
                  } else {
                    navigate(tab.path);
                  }
                }}
                className={`flex flex-col items-center justify-center gap-0.5 py-1 px-0.5 rounded-2xl transition-all duration-150 cursor-pointer select-none active:scale-95 ${
                  active
                    ? 'text-[#1C1B18]'
                    : 'text-[#8C867A] hover:text-[#1C1B18]'
                }`}
              >
                <div
                  className={`flex items-center justify-center w-10 h-7 rounded-xl transition-all duration-150 ${
                    active
                      ? 'bg-[#F4EDE2] text-[#1C1B18] shadow-2xs font-semibold'
                      : 'bg-transparent text-[#8C867A]'
                  }`}
                >
                  <Icon size={19} strokeWidth={active ? 2.3 : 1.8} />
                </div>
                <span
                  className={`text-[10px] sm:text-[11px] leading-tight tracking-tight truncate max-w-full transition-colors ${
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
    </>
  );
};

export default BottomNav;
