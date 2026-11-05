import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  LayoutGrid,
  Layers,
  ShoppingBag,
  Receipt,
  TrendingUp,
  Zap,
  CircleDot,
  Settings2,
  ChevronDown,
  ChevronUp,
  X,
  LogOut,
  ShoppingCart,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { isPharmacyBusiness } from '../../shared/industryConfig';

interface SidebarProps {
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

interface NavSubItem {
  label: string;
  path: string;
  matchPaths?: string[];
  tabKey?: string;
  tabSetter?: 'pos' | 'customers';
}

interface NavSection {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  items: NavSubItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpenMobile, onCloseMobile }) => {
  const {
    activeRoute,
    navigate,
    currentUser,
    businessProfile,
    posActiveTab,
    setPosActiveTab,
    logout,
  } = useApp();

  const isAdmin = currentUser?.role === 'admin' || (currentUser?.role as any) === 'owner';

  const isOverviewActive =
    activeRoute === '/' ||
    activeRoute === '/app' ||
    activeRoute === '/' ||
    activeRoute === '/overview' ||
    activeRoute === '/overview' ||
    activeRoute === '/dashboard';

  const handleNavClick = (path: string) => {
    navigate(path);
    onCloseMobile();
  };

  // Normalize industry / business type
  const normalizeIndustry = (profile: any): string => {
    if (!profile) return 'other';
    const val = String(profile.industry || profile.businessType || profile.name || '').trim().toLowerCase();
    if (val.includes('pharma') || val.includes('pharam') || val.includes('medic') || val.includes('chemist') || val.includes('drug') || val.includes('health')) {
      return 'pharmacy';
    }
    if (val.includes('cloth') || val.includes('apparel') || val.includes('garment') || val.includes('fashion') || val.includes('textile')) {
      return 'clothing';
    }
    if (val.includes('electr') || val.includes('gadget') || val.includes('mobile') || val.includes('tech')) {
      return 'electronics';
    }
    if (val.includes('groc') || val.includes('supermarket') || val.includes('food') || val.includes('kirana') || val.includes('beverage')) {
      return 'grocery';
    }
    if (val.includes('hardw') || val.includes('tools') || val.includes('sanitary') || val.includes('paint')) {
      return 'hardware';
    }
    if (val.includes('auto') || val.includes('motor') || val.includes('vehicle') || val.includes('car')) {
      return 'automotive';
    }
    if (val.includes('manufactur') || val.includes('factory') || val.includes('product')) {
      return 'manufacturing';
    }
    if (val.includes('whole') || val.includes('distribut') || val.includes('b2b')) {
      return 'wholesale';
    }
    return val || 'other';
  };

  const isPharmacy = isPharmacyBusiness(businessProfile);
  const normalizedIndustry = isPharmacy ? 'pharmacy' : normalizeIndustry(businessProfile);
  const productLabel = isPharmacy ? 'Medicines' : 'Products';

