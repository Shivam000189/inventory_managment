import { Fragment, useState } from "react";
import AsyncBoundary from "../../../components/feedback/AsyncBoundary.jsx";
import "../overview-dashboard.css";

export default function InventoryTable({
  inventoryTableOpen = true,
  setInventoryTableOpen: _setInventoryTableOpen,
  capabilities,
  navigateTo,
  search,
  setSearch,
  setOverviewPage,
  overviewCategory,
  setOverviewCategory,
  inventoryGroups = [],
  overviewSort,
  setOverviewSort,
  loading,
  error,
  refetch,
  overviewRows = [],
  overviewProducts = [],
  currentOverviewPage = 1,
  overviewPages: _overviewPages,
  expandedInventoryGroups = [],
  toggleInventoryGroup,
  _stockLevelPct,
  _business,
}) {
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredRows = overviewRows.filter((group) => {
    if (statusFilter === "all") return true;
    const totalStock = group.stock ?? (group.items?.[0]?.stock || 0);
    const minStock = group.items?.[0]?.minimumStock || 10;
    if (statusFilter === "out") return totalStock === 0;
    if (statusFilter === "low") return totalStock > 0 && totalStock <= minStock;
    if (statusFilter === "in") return totalStock > minStock;
    return true;
  });

  const effectivePages = Math.max(1, Math.ceil(filteredRows.length / 8));
  const effectivePage = Math.min(currentOverviewPage, effectivePages);

  const currentItems = filteredRows.slice(
    (effectivePage - 1) * 8,
    effectivePage * 8
  );

  const formatPrice = (priceVal) => {
    const num = Number(priceVal || 0);
    return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const displayPrice = (priceStr) => {
    if (!priceStr && priceStr !== 0) return "₹0.00";
    if (typeof priceStr === "string") {
      return priceStr.replace("INR ", "₹");
    }
    return formatPrice(priceStr);
  };

  if (!inventoryTableOpen) return null;

  return (
    <section className="modern-panel-card content-list-panel">
      {/* Top Header Row matching Reference Image */}
      <div className="content-list-header">
        <div className="content-list-title-wrap">
          <h2 className="content-list-title">
            Inventory Catalog{" "}
            <span className="content-list-count">
              ({overviewProducts.length || filteredRows.length})
            </span>
          </h2>
        </div>

        {/* Search + Category + Status + Action Controls */}
        <div className="content-list-toolbar">
          {/* Search with left-aligned icon */}
          <div className="content-list-search">
            <svg
              className="content-list-search-icon"
              viewBox="0 0 24 24"
              width="15"
              height="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              className="content-list-search-input"
              aria-label="Search inventory"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setOverviewPage(1);
              }}
              placeholder="Search..."
            />
          </div>

          {/* Category Dropdown */}
          <select
            className="content-list-select"
            aria-label="Filter by category"
            value={overviewCategory}
            onChange={(event) => {
              setOverviewCategory(event.target.value);
              setOverviewPage(1);
            }}
          >
            <option value="all">All Categories</option>
            {[...new Set(inventoryGroups.map((g) => g.category).filter(Boolean))].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            className="content-list-select"
            aria-label="Filter by stock status"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setOverviewPage(1);
            }}
          >
            <option value="all">Status</option>
            <option value="in">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>

          {/* Order / Sort */}
          <select
            className="content-list-select"
            aria-label="Sort inventory stock"
            value={overviewSort}
            onChange={(event) => {
              setOverviewSort(event.target.value);
              setOverviewPage(1);
            }}
          >
            <option value="default">Default Order</option>
            <option value="high">Stock: High to Low</option>
            <option value="low">Stock: Low to High</option>
          </select>

          {/* New Product Button */}
          <button
            type="button"
            className="content-list-action-btn"
            onClick={() => navigateTo(capabilities?.productLabel || "Products")}
          >
            {capabilities?.productLabel ? `+ New ${capabilities.productLabel.slice(0, -1)}` : " New Product"}
          </button>
        </div>
      </div>

      {/* Table Container */}
      <AsyncBoundary
        loading={loading}
        error={error}
        onRetry={refetch}
        isEmpty={!filteredRows.length}
        emptyText={
          overviewProducts.length
            ? "No products match your search or filter."
            : "No products in warehouse yet. Click '+ New Product' above to start."
        }
      >
        <div className="content-list-table-wrap">
          <table className="content-list-table">
            <thead>
              <tr>
                <th style={{ width: "32%" }}>Product Name</th>
                <th style={{ width: "18%" }}>Category</th>
                <th style={{ width: "14%" }}>Unit Price</th>
                <th style={{ width: "16%" }}>Stock Level</th>
                <th style={{ width: "12%" }}>Status</th>
                <th style={{ width: "8%", textAlign: "right", paddingRight: "16px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((group) => {
                const isGroup = group.items.length > 1;
                const expanded = expandedInventoryGroups.includes(group.key);
                const firstItem = group.items[0];

                if (!isGroup) {
                  const isOutOfStock = firstItem.stock === 0;
                  const isLowStock =
                    firstItem.stock <= (firstItem.minimumStock || 10) && !isOutOfStock;
                  const pillClass = isOutOfStock
                    ? "status-pill-out"
                    : isLowStock
                    ? "status-pill-low"
                    : "status-pill-instock";
                  const statusText = isOutOfStock
                    ? "Out of Stock"
                    : isLowStock
                    ? "Low Stock"
                    : "In Stock";

                  return (
                    <tr key={firstItem.key}>
                      <td className="cl-cell-product">
                        <div className="cl-product-name">{firstItem.name}</div>
                        <div className="cl-product-meta">
                          <span className="cl-product-sku">SKU: {firstItem.sku || firstItem.key.slice(-6)}</span>
                          {firstItem.brand && (
                            <span className="cl-product-brand"> · {firstItem.brand}</span>
                          )}
                        </div>
                      </td>
                      <td className="cl-cell-category">
                        {firstItem.category || "General"}
                      </td>
                      <td className="cl-cell-price">
                        {formatPrice(firstItem.price)}
                      </td>
                      <td className="cl-cell-stock">
                        <span className="cl-stock-value">{firstItem.stock}</span>
                        <span className="cl-stock-label"> units</span>
                      </td>
                      <td className="cl-cell-status">
                        <span className={`content-status-pill ${pillClass}`}>
                          {statusText}
                        </span>
                      </td>
                      <td className="cl-cell-actions" style={{ textAlign: "right", paddingRight: "16px" }}>
                        <div className="cl-actions-wrapper">
                          <button
                            type="button"
                            className="cl-dots-btn"
                            title="Manage product"
                            aria-label={`Manage ${firstItem.name}`}
                            onClick={() =>
                              navigateTo(capabilities?.productLabel || "Products")
                            }
                          >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                              <circle cx="5" cy="12" r="1.75" />
                              <circle cx="12" cy="12" r="1.75" />
                              <circle cx="19" cy="12" r="1.75" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                // Multi-variant group row
                const groupOutOfStock = group.stock === 0;
                const groupLowStock = group.stock <= 10 && !groupOutOfStock;
                const groupPillClass = groupOutOfStock
                  ? "status-pill-out"
                  : groupLowStock
                  ? "status-pill-low"
                  : "status-pill-variant";
                const groupStatusText = groupOutOfStock
                  ? "Out of Stock"
                  : `${group.items.length} Variants`;

                return (
                  <Fragment key={group.key}>
                    <tr className={`cl-group-row ${expanded ? "expanded" : ""}`}>
                      <td className="cl-cell-product">
                        <button
                          type="button"
                          className="cl-group-toggle-btn"
                          onClick={() => toggleInventoryGroup(group.key)}
                          aria-expanded={expanded}
                        >
                          <span className="cl-product-name">{group.name}</span>
                          <span className="cl-group-chevron" aria-hidden="true">
                            {expanded ? "▴" : "▾"}
                          </span>
                        </button>
                        <div className="cl-product-meta">
                          <span className="cl-product-sku">{firstItem.sku || group.key.slice(-6)}</span>
                          <span className="cl-product-brand"> · {group.items.length} variants available</span>
                        </div>
                      </td>
                      <td className="cl-cell-category">{group.category}</td>
                      <td className="cl-cell-price">{displayPrice(group.price)}</td>
                      <td className="cl-cell-stock">
                        <span className="cl-stock-value">{group.stock}</span>
                        <span className="cl-stock-label"> total</span>
                      </td>
                      <td className="cl-cell-status">
                        <span className={`content-status-pill ${groupPillClass}`}>
                          {groupStatusText}
                        </span>
                      </td>
                      <td className="cl-cell-actions" style={{ textAlign: "right", paddingRight: "16px" }}>
                        <div className="cl-actions-wrapper">
                          <button
                            type="button"
                            className="cl-dots-btn"
                            title="Manage product"
                            aria-label={`Manage ${group.name}`}
                            onClick={() =>
                              navigateTo(capabilities?.productLabel || "Products")
                            }
                          >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                              <circle cx="5" cy="12" r="1.75" />
                              <circle cx="12" cy="12" r="1.75" />
                              <circle cx="19" cy="12" r="1.75" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expanded &&
                      group.items.map((item) => {
                        const itemOut = item.stock === 0;
                        const itemLow = item.stock <= (item.minimumStock || 5) && !itemOut;
                        const itemClass = itemOut
                          ? "status-pill-out"
                          : itemLow
                          ? "status-pill-low"
                          : "status-pill-instock";
                        const itemText = itemOut
                          ? "Out of Stock"
                          : itemLow
                          ? "Low Stock"
                          : "In Stock";

                        return (
                          <tr key={item.key} className="cl-variant-subrow">
                            <td className="cl-cell-product" style={{ paddingLeft: "28px" }}>
                              <span className="cl-subrow-arrow">↳</span>{" "}
                              <span className="cl-subrow-title">
                                {[item.color, item.size].filter(Boolean).join(" · ") || "Standard"}
                              </span>
                              <div className="cl-product-meta" style={{ paddingLeft: "16px" }}>
                                <span className="cl-product-sku">{item.sku}</span>
                              </div>
                            </td>
                            <td className="cl-cell-category">{item.category}</td>
                            <td className="cl-cell-price">{formatPrice(item.price)}</td>
                            <td className="cl-cell-stock">
                              <span className="cl-stock-value">{item.stock}</span>
                              <span className="cl-stock-label"> units</span>
                            </td>
                            <td className="cl-cell-status">
                              <span className={`content-status-pill ${itemClass}`}>
                                {itemText}
                              </span>
                            </td>
                            <td className="cl-cell-actions" style={{ textAlign: "right", paddingRight: "16px" }}>
                              <div className="cl-actions-wrapper">
                                <button
                                  type="button"
                                  className="cl-dots-btn"
                                  title="View variant"
                                  onClick={() =>
                                    navigateTo(capabilities?.productLabel || "Products")
                                  }
                                >
                                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                                    <circle cx="5" cy="12" r="1.75" />
                                    <circle cx="12" cy="12" r="1.75" />
                                    <circle cx="19" cy="12" r="1.75" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination footer matching Page 1 of 4 and Previous / Next */}
        <footer className="content-list-pagination">
          <span className="cl-page-info">
            Page {effectivePage} of {effectivePages}
          </span>
          <div className="cl-page-nav">
            <button
              type="button"
              className="cl-page-btn"
              disabled={effectivePage <= 1}
              onClick={() => setOverviewPage(effectivePage - 1)}
            >
              Previous
            </button>
            <button
              type="button"
              className="cl-page-btn"
              disabled={effectivePage >= effectivePages}
              onClick={() => setOverviewPage(effectivePage + 1)}
            >
              Next
            </button>
          </div>
        </footer>
      </AsyncBoundary>
    </section>
  );
}
