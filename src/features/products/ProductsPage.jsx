import { useCallback, useMemo, useState } from "react";
import { productApi } from "../../api/productApi.js";
import { useResource } from "../../hooks/useResource.js";
import { resolveBusinessCapabilities } from "../../../shared/industryConfig.js";
import {
  PageHeader,
  Button,
  Badge,
  StatGrid,
  StatCard,
  Toolbar,
  DataTable,
  Modal,
  ConfirmDialog,
  Field,
  Input,
  Select,
  Textarea,
  FormStatus,
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
    return products.filter((product) => {
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
  }, [products, search, category, stockFilter]);

  const money = useCallback(
    (value) => {
      const sym = business.currency === "INR" ? "₹" : business.currency || "";
      return `${sym}${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
    },
    [business.currency]
  );

  const stats = useMemo(() => {
    const lowStockCount = products.filter(
      (p) => Number(p.currentStock || 0) <= Number(p.minimumStock || 0)
    ).length;
    const totalQty = products.reduce(
      (sum, p) => sum + Number(p.currentStock || 0),
      0
    );
    const valuation = products.reduce(
      (sum, p) => sum + Number(p.currentStock || 0) * Number(p.purchasePrice || 0),
      0
    );
    return { lowStockCount, totalQty, valuation };
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
        key: "product",
        header: itemLabel,
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
            <div className="product-info-cell">
              <span className="product-avatar">{product.name?.[0]?.toUpperCase() || "P"}</span>
              <div className="product-details">
                <div className="product-title-row">
                  <span className="product-name">{product.name}</span>
                  {product.genericName && (
                    <span className="product-generic">{product.genericName}</span>
                  )}
                </div>
                <div className="product-meta">
                  <span>{product.sku}</span>
                  <span>·</span>
                  <span>{product.unit || "unit"}</span>
                  {product.batchNumber && (
                    <>
                      <span>·</span>
                      <span>Batch {product.batchNumber}</span>
                    </>
                  )}
                  {expiryInfo && (
                    <Badge tone={expiryInfo.tone} size="sm">
                      {expiryInfo.label}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        key: "category",
        header: "Category",
        mobileLabel: "Category",
        render: (product) => <Badge tone="neutral">{product.category}</Badge>,
      },
      {
        key: "stock",
        header: "Stock",
        mobileLabel: "Stock",
        render: (product) => {
          const isOut = product.currentStock === 0;
          const isLow = product.currentStock <= product.minimumStock;
          return (
            <div className="product-stock-cell">
              <span className={`product-stock-val ${isOut ? "out" : isLow ? "low" : "in"}`}>
                {product.currentStock}
              </span>
              <Badge tone={isOut ? "danger" : isLow ? "warning" : "success"} size="sm">
                {isOut ? "Out of stock" : isLow ? "Low stock" : "In stock"}
              </Badge>
            </div>
          );
        },
      },
      {
        key: "price",
        header: "Price",
        mobileLabel: "Price",
        align: "right",
        render: (product) => (
          <div className="product-price-cell">
            <strong>{money(product.sellingPrice)}</strong>
            {product.mrp && Number(product.mrp) > 0 && (
              <small className="product-mrp">MRP {money(product.mrp)}</small>
            )}
          </div>
        ),
      },
      {
        key: "actions",
        header: "",
        mobileLabel: "Actions",
        align: "right",
        render: (product) => (
          <div className="product-row-actions">
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openForm(product)}
                aria-label={`Edit ${product.name}`}
              >
                Edit
              </Button>
            )}
            {canDelete && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => deleteProduct(product.productId)}
                aria-label={`Delete ${product.name}`}
              >
                Delete
              </Button>
            )}
          </div>
        ),
      },
    ];
  }, [itemLabel, nowTimestamp, money, canEdit, canDelete]);

  return (
    <section className="products-page">
      <PageHeader
        kicker={`Inventory / ${itemsLabel}`}
        title={itemsLabel}
        description={`${products.length} registered ${itemsLabel.toLowerCase()} in ${business.name}`}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => exportSheet()}
              disabled={loading || !!error || !visibleProducts.length}
              icon="download"
            >
              Export sheet
            </Button>
            {canCreate && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsImportOpen(true)}
                  icon="upload"
                >
                  Bulk import
                </Button>
                <Button
                  variant="primary"
                  onClick={() => openForm()}
                  icon="plus"
                >
                  Add {itemLabel.toLowerCase()}
                </Button>
              </>
            )}
          </>
        }
      />

      {!loading && !error && (
        <StatGrid>
          <StatCard
            label={`Total ${itemsLabel}`}
            value={products.length.toLocaleString()}
            helpText={`Registered ${itemsLabel.toLowerCase()} in catalog`}
            icon="box"
          />
          <StatCard
            label="Low Stock Alert"
            value={`${stats.lowStockCount} SKUs`}
            helpText="At or below reorder level"
            icon="warning"
            tone={stats.lowStockCount > 0 ? "warning" : "neutral"}
          />
          <StatCard
            label="Total Stock Quantity"
            value={`${stats.totalQty.toLocaleString()} Units`}
            helpText={`Across all registered ${itemsLabel.toLowerCase()}`}
            icon="clock"
            tone="info"
          />
          <StatCard
            label="Inventory Valuation"
            value={money(stats.valuation)}
            helpText={`At purchase cost (${business.currency || "INR"})`}
            icon="trending-up"
            tone="purple"
          />
        </StatGrid>
      )}

      <Toolbar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        placeholder={`Search by name, ${isPharmacy ? "generic composition, batch, " : ""}SKU, or category`}
        filters={
          <>
            <Select
              aria-label="Category filter"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All categories</option>
              {categories.map((val) => (
                <option key={val} value={val}>
                  {val}
                </option>
              ))}
            </Select>
            <Select
              aria-label="Stock filter"
              value={stockFilter}
              onChange={(e) => {
                setStockFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All stock</option>
              <option value="in">In stock (&gt;0)</option>
              <option value="low">Low / out of stock</option>
            </Select>
          </>
        }
        actions={
          selected.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportSheet(true)}
              icon="download"
            >
              Export selected ({selected.length})
            </Button>
          )
        }
      />

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
