/* oxlint-disable react/only-export-components */
import { lazy, Suspense } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useApp } from '../dashboard/context/AppContext.tsx';
import { TablePageSkeleton } from '../components/ui/Feedback.tsx';

// Core Dashboard Pages (Active TypeScript Implementations - Lazy Loaded for Fast First Paint)
const OverviewPage = lazy(() => import('../dashboard/pages/OverviewPage.tsx').then((m) => ({ default: m.OverviewPage })));
const ProductsPage = lazy(() => import('../dashboard/pages/ProductsPage.tsx').then((m) => ({ default: m.ProductsPage })));
const InventoryPage = lazy(() => import('../dashboard/pages/InventoryPage.tsx').then((m) => ({ default: m.InventoryPage })));
const SuppliersPage = lazy(() => import('../dashboard/pages/SuppliersPage.tsx').then((m) => ({ default: m.SuppliersPage })));
const PurchaseOrdersPage = lazy(() => import('../dashboard/pages/PurchaseOrdersPage.tsx').then((m) => ({ default: m.PurchaseOrdersPage })));
const PosSalesPage = lazy(() => import('../dashboard/pages/PosSalesPage.tsx').then((m) => ({ default: m.PosSalesPage })));
const CustomersPage = lazy(() => import('../dashboard/pages/CustomersPage.tsx').then((m) => ({ default: m.CustomersPage })));
const ReportsPage = lazy(() => import('../dashboard/pages/ReportsPage.tsx').then((m) => ({ default: m.ReportsPage })));
const TeamPage = lazy(() => import('../dashboard/pages/TeamPage.tsx').then((m) => ({ default: m.TeamPage })));
const SettingsPage = lazy(() => import('../dashboard/pages/SettingsPage.tsx').then((m) => ({ default: m.SettingsPage })));
const ForbiddenPage = lazy(() => import('../dashboard/pages/ForbiddenPage.tsx').then((m) => ({ default: m.ForbiddenPage })));
const NotFoundPage = lazy(() => import('../dashboard/pages/NotFoundPage.tsx').then((m) => ({ default: m.NotFoundPage })));
const BatchManagementPage = lazy(() => import('../dashboard/pages/BatchManagementPage.tsx').then((m) => ({ default: m.BatchManagementPage })));
const ExpiryTrackingPage = lazy(() => import('../dashboard/pages/ExpiryTrackingPage.tsx').then((m) => ({ default: m.ExpiryTrackingPage })));
const PrescriptionManagementPage = lazy(() => import('../dashboard/pages/PrescriptionManagementPage.tsx').then((m) => ({ default: m.PrescriptionManagementPage })));

// Feature Pages (Workflows)
const ReceivingGrnPage = lazy(() => import('../features/purchasing/ReceivingGrnPage.jsx'));
const InventoryOperations = lazy(() => import('../features/inventory/InventoryOperations.jsx'));
const ProductImportPage = lazy(() => import('../features/product-import/ProductImportPage.jsx'));
const SalesOrdersPage = lazy(() => import('../features/sales/SalesOrdersPage.jsx'));
const PaymentsPage = lazy(() => import('../features/payments/PaymentsPage.jsx'));
const ReturnsPage = lazy(() => import('../features/returns/ReturnsPage.jsx'));
const UserManagementPage = lazy(() => import('../features/team/UserManagementPage.jsx'));
const ColorManagementPage = lazy(() => import('../features/industries/clothing/ColorManagementPage.jsx'));
const ClothingModule = lazy(() => import('../features/industries/clothing/ClothingModule.jsx'));
const IndustryModule = lazy(() => import('../features/industries/generic/IndustryModule.jsx'));
const BulkPricingPage = lazy(() => import('../features/industries/wholesale/BulkPricingPage.jsx'));

const LazyNotFoundPage = (props) => (
  <Suspense fallback={<TablePageSkeleton className="p-6" />}>
    <NotFoundPage {...props} />
  </Suspense>
);
const LazyForbiddenPage = (props) => (
  <Suspense fallback={<TablePageSkeleton className="p-6" />}>
    <ForbiddenPage {...props} />
  </Suspense>
);
export { LazyNotFoundPage as NotFoundPage, LazyForbiddenPage as ForbiddenPage };

