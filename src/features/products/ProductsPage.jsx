import { useCallback, useEffect, useMemo, useState } from "react";
import { productApi } from "../../api/productApi.js";
import { useResource } from "../../hooks/useResource.js";
import { resolveBusinessCapabilities } from "../../../shared/industryConfig.js";
import AsyncBoundary from "../../components/feedback/AsyncBoundary.jsx";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog.jsx";
import ProductImportPage from "../product-import/ProductImportPage.jsx";
import "../../styles/products-catalog.css";

function Products({ business, account }) {
  const loadProducts = useCallback(() => productApi.list(), []);
  const {
    data: products,
    loading,
    error,
    refetch,
    setData,
  } = useResource(loadProducts, [], []);
  const [category, setCategory] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const capabilities = useMemo(
    () => business?.capabilities || resolveBusinessCapabilities(business || {}),
    [business]
  );
  const isPharmacy =
    business?.industry === "pharmacy" ||
    capabilities.productLabel === "Medicines" ||
    (typeof window !== "undefined" && window.location.pathname.includes("/medicines"));
  const itemLabel = isPharmacy ? "Medicine" : "Product";
  const itemsLabel = isPharmacy ? "Medicines" : "Products";
  const allowedFields = useMemo(
    () => new Set(capabilities.productFields || []),
    [capabilities]
  );

  const canCreate = account.role === "owner" || account.permissions?.includes("create_product");
  const canEdit = account.role === "owner" || account.permissions?.includes("edit_product");
  const canDelete = account.role === "owner" || account.permissions?.includes("delete_product");

  useEffect(() => {
    if (!isImportOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsImportOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isImportOpen]);

  const visibleProducts = products.filter((product) => {
    const matchesSearch =
      !search.trim() ||
      [
        product.name,
        product.sku,
        product.category,
        product.genericName,
        product.batchNumber,
        product.manufacturer,
        product.brand,
        product.barcode,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesCategory = category === "all" || product.category === category;
    const matchesStock =
      stockFilter === "all" ||
      (stockFilter === "in"
        ? product.currentStock > 0
        : product.currentStock <= product.minimumStock);

    return matchesSearch && matchesCategory && matchesStock;
  });

  const pages = Math.max(1, Math.ceil(visibleProducts.length / pageSize));
  const currentPage = Math.min(page, pages);
  const pageProducts = visibleProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const money = (value) => `${business.currency === 'INR' ? '₹' : business.currency || ''}${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  const toggleSelected = (id) => setSelected((list) => list.includes(id) ? list.filter((value) => value !== id) : [...list, id]);
  const exportSheet = (selectionOnly = false) => {
    const rows = selectionOnly ? visibleProducts.filter((product) => selected.includes(product.productId)) : visibleProducts;
    const cell = (value) => `"${String(value ?? '').replace(/^[=+@-]/, "'$&").replaceAll('"', '""')}"`;
    const values = [
      ['Product / Medicine', 'Generic Name', 'Batch', 'Expiry', 'SKU', 'Category', 'Stock', 'Price', 'MRP', 'Currency'],
      ...rows.map((product) => [
        product.name,
        product.genericName || '',
        product.batchNumber || '',
        product.expiryDate ? String(product.expiryDate).slice(0, 10) : '',
        product.sku,
        product.category,
        product.currentStock,
        product.sellingPrice,
        product.mrp || '',
        business.currency,
      ]),
    ];
    const url = URL.createObjectURL(new Blob(['\uFEFF' + values.map((row) => row.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a'); link.href = url; link.download = `${itemsLabel.toLowerCase()}.csv`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;
    const data = new FormData(event.currentTarget);
    const rawPayload = {
      name: (data.get("name") || "").trim(),
      sku: (data.get("sku") || "").trim().toUpperCase(),
      category: (data.get("category") || "").trim(),
      brand: (data.get("brand") || "").trim(),
      genericName: (data.get("genericName") || "").trim(),
      manufacturer: (data.get("manufacturer") || "").trim(),
      batchNumber: (data.get("batchNumber") || "").trim(),
      manufacturingDate: data.get("manufacturingDate") ? String(data.get("manufacturingDate")).trim() : undefined,
      expiryDate: data.get("expiryDate") ? String(data.get("expiryDate")).trim() : undefined,
      mrp: data.get("mrp") ? Number(data.get("mrp")) : undefined,
      description: (data.get("description") || "").trim(),
      purchasePrice: Number(data.get("purchasePrice")) || 0,
      sellingPrice: Number(data.get("sellingPrice")),
      wholesalePrice: data.get("wholesalePrice") ? Number(data.get("wholesalePrice")) : undefined,
      wholesaleMinQuantity: data.get("wholesaleMinQuantity") ? Number(data.get("wholesaleMinQuantity")) : undefined,
      barcode: (data.get("barcode") || "").trim(),
      hsnCode: (data.get("hsnCode") || "").trim(),
      gstRate: data.get("gstRate") !== null ? Number(data.get("gstRate")) : 0,
      currentStock: Number(data.get("currentStock")) || 0,
      minimumStock: Number(data.get("minimumStock")) || 0,
      unit: data.get("unit") || "piece",
      supplier: (data.get("supplier") || "").trim(),
    };

    if (
      !rawPayload.name ||
      !rawPayload.sku ||
      !rawPayload.category ||
      Number.isNaN(rawPayload.sellingPrice)
    ) {
      setFormError(
        `Please complete the ${itemLabel.toLowerCase()} name, SKU, category, and retail price.`,
      );
      return;
    }

    // Only transmit keys that are allowed for this business capability
    const payload = {};
    for (const [key, val] of Object.entries(rawPayload)) {
      if (val !== undefined && (allowedFields.size === 0 || allowedFields.has(key))) {
        payload[key] = val;
      }
    }

    setSaving(true);
    setFormError("");
    try {
      const saved = editingProduct
        ? await productApi.update(editingProduct.productId, payload)
        : await productApi.create(payload);
      setData((current) =>
        editingProduct
          ? current.map((item) =>
              item.productId === saved.productId ? saved : item,
            )
          : [saved, ...current],
      );
      setIsFormOpen(false);
      setEditingProduct(null);
    } catch (caught) {
      setFormError(caught.message || `Could not save the ${itemLabel.toLowerCase()}.`);
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (productId) => {
    setConfirmDeleteId(productId);
  };
  const handleConfirmDelete = async () => {
    const productId = confirmDeleteId;
    setConfirmDeleteId(null);
    if (!productId) return;
    try {
      await productApi.remove(productId);
      setData((current) =>
        current.filter((product) => product.productId !== productId),
      );
    } catch (caught) {
      setFormError(caught.message || "Could not delete the product.");
    }
  };
  const openForm = (product = null) => {
    setEditingProduct(product);
    setFormError("");
    setIsFormOpen(true);
  };

  return (
    <section className="products-page products-catalog">
      <div className="products-toolbar">
        <div>
          <p className="dashboard-kicker">Inventory / {itemsLabel}</p>
          <h2>{itemsLabel}</h2>
          <p className="products-count">
            {products.length} {itemsLabel.toLowerCase()} in {business.name}
          </p>
        </div>
        <div className="catalog-toolbar-actions">
          <button
            className="outline-button"
            type="button"
            disabled={loading || !!error || !visibleProducts.length}
            onClick={() => exportSheet()}
          >
            ↥ Export sheet
          </button>
          {canCreate && (
            <>
              <button
                className="outline-button bulk-import-btn"
                type="button"
                onClick={() => setIsImportOpen(true)}
              >
                <span aria-hidden="true">⇧</span> Bulk import
              </button>
              <button
                className="submit-button product-add-button"
                type="button"
                onClick={() => openForm()}
              >
                Add {itemLabel.toLowerCase()} <span>+</span>
              </button>
            </>
          )}
        </div>
      </div>
      {!loading && !error && <div className="catalog-stats">
        <article><span>Total {itemsLabel}</span><strong>{products.length.toLocaleString()}</strong><small>Registered {itemsLabel.toLowerCase()} in catalog</small><b aria-hidden="true">◇</b></article>
        <article><span>Low Stock Alert</span><strong>{products.filter((product) => product.currentStock <= product.minimumStock).length} SKUs</strong><small>At or below reorder level</small><b aria-hidden="true">⚠</b></article>
        <article><span>Total Stock Quantity</span><strong>{products.reduce((total, product) => total + Number(product.currentStock || 0), 0).toLocaleString()} <em>Units</em></strong><small>Across all registered {itemsLabel.toLowerCase()}</small><b aria-hidden="true">#</b></article>
        <article><span>Inventory Valuation</span><strong>{money(products.reduce((total, product) => total + Number(product.currentStock || 0) * Number(product.purchasePrice || 0), 0))}</strong><small>At purchase cost ({business.currency})</small><b aria-hidden="true">＄</b></article>
      </div>}      <div className="products-controls">
        <div className="search-box">
          <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></svg></span>
          <input
            aria-label={`Search ${itemsLabel.toLowerCase()}`}
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            placeholder={`Search by name, ${isPharmacy ? 'generic composition, batch, ' : ''}SKU, or category`}
          />
        </div>
        <span className="business-filter">{business.industry} business</span><select aria-label="Product category" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }}><option value="all">All categories</option>{[...new Set(products.map((product) => product.category).filter(Boolean))].map((value) => <option key={value}>{value}</option>)}</select><select aria-label="Stock filter" value={stockFilter} onChange={(event) => { setStockFilter(event.target.value); setPage(1); }}><option value="all">All stock</option><option value="in">In stock (&gt;0)</option><option value="low">Low / out of stock</option></select><button className="outline-button" type="button" disabled={!visibleProducts.some((product) => selected.includes(product.productId))} onClick={() => exportSheet(true)}>Export selected</button>
      </div>
      {isFormOpen && (
        <form className="product-form" onSubmit={handleSubmit}>
          <div className="product-form-heading">
            <div>
              <p className="dashboard-kicker">
                {editingProduct ? `Update ${itemLabel.toLowerCase()}` : `New ${itemLabel.toLowerCase()}`}
              </p>
              <h3>{editingProduct ? `Edit ${itemLabel.toLowerCase()}` : `Add a ${itemLabel.toLowerCase()}`}</h3>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {!editingProduct && (
                <button
                  type="button"
                  className="outline-button"
                  style={{ minHeight: "34px", padding: "0 12px", fontSize: "11px" }}
                  onClick={() => {
                    setIsFormOpen(false);
                    setIsImportOpen(true);
                  }}
                >
                  <span aria-hidden="true">⇧</span> Bulk import
                </button>
              )}
              <button
                type="button"
                className="close-button"
                onClick={() => setIsFormOpen(false)}
                aria-label="Close form"
              >
                ×
              </button>
            </div>
          </div>
          <div className="product-form-grid">
            <div className="field-wide">
              <label htmlFor="product-name">{itemLabel} name *</label>
              <input
                id="product-name"
                name="name"
                defaultValue={editingProduct?.name || ""}
                placeholder={isPharmacy ? "e.g. Augmentin 625 Duo Tablet" : "e.g. Premium Rice"}
                required
              />
            </div>
            {(isPharmacy || allowedFields.has("genericName")) && (
              <div className="field-wide">
                <label htmlFor="product-generic">Generic composition / salt</label>
                <input
                  id="product-generic"
                  name="genericName"
                  defaultValue={editingProduct?.genericName || ""}
                  placeholder="e.g. Amoxicillin (500mg) + Clavulanic Acid (125mg)"
                />
              </div>
            )}
            <div>
              <label htmlFor="product-sku">SKU / item code *</label>
              <input
                id="product-sku"
                name="sku"
                defaultValue={editingProduct?.sku || ""}
                placeholder={isPharmacy ? "e.g. MED-AUG-625" : "e.g. RIC-001"}
                required
              />
            </div>
            <div>
              <label htmlFor="product-category">Category *</label>
              <input
                id="product-category"
                name="category"
                defaultValue={editingProduct?.category || ""}
                placeholder={isPharmacy ? "e.g. Antibiotics, Analgesics" : "e.g. Grocery"}
                required
              />
            </div>
            {(isPharmacy || allowedFields.has("manufacturer")) && (
              <div>
                <label htmlFor="product-manufacturer">Manufacturer / Pharma brand</label>
                <input
                  id="product-manufacturer"
                  name="manufacturer"
                  defaultValue={editingProduct?.manufacturer || ""}
                  placeholder="e.g. GlaxoSmithKline / Cipla"
                />
              </div>
            )}
            {(!isPharmacy || allowedFields.has("brand")) && (
              <div>
                <label htmlFor="product-brand">Brand</label>
                <input
                  id="product-brand"
                  name="brand"
                  defaultValue={editingProduct?.brand || ""}
                  placeholder="Brand name"
                />
              </div>
            )}
            {(isPharmacy || allowedFields.has("batchNumber")) && (
              <div>
                <label htmlFor="product-batch">Batch number</label>
                <input
                  id="product-batch"
                  name="batchNumber"
                  defaultValue={editingProduct?.batchNumber || ""}
                  placeholder="e.g. AUG-24B01"
                />
              </div>
            )}
            {(isPharmacy || allowedFields.has("expiryDate")) && (
              <div>
                <label htmlFor="product-expiry">Expiry date</label>
                <input
                  id="product-expiry"
                  name="expiryDate"
                  type="date"
                  defaultValue={editingProduct?.expiryDate ? new Date(editingProduct.expiryDate).toISOString().slice(0, 10) : ""}
                />
              </div>
            )}
            <div>
              <label htmlFor="product-unit">Unit</label>
              <select
                id="product-unit"
                name="unit"
                defaultValue={editingProduct?.unit || (isPharmacy ? "box" : "piece")}
              >
                {isPharmacy ? (
                  <>
                    <option>box</option>
                    <option>strip</option>
                    <option>bottle</option>
                    <option>vial</option>
                    <option>tube</option>
                    <option>piece</option>
                    <option>tablet</option>
                  </>
                ) : (
                  <>
                    <option>piece</option>
                    <option>kg</option>
                    <option>gram</option>
                    <option>litre</option>
                    <option>box</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label htmlFor="purchase-price">Purchase price ({business.currency})</label>
              <input
                id="purchase-price"
                name="purchasePrice"
                type="number"
                min="0"
                step="0.01"
                defaultValue={editingProduct?.purchasePrice || ""}
                placeholder="0.00"
              />
            </div>
            <div>
              <label htmlFor="selling-price">Retail / Selling price * ({business.currency})</label>
              <input
                id="selling-price"
                name="sellingPrice"
                type="number"
                min="0"
                step="0.01"
                defaultValue={editingProduct?.sellingPrice || ""}
                placeholder="0.00"
                required
              />
            </div>
            {(isPharmacy || allowedFields.has("mrp")) && (
              <div>
                <label htmlFor="product-mrp">MRP (Max Retail Price)</label>
                <input
                  id="product-mrp"
                  name="mrp"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={editingProduct?.mrp || ""}
                  placeholder="0.00"
                />
              </div>
            )}
            {allowedFields.has("wholesalePrice") && (
              <div>
                <label htmlFor="wholesale-price">Wholesale price ({business.currency})</label>
                <input
                  id="wholesale-price"
                  name="wholesalePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={editingProduct?.wholesalePrice || ""}
                  placeholder="0.00"
                />
              </div>
            )}
            {allowedFields.has("wholesaleMinQuantity") && (
              <div>
                <label htmlFor="wholesale-min">Wholesale minimum qty</label>
                <input
                  id="wholesale-min"
                  name="wholesaleMinQuantity"
                  type="number"
                  min="1"
                  defaultValue={editingProduct?.wholesaleMinQuantity || 10}
                />
              </div>
            )}
            <div>
              <label htmlFor="product-barcode">Barcode / EAN</label>
              <input
                id="product-barcode"
                name="barcode"
                defaultValue={editingProduct?.barcode || ""}
                placeholder="Scan or enter barcode"
              />
            </div>
            <div>
              <label htmlFor="product-hsn">HSN code</label>
              <input
                id="product-hsn"
                name="hsnCode"
                defaultValue={editingProduct?.hsnCode || (isPharmacy ? "30049099" : "")}
                placeholder={isPharmacy ? "e.g. 30041000" : "e.g. 6205"}
              />
            </div>
            <div>
              <label htmlFor="product-gst">GST rate %</label>
              <input
                id="product-gst"
                name="gstRate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                defaultValue={
                  editingProduct?.gstRate ??
                  business.settings?.defaultGstRate ??
                  (isPharmacy ? 12 : 0)
                }
              />
            </div>
            <div>
              <label htmlFor="current-stock">Current stock</label>
              <input
                id="current-stock"
                name="currentStock"
                type="number"
                min="0"
                defaultValue={editingProduct?.currentStock ?? 0}
              />
            </div>
            <div>
              <label htmlFor="minimum-stock">Minimum reorder level</label>
              <input
                id="minimum-stock"
                name="minimumStock"
                type="number"
                min="0"
                defaultValue={editingProduct?.minimumStock ?? 0}
              />
            </div>
            <div>
              <label htmlFor="supplier">Assigned Supplier</label>
              <input
                id="supplier"
                name="supplier"
                defaultValue={editingProduct?.supplier || ""}
                placeholder="Supplier name"
              />
            </div>
            <div className="field-wide">
              <label htmlFor="description">Description / Usage notes</label>
              <textarea
                id="description"
                name="description"
                defaultValue={editingProduct?.description || ""}
                placeholder="Dosage instructions, formulation or short description"
              />
            </div>
          </div>
          {formError && <p className="setup-error">{formError}</p>}
          <div className="product-form-actions">
            <button
              type="button"
              className="outline-button"
              onClick={() => setIsFormOpen(false)}
            >
              Cancel
            </button>
            <button className="submit-button" type="submit" disabled={saving}>
              {saving ? "Saving…" : `Save ${itemLabel.toLowerCase()}`} <span>→</span>
            </button>
          </div>
        </form>
      )}
      {!isFormOpen && formError && (
        <p className="form-status error">{formError}</p>
      )}
      <AsyncBoundary
        loading={loading}
        error={error}
        onRetry={refetch}
        isEmpty={!visibleProducts.length}
        emptyText={
          products.length
            ? `No ${itemsLabel.toLowerCase()} match your search.`
            : `No ${itemsLabel.toLowerCase()} yet. Add your first ${itemLabel.toLowerCase()}.`
        }
      >
        <div className="products-table">
          <div className="product-table-row product-table-head">
            <input className="catalog-check" type="checkbox" aria-label={`Select all ${itemsLabel.toLowerCase()} on this page`} checked={pageProducts.length > 0 && pageProducts.every((product) => selected.includes(product.productId))} onChange={(event) => setSelected((list) => event.target.checked ? [...new Set([...list, ...pageProducts.map((product) => product.productId)])] : list.filter((id) => !pageProducts.some((product) => product.productId === id)))} /><span>{itemLabel}</span>
            <span>Category</span>
            <span>Stock</span>
            <span>Price</span>
            <span>Actions</span>
          </div>
          {pageProducts.map((product) => (
            <div className="product-table-row" key={product.productId}><input className="catalog-check" type="checkbox" aria-label={`Select ${product.name} ${product.sku}`} checked={selected.includes(product.productId)} onChange={() => toggleSelected(product.productId)} />
              <span className="product-cell">
                <span className="product-thumb">{product.name[0]}</span>
                <span>
                  <strong>{product.name}</strong>
                  {product.genericName && (
                    <small style={{ color: 'var(--muted)', display: 'block', fontSize: '11px', fontStyle: 'italic', marginTop: '1px' }}>
                      {product.genericName}
                    </small>
                  )}
                  <small style={{ display: 'block', marginTop: '2px' }}>
                    {product.sku} · {product.unit || 'unit'} {product.batchNumber ? `· Batch ${product.batchNumber}` : ''}
                  </small>
                  {product.expiryDate && (
                    <span
                      style={{
                        display: 'inline-block',
                        fontSize: '10.5px',
                        fontWeight: 600,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        marginTop: '3px',
                        background: new Date(product.expiryDate) < new Date() ? '#fee2e2' : new Date(product.expiryDate) < new Date(Date.now() + 60*86400000) ? '#fef3c7' : '#f1f5f9',
                        color: new Date(product.expiryDate) < new Date() ? '#b91c1c' : new Date(product.expiryDate) < new Date(Date.now() + 60*86400000) ? '#b45309' : '#475569',
                      }}
                    >
                      {new Date(product.expiryDate) < new Date() ? '⚠️ Expired: ' : 'Exp: '}
                      {new Date(product.expiryDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </span>
              </span>
              <span><span className="catalog-category">{product.category}</span></span>
              <span
                className={
                  product.currentStock <= product.minimumStock
                    ? "product-stock low"
                    : "product-stock"
                }
              >
                {product.currentStock}
                <small>
                  {product.currentStock === 0
                    ? "Out of stock"
                    : product.currentStock <= product.minimumStock
                      ? "Low stock"
                      : "In stock"}
                </small>
                <i
                  className="stock-bar"
                  style={{
                    "--stock-pct": `${Math.max(4, Math.min(100, Math.round((product.currentStock / Math.max(product.minimumStock * 3, 10)) * 100)))}%`,
                  }}
                  aria-hidden="true"
                />
              </span>
              <span className="price-cell">
                <strong>{business.currency === 'INR' ? '₹' : business.currency || ''}{Number(product.sellingPrice).toFixed(2)}</strong>
                {product.mrp && Number(product.mrp) > 0 && (
                  <small style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', fontWeight: 500 }}>
                    MRP {business.currency === 'INR' ? '₹' : business.currency || ''}{Number(product.mrp).toFixed(2)}
                  </small>
                )}
              </span>
              <span className="product-actions">
                {canEdit && <button type="button" onClick={() => openForm(product)}>
                  Edit
                </button>}
                {canDelete && <button
                  type="button"
                  onClick={() => deleteProduct(product.productId)}
                >
                  Delete
                </button>}
              </span>
            </div>
          ))}
        </div>
<footer className="catalog-pagination"><span>Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, visibleProducts.length)} of {visibleProducts.length} {itemsLabel.toLowerCase()}</span><label>Rows per page <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}>{[10, 25, 50].map((size) => <option key={size}>{size}</option>)}</select></label><div><button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button><span aria-current="page">{currentPage}</span><span>of {pages}</span><button type="button" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}>Next</button></div></footer>      </AsyncBoundary>
      <ConfirmDialog
        isOpen={Boolean(confirmDeleteId)}
        title={`Delete ${itemLabel}`}
        message={`Delete this ${itemLabel.toLowerCase()}? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
      {isImportOpen && (
        <div
          className="supplier-modal-backdrop bulk-import-modal-backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsImportOpen(false);
          }}
        >
          <div
            className="bulk-import-modal-container import-shell stock-ledger-shell"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulk-import-modal-title"
          >
            <ProductImportPage
              business={business}
              isModal={true}
              onClose={() => {
                setIsImportOpen(false);
                refetch();
              }}
              onImportSuccess={() => refetch()}
            />
          </div>
        </div>
      )}
    </section>
  );
}

export default Products;


