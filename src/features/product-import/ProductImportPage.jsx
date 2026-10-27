import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { productImportApi } from "../../api/productImportApi.js";
import { supplierApi } from "../../api/supplierApi.js";
import { useResource } from "../../hooks/useResource.js";
import { PageHeader } from "../../components/ui/PageHeader.jsx";
import { StatGrid, StatCard, Card } from "../../components/ui/Card.jsx";
import { DataTable } from "../../components/ui/DataTable.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Field, Input, Select, Checkbox } from "../../components/ui/FormControls.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import "./ProductImportPage.css";

const COLUMNS = [
  ["name", "Product name"],
  ["parentSku", "Parent SKU"],
  ["sku", "SKU"],
  ["barcode", "Barcode"],
  ["category", "Category"],
  ["brand", "Brand"],
  ["size", "Size"],
  ["color", "Color"],
  ["quantity", "Qty"],
  ["purchasePrice", "Purchase"],
  ["sellingPrice", "Retail"],
  ["wholesalePrice", "Wholesale"],
  ["gstRate", "GST %"],
  ["hsnCode", "HSN"],
  ["supplierName", "Supplier"],
  ["minimumStock", "Min stock"],
  ["reorderPoint", "Reorder point"],
  ["targetStock", "Target stock"],
  ["reorderQuantity", "Reorder qty"],
];

const NUMERIC = new Set([
  "quantity",
  "purchasePrice",
  "sellingPrice",
  "wholesalePrice",
  "gstRate",
  "minimumStock",
  "reorderPoint",
  "targetStock",
  "reorderQuantity",
]);

const REQUIRED_COLUMNS = new Set(["name", "sku", "category"]);
const STATUS_LABEL = { completed: "Completed", partial: "Warnings", failed: "Failed" };
const FILE_ICON = { csv: "▤", xlsx: "▦", pdf: "▥" };

function validate(row) {
  const errors = [];
  if (!String(row.name || "").trim()) errors.push("Product name is required.");
  if (!String(row.sku || "").trim()) errors.push("SKU is required.");
  if (!String(row.category || "").trim()) errors.push("Category is required.");
  for (const field of NUMERIC)
    if (!Number.isFinite(Number(row[field])) || Number(row[field]) < 0)
      errors.push(`${field} must be zero or positive.`);
  if (!Number.isInteger(Number(row.quantity)))
    errors.push("Quantity must be a whole number.");
  if (Number(row.gstRate) > 100) errors.push(`GST must be between 0 and 100. Received ${row.gstRate}. Check the GST and HSN columns.`);
  return {
    ...row,
    errors,
    warnings: row.warnings || [],
    valid: errors.length === 0,
    invalidFields: Number(row.gstRate) > 100 ? ["gstRate"] : [],
  };
}

