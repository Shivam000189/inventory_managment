import ExcelJS from 'exceljs'

export const INDUSTRY_TEMPLATES = {
  pharmacy: {
    industry: 'pharmacy',
    label: 'Pharmacy & Healthcare',
    filenamePrefix: 'pharmacy_medicines_import_template',
    sheetName: 'Medicines Catalog',
    columns: [
      { key: 'sku', header: 'SKU', width: 16, description: 'Unique Medicine/Product Code', required: true },
      { key: 'name', header: 'Medicine Name', width: 28, description: 'Brand/Product name (e.g. Dolo 650mg)', required: true },
      { key: 'genericName', header: 'Generic / Salt Name', width: 32, description: 'Active pharmaceutical ingredient (e.g. Paracetamol)', required: true },
      { key: 'category', header: 'Category', width: 16, description: 'Form or therapeutic class (Tablets, Syrups, Injections)', required: true },
      { key: 'manufacturer', header: 'Manufacturer', width: 24, description: 'Pharma company (e.g. Micro Labs, Cipla, Sun Pharma)' },
      { key: 'batchNumber', header: 'Batch Number', width: 18, description: 'Manufacturing batch / lot number (e.g. B-9824)' },
      { key: 'manufacturingDate', header: 'Mfg Date (YYYY-MM-DD)', width: 20, description: 'Date of manufacturing' },
      { key: 'expiryDate', header: 'Expiry Date (YYYY-MM-DD)', width: 20, description: 'Expiry date for shelf-life tracking' },
      { key: 'stock', header: 'Stock (Quantity)', width: 16, description: 'Current stock count', required: true },
      { key: 'unit', header: 'Unit', width: 12, description: 'strip, bottle, vial, tube, box, pcs' },
      { key: 'purchasePrice', header: 'Purchase Price', width: 16, description: 'Purchase cost per unit', required: true },
      { key: 'sellingPrice', header: 'Selling Price', width: 16, description: 'Retail sale price per unit', required: true },
      { key: 'mrp', header: 'MRP', width: 14, description: 'Maximum Retail Price printed on packaging' },
      { key: 'gstRate', header: 'GST %', width: 12, description: 'Tax percentage (e.g. 5, 12, 18)' },
      { key: 'hsnCode', header: 'HSN Code', width: 14, description: 'HSN code (e.g. 3004)' },
      { key: 'barcode', header: 'Barcode', width: 18, description: 'EAN / UPC barcode' },
      { key: 'rackLocation', header: 'Rack / Shelf Location', width: 20, description: 'Store aisle / rack code (e.g. RACK-B2)' },
      { key: 'description', header: 'Storage / Instructions', width: 36, description: 'e.g. Store below 25°C in dry place' },
    ],
    sampleRows: [
      {
        sku: 'MED-DOLO-650',
        name: 'Dolo 650mg Tablet',
        genericName: 'Paracetamol 650mg',
        category: 'Tablets',
        manufacturer: 'Micro Labs Ltd',
        batchNumber: 'ML-2026-A1',
        manufacturingDate: '2026-01-15',
        expiryDate: '2028-12-31',
        stock: 250,
        unit: 'strip',
        purchasePrice: 22.5,
        sellingPrice: 34.0,
        mrp: 34.0,
        gstRate: 12,
        hsnCode: '30049060',
        barcode: '8901117002410',
        rackLocation: 'RACK-A1-T04',
        description: 'Analgesic and antipyretic for fever relief. Store in cool place.',
      },
      {
        sku: 'MED-PAN-40',
        name: 'Pan 40 Tablet',
        genericName: 'Pantoprazole 40mg',
        category: 'Tablets',
        manufacturer: 'Alkem Laboratories',
        batchNumber: 'ALK-8842',
        manufacturingDate: '2026-02-10',
        expiryDate: '2028-08-31',
        stock: 180,
        unit: 'strip',
        purchasePrice: 78.0,
        sellingPrice: 135.0,
        mrp: 155.0,
        gstRate: 12,
        hsnCode: '30049099',
        barcode: '8901234567891',
        rackLocation: 'RACK-A2-T01',
        description: 'Proton-pump inhibitor for acidity and gastroesophageal reflux.',
      },
      {
        sku: 'MED-AUG-625',
        name: 'Augmentin 625 Duo',
        genericName: 'Amoxicillin 500mg + Clavulanic Acid 125mg',
        category: 'Antibiotics',
        manufacturer: 'GSK Pharmaceuticals',
        batchNumber: 'GSK-4019',
        manufacturingDate: '2026-03-01',
        expiryDate: '2027-11-30',
        stock: 120,
        unit: 'strip',
        purchasePrice: 145.0,
        sellingPrice: 205.0,
        mrp: 223.5,
        gstRate: 12,
        hsnCode: '30041000',
        barcode: '8901034011221',
        rackLocation: 'RACK-B1-T02',
        description: 'Broad-spectrum antibiotic for bacterial infections.',
      },
      {
        sku: 'MED-AZI-500',
        name: 'Azithral 500 Tablet',
        genericName: 'Azithromycin 500mg',
        category: 'Antibiotics',
        manufacturer: 'Alembic Pharma',
        batchNumber: 'AL-5521',
        manufacturingDate: '2026-01-20',
        expiryDate: '2028-06-30',
        stock: 90,
        unit: 'strip',
        purchasePrice: 95.0,
        sellingPrice: 132.0,
        mrp: 140.0,
        gstRate: 12,
        hsnCode: '30042000',
        barcode: '8901456123456',
        rackLocation: 'RACK-B1-T05',
        description: 'Macrolide antibiotic for respiratory tract infections.',
      },
      {
        sku: 'MED-CET-10',
        name: 'Cetzine 10mg',
        genericName: 'Cetirizine Dihydrochloride 10mg',
        category: 'Antihistamines',
        manufacturer: 'Dr Reddys Laboratories',
        batchNumber: 'DR-1188',
        manufacturingDate: '2026-02-15',
        expiryDate: '2029-01-31',
        stock: 300,
        unit: 'strip',
        purchasePrice: 12.0,
        sellingPrice: 21.0,
        mrp: 23.5,
        gstRate: 12,
        hsnCode: '30049090',
        barcode: '8901230044112',
        rackLocation: 'RACK-C1-T03',
        description: 'Anti-allergy medication for rhinitis and urticaria.',
      },
    ],
  },
  clothing: {
    industry: 'clothing',
    label: 'Clothing & Apparel',
    filenamePrefix: 'clothing_apparel_import_template',
    sheetName: 'Apparel Catalog',
    columns: [
      { key: 'parentSku', header: 'Parent SKU / Style Code', width: 22, description: 'Master style code (e.g. POLO-001)', required: true },
      { key: 'sku', header: 'Variant SKU', width: 20, description: 'Unique size/color SKU (e.g. POLO-001-M-BLK)', required: true },
      { key: 'name', header: 'Product Name', width: 28, description: 'Style / Garment name', required: true },
      { key: 'category', header: 'Category', width: 18, description: 'Shirts, T-Shirts, Jeans, Trousers, Dresses', required: true },
      { key: 'brand', header: 'Brand', width: 18, description: 'Brand / Label name' },
      { key: 'size', header: 'Size', width: 12, description: 'XS, S, M, L, XL, 2XL, 30, 32, 34', required: true },
      { key: 'color', header: 'Color', width: 14, description: 'Black, Navy, White, Olive, Maroon', required: true },
      { key: 'material', header: 'Material / Fabric', width: 18, description: '100% Cotton, Poly-Cotton, Linen, Denim' },
      { key: 'stock', header: 'Stock (Quantity)', width: 16, description: 'Units in inventory', required: true },
      { key: 'unit', header: 'Unit', width: 10, description: 'pcs, set, pair' },
      { key: 'purchasePrice', header: 'Cost Price', width: 14, description: 'Garment production/purchase cost', required: true },
      { key: 'sellingPrice', header: 'Retail Price', width: 14, description: 'Standard sales price', required: true },
      { key: 'mrp', header: 'MRP', width: 14, description: 'Maximum Retail Price on tag' },
      { key: 'gstRate', header: 'GST %', width: 10, description: 'e.g. 5 or 12' },
      { key: 'hsnCode', header: 'HSN Code', width: 14, description: 'e.g. 6109, 6203' },
      { key: 'barcode', header: 'Barcode (EAN/UPC)', width: 18, description: 'Scan barcode for POS' },
      { key: 'rackLocation', header: 'Aisle / Bin Location', width: 18, description: 'Store bin or rack code' },
      { key: 'description', header: 'Design & Fit Details', width: 30, description: 'Slim fit, bio-washed, solid polo' },
    ],
    sampleRows: [
      {
        parentSku: 'POLO-SLIM-01',
        sku: 'POLO-SLIM-01-S-BLK',
        name: 'Classic Pique Polo Shirt',
        category: 'T-Shirts',
        brand: 'Aflix Studio',
        size: 'S',
        color: 'Black',
        material: '100% Combed Cotton',
        stock: 35,
        unit: 'pcs',
        purchasePrice: 280,
        sellingPrice: 599,
        mrp: 899,
        gstRate: 5,
        hsnCode: '61051000',
        barcode: '8907712001011',
        rackLocation: 'BIN-TSHIRT-01',
        description: 'Slim fit breathable pique polo shirt with ribbed collar.',
      },
      {
        parentSku: 'POLO-SLIM-01',
        sku: 'POLO-SLIM-01-M-BLK',
        name: 'Classic Pique Polo Shirt',
        category: 'T-Shirts',
        brand: 'Aflix Studio',
        size: 'M',
        color: 'Black',
        material: '100% Combed Cotton',
        stock: 50,
        unit: 'pcs',
        purchasePrice: 280,
        sellingPrice: 599,
        mrp: 899,
        gstRate: 5,
        hsnCode: '61051000',
        barcode: '8907712001028',
        rackLocation: 'BIN-TSHIRT-01',
        description: 'Slim fit breathable pique polo shirt with ribbed collar.',
      },
      {
        parentSku: 'POLO-SLIM-01',
        sku: 'POLO-SLIM-01-L-NVY',
        name: 'Classic Pique Polo Shirt',
        category: 'T-Shirts',
        brand: 'Aflix Studio',
        size: 'L',
        color: 'Navy Blue',
        material: '100% Combed Cotton',
        stock: 45,
        unit: 'pcs',
        purchasePrice: 280,
        sellingPrice: 599,
        mrp: 899,
        gstRate: 5,
        hsnCode: '61051000',
        barcode: '8907712001035',
        rackLocation: 'BIN-TSHIRT-02',
        description: 'Slim fit breathable pique polo shirt with ribbed collar.',
      },
      {
        parentSku: 'JEAN-SLM-501',
        sku: 'JEAN-SLM-501-32-BLU',
        name: 'Vintage Slim Stretch Denim',
        category: 'Jeans',
        brand: 'Aflix Denim',
        size: '32',
        color: 'Mid Indigo',
        material: '98% Cotton 2% Elastane',
        stock: 25,
        unit: 'pcs',
        purchasePrice: 650,
        sellingPrice: 1499,
        mrp: 1999,
        gstRate: 12,
        hsnCode: '62034200',
        barcode: '8907712002018',
        rackLocation: 'RACK-JEAN-04',
        description: 'Mid-rise 5-pocket denim with comfort stretch wash.',
      },
    ],
  },
  electronics: {
    industry: 'electronics',
    label: 'Electronics & Gadgets',
    filenamePrefix: 'electronics_catalog_import_template',
    sheetName: 'Electronics Catalog',
    columns: [
      { key: 'sku', header: 'SKU / Item Code', width: 18, description: 'Product identifier', required: true },
      { key: 'name', header: 'Product Name', width: 28, description: 'Gadget or device name', required: true },
      { key: 'category', header: 'Category', width: 18, description: 'Smartphones, Audio, Laptops, Accessories', required: true },
      { key: 'brand', header: 'Brand / Make', width: 18, description: 'Manufacturer brand' },
      { key: 'model', header: 'Model Number', width: 18, description: 'Model / Variant identifier' },
      { key: 'serialNumber', header: 'Serial / IMEI (Sample)', width: 22, description: 'Primary serial number if tracking single units' },
      { key: 'warrantyMonths', header: 'Warranty (Months)', width: 18, description: 'Warranty period in months (e.g. 12, 24)' },
      { key: 'stock', header: 'Stock (Quantity)', width: 16, description: 'Available stock quantity', required: true },
      { key: 'unit', header: 'Unit', width: 10, description: 'pcs, set' },
      { key: 'purchasePrice', header: 'Purchase Cost', width: 16, description: 'Dealer purchase price', required: true },
      { key: 'sellingPrice', header: 'Selling Price', width: 16, description: 'Retail sale price', required: true },
      { key: 'mrp', header: 'MRP', width: 14, description: 'Maximum Retail Price' },
      { key: 'gstRate', header: 'GST %', width: 12, description: 'Standard 18% or 28%' },
      { key: 'hsnCode', header: 'HSN Code', width: 14, description: 'e.g. 8517, 8518' },
      { key: 'barcode', header: 'Barcode', width: 18, description: 'EAN / UPC barcode' },
      { key: 'description', header: 'Specifications', width: 34, description: 'Key hardware specifications and warranty terms' },
    ],
    sampleRows: [
      {
        sku: 'ELEC-ANC-HEAD-01',
        name: 'Pro Wireless ANC Headphones',
        category: 'Audio',
        brand: 'SoundPulse',
        model: 'SP-WH900',
        serialNumber: 'SP900-SN-88019',
        warrantyMonths: 12,
        stock: 20,
        unit: 'pcs',
        purchasePrice: 2800,
        sellingPrice: 4499,
        mrp: 5999,
        gstRate: 18,
        hsnCode: '85183000',
        barcode: '8908819001019',
        description: 'Active Noise Cancelling over-ear headphones with 40hr battery life.',
      },
      {
        sku: 'ELEC-65W-GAN-CHG',
        name: '65W GaN Fast Charger Dual USB-C',
        category: 'Accessories',
        brand: 'PowerFlow',
        model: 'PF-GAN65',
        serialNumber: '',
        warrantyMonths: 24,
        stock: 60,
        unit: 'pcs',
        purchasePrice: 650,
        sellingPrice: 1299,
        mrp: 1799,
        gstRate: 18,
        hsnCode: '85044090',
        barcode: '8908819002016',
        description: 'Dual Type-C fast charger compatible with laptops and smartphones.',
      },
    ],
  },
  grocery: {
    industry: 'grocery',
    label: 'Grocery & Supermarket',
    filenamePrefix: 'grocery_products_import_template',
    sheetName: 'Grocery Catalog',
    columns: [
      { key: 'sku', header: 'SKU / Barcode Key', width: 18, description: 'Item identifier or barcode', required: true },
      { key: 'name', header: 'Item Name', width: 28, description: 'Grocery product name and pack size', required: true },
      { key: 'category', header: 'Category', width: 18, description: 'Staples, Snacks, Dairy, Beverages, Personal Care', required: true },
      { key: 'brand', header: 'Brand', width: 18, description: 'Brand / Manufacturer' },
      { key: 'weight', header: 'Weight / Pack Size', width: 18, description: '500g, 1kg, 5kg, 1L, 200ml' },
      { key: 'expiryDate', header: 'Best Before / Expiry (YYYY-MM-DD)', width: 26, description: 'Shelf life expiry' },
      { key: 'stock', header: 'Stock (Quantity)', width: 16, description: 'Stock in inventory', required: true },
      { key: 'unit', header: 'Unit', width: 12, description: 'pcs, packet, pouch, kg, box' },
      { key: 'purchasePrice', header: 'Purchase Rate', width: 16, description: 'Wholesale purchase rate', required: true },
      { key: 'sellingPrice', header: 'Selling Price', width: 16, description: 'Store sale price', required: true },
      { key: 'mrp', header: 'MRP', width: 14, description: 'Printed packaging MRP' },
      { key: 'gstRate', header: 'GST %', width: 12, description: '0%, 5%, 12%, or 18%' },
      { key: 'hsnCode', header: 'HSN Code', width: 14, description: 'e.g. 1006, 1515, 2106' },
      { key: 'barcode', header: 'EAN Barcode', width: 18, description: 'Retail barcode for POS billing' },
      { key: 'rackLocation', header: 'Aisle / Shelf', width: 18, description: 'Supermarket aisle identifier' },
    ],
    sampleRows: [
      {
        sku: 'GROC-BAS-RICE-5K',
        name: 'Royal Basmati Rice 5kg Pack',
        category: 'Staples',
        brand: 'Heritage Grains',
        weight: '5 kg',
        expiryDate: '2027-06-30',
        stock: 40,
        unit: 'bag',
        purchasePrice: 420,
        sellingPrice: 549,
        mrp: 625,
        gstRate: 5,
        hsnCode: '10063020',
        barcode: '8902211001014',
        rackLocation: 'AISLE-03-BAY-A',
      },
      {
        sku: 'GROC-EV-OLV-OIL',
        name: 'Extra Virgin Olive Oil 1L',
        category: 'Oils & Ghee',
        brand: 'TerraPure',
        weight: '1 Litre',
        expiryDate: '2027-12-31',
        stock: 30,
        unit: 'bottle',
        purchasePrice: 680,
        sellingPrice: 899,
        mrp: 1099,
        gstRate: 5,
        hsnCode: '15091000',
        barcode: '8902211002011',
        rackLocation: 'AISLE-04-BAY-B',
      },
    ],
  },
  hardware: {
    industry: 'hardware',
    label: 'Hardware & Tools',
    filenamePrefix: 'hardware_tools_import_template',
    sheetName: 'Hardware Catalog',
    columns: [
      { key: 'sku', header: 'SKU / Part Number', width: 18, description: 'Tool or hardware part number', required: true },
      { key: 'name', header: 'Item Name / Description', width: 28, description: 'Tool or material name', required: true },
      { key: 'category', header: 'Category', width: 18, description: 'Power Tools, Fasteners, Plumbing, Electrical', required: true },
      { key: 'brand', header: 'Brand', width: 18, description: 'Manufacturer brand' },
      { key: 'material', header: 'Material / Grade', width: 18, description: 'SS 304, High Carbon Steel, Brass, PVC' },
      { key: 'dimensions', header: 'Size / Dimensions', width: 18, description: '10mm, 1/2 inch, 2m, 100mm' },
      { key: 'stock', header: 'Stock (Quantity)', width: 16, description: 'Quantity in store', required: true },
      { key: 'unit', header: 'Unit', width: 12, description: 'pcs, box, roll, meter, kg' },
      { key: 'purchasePrice', header: 'Purchase Cost', width: 16, description: 'Cost price per unit', required: true },
      { key: 'sellingPrice', header: 'Selling Price', width: 16, description: 'Retail price', required: true },
      { key: 'wholesalePrice', header: 'Wholesale Price', width: 16, description: 'Contractor / Bulk price' },
      { key: 'mrp', header: 'MRP', width: 14, description: 'Maximum Retail Price' },
      { key: 'gstRate', header: 'GST %', width: 12, description: 'Standard 18% or 28%' },
      { key: 'hsnCode', header: 'HSN Code', width: 14, description: 'e.g. 8204, 7318' },
      { key: 'rackLocation', header: 'Rack / Bin Location', width: 18, description: 'Warehouse bin/rack location' },
    ],
    sampleRows: [
      {
        sku: 'HDW-SS-BOLT-M8',
        name: 'Hex Bolt M8 x 50mm Stainless Steel',
        category: 'Fasteners',
        brand: 'Apex Fasteners',
        material: 'SS 304 Grade',
        dimensions: 'M8 x 50mm',
        stock: 500,
        unit: 'pcs',
        purchasePrice: 4.5,
        sellingPrice: 8.0,
        wholesalePrice: 6.0,
        mrp: 10.0,
        gstRate: 18,
        hsnCode: '73181500',
        rackLocation: 'BIN-FAS-08',
      },
      {
        sku: 'TOOL-IMP-DRL-13',
        name: 'Professional Impact Drill 650W 13mm',
        category: 'Power Tools',
        brand: 'TorqueMax',
        material: 'Reinforced Composite',
        dimensions: '13mm Chuck',
        stock: 15,
        unit: 'pcs',
        purchasePrice: 1650,
        sellingPrice: 2499,
        wholesalePrice: 2150,
        mrp: 3199,
        gstRate: 18,
        hsnCode: '84672100',
        rackLocation: 'RACK-TOOL-02',
      },
    ],
  },
  automobile: {
    industry: 'automobile',
    label: 'Automobile & Spare Parts',
    filenamePrefix: 'automobile_parts_import_template',
    sheetName: 'Auto Parts Catalog',
    columns: [
      { key: 'sku', header: 'Part Number / SKU', width: 20, description: 'OEM or aftermarket part number', required: true },
      { key: 'name', header: 'Part Name', width: 28, description: 'Component name (e.g. Front Brake Pad Set)', required: true },
      { key: 'category', header: 'Category', width: 18, description: 'Brakes, Suspension, Engine, Filters, Electrical', required: true },
      { key: 'brand', header: 'Manufacturer / Brand', width: 20, description: 'Bosch, Brembo, NGK, Denso' },
      { key: 'model', header: 'Vehicle Compatibility / Model', width: 26, description: 'Applicable car/bike models' },
      { key: 'stock', header: 'Stock (Quantity)', width: 16, description: 'Stock count', required: true },
      { key: 'unit', header: 'Unit', width: 12, description: 'set, pcs, pair, box' },
      { key: 'purchasePrice', header: 'Purchase Cost', width: 16, description: 'Distributor cost', required: true },
      { key: 'sellingPrice', header: 'Selling Price', width: 16, description: 'Garage / retail price', required: true },
      { key: 'mrp', header: 'MRP', width: 14, description: 'Printed MRP on packaging' },
      { key: 'gstRate', header: 'GST %', width: 12, description: 'e.g. 18 or 28' },
      { key: 'hsnCode', header: 'HSN Code', width: 14, description: 'e.g. 8708, 8421' },
      { key: 'barcode', header: 'Barcode', width: 18, description: 'Part barcode' },
      { key: 'rackLocation', header: 'Rack / Bay Code', width: 18, description: 'Store bin location' },
    ],
    sampleRows: [
      {
        sku: 'AUTO-BRK-PAD-FR',
        name: 'Ceramic Front Brake Pad Set',
        category: 'Braking System',
        brand: 'Bosch Auto',
        model: 'Universal / Sedan Platform B',
        stock: 25,
        unit: 'set',
        purchasePrice: 950,
        sellingPrice: 1550,
        mrp: 1899,
        gstRate: 18,
        hsnCode: '87083000',
        barcode: '8904419001018',
        rackLocation: 'RACK-BRK-01',
      },
      {
        sku: 'AUTO-OIL-FLT-D',
        name: 'High Efficiency Spin-On Oil Filter',
        category: 'Filters',
        brand: 'Mann Filter',
        model: 'Diesel 1.5L / 2.0L Engines',
        stock: 60,
        unit: 'pcs',
        purchasePrice: 180,
        sellingPrice: 340,
        mrp: 420,
        gstRate: 18,
        hsnCode: '84212300',
        barcode: '8904419002015',
        rackLocation: 'BIN-FLT-04',
      },
    ],
  },
  other: {
    industry: 'general',
    label: 'General & Wholesale',
    filenamePrefix: 'wholesale_product_import_template',
    sheetName: 'Products Catalog',
    columns: [
      { key: 'sku', header: 'SKU / Item Code', width: 18, description: 'Unique product code', required: true },
      { key: 'name', header: 'Product Name', width: 28, description: 'Full item name', required: true },
      { key: 'category', header: 'Category', width: 18, description: 'Product category', required: true },
      { key: 'brand', header: 'Brand', width: 18, description: 'Manufacturer or brand name' },
      { key: 'stock', header: 'Quantity (Stock)', width: 16, description: 'Opening stock count', required: true },
      { key: 'unit', header: 'Unit of Measure', width: 14, description: 'pcs, box, kg, pack' },
      { key: 'purchasePrice', header: 'Purchase Cost', width: 16, description: 'Cost price per unit', required: true },
      { key: 'sellingPrice', header: 'Selling Price', width: 16, description: 'Retail selling price', required: true },
      { key: 'mrp', header: 'MRP', width: 14, description: 'Maximum Retail Price' },
      { key: 'wholesalePrice', header: 'Wholesale Price', width: 16, description: 'Bulk order price' },
      { key: 'gstRate', header: 'GST %', width: 12, description: 'Tax percentage' },
      { key: 'hsnCode', header: 'HSN Code', width: 14, description: 'Tax classification code' },
      { key: 'barcode', header: 'Barcode', width: 18, description: 'EAN / UPC code' },
      { key: 'rackLocation', header: 'Shelf Location', width: 18, description: 'Store location' },
      { key: 'description', header: 'Product Description', width: 32, description: 'Product details' },
    ],
    sampleRows: [
      {
        sku: 'GEN-PREM-ITEM-01',
        name: 'Premium Everyday Product Pack',
        category: 'General Goods',
        brand: 'Standard Brand',
        stock: 100,
        unit: 'pcs',
        purchasePrice: 120,
        sellingPrice: 199,
        wholesalePrice: 160,
        mrp: 249,
        gstRate: 18,
        hsnCode: '99999999',
        barcode: '8901000000018',
        rackLocation: 'RACK-GEN-01',
        description: 'Standard packaged merchandise for retail distribution.',
      },
    ],
  },
}