export const NAV_LABEL_MAP = {
  Overview: '/overview',
  Products: '/products',
  Medicines: '/products',
  Inventory: '/inventory',
  Stock: '/inventory',
  Suppliers: '/suppliers',
  'Purchase Orders': '/purchase-orders',
  Purchases: '/purchase-orders',
  Receiving: '/receiving',
  'POS / Billing': '/pos',
  POS: '/pos',
  Sales: '/pos',
  Bills: '/pos',
  Orders: '/orders',
  Customers: '/customers',
  Payments: '/payments',
  Returns: '/returns',
  'Purchase Returns': '/purchase-returns',
  Team: '/team',
  Users: '/team',
  Roles: '/roles',
  Permissions: '/permissions',
  Reports: '/reports',
  Settings: '/settings',
  'Business Profile': '/settings',
  Industry: '/settings',
  'Color Management': '/colors',
  'Size Management': '/sizes',
  'Product Variants': '/variants',
  'Batch Management': '/batches',
  'Expiry Tracking': '/expiry',
  'Prescription Management': '/prescriptions',
  'Serial Numbers': '/serial-numbers',
  'Warranty Tracking': '/warranties',
  'Offers / Discounts': '/offers',
  'Bulk Orders': '/bulk-orders',
  'Credit Sales': '/credit-sales',
  'Bulk Pricing': '/bulk-pricing',
  'Variant Grid': '/variant-grid',
  Replenishment: '/replenishment',
  Promotions: '/promotions',
  Loyalty: '/loyalty',
  Coupons: '/coupons',
  'Gift Cards': '/gift-cards',
  'Cashier Shifts': '/cashier-shifts',
  'Clothing Reports': '/clothing-reports',
  'Raw Materials': '/raw-materials',
  'Bill of Materials': '/bill-of-materials',
  Production: '/production',
  'Finished Goods': '/finished-goods',
  'Production Tracking': '/production-tracking',
  'Stock In': '/stock-in',
  'Stock Out': '/stock-out',
  Adjustments: '/adjustments',
  'Stock History': '/stock-history',
  Categories: '/categories',
  'Product Import': '/product-import',
};

export function pathForNavLabel(label) {
  if (!label) return '/overview';
  if (NAV_LABEL_MAP[label]) return NAV_LABEL_MAP[label];
  if (label.startsWith('/')) return label;
  return '/overview';
}

export function shellClassFor(_routeOrLabel) {
  return '';
}

export function navLabelForPath(pathname, productLabel = 'Products') {
  if (pathname === '/' || pathname === '/overview' || pathname === '/overview') return 'Overview';
  if (pathname === '/products' || pathname === '/products' || pathname === '/medicines') return productLabel;
  const entry = Object.entries(NAV_LABEL_MAP).find(([, targetPath]) => targetPath === pathname);
  return entry ? entry[0] : '';
}

export function AdminRouteGuard({ children }) {
  const { currentUser } = useApp();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'owner';
  if (!isAdmin) {
    return (
      <Suspense fallback={<TablePageSkeleton className="p-6" />}>
        <ForbiddenPage />
      </Suspense>
    );
  }
  return <>{children}</>;
}

export function OverviewRoute() {
  const { currentUser } = useApp();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'owner';
  if (!isAdmin) {
    return (
      <Suspense fallback={<TablePageSkeleton className="p-6" />}>
        <PosSalesPage />
      </Suspense>
    );
  }
  return (
    <Suspense fallback={<TablePageSkeleton className="p-6" />}>
      <OverviewPage />
    </Suspense>
  );
}

function LazyRoute({ Component }) {
  return (
    <Suspense fallback={<TablePageSkeleton className="p-6" />}>
      <Component />
    </Suspense>
  );
}

export function FeaturePageWrapper({ Component, ...extraProps }) {
  const { businessProfile, currentUser } = useApp();
  const navigate = useNavigate();

  return (
    <Suspense fallback={<TablePageSkeleton className="p-6" />}>
      <Component
        business={businessProfile}
        account={currentUser}
        {...extraProps}
        onNavigate={(dest) => {
          if (typeof dest === 'string') {
            navigate(pathForNavLabel(dest));
          }
        }}
        navigateTo={(dest) => {
          if (typeof dest === 'string') {
            navigate(pathForNavLabel(dest));
          }
        }}
        canNavigate={() => true}
        onClose={() => navigate('/products')}
        onImportSuccess={() => navigate('/products')}
      />
    </Suspense>
  );
}

