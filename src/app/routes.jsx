/* oxlint-disable react/only-export-components */
import DashboardOverview from '../features/dashboard/DashboardOverview.jsx'
import ProductsPage from '../features/products/ProductsPage.jsx'
import ProductImportPage from '../features/product-import/ProductImportPage.jsx'
import InventoryOperations from '../features/inventory/InventoryOperations.jsx'
import PurchaseOrdersPage from '../features/purchasing/PurchaseOrdersPage.jsx'
import ReceivingGrnPage from '../features/purchasing/ReceivingGrnPage.jsx'
import SuppliersPage from '../features/purchasing/SuppliersPage.jsx'
import PosTerminalPage from '../features/pos/PosTerminalPage.jsx'
import SalesOrdersPage from '../features/sales/SalesOrdersPage.jsx'
import CustomersPage from '../features/customers/CustomersPage.jsx'
import PaymentsPage from '../features/payments/PaymentsPage.jsx'
import UserManagementPage from '../features/team/UserManagementPage.jsx'
import ReportsPage from '../features/reports/ReportsPage.jsx'
import BusinessProfilePage from '../features/settings/BusinessProfilePage.jsx'
import StoreSettingsPage from '../features/settings/StoreSettingsPage.jsx'
import Returns from '../features/returns/ReturnsPage.jsx'
import ClothingModule from '../features/industries/clothing/ClothingModule.jsx'
import ColorManagementPage from '../features/industries/clothing/ColorManagementPage.jsx'
import BulkPricingPage from '../features/industries/wholesale/BulkPricingPage.jsx'
import IndustryModule from '../features/industries/generic/IndustryModule.jsx'

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
    shellClass: 'overview-dashboard',
    render: (ctx) => <DashboardOverview {...ctx.dashboardOverviewProps} />,
  },
  Products: {
    path: '/products',
    requiredPermission: 'view_inventory',
    shellClass: 'stock-ledger-shell products-shell',
    render: (ctx) => <ProductsPage business={ctx.business} account={ctx.account} />,
  },
  Medicines: {
    path: '/medicines',
    requiredPermission: 'view_inventory',
    shellClass: 'stock-ledger-shell products-shell',
    render: (ctx) => <ProductsPage business={ctx.business} account={ctx.account} />,
  },
  'Bulk Import': {
    path: '/bulk-import',
    requiredPermission: ['create_product', 'stock_in'],
    shellClass: 'stock-ledger-shell import-shell',
    render: (ctx) => <ProductImportPage business={ctx.business} />,
  },
  Categories: {
    path: '/categories',
    requiredPermission: 'view_inventory',
    shellClass: 'stock-ledger-shell category-shell',
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
    shellClass: 'stock-ledger-shell',
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
    shellClass: 'stock-ledger-shell stock-in-shell',
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
    shellClass: 'stock-ledger-shell stock-in-shell stock-out-shell',
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
    shellClass: 'stock-ledger-shell stock-in-shell stock-adjustment-shell',
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
    shellClass: 'stock-ledger-shell stock-audit-shell',
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
    shellClass: 'stock-ledger-shell po-shell',
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
    shellClass: 'stock-ledger-shell grn-shell',
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
    shellClass: 'stock-ledger-shell sup-shell',
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
    shellClass: 'pos-shell',
    render: (ctx) => <PosTerminalPage business={ctx.business} account={ctx.account} />,
  },
  Orders: {
    path: '/orders',
    requiredPermission: 'create_order',
    shellClass: 'stock-ledger-shell ord-shell',
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
    shellClass: 'stock-ledger-shell cust-shell',
    render: (ctx) => <CustomersPage business={ctx.business} onNavigate={ctx.navigateTo} />,
  },
  Payments: {
    path: '/payments',
    requiredPermission: 'view_reports',
    shellClass: 'stock-ledger-shell pay-shell',
    render: (ctx) => <PaymentsPage business={ctx.business} account={ctx.account} />,
  },
  Returns: {
    path: '/returns',
    requiredPermission: 'create_order',
    shellClass: 'stock-ledger-shell ret-shell',
    render: (ctx) => <Returns business={ctx.business} account={ctx.account} purchase={false} />,
  },
  'Purchase Returns': {
    path: '/purchase-returns',
    requiredPermission: 'create_order',
    shellClass: 'stock-ledger-shell ret-shell',
    render: (ctx) => <Returns business={ctx.business} account={ctx.account} purchase={true} />,
  },
  Users: {
    path: '/users',
    requiredPermission: 'manage_users',
    shellClass: 'stock-ledger-shell um-shell',
    render: (ctx) => (
      <UserManagementPage section="Users" business={ctx.business} account={ctx.account} />
    ),
  },
  Roles: {
    path: '/roles',
    requiredPermission: 'manage_users',
    shellClass: 'stock-ledger-shell um-shell',
    render: (ctx) => (
      <UserManagementPage section="Roles" business={ctx.business} account={ctx.account} />
    ),
  },
  Permissions: {
    path: '/permissions',
    requiredPermission: 'manage_users',
    shellClass: 'stock-ledger-shell um-shell',
    render: (ctx) => (
      <UserManagementPage section="Permissions" business={ctx.business} account={ctx.account} />
    ),
  },
  Reports: {
    path: '/reports',
    requiredPermission: 'view_reports',
    shellClass: 'stock-ledger-shell rep-shell',
    render: (ctx) => <ReportsPage business={ctx.business} />,
  },
  'Business Profile': {
    path: '/business-profile',
    requiredPermission: 'manage_users',
    shellClass: 'stock-ledger-shell biz-shell',
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
    shellClass: 'stock-ledger-shell biz-shell',
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
    shellClass: 'stock-ledger-shell biz-shell',
    render: (ctx) => (
      <StoreSettingsPage business={ctx.business} onBusinessUpdate={ctx.updateBusiness} />
    ),
  },
  'Color Management': {
    path: '/colors',
    requiredPermission: 'view_inventory',
    shellClass: 'stock-ledger-shell var-shell',
    render: (ctx) => <ColorManagementPage business={ctx.business} account={ctx.account} />,
  },
  'Size Management': {
    path: '/sizes',
    requiredPermission: 'view_inventory',
    shellClass: 'stock-ledger-shell var-shell',
    render: (ctx) => (
      <IndustryModule section="Size Management" business={ctx.business} onNavigate={ctx.navigateTo} />
    ),
  },
  'Product Variants': {
    path: '/variants',
    requiredPermission: 'view_inventory',
    shellClass: 'stock-ledger-shell var-shell',
    render: (ctx) => (
      <IndustryModule section="Product Variants" business={ctx.business} onNavigate={ctx.navigateTo} />
    ),
  },
  'Batch Management': {
    path: '/batches',
    requiredPermission: 'view_inventory',
    shellClass: 'stock-ledger-shell var-shell',
    render: (ctx) => (
      <IndustryModule section="Batch Management" business={ctx.business} onNavigate={ctx.navigateTo} />
    ),
  },
  'Expiry Tracking': {
    path: '/expiry',
    requiredPermission: 'view_inventory',
    shellClass: 'stock-ledger-shell var-shell',
    render: (ctx) => (
      <IndustryModule section="Expiry Tracking" business={ctx.business} onNavigate={ctx.navigateTo} />
    ),
  },
  'Prescription Management': {
    path: '/prescriptions',
    requiredPermission: 'create_order',
    shellClass: '',
    render: (ctx) => (
      <IndustryModule section="Prescription Management" business={ctx.business} onNavigate={ctx.navigateTo} />
    ),
  },
  'Serial Numbers': {
    path: '/serial-numbers',
    requiredPermission: 'view_inventory',
    shellClass: 'stock-ledger-shell var-shell',
    render: (ctx) => (
      <IndustryModule section="Serial Numbers" business={ctx.business} onNavigate={ctx.navigateTo} />
    ),
  },
  'Warranty Tracking': {
    path: '/warranties',
    requiredPermission: 'view_inventory',
    shellClass: 'stock-ledger-shell var-shell',
    render: (ctx) => (
      <IndustryModule section="Warranty Tracking" business={ctx.business} onNavigate={ctx.navigateTo} />
    ),
  },
  'Offers / Discounts': {
    path: '/offers',
    requiredPermission: 'process_pos_sale',
    shellClass: '',
    render: (ctx) => (
      <IndustryModule section="Offers / Discounts" business={ctx.business} onNavigate={ctx.navigateTo} />
    ),
  },
  'Bulk Orders': {
    path: '/bulk-orders',
    requiredPermission: 'create_order',
    shellClass: 'stock-ledger-shell cs-shell',
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
    shellClass: 'stock-ledger-shell cs-shell',
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
    shellClass: 'stock-ledger-shell cs-shell',
    render: (ctx) => <BulkPricingPage business={ctx.business} account={ctx.account} />,
  },
  'Variant Grid': {
    path: '/variant-grid',
    requiredPermission: 'view_variants',
    shellClass: 'stock-ledger-shell cloth-shell',
    render: (ctx) => (
      <ClothingModule section="Variant Grid" business={ctx.business} account={ctx.account} />
    ),
  },
  Replenishment: {
    path: '/replenishment',
    requiredPermission: 'view_replenishment',
    shellClass: 'stock-ledger-shell cloth-shell',
    render: (ctx) => (
      <ClothingModule section="Replenishment" business={ctx.business} account={ctx.account} />
    ),
  },
  Promotions: {
    path: '/promotions',
    requiredPermission: 'manage_promotions',
    shellClass: 'stock-ledger-shell cloth-shell',
    render: (ctx) => (
      <ClothingModule section="Promotions" business={ctx.business} account={ctx.account} />
    ),
  },
  Loyalty: {
    path: '/loyalty',
    requiredPermission: 'manage_loyalty',
    shellClass: 'stock-ledger-shell cloth-shell',
    render: (ctx) => (
      <ClothingModule section="Loyalty" business={ctx.business} account={ctx.account} />
    ),
  },
  Coupons: {
    path: '/coupons',
    requiredPermission: 'manage_coupons',
    shellClass: 'stock-ledger-shell cloth-shell',
    render: (ctx) => (
      <ClothingModule section="Coupons" business={ctx.business} account={ctx.account} />
    ),
  },
  'Gift Cards': {
    path: '/gift-cards',
    requiredPermission: 'manage_gift_cards',
    shellClass: 'stock-ledger-shell cloth-shell',
    render: (ctx) => (
      <ClothingModule section="Gift Cards" business={ctx.business} account={ctx.account} />
    ),
  },
  'Cashier Shifts': {
    path: '/cashier-shifts',
    requiredPermission: 'manage_cashier_shift',
    shellClass: 'stock-ledger-shell cloth-shell',
    render: (ctx) => (
      <ClothingModule section="Cashier Shifts" business={ctx.business} account={ctx.account} />
    ),
  },
  'Clothing Reports': {
    path: '/clothing-reports',
    requiredPermission: 'view_clothing_reports',
    shellClass: 'stock-ledger-shell cloth-shell',
    render: (ctx) => (
      <ClothingModule section="Clothing Reports" business={ctx.business} account={ctx.account} />
    ),
  },
  'Raw Materials': {
    path: '/raw-materials',
    requiredPermission: 'view_inventory',
    shellClass: '',
    render: (ctx) => (
      <IndustryModule section="Raw Materials" business={ctx.business} onNavigate={ctx.navigateTo} />
    ),
  },
  'Bill of Materials': {
    path: '/bill-of-materials',
    requiredPermission: 'view_inventory',
    shellClass: '',
    render: (ctx) => (
      <IndustryModule section="Bill of Materials" business={ctx.business} onNavigate={ctx.navigateTo} />
    ),
  },
  Production: {
    path: '/production',
    requiredPermission: 'stock_out',
    shellClass: '',
    render: (ctx) => (
      <IndustryModule section="Production" business={ctx.business} onNavigate={ctx.navigateTo} />
    ),
  },
  'Finished Goods': {
    path: '/finished-goods',
    requiredPermission: 'view_inventory',
    shellClass: '',
    render: (ctx) => (
      <IndustryModule section="Finished Goods" business={ctx.business} onNavigate={ctx.navigateTo} />
    ),
  },
  'Production Tracking': {
    path: '/production-tracking',
    requiredPermission: 'view_inventory',
    shellClass: '',
    render: (ctx) => (
      <IndustryModule section="Production Tracking" business={ctx.business} onNavigate={ctx.navigateTo} />
    ),
  },
}

export function shellClassFor(routeOrLabel) {
  if (!routeOrLabel) return ''
  if (routeOrLabel.startsWith('/')) {
    if (routeOrLabel === '/' || routeOrLabel === '/overview') return ROUTE_TABLE.Overview.shellClass
    const entry = Object.values(ROUTE_TABLE).find((item) => item.path === routeOrLabel)
    return entry ? entry.shellClass : ''
  }
  return ROUTE_TABLE[routeOrLabel]?.shellClass || ''
}

export function navLabelForPath(pathname, productLabel = 'Products') {
  if (pathname === '/' || pathname === '/overview') return 'Overview'
  if (pathname === '/products' || pathname === '/medicines') return productLabel
  const entry = Object.entries(ROUTE_TABLE).find(([, config]) => config.path === pathname)
  return entry ? entry[0] : ''
}

export function pathForNavLabel(label) {
  if (!label) return '/'
  if (ROUTE_TABLE[label]) return ROUTE_TABLE[label].path
  return '/'
}