export function getIndustryTemplate(rawIndustry) {
  const norm = String(rawIndustry || '').toLowerCase().trim()
  if (norm.includes('pharma') || norm.includes('chem') || norm.includes('medic')) {
    return INDUSTRY_TEMPLATES.pharmacy
  }
  if (norm.includes('cloth') || norm.includes('apparel') || norm.includes('garment') || norm.includes('fashion')) {
    return INDUSTRY_TEMPLATES.clothing
  }
  if (norm.includes('elect') || norm.includes('tech') || norm.includes('gadget') || norm.includes('mobile')) {
    return INDUSTRY_TEMPLATES.electronics
  }
  if (norm.includes('groc') || norm.includes('supermarket') || norm.includes('food') || norm.includes('fmcg')) {
    return INDUSTRY_TEMPLATES.grocery
  }
  if (norm.includes('hard') || norm.includes('tool') || norm.includes('steel') || norm.includes('plumb')) {
    return INDUSTRY_TEMPLATES.hardware
  }
  if (norm.includes('auto') || norm.includes('vehicle') || norm.includes('car') || norm.includes('motor')) {
    return INDUSTRY_TEMPLATES.automobile
  }
  return INDUSTRY_TEMPLATES.other
}

/**
 * Generates an Excel (.xlsx) file buffer with styled headers, custom column widths, and sample rows
 */
