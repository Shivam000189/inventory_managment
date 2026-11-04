import { AppProvider } from '../dashboard/context/AppContext.tsx';
import { DashboardLayout } from '../dashboard/DashboardLayout.tsx';
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import "../App.css";
import "../styles/ui-system.css";
import "../styles/app-chrome.css";
import "../styles/modern-dashboard.css";

// Context
import { AuthProvider } from "../context/AuthProvider.jsx";
import { ThemeProvider } from "../context/ThemeProvider.jsx";
import { useAuth } from "../hooks/useAuth.js";

// Shell Mapping & Routes
import { DASHBOARD_CHILD_ROUTES, TOP_LEVEL_REDIRECTS } from "./routes.jsx";
import { Spinner } from "../components/ui/Feedback.tsx";
import { PlatformLayout } from "../platform/PlatformLayout.tsx";
import { PlatformRouteGuard } from "../platform/PlatformRouteGuard.tsx";
import { getAuthenticatedPath, isSuperAdmin } from "../platform/platformPaths.ts";

// Auth & Setup (Lazy)
const AuthPage = lazy(() => import("../features/auth/AuthPage"));
const LandingPage = lazy(() => import("../features/landing/LandingPage"));
const PasswordChangePage = lazy(() => import("../platform/PasswordChangePage").then((module) => ({ default: module.PasswordChangePage })));
const PlatformDashboardPage = lazy(() => import("../platform/PlatformDashboardPage").then((module) => ({ default: module.PlatformDashboardPage })));
const PlatformBusinessesPage = lazy(() => import("../platform/PlatformBusinessesPage").then((module) => ({ default: module.PlatformBusinessesPage })));
const PlatformBusinessAdminsPage = lazy(() => import("../platform/PlatformBusinessAdminsPage").then((module) => ({ default: module.PlatformBusinessAdminsPage })));

function DashboardView() {
  const { account, business, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <AppProvider
      initialUser={account}
      initialBusiness={business}
      onLogout={logout}
      onNavigate={(p) => {
        if (p === '/' || p === '/landing') {
          navigate('/landing');
        }
      }}
    >
      <DashboardLayout onLogout={logout} />
    </AppProvider>
  );
}

function BusinessProvisioningRequired() {
  const { account, logout } = useAuth();
  const navigate = useNavigate();

  const signOut = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <main className="platform-password-stage">
      <section className="platform-card" style={{ width: 'min(480px, 100%)' }}>
        <h1>Business access is not configured</h1>
        <p className="platform-dialog-copy">
          {account?.name ? `Hello ${account.name}. ` : ''}
          A Super Admin must provision a business for this account before it can access the workspace.
          Contact your platform administrator for help.
        </p>
        <button className="platform-button platform-button-primary" type="button" onClick={signOut}>
          Sign out
        </button>
      </section>
    </main>
  );
}

