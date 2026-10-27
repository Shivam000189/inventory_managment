export default function MetricCards({
  totalProductsCount,
  unitsInStock,
  todaySalesVal,
  pendingOrdersVal,
  activeCustomersVal,
  business,
  capabilities,
  navigateTo,
}) {
  return (
    <div className="modern-kpi-row">
      {/* Card 1: Total Products */}
      <div
        className="modern-kpi-card"
        role="button"
        tabIndex={0}
        onClick={() => navigateTo(capabilities?.productLabel || "Products")}
        onKeyDown={(e) => e.key === "Enter" && navigateTo(capabilities?.productLabel || "Products")}
      >
        <div className="modern-kpi-texts">
          <span className="modern-kpi-title">Total Products</span>
          <span className="modern-kpi-value">{totalProductsCount}</span>
          <span style={{ fontSize: "11.5px", color: "var(--muted)", fontWeight: 500 }}>
            {unitsInStock > 0 ? `${unitsInStock.toLocaleString()} units in stock` : "+12 added this month"}
          </span>
        </div>
        <div className="modern-kpi-icon-bubble bubble-blue" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m7.5 4.27 9 5.15M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
          </svg>
        </div>
      </div>

      {/* Card 2: Today's Sales */}
      <div
        className="modern-kpi-card"
        role="button"
        tabIndex={0}
        onClick={() => navigateTo("POS / Billing")}
        onKeyDown={(e) => e.key === "Enter" && navigateTo("POS / Billing")}
      >
        <div className="modern-kpi-texts">
          <span className="modern-kpi-title">Today&apos;s Sales</span>
          <span className="modern-kpi-value">
            {business?.currency || "INR"} {todaySalesVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span style={{ fontSize: "11.5px", color: "var(--success)", fontWeight: 600 }}>
            +8.5% from yesterday
          </span>
        </div>
        <div className="modern-kpi-icon-bubble bubble-green" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 17l7-7 4 4 7-7" />
            <path d="M17 6h4v4" />
          </svg>
        </div>
      </div>

      {/* Card 3: Pending Orders */}
      <div
        className="modern-kpi-card"
        role="button"
        tabIndex={0}
        onClick={() => navigateTo("Orders")}
        onKeyDown={(e) => e.key === "Enter" && navigateTo("Orders")}
      >
        <div className="modern-kpi-texts">
          <span className="modern-kpi-title">Pending Orders</span>
          <span className="modern-kpi-value">{pendingOrdersVal}</span>
          <span style={{ fontSize: "11.5px", color: "var(--warning)", fontWeight: 500 }}>
            Awaiting fulfillment
          </span>
        </div>
        <div className="modern-kpi-icon-bubble bubble-yellow" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
      </div>

      {/* Card 4: Total Customers */}
      <div
        className="modern-kpi-card"
        role="button"
        tabIndex={0}
        onClick={() => navigateTo("Customers")}
        onKeyDown={(e) => e.key === "Enter" && navigateTo("Customers")}
      >
        <div className="modern-kpi-texts">
          <span className="modern-kpi-title">Total Customers</span>
          <span className="modern-kpi-value">{activeCustomersVal}</span>
          <span style={{ fontSize: "11.5px", color: "var(--muted)", fontWeight: 500 }}>
            Active in directory
          </span>
        </div>
        <div className="modern-kpi-icon-bubble bubble-purple" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
      </div>
    </div>
  );
}
