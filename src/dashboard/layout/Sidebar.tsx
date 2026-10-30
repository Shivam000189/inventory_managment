import React, { useState } from 'react';
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
  ShieldAlert,
  Building2,
  Box,
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
  } = useApp();

  const [isCustomersExpanded, setIsCustomersExpanded] = useState(
    activeRoute.startsWith('/app/customers')
  );
  const [isPosExpanded, setIsPosExpanded] = useState(
    activeRoute.startsWith('/app/pos')
  );

  const isAdmin = currentUser.role === 'admin';

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
    `flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
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
          {/* Logo Mark + Wordmark (Click to visit Landing Page) */}
          <div
            onClick={() => handleNavClick('/')}
            className="h-16 shrink-0 flex items-center px-6 gap-2.5 border-b border-[#EEE6DA] cursor-pointer hover:bg-[#FAF6EF]/60 transition-colors"
            title="View Landing Page"
          >
            <div className="w-8 h-8 rounded-xl bg-[#1C1B18] text-white flex items-center justify-center shadow-xs">
              <Box size={18} strokeWidth={2.2} />
            </div>
            <span className="text-[19px] font-bold tracking-tight text-[#1C1B18]">
              Inventry
            </span>
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
                      activeRoute === '/app/pos' && posActiveTab === 'new_bill'
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
                      activeRoute === '/app/pos' && posActiveTab === 'bills'
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
                  className={`w-full ${navItemClass(activeRoute === '/app/overview')}`}
                >
                  <LayoutDashboard size={18} strokeWidth={1.8} />
                  <span>Overview</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNavClick('/app/products')}
                  className={`w-full ${navItemClass(activeRoute.startsWith('/app/products'))}`}
                >
                  <Package size={18} strokeWidth={1.8} />
                  <span>Products</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNavClick('/app/inventory')}
                  className={`w-full ${navItemClass(activeRoute.startsWith('/app/inventory'))}`}
                >
                  <Layers size={18} strokeWidth={1.8} />
                  <span>Inventory</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNavClick('/app/suppliers')}
                  className={`w-full ${navItemClass(activeRoute.startsWith('/app/suppliers'))}`}
                >
                  <Users size={18} strokeWidth={1.8} />
                  <span>Suppliers</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNavClick('/app/purchase-orders')}
                  className={`w-full ${navItemClass(activeRoute.startsWith('/app/purchase-orders'))}`}
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
                      setIsPosExpanded(!isPosExpanded);
                    }}
                    className={`w-full justify-between ${navItemClass(
                      activeRoute.startsWith('/app/pos')
                    )}`}
                  >
                    <div className="flex items-center gap-3">
                      <ShoppingCart size={18} strokeWidth={1.8} />
                      <span>POS & Sales</span>
                    </div>
                    {isPosExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
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
                          activeRoute === '/app/pos' && posActiveTab === 'new_bill'
                        )}`}
                      >
                        New Bill
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleNavClick('/app/pos');
                          setPosActiveTab('bills');
                        }}
                        className={`w-full ${subNavItemClass(
                          activeRoute === '/app/pos' && posActiveTab === 'bills'
                        )}`}
                      >
                        All Bills
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
                      setIsCustomersExpanded(!isCustomersExpanded);
                    }}
                    className={`w-full justify-between ${navItemClass(
                      activeRoute.startsWith('/app/customers')
                    )}`}
                  >
                    <div className="flex items-center gap-3">
                      <UserCheck size={18} strokeWidth={1.8} />
                      <span>Customers</span>
                    </div>
                    {isCustomersExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
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
                          activeRoute === '/app/customers' && customersActiveTab === 'all'
                        )}`}
                      >
                        All Customers
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleNavClick('/app/customers');
                          setCustomersActiveTab('credit');
                        }}
                        className={`w-full ${subNavItemClass(
                          activeRoute === '/app/customers' && customersActiveTab === 'credit'
                        )}`}
                      >
                        Credit / Ledger
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleNavClick('/app/reports')}
                  className={`w-full ${navItemClass(activeRoute.startsWith('/app/reports'))}`}
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
                  className={`w-full ${navItemClass(activeRoute.startsWith('/app/team'))}`}
                >
                  <Users size={18} strokeWidth={1.8} />
                  <span>Team</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNavClick('/app/settings')}
                  className={`w-full ${navItemClass(activeRoute.startsWith('/app/settings'))}`}
                >
                  <Settings size={18} strokeWidth={1.8} />
                  <span>Settings</span>
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Bottom Business Switcher Chip */}
        <div className="shrink-0 p-3.5 border-t border-[#EEE6DA]">
          <div className="bg-[#FAF6EF] rounded-xl p-2.5 flex items-center justify-between border border-[#EEE6DA]/80">
            <div className="min-w-0 pr-2">
              <div className="text-xs font-semibold text-[#1C1B18] truncate">
                {businessProfile.name}
              </div>
              <div className="text-[10.5px] text-[#6B665E] truncate">
                {businessProfile.businessType}
              </div>
            </div>
            <div className="w-2 h-2 rounded-full bg-[#7FAE82] shrink-0" />
          </div>
        </div>
      </aside>
    </>
  );
};
