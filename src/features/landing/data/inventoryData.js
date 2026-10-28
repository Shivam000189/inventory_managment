import {
  Layers,
  Cpu,
  Shirt,
  Box,
  Package,
  Truck
} from 'lucide-react';

export const CATEGORIES = [
  { name: 'All Stock', icon: Layers },
  { name: 'Electronics', icon: Cpu },
  { name: 'Apparel', icon: Shirt },
  { name: 'Packaging', icon: Box },
  { name: 'Raw Materials', icon: Package },
  { name: 'Suppliers', icon: Truck }
];

export const INITIAL_INVENTORY = [
  {
    id: 'sku-1',
    name: 'Zebra Barcode Scanner',
    sku: 'SKU-8841',
    category: 'Electronics',
    price: 129.00,
    stock: 42,
    orderQty: 0,
    svgType: 'scanner',
    status: 'optimal'
  },
  {
    id: 'sku-2',
    name: 'Studio ANC Headset',
    sku: 'SKU-3092',
    category: 'Electronics',
    price: 84.50,
    stock: 18,
    orderQty: 1,
    svgType: 'headphones',
    status: 'selected'
  },
  {
    id: 'sku-3',
    name: 'Mech Tactile KeyBoard',
    sku: 'SKU-5120',
    category: 'Electronics',
    price: 95.00,
    stock: 64,
    orderQty: 0,
    svgType: 'keyboard',
    status: 'optimal'
  },
  {
    id: 'sku-4',
    name: 'Corrugated Eco Box 50p',
    sku: 'SKU-1044',
    category: 'Packaging',
    price: 42.00,
    stock: 110,
    orderQty: 0,
    svgType: 'box_pack',
    status: 'optimal'
  },
  {
    id: 'sku-5',
    name: 'Industrial Mesh Router',
    sku: 'SKU-9921',
    category: 'Electronics',
    price: 164.00,
    stock: 9,
    orderQty: 0,
    svgType: 'router',
    status: 'low'
  },
  {
    id: 'sku-6',
    name: 'Canvas Utility Work Jacket',
    sku: 'SKU-7741',
    category: 'Apparel',
    price: 58.20,
    stock: 31,
    orderQty: 0,
    svgType: 'jacket',
    status: 'optimal'
  },
  {
    id: 'sku-7',
    name: 'Euro Wood Pallet Grade A',
    sku: 'SKU-4019',
    category: 'Packaging',
    price: 28.90,
    stock: 85,
    orderQty: 0,
    svgType: 'pallet',
    status: 'optimal'
  },
  {
    id: 'sku-8',
    name: 'Thermal Label Printer',
    sku: 'SKU-6630',
    category: 'Electronics',
    price: 145.00,
    stock: 14,
    orderQty: 1,
    svgType: 'printer',
    status: 'selected'
  },
  {
    id: 'sku-9',
    name: 'Steel-Toe Warehouse Boot',
    sku: 'SKU-2290',
    category: 'Apparel',
    price: 76.00,
    stock: 27,
    orderQty: 0,
    svgType: 'sneakers',
    status: 'optimal'
  },
  {
    id: 'sku-10',
    name: 'Raw Kraft Filament Spool',
    sku: 'SKU-5582',
    category: 'Raw Materials',
    price: 34.50,
    stock: 53,
    orderQty: 0,
    svgType: 'spool',
    status: 'optimal'
  }
];

export const INITIAL_ORDER_LIST = [
  { id: 'sku-2', name: 'Studio ANC Headset', qty: 10, unitPrice: 84.50 },
  { id: 'sku-8', name: 'Thermal Label Printer', qty: 5, unitPrice: 145.00 },
  { id: 'sku-4', name: 'Corrugated Eco Box 50p', qty: 20, unitPrice: 42.00 },
  { id: 'sku-10', name: 'Raw Kraft Filament Spool', qty: 10, unitPrice: 34.50 },
  { id: 'sku-7', name: 'Euro Wood Pallet Grade A', qty: 15, unitPrice: 28.90 },
  { id: 'sku-6', name: 'Canvas Utility Work Jacket', qty: 8, unitPrice: 58.20 }
];

export const WAREHOUSE_LOCATIONS = [
  {
    name: 'Austin Hub #01',
    capacity: '88%',
    skus: '4,290 SKUs',
    status: 'Optimal'
  },
  {
    name: 'Rotterdam Port #04',
    capacity: '94%',
    skus: '6,120 SKUs',
    status: 'High Volume'
  },
  {
    name: 'Tokyo East #02',
    capacity: '71%',
    skus: '2,840 SKUs',
    status: 'Optimal'
  }
];

export const PRICING_PLANS = [
  {
    name: 'Starter',
    desc: 'Ideal for emerging brands & single-warehouse teams.',
    priceAnnual: 49,
    priceMonthly: 59,
    highlighted: false,
    features: [
      'Up to 2,500 active SKUs',
      '1 Warehouse location included',
      'Barcode & QR mobile scanning',
      'Shopify & WooCommerce sync',
      'Standard low-stock email alerts'
    ]
  },
  {
    name: 'Growth',
    desc: 'Full automation for scaling multi-channel inventory.',
    priceAnnual: 129,
    priceMonthly: 159,
    highlighted: true,
    badge: 'Most Popular',
    features: [
      'Up to 25,000 active SKUs',
      'Up to 5 Warehouse locations',
      'Automated Purchase Order workflows',
      'AI demand forecasting & aging reports',
      'Batch / Lot & Serial number tracking',
      'Priority 24/7 live chat support'
    ]
  },
  {
    name: 'Enterprise',
    desc: 'Tailored control for global 3PLs & high-volume supply chains.',
    priceAnnual: 349,
    priceMonthly: 420,
    highlighted: false,
    features: [
      'Unlimited SKUs & order velocity',
      'Unlimited global warehouses',
      'Custom ERP, NetSuite & SAP connectors',
      'Dedicated RFID hardware integration',
      'Custom SLA & dedicated account manager'
    ]
  }
];
