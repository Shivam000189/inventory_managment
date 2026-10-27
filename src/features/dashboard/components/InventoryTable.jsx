import { Fragment, useState } from "react";
import AsyncBoundary from "../../../components/feedback/AsyncBoundary.jsx";

export default function InventoryTable({
  inventoryTableOpen,
  setInventoryTableOpen,
  capabilities,
  navigateTo,
  search,
  setSearch,
  setOverviewPage,
  overviewCategory,
  setOverviewCategory,
  inventoryGroups,
  overviewSort,
  setOverviewSort,
  loading,
  error,
  refetch,
  overviewRows,
  overviewProducts = [],
  currentOverviewPage,
  overviewPages,
  expandedInventoryGroups,
  toggleInventoryGroup,
  _stockLevelPct,
  _business,
}) {
  const [selectedKeys, setSelectedKeys] = useState([]);

  const currentItems = overviewRows.slice(
    (currentOverviewPage - 1) * 8,
    currentOverviewPage * 8
  );

  const allCurrentSelected =
    currentItems.length > 0 &&
    currentItems.every((group) => selectedKeys.includes(group.key));

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedKeys((prev) => [
        ...new Set([...prev, ...currentItems.map((group) => group.key)]),
      ]);
    } else {
      setSelectedKeys((prev) =>
        prev.filter((k) => !currentItems.some((group) => group.key === k))
      );
    }
  };

  const toggleSelectItem = (key) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  return (
    <section className="modern-panel-card invoice-style-panel">
      {/* Header bar with toggle */}
      <div className="section-heading" style={{ marginBottom: "20px" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 800, display: "flex", alignItems: "center", gap: "12px", margin: 0 }}>
            <span
              className="inventory-heading-icon"
              aria-hidden="true"
              style={{
                fontSize: "42px",
                lineHeight: 1,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                verticalAlign: "middle",
              }}
            >
              📦
            </span>
            <span>Inventory Ledger &amp; Catalog</span>
          </h2>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            className="outline-button"
            type="button"
            onClick={() => setInventoryTableOpen(!inventoryTableOpen)}
          >
            {inventoryTableOpen ? "Hide Table" : "Show Table"}
          </button>
        </div>
      </div>

      {inventoryTableOpen && (
        <>
          {/* Controls Row: Search + Filters + Pill Action Button */}
          <div className="invoice-controls-row">
            <div className="invoice-controls-left">
              <div className="invoice-search-wrap">
                <input
                  type="text"
                  className="invoice-search-input"
                  aria-label="Search inventory"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setOverviewPage(1);
                  }}
                  placeholder="Search..."
                />
                <span className="invoice-search-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </span>
              </div>

              <select
                className="invoice-select"
                aria-label="Filter by category"
                value={overviewCategory}
                onChange={(event) => {
                  setOverviewCategory(event.target.value);
                  setOverviewPage(1);
                }}
              >
                <option value="all">All categories</option>
                {[...new Set(inventoryGroups.map((g) => g.category))].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                className="invoice-select"
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

            <button
              type="button"
              className="invoice-primary-btn"
              onClick={() => navigateTo(capabilities?.productLabel || "Products")}
            >
              {capabilities?.productLabel ? `New ${capabilities.productLabel.slice(0, -1)}` : "New Product"}
            </button>
          </div>

          {/* 3. The Table */}
          <AsyncBoundary
            loading={loading}
            error={error}
            onRetry={refetch}
            isEmpty={!overviewRows.length}
            emptyText={
              overviewProducts.length
                ? "No products match your search filter."
                : "No products in warehouse yet. Click 'New Product' above to start."
            }
          >
            <div className="invoice-table-wrap">
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th style={{ width: "42px" }}>
                      <input
                        type="checkbox"
                        className="invoice-checkbox"
                        aria-label="Select all products"
                        checked={allCurrentSelected}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th style={{ width: "95px" }}>Id</th>
                    <th>Bill From</th>
                    <th>Bill To</th>
                    <th>Total Cost</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right", paddingRight: "24px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((group) => {
                    const isGroup = group.items.length > 1;
                    const expanded = expandedInventoryGroups.includes(group.key);
                    const firstItem = group.items[0];
                    const isSelected = selectedKeys.includes(group.key);

                    if (!isGroup) {
                      const isOutOfStock = firstItem.stock === 0;
                      const isLowStock =
                        firstItem.stock <= firstItem.minimumStock && !isOutOfStock;
                      const pillClass = isOutOfStock
                        ? "pill-out"
                        : isLowStock
                        ? "pill-pending"
                        : "pill-delivered";
                      const statusText = isOutOfStock
                        ? "Out of Stock"
                        : isLowStock
                        ? "Pending"
                        : "Delivered";

                      return (
                        <tr key={firstItem.key} className={isSelected ? "is-selected" : ""}>
                          <td>
                            <input
                              type="checkbox"
                              className="invoice-checkbox"
                              aria-label={`Select ${firstItem.name}`}
                              checked={isSelected}
                              onChange={() => toggleSelectItem(group.key)}
                            />
                          </td>
                          <td className="invoice-cell-id">
                            <strong>{firstItem.sku || firstItem.key.slice(-5)}</strong>
                          </td>
                          <td className="invoice-cell-name">
                            <span className="invoice-product-title">{firstItem.name}</span>
                            {firstItem.brand && (
                              <small className="invoice-product-sub">{firstItem.brand}</small>
                            )}
                          </td>
                          <td className="invoice-cell-category">
                            {firstItem.category}
                          </td>
                          <td className="invoice-cell-cost">
                            {firstItem.price.toFixed(2)}
                          </td>
                          <td>
                            <span className={`invoice-pill ${pillClass}`}>
                              {statusText}
                            </span>
                          </td>
                          <td style={{ textAlign: "right", paddingRight: "20px" }}>
                            <div className="invoice-actions-cell">
                              <button
                                type="button"
                                className="invoice-action-btn action-edit"
                                title="Edit product in catalog"
                                aria-label={`Edit ${firstItem.name}`}
                                onClick={() =>
                                  navigateTo(capabilities?.productLabel || "Products")
                                }
                              >
                                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                className="invoice-action-btn action-view"
                                title="View product details"
                                aria-label={`View ${firstItem.name}`}
                                onClick={() =>
                                  navigateTo(capabilities?.productLabel || "Products")
                                }
                              >
                                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                className="invoice-action-btn action-delete"
                                title="Delete product in catalog"
                                aria-label={`Delete ${firstItem.name}`}
                                onClick={() =>
                                  navigateTo(capabilities?.productLabel || "Products")
                                }
                              >
                                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    // Multi-variant group row
                    return (
                      <Fragment key={group.key}>
                        <tr className={`invoice-group-row ${expanded ? "expanded" : ""} ${isSelected ? "is-selected" : ""}`}>
                          <td>
                            <input
                              type="checkbox"
                              className="invoice-checkbox"
                              aria-label={`Select ${group.name}`}
                              checked={isSelected}
                              onChange={() => toggleSelectItem(group.key)}
                            />
                          </td>
                          <td className="invoice-cell-id">
                            <strong>{firstItem.sku || group.key.slice(-5)}</strong>
                          </td>
                          <td className="invoice-cell-name">
                            <button
                              type="button"
                              className="invoice-group-btn"
                              onClick={() => toggleInventoryGroup(group.key)}
                              aria-expanded={expanded}
                            >
                              <span className="invoice-product-title">{group.name}</span>
                              <span className="invoice-group-arrow" aria-hidden="true">
                                {expanded ? "▲" : "▼"}
                              </span>
                            </button>
                          </td>
                          <td className="invoice-cell-category">{group.category}</td>
                          <td className="invoice-cell-cost">{group.price}</td>
                          <td>
                            <span className="invoice-pill pill-shipped">
                              {group.items.length} Variants
                            </span>
                          </td>
                          <td style={{ textAlign: "right", paddingRight: "20px" }}>
                            <div className="invoice-actions-cell">
                              <button
                                type="button"
                                className="invoice-action-btn action-edit"
                                title="Edit group in catalog"
                                aria-label={`Edit ${group.name}`}
                                onClick={() =>
                                  navigateTo(capabilities?.productLabel || "Products")
                                }
                              >
                                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                className="invoice-action-btn action-view"
                                title="Toggle variant breakdown"
                                aria-label={`View variants of ${group.name}`}
                                onClick={() => toggleInventoryGroup(group.key)}
                              >
                                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                className="invoice-action-btn action-delete"
                                title="Delete group in catalog"
                                aria-label={`Delete ${group.name}`}
                                onClick={() =>
                                  navigateTo(capabilities?.productLabel || "Products")
                                }
                              >
                                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                        {expanded &&
                          group.items.map((item) => (
                            <tr key={item.key} className="invoice-variant-subrow">
                              <td></td>
                              <td
                                className="invoice-cell-id"
                                style={{ color: "var(--ov-muted, #94a3b8)", fontSize: "11px" }}
                              >
                                {item.sku}
                              </td>
                              <td
                                className="invoice-cell-name"
                                style={{ paddingLeft: "32px" }}
                              >
                                ↳ {[item.color, item.size].filter(Boolean).join(" · ") || "Standard"}
                              </td>
                              <td className="invoice-cell-category">{item.category}</td>
                              <td className="invoice-cell-cost">{item.price.toFixed(2)}</td>
                              <td>
                                <span
                                  className={`invoice-pill ${
                                    item.stock === 0
                                      ? "pill-out"
                                      : item.stock <= item.minimumStock
                                      ? "pill-pending"
                                      : "pill-delivered"
                                  }`}
                                >
                                  {item.stock === 0
                                    ? "Out of Stock"
                                    : item.stock <= item.minimumStock
                                    ? "Low Stock"
                                    : "In Stock"}
                                </span>
                              </td>
                              <td style={{ textAlign: "right", paddingRight: "20px" }}>
                                <div className="invoice-actions-cell">
                                  <button
                                    type="button"
                                    className="invoice-action-btn action-view"
                                    title="View variant"
                                    onClick={() =>
                                      navigateTo(capabilities?.productLabel || "Products")
                                    }
                                  >
                                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                      <circle cx="12" cy="12" r="3" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <footer className="overview-pagination invoice-pagination">
              <span>
                Showing {(currentOverviewPage - 1) * 8 + 1}–
                {Math.min(currentOverviewPage * 8, overviewRows.length)} of{" "}
                {overviewRows.length} products
              </span>
              <div className="invoice-page-buttons">
                <button
                  type="button"
                  className="invoice-page-btn"
                  disabled={currentOverviewPage === 1}
                  onClick={() => setOverviewPage(currentOverviewPage - 1)}
                >
                  Previous
                </button>
                <span className="invoice-page-num">
                  {currentOverviewPage} / {overviewPages}
                </span>
                <button
                  type="button"
                  className="invoice-page-btn"
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
  );
}