function downloadSampleTemplate() {
  const header = COLUMNS.map(([, label]) => label).join(",");
  const example = COLUMNS.map(([field]) => {
    if (field === "name") return "Sample Cotton T-Shirt";
    if (field === "sku") return "SKU-0001";
    if (field === "category") return "Apparel";
    if (field === "quantity") return "25";
    if (field === "sellingPrice") return "499";
    if (field === "purchasePrice") return "299";
    if (NUMERIC.has(field)) return "0";
    return "";
  }).join(",");
  const blob = new Blob([`${header}\n${example}\n`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "stockroom-import-template.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function ProductImport({
  business = {},
  onImportSuccess,
  onClose,
  isModal: _isModal = false,
}) {
  const load = useCallback(
    () =>
      Promise.all([
        supplierApi.list({ status: "active" }),
        productImportApi.history(),
      ]),
    [],
  );
  const { data, refetch } = useResource(load, [], [[], []]);
  const [suppliers = [], history = []] = data;
  const [preview, setPreview] = useState(null);
  const [supplierId, setSupplierId] = useState("");
  const [purchaseReference, setPurchaseReference] = useState("");
  const [variantMode, setVariantMode] = useState(false);
  const [updateExistingPrices, setUpdateExistingPrices] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [historySearch, setHistorySearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedLog, setExpandedLog] = useState(null);
  const inputRef = useRef(null);
  const isClothing = String(business.industry || "").toLowerCase() === "clothing";

  const summary = useMemo(
    () =>
      preview
        ? {
            total: preview.rows.length,
            valid: preview.rows.filter((row) => row.valid).length,
            invalid: preview.rows.filter((row) => !row.valid).length,
            duplicates: preview.rows.filter((row) => row.duplicate).length,
          }
        : null,
    [preview],
  );

  const hasInvalidRows = Boolean(preview?.rows.some((row) => !row.valid));
  useEffect(() => {
    if (!hasInvalidRows) return;
    requestAnimationFrame(() =>
      document.querySelector('.import-preview-table [data-invalid="true"]')?.focus({ preventScroll: true })
    );
  }, [preview?.fileName, hasInvalidRows]);

  const filteredHistory = useMemo(() => {
    const term = historySearch.trim().toLowerCase();
    return history.filter((item) => {
      if (statusFilter && item.status !== statusFilter) return false;
      if (!term) return true;
      return item.fileName.toLowerCase().includes(term) || item.importId.toLowerCase().includes(term);
    });
  }, [history, historySearch, statusFilter]);

  const choose = async (file) => {
    if (!file || working) return;
    setWorking(true);
    setMessage(null);
    setLastResult(null);
    try {
      const extracted = await productImportApi.extract(file);
      setPreview(
        updateExistingPrices
          ? {
              ...extracted,
              rows: extracted.rows.map((row) => (row.duplicate ? { ...row, duplicateAction: "update" } : row)),
            }
          : extracted,
      );
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setWorking(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const edit = (index, field, value) =>
    setPreview((current) => ({
      ...current,
      rows: current.rows.map((row, rowIndex) =>
        rowIndex === index
          ? validate({
              ...row,
              [field]: NUMERIC.has(field) ? Number(value) : value,
            })
          : row,
      ),
    }));

  const setAllDuplicates = (duplicateAction) =>
    setPreview((current) => ({
      ...current,
      rows: current.rows.map((row) =>
        row.duplicate ? { ...row, duplicateAction } : row,
      ),
    }));

  const confirm = async () => {
    if (working || !preview) return;
    setWorking(true);
    setMessage(null);
    try {
      const result = await productImportApi.confirm({
        fileName: preview.fileName,
        fileType: preview.fileType,
        supplierId,
        purchaseReference,
        variantMode,
        rows: preview.rows,
      });
      setMessage({
        type: result.failures.length ? "error" : "success",
        text: `Import finished: ${result.counts.created} created, ${result.counts.updated} updated, ${result.counts.merged} merged, ${result.counts.skipped} skipped, ${result.failures.length} failed.`,
      });
      setLastResult(result);
      setPreview(null);
      await refetch();
      if (onImportSuccess) {
        onImportSuccess(result);
      }
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setWorking(false);
    }
  };

  const historyColumns = [
    {
      key: "file",
      header: "File & Batch ID",
      render: (item) => (
        <div>
          <span className="font-semibold text-main">
            {FILE_ICON[item.fileType] || "▤"} {item.fileName}
          </span>
          <small className="block text-muted">
            BATCH-{item.importId.slice(-8).toUpperCase()}
          </small>
        </div>
      ),
      mobileLabel: "File",
    },
    {
      key: "date",
      header: "Timestamp",
      render: (item) => (
        <span className="text-soft text-sm">
          {new Date(item.createdAt).toLocaleString()}
        </span>
      ),
      mobileLabel: "Date",
    },
    {
      key: "operator",
      header: "Operator",
      render: (item) => (
        <span className="text-main">{item.importedByName || "System"}</span>
      ),
      mobileLabel: "Operator",
    },
    {
      key: "counts",
      header: "Records Processed",
      render: (item) => (
        <div>
          <span className="text-success text-sm font-semibold">{item.createdCount} created</span>
          <small className="block text-muted">
            {item.updatedCount + item.mergedCount} updated ·{" "}
            <span className={item.failedCount ? "text-danger" : ""}>
              {item.failedCount} errors
            </span>
          </small>
        </div>
      ),
      mobileLabel: "Records",
    },
    {
      key: "status",
      header: "Status",
      render: (item) => (
        <Badge
          tone={
            item.status === "completed"
              ? "success"
              : item.status === "failed"
                ? "danger"
                : "warning"
          }
        >
          {STATUS_LABEL[item.status] || item.status}
        </Badge>
      ),
      mobileLabel: "Status",
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (item) => (
        <Button
          variant="secondary"
          size="sm"
          disabled={!item.failures?.length}
          onClick={() =>
            setExpandedLog((current) => (current === item.importId ? null : item.importId))
          }
        >
          {item.failures?.length
            ? expandedLog === item.importId
              ? "Hide Log"
              : "View Log"
            : "No Issues"}
        </Button>
      ),
      mobileLabel: "Actions",
    },
  ];

  return (
    <div className="import-page import-container">
      <PageHeader
        kicker="Inventory / Bulk Import"
        title="Import Products"
        badge={isClothing ? "Clothing Workspace" : "Universal Catalog"}
        description={`Validated PDF invoices, CSV sheets and Excel catalog sync for ${business.name || "your business"}.`}
        actions={
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            {!preview && (
              <>
                <Button
                  variant="secondary"
                  onClick={downloadSampleTemplate}
                  icon="download"
                >
                  Download Sample (.csv)
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowGuidelines((c) => !c)}
                  aria-expanded={showGuidelines}
                >
                  Guidelines
                </Button>
              </>
            )}
            {preview && (
              <Button variant="secondary" onClick={() => setPreview(null)}>
                Start Over
              </Button>
            )}
            {onClose && (
              <Button variant="secondary" onClick={onClose} aria-label="Close bulk import">
                Close
              </Button>
            )}
          </div>
        }
      />

      {showGuidelines && !preview && (
        <Card title="Recognized Import Columns" subtitle="Column headers are matched automatically. Required columns are marked.">
          <div className="import-guidelines-box">
            <ul>
              {COLUMNS.map(([field, label]) => (
                <li key={field}>
                  {label}
                  {REQUIRED_COLUMNS.has(field) && <em> · required</em>}
                </li>
              ))}
            </ul>
            <div style={{ marginTop: "var(--space-3)" }}>
              <Button variant="secondary" size="sm" onClick={() => setShowGuidelines(false)}>
                Dismiss Guidelines
              </Button>
            </div>
          </div>
        </Card>
      )}

      {message && (
        <div className={`import-alert-box ${message.type === "error" ? "import-alert-error" : "import-alert-success"}`}>
          {message.text}
        </div>
      )}

      {lastResult?.failures?.length > 0 && (
        <div className="import-failures-box">
          <strong>Rows not imported ({lastResult.failures.length})</strong>
          {lastResult.failures.map((failure) => (
            <p key={failure.rowNumber != null ? `fail-row-${failure.rowNumber}` : (failure.sku || failure.name)}>
              <b>Row {failure.rowNumber}: {failure.sku || failure.name || "Unnamed product"}</b> - {failure.reasons.join(" ")}
            </p>
          ))}
        </div>
      )}

      {!preview ? (
        <>
          <Card title="Upload Catalog or Invoice" subtitle="Drag and drop or browse files to start bulk extraction">
            <button
              className={`import-dropzone ${dragging ? "dragging" : ""}`}
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                choose(event.dataTransfer.files[0]);
              }}
              disabled={working}
            >
              <div className="import-icon-bubble">⇧</div>
              <strong>
                {working
                  ? "Reading and validating file…"
                  : "Drop your product catalog or invoice file here"}
              </strong>
              <small>
                or <span className="import-browse-link">browse files</span> to upload
              </small>
              <div className="import-format-pills">
                <span className="import-format-pill">▤ .CSV Table</span>
                <span className="import-format-pill">▦ .XLSX Excel</span>
                <span className="import-format-pill">▥ .PDF Invoices (OCR)</span>
              </div>
              <small style={{ marginTop: "var(--space-2)" }}>Maximum 15 MB · up to 5,000 rows</small>
            </button>

            <input
              ref={inputRef}
              className="import-file-input"
              type="file"
              accept=".pdf,.csv,.xlsx"
              onChange={(event) => choose(event.target.files[0])}
            />

            <div className="import-preflight-row">
              {isClothing && (
                <Checkbox
                  label="Auto-detect variant groupings (Size & Color)"
                  checked={variantMode}
                  onChange={(event) => setVariantMode(event.target.checked)}
                />
              )}
              <Checkbox
                label="Update prices on existing matching SKUs"
                checked={updateExistingPrices}
                onChange={(event) => setUpdateExistingPrices(event.target.checked)}
              />
            </div>
          </Card>

          <div className="import-guide-grid">
            <div className="import-guide-card">
              <div className="import-guide-number">1</div>
              <strong>Recognizable Headers</strong>
              <p>Use Product Name, SKU, Category, Quantity and Selling Price. Other columns map automatically.</p>
            </div>
            <div className="import-guide-card">
              <div className="import-guide-number">2</div>
              <strong>Review Before Saving</strong>
              <p>Nothing is added during extraction. Correct highlighted fields and resolve duplicates in the preview.</p>
            </div>
            <div className="import-guide-card">
              <div className="import-guide-number">3</div>
              <strong>Audited Stock Update</strong>
              <p>Confirmation creates products, records stock movements and logs an audited batch transaction.</p>
            </div>
          </div>
        </>
      ) : (
        <>
          <StatGrid columns={4}>
            <StatCard title="Total Rows" value={summary.total} subtext={`File: ${preview.fileName}`} icon="document" />
            <StatCard title="Valid Rows" value={summary.valid} subtext="Ready for import" deltaType="positive" icon="box" />
            <StatCard title="Invalid Rows" value={summary.invalid} subtext="Requires correction" deltaType={summary.invalid ? "negative" : "neutral"} icon="clock" />
            <StatCard title="Duplicates" value={summary.duplicates} subtext="Matching existing SKUs" icon="chart" />
          </StatGrid>

          <Card title="Extraction Preview & Configuration" subtitle="Review parsed rows, adjust duplicate rules, or correct invalid entries">
            <div className="import-options-bar">
              <Field label="Default Supplier">
                <Select
                  value={supplierId}
                  onChange={(event) => setSupplierId(event.target.value)}
                >
                  <option value="">Use supplier from each row</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.supplierId} value={supplier.supplierId}>
                      {supplier.supplierName}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Purchase Reference">
                <Input
                  value={purchaseReference}
                  onChange={(event) => setPurchaseReference(event.target.value)}
                  placeholder="PO / invoice number..."
                />
              </Field>

              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                <span style={{ fontSize: "10px", color: "var(--muted)", textTransform: "uppercase" }}>
                  Bulk Duplicate Actions
                </span>
                <div style={{ display: "flex", gap: "var(--space-1)" }}>
                  <Button variant="secondary" size="sm" onClick={() => setAllDuplicates("skip")}>
                    Skip All
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setAllDuplicates("update")}>
                    Update All
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setAllDuplicates("merge")}>
                    Merge All
                  </Button>
                </div>
              </div>
            </div>

            <div className="import-table-container">
              <table className="import-preview-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    {COLUMNS.map(([, label]) => (
                      <th key={label}>{label}</th>
                    ))}
                    <th>Duplicate Action</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row) => (
                    <tr
                      key={row.rowNumber != null ? `preview-row-${row.rowNumber}` : (row.sku || row.name)}
                      className={!row.valid ? "invalid" : row.duplicate ? "duplicate" : ""}
                    >
                      <td>
                        <Badge tone={!row.valid ? "danger" : row.duplicate ? "warning" : "success"}>
                          {!row.valid ? "Fix" : row.duplicate ? "Duplicate" : "Ready"}
                        </Badge>
                        {row.errors?.length > 0 && (
                          <small className="block text-danger" title={row.errors.join("\n")}>
                            {row.errors[0]}
                          </small>
                        )}
                      </td>
                      {COLUMNS.map(([field]) => (
                        <td key={field}>
                          <input
                            aria-label={`${field} row ${index + 1}`}
                            type={NUMERIC.has(field) ? "number" : "text"}
                            min={NUMERIC.has(field) ? 0 : undefined}
                            step={field === "quantity" ? 1 : "any"}
                            max={field === "gstRate" ? 100 : undefined}
                            data-invalid={row.invalidFields?.includes(field) ? "true" : undefined}
                            aria-invalid={row.invalidFields?.includes(field) || undefined}
                            value={row[field] ?? ""}
                            onChange={(event) => edit(index, field, event.target.value)}
                          />
                        </td>
                      ))}
                      <td>
                        {row.duplicate ? (
                          <select
                            value={row.duplicateAction}
                            onChange={(event) => edit(index, "duplicateAction", event.target.value)}
                          >
                            <option value="merge">Merge / add stock</option>
                            <option value="update">Update / replace stock</option>
                            <option value="skip">Skip</option>
                          </select>
                        ) : (
                          <span className="text-muted">New</span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="import-remove-btn"
                          title="Remove row"
                          onClick={() =>
                            setPreview((current) => ({
                              ...current,
                              rows: current.rows.filter((_, i) => i !== index),
                            }))
                          }
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="import-confirm-bar">
              <div>
                <strong className="text-main">{summary.valid} valid rows ready to import</strong>
                <p className="text-muted text-xs" style={{ margin: 0 }}>
                  Invalid rows will be skipped and logged in failure history.
                </p>
              </div>
              <Button
                variant="primary"
                disabled={working || summary.valid === 0}
                loading={working}
                onClick={confirm}
                icon="arrow-path"
              >
                {working ? "Importing…" : "Confirm Inventory Import"}
              </Button>
            </div>
          </Card>
        </>
      )}

      {/* Import History */}
      <Card title="Import History & Audit Log" subtitle="Log of past bulk imports and sync operations">
        {history.length > 0 && (
          <div className="import-history-toolbar">
            <Input
              value={historySearch}
              onChange={(event) => setHistorySearch(event.target.value)}
              placeholder="Filter batch or file name…"
              aria-label="Filter import history"
            />
            <Select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              <option value="completed">Completed</option>
              <option value="partial">Warnings</option>
              <option value="failed">Failed</option>
            </Select>
            <div>
              <Button variant="secondary" onClick={refetch} icon="arrow-path">
                Refresh
              </Button>
            </div>
          </div>
        )}

        <DataTable
          columns={historyColumns}
          data={filteredHistory}
          emptyTitle="No completed imports"
          emptyDescription={
            history.length
              ? "No imports match this filter."
              : "No catalog or invoice imports recorded yet."
          }
        />

        {expandedLog && (
          <div className="import-log-detail-box">
            <strong className="text-danger">Failure Log for Batch {expandedLog}</strong>
            {history
              .find((h) => h.importId === expandedLog)
              ?.failures?.map((failure) => (
                <p key={failure.rowNumber != null ? `batch-fail-${failure.rowNumber}` : (failure.sku || failure.name)}>
                  <b>Row {failure.rowNumber}: {failure.sku || failure.name || "Unnamed"}</b> - {failure.reasons?.join(" ")}
                </p>
              ))}
          </div>
        )}
      </Card>
    </div>
  );
}
