import { useCallback, useEffect, useState } from "react";
import "../App.css";
import "../styles/ui-system.css";
import "../styles/app-chrome.css";
import "../styles/overview-dashboard.css";
import "../styles/modern-dashboard.css";

// Layout & Context
import AppSidebar from "../components/layout/AppSidebar.jsx";
import AppHeader from "../components/layout/AppHeader.jsx";
import { AuthProvider } from "../context/AuthProvider.jsx";
import { ThemeProvider } from "../context/ThemeProvider.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useTheme } from "../hooks/useTheme.js";
import { getNavigation } from "../../shared/industryConfig.js";
import { resolveBusinessCapabilities } from "../../shared/industryConfig.js";

// Feature modules
import AuthPage from "../features/auth/AuthPage.jsx";
import BusinessSetup from "../features/onboarding/BusinessSetup.jsx";
import DashboardOverview from "../features/dashboard/DashboardOverview.jsx";
import ProductsPage from "../features/products/ProductsPage.jsx";
import ProductImportPage from "../features/product-import/ProductImportPage.jsx";
import InventoryOperations from "../features/inventory/InventoryOperations.jsx";
import PurchaseOrdersPage from "../features/purchasing/PurchaseOrdersPage.jsx";
import ReceivingGrnPage from "../features/purchasing/ReceivingGrnPage.jsx";
import SuppliersPage from "../features/purchasing/SuppliersPage.jsx";
import PosTerminalPage from "../features/pos/PosTerminalPage.jsx";
import SalesOrdersPage from "../features/sales/SalesOrdersPage.jsx";
import CustomersPage from "../features/customers/CustomersPage.jsx";
import PaymentsPage from "../features/payments/PaymentsPage.jsx";
import UserManagementPage from "../features/team/UserManagementPage.jsx";
import ReportsPage from "../features/reports/ReportsPage.jsx";
import BusinessProfilePage from "../features/settings/BusinessProfilePage.jsx";
import StoreSettingsPage from "../features/settings/StoreSettingsPage.jsx";
import Returns from "../features/returns/ReturnsPage.jsx";
import ClothingModule from "../features/industries/clothing/ClothingModule.jsx";
import ColorManagementPage from "../features/industries/clothing/ColorManagementPage.jsx";
import BulkPricingPage from "../features/industries/wholesale/BulkPricingPage.jsx";
import IndustryModule from "../features/industries/generic/IndustryModule.jsx";

// APIs & Hooks
import { productApi } from "../api/productApi.js";
import { reportApi } from "../api/reportApi.js";
import { supplierApi } from "../api/supplierApi.js";
import { userApi } from "../api/userApi.js";
import { salesOrderApi } from "../api/salesOrderApi.js";
import { useResource } from "../hooks/useResource.js";

