import { useEffect, useState } from "react";
import { salesOrderApi } from "../../api/salesOrderApi.js";
import GettingStartedBanner from "./components/GettingStartedBanner.jsx";
import MetricCards from "./components/MetricCards.jsx";
import QuickActions from "./components/QuickActions.jsx";
import TodaysOverview from "./components/TodaysOverview.jsx";
import ActivityFeed from "./components/ActivityFeed.jsx";
import InventoryTable from "./components/InventoryTable.jsx";
import "./overview-dashboard.css";
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
          const customerName = order.customerName || order.customer?.name || "Walk-in Customer";
          const itemCount = (order.items || []).length || 1;
          const amount = order.totalAmount ? `${business?.currency || "INR"} ${order.totalAmount.toFixed(2)}` : "—";
          const status = order.status || "Completed";
          let statusClass = "status-completed";
          const sLower = String(status).toLowerCase();
          if (sLower.includes("cancel") || sLower.includes("refund") || sLower.includes("return")) {
            statusClass = "status-urgent";
          } else if (sLower.includes("wait") || sLower.includes("pend")) {
            statusClass = "status-waiting";
          } else if (sLower.includes("process") || sLower.includes("confirm") || sLower.includes("sched")) {
            statusClass = "status-scheduled";
          } else {
            statusClass = "status-completed";
          }

          return {
            id: order._id || order.id || idx,
            time,
            sub,
            title: customerName,
            details: `${itemCount} ${itemCount === 1 ? "item" : "items"} · ${amount}`,
            status,
            statusClass,
            navTo: "Orders",
          };
        })
      : notifItems.length > 0
      ? notifItems.slice(0, 5).map((item, idx) => {
          const sLower = String(item.severity || "").toLowerCase();
          const isUrgent = sLower === "critical" || sLower.includes("cancel");
          return {
            id: item.key || item.id || idx,
            time: "Alert",
            sub: "Today",
            title: item.title,
            details: item.secondary || "Inventory system notification",
            status: isUrgent ? "Urgent" : "Waiting",
            statusClass: isUrgent ? "status-urgent" : "status-waiting",
            navTo: item.navTo,
          };
        })
      : [
          {
            id: 1,
            time: "10:30 AM",
            sub: "Today",
            title: "Rahul Sharma",
            details: `3 items · ${business?.currency || "INR"} 1,450.00`,
            status: "Completed",
            statusClass: "status-completed",
            navTo: "Orders",
          },
          {
            id: 2,
            time: "10:15 AM",
            sub: "Today",
            title: "Priya Patel",
            details: `1 item · ${business?.currency || "INR"} 850.00`,
            status: "Completed",
            statusClass: "status-completed",
            navTo: "Orders",
          },
          {
            id: 3,
            time: "09:45 AM",
            sub: "Today",
            title: "Walk-in Customer",
            details: `2 items · ${business?.currency || "INR"} 320.00`,
            status: "Waiting",
            statusClass: "status-waiting",
            navTo: "Orders",
          },
          {
            id: 4,
            time: "09:00 AM",
            sub: "Today",
            title: "Amit Verma",
            details: `5 items · ${business?.currency || "INR"} 4,200.00`,
            status: "Scheduled",
            statusClass: "status-scheduled",
            navTo: "Orders",
          },
          {
            id: 5,
            time: "Yesterday",
            sub: "Evening",
            title: "Sneha Reddy",
            details: `1 item · ${business?.currency || "INR"} 990.00`,
            status: "Cancelled",
            statusClass: "status-urgent",
            navTo: "Orders",
          },
        ];

  return (
    <div className="modern-dashboard-content">
      {/* Getting Started Banner */}
      <GettingStartedBanner
        account={account}
        checklistDismissed={checklistDismissed}
        setChecklistDismissed={setChecklistDismissed}
        gettingStarted={gettingStarted}
        products={products}
        capabilities={capabilities}
        navigateTo={navigateTo}
        business={business}
      />

      {/* 1. Top Row: 4 Metric KPI Cards */}
      <MetricCards
        totalProductsCount={totalProductsCount}
        unitsInStock={unitsInStock}
        todaySalesVal={todaySalesVal}
        pendingOrdersVal={pendingOrdersVal}
        activeCustomersVal={activeCustomersVal}
        business={business}
        capabilities={capabilities}
        navigateTo={navigateTo}
      />

      {/* 2. Quick Actions Panel */}
      <QuickActions navigateTo={navigateTo} />

      {/* 3. Two-Column Split: Today's Overview + Recent Activity */}
      <div className="modern-bottom-split">
        <TodaysOverview
          todaySalesVal={todaySalesVal}
          todayOrdersVal={todayOrdersVal}
          reportData={reportData}
          lowStockCount={lowStockCount}
          stockInVal={stockInVal}
          receivablesVal={receivablesVal}
          payablesVal={payablesVal}
          business={business}
          navigateTo={navigateTo}
        />
        <ActivityFeed
          displayActivities={displayActivities}
          navigateTo={navigateTo}
          openNotification={openNotification}
        />
      </div>

      {/* 4. Collapsible Inventory Catalog & Stock Ledger */}
      <InventoryTable
        inventoryTableOpen={inventoryTableOpen}
        setInventoryTableOpen={setInventoryTableOpen}
        capabilities={capabilities}
        navigateTo={navigateTo}
        search={search}
        setSearch={setSearch}
        setOverviewPage={setOverviewPage}
        overviewCategory={overviewCategory}
        setOverviewCategory={setOverviewCategory}
        inventoryGroups={inventoryGroups}
        overviewSort={overviewSort}
        setOverviewSort={setOverviewSort}
        loading={loading}
        error={error}
        refetch={refetch}
        overviewRows={overviewRows}
        overviewProducts={overviewProducts}
        currentOverviewPage={currentOverviewPage}
        overviewPages={overviewPages}
        expandedInventoryGroups={expandedInventoryGroups}
        toggleInventoryGroup={toggleInventoryGroup}
        stockLevelPct={stockLevelPct}
        business={business}
      />

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
