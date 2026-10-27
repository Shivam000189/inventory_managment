import { useRef, useState } from "react";

const NAVIGATION_LABELS = {
  Overview: "Dashboard",
  Products: "Products",
  Categories: "Categories",
  Stock: "Stock Ledger",
  "Stock In": "Stock Inward",
  "Stock Out": "Stock Outward",
  Adjustments: "Adjustments",
  "Stock History": "Movement Audit",
  "Purchase Orders": "Purchase Orders",
  Receiving: "Receiving & GRN",
  Suppliers: "Suppliers",
  "POS / Billing": "POS / Sale",
  Orders: "Sales Orders",
  Customers: "Customers",
  Payments: "Payments",
  Returns: "Returns & Refunds",
  Users: "Team Members",
  Roles: "Roles & Access",
  Permissions: "Permissions",
  Reports: "Analytics & Reports",
  "Business Profile": "Business Profile",
  Settings: "Store Settings",
};

const navigationLabel = (item) => NAVIGATION_LABELS[item] || item;

function getSectionIcon(section) {
  const s = String(section).toLowerCase();
  if (s.includes("product") || s.includes("catalog") || s.includes("medicine")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m7.5 4.27 9 5.15M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
      </svg>
    );
  }
  if (s.includes("stock") || s.includes("inventory")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3 9 5-9 5-9-5 9-5Z" />
        <path d="m3 13 9 5 9-5" />
        <path d="m3 18 9 5 9-5" />
      </svg>
    );
  }
  if (s.includes("purchase") || s.includes("procurement") || s.includes("supplier") || s.includes("receiving")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11" />
        <path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="17" cy="18" r="2" />
      </svg>
    );
  }
  if (s.includes("pos") || s.includes("sale") || s.includes("order") || s.includes("billing")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="21" r="1" />
        <circle cx="19" cy="21" r="1" />
        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
      </svg>
    );
  }
  if (s.includes("user") || s.includes("team") || s.includes("customer")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }
  if (s.includes("report") || s.includes("analytics")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="m19 9-5 5-4-4-3 3" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function AppSidebar({
  business,
  account,
  activeNav,
  navigateTo,
  visibleNavigation,
  expandedNavSections,
  setExpandedNavSections,
  mobileNavOpen,
  setMobileNavOpen,
  canOpen,
  onLogout,
}) {
  const [showWorkspacePopover, setShowWorkspacePopover] = useState(false);
  const workspaceRef = useRef(null);

  const rawName = (business?.name && business.name.toLowerCase() !== "name" && business.name.trim())
    ? business.name
    : "Aflix";
  const companyName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  return (
    <>
      <aside className="dashboard-sidebar modern-sidebar" id="dashboard-navigation">
        {/* Brand Header */}
        <div className="modern-sidebar-brand">
          <div className="modern-brand-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="m7.5 4.27 9 5.15M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
              <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
            </svg>
          </div>
          <div className="modern-brand-info">
            <span className="modern-brand-title">{companyName}</span>
            <span className="modern-brand-subtitle">
              {business?.industry ? `${business.industry.toUpperCase()} · SUITE` : "INVENTORY & POS"}
            </span>
          </div>
        </div>

        {/* Workspace Quick Switcher */}
        <div
          className="workspace-switcher-wrap"
          ref={workspaceRef}
          onMouseEnter={() => setShowWorkspacePopover(true)}
          onMouseLeave={() => setShowWorkspacePopover(false)}
          style={{ marginBottom: "16px" }}
        >
          <button
            className={`workspace-switcher ${showWorkspacePopover ? "active" : ""}`}
            type="button"
            aria-expanded={showWorkspacePopover}
            aria-haspopup="dialog"
            aria-label="Workspace details"
            onClick={() => setShowWorkspacePopover(!showWorkspacePopover)}
          >
            <span className="workspace-avatar">
              {companyName[0].toUpperCase()}
            </span>
            <span className="workspace-copy">
              <small>Workspace</small>
              <strong>{companyName}</strong>
            </span>
            <span className={`chevron workspace-chevron ${showWorkspacePopover ? "open" : ""}`} aria-hidden="true">
              <svg viewBox="0 0 20 20"><path d="m6 8 4 4 4-4" /></svg>
            </span>
          </button>

          {showWorkspacePopover && (
            <div className="workspace-popover" role="dialog" aria-label="Workspace Details">
              <div className="workspace-popover-header">
                <span className="workspace-popover-avatar">
                  {companyName[0].toUpperCase()}
                </span>
                <div className="workspace-popover-title">
                  <strong>{companyName}</strong>
                  <span className="workspace-role-badge">
                    {account?.role === "owner" ? "Owner / Admin" : (account?.role ? account.role.charAt(0).toUpperCase() + account.role.slice(1) : "Staff")}
                  </span>
                </div>
              </div>

              <div className="workspace-popover-divider" />

              <div className="workspace-popover-details">
                <div className="workspace-detail-row">
                  <span className="workspace-detail-label">Industry</span>
                  <span className="workspace-detail-val">
                    {business?.industry ? business.industry.charAt(0).toUpperCase() + business.industry.slice(1) : "General"}
                  </span>
                </div>
                <div className="workspace-detail-row">
                  <span className="workspace-detail-label">Currency</span>
                  <span className="workspace-detail-val">{business?.currency || "INR"}</span>
                </div>
              </div>

              <div className="workspace-popover-actions">
                {canOpen("Business Profile") && (
                  <button
                    type="button"
                    className="workspace-popover-action"
                    onClick={() => {
                      navigateTo("Business Profile");
                      setShowWorkspacePopover(false);
                    }}
                  >
                    <span>⚙ Business Profile</span>
                    <span>→</span>
                  </button>
                )}
                {canOpen("Users") && (
                  <button
                    type="button"
                    className="workspace-popover-action"
                    onClick={() => {
                      navigateTo("Users");
                      setShowWorkspacePopover(false);
                    }}
                  >
                    <span>👥 Team & Users</span>
                    <span>→</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modern Navigation Menu */}
        <nav className="modern-sidebar-nav" aria-label="Main navigation">
          {/* Overview / Dashboard */}
          <button
            className={`modern-nav-item ${activeNav === "Overview" ? "active" : ""}`}
            type="button"
            title="Dashboard Overview"
            onClick={() => navigateTo("Overview")}
          >
            <span className="modern-nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
              </svg>
            </span>
            <span className="modern-nav-label">Dashboard</span>
          </button>

          {/* Dynamic Navigation Sections */}
          {visibleNavigation.map(([section, items]) => {
            const hasChildren = items.length > 0;
            const isGroupOpen = expandedNavSections.has(section);
            const containsActive = items.includes(activeNav) || activeNav === section;
            const hasLiveTag = section.includes("Sales") || section.includes("POS") || items.includes("POS / Billing");

            if (!hasChildren) {
              return (
                <button
                  key={section}
                  className={`modern-nav-item ${activeNav === section ? "active" : ""}`}
                  type="button"
                  title={navigationLabel(section)}
                  onClick={() => navigateTo(section)}
                >
                  <span className="modern-nav-icon" aria-hidden="true">
                    {getSectionIcon(section)}
                  </span>
                  <span className="modern-nav-label">{navigationLabel(section)}</span>
                  {hasLiveTag && <span className="modern-live-badge">LIVE</span>}
                </button>
              );
            }

            return (
              <div className="modern-nav-group" key={section}>
                <button
                  className={`modern-nav-group-toggle ${containsActive ? "contains-active" : ""}`}
                  type="button"
                  aria-expanded={isGroupOpen}
                  title={navigationLabel(section)}
                  onClick={() => {
                    setExpandedNavSections((current) => {
                      const next = new Set(current);
                      if (next.has(section)) next.delete(section);
                      else next.add(section);
                      return next;
                    });
                  }}
                >
                  <span className="modern-nav-icon" aria-hidden="true">
                    {getSectionIcon(section)}
                  </span>
                  <span className="modern-nav-label">{navigationLabel(section)}</span>
                  {hasLiveTag && <span className="modern-live-badge">LIVE</span>}
                  <span className={`modern-nav-chevron ${isGroupOpen ? "open" : ""}`} aria-hidden="true">
                    <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m6 8 4 4 4-4" />
                    </svg>
                  </span>
                </button>

                {isGroupOpen && (
                  <div className="modern-nav-sublist">
                    {items.map((item) => (
                      <button
                        key={item}
                        className={`modern-subnav-item ${activeNav === item ? "active" : ""}`}
                        type="button"
                        title={navigationLabel(item)}
                        onClick={() => navigateTo(item)}
                      >
                        <span className="modern-nav-label">{navigationLabel(item)}</span>
                        {item === "POS / Billing" && <span className="modern-live-badge">LIVE</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* 24/7 Priority Support Card (Reference Image match) */}
        <div className="modern-support-card">
          <div className="modern-support-header">
            <div className="modern-support-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
              </svg>
            </div>
            <div className="modern-support-texts">
              <small>Need Help?</small>
              <strong>24/7 Priority Support</strong>
            </div>
          </div>
          <button
            className="modern-support-btn"
            type="button"
            onClick={() => {
              window.open("mailto:support@stockroom.pro?subject=Support%20Request%20-%20" + encodeURIComponent(business?.name || "Store"));
            }}
          >
            Contact Support
          </button>
        </div>
      </aside>

      <button
        className="mobile-nav-backdrop"
        type="button"
        aria-label="Close navigation"
        tabIndex={mobileNavOpen ? 0 : -1}
        onClick={() => setMobileNavOpen(false)}
      />
    </>
  );
}