  const industrySectionData = useMemo(() => {
    switch (normalizedIndustry) {
      case 'pharmacy':
        return {
          label: 'PHARMACY',
          items: [
            {
              label: 'Batch Management',
              path: '/batches',
              matchPaths: ['/batches', '/batches'],
            },
            {
              label: 'Expiry Tracking',
              path: '/expiry',
              matchPaths: ['/expiry', '/expiry'],
            },
            {
              label: 'Prescription Management',
              path: '/prescriptions',
              matchPaths: ['/prescriptions', '/prescriptions'],
            },
          ],
        };
      case 'clothing':
        return {
          label: 'CLOTHING & APPAREL',
          items: [
            {
              label: 'Size Management',
              path: '/sizes',
              matchPaths: ['/sizes', '/sizes'],
            },
            {
              label: 'Color Management',
              path: '/colors',
              matchPaths: ['/colors', '/colors'],
            },
            {
              label: 'Product Variants',
              path: '/variants',
              matchPaths: ['/variants', '/variants'],
            },
            {
              label: 'Variant Grid',
              path: '/variant-grid',
              matchPaths: ['/variant-grid', '/variant-grid'],
            },
            {
              label: 'Replenishment',
              path: '/replenishment',
              matchPaths: ['/replenishment', '/replenishment'],
            },
            {
              label: 'Promotions',
              path: '/promotions',
              matchPaths: ['/promotions', '/promotions'],
            },
          ],
        };
      case 'electronics':
        return {
          label: 'ELECTRONICS',
          items: [
            {
              label: 'Serial Numbers',
              path: '/serial-numbers',
              matchPaths: ['/serial-numbers', '/serial-numbers'],
            },
            {
              label: 'Warranty Tracking',
              path: '/warranties',
              matchPaths: ['/warranties', '/warranties'],
            },
            {
              label: 'Product Variants',
              path: '/variants',
              matchPaths: ['/variants', '/variants'],
            },
          ],
        };
      case 'grocery':
        return {
          label: 'GROCERY & SUPERMARKET',
          items: [
            {
              label: 'Expiry Tracking',
              path: '/expiry',
              matchPaths: ['/expiry', '/expiry'],
            },
            {
              label: 'Offers / Discounts',
              path: '/offers',
              matchPaths: ['/offers', '/offers'],
            },
            {
              label: 'Batch Management',
              path: '/batches',
              matchPaths: ['/batches', '/batches'],
            },
          ],
        };
      case 'wholesale':
        return {
          label: 'WHOLESALE & B2B',
          items: [
            {
              label: 'Bulk Orders',
              path: '/bulk-orders',
              matchPaths: ['/bulk-orders', '/bulk-orders'],
            },
            {
              label: 'Bulk Pricing',
              path: '/bulk-pricing',
              matchPaths: ['/bulk-pricing', '/bulk-pricing'],
            },
            {
              label: 'Credit Sales',
              path: '/credit-sales',
              matchPaths: ['/credit-sales', '/credit-sales'],
            },
          ],
        };
      case 'manufacturing':
        return {
          label: 'MANUFACTURING',
          items: [
            {
              label: 'Raw Materials',
              path: '/raw-materials',
              matchPaths: ['/raw-materials', '/raw-materials'],
            },
            {
              label: 'Bill of Materials',
              path: '/bill-of-materials',
              matchPaths: ['/bill-of-materials', '/bill-of-materials'],
            },
            {
              label: 'Production',
              path: '/production',
              matchPaths: ['/production', '/production'],
            },
            {
              label: 'Finished Goods',
              path: '/finished-goods',
              matchPaths: ['/finished-goods', '/finished-goods'],
            },
            {
              label: 'Production Tracking',
              path: '/production-tracking',
              matchPaths: ['/production-tracking', '/production-tracking'],
            },
          ],
        };
      default:
        return {
          label: 'INDUSTRY',
          items: [
            {
              label: 'Product Variants',
              path: '/variants',
              matchPaths: ['/variants', '/variants'],
            },
            {
              label: 'Bulk Pricing',
              path: '/bulk-pricing',
              matchPaths: ['/bulk-pricing', '/bulk-pricing'],
            },
          ],
        };
    }
  }, [normalizedIndustry]);

