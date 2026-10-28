import { useCallback, useMemo, useState } from "react";
import { productApi } from "../../api/productApi.js";
import { useResource } from "../../hooks/useResource.js";
import { resolveBusinessCapabilities } from "../../../shared/industryConfig.js";
import {
  Button,
  Badge,
  DataTable,
  Modal,
  ConfirmDialog,
  Field,
  Input,
  Select,
  Textarea,
  FormStatus,
  Icon,
} from "../../components/ui/index.js";
import ProductImportPage from "../product-import/ProductImportPage.jsx";
import "./ProductsPage.css";

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
  const [sortOrder, setSortOrder] = useState("default");
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

  const [nowTimestamp] = useState(() => Date.now());

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

  const visibleProducts = useMemo(() => {
    let list = products.filter((product) => {
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
      const stock = Number(product.currentStock || 0);
      const min = Number(product.minimumStock || 0);

      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "in" && stock > min) ||
        (stockFilter === "low" && stock <= min);

      return matchesSearch && matchesCategory && matchesStock;
    });

    if (sortOrder === "price-high") {
      list = [...list].sort((a, b) => Number(b.sellingPrice || 0) - Number(a.sellingPrice || 0));
    } else if (sortOrder === "price-low") {
      list = [...list].sort((a, b) => Number(a.sellingPrice || 0) - Number(b.sellingPrice || 0));
    } else if (sortOrder === "stock-high") {
      list = [...list].sort((a, b) => Number(b.currentStock || 0) - Number(a.currentStock || 0));
    } else if (sortOrder === "stock-low") {
      list = [...list].sort((a, b) => Number(a.currentStock || 0) - Number(b.currentStock || 0));
    }

    return list;
  }, [products, search, category, stockFilter, sortOrder]);

  const money = useCallback(
    (value) => {
      const sym = business.currency === "INR" ? "₹" : business.currency || "";
      return `${sym}${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
    },
    [business.currency]
  );

  const stats = useMemo(() => {
    let inStockCount = 0;
    let lowStockCount = 0;
    let outStockCount = 0;
    let totalQty = 0;
    let valuation = 0;

    for (const p of products) {
      const stock = Number(p.currentStock || 0);
      const min = Number(p.minimumStock || 0);
      totalQty += stock;
      valuation += stock * Number(p.purchasePrice || 0);

      if (stock === 0) {
        outStockCount += 1;
        lowStockCount += 1;
      } else if (stock <= min) {
        lowStockCount += 1;
      } else {
        inStockCount += 1;
      }
    }

    return { inStockCount, lowStockCount, outStockCount, totalQty, valuation };
  }, [products]);

  const exportSheet = (selectionOnly = false) => {
    const rows = selectionOnly
      ? visibleProducts.filter((product) => selected.includes(product.productId))
      : visibleProducts;
    const cell = (value) => `"${String(value ?? "").replace(/^[=+@-]/, "'$&").replaceAll('"', '""')}"`;
    const values = [
      ["Product / Medicine", "Generic Name", "Batch", "Expiry", "SKU", "Category", "Stock", "Price", "MRP", "Currency"],
      ...rows.map((product) => [
        product.name,
        product.genericName || "",
        product.batchNumber || "",
        product.expiryDate ? String(product.expiryDate).slice(0, 10) : "",
        product.sku,
        product.category,
        product.currentStock,
        product.sellingPrice,
        product.mrp || "",
        business.currency,
      ]),
    ];
    const url = URL.createObjectURL(
      new Blob(["\uFEFF" + values.map((row) => row.map(cell).join(",")).join("\r\n")], {
        type: "text/csv;charset=utf-8;",
      })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${itemsLabel.toLowerCase()}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
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
        `Please complete the ${itemLabel.toLowerCase()} name, SKU, category, and retail price.`
      );
      return;
    }

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
          ? current.map((item) => (item.productId === saved.productId ? saved : item))
          : [saved, ...current]
      );
      setIsFormOpen(false);
      setEditingProduct(null);
    } catch (caught) {
      setFormError(caught.message || `Could not save the ${itemLabel.toLowerCase()}.`);
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = (productId) => {
    setConfirmDeleteId(productId);
  };

  const handleConfirmDelete = async () => {
    const productId = confirmDeleteId;
    setConfirmDeleteId(null);
    if (!productId) return;
    try {
      await productApi.remove(productId);
      setData((current) => current.filter((product) => product.productId !== productId));
    } catch (caught) {
      setFormError(caught.message || "Could not delete the product.");
    }
  };

  const openForm = (product = null) => {
    setEditingProduct(product);
    setFormError("");
    setIsFormOpen(true);
  };

  const categories = useMemo(() => {
    return [...new Set(products.map((p) => p.category).filter(Boolean))];
  }, [products]);

  const columns = useMemo(() => {
    return [
      {
        key: "sku",
        header: "Id",
        mobileLabel: "Id",
        width: "80px",
        render: (product, index) => (
          <span className="ledger-cell-id">
            {product.sku ||
              (product.productId
                ? String(product.productId).replace(/\D/g, "").slice(-3) ||
                  String(product.productId).slice(-5)
                : 101 + index)}
          </span>
        ),
      },
      {
        key: "product",
        header: isPharmacy ? "Medicine" : "Bill From",
        mobileLabel: itemLabel,
        render: (product) => {
          let expiryInfo = null;
          if (product.expiryDate) {
            const expTime = new Date(product.expiryDate).getTime();
            if (!Number.isNaN(expTime)) {
              const isExpired = expTime < nowTimestamp;
              const isSoon = expTime < nowTimestamp + 60 * 86400000;
              expiryInfo = {
                tone: isExpired ? "danger" : isSoon ? "warning" : "neutral",
                label: `${isExpired ? "⚠️ Expired: " : "Exp: "}${new Date(product.expiryDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}`,
              };
            }
          }

          return (
            <div>
              <span className="ledger-cell-primary">{product.name}</span>
              <div
                className="ledger-cell-secondary"
                style={{
                  fontSize: "11px",
                  marginTop: "2px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  flexWrap: "wrap",
                }}
              >
                {[
                  product.genericName,
                  product.brand,
                  product.batchNumber ? `Batch ${product.batchNumber}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
                {expiryInfo && (
                  <Badge tone={expiryInfo.tone} dot size="sm">
                    {expiryInfo.label}
                  </Badge>
                )}
              </div>
            </div>
          );
        },
      },
      {
        key: "category",
        header: "Bill To",
        mobileLabel: "Category",
        render: (product) => (
          <span className="ledger-cell-secondary">
            {product.category || "General"}
          </span>
        ),
      },
      {
        key: "price",
        header: "Total Cost",
        mobileLabel: "Price",
        render: (product) => (
          <div>
            <span className="ledger-cell-cost">{money(product.sellingPrice)}</span>
            <div className="ledger-cell-secondary" style={{ fontSize: "11px", marginTop: "2px" }}>
              {product.currentStock} {product.unit || "units"}
              {product.mrp && Number(product.mrp) > 0 ? ` · MRP ${money(product.mrp)}` : ""}
            </div>
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        mobileLabel: "Status",
        render: (product) => {
          const stock = Number(product.currentStock || 0);
          const min = Number(product.minimumStock || 0);
          let statusType = "delivered";
          let statusLabel = "Delivered";

          if (stock === 0) {
            statusType = "danger";
            statusLabel = "Out of Stock";
          } else if (stock <= min) {
            statusType = "pending";
            statusLabel = "Pending";
          } else if (stock > min * 2) {
            statusType = "delivered";
            statusLabel = "Delivered";
          } else {
            statusType = "shipped";
            statusLabel = "Shipped";
          }

          return (
            <span className={`ledger-status-pill status-${statusType}`}>
              {statusLabel}
            </span>
          );
        },
      },
      {
        key: "actions",
        header: "Action",
        mobileLabel: "Action",
        align: "right",
        render: (product) => (
          <div className="ledger-actions-group">
            {canEdit && (
              <button
                type="button"
                className="ledger-action-icon action-edit"
                onClick={() => openForm(product)}
                aria-label={`Edit ${product.name}`}
                title={`Edit ${product.name}`}
              >
                <Icon name="edit" size={17} />
              </button>
            )}
            <button
              type="button"
              className="ledger-action-icon action-view"
              onClick={() => openForm(product)}
              aria-label={`View ${product.name}`}
              title={`View ${product.name}`}
            >
              <Icon name="eye" size={17} />
            </button>
            {canDelete && (
              <button
                type="button"
                className="ledger-action-icon action-delete"
                onClick={() => deleteProduct(product.productId)}
                aria-label={`Delete ${product.name}`}
                title={`Delete ${product.name}`}
              >
                <Icon name="trash" size={17} />
              </button>
            )}
          </div>
        ),
      },
    ];
  }, [itemLabel, isPharmacy, nowTimestamp, money, canEdit, canDelete]);

  return (
    <section className="products-page">
      {/* 4 Pastel Top KPI Cards in a Horizontal Row (Matching user screenshot) */}
      {!loading && !error && (
        <div className="ledger-kpi-grid">
          {/* Card 1: Total */}
          <div
            className={`ledger-kpi-card theme-blue ${stockFilter === "all" ? "is-active" : ""}`}
            onClick={() => {
              setStockFilter("all");
              setCategory("all");
              setPage(1);
            }}
            role="button"
            tabIndex={0}
            title={`All ${itemsLabel}`}
          >
            <div className="ledger-kpi-bubble">
              <Icon name="list" />
            </div>
            <div className="ledger-kpi-content">
              <span className="ledger-kpi-label">Total</span>
              <span className="ledger-kpi-val">{products.length} Invoices</span>
            </div>
          </div>

          {/* Card 2: Shipped */}
          <div
            className={`ledger-kpi-card theme-slate ${stockFilter === "in" ? "is-active" : ""}`}
            onClick={() => {
              setStockFilter(stockFilter === "in" ? "all" : "in");
              setPage(1);
            }}
            role="button"
            tabIndex={0}
            title="In stock items"
          >
            <div className="ledger-kpi-bubble">
              <Icon name="bag" />
            </div>
            <div className="ledger-kpi-content">
              <span className="ledger-kpi-label">Shipped</span>
              <span className="ledger-kpi-val">{stats.inStockCount} Invoices</span>
            </div>
          </div>

          {/* Card 3: Delivered */}
          <div
            className="ledger-kpi-card theme-green"
            role="button"
            tabIndex={0}
            title="Total inventory valuation"
          >
            <div className="ledger-kpi-bubble">
              <Icon name="truck" />
            </div>
            <div className="ledger-kpi-content">
              <span className="ledger-kpi-label">Delivered</span>
              <span className="ledger-kpi-val">{money(stats.valuation)}</span>
            </div>
          </div>

          {/* Card 4: Pending */}
          <div
            className={`ledger-kpi-card theme-amber ${stockFilter === "low" ? "is-active" : ""}`}
            onClick={() => {
              setStockFilter(stockFilter === "low" ? "all" : "low");
              setPage(1);
            }}
            role="button"
            tabIndex={0}
            title="Low or out of stock alerts"
          >
            <div className="ledger-kpi-bubble">
              <Icon name="pending" />
            </div>
            <div className="ledger-kpi-content">
              <span className="ledger-kpi-label">Pending</span>
              <span className="ledger-kpi-val">{stats.lowStockCount} Invoices</span>
            </div>
          </div>
        </div>
      )}

      {/* Search & Action Toolbar (Pill Capsule + New Product Button) */}
      <div className="ledger-toolbar">
        <div className="ledger-toolbar-left">
          <div className="ledger-search-box">
            <input
              type="text"
              className="ledger-search-input"
              placeholder="Search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              aria-label={`Search ${itemsLabel}`}
            />
            <span className="ledger-search-icon">
              <Icon name="search" size={16} />
            </span>
          </div>

          <select
            className="ledger-pill-select"
            aria-label="Filter category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Categories</option>
            {categories.map((val) => (
              <option key={val} value={val}>
                {val}
              </option>
            ))}
          </select>

          <select
            className="ledger-pill-select"
            aria-label="Filter stock"
            value={stockFilter}
            onChange={(e) => {
              setStockFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Statuses ({products.length})</option>
            <option value="in">In Stock ({stats.inStockCount})</option>
            <option value="low">Pending / Low Stock ({stats.lowStockCount})</option>
          </select>

          <select
            className="ledger-pill-select"
            aria-label="Sort products"
            value={sortOrder}
            onChange={(e) => {
              setSortOrder(e.target.value);
              setPage(1);
            }}
          >
            <option value="default">Default Order</option>
            <option value="price-high">Price: High to Low</option>
            <option value="price-low">Price: Low to High</option>
            <option value="stock-high">Stock: High to Low</option>
            <option value="stock-low">Stock: Low to High</option>
          </select>
        </div>

        <div className="ledger-toolbar-right">
          <button
            type="button"
            className="ledger-btn-secondary"
            onClick={() => exportSheet(selected.length > 0)}
            disabled={loading || !!error || !visibleProducts.length}
            title={selected.length > 0 ? `Export selected (${selected.length})` : "Export CSV"}
          >
            <Icon name="download" size={15} />
            <span>{selected.length > 0 ? `Export (${selected.length})` : "Export CSV"}</span>
          </button>

          {canCreate && (
            <>
              <button
                type="button"
                className="ledger-btn-secondary"
                onClick={() => setIsImportOpen(true)}
                title="Bulk import items"
              >
                <Icon name="plus" size={15} />
                <span>Bulk Import</span>
              </button>

              <button
                type="button"
                className="ledger-btn-primary"
                onClick={() => openForm()}
                title={`Add new ${itemLabel.toLowerCase()}`}
              >
                <span>New Invoice</span>
              </button>
            </>
          )}
        </div>
      </div>

      {!isFormOpen && formError && <FormStatus type="error" message={formError} />}

      <DataTable
        columns={columns}
        data={visibleProducts}
        keyField="productId"
        selectable={true}
        selectedKeys={selected}
        onSelectionChange={setSelected}
        page={page}
        pageSize={pageSize}
        total={visibleProducts.length}
        onPageChange={setPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setPage(1);
        }}
        loading={loading}
        error={error}
        onRetry={refetch}
        emptyText={
          products.length
            ? `No ${itemsLabel.toLowerCase()} match your search.`
            : `No ${itemsLabel.toLowerCase()} yet. Add your first ${itemLabel.toLowerCase()}.`
        }
      />

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingProduct ? `Edit ${itemLabel}` : `Add a ${itemLabel}`}
        subtitle={editingProduct ? `Update ${itemLabel.toLowerCase()} details` : `Register a new ${itemLabel.toLowerCase()} in catalog`}
        size="lg"
      >
        <form className="product-modal-form" onSubmit={handleSubmit}>
          <div className="product-form-grid">
            <Field label={`${itemLabel} name`} required className="field-wide">
              <Input
                name="name"
                defaultValue={editingProduct?.name || ""}
                placeholder={isPharmacy ? "e.g. Augmentin 625 Duo Tablet" : "e.g. Premium Basmati Rice"}
                required
              />
            </Field>

            {(isPharmacy || allowedFields.has("genericName")) && (
              <Field label="Generic composition / salt" className="field-wide">
                <Input
                  name="genericName"
                  defaultValue={editingProduct?.genericName || ""}
                  placeholder="e.g. Amoxicillin (500mg) + Clavulanic Acid (125mg)"
                />
              </Field>
            )}

            <Field label="SKU / Item code" required>
              <Input
                name="sku"
                defaultValue={editingProduct?.sku || ""}
                placeholder={isPharmacy ? "e.g. MED-AUG-625" : "e.g. RIC-001"}
                required
              />
            </Field>

            <Field label="Category" required>
              <Input
                name="category"
                defaultValue={editingProduct?.category || ""}
                placeholder={isPharmacy ? "e.g. Antibiotics" : "e.g. Grocery"}
                required
              />
            </Field>

            {(isPharmacy || allowedFields.has("manufacturer")) && (
              <Field label="Manufacturer / Pharma brand">
                <Input
                  name="manufacturer"
                  defaultValue={editingProduct?.manufacturer || ""}
                  placeholder="e.g. GlaxoSmithKline / Cipla"
                />
              </Field>
            )}

            {(!isPharmacy || allowedFields.has("brand")) && (
              <Field label="Brand">
                <Input
                  name="brand"
                  defaultValue={editingProduct?.brand || ""}
                  placeholder="Brand name"
                />
              </Field>
            )}

            {(isPharmacy || allowedFields.has("batchNumber")) && (
              <Field label="Batch number">
                <Input
                  name="batchNumber"
                  defaultValue={editingProduct?.batchNumber || ""}
                  placeholder="e.g. AUG-24B01"
                />
              </Field>
            )}

            {(isPharmacy || allowedFields.has("expiryDate")) && (
              <Field label="Expiry date">
                <Input
                  name="expiryDate"
                  type="date"
                  defaultValue={
                    editingProduct?.expiryDate
                      ? new Date(editingProduct.expiryDate).toISOString().slice(0, 10)
                      : ""
                  }
                />
              </Field>
            )}

            <Field label="Unit">
              <Select
                name="unit"
                defaultValue={editingProduct?.unit || (isPharmacy ? "box" : "piece")}
              >
                {isPharmacy ? (
                  <>
                    <option value="box">box</option>
                    <option value="strip">strip</option>
                    <option value="bottle">bottle</option>
                    <option value="vial">vial</option>
                    <option value="tube">tube</option>
                    <option value="piece">piece</option>
                    <option value="tablet">tablet</option>
                  </>
                ) : (
                  <>
                    <option value="piece">piece</option>
                    <option value="kg">kg</option>
                    <option value="gram">gram</option>
                    <option value="litre">litre</option>
                    <option value="box">box</option>
                  </>
                )}
              </Select>
            </Field>

            <Field label={`Purchase price (${business.currency || "INR"})`}>
              <Input
                name="purchasePrice"
                type="number"
                min="0"
                step="0.01"
                defaultValue={editingProduct?.purchasePrice || ""}
                placeholder="0.00"
              />
            </Field>

            <Field label={`Retail / Selling price * (${business.currency || "INR"})`} required>
              <Input
                name="sellingPrice"
                type="number"
                min="0"
                step="0.01"
                defaultValue={editingProduct?.sellingPrice || ""}
                placeholder="0.00"
                required
              />
            </Field>

            {(isPharmacy || allowedFields.has("mrp")) && (
              <Field label="MRP (Max Retail Price)">
                <Input
                  name="mrp"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={editingProduct?.mrp || ""}
                  placeholder="0.00"
                />
              </Field>
            )}

            {allowedFields.has("wholesalePrice") && (
              <Field label={`Wholesale price (${business.currency || "INR"})`}>
                <Input
                  name="wholesalePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={editingProduct?.wholesalePrice || ""}
                  placeholder="0.00"
                />
              </Field>
            )}

            {allowedFields.has("wholesaleMinQuantity") && (
              <Field label="Wholesale minimum qty">
                <Input
                  name="wholesaleMinQuantity"
                  type="number"
                  min="1"
                  defaultValue={editingProduct?.wholesaleMinQuantity || 10}
                />
              </Field>
            )}

            <Field label="Barcode / EAN">
              <Input
                name="barcode"
                defaultValue={editingProduct?.barcode || ""}
                placeholder="Scan or enter barcode"
              />
            </Field>

            <Field label="HSN code">
              <Input
                name="hsnCode"
                defaultValue={editingProduct?.hsnCode || (isPharmacy ? "30049099" : "")}
                placeholder={isPharmacy ? "e.g. 30041000" : "e.g. 6205"}
              />
            </Field>

            <Field label="GST rate %">
              <Input
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
            </Field>

            <Field label="Current stock">
              <Input
                name="currentStock"
                type="number"
                min="0"
                defaultValue={editingProduct?.currentStock ?? 0}
              />
            </Field>

            <Field label="Minimum reorder level">
              <Input
                name="minimumStock"
                type="number"
                min="0"
                defaultValue={editingProduct?.minimumStock ?? 0}
              />
            </Field>

            <Field label="Assigned Supplier">
              <Input
                name="supplier"
                defaultValue={editingProduct?.supplier || ""}
                placeholder="Supplier name"
              />
            </Field>

            <Field label="Description / Usage notes" className="field-wide">
              <Textarea
                name="description"
                defaultValue={editingProduct?.description || ""}
                placeholder="Dosage instructions, formulation or short description"
              />
            </Field>
          </div>

          {formError && <FormStatus type="error" message={formError} />}

          <div className="product-form-actions">
            {!editingProduct && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsFormOpen(false);
                  setIsImportOpen(true);
                }}
                icon="upload"
              >
                Bulk import
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFormOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={saving}
            >
              {saving ? "Saving…" : `Save ${itemLabel.toLowerCase()}`}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(confirmDeleteId)}
        title={`Delete ${itemLabel}`}
        message={`Delete this ${itemLabel.toLowerCase()}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />

      <Modal
        isOpen={isImportOpen}
        onClose={() => {
          setIsImportOpen(false);
          refetch();
        }}
        title="Bulk Import Products"
        subtitle="Upload CSV or Excel file to batch create or update inventory"
        size="xl"
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
      </Modal>
    </section>
  );
}

export default Products;