function MainApp() {
  const { session, loading, updateSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthenticated = Boolean(session?.user);
  const defaultAuthenticatedPath = session?.user
    ? getAuthenticatedPath(session.user)
    : '/overview';

  const handleAuthenticated = (userSession) => {
    updateSession(userSession);
    const user = userSession?.user;
    navigate(
      user?.mustChangePassword ? '/change-password' : user ? getAuthenticatedPath(user) : '/login',
      { replace: true },
    );
  };

  // 1. While auth is unresolved, display an accessible, lightweight loading state.
  // Protected dashboard content is never rendered until the session check settles.
  if (loading) {
    if (location.pathname === "/landing" || location.pathname === "/") {
      return (
        <Suspense fallback={
          <div className="min-h-screen bg-[#F6EDE1] flex items-center justify-center p-6" role="status" aria-busy="true">
            <span className="sr-only">Loading landing page…</span>
            <Spinner size={32} />
          </div>
        }>
          <LandingPage
            onSignIn={() => navigate("/login")}
            onSignUp={() => navigate("/login")}
          />
        </Suspense>
      );
    }
    return (
      <div className="app-loading" role="status" aria-busy="true">
        <span className="sr-only">Checking session authentication…</span>
        <Spinner size={32} />
      </div>
    );
  }

  if (isAuthenticated && session?.user?.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace state={{ from: location.pathname }} />;
  }

  const hasBusinessAssigned = Boolean(
    session?.business ||
    session?.user?.business ||
    session?.user?.businessId ||
    session?.user?.business_id
  );

  if (isAuthenticated && !isSuperAdmin(session?.user) && !hasBusinessAssigned) {
    return <BusinessProvisioningRequired />;
  }

  return (
    <Suspense fallback={
      <div className="app-loading" role="status" aria-busy="true">
        <span className="sr-only">Loading…</span>
        <Spinner size={28} />
      </div>
    }>
      <Routes>
        {/* Public Landing & Marketing */}
        <Route
          path="/landing"
          element={
            <LandingPage
              onSignIn={() => navigate("/login")}
              onSignUp={() => navigate("/login")}
            />
          }
        />
        <Route
          path="/pricing"
          element={
            <LandingPage
              onSignIn={() => navigate("/login")}
              onSignUp={() => navigate("/login")}
            />
          }
        />

        {/* Public Auth Routes: redirect authenticated visitors to their dashboard */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to={defaultAuthenticatedPath} replace />
            ) : (
              <AuthPage
                onAuthenticated={handleAuthenticated}
                onBackToHome={() => navigate("/")}
              />
            )
          }
        />
        <Route
          path="/register"
          element={<Navigate to="/login" replace />}
        />
        <Route
          path="/signup"
          element={<Navigate to="/login" replace />}
        />
        <Route
          path="/forgot-password"
          element={<Navigate to="/login" replace />}
        />
        <Route
          path="/change-password"
          element={
            !isAuthenticated ? (
              <Navigate to="/login" replace />
            ) : session?.user?.mustChangePassword ? (
              <PasswordChangePage
                onComplete={(result) => {
                  updateSession(result);
                  navigate(result?.user ? getAuthenticatedPath(result.user) : defaultAuthenticatedPath, { replace: true });
                }}
              />
            ) : (
              <Navigate to={defaultAuthenticatedPath} replace />
            )
          }
        />

        {/* Root Route: authenticated users go to dashboard; unauthenticated go to landing page */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to={defaultAuthenticatedPath} replace />
            ) : (
              <LandingPage
                onSignIn={() => navigate("/login")}
                onSignUp={() => navigate("/login")}
              />
            )
          }
        />



        {/* Legacy /app/* redirect to clean root paths */}
        <Route
          path="/app/*"
          element={
            <Navigate
              to={
                location.pathname.replace(/^\/app/, '') || '/overview'
              }
              replace
            />
          }
        />

        {/* Active Dashboard Shell: strictly protected, rendered directly at root */}
        <Route
          element={
            isAuthenticated ? (
              isSuperAdmin(session?.user) ? (
                <Navigate to={defaultAuthenticatedPath} replace />
              ) : (
                <DashboardView />
              )
            ) : (
              <Navigate to="/login" replace state={{ from: location.pathname }} />
            )
          }
        >
          {DASHBOARD_CHILD_ROUTES.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={route.element}
            />
          ))}
        </Route>

        <Route
          path="/super-admin"
          element={
            <PlatformRouteGuard>
              <PlatformLayout />
            </PlatformRouteGuard>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<PlatformDashboardPage />} />
          <Route path="businesses" element={<PlatformBusinessesPage />} />
          <Route path="business-admins" element={<PlatformBusinessAdminsPage />} />
          <Route path="*" element={<Navigate to="/super-admin/dashboard" replace />} />
        </Route>

        {/* Catch-all */}
        <Route
          path="*"
          element={
            isAuthenticated ? (
              <Navigate to={defaultAuthenticatedPath} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Suspense>
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
