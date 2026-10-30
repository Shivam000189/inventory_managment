import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import { Sidebar } from './layout/Sidebar';
import { Header } from './layout/Header';
import { CommandPalette } from './layout/CommandPalette';
import { NotificationDrawer } from './layout/NotificationDrawer';

// Pages
import { OverviewPage } from './pages/OverviewPage';
import { ProductsPage } from './pages/ProductsPage';
import { InventoryPage } from './pages/InventoryPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { PurchaseOrdersPage } from './pages/PurchaseOrdersPage';
import { PosSalesPage } from './pages/PosSalesPage';
import { CustomersPage } from './pages/CustomersPage';
import { ReportsPage } from './pages/ReportsPage';
import { TeamPage } from './pages/TeamPage';
import { SettingsPage } from './pages/SettingsPage';
import { ForbiddenPage } from './pages/ForbiddenPage';
import { NotFoundPage } from './pages/NotFoundPage';

interface DashboardLayoutProps {
  onLogout?: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = () => {
  const { activeRoute, currentUser } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isDefaultOverviewRoute =
    activeRoute === '/' ||
    activeRoute === '/dashboard' ||
    activeRoute === '/overview' ||
    activeRoute === '/app' ||
    activeRoute === '/app/overview';

  // Role Guard: Salesperson can access POS; back-office routes are restricted
  const isSalespersonBlocked =
    currentUser.role === 'salesperson' &&
    !activeRoute.startsWith('/pos') &&
    !activeRoute.startsWith('/app/pos') &&
    !isDefaultOverviewRoute;

  const renderCurrentPage = () => {
    if (isSalespersonBlocked) {
      return <ForbiddenPage />;
    }

    const path = activeRoute;
    if (isDefaultOverviewRoute) {
      if (currentUser.role === 'salesperson') {
        return <PosSalesPage />;
      }
      return <OverviewPage />;
    }
    if (
      path.startsWith('/products') ||
      path.startsWith('/app/products') ||
      path.startsWith('/medicines')
    ) {
      return <ProductsPage />;
    }
    if (
      path.startsWith('/inventory') ||
      path.startsWith('/app/inventory') ||
      path.startsWith('/stock') ||
      path.startsWith('/categories')
    ) {
      return <InventoryPage />;
    }
    if (path.startsWith('/suppliers') || path.startsWith('/app/suppliers')) {
      return <SuppliersPage />;
    }
    if (
      path.startsWith('/purchase-orders') ||
      path.startsWith('/purchases') ||
      path.startsWith('/receiving') ||
      path.startsWith('/app/purchase-orders')
    ) {
      return <PurchaseOrdersPage />;
    }
    if (
      path.startsWith('/pos') ||
      path.startsWith('/app/pos') ||
      path.startsWith('/sales') ||
      path.startsWith('/bills')
    ) {
      return <PosSalesPage />;
    }
    if (path.startsWith('/customers') || path.startsWith('/app/customers')) {
      return <CustomersPage />;
    }
    if (path.startsWith('/reports') || path.startsWith('/app/reports')) {
      return <ReportsPage />;
    }
    if (
      path.startsWith('/team') ||
      path.startsWith('/users') ||
      path.startsWith('/app/team')
    ) {
      return <TeamPage />;
    }
    if (path.startsWith('/settings') || path.startsWith('/app/settings')) {
      return <SettingsPage />;
    }

    return <NotFoundPage />;
  };

  return (
    <div className="h-screen w-full flex flex-row overflow-hidden bg-[#FAF8F5] antialiased selection:bg-[#E6F1E6]">
      {/* Left Sidebar */}
      <Sidebar
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Right Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-white">
        <Header onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />

        <main className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#FAF8F5]">
          <div className="w-full max-w-[1600px] mx-auto">
            {renderCurrentPage()}
          </div>
        </main>
      </div>

      {/* Global Overlays */}
      <CommandPalette />
      <NotificationDrawer />
    </div>
  );
};

export default DashboardLayout;