  const sections: NavSection[] = useMemo(
    () => [
      {
        id: 'inventory',
        label: 'INVENTORY',
        icon: Layers,
        items: [
          {
            label: productLabel,
            path: '/products',
            matchPaths: ['/products', '/products', '/medicines', '/medicines'],
          },
          {
            label: 'Stock Ledger',
            path: '/inventory',
            matchPaths: ['/inventory', '/inventory', '/stock', '/stock'],
          },
          {
            label: 'Stock Inward',
            path: '/stock-in',
            matchPaths: ['/stock-in', '/stock-in'],
          },
          {
            label: 'Stock Outward',
            path: '/stock-out',
            matchPaths: ['/stock-out', '/stock-out'],
          },
          {
            label: 'Inventory Adjustments',
            path: '/adjustments',
            matchPaths: ['/adjustments', '/adjustments'],
          },
          {
            label: 'Stock Movement Audit',
            path: '/stock-history',
            matchPaths: ['/stock-history', '/stock-history'],
          },
        ],
      },
      {
        id: 'purchases',
        label: 'PURCHASES',
        icon: ShoppingBag,
        items: [
          {
            label: 'Purchase Orders',
            path: '/purchase-orders',
            matchPaths: ['/purchase-orders', '/purchase-orders', '/purchases', '/purchases'],
          },
          {
            label: 'Suppliers',
            path: '/suppliers',
            matchPaths: ['/suppliers', '/suppliers'],
          },
        ],
      },
      {
        id: 'sales',
        label: 'ORDERS / SALES',
        icon: Receipt,
        items: [
          {
            label: 'Orders',
            path: '/orders',
            matchPaths: ['/orders', '/orders', '/bulk-orders', '/bulk-orders', '/credit-sales', '/credit-sales'],
          },
          {
            label: 'Returns',
            path: '/returns',
            matchPaths: ['/returns', '/returns', '/purchase-returns', '/purchase-returns'],
          },
          {
            label: 'Customers',
            path: '/customers',
            matchPaths: ['/customers', '/customers'],
          },
          {
            label: 'Payments',
            path: '/payments',
            matchPaths: ['/payments', '/payments'],
          },
          {
            label: 'POS Terminal',
            path: '/pos',
            matchPaths: ['/pos', '/pos', '/sales', '/sales', '/bills', '/bills'],
          },
        ],
      },
      {
        id: 'industry',
        label: industrySectionData.label,
        icon: Settings2,
        items: industrySectionData.items,
      },
      {
        id: 'reports',
        label: 'REPORTS',
        icon: TrendingUp,
        items: [
          {
            label: 'Reports',
            path: '/reports',
            matchPaths: ['/reports', '/reports', '/clothing-reports', '/clothing-reports'],
          },
        ],
      },
      {
        id: 'users',
        label: 'USERS',
        icon: Zap,
        items: [
          {
            label: 'Users',
            path: '/team',
            matchPaths: ['/team', '/team', '/users', '/users'],
          },
          {
            label: 'Roles',
            path: '/roles',
            matchPaths: ['/roles', '/roles'],
          },
        ],
      },
      {
        id: 'business',
        label: 'BUSINESS',
        icon: CircleDot,
        items: [
          {
            label: 'Business Profile',
            path: '/settings',
            matchPaths: ['/business-profile'],
          },
          {
            label: 'Settings',
            path: '/settings',
            matchPaths: ['/settings', '/settings'],
          },
        ],
      },
    ],
    [productLabel, industrySectionData]
  );

