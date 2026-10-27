/* oxlint-disable react/only-export-components */
import { lazy } from 'react'

const DashboardOverview = lazy(() => import('../features/dashboard/DashboardOverview.jsx'))
const ProductsPage = lazy(() => import('../features/products/ProductsPage.jsx'))
const InventoryOperations = lazy(() => import('../features/inventory/InventoryOperations.jsx'))
const PurchaseOrdersPage = lazy(() => import('../features/purchasing/PurchaseOrdersPage.jsx'))
const ReceivingGrnPage = lazy(() => import('../features/purchasing/ReceivingGrnPage.jsx'))
const SuppliersPage = lazy(() => import('../features/purchasing/SuppliersPage.jsx'))
const PosTerminalPage = lazy(() => import('../features/pos/PosTerminalPage.jsx'))
const SalesOrdersPage = lazy(() => import('../features/sales/SalesOrdersPage.jsx'))
const CustomersPage = lazy(() => import('../features/customers/CustomersPage.jsx'))
const PaymentsPage = lazy(() => import('../features/payments/PaymentsPage.jsx'))
const UserManagementPage = lazy(() => import('../features/team/UserManagementPage.jsx'))
const ReportsPage = lazy(() => import('../features/reports/ReportsPage.jsx'))
const BusinessProfilePage = lazy(() => import('../features/settings/BusinessProfilePage.jsx'))
const StoreSettingsPage = lazy(() => import('../features/settings/StoreSettingsPage.jsx'))
const Returns = lazy(() => import('../features/returns/ReturnsPage.jsx'))
const ClothingModule = lazy(() => import('../features/industries/clothing/ClothingModule.jsx'))
const ColorManagementPage = lazy(() => import('../features/industries/clothing/ColorManagementPage.jsx'))
const BulkPricingPage = lazy(() => import('../features/industries/wholesale/BulkPricingPage.jsx'))
const IndustryModule = lazy(() => import('../features/industries/generic/IndustryModule.jsx'))


export function NotFoundPage({ onNavigate }) {
  return (
    <div className="empty-dashboard not-found-page">
      <span className="empty-dashboard-icon">🔍</span>
      <h2>Page Not Found</h2>
      <p>The page you requested does not exist or has been moved.</p>
      <button
        type="button"
        className="ui-btn ui-btn-primary"
        style={{ marginTop: '1rem' }}
        onClick={() => (onNavigate ? onNavigate('Overview') : (window.location.href = '/'))}
      >
        Back to Dashboard
      </button>
    </div>
  )
}

