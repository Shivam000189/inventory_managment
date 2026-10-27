import { useRef, useState } from "react";
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
  business,
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
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  const displayName = capitalize(account?.name || account?.email?.split("@")[0] || "User");
  const roleLabel = account?.role === "owner" ? "Administrator" : capitalize(account?.role || "Staff");

  return (
    <>
      {/* Top Mobile Bar */}
      <div className="mobile-dashboard-bar">
        <button
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
        {/* Left Side: Greeting & Status */}
        <div className="modern-navbar-left">
          {activeNav === "Overview" ? (
            <>
              <span className="modern-navbar-welcome-small">Welcome back,</span>
              <div className="modern-navbar-name-row">
                <h1 className="modern-navbar-name">{displayName}</h1>
                <span className="modern-verified-pill" title="Verified business owner">✓</span>
              </div>
              <p className="modern-navbar-sub">Here&apos;s what&apos;s happening in your business today.</p>
            </>
          ) : (
            <>
              <span className="modern-navbar-welcome-small">
                {business?.name || "Workspace"} • {business?.industry ? capitalize(business.industry) : "Retail"}
              </span>
              <div className="modern-navbar-name-row">
                <h1 className="modern-navbar-name">{navigationLabel(activeNav)}</h1>
              </div>
              <p className="modern-navbar-sub">Manage your {activeNav.toLowerCase()} operations</p>
            </>
          )}
        </div>

        {/* Right Side: Search, Role Pill, Theme, Notif, User Menu */}
        <div className="modern-navbar-right">
          {/* Search Pill Input */}
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
            onMouseEnter={() => setShowUserMenu(true)}
            onMouseLeave={() => setShowUserMenu(false)}
          >
            <button
              className="modern-user-badge-trigger"
              type="button"
              aria-expanded={showUserMenu}
              aria-haspopup="dialog"
              aria-label="User account settings"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <span className="modern-user-avatar">
                {(account?.name || account?.email || "U")[0].toUpperCase()}
              </span>
              <div className="modern-user-meta">
                <span className="modern-user-name">{displayName}</span>
                <span className="modern-user-role-label">{roleLabel}</span>
              </div>
              <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: "var(--muted)", marginLeft: "4px" }}>
                <path d="m6 8 4 4 4-4" />
              </svg>
            </button>

            {showUserMenu && (
              <div className="header-popover user-popover" role="dialog" aria-label="User profile">
                <div className="popover-user">
                  <span className="user-avatar popover-user-avatar">
                    {(account?.name || account?.email || "U")[0].toUpperCase()}
                  </span>
                  <div className="popover-user-info">
                    <strong>{displayName}</strong>
                    <small>{account?.email}</small>
                    <span className="user-role-badge">
                      {roleLabel}
                    </span>
                  </div>
                </div>

                <div className="popover-divider" />

                <div className="popover-detail">
                  <span className="detail-label">Workspace</span>
                  <strong className="detail-value">{business?.name || "Your business"}</strong>

                  <span className="detail-label">Industry</span>
                  <strong className="detail-value">
                    {business?.industry ? capitalize(business.industry) : "General"}
                  </strong>

                  <span className="detail-label">Access</span>
                  <strong className="detail-value highlight">
                    {account?.role === "owner" ? "Full Admin Access" : (account?.role || "Staff")}
                  </strong>
                </div>

                <div className="popover-actions">
                  {canOpen("Business Profile") && (
                    <button
                      type="button"
                      className="popover-action-btn"
                      onClick={() => {
                        navigateTo("Business Profile");
                        setShowUserMenu(false);
                      }}
                    >
                      <svg className="profile-menu-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 21V3h12v18M16 9h4v12M2 21h20M8 7h4M8 11h4M8 15h4M9 21v-2h2v2" /></svg>
                      <span>Business Profile</span>
                      <svg className="profile-menu-icon profile-menu-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5" /></svg>
                    </button>
                  )}
                  {canOpen("Users") && (
                    <button
                      type="button"
                      className="popover-action-btn"
                      onClick={() => {
                        navigateTo("Users");
                        setShowUserMenu(false);
                      }}
                    >
                      <svg className="profile-menu-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3" /><path d="M3 21v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M21 21v-2a6 6 0 0 0-4-5.66" /></svg>
                      <span>Team & Users</span>
                      <svg className="profile-menu-icon profile-menu-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5" /></svg>
                    </button>
                  )}
                </div>

                <button
                  className="popover-logout"
                  type="button"
                  onClick={onLogout}
                >
                  <svg className="profile-menu-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 21H4V3h5M10 12h11m-5-5 5 5-5 5" /></svg>
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
