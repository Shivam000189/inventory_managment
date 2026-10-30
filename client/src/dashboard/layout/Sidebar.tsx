import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  Layers,
  Users,
  ShoppingCart,
  UserCheck,
  FileBarChart,
  Settings,
  ChevronDown,
  ChevronRight,
  Building2,
  Box,
  X,
  LogOut,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface SidebarProps {
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpenMobile, onCloseMobile }) => {
  const {
    activeRoute,
    navigate,
    currentUser,
    businessProfile,
    posActiveTab,
    setPosActiveTab,
    customersActiveTab,
    setCustomersActiveTab,
    logout,
  } = useApp();

  const isPosRoute =
    activeRoute.startsWith('/app/pos') ||
    activeRoute.startsWith('/pos') ||
    activeRoute.startsWith('/app/sales') ||
    activeRoute.startsWith('/sales') ||
    activeRoute.startsWith('/bills');

  const isCustomersRoute =
    activeRoute.startsWith('/app/customers') ||
    activeRoute.startsWith('/customers');

  const [isCustomersExpanded, setIsCustomersExpanded] = useState(isCustomersRoute);
  const [isPosExpanded, setIsPosExpanded] = useState(isPosRoute);

  useEffect(() => {
    if (isCustomersRoute) {
      setIsCustomersExpanded(true);
    }
    if (isPosRoute) {
      setIsPosExpanded(true);
    }
  }, [activeRoute, isCustomersRoute, isPosRoute]);

  const isAdmin = currentUser?.role === 'admin' || (currentUser?.role as any) === 'owner';

  const isOverviewActive =
    activeRoute === '/' ||
    activeRoute === '/app' ||
    activeRoute === '/app/' ||
    activeRoute === '/app/overview' ||
    activeRoute === '/overview' ||
    activeRoute === '/dashboard';

  const handleNavClick = (path: string) => {
    navigate(path);
    onCloseMobile();
  };

  const navItemClass = (isActive: boolean) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-[14px] text-[13.5px] font-medium transition-all duration-150 cursor-pointer ${
      isActive
        ? 'bg-[#F4EDE2] text-[#1C1B18] font-semibold'
        : 'text-[#6B665E] hover:bg-[#FAF6EF] hover:text-[#1C1B18]'
    }`;

  const subNavItemClass = (isActive: boolean) =>
    `flex items-center gap-2.5 pl-8 pr-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
      isActive
        ? 'text-[#1C1B18] font-semibold bg-[#F4EDE2]/60'
        : 'text-[#6B665E] hover:text-[#1C1B18] hover:bg-[#FAF6EF]'
    }`;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-60 h-full bg-white border-r border-[#EEE6DA] flex flex-col justify-between transition-transform duration-200 ease-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        } shrink-0`}
      >
        <div className="flex-1 min-h-0 flex flex-col">
          {/* Logo Mark + Wordmark */}
          <div className="h-16 shrink-0 flex items-center justify-between px-5 border-b border-[#EEE6DA]">
            <div
              role="button"
              tabIndex={0}
              onClick={() => handleNavClick(isAdmin ? '/app/overview' : '/app/pos')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleNavClick(isAdmin ? '/app/overview' : '/app/pos');
                }
              }}
              className="flex items-center gap-2.5 cursor-pointer hover:opacity-85 transition-opacity min-w-0 focus:outline-none"
              title={businessProfile?.name || 'Dashboard Home'}
            >
              <div className="w-8 h-8 rounded-xl bg-[#1C1B18] text-white flex items-center justify-center shadow-xs shrink-0">
                <Box size={18} strokeWidth={2.2} />
              </div>
              <span className="text-[18px] font-bold tracking-tight text-[#1C1B18] truncate">
                Inventory
              </span>
            </div>

            {/* Mobile close button */}
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-[#6B665E] hover:bg-[#FAF6EF] hover:text-[#1C1B18] transition-colors cursor-pointer"
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 min-h-0 p-3.5 space-y-1 overflow-y-auto">
            {/* If Salesperson, only show POS & Sales */}
            {!isAdmin ? (
              <div className="space-y-1">
                <div className="px-3 py-1 text-[11px] font-semibold text-[#9A948A] uppercase tracking-wider">
                  Sales Terminal
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      handleNavClick('/app/pos');
                      setPosActiveTab('new_bill');
                    }}
                    className={`w-full ${navItemClass(
                      isPosRoute && posActiveTab === 'new_bill'
                    )}`}
                  >
                    <ShoppingCart size={18} strokeWidth={1.8} />
                    <span>New Bill</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleNavClick('/app/pos');
                      setPosActiveTab('bills');
                    }}
                    className={`w-full mt-1 ${navItemClass(
                      isPosRoute && posActiveTab === 'bills'
                    )}`}
                  >
                    <Layers size={18} strokeWidth={1.8} />
                    <span>My Bills</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Admin Full Menu */
              <>
                <button
                  type="button"
                  onClick={() => handleNavClick('/app/overview')}
                  className={`w-full ${navItemClass(isOverviewActive)}`}
                >
                  <LayoutDashboard size={18} strokeWidth={1.8} />
                  <span>Overview</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNavClick('/app/products')}
                  className={`w-full ${navItemClass(
                    activeRoute.startsWith('/app/products') ||
                    activeRoute.startsWith('/products') ||
                    activeRoute.startsWith('/medicines')
                  )}`}
                >
                  <Package size={18} strokeWidth={1.8} />
                  <span>Products</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNavClick('/app/inventory')}
                  className={`w-full ${navItemClass(
                    activeRoute.startsWith('/app/inventory') ||
                    activeRoute.startsWith('/inventory') ||
                    activeRoute.startsWith('/app/stock') ||
                    activeRoute.startsWith('/stock') ||
                    activeRoute.startsWith('/categories')
                  )}`}
                >
                  <Layers size={18} strokeWidth={1.8} />
                  <span>Inventory</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNavClick('/app/suppliers')}
                  className={`w-full ${navItemClass(
                    activeRoute.startsWith('/app/suppliers') ||
                    activeRoute.startsWith('/suppliers')
                  )}`}
                >
                  <Users size={18} strokeWidth={1.8} />
                  <span>Suppliers</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNavClick('/app/purchase-orders')}
                  className={`w-full ${navItemClass(
                    activeRoute.startsWith('/app/purchase-orders') ||
                    activeRoute.startsWith('/purchase-orders') ||
                    activeRoute.startsWith('/app/purchases') ||
                    activeRoute.startsWith('/purchases') ||
                    activeRoute.startsWith('/receiving')
                  )}`}
                >
                  <Building2 size={18} strokeWidth={1.8} />
                  <span>Purchase Orders</span>
                </button>

                {/* POS & Sales */}
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      handleNavClick('/app/pos');
                      setIsPosExpanded(true);
                    }}
                    className={`w-full justify-between ${navItemClass(isPosRoute)}`}
                  >
                    <div className="flex items-center gap-3">
                      <ShoppingCart size={18} strokeWidth={1.8} />
                      <span>POS & Sales</span>
                    </div>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsPosExpanded((prev) => !prev);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsPosExpanded((prev) => !prev);
                        }
                      }}
                      className="p-1 -mr-1 rounded-md hover:bg-black/5 transition-colors cursor-pointer"
                      aria-label="Toggle POS submenu"
                    >
                      {isPosExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                  </button>
                  {isPosExpanded && (
                    <div className="space-y-0.5 mt-1 mb-1">
                      <button
                        type="button"
                        onClick={() => {
                          handleNavClick('/app/pos');
                          setPosActiveTab('new_bill');
                        }}
                        className={`w-full ${subNavItemClass(
                          isPosRoute && posActiveTab === 'new_bill'
                        )}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            isPosRoute && posActiveTab === 'new_bill'
                              ? 'bg-[#1C1B18]'
                              : 'bg-[#9A948A]/50'
                          }`}
                        />
                        <span>New Bill</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleNavClick('/app/pos');
                          setPosActiveTab('bills');
                        }}
                        className={`w-full ${subNavItemClass(
                          isPosRoute && posActiveTab === 'bills'
                        )}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            isPosRoute && posActiveTab === 'bills'
                              ? 'bg-[#1C1B18]'
                              : 'bg-[#9A948A]/50'
                          }`}
                        />
                        <span>All Bills</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Customers with expandable sub items */}
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      handleNavClick('/app/customers');
                      setIsCustomersExpanded(true);
                    }}
                    className={`w-full justify-between ${navItemClass(isCustomersRoute)}`}
                  >
                    <div className="flex items-center gap-3">
                      <UserCheck size={18} strokeWidth={1.8} />
                      <span>Customers</span>
                    </div>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsCustomersExpanded((prev) => !prev);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsCustomersExpanded((prev) => !prev);
                        }
                      }}
                      className="p-1 -mr-1 rounded-md hover:bg-black/5 transition-colors cursor-pointer"
                      aria-label="Toggle Customers submenu"
                    >
                      {isCustomersExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                  </button>
                  {isCustomersExpanded && (
                    <div className="space-y-0.5 mt-1 mb-1">
                      <button
                        type="button"
                        onClick={() => {
                          handleNavClick('/app/customers');
                          setCustomersActiveTab('all');
                        }}
                        className={`w-full ${subNavItemClass(
                          isCustomersRoute && customersActiveTab === 'all'
                        )}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            isCustomersRoute && customersActiveTab === 'all'
                              ? 'bg-[#1C1B18]'
                              : 'bg-[#9A948A]/50'
                          }`}
                        />
                        <span>All Customers</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleNavClick('/app/customers');
                          setCustomersActiveTab('credit');
                        }}
                        className={`w-full ${subNavItemClass(
                          isCustomersRoute && customersActiveTab === 'credit'
                        )}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            isCustomersRoute && customersActiveTab === 'credit'
                              ? 'bg-[#1C1B18]'
                              : 'bg-[#9A948A]/50'
                          }`}
                        />
                        <span>Credit / Ledger</span>
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleNavClick('/app/reports')}
                  className={`w-full ${navItemClass(
                    activeRoute.startsWith('/app/reports') ||
                    activeRoute.startsWith('/reports')
                  )}`}
                >
                  <FileBarChart size={18} strokeWidth={1.8} />
                  <span>Reports</span>
                </button>

                <div className="pt-2 pb-1">
                  <div className="border-t border-[#EEE6DA] my-1" />
                </div>

                <button
                  type="button"
                  onClick={() => handleNavClick('/app/team')}
                  className={`w-full ${navItemClass(
                    activeRoute.startsWith('/app/team') ||
                    activeRoute.startsWith('/team') ||
                    activeRoute.startsWith('/app/users') ||
                    activeRoute.startsWith('/users')
                  )}`}
                >
                  <Users size={18} strokeWidth={1.8} />
                  <span>Team</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNavClick('/app/settings')}
                  className={`w-full ${navItemClass(
                    activeRoute.startsWith('/app/settings') ||
                    activeRoute.startsWith('/settings')
                  )}`}
                >
                  <Settings size={18} strokeWidth={1.8} />
                  <span>Settings</span>
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Bottom Business Switcher Chip & User Info */}
        <div className="shrink-0 p-3.5 border-t border-[#EEE6DA] space-y-2.5">
          <div
            role={isAdmin ? 'button' : undefined}
            tabIndex={isAdmin ? 0 : undefined}
            onClick={() => isAdmin && handleNavClick('/app/settings')}
            onKeyDown={(e) => {
              if (isAdmin && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                handleNavClick('/app/settings');
              }
            }}
            className={`bg-[#FAF6EF] ${
              isAdmin ? 'hover:bg-[#F4EDE2] cursor-pointer' : 'cursor-default'
            } transition-colors rounded-xl p-2.5 flex items-center justify-between border border-[#EEE6DA]/80 focus:outline-none`}
            title={isAdmin ? 'Business Settings' : (businessProfile?.name || 'My Business')}
          >
            <div className="min-w-0 pr-2">
              <div className="text-xs font-semibold text-[#1C1B18] truncate">
                {businessProfile?.name || 'My Business'}
              </div>
              <div className="text-[10.5px] text-[#6B665E] truncate capitalize">
                {businessProfile?.businessType || (isAdmin ? 'Admin Portal' : 'Sales Terminal')}
              </div>
            </div>
            <div className="w-2 h-2 rounded-full bg-[#7FAE82] shrink-0" title="Active" />
          </div>

          {/* User Row with Direct Sign Out */}
          <div className="flex items-center justify-between px-1 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-[#1C1B18] text-[#F4EDE2] text-[10px] font-bold flex items-center justify-center shrink-0">
                {currentUser?.avatarInitials || 'US'}
              </div>
              <span className="text-[#1C1B18] font-medium truncate text-[11.5px]">
                {currentUser?.name || (isAdmin ? 'Admin' : 'Salesperson')}
              </span>
            </div>
            <button
              type="button"
              onClick={async () => {
                onCloseMobile();
                await logout();
              }}
              className="p-1.5 rounded-lg text-[#9A948A] hover:text-[#DC2626] hover:bg-[#FAF6EF] transition-colors cursor-pointer"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
