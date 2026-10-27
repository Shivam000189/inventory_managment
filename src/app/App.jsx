import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import "../App.css";
import "../styles/ui-system.css";
import "../styles/app-chrome.css";
import "../styles/modern-dashboard.css";
import "../features/dashboard/overview-dashboard.css";

// Layout & Context
import AppSidebar from "../components/layout/AppSidebar.jsx";
import AppHeader from "../components/layout/AppHeader.jsx";
import { AuthProvider } from "../context/AuthProvider.jsx";
import { ThemeProvider } from "../context/ThemeProvider.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useTheme } from "../hooks/useTheme.js";
import { getNavigation, resolveBusinessCapabilities } from "../../shared/industryConfig.js";

// Routes & Shell Mapping
import {
  ROUTE_TABLE,
  NotFoundPage,
  navLabelForPath,
  pathForNavLabel,
} from "./routes.jsx";

// Auth & Setup
import AuthPage from "../features/auth/AuthPage.jsx";
import BusinessSetup from "../features/onboarding/BusinessSetup.jsx";

// APIs & Hooks
import { productApi } from "../api/productApi.js";
import { reportApi } from "../api/reportApi.js";
import { supplierApi } from "../api/supplierApi.js";
import { userApi } from "../api/userApi.js";
import { salesOrderApi } from "../api/salesOrderApi.js";
import { useResource } from "../hooks/useResource.js";

function DashboardView() {
  const { account, business, logout, updateBusiness } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768 && window.innerWidth < 1024;
    }
    return false;
  });
  const menuButtonRef = useRef(null);
  const prevMobileNavOpen = useRef(mobileNavOpen);
  const [notif, setNotif] = useState({ items: [], unreadCount: 0 });
  const [gettingStarted, setGettingStarted] = useState(null);
  const [checklistDismissed, setChecklistDismissed] = useState(
    () => localStorage.getItem(`stockroom-getting-started:${business?.businessId}`) === "dismissed"
  );

  const permissions = account?.permissions || [];
  const canViewInventory = account?.role === "owner" || permissions.includes("view_inventory");
  const can = (permission) => account?.role === "owner" || permissions.includes(permission);

  const capabilities = business?.capabilities || resolveBusinessCapabilities(business || {});
  const visibleNavigation = getNavigation(business || {}, can);
  const visiblePages = new Set(["Overview", ...visibleNavigation.flatMap(([, items]) => items)]);
  const canOpen = (item) => visiblePages.has(item === "Products" ? capabilities.productLabel : item);

  const activeNav = useMemo(
    () => navLabelForPath(location.pathname, capabilities.productLabel) || "Overview",
    [location.pathname, capabilities.productLabel]
  );

  const [expandedNavSections, setExpandedNavSections] = useState(() => {
    const initial = new Set(["Inventory"]);
    const currentNav = navLabelForPath(window.location.pathname, business?.capabilities?.productLabel);
    const parent = currentNav ? visibleNavigation.find(([, items]) => items.includes(currentNav))?.[0] : null;
    if (parent) initial.add(parent);
    return initial;
  });

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
    if (typeof navTo === "string" && navTo.startsWith("/")) {
      navigate(navTo);
    } else {
      navigate(pathForNavLabel(navTo));
    }
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
    if (prevMobileNavOpen.current && !mobileNavOpen) {
      menuButtonRef.current?.focus();
    }
    prevMobileNavOpen.current = mobileNavOpen;
  }, [mobileNavOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      } else if (window.innerWidth >= 1024) {
        setSidebarCollapsed(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  const routeContext = {
    business,
    account,
    navigateTo,
    canOpen,
    updateBusiness,
    logout,
    dashboardOverviewProps: {
      business,
      account,
      products,
      loading,
      error,
      refetch,
      reportData,
      capabilities,
      navigateTo,
      canOpen,
      notifItems,
      openNotification,
      gettingStarted,
      checklistDismissed,
      setChecklistDismissed,
    },
  };

  return (
    <main
      className={`dashboard-shell modern-theme ${sidebarCollapsed ? "sidebar-collapsed" : ""} industry-${String(business?.industry || "general")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}${mobileNavOpen ? " nav-open" : ""}`}
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
        canOpen={canOpen}
        onLogout={logout}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
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
          mobileNavOpen={mobileNavOpen}
          setMobileNavOpen={setMobileNavOpen}
          theme={theme}
          toggleTheme={toggleTheme}
          openNotification={openNotification}
          setNotif={setNotif}
          onLogout={logout}
          menuButtonRef={menuButtonRef}
        />

        {activeNav && activeNav !== "Overview" && (
          <header className="dashboard-header">
            <div>
              <p className="dashboard-kicker">Manage your {activeNav.toLowerCase()}</p>
              <h1>{activeNav}</h1>
            </div>
          </header>
        )}

        <Routes>
          <Route path="/overview" element={<Navigate to="/" replace />} />
          {Object.entries(ROUTE_TABLE).map(([label, config]) => {
            const hasPermission =
              !config.requiredPermission ||
              (Array.isArray(config.requiredPermission)
                ? config.requiredPermission.every(can)
                : can(config.requiredPermission));

            return (
              <Route
                key={label}
                path={config.path}
                element={hasPermission ? config.render(routeContext) : <Navigate to="/" replace />}
              />
            );
          })}
          <Route path="*" element={<NotFoundPage onNavigate={navigateTo} />} />
        </Routes>
      </section>
    </main>
  );
}

function MainApp() {
  const { session, loading, updateSession } = useAuth();
  const navigate = useNavigate();

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
          updateSession(result);
          if (result.initialNav) {
            navigate(pathForNavLabel(result.initialNav));
          }
        }}
      />
    );
  }

  if (session) {
    return <DashboardView />;
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
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