export async function generateExcelTemplate(rawIndustry, businessName) {
  const config = getIndustryTemplate(rawIndustry)
  const workbook = new ExcelJS.Workbook()
  workbook.creator = businessName || 'Inventory Management System'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet(config.sheetName || 'Product Catalog', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })

  sheet.columns = config.columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width || 18,
  }))

  // Style header row
  const headerRow = sheet.getRow(1)
  headerRow.height = 28
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10, name: 'Calibri' }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' }, // Slate-800
  }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }

  // Add sample rows
  config.sampleRows.forEach((row, idx) => {
    const dataRow = sheet.addRow(row)
    dataRow.height = 20
    dataRow.font = { size: 9.5, name: 'Calibri' }
    dataRow.alignment = { vertical: 'middle', horizontal: 'left' }

    if (idx % 2 === 1) {
      dataRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF8FAFC' },
      }
    }
  })

  // Set borders for cells
  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      }
    })
  })

  const buffer = await workbook.xlsx.writeBuffer()
  const cleanBizName = businessName ? `_${businessName.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 20)}` : ''
  const filename = `${config.filenamePrefix}${cleanBizName}.xlsx`

  return { filename, buffer }
}

/**
 * Generates a clean PDF document buffer with industry guidelines, required fields, and sample tabular data
 */
