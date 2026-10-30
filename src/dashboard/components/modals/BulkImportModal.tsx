import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  Layers,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { productImportsApi } from '../../lib/api';
import { formatINR } from '../../lib/formatters';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (count: number) => void;
}

interface ExtractedRow {
  sku: string;
  name: string;
  category: string;
  quantity: number;
  stock?: number;
  unit?: string;
  purchasePrice: number;
  sellingPrice: number;
  barcode?: string;
  duplicate?: boolean;
  valid?: boolean;
  errors?: string[];
  warnings?: string[];
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { suppliers, addProduct, refreshBackendData } = useApp();

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ count: number; updated: number } | null>(null);

  // Extracted rows & configuration
  const [extractedRows, setExtractedRows] = useState<ExtractedRow[]>([]);
  const [detectedFileType, setDetectedFileType] = useState<'csv' | 'pdf' | 'xlsx'>('csv');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [purchaseReference, setPurchaseReference] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Download a sample CSV template for the user
  const handleDownloadSampleTemplate = () => {
    const csvContent =
      'SKU,Name,Category,Stock,Unit,PurchasePrice,SellingPrice,Barcode,Description\n' +
      'SHIRT-001,Premium Cotton Shirt,Apparel,50,pcs,450,899,8901234567890,Comfortable 100% combed cotton shirt\n' +
      'TAB-500,Paracetamol 500mg,Pharmacy,120,strip,18,35,8909876543210,Analgesic and antipyretic tablets\n' +
      'MOUSE-W,Wireless Optical Mouse,Electronics,30,pcs,250,599,8905432167890,2.4GHz ergonomic wireless mouse\n' +
      'RICE-5K,Basmati Rice 5kg,Groceries,40,bag,420,650,8906543210987,Aged premium fragrant basmati rice\n' +
      'SHOE-RUN,Lightweight Running Shoes,Footwear,25,pair,850,1799,8907654321098,Breathable sports running sneakers\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'products_bulk_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Local CSV parsing fallback if backend extraction fails
  const parseLocalCsv = async (file: File): Promise<ExtractedRow[]> => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      throw new Error('CSV file contains no product data rows.');
    }

    // Parse header row
    const headers = lines[0]
      .split(',')
      .map((h) => h.trim().replace(/^["']|["']$/g, '').toLowerCase());

    const findIndex = (aliases: string[]) =>
      headers.findIndex((h) => aliases.some((a) => h.includes(a)));

    const skuIdx = findIndex(['sku', 'code', 'item_code']);
    const nameIdx = findIndex(['name', 'title', 'product_name', 'item_name']);
    const catIdx = findIndex(['category', 'type', 'dept']);
    const stockIdx = findIndex(['stock', 'qty', 'quantity', 'count']);
    const unitIdx = findIndex(['unit', 'uom']);
    const buyIdx = findIndex(['purchase', 'cost', 'buy', 'costprice']);
    const sellIdx = findIndex(['sell', 'retail', 'price', 'mrp', 'rate']);
    const barcodeIdx = findIndex(['barcode', 'upc', 'ean']);

    if (nameIdx === -1) {
      throw new Error('CSV must contain a column for Product Name ("Name", "Product Name", or "Title").');
    }

    const rows: ExtractedRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle quoted commas
      const matches = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
      const cols = matches
        ? matches.map((m) => m.replace(/^"|"$/g, '').trim())
        : line.split(',').map((c) => c.trim());

      const name = cols[nameIdx] || '';
      if (!name) continue;

      const sku = (skuIdx !== -1 && cols[skuIdx]) ? cols[skuIdx] : `SKU-${1000 + i}`;
      const category = (catIdx !== -1 && cols[catIdx]) ? cols[catIdx] : 'General';
      const quantity = stockIdx !== -1 ? Math.max(0, parseInt(cols[stockIdx], 10) || 0) : 10;
      const unit = (unitIdx !== -1 && cols[unitIdx]) ? cols[unitIdx] : 'pcs';
      const purchasePrice = buyIdx !== -1 ? Math.max(0, parseFloat(cols[buyIdx]) || 0) : 100;
      const sellingPrice = sellIdx !== -1 ? Math.max(0, parseFloat(cols[sellIdx]) || 0) : Math.round(purchasePrice * 1.4);
      const barcode = barcodeIdx !== -1 ? cols[barcodeIdx] : '';

      rows.push({
        sku,
        name,
        category,
        quantity,
        stock: quantity,
        unit,
        purchasePrice,
        sellingPrice,
        barcode,
        valid: true,
      });
    }

    if (rows.length === 0) {
      throw new Error('No valid product rows could be read from this CSV.');
    }

    return rows;
  };

  // Process file upload (either CSV or PDF)
  const handleProcessFile = async (file: File) => {
    setSelectedFile(file);
    setIsExtracting(true);
    setErrorMessage(null);
    setSuccessInfo(null);

    const ext = file.name.split('.').pop()?.toLowerCase();
    const isCsv = ext === 'csv';
    const isPdf = ext === 'pdf';
    const isXlsx = ext === 'xlsx';

    if (!isCsv && !isPdf && !isXlsx) {
      setIsExtracting(false);
      setErrorMessage('Please upload a valid CSV (.csv) or PDF (.pdf) file.');
      return;
    }

    setDetectedFileType(isPdf ? 'pdf' : isXlsx ? 'xlsx' : 'csv');

    try {
      // 1. First attempt backend extraction (supports both PDF table detection and CSV)
      const res = await productImportsApi.extract(file);

      if (res && Array.isArray(res.rows) && res.rows.length > 0) {
        const mappedRows: ExtractedRow[] = res.rows.map((r: any, idx: number) => ({
          sku: r.sku || `SKU-${1000 + idx}`,
          name: r.name || 'Unnamed Product',
          category: r.category || 'General',
          quantity: Number(r.quantity ?? r.stock ?? 10),
          stock: Number(r.quantity ?? r.stock ?? 10),
          unit: r.unit || 'pcs',
          purchasePrice: Number(r.purchasePrice ?? r.cost ?? 0),
          sellingPrice: Number(r.sellingPrice ?? r.price ?? 0),
          barcode: r.barcode || '',
          duplicate: Boolean(r.duplicate),
          valid: r.valid !== false,
          errors: r.errors || [],
          warnings: r.warnings || [],
        }));
        setExtractedRows(mappedRows);
      } else {
        throw new Error('No product rows were found in the uploaded file.');
      }
    } catch (apiErr: any) {
      // 2. Fallback to client-side parsing if CSV
      if (isCsv) {
        try {
          const fallbackRows = await parseLocalCsv(file);
          setExtractedRows(fallbackRows);
          setErrorMessage(null);
        } catch (csvErr: any) {
          setErrorMessage(csvErr.message || 'Failed to read products from CSV.');
          setExtractedRows([]);
        }
      } else {
        // PDF error from backend
        setErrorMessage(
          apiErr.message ||
            'Could not extract product items from this PDF. Please ensure the PDF has a clear table with column headings (SKU, Name, Price, Quantity) or convert to CSV.'
        );
        setExtractedRows([]);
      }
    } finally {
      setIsExtracting(false);
    }
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessFile(e.target.files[0]);
    }
  };

  // Confirm and commit products to catalog
  const handleConfirmImport = async () => {
    if (extractedRows.length === 0 || isImporting) return;
    setIsImporting(true);
    setErrorMessage(null);

    const validRows = extractedRows.filter((r) => r.valid !== false);
    if (validRows.length === 0) {
      setErrorMessage('No valid rows available to import.');
      setIsImporting(false);
      return;
    }

    try {
      // Attempt backend confirm endpoint
      let createdCount = 0;
      let updatedCount = 0;

      try {
        const result = await productImportsApi.confirm({
          fileName: selectedFile?.name || 'import.csv',
          fileType: detectedFileType,
          supplierId: selectedSupplierId || undefined,
          purchaseReference: purchaseReference || undefined,
          rows: validRows.map((r) => ({
            sku: r.sku,
            name: r.name,
            category: r.category,
            quantity: r.quantity,
            stock: r.quantity,
            purchasePrice: r.purchasePrice,
            sellingPrice: r.sellingPrice,
            unit: r.unit || 'pcs',
            barcode: r.barcode || '',
          })),
        });

        createdCount = result.counts.created;
        updatedCount = result.counts.updated + result.counts.merged;
      } catch (confirmApiError) {
        // Fallback: Add directly to AppContext state
        console.warn('Backend import confirm failed, falling back to local creation:', confirmApiError);
        validRows.forEach((r) => {
          addProduct({
            name: r.name,
            sku: r.sku,
            barcode: r.barcode || `890${Math.floor(100000000 + Math.random() * 900000000)}`,
            category: r.category,
            unit: r.unit || 'pcs',
            purchasePrice: r.purchasePrice,
            sellingPrice: r.sellingPrice,
            taxRate: 18,
            stock: r.quantity,
            reorderLevel: 10,
            supplierId: selectedSupplierId || suppliers[0]?.id || '',
            description: `Imported from ${selectedFile?.name || 'bulk import'}`,
            active: true,
          });
          createdCount += 1;
        });
      }

      // Refresh application context data
      await refreshBackendData().catch(() => {});

      setSuccessInfo({
        count: createdCount + updatedCount,
        updated: updatedCount,
      });

      if (onSuccess) {
        onSuccess(createdCount + updatedCount);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to complete product import.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setExtractedRows([]);
    setErrorMessage(null);
    setSuccessInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-3xl w-full border border-[#EEE6DA] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#EEE6DA] flex items-start justify-between bg-[#FAF6EF]/50 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-[#7FAE82]/15 text-[#2E8B57] flex items-center justify-center">
                <UploadCloud size={18} />
              </span>
              <h2 className="text-lg font-bold text-[#1C1B18]">Bulk Import Products</h2>
            </div>
            <p className="text-xs text-[#6B665E] mt-1">
              Upload a <span className="font-semibold text-[#1C1B18]">CSV spreadsheet</span> or{' '}
              <span className="font-semibold text-[#1C1B18]">PDF invoice/catalog</span> to import products in bulk.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#9A948A] hover:text-[#1C1B18] hover:bg-white border border-transparent hover:border-[#EEE6DA] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-[#FDECEC] border border-[#f5b8b8] text-xs text-[#D64545] flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{errorMessage}</p>
                <p className="text-[11px] text-[#D64545]/80 mt-0.5">
                  Check your file formatting or download the sample template below.
                </p>
              </div>
            </div>
          )}

          {/* Success Screen */}
          {successInfo ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#E8F5EC] text-[#2E8B57] flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1C1B18]">Import Completed Successfully!</h3>
                <p className="text-xs text-[#6B665E] mt-1 max-w-sm mx-auto">
                  Imported <span className="font-bold text-[#2E8B57]">{successInfo.count} products</span> into your
                  catalog. Your inventory and stock records have been updated.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#EEE6DA] text-[#6B665E] hover:text-[#1C1B18] hover:bg-[#FAF6EF] transition-colors cursor-pointer"
                >
                  Import Another File
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#1C1B18] !text-white hover:bg-black transition-colors cursor-pointer shadow-xs"
                  style={{ color: '#ffffff' }}
                >
                  View Products
                </button>
              </div>
            </div>
          ) : extractedRows.length === 0 ? (
            /* Upload Dropzone View */
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, .pdf, .xlsx, text/csv, application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />

              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => !isExtracting && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 sm:p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                  dragActive
                    ? 'border-[#7FAE82] bg-[#E8F5EC]/30 scale-[0.99]'
                    : 'border-[#DDD3C4] bg-[#FAF6EF]/60 hover:bg-[#FAF6EF] hover:border-[#7FAE82]'
                }`}
              >
                {isExtracting ? (
                  <div className="space-y-3 py-4">
                    <Loader2 size={36} className="animate-spin text-[#7FAE82] mx-auto" />
                    <div>
                      <p className="text-sm font-bold text-[#1C1B18]">Analyzing & extracting products...</p>
                      <p className="text-xs text-[#6B665E] mt-0.5">
                        Parsing {selectedFile?.name} for catalog entries
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-white border border-[#EEE6DA] shadow-xs flex items-center justify-center text-[#7FAE82] mb-3">
                      <UploadCloud size={28} />
                    </div>
                    <h3 className="text-sm font-bold text-[#1C1B18]">
                      Click to upload or drag & drop file
                    </h3>
                    <p className="text-xs text-[#6B665E] mt-1 max-w-sm">
                      Upload your spreadsheet or supplier invoice. Our system automatically extracts rows and prices.
                    </p>

                    {/* Supported Format Pills */}
                    <div className="flex items-center gap-2 mt-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[#EEE6DA] text-[11px] font-semibold text-[#1C1B18]">
                        <FileSpreadsheet size={13} className="text-[#2E8B57]" />
                        <span>.CSV Spreadsheets</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[#EEE6DA] text-[11px] font-semibold text-[#1C1B18]">
                        <FileText size={13} className="text-[#D64545]" />
                        <span>.PDF Invoices & Catalogs</span>
                      </span>
                    </div>

                    <p className="text-[10.5px] text-[#9A948A] mt-3">Up to 15MB file size supported</p>
                  </>
                )}
              </div>

              {/* Sample Template Section */}
              <div className="bg-[#FAF6EF] rounded-2xl p-4 border border-[#EEE6DA] flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-[#1C1B18] flex items-center gap-1.5">
                    <Download size={14} className="text-[#7FAE82]" />
                    <span>Need a starting format?</span>
                  </div>
                  <p className="text-[11px] text-[#6B665E]">
                    Download our ready-to-use CSV template with pre-filled sample items.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadSampleTemplate}
                  className="px-3.5 py-1.5 rounded-xl border border-[#EEE6DA] bg-white text-xs font-semibold text-[#1C1B18] hover:bg-[#FAF6EF] transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1.5"
                >
                  <Download size={13} />
                  <span>Download Sample CSV</span>
                </button>
              </div>
            </div>
          ) : (
            /* Extracted Preview View */
            <div className="space-y-4">
              {/* File Info & Summary Banner */}
              <div className="bg-[#FAF6EF] rounded-2xl p-4 border border-[#EEE6DA] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#EEE6DA] flex items-center justify-center text-lg shrink-0">
                    {detectedFileType === 'pdf' ? (
                      <FileText size={20} className="text-[#D64545]" />
                    ) : (
                      <FileSpreadsheet size={20} className="text-[#2E8B57]" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-[#1C1B18] truncate max-w-xs sm:max-w-md">
                        {selectedFile?.name}
                      </h4>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white border border-[#EEE6DA] uppercase">
                        {detectedFileType}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6B665E] mt-0.5">
                      Extracted <span className="font-bold text-[#1C1B18]">{extractedRows.length} items</span> ready for
                      import
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs font-semibold text-[#6B665E] hover:text-[#1C1B18] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#EEE6DA] cursor-pointer"
                >
                  <RefreshCw size={12} />
                  <span>Change file</span>
                </button>
              </div>

              {/* Optional Meta Configuration (Supplier & Reference) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-2xl border border-[#EEE6DA]">
                <div>
                  <label className="block text-[11px] font-semibold text-[#6B665E] mb-1">
                    Assign Supplier (Optional)
                  </label>
                  <div className="relative">
                    <Building2 size={13} className="absolute left-3 top-2.5 text-[#9A948A]" />
                    <select
                      value={selectedSupplierId}
                      onChange={(e) => setSelectedSupplierId(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#EEE6DA] text-xs bg-white text-[#1C1B18] outline-none focus:border-[#7FAE82]"
                    >
                      <option value="">No supplier / Master catalog</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.category})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#6B665E] mb-1">
                    Purchase / Invoice Reference (Optional)
                  </label>
                  <div className="relative">
                    <Layers size={13} className="absolute left-3 top-2.5 text-[#9A948A]" />
                    <input
                      type="text"
                      placeholder="e.g. INV-2026-001"
                      value={purchaseReference}
                      onChange={(e) => setPurchaseReference(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#EEE6DA] text-xs text-[#1C1B18] outline-none focus:border-[#7FAE82]"
                    />
                  </div>
                </div>
              </div>

              {/* Products Preview Table */}
              <div className="border border-[#EEE6DA] rounded-2xl overflow-hidden bg-white shadow-2xs">
                <div className="px-4 py-2.5 bg-[#FAF6EF]/60 border-b border-[#EEE6DA] flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#1C1B18]">Items to be Created/Updated</span>
                  <span className="text-[#6B665E] text-[11px]">
                    Showing {Math.min(extractedRows.length, 50)} of {extractedRows.length} items
                  </span>
                </div>

                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#FAF6EF] text-[#6B665E] text-[11px] font-semibold sticky top-0 z-10 border-b border-[#EEE6DA]">
                      <tr>
                        <th className="py-2 px-3">SKU</th>
                        <th className="py-2 px-3">Product Name</th>
                        <th className="py-2 px-3">Category</th>
                        <th className="py-2 px-3 text-right">Qty</th>
                        <th className="py-2 px-3 text-right">Purchase (₹)</th>
                        <th className="py-2 px-3 text-right">Retail (₹)</th>
                        <th className="py-2 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EEE6DA]">
                      {extractedRows.slice(0, 50).map((row, idx) => (
                        <tr key={`${row.sku}-${idx}`} className="hover:bg-[#FAF6EF]/40 transition-colors">
                          <td className="py-2 px-3 font-mono text-[11px] text-[#6B665E]">{row.sku}</td>
                          <td className="py-2 px-3 font-semibold text-[#1C1B18] max-w-[180px] truncate">
                            {row.name}
                          </td>
                          <td className="py-2 px-3 text-[#6B665E]">{row.category}</td>
                          <td className="py-2 px-3 text-right font-bold text-[#1C1B18] tabular-nums">
                            {row.quantity} {row.unit || 'pcs'}
                          </td>
                          <td className="py-2 px-3 text-right text-[#6B665E] tabular-nums">
                            {formatINR(row.purchasePrice)}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-[#2E8B57] tabular-nums">
                            {formatINR(row.sellingPrice)}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {row.duplicate ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#FFF4DC] text-[#D98E0B]">
                                Update
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#E8F5EC] text-[#2E8B57]">
                                New
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-[#EEE6DA] flex items-center justify-between bg-[#FAF6EF]/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B665E] hover:text-[#1C1B18] transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {extractedRows.length > 0 && !successInfo && (
            <button
              type="button"
              disabled={isImporting}
              onClick={handleConfirmImport}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#7FAE82] hover:bg-[#6C9C70] !text-white transition-all cursor-pointer shadow-md inline-flex items-center gap-1.5 disabled:opacity-50"
              style={{ color: '#ffffff' }}
            >
              {isImporting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Importing Products...</span>
                </>
              ) : (
                <>
                  <span>Import {extractedRows.length} Products</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