export const DASHBOARD_CHILD_ROUTES = [
  // Overview
  { path: '', element: <OverviewRoute /> },
  { path: 'overview', element: <OverviewRoute /> },

  // Core Dashboard Pages (Active TS implementations - Lazily loaded)
  { path: 'products', element: <AdminRouteGuard><LazyRoute Component={ProductsPage} /></AdminRouteGuard> },
  { path: 'inventory', element: <AdminRouteGuard><LazyRoute Component={InventoryPage} /></AdminRouteGuard> },
  { path: 'suppliers', element: <AdminRouteGuard><LazyRoute Component={SuppliersPage} /></AdminRouteGuard> },
  { path: 'purchase-orders', element: <AdminRouteGuard><LazyRoute Component={PurchaseOrdersPage} /></AdminRouteGuard> },
  { path: 'pos', element: <LazyRoute Component={PosSalesPage} /> },
  { path: 'customers', element: <AdminRouteGuard><LazyRoute Component={CustomersPage} /></AdminRouteGuard> },
  { path: 'reports', element: <AdminRouteGuard><LazyRoute Component={ReportsPage} /></AdminRouteGuard> },
  { path: 'team', element: <AdminRouteGuard><LazyRoute Component={TeamPage} /></AdminRouteGuard> },
  { path: 'settings', element: <AdminRouteGuard><LazyRoute Component={SettingsPage} /></AdminRouteGuard> },

  // Feature Workflows (Richer implementations)
  { path: 'receiving', element: <AdminRouteGuard><FeaturePageWrapper Component={ReceivingGrnPage} /></AdminRouteGuard> },
  { path: 'stock-in', element: <AdminRouteGuard><FeaturePageWrapper Component={InventoryOperations} section="Stock In" /></AdminRouteGuard> },
  { path: 'stock-out', element: <AdminRouteGuard><FeaturePageWrapper Component={InventoryOperations} section="Stock Out" /></AdminRouteGuard> },
  { path: 'adjustments', element: <AdminRouteGuard><FeaturePageWrapper Component={InventoryOperations} section="Adjustments" /></AdminRouteGuard> },
  { path: 'stock-history', element: <AdminRouteGuard><FeaturePageWrapper Component={InventoryOperations} section="Stock History" /></AdminRouteGuard> },
  { path: 'categories', element: <AdminRouteGuard><FeaturePageWrapper Component={InventoryOperations} section="Categories" /></AdminRouteGuard> },
  { path: 'product-import', element: <AdminRouteGuard><FeaturePageWrapper Component={ProductImportPage} /></AdminRouteGuard> },
  { path: 'orders', element: <AdminRouteGuard><FeaturePageWrapper Component={SalesOrdersPage} section="Orders" creditSales={false} /></AdminRouteGuard> },
  { path: 'bulk-orders', element: <AdminRouteGuard><FeaturePageWrapper Component={SalesOrdersPage} section="Bulk Orders" creditSales={false} /></AdminRouteGuard> },
  { path: 'credit-sales', element: <AdminRouteGuard><FeaturePageWrapper Component={SalesOrdersPage} section="Credit Sales" creditSales={true} /></AdminRouteGuard> },
  { path: 'payments', element: <AdminRouteGuard><FeaturePageWrapper Component={PaymentsPage} /></AdminRouteGuard> },
  { path: 'returns', element: <AdminRouteGuard><FeaturePageWrapper Component={ReturnsPage} purchase={false} /></AdminRouteGuard> },
  { path: 'purchase-returns', element: <AdminRouteGuard><FeaturePageWrapper Component={ReturnsPage} purchase={true} /></AdminRouteGuard> },
  { path: 'roles', element: <AdminRouteGuard><FeaturePageWrapper Component={UserManagementPage} section="Roles" /></AdminRouteGuard> },
  { path: 'permissions', element: <AdminRouteGuard><FeaturePageWrapper Component={UserManagementPage} section="Permissions" /></AdminRouteGuard> },
  { path: 'colors', element: <AdminRouteGuard><FeaturePageWrapper Component={ColorManagementPage} /></AdminRouteGuard> },
  { path: 'sizes', element: <AdminRouteGuard><FeaturePageWrapper Component={IndustryModule} section="Size Management" /></AdminRouteGuard> },
  { path: 'variants', element: <AdminRouteGuard><FeaturePageWrapper Component={IndustryModule} section="Product Variants" /></AdminRouteGuard> },
  { path: 'batches', element: <AdminRouteGuard><LazyRoute Component={BatchManagementPage} /></AdminRouteGuard> },
  { path: 'expiry', element: <AdminRouteGuard><LazyRoute Component={ExpiryTrackingPage} /></AdminRouteGuard> },
  { path: 'prescriptions', element: <AdminRouteGuard><LazyRoute Component={PrescriptionManagementPage} /></AdminRouteGuard> },
  { path: 'serial-numbers', element: <AdminRouteGuard><FeaturePageWrapper Component={IndustryModule} section="Serial Numbers" /></AdminRouteGuard> },
  { path: 'warranties', element: <AdminRouteGuard><FeaturePageWrapper Component={IndustryModule} section="Warranty Tracking" /></AdminRouteGuard> },
  { path: 'offers', element: <AdminRouteGuard><FeaturePageWrapper Component={IndustryModule} section="Offers / Discounts" /></AdminRouteGuard> },
  { path: 'bulk-pricing', element: <AdminRouteGuard><FeaturePageWrapper Component={BulkPricingPage} /></AdminRouteGuard> },
  { path: 'variant-grid', element: <AdminRouteGuard><FeaturePageWrapper Component={ClothingModule} section="Variant Grid" /></AdminRouteGuard> },
  { path: 'replenishment', element: <AdminRouteGuard><FeaturePageWrapper Component={ClothingModule} section="Replenishment" /></AdminRouteGuard> },
  { path: 'promotions', element: <AdminRouteGuard><FeaturePageWrapper Component={ClothingModule} section="Promotions" /></AdminRouteGuard> },
  { path: 'loyalty', element: <AdminRouteGuard><FeaturePageWrapper Component={ClothingModule} section="Loyalty" /></AdminRouteGuard> },
  { path: 'coupons', element: <AdminRouteGuard><FeaturePageWrapper Component={ClothingModule} section="Coupons" /></AdminRouteGuard> },
  { path: 'gift-cards', element: <AdminRouteGuard><FeaturePageWrapper Component={ClothingModule} section="Gift Cards" /></AdminRouteGuard> },
  { path: 'cashier-shifts', element: <AdminRouteGuard><FeaturePageWrapper Component={ClothingModule} section="Cashier Shifts" /></AdminRouteGuard> },
  { path: 'clothing-reports', element: <AdminRouteGuard><FeaturePageWrapper Component={ClothingModule} section="Clothing Reports" /></AdminRouteGuard> },
  { path: 'raw-materials', element: <AdminRouteGuard><FeaturePageWrapper Component={IndustryModule} section="Raw Materials" /></AdminRouteGuard> },
  { path: 'bill-of-materials', element: <AdminRouteGuard><FeaturePageWrapper Component={IndustryModule} section="Bill of Materials" /></AdminRouteGuard> },
  { path: 'production', element: <AdminRouteGuard><FeaturePageWrapper Component={IndustryModule} section="Production" /></AdminRouteGuard> },
  { path: 'finished-goods', element: <AdminRouteGuard><FeaturePageWrapper Component={IndustryModule} section="Finished Goods" /></AdminRouteGuard> },
  { path: 'production-tracking', element: <AdminRouteGuard><FeaturePageWrapper Component={IndustryModule} section="Production Tracking" /></AdminRouteGuard> },

  // In-app Aliases & Redirects
  { path: 'medicines', element: <Navigate to="/products" replace /> },
  { path: 'stock', element: <Navigate to="/inventory" replace /> },
  { path: 'purchases', element: <Navigate to="/purchase-orders" replace /> },
  { path: 'sales', element: <Navigate to="/pos" replace /> },
  { path: 'bills', element: <Navigate to="/pos" replace /> },
  { path: 'users', element: <Navigate to="/team" replace /> },
  { path: 'business-profile', element: <Navigate to="/settings" replace /> },
  { path: 'industry', element: <Navigate to="/settings" replace /> },
  { path: 'bulk-import', element: <Navigate to="/product-import" replace /> },

  // Status & Fallback
  { path: 'forbidden', element: <LazyRoute Component={ForbiddenPage} /> },
  { path: '*', element: <LazyRoute Component={NotFoundPage} /> },
];

export const TOP_LEVEL_REDIRECTS = [
  'overview',
  'dashboard',
  'products',
  'medicines',
  'inventory',
  'stock',
  'suppliers',
  'purchase-orders',
  'purchases',
  'pos',
  'sales',
  'bills',
  'customers',
  'reports',
  'team',
  'users',
  'settings',
  'business-profile',
  'industry',
  'receiving',
  'stock-in',
  'stock-out',
  'adjustments',
  'stock-history',
  'categories',
  'product-import',
  'bulk-import',
  'orders',
  'bulk-orders',
  'credit-sales',
  'payments',
  'returns',
  'purchase-returns',
  'roles',
  'permissions',
  'colors',
  'sizes',
  'variants',
  'batches',
  'expiry',
  'prescriptions',
  'serial-numbers',
  'warranties',
  'offers',
  'bulk-pricing',
  'variant-grid',
  'replenishment',
  'promotions',
  'loyalty',
  'coupons',
  'gift-cards',
  'cashier-shifts',
  'clothing-reports',
  'raw-materials',
  'bill-of-materials',
  'production',
  'finished-goods',
  'production-tracking',
];
