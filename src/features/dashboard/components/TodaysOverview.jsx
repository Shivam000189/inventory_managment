export default function TodaysOverview({
  todaySalesVal,
  todayOrdersVal,
  reportData,
  lowStockCount,
  stockInVal,
  receivablesVal,
  payablesVal,
  business,
  navigateTo,
}) {
  return (
    <div className="modern-panel-card">
      <div className="modern-section-header">
        <h3>
          <span className="modern-section-bolt">⚡</span> Today&apos;s Overview
        </h3>
      </div>
      <div className="modern-overview-grid">
        {/* Tile 1: Today's Revenue */}
        <div className="modern-overview-tile action-green">
          <div className="modern-tile-top">
            <span className="modern-tile-title">Today&apos;s Revenue</span>
            <div className="modern-tile-icon-small bubble-green" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
          </div>
          <span className="modern-tile-number">
            {business?.currency || "INR"} {todaySalesVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
          <button
            type="button"
            className="modern-tile-link"
            onClick={() => navigateTo("POS / Billing")}
          >
            View details →
          </button>
        </div>

        {/* Tile 2: Today's Orders */}
        <div className="modern-overview-tile action-blue">
          <div className="modern-tile-top">
            <span className="modern-tile-title">Today&apos;s Orders</span>
            <div className="modern-tile-icon-small bubble-blue" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
            </div>
          </div>
          <span className="modern-tile-number">{todayOrdersVal}</span>
          <button
            type="button"
            className="modern-tile-link"
            onClick={() => navigateTo("Orders")}
          >
            View details →
          </button>
        </div>

        {/* Tile 3: Low Stock Alerts */}
        <div className="modern-overview-tile action-yellow">
          <div className="modern-tile-top">
            <span className="modern-tile-title">Low Stock Alerts</span>
            <div className="modern-tile-icon-small bubble-yellow" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
          </div>
          <span className="modern-tile-number">{reportData?.lowStock ?? lowStockCount}</span>
          <button
            type="button"
            className="modern-tile-link"
            onClick={() => navigateTo("Stock")}
          >
            View details →
          </button>
        </div>

        {/* Tile 4: Items Restocked */}
        <div className="modern-overview-tile action-cyan">
          <div className="modern-tile-top">
            <span className="modern-tile-title">Items Restocked</span>
            <div className="modern-tile-icon-small bubble-cyan" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
          </div>
          <span className="modern-tile-number">{stockInVal}</span>
          <button
            type="button"
            className="modern-tile-link"
            onClick={() => navigateTo("Receiving")}
          >
            View details →
          </button>
        </div>

        {/* Tile 5: Receivables */}
        <div className="modern-overview-tile action-purple">
          <div className="modern-tile-top">
            <span className="modern-tile-title">Receivables</span>
            <div className="modern-tile-icon-small bubble-purple" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
          </div>
          <span className="modern-tile-number">
            {business?.currency || "INR"} {receivablesVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
          <button
            type="button"
            className="modern-tile-link"
            onClick={() => navigateTo("Payments")}
          >
            View details →
          </button>
        </div>

        {/* Tile 6: Payables */}
        <div className="modern-overview-tile action-rose">
          <div className="modern-tile-top">
            <span className="modern-tile-title">Payables</span>
            <div className="modern-tile-icon-small bubble-rose" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
          </div>
          <span className="modern-tile-number">
            {business?.currency || "INR"} {payablesVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
          <button
            type="button"
            className="modern-tile-link"
            onClick={() => navigateTo("Purchase Orders")}
          >
            View details →
          </button>
        </div>
      </div>
    </div>
  );
}
