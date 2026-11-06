import React, { useState, useRef, useMemo } from 'react';
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
import { Portal } from '../common/Portal';
import {
  generateIndustryCsvTemplate,
  getIndustryImportTemplate,
} from '../../../shared/industryImportTemplates';

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
  // Industry specific schema fields
  genericName?: string;
  manufacturer?: string;
  batchNumber?: string;
  manufacturingDate?: string;
  expiryDate?: string;
  mrp?: number;
  gstRate?: number;
  hsnCode?: string;
  brand?: string;
  size?: string;
  color?: string;
  model?: string;
  serialNumber?: string;
  warrantyMonths?: number;
  weight?: string;
  material?: string;
  dimensions?: string;
  rackLocation?: string;
  parentSku?: string;
  wholesalePrice?: number;
  description?: string;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { suppliers, addProduct, refreshBackendData, businessProfile } = useApp();

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ count: number; updated: number } | null>(null);

  // Industry template configuration strictly based on business industry
  const templateConfig = useMemo(
    () => getIndustryImportTemplate(businessProfile?.industry),
    [businessProfile?.industry]
  );
  const isPharmacy = templateConfig.industry === 'pharmacy';
  const isClothing = templateConfig.industry === 'clothing';
  const isElectronics = templateConfig.industry === 'electronics';
  const isGrocery = templateConfig.industry === 'grocery';
  const isHardware = templateConfig.industry === 'hardware';

  // Extracted rows & configuration
  const [extractedRows, setExtractedRows] = useState<ExtractedRow[]>([]);
  const [detectedFileType, setDetectedFileType] = useState<'csv' | 'pdf' | 'xlsx'>('csv');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [purchaseReference, setPurchaseReference] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Download industry-specific sample Excel or PDF template
  const handleDownloadTemplate = async (format: 'xlsx' | 'pdf' = 'xlsx') => {
    try {
      await productImportsApi.downloadTemplate(businessProfile?.industry, format, businessProfile?.name);
    } catch (err: any) {
      console.error('Failed to download template:', err);
      setErrorMessage(err.message || 'Failed to download sample template. Please check your connection.');
    }
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
      .map((h) =>
        h
          .trim()
          .replace(/^["']|["']$/g, '')
          .toLowerCase()
          .replace(/[%._()-]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
      );

    const findIndex = (aliases: string[]) => {
      const exact = headers.findIndex((h) => aliases.some((a) => h === a));
      if (exact !== -1) return exact;
      return headers.findIndex((h) => aliases.some((a) => h.includes(a)));
    };

    const skuIdx = findIndex(['sku', 'productcode', 'product code', 'itemcode', 'item code', 'code', 'variant sku', 'part number sku', 'part number']);
    const nameIdx = findIndex(['name', 'productname', 'product name', 'product', 'itemname', 'item name', 'item', 'title', 'medicine name', 'style product name', 'part name']);
    const catIdx = findIndex(['category', 'productcategory', 'product category', 'type', 'dept', 'department']);
    const stockIdx = findIndex(['quantity', 'qty', 'stock', 'stock quantity', 'count', 'units']);
    const unitIdx = findIndex(['unit', 'uom', 'measurement']);
    const buyIdx = findIndex(['purchaseprice', 'purchase price', 'purchase', 'costprice', 'cost price', 'cost', 'buyprice', 'buy price', 'rate']);
    const sellIdx = findIndex(['sellingprice', 'selling price', 'selling', 'retailprice', 'retail price', 'retail', 'saleprice', 'sale price', 'sale', 'price']);
    const mrpIdx = findIndex(['mrp', 'max retail price', 'maximum retail price']);
    const barcodeIdx = findIndex(['barcode', 'bar code', 'ean', 'upc', 'gtin']);

    // Industry-specific header lookups
    const genericIdx = findIndex(['generic', 'generic name', 'generic salt name', 'salt', 'molecule', 'salt composition', 'active ingredient']);
    const mfgIdx = findIndex(['manufacturer', 'mfg', 'pharma company', 'producer', 'company']);
    const batchIdx = findIndex(['batch', 'batch no', 'batch number', 'lot', 'lot no', 'lot number']);
    const mfgDateIdx = findIndex(['mfg date', 'manufacturing date', 'mfd', 'mfg dt', 'mfg date yyyy mm dd']);
    const expDateIdx = findIndex(['expiry', 'expiry date', 'exp date', 'exp dt', 'expiration', 'expiry date yyyy mm dd']);
    const gstIdx = findIndex(['gst', 'gst rate', 'tax', 'tax rate']);
    const hsnIdx = findIndex(['hsn', 'hsn code', 'hsncode']);
    const brandIdx = findIndex(['brand', 'make', 'brand make', 'brand oem']);
    const sizeIdx = findIndex(['size', 'garment size']);
    const colorIdx = findIndex(['color', 'colour', 'shade']);
    const modelIdx = findIndex(['model', 'model number', 'model no', 'vehicle compatibility', 'grade']);
    const serialIdx = findIndex(['serial', 'serial number', 'serial no', 'imei']);
    const warrantyIdx = findIndex(['warranty', 'warranty months', 'warranty period']);
    const weightIdx = findIndex(['weight', 'weight pack size', 'pack size']);
    const materialIdx = findIndex(['material', 'material fabric', 'fabric']);
    const dimensionsIdx = findIndex(['dimensions', 'dimension', 'dimensions size']);
    const rackIdx = findIndex(['rack', 'rack location', 'warehouse rack location', 'shelf location', 'aisle bin location', 'bin location', 'aisle']);
    const parentSkuIdx = findIndex(['parent sku', 'parent style sku', 'style sku', 'parent sku style code', 'style code']);
    const wholesaleIdx = findIndex(['wholesale price', 'wholesale rate', 'bulk price']);
    const descIdx = findIndex(['description', 'desc', 'details', 'storage instructions', 'storage', 'fabric fit', 'design and fit details', 'design fit details']);

    if (nameIdx === -1) {
      throw new Error('CSV must contain a column for Product / Medicine Name.');
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
      const mrp = mrpIdx !== -1 ? Math.max(0, parseFloat(cols[mrpIdx]) || 0) : undefined;
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
        mrp,
        barcode,
        valid: true,
        genericName: genericIdx !== -1 ? cols[genericIdx] : undefined,
        manufacturer: mfgIdx !== -1 ? cols[mfgIdx] : undefined,
        batchNumber: batchIdx !== -1 ? cols[batchIdx] : undefined,
        manufacturingDate: mfgDateIdx !== -1 ? cols[mfgDateIdx] : undefined,
        expiryDate: expDateIdx !== -1 ? cols[expDateIdx] : undefined,
        gstRate: gstIdx !== -1 ? parseFloat(cols[gstIdx]) || undefined : undefined,
        hsnCode: hsnIdx !== -1 ? cols[hsnIdx] : undefined,
        brand: brandIdx !== -1 ? cols[brandIdx] : undefined,
        size: sizeIdx !== -1 ? cols[sizeIdx] : undefined,
        color: colorIdx !== -1 ? cols[colorIdx] : undefined,
        model: modelIdx !== -1 ? cols[modelIdx] : undefined,
        serialNumber: serialIdx !== -1 ? cols[serialIdx] : undefined,
        warrantyMonths: warrantyIdx !== -1 ? parseInt(cols[warrantyIdx], 10) || undefined : undefined,
        weight: weightIdx !== -1 ? cols[weightIdx] : undefined,
        material: materialIdx !== -1 ? cols[materialIdx] : undefined,
        dimensions: dimensionsIdx !== -1 ? cols[dimensionsIdx] : undefined,
        rackLocation: rackIdx !== -1 ? cols[rackIdx] : undefined,
        parentSku: parentSkuIdx !== -1 ? cols[parentSkuIdx] : undefined,
        wholesalePrice: wholesaleIdx !== -1 ? parseFloat(cols[wholesaleIdx]) || undefined : undefined,
        description: descIdx !== -1 ? cols[descIdx] : undefined,
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
    const isXlsx = ext === 'xlsx' || ext === 'xls';

    if (!isCsv && !isPdf && !isXlsx) {
      setIsExtracting(false);
      setErrorMessage('Please upload a valid Excel spreadsheet (.xlsx) or PDF (.pdf) file.');
      return;
    }

    setDetectedFileType(isPdf ? 'pdf' : 'xlsx');

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
          // Industry fields
          genericName: r.genericName || undefined,
          manufacturer: r.manufacturer || undefined,
          batchNumber: r.batchNumber || undefined,
          manufacturingDate: r.manufacturingDate || undefined,
          expiryDate: r.expiryDate || undefined,
          mrp: r.mrp !== undefined && r.mrp !== null ? Number(r.mrp) : undefined,
          gstRate: r.gstRate !== undefined && r.gstRate !== null ? Number(r.gstRate) : undefined,
          hsnCode: r.hsnCode || undefined,
          brand: r.brand || undefined,
          size: r.size || undefined,
          color: r.color || undefined,
          model: r.model || undefined,
          serialNumber: r.serialNumber || undefined,
          warrantyMonths: r.warrantyMonths !== undefined && r.warrantyMonths !== null ? Number(r.warrantyMonths) : undefined,
          weight: r.weight || undefined,
          material: r.material || undefined,
          dimensions: r.dimensions || undefined,
          rackLocation: r.rackLocation || undefined,
          parentSku: r.parentSku || undefined,
          wholesalePrice: r.wholesalePrice !== undefined && r.wholesalePrice !== null ? Number(r.wholesalePrice) : undefined,
          description: r.description || undefined,
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
        // File error from backend
        setErrorMessage(
          apiErr.message ||
            'Could not extract product items from this file. Please ensure the file has a clear table with column headings (SKU, Name, Price, Quantity) or download our Excel template.'
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
      const firstError = extractedRows.find((r) => r.errors && r.errors.length > 0)?.errors?.[0];
      setErrorMessage(
        firstError
          ? `No valid rows to import: ${firstError}`
          : 'No valid rows available to import. Check your file formatting or download the sample template below.'
      );
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
            // Industry specific parameters passed to backend
            genericName: r.genericName,
            manufacturer: r.manufacturer,
            batchNumber: r.batchNumber,
            manufacturingDate: r.manufacturingDate,
            expiryDate: r.expiryDate,
            mrp: r.mrp,
            gstRate: r.gstRate,
            hsnCode: r.hsnCode,
            brand: r.brand,
            size: r.size,
            color: r.color,
            model: r.model,
            serialNumber: r.serialNumber,
            warrantyMonths: r.warrantyMonths,
            weight: r.weight,
            material: r.material,
            dimensions: r.dimensions,
            rackLocation: r.rackLocation,
            parentSku: r.parentSku,
            wholesalePrice: r.wholesalePrice,
            description: r.description,
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
    <Portal>
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
              Upload an <span className="font-semibold text-[#1C1B18]">Excel spreadsheet (.xlsx)</span> or{' '}
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
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#381e12] !text-white hover:bg-[#26140c] transition-colors cursor-pointer shadow-xs"
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
                accept=".xlsx, .xls, .pdf, application/pdf, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv, .csv"
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
                      Upload your Excel spreadsheet or supplier invoice. Our system automatically extracts rows and prices.
                    </p>

                    {/* Supported Format Pills */}
                    <div className="flex items-center gap-2 mt-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[#EEE6DA] text-[11px] font-semibold text-[#1C1B18]">
                        <FileSpreadsheet size={13} className="text-[#107C41]" />
                        <span>.Excel Spreadsheets (.xlsx)</span>
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
                    <span>Need a starting format for {templateConfig.label}?</span>
                  </div>
                  <p className="text-[11px] text-[#6B665E]">
                    Download our ready-to-use Excel template or PDF sample customized with schema fields for {templateConfig.label}.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadTemplate('xlsx')}
                    className="px-3.5 py-1.5 rounded-xl border border-[#EEE6DA] bg-white text-xs font-semibold text-[#1C1B18] hover:bg-[#FAF6EF] transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1.5"
                  >
                    <FileSpreadsheet size={13} className="text-[#107C41]" />
                    <span>Download Excel Template (.xlsx)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadTemplate('pdf')}
                    className="px-3 py-1.5 rounded-xl border border-[#EEE6DA] bg-white text-xs font-semibold text-[#6B665E] hover:text-[#1C1B18] hover:bg-[#FAF6EF] transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1.5"
                  >
                    <FileText size={13} className="text-[#D64545]" />
                    <span>Download PDF Sample</span>
                  </button>
                </div>
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
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#E8F5EC] text-[#2E8B57]">
                        {templateConfig.label.split('&')[0].trim()}
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
                        {isPharmacy ? (
                          <>
                            <th className="py-2 px-3">Medicine & Salt</th>
                            <th className="py-2 px-3">Batch & Expiry</th>
                            <th className="py-2 px-3">Category</th>
                            <th className="py-2 px-3 text-right">Qty</th>
                            <th className="py-2 px-3 text-right">Cost (₹)</th>
                            <th className="py-2 px-3 text-right">Selling / MRP</th>
                            <th className="py-2 px-3 text-center">Status</th>
                          </>
                        ) : isClothing ? (
                          <>
                            <th className="py-2 px-3">Garment & SKU</th>
                            <th className="py-2 px-3">Size / Color</th>
                            <th className="py-2 px-3">Category</th>
                            <th className="py-2 px-3 text-right">Qty</th>
                            <th className="py-2 px-3 text-right">Purchase (₹)</th>
                            <th className="py-2 px-3 text-right">Retail (₹)</th>
                            <th className="py-2 px-3 text-center">Status</th>
                          </>
                        ) : isElectronics ? (
                          <>
                            <th className="py-2 px-3">Product & SKU</th>
                            <th className="py-2 px-3">Brand & Model</th>
                            <th className="py-2 px-3">Warranty</th>
                            <th className="py-2 px-3 text-right">Qty</th>
                            <th className="py-2 px-3 text-right">Purchase (₹)</th>
                            <th className="py-2 px-3 text-right">Retail (₹)</th>
                            <th className="py-2 px-3 text-center">Status</th>
                          </>
                        ) : isGrocery ? (
                          <>
                            <th className="py-2 px-3">Item & SKU</th>
                            <th className="py-2 px-3">Pack / Weight</th>
                            <th className="py-2 px-3">Expiry</th>
                            <th className="py-2 px-3 text-right">Qty</th>
                            <th className="py-2 px-3 text-right">Purchase (₹)</th>
                            <th className="py-2 px-3 text-right">Retail (₹)</th>
                            <th className="py-2 px-3 text-center">Status</th>
                          </>
                        ) : isHardware ? (
                          <>
                            <th className="py-2 px-3">Item & Part #</th>
                            <th className="py-2 px-3">Specs / Material</th>
                            <th className="py-2 px-3">Rack Loc.</th>
                            <th className="py-2 px-3 text-right">Qty</th>
                            <th className="py-2 px-3 text-right">Purchase (₹)</th>
                            <th className="py-2 px-3 text-right">Retail (₹)</th>
                            <th className="py-2 px-3 text-center">Status</th>
                          </>
                        ) : (
                          <>
                            <th className="py-2 px-3">SKU</th>
                            <th className="py-2 px-3">Product Name</th>
                            <th className="py-2 px-3">Category</th>
                            <th className="py-2 px-3 text-right">Qty</th>
                            <th className="py-2 px-3 text-right">Purchase (₹)</th>
                            <th className="py-2 px-3 text-right">Retail (₹)</th>
                            <th className="py-2 px-3 text-center">Status</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EEE6DA]">
                      {extractedRows.slice(0, 50).map((row, idx) => (
                        <tr key={`${row.sku}-${idx}`} className="hover:bg-[#FAF6EF]/40 transition-colors">
                          {isPharmacy ? (
                            <>
                              <td className="py-2 px-3">
                                <div className="font-semibold text-[#1C1B18] max-w-[200px] truncate">{row.name}</div>
                                {row.genericName && (
                                  <div className="text-[10px] text-[#2E8B57] font-medium truncate max-w-[200px]">
                                    {row.genericName}
                                  </div>
                                )}
                                <div className="text-[9.5px] text-[#8C827A] font-mono">{row.sku}</div>
                              </td>
                              <td className="py-2 px-3">
                                {row.batchNumber ? (
                                  <div className="font-mono text-[11px] font-semibold text-[#1C1B18]">
                                    {row.batchNumber}
                                  </div>
                                ) : (
                                  <span className="text-[#8C827A]">—</span>
                                )}
                                {row.expiryDate && (
                                  <div className="text-[10px] text-[#D97706] font-medium">Exp: {row.expiryDate}</div>
                                )}
                              </td>
                              <td className="py-2 px-3 text-[#6B665E]">{row.category}</td>
                              <td className="py-2 px-3 text-right font-bold text-[#1C1B18] tabular-nums">
                                {row.quantity} {row.unit || 'strip'}
                              </td>
                              <td className="py-2 px-3 text-right text-[#6B665E] tabular-nums">
                                {formatINR(row.purchasePrice)}
                              </td>
                              <td className="py-2 px-3 text-right tabular-nums">
                                <div className="font-bold text-[#2E8B57]">{formatINR(row.sellingPrice)}</div>
                                {row.mrp ? (
                                  <div className="text-[10px] text-[#8C827A]">MRP: {formatINR(row.mrp)}</div>
                                ) : null}
                              </td>
                            </>
                          ) : isClothing ? (
                            <>
                              <td className="py-2 px-3">
                                <div className="font-semibold text-[#1C1B18] max-w-[200px] truncate">{row.name}</div>
                                <div className="text-[9.5px] text-[#8C827A] font-mono">{row.sku}</div>
                              </td>
                              <td className="py-2 px-3">
                                {row.size || row.color ? (
                                  <span className="px-1.5 py-0.5 rounded bg-[#FAF6EF] border border-[#EEE6DA] text-[#381e12] font-semibold text-[10px]">
                                    {[row.size, row.color].filter(Boolean).join(' / ')}
                                  </span>
                                ) : (
                                  <span className="text-[#8C827A]">—</span>
                                )}
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
                            </>
                          ) : isElectronics ? (
                            <>
                              <td className="py-2 px-3">
                                <div className="font-semibold text-[#1C1B18] max-w-[200px] truncate">{row.name}</div>
                                <div className="text-[9.5px] text-[#8C827A] font-mono">{row.sku}</div>
                              </td>
                              <td className="py-2 px-3 text-[#6B665E]">
                                {[row.brand, row.model].filter(Boolean).join(' · ') || '—'}
                              </td>
                              <td className="py-2 px-3">
                                {row.warrantyMonths ? (
                                  <span className="text-[10.5px] text-[#2563EB] font-medium">{row.warrantyMonths}m Warranty</span>
                                ) : (
                                  <span className="text-[#8C827A]">—</span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-right font-bold text-[#1C1B18] tabular-nums">
                                {row.quantity} {row.unit || 'pcs'}
                              </td>
                              <td className="py-2 px-3 text-right text-[#6B665E] tabular-nums">
                                {formatINR(row.purchasePrice)}
                              </td>
                              <td className="py-2 px-3 text-right font-bold text-[#2E8B57] tabular-nums">
                                {formatINR(row.sellingPrice)}
                              </td>
                            </>
                          ) : isGrocery ? (
                            <>
                              <td className="py-2 px-3">
                                <div className="font-semibold text-[#1C1B18] max-w-[200px] truncate">{row.name}</div>
                                <div className="text-[9.5px] text-[#8C827A] font-mono">{row.sku}</div>
                              </td>
                              <td className="py-2 px-3 text-[#6B665E] font-medium">
                                {row.weight || row.unit || '—'}
                              </td>
                              <td className="py-2 px-3">
                                {row.expiryDate ? (
                                  <span className="text-[10.5px] text-[#D97706] font-medium">{row.expiryDate}</span>
                                ) : (
                                  <span className="text-[#8C827A]">—</span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-right font-bold text-[#1C1B18] tabular-nums">
                                {row.quantity} {row.unit || 'pack'}
                              </td>
                              <td className="py-2 px-3 text-right text-[#6B665E] tabular-nums">
                                {formatINR(row.purchasePrice)}
                              </td>
                              <td className="py-2 px-3 text-right font-bold text-[#2E8B57] tabular-nums">
                                {formatINR(row.sellingPrice)}
                              </td>
                            </>
                          ) : isHardware ? (
                            <>
                              <td className="py-2 px-3">
                                <div className="font-semibold text-[#1C1B18] max-w-[200px] truncate">{row.name}</div>
                                <div className="text-[9.5px] text-[#8C827A] font-mono">{row.sku}</div>
                              </td>
                              <td className="py-2 px-3 text-[#6B665E]">
                                {[row.dimensions, row.material].filter(Boolean).join(' · ') || '—'}
                              </td>
                              <td className="py-2 px-3 font-mono text-[10px] text-[#6B665E]">
                                {row.rackLocation || '—'}
                              </td>
                              <td className="py-2 px-3 text-right font-bold text-[#1C1B18] tabular-nums">
                                {row.quantity} {row.unit || 'pcs'}
                              </td>
                              <td className="py-2 px-3 text-right text-[#6B665E] tabular-nums">
                                {formatINR(row.purchasePrice)}
                              </td>
                              <td className="py-2 px-3 text-right font-bold text-[#2E8B57] tabular-nums">
                                {formatINR(row.sellingPrice)}
                              </td>
                            </>
                          ) : (
                            <>
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
                            </>
                          )}
                          <td className="py-2 px-3 text-center">
                            {row.valid === false ? (
                              <span
                                className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#FDECEC] text-[#D64545]"
                                title={row.errors?.join(', ')}
                              >
                                Invalid
                              </span>
                            ) : row.duplicate ? (
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
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#381e12] hover:bg-[#26140c] text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {extractedRows.length > 0 && !successInfo && (
            <button
              type="button"
              disabled={isImporting}
              onClick={handleConfirmImport}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#381e12] hover:bg-[#26140c] !text-white transition-all cursor-pointer shadow-md inline-flex items-center gap-1.5 disabled:opacity-50"
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
    </Portal>
  );
};

