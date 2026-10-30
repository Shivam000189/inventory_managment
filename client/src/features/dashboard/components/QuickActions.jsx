export default function QuickActions({ navigateTo }) {
  return (
    <div className="modern-quick-actions-panel">
      <div className="modern-section-header">
        <h3>
          <span className="modern-section-bolt">⚡</span> Quick Actions
        </h3>
      </div>
      <div className="modern-actions-grid">
        {/* Action 1: Add New Product */}
        <button
          type="button"
          className="modern-action-card action-blue"
          onClick={() => navigateTo("Products")}
        >
          <div className="modern-action-squircle">
            <svg viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="4" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </div>
          <span className="modern-action-label">Add New Product</span>
        </button>

        {/* Action 2: POS / Sale */}
        <button
          type="button"
          className="modern-action-card action-green"
          onClick={() => navigateTo("POS / Billing")}
        >
          <div className="modern-action-squircle">
            <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="21" r="1" />
              <circle cx="19" cy="21" r="1" />
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
            </svg>
          </div>
          <span className="modern-action-label">POS / Sale</span>
        </button>

        {/* Action 3: Create PO */}
        <button
          type="button"
          className="modern-action-card action-purple"
          onClick={() => navigateTo("Purchase Orders")}
        >
          <div className="modern-action-squircle">
            <svg viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11" />
              <path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2" />
              <circle cx="7" cy="18" r="2" />
              <circle cx="17" cy="18" r="2" />
            </svg>
          </div>
          <span className="modern-action-label">Create PO</span>
        </button>

        {/* Action 4: Receive Stock */}
        <button
          type="button"
          className="modern-action-card action-yellow"
          onClick={() => navigateTo("Receiving")}
        >
          <div className="modern-action-squircle">
            <svg viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </div>
          <span className="modern-action-label">Receive Stock</span>
        </button>

        {/* Action 5: Add Customer */}
        <button
          type="button"
          className="modern-action-card action-rose"
          onClick={() => navigateTo("Customers")}
        >
          <div className="modern-action-squircle">
            <svg viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
          </div>
          <span className="modern-action-label">Add Customer</span>
        </button>

        {/* Action 6: View Reports */}
        <button
          type="button"
          className="modern-action-card action-cyan"
          onClick={() => navigateTo("Reports")}
        >
          <div className="modern-action-squircle">
            <svg viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </div>
          <span className="modern-action-label">View Reports</span>
        </button>
      </div>
    </div>
  );
}
