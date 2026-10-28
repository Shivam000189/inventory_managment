import { useEffect, useRef, useState } from "react";
import NotificationCenter from "./NotificationCenter.jsx";

const NAVIGATION_LABELS = {
  Overview: "Dashboard Overview",
  Products: "Products Catalog",
  Stock: "Stock Ledger",
  "Stock In": "Stock Inward",
  "Stock Out": "Stock Outward",
  Adjustments: "Inventory Adjustments",
  "Stock History": "Movement Audit",
  "Purchase Orders": "Purchase Orders",
  Receiving: "Receiving & GRN",
  Suppliers: "Suppliers Directory",
  "POS / Billing": "POS Terminal",
  Orders: "Sales Orders",
  Customers: "Customers & CRM",
  Payments: "Payments & Settlements",
  Returns: "Returns & Refunds",
  Users: "Team Management",
  Roles: "Roles & Permissions",
  Reports: "Business Intelligence",
  "Business Profile": "Business Profile",
  Settings: "Store Settings",
};

const navigationLabel = (item) => NAVIGATION_LABELS[item] || item;
const capitalize = (value) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : value);

export default function AppHeader({
  _business,
  account,
  activeNav,
  navigateTo,
  canOpen,
  mobileNavOpen,
  setMobileNavOpen,
  theme,
  toggleTheme,
  openNotification,
  setNotif,
  onLogout,
  menuButtonRef,
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    if (!showUserMenu) return undefined;
    const handleClickOutside = (event) => {
      if (
        event.type === "keydown"
          ? event.key === "Escape"
          : !userMenuRef.current?.contains(event.target)
      ) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("pointerdown", handleClickOutside);
    window.addEventListener("keydown", handleClickOutside);
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
      window.removeEventListener("keydown", handleClickOutside);
    };
  }, [showUserMenu]);

  const displayName = capitalize(account?.name || account?.email?.split("@")[0] || "User");
  const roleLabel = account?.role === "owner" ? "Administrator" : capitalize(account?.role || "Staff");

  return (
    <>
      {/* Top Mobile Bar */}
      <div className="mobile-dashboard-bar">
        <button
          ref={menuButtonRef}
          className="mobile-menu-button"
          type="button"
          aria-label="Open navigation"
          aria-controls="dashboard-navigation"
          aria-expanded={mobileNavOpen}
          onClick={() => setMobileNavOpen(true)}
        >
          <span />
          <span />
          <span />
        </button>
        <span className="mobile-page-title">{navigationLabel(activeNav)}</span>
      </div>

      {/* Main Modern Navbar Header */}
      <header className="modern-navbar" role="banner">
        {/* Full-width Search Overlay for Mobile */}
        {isSearchExpanded && (
          <div className="modern-search-overlay" role="search">
            <div className="modern-search-overlay-inner">
              <svg className="modern-search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="modern-search-overlay-input"
                placeholder="Search products, orders, SKUs..."
                autoFocus
                aria-label="Search products, orders, SKUs"
                onKeyDown={(e) => {
                  if (e.key === "Escape") setIsSearchExpanded(false);
                }}
              />
              <button
                type="button"
                className="modern-search-overlay-close"
                aria-label="Close search"
                onClick={() => setIsSearchExpanded(false)}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Left Side: Greeting & Status (Persistent across all pages) */}
        <div className="modern-navbar-left">
          <span className="modern-navbar-welcome-small">Welcome back,</span>
          <div className="modern-navbar-name-row">
            <h1 className="modern-navbar-name">{displayName}</h1>
            <span className="modern-verified-pill" title="Verified business owner">✓</span>
          </div>
          <p className="modern-navbar-sub">Here&apos;s what&apos;s happening in your business today.</p>
        </div>

        {/* Right Side: Search, Role Pill, Theme, Notif, User Menu */}
        <div className="modern-navbar-right">
          {/* Mobile Search Toggle Button */}
          <button
            type="button"
            className="modern-search-toggle-btn"
            aria-label="Search"
            aria-expanded={isSearchExpanded}
            onClick={() => setIsSearchExpanded(true)}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>

          {/* Desktop Search Pill Input */}
          <div className="modern-search-wrap">
            <input
              type="text"
              className="modern-search-input"
              placeholder="Search products, orders, SKUs..."
              aria-label="Search"
            />
            <svg className="modern-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

          {/* Role Pill Badge */}
          <div className="modern-role-pill">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>{roleLabel}</span>
          </div>

          {/* Theme Toggle Button */}
          <button
            type="button"
            className="modern-icon-circle-btn theme-toggle-btn"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            onClick={toggleTheme}
          >
            {theme === "dark" ? (
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          {/* Notifications */}
          <NotificationCenter
            onNavigate={openNotification}
            onOpen={() => setShowUserMenu(false)}
            onChange={setNotif}
          />

          {/* User Profile Avatar & Dropdown */}
          <div
            className="header-popover-wrap user-menu-wrap"
            ref={userMenuRef}
          >
            <button
              className={`modern-user-badge-trigger ${showUserMenu ? "active" : ""}`}
              type="button"
              aria-expanded={showUserMenu}
              aria-haspopup="menu"
              aria-label="User account menu"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <span className="modern-user-avatar">
                {(account?.name || account?.email || "U")[0].toUpperCase()}
              </span>
              <div className="modern-user-meta">
                <span className="modern-user-name">{displayName}</span>
                <span className="modern-user-role-label">{roleLabel}</span>
              </div>
              <svg
                className="modern-user-chevron"
                viewBox="0 0 20 20"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                style={{ color: "var(--muted)", marginLeft: "4px" }}
              >
                <path d="m6 8 4 4 4-4" />
              </svg>
            </button>

            {showUserMenu && (
              <div className="header-popover modern-user-dropdown" role="menu" aria-label="User menu">
                <button
                  type="button"
                  className="modern-user-dropdown-item"
                  role="menuitem"
                  title="View Main Profile"
                  onClick={() => {
                    if (canOpen?.("Business Profile")) {
                      navigateTo("Business Profile");
                    } else if (canOpen?.("Users")) {
                      navigateTo("Users");
                    } else {
                      navigateTo("Overview");
                    }
                    setShowUserMenu(false);
                  }}
                >
                  <svg className="user-dropdown-icon user-icon-blue" viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="7" r="4" />
                    <path d="M5.5 21a8.38 8.38 0 0 1 13 0" />
                  </svg>
                  <span>View Profile</span>
                </button>

                <div className="modern-user-dropdown-divider" role="separator" />

                <button
                  type="button"
                  className="modern-user-dropdown-item logout-item"
                  role="menuitem"
                  onClick={() => {
                    setShowUserMenu(false);
                    onLogout?.();
                  }}
                >
                  <svg className="user-dropdown-icon user-icon-red" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