function DashboardView({ initialNav = "Overview" }) {
  const { account, business, logout, updateBusiness } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [activeNav, setActiveNav] = useState(initialNav);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedNavSections, setExpandedNavSections] = useState(() => new Set(["Inventory"]));
  const [notif, setNotif] = useState({ items: [], unreadCount: 0 });
  const [gettingStarted, setGettingStarted] = useState(null);
  const [checklistDismissed, setChecklistDismissed] = useState(
    () => localStorage.getItem(`stockroom-getting-started:${business?.businessId}`) === "dismissed"
  );

  const permissions = account?.permissions || [];
  const canViewInventory = account?.role === "owner" || permissions.includes("view_inventory");
  const can = (permission) => account?.role === "owner" || permissions.includes(permission);

  const loadProducts = useCallback(
    () => (canViewInventory ? productApi.list() : Promise.resolve([])),
    [canViewInventory]
  );
  const loadReport = useCallback(() => reportApi.summary().catch(() => null), []);

  const {
    data: products,
    loading,
    error,
    refetch,
  } = useResource(loadProducts, [], []);

  const { data: reportData, refetch: refetchReport } = useResource(loadReport, [], null);

  const notifItems = (notif?.items || [])
    .filter((item) => ["inventory", "purchases", "payments"].includes(item.category))
    .slice(0, 6);

  const capabilities = business?.capabilities || resolveBusinessCapabilities(business || {});
  const visibleNavigation = getNavigation(business || {}, can);
  const visiblePages = new Set(["Overview", ...visibleNavigation.flatMap(([, items]) => items)]);
  const canOpen = (item) => visiblePages.has(item === "Products" ? capabilities.productLabel : item);

  const navigateTo = (navTo) => {
    const parentSection = visibleNavigation.find(([, items]) => items.includes(navTo))?.[0];
    if (parentSection) {
      setExpandedNavSections((current) => {
        if (current.has(parentSection)) return current;
        const next = new Set(current);
        next.add(parentSection);
        return next;
      });
    }
    setActiveNav(navTo);
    setMobileNavOpen(false);
  };

  const openNotification = navigateTo;

  useEffect(() => {
    if (!mobileNavOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setMobileNavOpen(false);
    };
    document.body.classList.add("mobile-nav-visible");
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.classList.remove("mobile-nav-visible");
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    if (!canViewInventory) return undefined;
    const refreshDashboardProducts = () => {
      refetch();
      if (typeof refetchReport === "function") refetchReport();
    };
    window.addEventListener("stockroom:data-changed", refreshDashboardProducts);
    return () => window.removeEventListener("stockroom:data-changed", refreshDashboardProducts);
  }, [canViewInventory, refetch, refetchReport]);

  useEffect(() => {
    if (account?.role !== "owner" || checklistDismissed) return;
    Promise.all([supplierApi.list({ status: "all" }), userApi.listMembers(), salesOrderApi.list()])
      .then(([suppliers, members, orders]) =>
        setGettingStarted({
          suppliers: suppliers.length,
          members: members.length,
          sales: orders.some((order) => order.status === "Completed"),
        })
      )
      .catch(() => {});
  }, [account?.role, checklistDismissed]);

  return (
    <main
      className={`dashboard-shell modern-theme ${activeNav === "Overview" ? "overview-dashboard" : ""}${
        ["Stock", "Stock In", "Stock Out", "Adjustments", "Stock History", "Categories", "Purchase Orders"].includes(
          activeNav
        )
          ? " stock-ledger-shell"
          : ""
      }${["Stock In", "Stock Out", "Adjustments"].includes(activeNav) ? " stock-in-shell" : ""}${
        activeNav === "Stock Out" ? " stock-out-shell" : ""
      }${activeNav === "Adjustments" ? " stock-adjustment-shell" : ""}${
        activeNav === "Stock History" ? " stock-audit-shell" : ""
      }${activeNav === "Categories" ? " category-shell" : ""}${
        activeNav === "Purchase Orders" ? " po-shell" : ""
      }${activeNav === "POS / Billing" ? " pos-shell" : ""}${
        activeNav === "Receiving" ? " stock-ledger-shell grn-shell" : ""
      }${activeNav === "Suppliers" ? " stock-ledger-shell sup-shell" : ""}${
        ["Products", "Medicines"].includes(activeNav) ? " stock-ledger-shell products-shell" : ""
      }${activeNav === "Bulk Import" ? " stock-ledger-shell import-shell" : ""}${
        activeNav === "Orders" ? " stock-ledger-shell ord-shell" : ""
      }${activeNav === "Customers" ? " stock-ledger-shell cust-shell" : ""}${
        activeNav === "Payments" ? " stock-ledger-shell pay-shell" : ""
      }${activeNav === "Returns" ? " stock-ledger-shell ret-shell" : ""}${
        ["Users", "Roles", "Permissions"].includes(activeNav) ? " stock-ledger-shell um-shell" : ""
      }${activeNav === "Reports" ? " stock-ledger-shell rep-shell" : ""}${
        ["Business Profile", "Industry", "Settings"].includes(activeNav) ? " stock-ledger-shell biz-shell" : ""
      }${
        [
          "Color Management",
          "Size Management",
          "Product Variants",
          "Batch Management",
          "Expiry Tracking",
          "Serial Numbers",
          "Warranty Tracking",
        ].includes(activeNav)
          ? " stock-ledger-shell var-shell"
          : ""
      }${["Bulk Orders", "Credit Sales", "Bulk Pricing"].includes(activeNav) ? " stock-ledger-shell cs-shell" : ""}${
        [
          "Variant Grid",
          "Replenishment",
          "Promotions",
          "Loyalty",
          "Coupons",
          "Gift Cards",
          "Cashier Shifts",
          "Clothing Reports",
        ].includes(activeNav)
          ? " stock-ledger-shell cloth-shell"
          : ""
      } industry-${String(business?.industry || "general")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}${mobileNavOpen ? " nav-open" : ""}${
        sidebarCollapsed ? " sidebar-collapsed" : ""
      }`}
    >
      <AppSidebar
        business={business}
        account={account}
        activeNav={activeNav}
        navigateTo={navigateTo}
        visibleNavigation={visibleNavigation}
        expandedNavSections={expandedNavSections}
        setExpandedNavSections={setExpandedNavSections}
        mobileNavOpen={mobileNavOpen}
        setMobileNavOpen={setMobileNavOpen}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        canOpen={canOpen}
        onLogout={logout}
      />

      <section className="dashboard-main">
        {String(business?.industry || "").toLowerCase() === "clothing" && (
          <div className="clothing-motion" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
        )}

        <AppHeader
          business={business}
          account={account}
          activeNav={activeNav}
          navigateTo={navigateTo}
          canOpen={canOpen}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          mobileNavOpen={mobileNavOpen}
          setMobileNavOpen={setMobileNavOpen}
          theme={theme}
          toggleTheme={toggleTheme}
          openNotification={openNotification}
          setNotif={setNotif}
          onLogout={logout}
        />

        {activeNav !== "Overview" && (
          <header className="dashboard-header">
            <div>
              <p className="dashboard-kicker">Manage your {activeNav.toLowerCase()}</p>
              <h1>{activeNav}</h1>
            </div>
          </header>
        )}

        {activeNav === "Overview" ? (
          <DashboardOverview
            business={business}
            account={account}
            products={products}
            loading={loading}
            error={error}
            refetch={refetch}
            reportData={reportData}
            capabilities={capabilities}
            navigateTo={navigateTo}
            canOpen={canOpen}
            notifItems={notifItems}
            openNotification={openNotification}
            gettingStarted={gettingStarted}
            checklistDismissed={checklistDismissed}
            setChecklistDismissed={setChecklistDismissed}
          />
        ) : activeNav === "Products" || activeNav === "Medicines" ? (
          <ProductsPage business={business} account={account} />
        ) : activeNav === "Bulk Import" ? (
          <ProductImportPage business={business} />
        ) : ["Categories", "Stock", "Stock In", "Stock Out", "Adjustments", "Stock History"].includes(activeNav) ? (
          <InventoryOperations
            section={activeNav}
            business={business}
            account={account}
            onNavigate={navigateTo}
            canNavigate={canOpen}
          />
        ) : ["Users", "Roles", "Permissions"].includes(activeNav) ? (
          <UserManagementPage section={activeNav} business={business} account={account} />
        ) : activeNav === "Suppliers" ? (
          <SuppliersPage business={business} onNavigate={navigateTo} canNavigate={canOpen} />
        ) : activeNav === "Customers" ? (
          <CustomersPage business={business} onNavigate={navigateTo} />
        ) : activeNav === "Purchase Orders" ? (
          <PurchaseOrdersPage business={business} account={account} onNavigate={navigateTo} />
        ) : activeNav === "Receiving" ? (
          <ReceivingGrnPage business={business} account={account} onNavigate={navigateTo} />
        ) : activeNav === "Orders" ? (
          <SalesOrdersPage
            business={business}
            account={account}
            creditSales={false}
            section={activeNav}
          />
        ) : activeNav === "POS / Billing" ? (
          <PosTerminalPage business={business} account={account} />
        ) : activeNav === "Payments" ? (
          <PaymentsPage business={business} account={account} />
        ) : activeNav === "Business Profile" || activeNav === "Industry" ? (
          <BusinessProfilePage
            business={business}
            onBusinessUpdate={updateBusiness}
            onBusinessDeleted={logout}
          />
        ) : activeNav === "Settings" ? (
          <StoreSettingsPage business={business} onBusinessUpdate={updateBusiness} />
        ) : activeNav === "Reports" ? (
          <ReportsPage business={business} />
        ) : activeNav === "Returns" || activeNav === "Purchase Returns" ? (
          <Returns business={business} account={account} purchase={activeNav === "Purchase Returns"} />
        ) : activeNav === "Color Management" ? (
          <ColorManagementPage business={business} account={account} />
        ) : [
            "Variant Grid",
            "Replenishment",
            "Promotions",
            "Loyalty",
            "Coupons",
            "Gift Cards",
            "Cashier Shifts",
            "Clothing Reports",
          ].includes(activeNav) ? (
          <ClothingModule section={activeNav} business={business} account={account} />
        ) : activeNav === "Bulk Pricing" ? (
          <BulkPricingPage business={business} account={account} />
        ) : [
            "Batch Management",
            "Expiry Tracking",
            "Prescription Management",
            "Size Management",
            "Product Variants",
            "Serial Numbers",
            "Warranty Tracking",
            "Offers / Discounts",
            "Raw Materials",
            "Bill of Materials",
            "Production",
            "Finished Goods",
            "Production Tracking",
          ].includes(activeNav) ? (
          <IndustryModule section={activeNav} business={business} onNavigate={navigateTo} />
        ) : activeNav === "Bulk Orders" || activeNav === "Credit Sales" ? (
          <SalesOrdersPage
            business={business}
            account={account}
            creditSales={false}
            section={activeNav}
          />
        ) : (
          <div className="empty-dashboard">
            <span className="empty-dashboard-icon">◫</span>
            <h2>{activeNav}</h2>
            <p>This module is ready for the next step of your inventory workspace.</p>
          </div>
        )}
      </section>
    </main>
  );
}

function MainApp() {
  const { session, loading, updateSession } = useAuth();
  const [initialNav, setInitialNav] = useState("Overview");

  const [initialReset] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).get("reset") || "";
    } catch {
      return "";
    }
  });

  if (loading) {
    return <div className="app-loading">Loading your workspace…</div>;
  }

  const needsOwnerOnboarding =
    session?.user?.role === "owner" &&
    session?.user?.onboarding &&
    session?.user?.onboarding?.status !== "completed";

  if (session && (!session.business || needsOwnerOnboarding)) {
    return (
      <BusinessSetup
        account={session.user}
        business={session.business}
        onSession={(result) => {
          updateSession(result);
        }}
        onComplete={(result) => {
          setInitialNav(result.initialNav || "Overview");
          updateSession(result);
        }}
      />
    );
  }

  if (session) {
    return <DashboardView initialNav={initialNav} />;
  }

  return (
    <AuthPage
      initialReset={initialReset}
      onAuthenticated={(userSession) => {
        updateSession(userSession);
      }}
    />
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
