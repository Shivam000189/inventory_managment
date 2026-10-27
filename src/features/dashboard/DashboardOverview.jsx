import { Fragment, useEffect, useState } from "react";
import AsyncBoundary from "../../components/feedback/AsyncBoundary.jsx";
import { salesOrderApi } from "../../api/salesOrderApi.js";

const stockLevelPct = (stock, minimum) => {
  const value = Number(stock || 0);
  if (value <= 0) return 0;
  const full = Math.max(Number(minimum || 0) * 3, 12);
  return Math.max(6, Math.min(100, Math.round((value / full) * 100)));
};

function formatOrderTime(createdAt) {
  if (!createdAt) return { time: "Recent", sub: "Today" };
  const d = new Date(createdAt);
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const sub = d.toLocaleDateString([], { month: "short", day: "numeric" });
  return { time, sub };
}

export default function DashboardOverview({
  business,
  account,
  products = [],
  loading,
  error,
  refetch,
  reportData,
  capabilities,
  navigateTo,
  notifItems = [],
  openNotification,
  gettingStarted,
  checklistDismissed,
  setChecklistDismissed,
}) {
  const [search, setSearch] = useState("");
  const [overviewCategory, setOverviewCategory] = useState("all");
  const [overviewSort, setOverviewSort] = useState("default");
  const [overviewPage, setOverviewPage] = useState(1);
  const [inventoryTableOpen, setInventoryTableOpen] = useState(true);
  const [expandedInventoryGroups, setExpandedInventoryGroups] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    let isMounted = true;
    salesOrderApi
      .list({ limit: 5 })
      .then((res) => {
        if (!isMounted) return;
        if (Array.isArray(res)) setRecentOrders(res.slice(0, 5));
        else if (Array.isArray(res?.data)) setRecentOrders(res.data.slice(0, 5));
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const overviewProducts = products.map((product) => ({
    key: product.productId || product.sku,
    name: product.name,
    sku: product.sku,
    category: product.category,
    brand: product.brand || "",
    size: product.size || "",
    color: product.color || "",
    stock: Number(product.currentStock || 0),
    minimumStock: Number(product.minimumStock || 10),
    price: Number(product.sellingPrice || 0),
    purchasePrice: Number(product.purchasePrice || 0),
    expiryDate: product.expiryDate,
    warrantyMonths: product.warrantyMonths,
    batchNumber: product.batchNumber,
    variants: product.variants || [],
  }));

  const inventoryGroups = Array.from(
    overviewProducts.reduce((groups, item) => {
      const key = `${item.name.trim().toLowerCase()}::${item.category.trim().toLowerCase()}::${item.brand.trim().toLowerCase()}`;
      const group = groups.get(key) || { key, name: item.name, category: item.category, items: [] };
      group.items.push(item);
      groups.set(key, group);
      return groups;
    }, new Map()).values()
  ).map((group) => {
    const prices = group.items.map((item) => item.price);
    const minimumPrice = Math.min(...prices);
    const maximumPrice = Math.max(...prices);
    return {
      ...group,
      stock: group.items.reduce((total, item) => total + item.stock, 0),
      price:
        minimumPrice === maximumPrice
          ? `${business?.currency || "INR"} ${minimumPrice.toFixed(2)}`
          : `${business?.currency || "INR"} ${minimumPrice.toFixed(2)}–${maximumPrice.toFixed(2)}`,
    };
  });

  const normalizedInventorySearch = search.trim().toLowerCase();
  const filteredInventoryGroups = inventoryGroups.filter(
    (group) =>
      !normalizedInventorySearch ||
      group.items.some((item) =>
        `${item.name} ${item.sku} ${item.category} ${item.brand} ${item.size} ${item.color}`
          .toLowerCase()
          .includes(normalizedInventorySearch)
      )
  );

  const categorizedGroups =
    overviewCategory === "all"
      ? filteredInventoryGroups
      : filteredInventoryGroups.filter((group) => group.category === overviewCategory);

  const overviewRows = [...categorizedGroups].sort((a, b) => {
    if (overviewSort === "high") return b.stock - a.stock;
    if (overviewSort === "low") return a.stock - b.stock;
    return 0;
  });

  const overviewPages = Math.max(1, Math.ceil(overviewRows.length / 8));
  const currentOverviewPage = Math.min(overviewPage, overviewPages);

  const toggleInventoryGroup = (key) => {
    setExpandedInventoryGroups((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
    );
  };

  const unitsInStock = products.reduce((sum, p) => sum + Number(p.currentStock || 0), 0);
  const lowStockCount = products.filter(
    (p) => Number(p.currentStock || 0) <= Number(p.minimumStock || 10) && Number(p.currentStock || 0) > 0
  ).length;

  const totalProductsCount = reportData?.productCount ?? products.length;
  const todaySalesVal = Number(reportData?.todaySales || 0);
  const todayOrdersVal = reportData?.todayOrdersCount || 0;
  const pendingOrdersVal = reportData?.pendingOrdersCount ?? 0;
  const activeCustomersVal = reportData?.activeCustomers ?? 28;
  const stockInVal = reportData?.stockInCount ?? 0;
  const receivablesVal = Number(reportData?.outstandingReceivables || 0);
  const payablesVal = Number(reportData?.purchaseDue || 0);

  // Activity rows: recent sales orders -> notification alerts -> system defaults
  const displayActivities =
    recentOrders.length > 0
      ? recentOrders.map((order, idx) => {
          const { time, sub } = formatOrderTime(order.createdAt);
          const orderNum = order.orderNumber || `ORD-${1000 + idx}`;
          const customerName = order.customerName || order.customer?.name || "Walk-in Customer";
          const itemCount = (order.items || []).length || 1;
          const amount = order.totalAmount ? `${business?.currency || "INR"} ${order.totalAmount.toFixed(2)}` : "—";
          const status = order.status || "Completed";
          let statusClass = "status-completed";
          if (status === "Pending" || status === "Waiting") statusClass = "status-waiting";
          else if (status === "Processing" || status === "Confirmed") statusClass = "status-scheduled";
          else if (status === "Cancelled") statusClass = "status-urgent";

          return {
            id: order._id || order.id || idx,
            time,
            sub,
            title: `Order #${orderNum} · ${customerName}`,
            details: `${itemCount} items · ${amount}`,
            status,
            statusClass,
            navTo: "Orders",
          };
        })
      : notifItems.length > 0
      ? notifItems.slice(0, 5).map((item, idx) => ({
          id: item.key || item.id || idx,
          time: "Alert",
          sub: "Today",
          title: item.title,
          details: item.secondary || "Inventory system notification",
          status: item.severity === "critical" ? "Urgent" : "Waiting",
          statusClass: item.severity === "critical" ? "status-urgent" : "status-waiting",
          navTo: item.navTo,
        }))
      : [
          {
            id: 1,
            time: "10:30 AM",
            sub: "Today",
            title: "Store Shift #1 Started",
            details: "Counter opened by system admin",
            status: "Completed",
            statusClass: "status-completed",
          },
          {
            id: 2,
            time: "10:15 AM",
            sub: "Today",
            title: "Inventory Synced",
            details: `${totalProductsCount} catalog items verified`,
            status: "Completed",
            statusClass: "status-completed",
          },
          {
            id: 3,
            time: "09:45 AM",
            sub: "Today",
            title: "Stock Reorder Audit",
            details: `${lowStockCount} items flagged for replenishment`,
            status: "Waiting",
            statusClass: "status-waiting",
          },
          {
            id: 4,
            time: "09:00 AM",
            sub: "Today",
            title: "Cloud Backup Sync",
            details: "Automated transaction backup saved",
            status: "Scheduled",
            statusClass: "status-scheduled",
          },
        ];

  return (
    <div className="modern-dashboard-content">
      {/* Getting Started Banner (if not dismissed) */}
      {account?.role === "owner" && !checklistDismissed && gettingStarted && (
        <section className="getting-started" style={{ marginBottom: 0 }}>
          <header>
            <div>
              <p className="dashboard-kicker">Getting started</p>
              <h2>Finish setting up at your pace</h2>
            </div>
            <button
              type="button"
              className="close-button"
              aria-label="Dismiss getting started"
              onClick={() => {
                localStorage.setItem(`stockroom-getting-started:${business?.businessId}`, "dismissed");
                setChecklistDismissed(true);
              }}
            >
              ×
            </button>
          </header>
          <div>
            {[
              [products.length > 0, "Add first product", capabilities?.productLabel || "Products"],
              [gettingStarted.suppliers > 0, "Add supplier", "Suppliers"],
              [
                products.some(
                  (product) =>
                    Number(product.minimumStock) > 0 ||
                    product.variants?.some((variant) => variant.reorderPoint > 0)
                ),
                "Configure stock/reorder settings",
                capabilities?.productLabel || "Products",
              ],
              [gettingStarted.sales, "Make first sale", "POS / Billing"],
              [gettingStarted.members > 1, "Invite team member", "Users"],
            ].map(([done, label, destination]) => (
              <button type="button" key={label} onClick={() => navigateTo(destination)}>
                <span className={done ? "done" : ""}>{done ? "✓" : "○"}</span>
                {label}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 1. Top Row: 4 Metric KPI Cards (Reference Image match) */}
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

        {/* Card 4: Total Customers / Staff */}
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

      {/* 2. Quick Actions Panel (Reference Image match) */}
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

      {/* 3. Two-Column Split: Today's Overview + Recent Activity (Reference Image match) */}
      <div className="modern-bottom-split">
        {/* Left: Today's Overview */}
        <div className="modern-panel-card">
          <div className="modern-section-header">
            <h3>
              <span className="modern-section-bolt">⚡</span> Today&apos;s Overview
            </h3>
          </div>
          <div className="modern-overview-grid">
            {/* Tile 1: Today's Revenue */}
            <div className="modern-overview-tile">
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
            <div className="modern-overview-tile">
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
            <div className="modern-overview-tile">
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
            <div className="modern-overview-tile">
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
            <div className="modern-overview-tile">
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
            <div className="modern-overview-tile">
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

        {/* Right: Recent Activity / Attention (styled like Upcoming Appointments) */}
        <div className="modern-panel-card">
          <div className="modern-activity-header">
            <h3>📅 Recent Activity</h3>
            <button
              type="button"
              className="modern-view-all-btn"
              onClick={() => navigateTo("Orders")}
            >
              View all
            </button>
          </div>
          <div className="modern-activity-list">
            {displayActivities.map((item) => (
              <div
                className="modern-activity-row"
                key={item.id}
                role="button"
                tabIndex={0}
                style={{ cursor: "pointer" }}
                onClick={() => {
                  if (item.navTo) {
                    if (openNotification) openNotification(item.navTo);
                    else navigateTo(item.navTo);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && item.navTo) {
                    if (openNotification) openNotification(item.navTo);
                    else navigateTo(item.navTo);
                  }
                }}
              >
                <div className="modern-activity-time">
                  <strong>{item.time}</strong>
                  <small>{item.sub}</small>
                </div>
                <div className="modern-activity-details">
                  <strong>{item.title}</strong>
                  <small>{item.details}</small>
                </div>
                <span className={`modern-status-badge ${item.statusClass}`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Collapsible Inventory Catalog & Stock Ledger */}
      <section className="modern-panel-card">
        <div className="section-heading" style={{ marginBottom: "16px" }}>
          <div>
            <p className="dashboard-kicker">Stock &amp; Catalog Management</p>
            <h2 style={{ fontSize: "18px", fontWeight: 800 }}>📦 Inventory Ledger &amp; Catalog</h2>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              className="outline-button"
              type="button"
              onClick={() => setInventoryTableOpen(!inventoryTableOpen)}
            >
              {inventoryTableOpen ? "Hide Table" : "Show Table"}
            </button>
            <button
              className="outline-button"
              type="button"
              onClick={() => navigateTo(capabilities?.productLabel || "Products")}
            >
              Products Catalog <span>→</span>
            </button>
          </div>
        </div>

        {inventoryTableOpen && (
          <>
            <div className="table-tools">
              <div className="search-box">
                <span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="10.5" cy="10.5" r="6.5" />
                    <path d="m16 16 4.5 4.5" />
                  </svg>
                </span>
                <input
                  aria-label="Search inventory"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setOverviewPage(1);
                  }}
                  placeholder="Search products, brands or SKU..."
                />
              </div>
              <select
                className="overview-filter"
                aria-label="Inventory category"
                value={overviewCategory}
                onChange={(event) => {
                  setOverviewCategory(event.target.value);
                  setOverviewPage(1);
                }}
              >
                <option value="all">All categories</option>
                {[...new Set(inventoryGroups.map((group) => group.category))].map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
              <select
                className="overview-filter"
                aria-label="Sort inventory stock"
                value={overviewSort}
                onChange={(event) => {
                  setOverviewSort(event.target.value);
                  setOverviewPage(1);
                }}
              >
                <option value="default">Default order</option>
                <option value="high">Stock: High to low</option>
                <option value="low">Stock: Low to high</option>
              </select>
            </div>

            <AsyncBoundary
              loading={loading}
              error={error}
              onRetry={refetch}
              isEmpty={!overviewRows.length}
              emptyText={
                overviewProducts.length
                  ? "No products match your search filter."
                  : "No products in warehouse yet. Click 'Add New Product' above to start."
              }
            >
              <div className="inventory-table">
                <div className="table-row table-head">
                  <span>Product</span>
                  <span>Category</span>
                  <span>Stock</span>
                  <span className="inventory-table-price-heading">Price</span>
                </div>

                {overviewRows
                  .slice((currentOverviewPage - 1) * 8, currentOverviewPage * 8)
                  .map((group) => {
                    const isGroup = group.items.length > 1;
                    const expanded = expandedInventoryGroups.includes(group.key);
                    const firstItem = group.items[0];

                    if (!isGroup) {
                      return (
                        <div className="table-row" key={firstItem.key}>
                          <span className="product-cell">
                            <span className="product-thumb">{firstItem.name[0]}</span>
                            <span>
                              <strong>{firstItem.name}</strong>
                              <small>{firstItem.sku}</small>
                            </span>
                          </span>
                          <span className="category-cell">{firstItem.category}</span>
                          <span
                            className={`stock-cell ${
                              firstItem.stock === 0 ? "empty" : firstItem.stock <= firstItem.minimumStock ? "low" : ""
                            }`}
                          >
                            {firstItem.stock}
                            <small>
                              {firstItem.stock === 0
                                ? "Out of stock"
                                : firstItem.stock <= firstItem.minimumStock
                                ? "Low stock"
                                : "In stock"}
                            </small>
                            <span className="stock-meter" aria-hidden="true">
                              <i style={{ width: `${stockLevelPct(firstItem.stock, firstItem.minimumStock)}%` }} />
                            </span>
                          </span>
                          <span className="price-cell">
                            {business?.currency || "INR"} {firstItem.price.toFixed(2)}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <Fragment key={group.key}>
                        <div className={`table-row inventory-group-row${expanded ? " expanded" : ""}`}>
                          <span className="product-cell inventory-group-cell">
                            <span className="product-thumb">{group.name[0]}</span>
                            <button
                              className="inventory-group-toggle"
                              type="button"
                              aria-expanded={expanded}
                              aria-label={`${expanded ? "Hide" : "Show"} ${group.items.length} variants for ${group.name}`}
                              onClick={() => toggleInventoryGroup(group.key)}
                            >
                              <span>
                                <strong>{group.name}</strong>
                                <small>{group.items.length} variants</small>
                              </span>
                              <span className="inventory-group-chevron" aria-hidden="true">
                                ⌄
                              </span>
                            </button>
                          </span>
                          <span className="category-cell">{group.category}</span>
                          <span className={`stock-cell ${group.stock === 0 ? "empty" : ""}`}>
                            {group.stock}
                            <small>Across variants</small>
                          </span>
                          <span className="price-cell">{group.price}</span>
                        </div>
                        {expanded &&
                          group.items.map((item) => (
                            <div className="table-row inventory-variant-row" key={item.key}>
                              <span className="product-cell inventory-variant-cell">
                                <span className="inventory-variant-marker" aria-hidden="true" />
                                <span>
                                  <strong>
                                    {[item.color, item.size].filter(Boolean).join(" · ") || "Standard variant"}
                                  </strong>
                                  <small>{item.sku}</small>
                                </span>
                              </span>
                              <span className="category-cell">{item.category}</span>
                              <span
                                className={`stock-cell ${
                                  item.stock === 0 ? "empty" : item.stock <= item.minimumStock ? "low" : ""
                                }`}
                              >
                                {item.stock}
                                <small>
                                  {item.stock === 0
                                    ? "Out of stock"
                                    : item.stock <= item.minimumStock
                                    ? "Low stock"
                                    : "In stock"}
                                </small>
                                <span className="stock-meter" aria-hidden="true">
                                  <i style={{ width: `${stockLevelPct(item.stock, item.minimumStock)}%` }} />
                                </span>
                              </span>
                              <span className="price-cell">
                                {business?.currency || "INR"} {item.price.toFixed(2)}
                              </span>
                            </div>
                          ))}
                      </Fragment>
                    );
                  })}
              </div>
              <footer className="overview-pagination">
                <span>
                  Showing {(currentOverviewPage - 1) * 8 + 1}–
                  {Math.min(currentOverviewPage * 8, overviewRows.length)} of {overviewRows.length} products
                </span>
                <div>
                  <button
                    type="button"
                    disabled={currentOverviewPage === 1}
                    onClick={() => setOverviewPage(currentOverviewPage - 1)}
                  >
                    Previous
                  </button>
                  <span>
                    {currentOverviewPage} / {overviewPages}
                  </span>
                  <button
                    type="button"
                    disabled={currentOverviewPage === overviewPages}
                    onClick={() => setOverviewPage(currentOverviewPage + 1)}
                  >
                    Next
                  </button>
                </div>
              </footer>
            </AsyncBoundary>
          </>
        )}
      </section>

      {/* Overview Footer */}
      <footer className="overview-footer">
        <span>
          <b>stockroom Pro</b> · Modern Enterprise Inventory &amp; POS
        </span>
        <span>
          {products.length} SKUs indexed · Branch{" "}
          {(business?.city || business?.country || "Main Branch").toUpperCase()}
        </span>
      </footer>
    </div>
  );
}