export async function generatePdfTemplate(rawIndustry, businessName) {
  const config = getIndustryTemplate(rawIndustry)
  const cleanBizName = businessName ? `_${businessName.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 20)}` : ''
  const filename = `${config.filenamePrefix}${cleanBizName}.pdf`

  // A4 Landscape: 842 x 595 pt
  const width = 842
  const height = 595
  const margin = 36
  const contentWidth = width - margin * 2 // 770 pt

  let stream = ''

  // Top Title Bar
  stream += '0.12 0.16 0.23 rg\n' // Slate 900
  stream += `${margin} 535 ${contentWidth} 32 re f\n`
  const titleText = `${config.label} - Bulk Product Import Specification & Sample`
  stream += `BT /F1 13 Tf 1 1 1 rg ${margin + 12} 546 Td (${titleText.replace(/[()\\\\]/g, '')}) Tj ET\n`

  // Subtitle / Guidance
  const subText = `Store: ${businessName || 'Catalog'} | Required columns: SKU, Name, Category, Stock, Price. Upload in .xlsx or .pdf format.`
  stream += `BT /F2 9.5 Tf 0.35 0.35 0.38 rg ${margin} 516 Td (${subText.replace(/[()\\\\]/g, '')}) Tj ET\n`

  // Render Table of Sample Items
  const displayCols = config.columns.slice(0, 9)
  const colCount = displayCols.length
  const colWidth = contentWidth / colCount
  const tableTop = 490
  const rowHeight = 22

  // Table Header Background
  stream += '0.93 0.95 0.98 rg\n'
  stream += `${margin} ${tableTop - rowHeight} ${contentWidth} ${rowHeight} re f\n`
  stream += '0.75 0.8 0.85 RG 1 w\n'
  stream += `${margin} ${tableTop - rowHeight} ${contentWidth} ${rowHeight} re S\n`

  // Header Titles
  for (let c = 0; c < colCount; c++) {
    const colX = margin + c * colWidth
    const colName = String(displayCols[c].header || '').slice(0, 18)
    stream += `BT /F1 8.5 Tf 0.15 0.2 0.25 rg ${colX + 4} ${tableTop - 15} Td (${colName.replace(/[()\\\\]/g, '')}) Tj ET\n`
  }

  // Data Rows
  let curY = tableTop - rowHeight
  const rows = config.sampleRows
  for (let r = 0; r < Math.min(rows.length, 12); r++) {
    curY -= rowHeight
    const bg = r % 2 === 0 ? '1 1 1 rg\n' : '0.97 0.98 0.99 rg\n'
    stream += bg
    stream += `${margin} ${curY} ${contentWidth} ${rowHeight} re f\n`
    stream += '0.88 0.9 0.92 RG 0.5 w\n'
    stream += `${margin} ${curY} ${contentWidth} ${rowHeight} re S\n`

    for (let c = 0; c < colCount; c++) {
      const colX = margin + c * colWidth
      const key = displayCols[c].key
      const val = String(rows[r][key] ?? '').slice(0, 20)
      stream += `BT /F2 8 Tf 0.2 0.2 0.2 rg ${colX + 4} ${curY + 7} Td (${val.replace(/[()\\\\]/g, '')}) Tj ET\n`
    }
  }

  // Footer instructions note
  const footerNote = 'Note: For best results and instant catalog sync, enter your products into the Excel (.xlsx) template and upload directly.'
  stream += `BT /F2 8.5 Tf 0.45 0.45 0.45 rg ${margin} ${curY - 24} Td (${footerNote.replace(/[()\\\\]/g, '')}) Tj ET\n`

  const objects = []
  function addObj(content) {
    objects.push(content)
    return objects.length
  }

  addObj('<< /Type /Catalog /Pages 2 0 R >>')
  addObj('<< /Type /Pages /Kids [3 0 R] /Count 1 >>')
  addObj(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`)
  addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>')
  addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
  addObj(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`)

  let pdf = '%PDF-1.4\n'
  const offsets = []
  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(pdf))
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`
  }

  const xrefOffset = Buffer.byteLength(pdf)
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (let i = 0; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`

  return { filename, buffer: Buffer.from(pdf, 'utf-8') }
}