export const ROUTE_TABLE = {
  Overview: {
    path: '/',
    requiredPermission: null,
    render: (ctx) => <DashboardOverview {...ctx.dashboardOverviewProps} />,
  },
  Products: {
    path: '/products',
    requiredPermission: 'view_inventory',
    render: (ctx) => <ProductsPage business={ctx.business} account={ctx.account} />,
  },
  Medicines: {
    path: '/medicines',
    requiredPermission: 'view_inventory',
    render: (ctx) => <ProductsPage business={ctx.business} account={ctx.account} />,
  },
  Categories: {
    path: '/categories',
    requiredPermission: 'view_inventory',
    render: (ctx) => (
      <InventoryOperations
        section="Categories"
        business={ctx.business}
        account={ctx.account}
        onNavigate={ctx.navigateTo}
        canNavigate={ctx.canOpen}
      />
    ),
  },
  Stock: {
    path: '/stock',
    requiredPermission: 'view_inventory',
    render: (ctx) => (
      <InventoryOperations
        section="Stock"
        business={ctx.business}
        account={ctx.account}
        onNavigate={ctx.navigateTo}
        canNavigate={ctx.canOpen}
      />
    ),
  },
  'Stock In': {
    path: '/stock-in',
    requiredPermission: 'stock_in',
    render: (ctx) => (
      <InventoryOperations
        section="Stock In"
        business={ctx.business}
        account={ctx.account}
        onNavigate={ctx.navigateTo}
        canNavigate={ctx.canOpen}
      />
    ),
  },
  'Stock Out': {
    path: '/stock-out',
    requiredPermission: 'stock_out',
    render: (ctx) => (
      <InventoryOperations
        section="Stock Out"
        business={ctx.business}
        account={ctx.account}
        onNavigate={ctx.navigateTo}
        canNavigate={ctx.canOpen}
      />
    ),
  },
  Adjustments: {
    path: '/adjustments',
    requiredPermission: 'edit_product',
    render: (ctx) => (
      <InventoryOperations
        section="Adjustments"
        business={ctx.business}
        account={ctx.account}
        onNavigate={ctx.navigateTo}
        canNavigate={ctx.canOpen}
      />
    ),
  },
  'Stock History': {
    path: '/stock-history',
    requiredPermission: 'view_inventory',
    render: (ctx) => (
      <InventoryOperations
        section="Stock History"
        business={ctx.business}
        account={ctx.account}
        onNavigate={ctx.navigateTo}
        canNavigate={ctx.canOpen}
      />
    ),
  },
  'Purchase Orders': {
    path: '/purchase-orders',
    requiredPermission: 'view_inventory',
    render: (ctx) => (
      <PurchaseOrdersPage
        business={ctx.business}
        account={ctx.account}
        onNavigate={ctx.navigateTo}
      />
    ),
  },
  Receiving: {
    path: '/receiving',
    requiredPermission: 'stock_in',
    render: (ctx) => (
      <ReceivingGrnPage
        business={ctx.business}
        account={ctx.account}
        onNavigate={ctx.navigateTo}
      />
    ),
  },
  Suppliers: {
    path: '/suppliers',
    requiredPermission: 'view_inventory',
    render: (ctx) => (
      <SuppliersPage
        business={ctx.business}
        onNavigate={ctx.navigateTo}
        canNavigate={ctx.canOpen}
      />
    ),
  },
  'POS / Billing': {
    path: '/pos',
    requiredPermission: 'process_pos_sale',
    render: (ctx) => <PosTerminalPage business={ctx.business} account={ctx.account} />,
  },
  Orders: {
    path: '/orders',
    requiredPermission: 'create_order',
    render: (ctx) => (
      <SalesOrdersPage
        business={ctx.business}
        account={ctx.account}
        creditSales={false}
        section="Orders"
      />
    ),
  },
  Customers: {
    path: '/customers',
    requiredPermission: 'create_order',
    render: (ctx) => <CustomersPage business={ctx.business} onNavigate={ctx.navigateTo} />,
  },
  Payments: {
    path: '/payments',
    requiredPermission: 'view_reports',
    render: (ctx) => <PaymentsPage business={ctx.business} account={ctx.account} />,
  },
  Returns: {
    path: '/returns',
    requiredPermission: 'create_order',
    render: (ctx) => <Returns business={ctx.business} account={ctx.account} purchase={false} />,
  },
  'Purchase Returns': {
    path: '/purchase-returns',
    requiredPermission: 'create_order',
    render: (ctx) => <Returns business={ctx.business} account={ctx.account} purchase={true} />,
  },
  Users: {
    path: '/users',
    requiredPermission: 'manage_users',
    render: (ctx) => (
      <UserManagementPage section="Users" business={ctx.business} account={ctx.account} />
    ),
  },
  Roles: {
    path: '/roles',
    requiredPermission: 'manage_users',
    render: (ctx) => (
      <UserManagementPage section="Roles" business={ctx.business} account={ctx.account} />
    ),
  },
  Permissions: {
    path: '/permissions',
    requiredPermission: 'manage_users',
    render: (ctx) => (
      <UserManagementPage section="Permissions" business={ctx.business} account={ctx.account} />
    ),
  },
  Reports: {
    path: '/reports',
    requiredPermission: 'view_reports',
    render: (ctx) => <ReportsPage business={ctx.business} />,
  },
  'Business Profile': {
    path: '/business-profile',
    requiredPermission: 'manage_users',
    render: (ctx) => (
      <BusinessProfilePage
        business={ctx.business}
        onBusinessUpdate={ctx.updateBusiness}
        onBusinessDeleted={ctx.logout}
      />
    ),
  },
  Industry: {
    path: '/industry',
    requiredPermission: 'manage_users',
    render: (ctx) => (
      <BusinessProfilePage
        business={ctx.business}
        onBusinessUpdate={ctx.updateBusiness}
        onBusinessDeleted={ctx.logout}
      />
    ),
  },
  Settings: {
    path: '/settings',
    requiredPermission: 'manage_users',
    render: (ctx) => (
      <StoreSettingsPage business={ctx.business} onBusinessUpdate={ctx.updateBusiness} />
    ),
  },
  'Color Management': {
    path: '/colors',
    requiredPermission: 'view_inventory',
    render: (ctx) => <ColorManagementPage business={ctx.business} account={ctx.account} />,
  },
  'Size Management': {
    path: '/sizes',
    requiredPermission: 'view_inventory',
    render: (ctx) => (
      <IndustryModule section="Size Management" business={ctx.business} onNavigate={ctx.navigateTo} />
    ),
  },
  'Product Variants': {
    path: '/variants',
    requiredPermission: 'view_inventory',
    render: (ctx) => (
      <IndustryModule section="Product Variants" business={ctx.business} onNavigate={ctx.navigateTo} />
    ),
  },
  'Batch Management': {
    path: '/batches',
    requiredPermission: 'view_inventory',
    render: (ctx) => (
      <IndustryModule section="Batch Management" business={ctx.business} onNavigate={ctx.navigateTo} />
    ),
  },
  'Expiry Tracking': {
    path: '/expiry',
    requiredPermission: 'view_inventory',
    render: (ctx) => (
      <IndustryModule section="Expiry Tracking" business={ctx.business} onNavigate={ctx.navigateTo} />
    ),
  },
  'Prescription Management': {
    path: '/prescriptions',
    requiredPermission: 'create_order',
    render: (ctx) => (
      <IndustryModule section="Prescription Management" business={ctx.business} onNavigate={ctx.navigateTo} />
    ),
  },
  'Serial Numbers': {
    path: '/serial-numbers',
    requiredPermission: 'view_inventory',
    render: (ctx) => (
      <IndustryModule section="Serial Numbers" business={ctx.business} onNavigate={ctx.navigateTo} />
    ),
  },
  'Warranty Tracking': {
    path: '/warranties',
    requiredPermission: 'view_inventory',
    render: (ctx) => (
      <IndustryModule section="Warranty Tracking" business={ctx.business} onNavigate={ctx.navigateTo} />
    ),
  },
  'Offers / Discounts': {
    path: '/offers',
    requiredPermission: 'process_pos_sale',
    render: (ctx) => (
      <IndustryModule section="Offers / Discounts" business={ctx.business} onNavigate={ctx.navigateTo} />
    ),
  },
  'Bulk Orders': {
    path: '/bulk-orders',
    requiredPermission: 'create_order',
    render: (ctx) => (
      <SalesOrdersPage
        business={ctx.business}
        account={ctx.account}
        creditSales={false}
        section="Bulk Orders"
      />
    ),
  },
  'Credit Sales': {
    path: '/credit-sales',
    requiredPermission: 'create_order',
    render: (ctx) => (
      <SalesOrdersPage
        business={ctx.business}
        account={ctx.account}
        creditSales={false}
        section="Credit Sales"
      />
    ),
  },
  'Bulk Pricing': {
    path: '/bulk-pricing',
    requiredPermission: 'edit_product',
    render: (ctx) => <BulkPricingPage business={ctx.business} account={ctx.account} />,
  },
  'Variant Grid': {
    path: '/variant-grid',
    requiredPermission: 'view_variants',
    render: (ctx) => (
      <ClothingModule section="Variant Grid" business={ctx.business} account={ctx.account} />
    ),
  },
  Replenishment: {
    path: '/replenishment',
    requiredPermission: 'view_replenishment',
    render: (ctx) => (
      <ClothingModule section="Replenishment" business={ctx.business} account={ctx.account} />
    ),
  },
  Promotions: {
    path: '/promotions',
    requiredPermission: 'manage_promotions',
    render: (ctx) => (
      <ClothingModule section="Promotions" business={ctx.business} account={ctx.account} />
    ),
  },
  Loyalty: {
    path: '/loyalty',
    requiredPermission: 'manage_loyalty',
    render: (ctx) => (
      <ClothingModule section="Loyalty" business={ctx.business} account={ctx.account} />
    ),
  },
  Coupons: {
    path: '/coupons',
    requiredPermission: 'manage_coupons',
    render: (ctx) => (
      <ClothingModule section="Coupons" business={ctx.business} account={ctx.account} />
    ),
  },
  'Gift Cards': {
    path: '/gift-cards',
    requiredPermission: 'manage_gift_cards',
    render: (ctx) => (
      <ClothingModule section="Gift Cards" business={ctx.business} account={ctx.account} />
    ),
  },
  'Cashier Shifts': {
    path: '/cashier-shifts',
    requiredPermission: 'manage_cashier_shift',
    render: (ctx) => (
      <ClothingModule section="Cashier Shifts" business={ctx.business} account={ctx.account} />
    ),
  },
  'Clothing Reports': {
    path: '/clothing-reports',
    requiredPermission: 'view_clothing_reports',
    render: (ctx) => (
      <ClothingModule section="Clothing Reports" business={ctx.business} account={ctx.account} />
    ),
  },
  'Raw Materials': {
    path: '/raw-materials',
    requiredPermission: 'view_inventory',
    render: (ctx) => (
      <IndustryModule section="Raw Materials" business={ctx.business} onNavigate={ctx.navigateTo} />
    ),
  },
  'Bill of Materials': {
    path: '/bill-of-materials',
    requiredPermission: 'view_inventory',
    render: (ctx) => (
      <IndustryModule section="Bill of Materials" business={ctx.business} onNavigate={ctx.navigateTo} />
    ),
  },
  Production: {
    path: '/production',
    requiredPermission: 'stock_out',
    render: (ctx) => (
      <IndustryModule section="Production" business={ctx.business} onNavigate={ctx.navigateTo} />
    ),
  },
  'Finished Goods': {
    path: '/finished-goods',
    requiredPermission: 'view_inventory',
    render: (ctx) => (
      <IndustryModule section="Finished Goods" business={ctx.business} onNavigate={ctx.navigateTo} />
    ),
  },
  'Production Tracking': {
    path: '/production-tracking',
    requiredPermission: 'view_inventory',
    render: (ctx) => (
      <IndustryModule section="Production Tracking" business={ctx.business} onNavigate={ctx.navigateTo} />
    ),
  },
}

export function shellClassFor(_routeOrLabel) {
  return ''
}

export function navLabelForPath(pathname, productLabel = 'Products') {
  if (pathname === '/' || pathname === '/overview') return 'Overview'
  if (pathname === '/products' || pathname === '/medicines' || pathname === '/bulk-import') return productLabel
  const entry = Object.entries(ROUTE_TABLE).find(([, config]) => config.path === pathname)
  return entry ? entry[0] : ''
}

export function pathForNavLabel(label) {
  if (!label) return '/'
  if (ROUTE_TABLE[label]) return ROUTE_TABLE[label].path
  return '/'
}