  // When coming in the first time, all 7 expandable sections are closed
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    inventory: false,
    purchases: false,
    sales: false,
    industry: false,
    reports: false,
    users: false,
    business: false,
  });

  const isItemActive = (item: NavSubItem) => {
    if (activeRoute === item.path) return true;
    if (item.matchPaths?.some((p) => activeRoute === p || activeRoute.startsWith(`${p}/`))) {
      return true;
    }
    return false;
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  // Automatically expand the sidebar section when visiting any of its pages
  useEffect(() => {
    const activeSection = sections.find((section) =>
      section.items.some((item) => isItemActive(item))
    );

    if (activeSection) {
      setExpandedSections((prev) => {
        if (prev[activeSection.id]) return prev;
        return {
          ...prev,
          [activeSection.id]: true,
        };
      });
    }
  }, [activeRoute, sections]);

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
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 min-w-64 max-w-64 h-screen lg:h-full bg-white border-r border-[#EEE6DA] flex flex-col justify-between transition-transform duration-200 ease-out lg:translate-x-0 ${isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
          } shrink-0`}
      >
        <div className="flex-1 min-h-0 flex flex-col">
          {/* Logo Mark + Wordmark (Original Brand) */}
          <div className="h-16 shrink-0 flex items-center justify-between px-5 border-b border-[#EEE6DA]">
            <div
              role="button"
              tabIndex={0}
              onClick={() => handleNavClick(isAdmin ? '/overview' : '/pos')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleNavClick(isAdmin ? '/overview' : '/pos');
                }
              }}
              className="flex items-center gap-2.5 cursor-pointer hover:opacity-85 transition-opacity min-w-0 focus:outline-none"
              title={businessProfile?.name || 'Inventory'}
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

          {/* Navigation Links Scrollable Area */}
          <nav className="flex-1 min-h-0 px-3 py-3 space-y-1.5 overflow-y-auto">
            {!isAdmin ? (
              /* Salesperson Mode */
              <div className="space-y-1">
                <div className="px-3 py-1 text-[11px] font-semibold text-[#9A948A] uppercase tracking-wider">
                  Sales Terminal
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleNavClick('/pos');
                    setPosActiveTab('new_bill');
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all cursor-pointer ${activeRoute.startsWith('/pos') && posActiveTab === 'new_bill'
                      ? 'bg-[#F4EDE2] text-[#1C1B18] font-bold shadow-2xs'
                      : 'text-[#5A544A] hover:bg-[#FAF6EF] hover:text-[#1C1B18]'
                    }`}
                >
                  <ShoppingCart size={17} strokeWidth={1.8} className="text-[#8C6D4F]" />
                  <span>New Bill</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleNavClick('/pos');
                    setPosActiveTab('bills');
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all cursor-pointer ${activeRoute.startsWith('/pos') && posActiveTab === 'bills'
                      ? 'bg-[#F4EDE2] text-[#1C1B18] font-bold shadow-2xs'
                      : 'text-[#5A544A] hover:bg-[#FAF6EF] hover:text-[#1C1B18]'
                    }`}
                >
                  <Receipt size={17} strokeWidth={1.8} className="text-[#8C6D4F]" />
                  <span>My Bills</span>
                </button>
              </div>
            ) : (
              /* Enterprise Admin Accordion Menu */
              <>
                {/* 1. Dashboard Overview */}
                <button
                  type="button"
                  onClick={() => handleNavClick('/overview')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] transition-all cursor-pointer ${isOverviewActive
                      ? 'bg-[#F4EDE2] text-[#1C1B18] font-bold shadow-2xs'
                      : 'text-[#5A544A] hover:bg-[#FAF6EF] hover:text-[#1C1B18] font-medium'
                    }`}
                >
                  <LayoutGrid size={17} strokeWidth={2} className="shrink-0 text-[#8C6D4F]" />
                  <span>Dashboard Overview</span>
                </button>

                {/* 2-8. Accordion Groups */}
                {sections.map((section) => {
                  const Icon = section.icon;
                  const isExpanded = Boolean(expandedSections[section.id]);
                  const hasActiveChild = section.items.some((it) => isItemActive(it));

                  return (
                    <div key={section.id} className="pt-0.5">
                      {/* Section Accordion Header */}
                      <button
                        type="button"
                        onClick={() => toggleSection(section.id)}
                        className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-[11.5px] font-bold tracking-wider uppercase transition-colors cursor-pointer ${hasActiveChild
                            ? 'text-[#1C1B18] bg-[#FAF6EF]/70'
                            : 'text-[#5A544A] hover:text-[#1C1B18] hover:bg-[#FAF6EF]/50'
                          }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon size={16} strokeWidth={2} className="shrink-0 text-[#8C6D4F]" />
                          <span className="truncate">{section.label}</span>
                        </div>
                        <span className="text-[#8C8479] shrink-0">
                          {isExpanded ? (
                            <ChevronUp size={14} strokeWidth={2.5} />
                          ) : (
                            <ChevronDown size={14} strokeWidth={2.5} />
                          )}
                        </span>
                      </button>

                      {/* Section Sub-items with Smooth UI Motion */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden space-y-0.5 pt-0.5 pb-1 will-change-transform"
                          >
                            {section.items.map((subItem) => {
                              const isSubActive = isItemActive(subItem);

                              return (
                                <button
                                  key={subItem.label}
                                  type="button"
                                  onClick={() => handleNavClick(subItem.path)}
                                  className={`w-full text-left pl-9 pr-3 py-2 rounded-xl text-[13px] transition-all cursor-pointer ${isSubActive
                                      ? 'bg-[#F4EDE2] text-[#1C1B18] font-bold shadow-2xs'
                                      : 'text-[#6B6357] hover:text-[#1C1B18] hover:bg-[#FAF6EF] font-medium'
                                    }`}
                                >
                                  {subItem.label}
                                </button>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </>
            )}
          </nav>
        </div>

        {/* Bottom Business Switcher Chip & User Info */}
        <div className="shrink-0 p-3.5 border-t border-[#EEE6DA] space-y-2.5">
          <div
            role={isAdmin ? 'button' : undefined}
            tabIndex={isAdmin ? 0 : undefined}
            onClick={() => isAdmin && handleNavClick('/settings')}
            onKeyDown={(e) => {
              if (isAdmin && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                handleNavClick('/settings');
              }
            }}
            className={`bg-[#FAF6EF] ${isAdmin ? 'hover:bg-[#F4EDE2] cursor-pointer' : 'cursor-default'
              } transition-colors rounded-xl p-2.5 flex items-center justify-between border border-[#EEE6DA]/80 focus:outline-none`}
            title={isAdmin ? 'Business Settings' : businessProfile?.name || 'My Business'}
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
