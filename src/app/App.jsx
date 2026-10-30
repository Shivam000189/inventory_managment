import { AppProvider } from '../dashboard/context/AppContext.tsx';
import { DashboardLayout } from '../dashboard/DashboardLayout.tsx';
import { lazy, Suspense, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import "../App.css";
import "../styles/ui-system.css";
import "../styles/app-chrome.css";
import "../styles/modern-dashboard.css";

// Context
import { AuthProvider } from "../context/AuthProvider.jsx";
import { ThemeProvider } from "../context/ThemeProvider.jsx";
import { useAuth } from "../hooks/useAuth.js";

// Shell Mapping
import { pathForNavLabel } from "./routes.jsx";

// Auth & Setup (Lazy)
const AuthPage = lazy(() => import("../features/auth/AuthPage.jsx"));
const BusinessSetup = lazy(() => import("../features/onboarding/BusinessSetup.jsx"));
const LandingPage = lazy(() => import("../features/landing/LandingPage.jsx"));

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

function MainApp() {
  const { session, loading, updateSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleAuthenticated = (userSession) => {
    updateSession(userSession);
    navigate("/", { replace: true });
  };

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

  // Always show full landing page if explicitly visiting /landing
  if (location.pathname === "/landing") {
    return (
      <Suspense fallback={<div className="app-loading">Loading…</div>}>
        <LandingPage
          isLoggedIn={Boolean(session)}
          onNavigateAuth={(mode) => navigate(mode === "signup" ? "/register" : "/login")}
        />
      </Suspense>
    );
  }

  const needsOwnerOnboarding =
    session?.user?.role === "owner" &&
    session?.user?.onboarding &&
    session?.user?.onboarding?.status !== "completed";

  if (session && (!session.business || needsOwnerOnboarding)) {
    return (
      <Suspense fallback={<div className="app-loading">Loading workspace setup…</div>}>
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
      </Suspense>
    );
  }

  if (session) {
    return <DashboardView />;
  }

  return (
    <Suspense fallback={<div className="app-loading">Loading…</div>}>
      <Routes>
        <Route
          path="/"
          element={
            <LandingPage
              isLoggedIn={false}
              onNavigateAuth={(mode) => navigate(mode === "signup" ? "/register" : "/login")}
            />
          }
        />
        <Route
          path="/landing"
          element={
            <LandingPage
              isLoggedIn={false}
              onNavigateAuth={(mode) => navigate(mode === "signup" ? "/register" : "/login")}
            />
          }
        />
        <Route
          path="/login"
          element={
            <AuthPage
              initialReset={initialReset}
              initialMode="signin"
              onAuthenticated={handleAuthenticated}
              onBackToHome={() => navigate("/")}
            />
          }
        />
        <Route
          path="/register"
          element={
            <AuthPage
              initialReset={initialReset}
              initialMode="signup"
              onAuthenticated={handleAuthenticated}
              onBackToHome={() => navigate("/")}
            />
          }
        />
        <Route
          path="/signup"
          element={
            <AuthPage
              initialReset={initialReset}
              initialMode="signup"
              onAuthenticated={handleAuthenticated}
              onBackToHome={() => navigate("/")}
            />
          }
        />
        <Route
          path="/forgot-password"
          element={
            <AuthPage
              initialReset={initialReset}
              initialMode="forgot"
              onAuthenticated={handleAuthenticated}
              onBackToHome={() => navigate("/")}
            />
          }
        />
        <Route
          path="*"
          element={
            initialReset ? (
              <AuthPage
                initialReset={initialReset}
                onAuthenticated={handleAuthenticated}
                onBackToHome={() => navigate("/")}
              />
            ) : (
              <Navigate to="/" replace />
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
