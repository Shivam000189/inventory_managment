/**
 * Comprehensive Multi-Industry Demo Seed Script for Stockroom / IMB
 *
 * Seeds 11 businesses (one per supported industry and covering all 6 business types),
 * each with an owner, manager, and staff account (33 total logins), plus realistic
 * products, suppliers, customers, purchase orders, receivings, sales orders,
 * payments, returns, stock transactions, and notifications.
 *
 * Usage:
 *   node server/scripts/seed-demo-all.js
 *   node server/scripts/seed-demo-all.js --fresh
 *   node server/scripts/seed-demo-all.js --fresh --force
 */

import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import { getSupabaseAdmin, isSupabaseConfigured } from '../config/supabase.js'
import { env } from '../config/env.js'
import { DEFAULT_ROLES } from '../models/Role.js'
import { industryConfig, businessTypeConfig } from '../../shared/industryConfig.js'

const DEMO_PASSWORD_PLAIN = 'Demo@12345'
const BCRYPT_ROUNDS = 10

const flags = new Set(process.argv.slice(2))
const isFresh = flags.has('--fresh')
const isForce = flags.has('--force')

// Refuse to run on production without --force
if (env.nodeEnv === 'production' && !isForce) {
  console.error('\n[SAFETY ERROR] Refusing to seed demo data in production environment without --force flag.')
  process.exit(1)
}

if (!isSupabaseConfigured()) {
  console.error('\n[CONFIG ERROR] Supabase is not configured.')
  console.error('Please verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server/.env')
  process.exit(1)
}

const supabase = getSupabaseAdmin()

// Extract host from Supabase URL for transparency
let supabaseHost = 'unknown-host'
try {
  supabaseHost = new URL(env.supabase.url).host
} catch {
  supabaseHost = env.supabase.url || 'unknown-host'
}

// -----------------------------------------------------------------------------
// 1. INDUSTRY DEFINITIONS & SPECIFICATIONS
// -----------------------------------------------------------------------------

const BUSINESS_SPECS = [
  {
    industry: 'pharmacy',
    name: 'Aflix Pharma Wholesale',
    businessType: 'wholesale',
    city: 'Agra',
    state: 'Uttar Pradesh',
    gstin: '09AABCA1234F1Z5',
    phone: '+91 98765 11001',
    address: '64 Amita Nagar, MG Road',
    invoicePrefix: 'PHARM',
    defaultGstRate: 12,
  },
  {
    industry: 'clothing',
    name: 'Threadline Apparel',
    businessType: 'retailwholesale',
    city: 'Jaipur',
    state: 'Rajasthan',
    gstin: '08BBDPT5678G1Z2',
    phone: '+91 98765 11002',
    address: '12 Johari Bazar, Pink City',
    invoicePrefix: 'THRD',
    defaultGstRate: 5,
  },
  {
    industry: 'electronics',
    name: 'VoltEdge Electronics',
    businessType: 'retail',
    city: 'Bengaluru',
    state: 'Karnataka',
    gstin: '29CCEPT9012H1Z8',
    phone: '+91 98765 11003',
    address: '88 Brigade Road, Ashok Nagar',
    invoicePrefix: 'VOLT',
    defaultGstRate: 18,
  },
  {
    industry: 'grocery',
    name: 'FreshBasket Mart',
    businessType: 'retail',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    gstin: '09DDEPT3456J1Z1',
    phone: '+91 98765 11004',
    address: '22 Hazratganj Main Market',
    invoicePrefix: 'FBSK',
    defaultGstRate: 5,
  },
  {
    industry: 'hardware',
    name: 'IronWorks Hardware',
    businessType: 'retailwholesale',
    city: 'Ludhiana',
    state: 'Punjab',
    gstin: '03EEFPT7890K1Z4',
    phone: '+91 98765 11005',
    address: '45 Industrial Area B, Gill Road',
    invoicePrefix: 'IRON',
    defaultGstRate: 18,
  },
  {
    industry: 'automobile',
    name: 'AutoParts Hub',
    businessType: 'retail',
    city: 'Pune',
    state: 'Maharashtra',
    gstin: '27FFGPT1234L1Z7',
    phone: '+91 98765 11006',
    address: '102 JM Road, Shivajinagar',
    invoicePrefix: 'AUTO',
    defaultGstRate: 28,
  },
  {
    industry: 'wholesale',
    name: 'BulkBazaar Traders',
    businessType: 'wholesale',
    city: 'Delhi',
    state: 'Delhi',
    gstin: '07GGHPT5678M1Z0',
    phone: '+91 98765 11007',
    address: '15 Sadar Bazar, Central Delhi',
    invoicePrefix: 'BULK',
    defaultGstRate: 18,
  },
  {
    industry: 'retail',
    name: 'Urban Corner Store',
    businessType: 'retail',
    city: 'Mumbai',
    state: 'Maharashtra',
    gstin: '27HHIPT9012N1Z3',
    phone: '+91 98765 11008',
    address: '77 Colaba Causeway, South Mumbai',
    invoicePrefix: 'URBN',
    defaultGstRate: 18,
  },
  {
    industry: 'restaurant',
    name: 'Spice Route Kitchen',
    businessType: 'service',
    city: 'Hyderabad',
    state: 'Telangana',
    gstin: '36IIJPT3456P1Z6',
    phone: '+91 98765 11009',
    address: '14 Banjara Hills Road No 12',
    invoicePrefix: 'SPIC',
    defaultGstRate: 5,
  },
  {
    industry: 'manufacturing',
    name: 'Sunrise Plastics Works',
    businessType: 'manufacturing',
    city: 'Surat',
    state: 'Gujarat',
    gstin: '24JJKPT7890Q1Z9',
    phone: '+91 98765 11010',
    address: '501 GIDC Industrial Estate, Sachin',
    invoicePrefix: 'SUNP',
    defaultGstRate: 18,
  },
  {
    industry: 'other',
    name: 'General Goods Co',
    businessType: 'other',
    city: 'Kanpur',
    state: 'Uttar Pradesh',
    gstin: '09KKMPT1234R1Z2',
    phone: '+91 98765 11011',
    address: '33 Mall Road, Civil Lines',
    invoicePrefix: 'GENG',
    defaultGstRate: 18,
  },
]

// Date helpers
const now = Date.now()
const daysAgo = (d) => new Date(now - d * 86400000).toISOString()
const daysAhead = (d) => new Date(now + d * 86400000).toISOString()

// -----------------------------------------------------------------------------
// 2. PRODUCT DATA GENERATOR BY INDUSTRY
// -----------------------------------------------------------------------------

function generateProductsForIndustry(industry, businessId, supplierIds) {
  const sup1 = supplierIds[0] || null
  const sup2 = supplierIds[1] || sup1
  const sup3 = supplierIds[2] || sup2

  switch (industry) {
    case 'pharmacy':
      return [
        {
          name: 'Augmentin 625 Duo Tablet',
          sku: 'PHARM-AUG-625',
          category: 'Antibiotics',
          generic_name: 'Amoxicillin (500mg) + Clavulanic Acid (125mg)',
          manufacturer: 'GSK Pharmaceuticals',
          batch_number: 'AUG-24B01',
          manufacturing_date: daysAgo(120),
          expiry_date: daysAhead(450),
          mrp: 235,
          purchase_price: 145,
          selling_price: 210,
          wholesale_price: 175,
          wholesale_min_quantity: 10,
          dealer_price: 165,
          unit: 'box',
          hsn_code: '30041000',
          gst_rate: 12,
          current_stock: 95,
          minimum_stock: 20,
          supplier_id: sup1,
        },
        {
          name: 'Dolo 650 Tablet',
          sku: 'PHARM-DOLO-650',
          category: 'Analgesics',
          generic_name: 'Paracetamol IP 650mg',
          manufacturer: 'Micro Labs Ltd',
          batch_number: 'DOL-24F12',
          manufacturing_date: daysAgo(90),
          expiry_date: daysAhead(600),
          mrp: 38,
          purchase_price: 22,
          selling_price: 34,
          wholesale_price: 27,
          wholesale_min_quantity: 20,
          dealer_price: 25,
          unit: 'strip',
          hsn_code: '30049099',
          gst_rate: 12,
          current_stock: 180,
          minimum_stock: 30,
          supplier_id: sup1,
        },
        {
          name: 'Azithral 500mg Tablet',
          sku: 'PHARM-AZI-500',
          category: 'Antibiotics',
          generic_name: 'Azithromycin 500mg',
          manufacturer: 'Alembic Pharma',
          batch_number: 'AZI-23K09',
          manufacturing_date: daysAgo(340),
          expiry_date: daysAhead(14), // Expiring in < 30 days!
          mrp: 142,
          purchase_price: 88,
          selling_price: 128,
          wholesale_price: 105,
          wholesale_min_quantity: 10,
          dealer_price: 98,
          unit: 'strip',
          hsn_code: '30042099',
          gst_rate: 12,
          current_stock: 35,
          minimum_stock: 15,
          supplier_id: sup2,
        },
        {
          name: 'Liv 52 Syrup 200ml',
          sku: 'PHARM-LIV-052',
          category: 'Herbal & Wellness',
          generic_name: 'Ayurvedic Liver Care Formula',
          manufacturer: 'Himalaya Wellness',
          batch_number: 'LIV-23H88',
          manufacturing_date: daysAgo(330),
          expiry_date: daysAhead(22), // Expiring in < 30 days!
          mrp: 180,
          purchase_price: 110,
          selling_price: 165,
          wholesale_price: 132,
          wholesale_min_quantity: 12,
          dealer_price: 125,
          unit: 'bottle',
          hsn_code: '30049011',
          gst_rate: 12,
          current_stock: 28,
          minimum_stock: 10,
          supplier_id: sup3,
        },
        {
          name: 'Asthalin Inhaler 200 MDI',
          sku: 'PHARM-AST-200',
          category: 'Respiratory',
          generic_name: 'Salbutamol 100mcg',
          manufacturer: 'Cipla Ltd',
          batch_number: 'AST-22M04',
          manufacturing_date: daysAgo(720),
          expiry_date: daysAgo(45), // Already Expired!
          mrp: 165,
          purchase_price: 95,
          selling_price: 150,
          wholesale_price: 120,
          wholesale_min_quantity: 10,
          dealer_price: 112,
          unit: 'piece',
          hsn_code: '30049099',
          gst_rate: 12,
          current_stock: 15,
          minimum_stock: 10,
          supplier_id: sup2,
        },
        {
          name: 'Pan-D Capsule',
          sku: 'PHARM-PAN-D',
          category: 'Gastroenterology',
          generic_name: 'Pantoprazole (40mg) + Domperidone (30mg)',
          manufacturer: 'Alkem Laboratories',
          batch_number: 'PND-24C03',
          manufacturing_date: daysAgo(80),
          expiry_date: daysAhead(520),
          mrp: 215,
          purchase_price: 128,
          selling_price: 195,
          wholesale_price: 155,
          wholesale_min_quantity: 15,
          dealer_price: 145,
          unit: 'box',
          hsn_code: '30049099',
          gst_rate: 12,
          current_stock: 3, // LOW STOCK!
          minimum_stock: 15,
          supplier_id: sup1,
        },
        {
          name: 'Combiflam Tablet',
          sku: 'PHARM-COM-010',
          category: 'Analgesics',
          generic_name: 'Ibuprofen (400mg) + Paracetamol (325mg)',
          manufacturer: 'Sanofi India',
          batch_number: 'CMB-24A19',
          manufacturing_date: daysAgo(100),
          expiry_date: daysAhead(610),
          mrp: 52,
          purchase_price: 30,
          selling_price: 46,
          wholesale_price: 36,
          wholesale_min_quantity: 25,
          dealer_price: 33,
          unit: 'strip',
          hsn_code: '30049099',
          gst_rate: 12,
          current_stock: 0, // OUT OF STOCK!
          minimum_stock: 25,
          supplier_id: sup1,
        },
        {
          name: 'Shelcal 500 Tablet',
          sku: 'PHARM-SHE-500',
          category: 'Vitamins & Minerals',
          generic_name: 'Calcium (500mg) + Vitamin D3 (250IU)',
          manufacturer: 'Torrent Pharmaceuticals',
          batch_number: 'SHL-24D11',
          manufacturing_date: daysAgo(60),
          expiry_date: daysAhead(680),
          mrp: 145,
          purchase_price: 85,
          selling_price: 130,
          wholesale_price: 104,
          wholesale_min_quantity: 15,
          dealer_price: 97,
          unit: 'bottle',
          hsn_code: '30045090',
          gst_rate: 12,
          current_stock: 75,
          minimum_stock: 20,
          supplier_id: sup3,
        },
        {
          name: 'Telma 40 Tablet',
          sku: 'PHARM-TEL-040',
          category: 'Cardiovascular',
          generic_name: 'Telmisartan 40mg',
          manufacturer: 'Glenmark Pharmaceuticals',
          batch_number: 'TEL-24G07',
          manufacturing_date: daysAgo(50),
          expiry_date: daysAhead(700),
          mrp: 240,
          purchase_price: 142,
          selling_price: 215,
          wholesale_price: 172,
          wholesale_min_quantity: 10,
          dealer_price: 160,
          unit: 'strip',
          hsn_code: '30049099',
          gst_rate: 12,
          current_stock: 60,
          minimum_stock: 15,
          supplier_id: sup2,
        },
        {
          name: 'Montair-LC Tablet',
          sku: 'PHARM-MON-LC',
          category: 'Respiratory',
          generic_name: 'Montelukast (10mg) + Levocetirizine (5mg)',
          manufacturer: 'Cipla Ltd',
          batch_number: 'MON-24E05',
          manufacturing_date: daysAgo(40),
          expiry_date: daysAhead(710),
          mrp: 210,
          purchase_price: 125,
          selling_price: 185,
          wholesale_price: 148,
          wholesale_min_quantity: 10,
          dealer_price: 138,
          unit: 'strip',
          hsn_code: '30049099',
          gst_rate: 12,
          current_stock: 4, // LOW STOCK!
          minimum_stock: 12,
          supplier_id: sup2,
        },
        {
          name: 'Glycomet-GP 2 Tablet',
          sku: 'PHARM-GLY-GP2',
          category: 'Antidiabetic',
          generic_name: 'Glimepiride (2mg) + Metformin (500mg)',
          manufacturer: 'USV Private Ltd',
          batch_number: 'GLY-24B14',
          manufacturing_date: daysAgo(70),
          expiry_date: daysAhead(550),
          mrp: 178,
          purchase_price: 105,
          selling_price: 160,
          wholesale_price: 128,
          wholesale_min_quantity: 15,
          dealer_price: 119,
          unit: 'strip',
          hsn_code: '30049099',
          gst_rate: 12,
          current_stock: 85,
          minimum_stock: 20,
          supplier_id: sup3,
        },
        {
          name: 'Becosules Z Capsule',
          sku: 'PHARM-BEC-020',
          category: 'Vitamins & Minerals',
          generic_name: 'B-Complex Forte with Vitamin C and Zinc',
          manufacturer: 'Pfizer Ltd',
          batch_number: 'BEC-24A08',
          manufacturing_date: daysAgo(110),
          expiry_date: daysAhead(490),
          mrp: 58,
          purchase_price: 32,
          selling_price: 52,
          wholesale_price: 41,
          wholesale_min_quantity: 20,
          dealer_price: 38,
          unit: 'strip',
          hsn_code: '30045090',
          gst_rate: 12,
          current_stock: 120,
          minimum_stock: 25,
          supplier_id: sup1,
        },
        {
          name: 'Betadine 10% Ointment 20g',
          sku: 'PHARM-BET-020',
          category: 'Topical Antiseptics',
          generic_name: 'Povidone Iodine IP 10% w/w',
          manufacturer: 'Win-Medicare Ltd',
          batch_number: 'BET-24F02',
          manufacturing_date: daysAgo(85),
          expiry_date: daysAhead(580),
          mrp: 135,
          purchase_price: 78,
          selling_price: 120,
          wholesale_price: 96,
          wholesale_min_quantity: 12,
          dealer_price: 89,
          unit: 'tube',
          hsn_code: '30049089',
          gst_rate: 12,
          current_stock: 55,
          minimum_stock: 15,
          supplier_id: sup3,
        },
        {
          name: 'Allegra 120mg Tablet',
          sku: 'PHARM-ALL-120',
          category: 'Antihistamines',
          generic_name: 'Fexofenadine HCl 120mg',
          manufacturer: 'Sanofi India',
          batch_number: 'ALL-24C21',
          manufacturing_date: daysAgo(95),
          expiry_date: daysAhead(640),
          mrp: 232,
          purchase_price: 138,
          selling_price: 208,
          wholesale_price: 165,
          wholesale_min_quantity: 10,
          dealer_price: 154,
          unit: 'strip',
          hsn_code: '30049099',
          gst_rate: 12,
          current_stock: 65,
          minimum_stock: 15,
          supplier_id: sup2,
        },
      ]

    case 'clothing':
      return [
        {
          name: 'Slim Fit Denim Jeans',
          sku: 'CLOTH-JNS-001',
          category: 'Bottomwear',
          brand: 'Threadline',
          size: '32',
          color: 'Navy Blue',
          purchase_price: 650,
          selling_price: 1499,
          wholesale_price: 950,
          wholesale_min_quantity: 10,
          dealer_price: 880,
          unit: 'piece',
          hsn_code: '62034200',
          gst_rate: 12,
          current_stock: 45,
          minimum_stock: 10,
          supplier_id: sup1,
        },
        {
          name: 'Classic Oxford Button-Down Shirt',
          sku: 'CLOTH-SHT-002',
          category: 'Topwear',
          brand: 'Threadline',
          size: 'M',
          color: 'Pearl White',
          purchase_price: 480,
          selling_price: 1199,
          wholesale_price: 750,
          wholesale_min_quantity: 12,
          dealer_price: 690,
          unit: 'piece',
          hsn_code: '62052000',
          gst_rate: 5,
          current_stock: 60,
          minimum_stock: 15,
          supplier_id: sup1,
        },
        {
          name: 'Heavyweight Cotton Graphic Tee',
          sku: 'CLOTH-TEE-003',
          category: 'Topwear',
          brand: 'Threadline',
          size: 'L',
          color: 'Jet Black',
          purchase_price: 260,
          selling_price: 699,
          wholesale_price: 420,
          wholesale_min_quantity: 20,
          dealer_price: 380,
          unit: 'piece',
          hsn_code: '61091000',
          gst_rate: 5,
          current_stock: 85,
          minimum_stock: 20,
          supplier_id: sup2,
        },
        {
          name: 'Pure Linen Summer Kurta',
          sku: 'CLOTH-KRT-004',
          category: 'Ethnic Wear',
          brand: 'Jaipur Heritage',
          size: 'XL',
          color: 'Beige',
          purchase_price: 550,
          selling_price: 1399,
          wholesale_price: 880,
          wholesale_min_quantity: 10,
          dealer_price: 810,
          unit: 'piece',
          hsn_code: '62114200',
          gst_rate: 5,
          current_stock: 2, // LOW STOCK!
          minimum_stock: 10,
          supplier_id: sup3,
        },
        {
          name: 'Stretch Chino Trousers',
          sku: 'CLOTH-CHN-005',
          category: 'Bottomwear',
          brand: 'Threadline',
          size: '34',
          color: 'Olive Green',
          purchase_price: 520,
          selling_price: 1299,
          wholesale_price: 820,
          wholesale_min_quantity: 12,
          dealer_price: 760,
          unit: 'piece',
          hsn_code: '62034200',
          gst_rate: 12,
          current_stock: 0, // OUT OF STOCK!
          minimum_stock: 12,
          supplier_id: sup1,
        },
        {
          name: 'Oversized Streetwear Hoodie',
          sku: 'CLOTH-HD-006',
          category: 'Winterwear',
          brand: 'Threadline',
          size: 'L',
          color: 'Jet Black',
          purchase_price: 750,
          selling_price: 1899,
          wholesale_price: 1200,
          wholesale_min_quantity: 8,
          dealer_price: 1100,
          unit: 'piece',
          hsn_code: '61102000',
          gst_rate: 12,
          current_stock: 35,
          minimum_stock: 8,
          supplier_id: sup2,
        },
        {
          name: 'Silk Blend Nehru Jacket',
          sku: 'CLOTH-JKT-007',
          category: 'Ethnic Wear',
          brand: 'Jaipur Heritage',
          size: '40',
          color: 'Rust Orange',
          purchase_price: 980,
          selling_price: 2499,
          wholesale_price: 1600,
          wholesale_min_quantity: 6,
          dealer_price: 1480,
          unit: 'piece',
          hsn_code: '62033990',
          gst_rate: 12,
          current_stock: 18,
          minimum_stock: 5,
          supplier_id: sup3,
        },
        {
          name: 'Pique Knit Polo T-Shirt',
          sku: 'CLOTH-PLO-008',
          category: 'Topwear',
          brand: 'Threadline',
          size: 'M',
          color: 'Navy Blue',
          purchase_price: 340,
          selling_price: 899,
          wholesale_price: 560,
          wholesale_min_quantity: 15,
          dealer_price: 510,
          unit: 'piece',
          hsn_code: '61051000',
          gst_rate: 5,
          current_stock: 50,
          minimum_stock: 15,
          supplier_id: sup1,
        },
        {
          name: 'Tailored Formal Blazer',
          sku: 'CLOTH-BLZ-009',
          category: 'Formalwear',
          brand: 'Threadline Elite',
          size: '42',
          color: 'Navy Blue',
          purchase_price: 1850,
          selling_price: 4499,
          wholesale_price: 2900,
          wholesale_min_quantity: 5,
          dealer_price: 2700,
          unit: 'piece',
          hsn_code: '62033100',
          gst_rate: 12,
          current_stock: 12,
          minimum_stock: 4,
          supplier_id: sup2,
        },
        {
          name: 'Ankle Length Track Pants',
          sku: 'CLOTH-TRK-010',
          category: 'Activewear',
          brand: 'Threadline Active',
          size: 'L',
          color: 'Jet Black',
          purchase_price: 380,
          selling_price: 999,
          wholesale_price: 620,
          wholesale_min_quantity: 15,
          dealer_price: 570,
          unit: 'piece',
          hsn_code: '61034300',
          gst_rate: 5,
          current_stock: 42,
          minimum_stock: 10,
          supplier_id: sup1,
        },
        {
          name: 'Cotton Cargo Shorts',
          sku: 'CLOTH-CRG-011',
          category: 'Bottomwear',
          brand: 'Threadline',
          size: '32',
          color: 'Beige',
          purchase_price: 420,
          selling_price: 1099,
          wholesale_price: 680,
          wholesale_min_quantity: 10,
          dealer_price: 620,
          unit: 'piece',
          hsn_code: '62034200',
          gst_rate: 12,
          current_stock: 25,
          minimum_stock: 8,
          supplier_id: sup3,
        },
        {
          name: 'Crewneck French Terry Sweatshirt',
          sku: 'CLOTH-SWT-012',
          category: 'Winterwear',
          brand: 'Threadline',
          size: 'M',
          color: 'Olive Green',
          purchase_price: 580,
          selling_price: 1499,
          wholesale_price: 920,
          wholesale_min_quantity: 10,
          dealer_price: 850,
          unit: 'piece',
          hsn_code: '61102000',
          gst_rate: 12,
          current_stock: 3, // LOW STOCK!
          minimum_stock: 10,
          supplier_id: sup2,
        },
        {
          name: 'Printed Rayon Maxi Dress',
          sku: 'CLOTH-DRS-013',
          category: 'Womenswear',
          brand: 'Jaipur Heritage',
          size: 'M',
          color: 'Rust Orange',
          purchase_price: 620,
          selling_price: 1699,
          wholesale_price: 1050,
          wholesale_min_quantity: 8,
          dealer_price: 960,
          unit: 'piece',
          hsn_code: '62044400',
          gst_rate: 5,
          current_stock: 22,
          minimum_stock: 6,
          supplier_id: sup3,
        },
      ]

    case 'electronics':
      return [
        {
          name: 'Active Noise Cancelling Wireless Headphones',
          sku: 'ELEC-ANC-001',
          category: 'Audio',
          brand: 'VoltEdge',
          model: 'VE-SonicPro X',
          serial_number: 'SN-VE-998124',
          warranty_months: 24,
          purchase_price: 3200,
          selling_price: 5999,
          unit: 'piece',
          barcode: '890456700001',
          hsn_code: '85183000',
          gst_rate: 18,
          current_stock: 32,
          minimum_stock: 8,
          supplier_id: sup1,
        },
        {
          name: 'Mechanical Gaming Keyboard RGB Backlit',
          sku: 'ELEC-KBD-002',
          category: 'Peripherals',
          brand: 'VoltEdge',
          model: 'VE-Apex Mech Red',
          serial_number: 'SN-VE-771249',
          warranty_months: 12,
          purchase_price: 1650,
          selling_price: 3299,
          unit: 'piece',
          barcode: '890456700002',
          hsn_code: '84716040',
          gst_rate: 18,
          current_stock: 45,
          minimum_stock: 10,
          supplier_id: sup1,
        },
        {
          name: 'Wireless Ergonomic Optical Mouse',
          sku: 'ELEC-MOU-003',
          category: 'Peripherals',
          brand: 'VoltEdge',
          model: 'VE-Glide Wireless',
          serial_number: 'SN-VE-551982',
          warranty_months: 12,
          purchase_price: 680,
          selling_price: 1499,
          unit: 'piece',
          barcode: '890456700003',
          hsn_code: '84716060',
          gst_rate: 18,
          current_stock: 60,
          minimum_stock: 12,
          supplier_id: sup2,
        },
        {
          name: '4K IPS Smart Monitor 27-inch',
          sku: 'ELEC-MON-004',
          category: 'Displays',
          brand: 'ViewCraft',
          model: 'VC-27Ultra4K',
          serial_number: 'SN-VC-884192',
          warranty_months: 36,
          purchase_price: 14500,
          selling_price: 22999,
          unit: 'piece',
          barcode: '890456700004',
          hsn_code: '85285200',
          gst_rate: 18,
          current_stock: 14,
          minimum_stock: 4,
          supplier_id: sup3,
        },
        {
          name: 'Fast Wireless Charging Stand 15W',
          sku: 'ELEC-CHG-005',
          category: 'Accessories',
          brand: 'VoltEdge',
          model: 'VE-ChargeStand 15',
          serial_number: 'SN-VE-332910',
          warranty_months: 12,
          purchase_price: 720,
          selling_price: 1499,
          unit: 'piece',
          barcode: '890456700005',
          hsn_code: '85044090',
          gst_rate: 18,
          current_stock: 2, // LOW STOCK!
          minimum_stock: 10,
          supplier_id: sup1,
        },
        {
          name: 'Portable Solid State Drive 1TB USB 3.2',
          sku: 'ELEC-SSD-006',
          category: 'Storage',
          brand: 'SpeedData',
          model: 'SD-Blaze 1TB',
          serial_number: 'SN-SD-109283',
          warranty_months: 36,
          purchase_price: 4200,
          selling_price: 6899,
          unit: 'piece',
          barcode: '890456700006',
          hsn_code: '84717020',
          gst_rate: 18,
          current_stock: 0, // OUT OF STOCK!
          minimum_stock: 6,
          supplier_id: sup2,
        },
        {
          name: 'Bluetooth Soundbar 80W with Subwoofer',
          sku: 'ELEC-SND-007',
          category: 'Audio',
          brand: 'AcousticEdge',
          model: 'AE-CinemaBar 80',
          serial_number: 'SN-AE-667123',
          warranty_months: 12,
          purchase_price: 3600,
          selling_price: 6499,
          unit: 'piece',
          barcode: '890456700007',
          hsn_code: '85182200',
          gst_rate: 18,
          current_stock: 18,
          minimum_stock: 5,
          supplier_id: sup3,
        },
        {
          name: 'Smartwatch Fitness Tracker GPS',
          sku: 'ELEC-WAT-008',
          category: 'Wearables',
          brand: 'VoltEdge',
          model: 'VE-Pulse Fit 3',
          imei: '869402051928374',
          serial_number: 'SN-VE-449102',
          warranty_months: 12,
          purchase_price: 1900,
          selling_price: 3799,
          unit: 'piece',
          barcode: '890456700008',
          hsn_code: '85176290',
          gst_rate: 18,
          current_stock: 24,
          minimum_stock: 6,
          supplier_id: sup1,
        },
        {
          name: 'Full HD Streaming Webcam 1080p 60fps',
          sku: 'ELEC-CAM-009',
          category: 'Peripherals',
          brand: 'VoltEdge',
          model: 'VE-StreamCam HD',
          serial_number: 'SN-VE-112398',
          warranty_months: 12,
          purchase_price: 1250,
          selling_price: 2499,
          unit: 'piece',
          barcode: '890456700009',
          hsn_code: '85258900',
          gst_rate: 18,
          current_stock: 28,
          minimum_stock: 8,
          supplier_id: sup2,
        },
        {
          name: 'Wi-Fi 6 Gigabit Dual Band Mesh Router',
          sku: 'ELEC-RTR-010',
          category: 'Networking',
          brand: 'NetSphere',
          model: 'NS-MeshPro AX3000',
          serial_number: 'SN-NS-991204',
          warranty_months: 24,
          purchase_price: 2800,
          selling_price: 4999,
          unit: 'piece',
          barcode: '890456700010',
          hsn_code: '85176290',
          gst_rate: 18,
          current_stock: 19,
          minimum_stock: 5,
          supplier_id: sup3,
        },
        {
          name: 'High Capacity Power Bank 20000mAh PD 22.5W',
          sku: 'ELEC-PWR-011',
          category: 'Accessories',
          brand: 'VoltEdge',
          model: 'VE-PowerVolt 20k',
          serial_number: 'SN-VE-776109',
          warranty_months: 12,
          purchase_price: 950,
          selling_price: 1899,
          unit: 'piece',
          barcode: '890456700011',
          hsn_code: '85044090',
          gst_rate: 18,
          current_stock: 40,
          minimum_stock: 10,
          supplier_id: sup1,
        },
        {
          name: 'True Wireless Stereo Earbuds IPX5',
          sku: 'ELEC-TWS-012',
          category: 'Audio',
          brand: 'VoltEdge',
          model: 'VE-AirBuds Pro',
          serial_number: 'SN-VE-883190',
          warranty_months: 12,
          purchase_price: 850,
          selling_price: 1799,
          unit: 'piece',
          barcode: '890456700012',
          hsn_code: '85183000',
          gst_rate: 18,
          current_stock: 4, // LOW STOCK!
          minimum_stock: 12,
          supplier_id: sup2,
        },
        {
          name: '7-in-1 USB-C Multiport Docking Hub',
          sku: 'ELEC-HUB-013',
          category: 'Accessories',
          brand: 'VoltEdge',
          model: 'VE-DockPro 7',
          serial_number: 'SN-VE-229103',
          warranty_months: 12,
          purchase_price: 1100,
          selling_price: 2199,
          unit: 'piece',
          barcode: '890456700013',
          hsn_code: '84718000',
          gst_rate: 18,
          current_stock: 30,
          minimum_stock: 8,
          supplier_id: sup1,
        },
      ]

    case 'grocery':
      return [
        {
          name: 'Royal Basmati Rice 5kg Pack',
          sku: 'GROC-RIC-001',
          category: 'Grains & Staples',
          brand: 'Heritage Mills',
          unit: 'bag',
          weight: 5.0,
          barcode: '890601200001',
          expiry_date: daysAhead(360),
          purchase_price: 380,
          selling_price: 495,
          hsn_code: '10063020',
          gst_rate: 0,
          current_stock: 65,
          minimum_stock: 15,
          supplier_id: sup1,
        },
        {
          name: 'Cold Pressed Kachi Ghani Mustard Oil 1L',
          sku: 'GROC-OIL-002',
          category: 'Oils & Ghee',
          brand: 'PureDrop',
          unit: 'bottle',
          weight: 0.91,
          barcode: '890601200002',
          expiry_date: daysAhead(270),
          purchase_price: 135,
          selling_price: 175,
          hsn_code: '15149120',
          gst_rate: 5,
          current_stock: 80,
          minimum_stock: 20,
          supplier_id: sup1,
        },
        {
          name: 'Organic Whole Wheat Chakki Atta 10kg',
          sku: 'GROC-ATA-003',
          category: 'Grains & Staples',
          brand: 'Heritage Mills',
          unit: 'bag',
          weight: 10.0,
          barcode: '890601200003',
          expiry_date: daysAhead(90),
          purchase_price: 340,
          selling_price: 420,
          hsn_code: '11010000',
          gst_rate: 0,
          current_stock: 45,
          minimum_stock: 15,
          supplier_id: sup2,
        },
        {
          name: 'Unpolished Toor Dal 1kg',
          sku: 'GROC-DAL-004',
          category: 'Pulses & Lentils',
          brand: 'NatureFresh',
          unit: 'pack',
          weight: 1.0,
          barcode: '890601200004',
          expiry_date: daysAhead(180),
          purchase_price: 125,
          selling_price: 160,
          hsn_code: '07136000',
          gst_rate: 0,
          current_stock: 90,
          minimum_stock: 20,
          supplier_id: sup2,
        },
        {
          name: 'Desi Cow A2 Bilona Ghee 500ml',
          sku: 'GROC-GHE-005',
          category: 'Oils & Ghee',
          brand: 'Vedic Farms',
          unit: 'jar',
          weight: 0.5,
          barcode: '890601200005',
          expiry_date: daysAhead(240),
          purchase_price: 480,
          selling_price: 650,
          hsn_code: '04059020',
          gst_rate: 12,
          current_stock: 3, // LOW STOCK!
          minimum_stock: 10,
          supplier_id: sup3,
        },
        {
          name: 'Raw Premium California Almonds 250g',
          sku: 'GROC-ALM-006',
          category: 'Dry Fruits & Nuts',
          brand: 'NutriHarvest',
          unit: 'pack',
          weight: 0.25,
          barcode: '890601200006',
          expiry_date: daysAhead(180),
          purchase_price: 175,
          selling_price: 240,
          hsn_code: '08021200',
          gst_rate: 5,
          current_stock: 0, // OUT OF STOCK!
          minimum_stock: 12,
          supplier_id: sup3,
        },
        {
          name: 'Natural Kashmiri Red Chilli Powder 200g',
          sku: 'GROC-SPC-007',
          category: 'Spices & Seasoning',
          brand: 'SpiceRoots',
          unit: 'pack',
          weight: 0.2,
          barcode: '890601200007',
          expiry_date: daysAhead(300),
          purchase_price: 70,
          selling_price: 105,
          hsn_code: '09042211',
          gst_rate: 5,
          current_stock: 70,
          minimum_stock: 15,
          supplier_id: sup1,
        },
        {
          name: 'Pure Organic Wild Forest Honey 500g',
          sku: 'GROC-HNY-008',
          category: 'Breakfast & Jams',
          brand: 'NatureFresh',
          unit: 'bottle',
          weight: 0.5,
          barcode: '890601200008',
          expiry_date: daysAhead(500),
          purchase_price: 210,
          selling_price: 320,
          hsn_code: '04090000',
          gst_rate: 5,
          current_stock: 35,
          minimum_stock: 10,
          supplier_id: sup2,
        },
        {
          name: 'Rolled Oats High Fiber 1kg',
          sku: 'GROC-OAT-009',
          category: 'Breakfast & Cereals',
          brand: 'NutriHarvest',
          unit: 'pack',
          weight: 1.0,
          barcode: '890601200009',
          expiry_date: daysAhead(180),
          purchase_price: 130,
          selling_price: 185,
          hsn_code: '11041200',
          gst_rate: 5,
          current_stock: 50,
          minimum_stock: 12,
          supplier_id: sup3,
        },
        {
          name: 'Iodized Natural Crystal Salt 1kg',
          sku: 'GROC-SLT-010',
          category: 'Grains & Staples',
          brand: 'PureDrop',
          unit: 'pack',
          weight: 1.0,
          barcode: '890601200010',
          expiry_date: daysAhead(720),
          purchase_price: 16,
          selling_price: 25,
          hsn_code: '25010010',
          gst_rate: 0,
          current_stock: 150,
          minimum_stock: 30,
          supplier_id: sup1,
        },
        {
          name: 'Golden Turmeric Powder 500g Pack',
          sku: 'GROC-TUR-011',
          category: 'Spices & Seasoning',
          brand: 'SpiceRoots',
          unit: 'pack',
          weight: 0.5,
          barcode: '890601200011',
          expiry_date: daysAhead(360),
          purchase_price: 85,
          selling_price: 130,
          hsn_code: '09103020',
          gst_rate: 5,
          current_stock: 55,
          minimum_stock: 15,
          supplier_id: sup2,
        },
        {
          name: 'Darjeeling Green Tea Bags 100s Tin',
          sku: 'GROC-TEA-012',
          category: 'Beverages',
          brand: 'NatureFresh',
          unit: 'tin',
          weight: 0.2,
          barcode: '890601200012',
          expiry_date: daysAhead(240),
          purchase_price: 240,
          selling_price: 360,
          hsn_code: '09021020',
          gst_rate: 5,
          current_stock: 4, // LOW STOCK!
          minimum_stock: 10,
          supplier_id: sup3,
        },
        {
          name: 'Brown Organic Cane Jaggery 1kg',
          sku: 'GROC-JAG-013',
          category: 'Grains & Staples',
          brand: 'Heritage Mills',
          unit: 'pack',
          weight: 1.0,
          barcode: '890601200013',
          expiry_date: daysAhead(180),
          purchase_price: 65,
          selling_price: 95,
          hsn_code: '17011490',
          gst_rate: 0,
          current_stock: 40,
          minimum_stock: 10,
          supplier_id: sup1,
        },
      ]

    case 'hardware':
      return [
        {
          name: 'Stainless Steel Ball Bearing Hinges 4-inch (Pair)',
          sku: 'HARD-HNG-001',
          category: 'Architectural Hardware',
          material: 'SS 304 Stainless Steel',
          dimensions: '102 x 76 x 3 mm',
          warehouse: 'Ludhiana Central Depot',
          rack_location: 'Bay-A1-Shelf-04',
          unit: 'pair',
          dealer_price: 145,
          wholesale_price: 165,
          wholesale_min_quantity: 20,
          purchase_price: 120,
          selling_price: 240,
          reorder_level: 25,
          minimum_stock: 20,
          current_stock: 110,
          supplier_id: sup1,
        },
        {
          name: 'Heavy Duty Mortise Door Lock with Brass Cylinder',
          sku: 'HARD-LCK-002',
          category: 'Door Hardware',
          material: 'Solid Brass & Zinc Alloy',
          dimensions: '240 x 50 mm',
          warehouse: 'Ludhiana Central Depot',
          rack_location: 'Bay-A2-Shelf-01',
          unit: 'set',
          dealer_price: 680,
          wholesale_price: 760,
          wholesale_min_quantity: 10,
          purchase_price: 580,
          selling_price: 1150,
          reorder_level: 15,
          minimum_stock: 10,
          current_stock: 48,
          supplier_id: sup1,
        },
        {
          name: 'Zinc Plated Hex Head Bolt M12 x 50 (Box of 100)',
          sku: 'HARD-BLT-003',
          category: 'Fasteners',
          material: 'Grade 8.8 High Tensile Steel',
          dimensions: 'M12 x 50 mm',
          warehouse: 'Ludhiana Central Depot',
          rack_location: 'Bay-B1-Shelf-08',
          unit: 'box',
          dealer_price: 320,
          wholesale_price: 360,
          wholesale_min_quantity: 15,
          purchase_price: 270,
          selling_price: 520,
          reorder_level: 20,
          minimum_stock: 15,
          current_stock: 75,
          supplier_id: sup2,
        },
        {
          name: 'Diamond Segmented Cutting Blade 4-inch',
          sku: 'HARD-BLD-004',
          category: 'Power Tool Accessories',
          material: 'Industrial Synthetic Diamond',
          dimensions: '110 x 20 x 1.8 mm',
          warehouse: 'Ludhiana Central Depot',
          rack_location: 'Bay-C1-Shelf-02',
          unit: 'piece',
          dealer_price: 190,
          wholesale_price: 220,
          wholesale_min_quantity: 12,
          purchase_price: 160,
          selling_price: 340,
          reorder_level: 15,
          current_stock: 5, // LOW STOCK!
          minimum_stock: 15,
          supplier_id: sup2,
        },
        {
          name: 'Chrome Vanadium Combination Spanner Set 12pc',
          sku: 'HARD-SPN-005',
          category: 'Hand Tools',
          material: 'Cr-V Steel Satin Finish',
          dimensions: 'Sizes 6mm to 22mm',
          warehouse: 'Ludhiana Central Depot',
          rack_location: 'Bay-C2-Shelf-05',
          unit: 'set',
          dealer_price: 550,
          wholesale_price: 630,
          wholesale_min_quantity: 8,
          purchase_price: 470,
          selling_price: 950,
          reorder_level: 10,
          current_stock: 0, // OUT OF STOCK!
          minimum_stock: 10,
          supplier_id: sup3,
        },
        {
          name: 'Brushless Cordless Impact Drill Machine 18V',
          sku: 'HARD-DRL-006',
          category: 'Power Tools',
          material: 'Reinforced Polyamide Housing',
          dimensions: '220 x 180 x 65 mm',
          warehouse: 'Ludhiana Central Depot',
          rack_location: 'Bay-D1-Shelf-01',
          unit: 'unit',
          dealer_price: 2800,
          wholesale_price: 3100,
          wholesale_min_quantity: 4,
          purchase_price: 2400,
          selling_price: 4600,
          reorder_level: 6,
          minimum_stock: 5,
          current_stock: 16,
          supplier_id: sup3,
        },
        {
          name: 'Heavy Duty C-Clamp 6-inch Drop Forged',
          sku: 'HARD-CLP-007',
          category: 'Hand Tools',
          material: 'Malleable Cast Iron',
          dimensions: '150 mm Clamping Depth',
          warehouse: 'Ludhiana Central Depot',
          rack_location: 'Bay-C3-Shelf-03',
          unit: 'piece',
          dealer_price: 260,
          wholesale_price: 295,
          wholesale_min_quantity: 10,
          purchase_price: 220,
          selling_price: 440,
          reorder_level: 12,
          minimum_stock: 8,
          current_stock: 35,
          supplier_id: sup1,
        },
        {
          name: 'Brass Ball Valve 1-inch Full Bore',
          sku: 'HARD-VLV-008',
          category: 'Plumbing & Valves',
          material: 'Forged Brass Nickel Plated',
          dimensions: '1-inch BSP Thread',
          warehouse: 'Ludhiana Central Depot',
          rack_location: 'Bay-B2-Shelf-04',
          unit: 'piece',
          dealer_price: 210,
          wholesale_price: 240,
          wholesale_min_quantity: 15,
          purchase_price: 180,
          selling_price: 360,
          reorder_level: 18,
          minimum_stock: 12,
          current_stock: 44,
          supplier_id: sup2,
        },
        {
          name: 'Galvanized Steel Wire Rope 6mm (100m Roll)',
          sku: 'HARD-ROP-009',
          category: 'Rigging & Cables',
          material: 'Galvanized High Carbon Steel',
          dimensions: '6mm Diameter x 100m',
          warehouse: 'Ludhiana Central Depot',
          rack_location: 'Bay-B3-Floor-01',
          unit: 'roll',
          dealer_price: 1450,
          wholesale_price: 1650,
          wholesale_min_quantity: 3,
          purchase_price: 1250,
          selling_price: 2450,
          reorder_level: 5,
          minimum_stock: 4,
          current_stock: 12,
          supplier_id: sup1,
        },
        {
          name: 'Laminated Steel Safety Padlock 50mm (Keyed Alike)',
          sku: 'HARD-PAD-010',
          category: 'Security & Safety',
          material: 'Hardened Boron Alloy Shackle',
          dimensions: '50 mm Body Width',
          warehouse: 'Ludhiana Central Depot',
          rack_location: 'Bay-A3-Shelf-02',
          unit: 'piece',
          dealer_price: 185,
          wholesale_price: 210,
          wholesale_min_quantity: 12,
          purchase_price: 155,
          selling_price: 310,
          reorder_level: 15,
          current_stock: 4, // LOW STOCK!
          minimum_stock: 12,
          supplier_id: sup3,
        },
        {
          name: 'Industrial Duct Cloth Tape 48mm x 25m',
          sku: 'HARD-TAP-011',
          category: 'Consumables',
          material: 'Polyethylene Coated Cloth',
          dimensions: '48 mm x 25 meters',
          warehouse: 'Ludhiana Central Depot',
          rack_location: 'Bay-C4-Shelf-01',
          unit: 'roll',
          dealer_price: 95,
          wholesale_price: 115,
          wholesale_min_quantity: 24,
          purchase_price: 80,
          selling_price: 180,
          reorder_level: 30,
          minimum_stock: 20,
          current_stock: 65,
          supplier_id: sup2,
        },
        {
          name: 'Aluminum Step Ladder 5-Step Foldable',
          sku: 'HARD-LDR-012',
          category: 'Workplace Equipment',
          material: 'High Grade Anodized Aluminum',
          dimensions: '150 cm Platform Height',
          warehouse: 'Ludhiana Central Depot',
          rack_location: 'Bay-D2-Floor-02',
          unit: 'piece',
          dealer_price: 1900,
          wholesale_price: 2150,
          wholesale_min_quantity: 2,
          purchase_price: 1650,
          selling_price: 3200,
          reorder_level: 4,
          minimum_stock: 3,
          current_stock: 9,
          supplier_id: sup3,
        },
        {
          name: 'UPVC Solvent Weld Elbow 25mm 90-Degree',
          sku: 'HARD-ELB-013',
          category: 'Plumbing & Valves',
          material: 'Unplasticized Polyvinyl Chloride',
          dimensions: '25 mm Internal Diameter',
          warehouse: 'Ludhiana Central Depot',
          rack_location: 'Bay-B2-Shelf-01',
          unit: 'piece',
          dealer_price: 12,
          wholesale_price: 15,
          wholesale_min_quantity: 50,
          purchase_price: 9,
          selling_price: 26,
          reorder_level: 60,
          minimum_stock: 40,
          current_stock: 180,
          supplier_id: sup2,
        },
      ]

    case 'automobile':
      return [
        {
          name: 'Fully Synthetic Engine Oil 5W-40 4L',
          sku: 'AUTO-OIL-001',
          category: 'Lubricants & Fluids',
          brand: 'ProLube Elite',
          model: 'PL-Synth 5W40-4L',
          serial_number: 'SN-PL-889124',
          warranty_months: 6,
          unit: 'can',
          purchase_price: 1650,
          selling_price: 2499,
          barcode: '890789000001',
          hsn_code: '27101981',
          gst_rate: 28,
          current_stock: 38,
          minimum_stock: 10,
          supplier_id: sup1,
        },
        {
          name: 'Premium Ceramic Brake Pad Set Front',
          sku: 'AUTO-BRK-002',
          category: 'Braking System',
          brand: 'BremForce',
          model: 'BF-Ceramic Sedan D110',
          serial_number: 'SN-BF-771290',
          warranty_months: 12,
          unit: 'set',
          purchase_price: 850,
          selling_price: 1599,
          barcode: '890789000002',
          hsn_code: '87083000',
          gst_rate: 28,
          current_stock: 24,
          minimum_stock: 6,
          supplier_id: sup2,
        },
        {
          name: 'High Flow Spin-On Oil Filter',
          sku: 'AUTO-FLT-003',
          category: 'Filters',
          brand: 'FilterGuard',
          model: 'FG-FlowMax 204',
          serial_number: 'SN-FG-551209',
          warranty_months: 6,
          unit: 'piece',
          purchase_price: 140,
          selling_price: 280,
          barcode: '890789000003',
          hsn_code: '84212300',
          gst_rate: 28,
          current_stock: 65,
          minimum_stock: 15,
          supplier_id: sup2,
        },
        {
          name: 'Iridium Power Spark Plug (Set of 4)',
          sku: 'AUTO-SPK-004',
          category: 'Ignition & Electrical',
          brand: 'SparkTech',
          model: 'ST-Iridium IX 4',
          serial_number: 'SN-ST-338192',
          warranty_months: 24,
          unit: 'box',
          purchase_price: 720,
          selling_price: 1350,
          barcode: '890789000004',
          hsn_code: '85111000',
          gst_rate: 28,
          current_stock: 2, // LOW STOCK!
          minimum_stock: 8,
          supplier_id: sup3,
        },
        {
          name: 'Heavy Duty Car Battery 12V 45Ah Maintenance Free',
          sku: 'AUTO-BAT-005',
          category: 'Electrical System',
          brand: 'VoltMaster',
          model: 'VM-MF45L',
          serial_number: 'SN-VM-991204',
          warranty_months: 36,
          unit: 'unit',
          purchase_price: 3400,
          selling_price: 4999,
          barcode: '890789000005',
          hsn_code: '85071000',
          gst_rate: 28,
          current_stock: 0, // OUT OF STOCK!
          minimum_stock: 4,
          supplier_id: sup1,
        },
        {
          name: 'All-Weather Aerodynamic Beam Wiper Blades 24/18',
          sku: 'AUTO-WPR-006',
          category: 'Body & Exterior',
          brand: 'ClearVision',
          model: 'CV-AeroBeam 2418',
          serial_number: 'SN-CV-220194',
          warranty_months: 12,
          unit: 'pair',
          purchase_price: 320,
          selling_price: 699,
          barcode: '890789000006',
          hsn_code: '85124000',
          gst_rate: 28,
          current_stock: 45,
          minimum_stock: 10,
          supplier_id: sup3,
        },
        {
          name: 'LED Headlight Conversion Bulbs H4 6000K',
          sku: 'AUTO-LGT-007',
          category: 'Lighting & Bulbs',
          brand: 'LumenBright',
          model: 'LB-H4-UltraGlow',
          serial_number: 'SN-LB-664190',
          warranty_months: 24,
          unit: 'pair',
          purchase_price: 980,
          selling_price: 1899,
          barcode: '890789000007',
          hsn_code: '85392120',
          gst_rate: 28,
          current_stock: 18,
          minimum_stock: 5,
          supplier_id: sup2,
        },
        {
          name: 'Cabin Activated Carbon Air Filter',
          sku: 'AUTO-CAB-008',
          category: 'Filters',
          brand: 'FilterGuard',
          model: 'FG-PureCabin C31',
          serial_number: 'SN-FG-118290',
          warranty_months: 6,
          unit: 'piece',
          purchase_price: 210,
          selling_price: 450,
          barcode: '890789000008',
          hsn_code: '84213920',
          gst_rate: 28,
          current_stock: 35,
          minimum_stock: 8,
          supplier_id: sup2,
        },
        {
          name: 'Heavy Duty Dual Tone Disc Horn 12V 110dB',
          sku: 'AUTO-HRN-009',
          category: 'Electrical System',
          brand: 'SoundBlast',
          model: 'SB-DualSymphony 12V',
          serial_number: 'SN-SB-882193',
          warranty_months: 12,
          purchase_price: 420,
          selling_price: 850,
          barcode: '890789000009',
          hsn_code: '85123010',
          gst_rate: 28,
          current_stock: 22,
          minimum_stock: 6,
          supplier_id: sup1,
        },
        {
          name: 'Long Life Organic Coolant Premix 1L',
          sku: 'AUTO-CLN-010',
          category: 'Lubricants & Fluids',
          brand: 'ProLube Elite',
          model: 'PL-CoolGuard 50/50',
          serial_number: 'SN-PL-448102',
          warranty_months: 12,
          unit: 'bottle',
          purchase_price: 160,
          selling_price: 299,
          barcode: '890789000010',
          hsn_code: '38200000',
          gst_rate: 18,
          current_stock: 50,
          minimum_stock: 12,
          supplier_id: sup1,
        },
        {
          name: 'Rear Gas Shock Absorber Strut',
          sku: 'AUTO-SHK-011',
          category: 'Suspension',
          brand: 'RideControl',
          model: 'RC-GasStrut R40',
          serial_number: 'SN-RC-552910',
          warranty_months: 24,
          unit: 'piece',
          purchase_price: 1100,
          selling_price: 1999,
          barcode: '890789000011',
          hsn_code: '87088000',
          gst_rate: 28,
          current_stock: 3, // LOW STOCK!
          minimum_stock: 6,
          supplier_id: sup3,
        },
        {
          name: 'Engine Timing Belt Kit with Tensioner',
          sku: 'AUTO-TMG-012',
          category: 'Engine Parts',
          brand: 'PowerDrive',
          model: 'PD-BeltTension Kit D4',
          serial_number: 'SN-PD-772184',
          warranty_months: 24,
          unit: 'kit',
          purchase_price: 1450,
          selling_price: 2599,
          barcode: '890789000012',
          hsn_code: '40103500',
          gst_rate: 28,
          current_stock: 12,
          minimum_stock: 4,
          supplier_id: sup3,
        },
        {
          name: 'Slotted Disc Brake Rotors (Front Pair)',
          sku: 'AUTO-RTR-013',
          category: 'Braking System',
          brand: 'BremForce',
          model: 'BF-RotorMax Pair 280mm',
          serial_number: 'SN-BF-992104',
          warranty_months: 18,
          unit: 'pair',
          purchase_price: 1850,
          selling_price: 3299,
          barcode: '890789000013',
          hsn_code: '87083000',
          gst_rate: 28,
          current_stock: 10,
          minimum_stock: 4,
          supplier_id: sup2,
        },
      ]

    case 'wholesale':
      return [
        {
          name: '5-Ply Corrugated Heavy Duty Shipping Boxes (Bundle of 50)',
          sku: 'BULK-BOX-001',
          category: 'Packaging Supplies',
          brand: 'PackMaster',
          unit: 'bundle',
          purchase_price: 950,
          selling_price: 1450,
          wholesale_price: 1180,
          wholesale_min_quantity: 10,
          hsn_code: '48191010',
          gst_rate: 18,
          current_stock: 60,
          minimum_stock: 15,
          supplier_id: sup1,
        },
        {
          name: 'Cast Stretch Wrap Film 500m x 500mm Roll 23 Micron',
          sku: 'BULK-STR-002',
          category: 'Packaging Supplies',
          brand: 'PackMaster',
          unit: 'roll',
          purchase_price: 420,
          selling_price: 680,
          wholesale_price: 520,
          wholesale_min_quantity: 20,
          hsn_code: '39201019',
          gst_rate: 18,
          current_stock: 85,
          minimum_stock: 20,
          supplier_id: sup1,
        },
        {
          name: 'Polypropylene Heavy Duty Strapping Band 12mm Roll',
          sku: 'BULK-STP-003',
          category: 'Packaging Supplies',
          brand: 'SecurePack',
          unit: 'roll',
          purchase_price: 360,
          selling_price: 580,
          wholesale_price: 440,
          wholesale_min_quantity: 15,
          hsn_code: '39202090',
          gst_rate: 18,
          current_stock: 55,
          minimum_stock: 15,
          supplier_id: sup2,
        },
        {
          name: 'Air Bubble Cushioning Roll 100m x 1m',
          sku: 'BULK-BBL-004',
          category: 'Packaging Supplies',
          brand: 'SecurePack',
          unit: 'roll',
          purchase_price: 380,
          selling_price: 620,
          wholesale_price: 480,
          wholesale_min_quantity: 12,
          hsn_code: '39201012',
          gst_rate: 18,
          current_stock: 2, // LOW STOCK!
          minimum_stock: 10,
          supplier_id: sup2,
        },
        {
          name: 'Thermal POS Receipt Paper Rolls 80mm (Box of 50)',
          sku: 'BULK-THM-005',
          category: 'Stationery & Printing',
          brand: 'PrintPro',
          unit: 'box',
          purchase_price: 780,
          selling_price: 1250,
          wholesale_price: 960,
          wholesale_min_quantity: 10,
          hsn_code: '48119090',
          gst_rate: 12,
          current_stock: 0, // OUT OF STOCK!
          minimum_stock: 15,
          supplier_id: sup3,
        },
        {
          name: 'BOPP Transparent Packaging Tape 72mm x 65m (Box of 36)',
          sku: 'BULK-TPE-006',
          category: 'Adhesives & Tapes',
          brand: 'StickWell',
          unit: 'box',
          purchase_price: 880,
          selling_price: 1399,
          wholesale_price: 1080,
          wholesale_min_quantity: 10,
          hsn_code: '39191000',
          gst_rate: 18,
          current_stock: 40,
          minimum_stock: 10,
          supplier_id: sup1,
        },
        {
          name: 'Self-Adhesive Direct Thermal Shipping Labels (5000 Labels)',
          sku: 'BULK-LBL-007',
          category: 'Stationery & Printing',
          brand: 'PrintPro',
          unit: 'roll',
          purchase_price: 520,
          selling_price: 850,
          wholesale_price: 640,
          wholesale_min_quantity: 15,
          hsn_code: '48211020',
          gst_rate: 18,
          current_stock: 45,
          minimum_stock: 12,
          supplier_id: sup3,
        },
        {
          name: 'Brown Kraft Paper Shopping Bags Large (Pack of 500)',
          sku: 'BULK-KRF-008',
          category: 'Packaging Supplies',
          brand: 'EcoWrap',
          unit: 'pack',
          purchase_price: 1100,
          selling_price: 1750,
          wholesale_price: 1350,
          wholesale_min_quantity: 8,
          hsn_code: '48194000',
          gst_rate: 18,
          current_stock: 30,
          minimum_stock: 8,
          supplier_id: sup2,
        },
        {
          name: 'Industrial Heavy Duty Stapler Pins 23/15 (Box of 20 Packs)',
          sku: 'BULK-STP-009',
          category: 'Hardware Supplies',
          brand: 'SteelGrip',
          unit: 'box',
          purchase_price: 320,
          selling_price: 520,
          wholesale_price: 400,
          wholesale_min_quantity: 20,
          hsn_code: '83052000',
          gst_rate: 18,
          current_stock: 50,
          minimum_stock: 15,
          supplier_id: sup3,
        },
        {
          name: 'Jute Gunny Sacks for Bulk Grain Storage (Bundle of 25)',
          sku: 'BULK-JUT-010',
          category: 'Agricultural Packaging',
          brand: 'Kolkata Jute Mills',
          unit: 'bundle',
          purchase_price: 650,
          selling_price: 1050,
          wholesale_price: 810,
          wholesale_min_quantity: 10,
          hsn_code: '63051000',
          gst_rate: 5,
          current_stock: 3, // LOW STOCK!
          minimum_stock: 10,
          supplier_id: sup1,
        },
        {
          name: 'Heavy Duty Plastic Stackable Storage Crate 50L',
          sku: 'BULK-CRT-011',
          category: 'Warehouse Storage',
          brand: 'Duratank',
          unit: 'piece',
          purchase_price: 280,
          selling_price: 460,
          wholesale_price: 350,
          wholesale_min_quantity: 25,
          hsn_code: '39231090',
          gst_rate: 18,
          current_stock: 70,
          minimum_stock: 20,
          supplier_id: sup2,
        },
        {
          name: 'Thermal Transfer Wax-Resin Ribbon 110mm x 300m',
          sku: 'BULK-RBN-012',
          category: 'Stationery & Printing',
          brand: 'PrintPro',
          unit: 'roll',
          purchase_price: 180,
          selling_price: 320,
          wholesale_price: 230,
          wholesale_min_quantity: 30,
          hsn_code: '96121090',
          gst_rate: 18,
          current_stock: 65,
          minimum_stock: 15,
          supplier_id: sup3,
        },
        {
          name: 'Polyolefin Shrink Film Roll 19 Micron 400mm x 1000m',
          sku: 'BULK-SHR-013',
          category: 'Packaging Supplies',
          brand: 'PackMaster',
          unit: 'roll',
          purchase_price: 1450,
          selling_price: 2200,
          wholesale_price: 1750,
          wholesale_min_quantity: 5,
          hsn_code: '39201019',
          gst_rate: 18,
          current_stock: 18,
          minimum_stock: 5,
          supplier_id: sup1,
        },
      ]

    case 'retail':
      return [
        {
          name: 'Artisanal Hand-Poured Soy Wax Scented Candle',
          sku: 'RTL-CND-001',
          category: 'Home & Living',
          brand: 'Urban Aura',
          unit: 'piece',
          barcode: '890111200001',
          purchase_price: 240,
          selling_price: 599,
          hsn_code: '34060010',
          gst_rate: 18,
          current_stock: 45,
          minimum_stock: 10,
          supplier_id: sup1,
        },
        {
          name: 'Insulated Double Wall Thermal Bottle 750ml',
          sku: 'RTL-BTL-002',
          category: 'Drinkware',
          brand: 'HydroSteel',
          unit: 'piece',
          barcode: '890111200002',
          purchase_price: 320,
          selling_price: 799,
          hsn_code: '73239390',
          gst_rate: 18,
          current_stock: 55,
          minimum_stock: 12,
          supplier_id: sup1,
        },
        {
          name: 'Bamboo Fiber Eco-Friendly Dinner Plate Set (4pc)',
          sku: 'RTL-PLT-003',
          category: 'Kitchenware',
          brand: 'EcoLiving',
          unit: 'set',
          barcode: '890111200003',
          purchase_price: 380,
          selling_price: 950,
          hsn_code: '39241090',
          gst_rate: 18,
          current_stock: 35,
          minimum_stock: 8,
          supplier_id: sup2,
        },
        {
          name: 'Woven Cotton Cushion Cover 16x16 inch (Set of 2)',
          sku: 'RTL-CSH-004',
          category: 'Home & Living',
          brand: 'Urban Aura',
          unit: 'pair',
          barcode: '890111200004',
          purchase_price: 180,
          selling_price: 499,
          hsn_code: '63049200',
          gst_rate: 5,
          current_stock: 2, // LOW STOCK!
          minimum_stock: 10,
          supplier_id: sup2,
        },
        {
          name: 'Handcrafted Ceramic Indoor Planter with Saucer',
          sku: 'RTL-PLN-005',
          category: 'Garden & Home',
          brand: 'TerraClay',
          unit: 'piece',
          barcode: '890111200005',
          purchase_price: 210,
          selling_price: 549,
          hsn_code: '69120090',
          gst_rate: 12,
          current_stock: 0, // OUT OF STOCK!
          minimum_stock: 8,
          supplier_id: sup3,
        },
        {
          name: 'Stainless Steel Cutlery Set 16pc Mirror Finish',
          sku: 'RTL-CTL-006',
          category: 'Kitchenware',
          brand: 'HydroSteel',
          unit: 'box',
          barcode: '890111200006',
          purchase_price: 450,
          selling_price: 1199,
          hsn_code: '82152000',
          gst_rate: 18,
          current_stock: 28,
          minimum_stock: 6,
          supplier_id: sup1,
        },
        {
          name: 'Ultrasonic Essential Oil Aroma Diffuser 300ml',
          sku: 'RTL-DIF-007',
          category: 'Wellness & Living',
          brand: 'Urban Aura',
          unit: 'piece',
          barcode: '890111200007',
          purchase_price: 550,
          selling_price: 1399,
          hsn_code: '85098000',
          gst_rate: 18,
          current_stock: 22,
          minimum_stock: 5,
          supplier_id: sup3,
        },
        {
          name: 'Natural Cork Yoga Mat 6mm Non-Slip',
          sku: 'RTL-YOG-008',
          category: 'Fitness & Health',
          brand: 'EcoLiving',
          unit: 'piece',
          barcode: '890111200008',
          purchase_price: 580,
          selling_price: 1499,
          hsn_code: '95069190',
          gst_rate: 18,
          current_stock: 18,
          minimum_stock: 5,
          supplier_id: sup2,
        },
        {
          name: 'Acacia Wood Serving Platter Tray',
          sku: 'RTL-TRY-009',
          category: 'Kitchenware',
          brand: 'TerraClay',
          unit: 'piece',
          barcode: '890111200009',
          purchase_price: 290,
          selling_price: 749,
          hsn_code: '44199090',
          gst_rate: 12,
          current_stock: 32,
          minimum_stock: 8,
          supplier_id: sup3,
        },
        {
          name: 'Borosilicate Glass Storage Jars Set of 3 (Bamboo Lids)',
          sku: 'RTL-JAR-010',
          category: 'Kitchenware',
          brand: 'EcoLiving',
          unit: 'set',
          barcode: '890111200010',
          purchase_price: 360,
          selling_price: 899,
          hsn_code: '70134900',
          gst_rate: 18,
          current_stock: 40,
          minimum_stock: 10,
          supplier_id: sup2,
        },
        {
          name: 'Minimalist Wooden Wall Clock 12-inch Silent Quartz',
          sku: 'RTL-CLK-011',
          category: 'Home & Living',
          brand: 'Urban Aura',
          unit: 'piece',
          barcode: '890111200011',
          purchase_price: 380,
          selling_price: 999,
          hsn_code: '91052100',
          gst_rate: 18,
          current_stock: 4, // LOW STOCK!
          minimum_stock: 8,
          supplier_id: sup1,
        },
        {
          name: 'Organic Cotton Canvas Tote Bag Screen Printed',
          sku: 'RTL-TOT-012',
          category: 'Bags & Accessories',
          brand: 'EcoLiving',
          unit: 'piece',
          barcode: '890111200012',
          purchase_price: 110,
          selling_price: 299,
          hsn_code: '42022220',
          gst_rate: 5,
          current_stock: 75,
          minimum_stock: 15,
          supplier_id: sup2,
        },
        {
          name: 'Microfiber Quick-Dry Bath Towel 70x140cm',
          sku: 'RTL-TWL-013',
          category: 'Home Textiles',
          brand: 'Urban Aura',
          unit: 'piece',
          barcode: '890111200013',
          purchase_price: 190,
          selling_price: 499,
          hsn_code: '63026090',
          gst_rate: 5,
          current_stock: 50,
          minimum_stock: 12,
          supplier_id: sup3,
        },
      ]

    case 'restaurant':
      return [
        {
          name: 'Long Grain Biryani Basmati Rice 25kg Bag',
          sku: 'REST-RIC-001',
          category: 'Bulk Staples',
          brand: 'Deccan Royal',
          unit: 'bag',
          weight: 25.0,
          barcode: '890222300001',
          expiry_date: daysAhead(540),
          purchase_price: 2100,
          selling_price: 2750,
          hsn_code: '10063020',
          gst_rate: 0,
          current_stock: 35,
          minimum_stock: 8,
          supplier_id: sup1,
        },
        {
          name: 'Pure Desi Ghee Tin 15kg for Commercial Kitchen',
          sku: 'REST-GHE-002',
          category: 'Cooking Medium',
          brand: 'DairyGold Pro',
          unit: 'tin',
          weight: 15.0,
          barcode: '890222300002',
          expiry_date: daysAhead(270),
          purchase_price: 7800,
          selling_price: 9200,
          hsn_code: '04059020',
          gst_rate: 12,
          current_stock: 12,
          minimum_stock: 3,
          supplier_id: sup1,
        },
        {
          name: 'Kashmiri Mongra Saffron Strands Grade-A 25g Box',
          sku: 'REST-SAF-003',
          category: 'Exotic Spices',
          brand: 'Pampore Gold',
          unit: 'box',
          weight: 0.025,
          barcode: '890222300003',
          expiry_date: daysAhead(730),
          purchase_price: 4200,
          selling_price: 5600,
          hsn_code: '09102010',
          gst_rate: 5,
          current_stock: 8,
          minimum_stock: 2,
          supplier_id: sup2,
        },
        {
          name: 'Whole Cashew Nuts Grade W240 5kg Box',
          sku: 'REST-CSH-004',
          category: 'Nuts & Dry Fruits',
          brand: 'Malabar Dry Fruits',
          unit: 'box',
          weight: 5.0,
          barcode: '890222300004',
          expiry_date: daysAhead(180),
          purchase_price: 3400,
          selling_price: 4200,
          hsn_code: '08013210',
          gst_rate: 5,
          current_stock: 16,
          minimum_stock: 4,
          supplier_id: sup2,
        },
        {
          name: 'Black Pepper Malabar Bold 1kg Pack',
          sku: 'REST-PEP-005',
          category: 'Spices & Seasoning',
          brand: 'Spice Route',
          unit: 'pack',
          weight: 1.0,
          barcode: '890222300005',
          expiry_date: daysAhead(360),
          purchase_price: 520,
          selling_price: 690,
          hsn_code: '09041110',
          gst_rate: 5,
          current_stock: 2, // LOW STOCK!
          minimum_stock: 6,
          supplier_id: sup2,
        },
        {
          name: 'Freshly Ground Chef Special Garam Masala 1kg',
          sku: 'REST-GRM-006',
          category: 'Spices & Seasoning',
          brand: 'Spice Route',
          unit: 'pack',
          weight: 1.0,
          barcode: '890222300006',
          expiry_date: daysAhead(180),
          purchase_price: 420,
          selling_price: 580,
          hsn_code: '09109100',
          gst_rate: 5,
          current_stock: 0, // OUT OF STOCK!
          minimum_stock: 5,
          supplier_id: sup2,
        },
        {
          name: 'Green Cardamom Bold 8mm 500g Pack',
          sku: 'REST-CRD-007',
          category: 'Exotic Spices',
          brand: 'Spice Route',
          unit: 'pack',
          weight: 0.5,
          barcode: '890222300007',
          expiry_date: daysAhead(360),
          purchase_price: 1100,
          selling_price: 1450,
          hsn_code: '09083110',
          gst_rate: 5,
          current_stock: 10,
          minimum_stock: 3,
          supplier_id: sup3,
        },
        {
          name: 'Fresh Ginger Garlic Paste Culinary Grade 5kg Tub',
          sku: 'REST-GNP-008',
          category: 'Culinary Bases',
          brand: 'ChefChoice',
          unit: 'tub',
          weight: 5.0,
          barcode: '890222300008',
          expiry_date: daysAhead(90),
          purchase_price: 320,
          selling_price: 450,
          hsn_code: '21039090',
          gst_rate: 12,
          current_stock: 24,
          minimum_stock: 6,
          supplier_id: sup3,
        },
        {
          name: 'Refined Sunflower Cooking Oil 15L Commercial Tin',
          sku: 'REST-OIL-009',
          category: 'Cooking Medium',
          brand: 'SunPure Commercial',
          unit: 'tin',
          weight: 13.65,
          barcode: '890222300009',
          expiry_date: daysAhead(240),
          purchase_price: 1650,
          selling_price: 1980,
          hsn_code: '15121910',
          gst_rate: 5,
          current_stock: 20,
          minimum_stock: 5,
          supplier_id: sup1,
        },
        {
          name: 'Natural Rose Water Essence 500ml Glass Bottle',
          sku: 'REST-ROS-010',
          category: 'Flavors & Aromatics',
          brand: 'Deccan Royal',
          unit: 'bottle',
          weight: 0.5,
          barcode: '890222300010',
          expiry_date: daysAhead(540),
          purchase_price: 160,
          selling_price: 240,
          hsn_code: '33019031',
          gst_rate: 18,
          current_stock: 18,
          minimum_stock: 4,
          supplier_id: sup3,
        },
        {
          name: 'Star Anise Whole Grade-1 500g Pack',
          sku: 'REST-STR-011',
          category: 'Exotic Spices',
          brand: 'Spice Route',
          unit: 'pack',
          weight: 0.5,
          barcode: '890222300011',
          expiry_date: daysAhead(360),
          purchase_price: 340,
          selling_price: 480,
          hsn_code: '09096129',
          gst_rate: 5,
          current_stock: 3, // LOW STOCK!
          minimum_stock: 5,
          supplier_id: sup2,
        },
        {
          name: 'Whole Cinnamon Bark Sticks 1kg Pack',
          sku: 'REST-CIN-012',
          category: 'Spices & Seasoning',
          brand: 'Spice Route',
          unit: 'pack',
          weight: 1.0,
          barcode: '890222300012',
          expiry_date: daysAhead(400),
          purchase_price: 460,
          selling_price: 620,
          hsn_code: '09061110',
          gst_rate: 5,
          current_stock: 14,
          minimum_stock: 4,
          supplier_id: sup2,
        },
        {
          name: 'Dry Kashmiri Red Chillies Stemless 2kg Pack',
          sku: 'REST-CHL-013',
          category: 'Spices & Seasoning',
          brand: 'Deccan Royal',
          unit: 'pack',
          weight: 2.0,
          barcode: '890222300013',
          expiry_date: daysAhead(300),
          purchase_price: 680,
          selling_price: 890,
          hsn_code: '09042110',
          gst_rate: 5,
          current_stock: 22,
          minimum_stock: 5,
          supplier_id: sup3,
        },
      ]

    case 'manufacturing':
      return [
        // Raw Materials
        {
          name: 'Polypropylene Granules Virgin Grade (PP Homo)',
          sku: 'MFG-RM-PP01',
          category: 'Raw Material',
          brand: 'Relene Petro',
          model: 'PP-H110MA',
          unit: 'kg',
          barcode: '890333400001',
          purchase_price: 92,
          selling_price: 110,
          hsn_code: '39021000',
          gst_rate: 18,
          current_stock: 1850,
          minimum_stock: 500,
          supplier_id: sup1,
        },
        {
          name: 'High Density Polyethylene Blow Molding Resin (HDPE)',
          sku: 'MFG-RM-HD02',
          category: 'Raw Material',
          brand: 'IOCL Polymers',
          model: 'HDPE-B52A003',
          unit: 'kg',
          barcode: '890333400002',
          purchase_price: 98,
          selling_price: 118,
          hsn_code: '39012000',
          gst_rate: 18,
          current_stock: 1400,
          minimum_stock: 400,
          supplier_id: sup1,
        },
        {
          name: 'Linear Low Density Polyethylene (LLDPE Film Grade)',
          sku: 'MFG-RM-LL03',
          category: 'Raw Material',
          brand: 'Relene Petro',
          model: 'LLDPE-F19010',
          unit: 'kg',
          barcode: '890333400003',
          purchase_price: 95,
          selling_price: 114,
          hsn_code: '39011010',
          gst_rate: 18,
          current_stock: 1200,
          minimum_stock: 350,
          supplier_id: sup2,
        },
        {
          name: 'Blue Pigment Masterbatch Concentrate (25kg Bag)',
          sku: 'MFG-RM-MB04',
          category: 'Raw Material',
          brand: 'ColorChem',
          model: 'MB-RoyalBlue 50',
          unit: 'bag',
          barcode: '890333400004',
          purchase_price: 2600,
          selling_price: 3200,
          hsn_code: '32064900',
          gst_rate: 18,
          current_stock: 4, // LOW STOCK!
          minimum_stock: 10,
          supplier_id: sup2,
        },
        {
          name: 'Calcium Carbonate Filler Masterbatch (25kg Bag)',
          sku: 'MFG-RM-FL05',
          category: 'Raw Material',
          brand: 'FillerTech',
          model: 'FT-Calcite 80',
          unit: 'bag',
          barcode: '890333400005',
          purchase_price: 850,
          selling_price: 1100,
          hsn_code: '38249900',
          gst_rate: 18,
          current_stock: 0, // OUT OF STOCK!
          minimum_stock: 15,
          supplier_id: sup3,
        },
        {
          name: 'UV Stabilizer Hindered Amine Additive 5kg',
          sku: 'MFG-RM-UV06',
          category: 'Raw Material',
          brand: 'PolyShield',
          model: 'PS-UVLight 770',
          unit: 'drum',
          barcode: '890333400006',
          purchase_price: 3400,
          selling_price: 4200,
          hsn_code: '38123990',
          gst_rate: 18,
          current_stock: 12,
          minimum_stock: 4,
          supplier_id: sup3,
        },

        // Finished Goods
        {
          name: 'Industrial Heavy Duty Storage Crate 50L Blue',
          sku: 'MFG-FG-CRT01',
          category: 'Finished Goods',
          brand: 'Sunrise',
          model: 'SP-Crate 50L HD',
          unit: 'piece',
          barcode: '890333400007',
          purchase_price: 210,
          selling_price: 360,
          hsn_code: '39231090',
          gst_rate: 18,
          current_stock: 220,
          minimum_stock: 50,
          supplier_id: null,
        },
        {
          name: 'Chemical Jerry Can 20L with Tamper Evident Cap',
          sku: 'MFG-FG-CAN02',
          category: 'Finished Goods',
          brand: 'Sunrise',
          model: 'SP-Can 20L UN',
          unit: 'piece',
          barcode: '890333400008',
          purchase_price: 85,
          selling_price: 155,
          hsn_code: '39233090',
          gst_rate: 18,
          current_stock: 350,
          minimum_stock: 80,
          supplier_id: null,
        },
        {
          name: 'Heavy Duty Plastic Pallet 1200x1000mm Rackable',
          sku: 'MFG-FG-PLT03',
          category: 'Finished Goods',
          brand: 'Sunrise',
          model: 'SP-Pallet 1.5T',
          unit: 'piece',
          barcode: '890333400009',
          purchase_price: 1250,
          selling_price: 1980,
          hsn_code: '39269099',
          gst_rate: 18,
          current_stock: 65,
          minimum_stock: 15,
          supplier_id: null,
        },
        {
          name: 'Stackable Multi-Purpose Waste Bin 60L with Lid',
          sku: 'MFG-FG-BIN04',
          category: 'Finished Goods',
          brand: 'Sunrise',
          model: 'SP-WasteBin 60L',
          unit: 'piece',
          barcode: '890333400010',
          purchase_price: 280,
          selling_price: 490,
          hsn_code: '39249090',
          gst_rate: 18,
          current_stock: 90,
          minimum_stock: 20,
          supplier_id: null,
        },
        {
          name: 'Tamper Evident Screw Caps 28mm (Carton of 5000)',
          sku: 'MFG-FG-CAP05',
          category: 'Finished Goods',
          brand: 'Sunrise',
          model: 'SP-Cap 28mm PCO',
          unit: 'box',
          barcode: '890333400011',
          purchase_price: 1100,
          selling_price: 1750,
          hsn_code: '39235010',
          gst_rate: 18,
          current_stock: 45,
          minimum_stock: 10,
          supplier_id: null,
        },
        {
          name: 'Corrugated PP Flute Sheet 4x8ft 3mm White',
          sku: 'MFG-FG-SHT06',
          category: 'Finished Goods',
          brand: 'Sunrise',
          model: 'SP-FluteSheet 3mm',
          unit: 'sheet',
          barcode: '890333400012',
          purchase_price: 160,
          selling_price: 280,
          hsn_code: '39202090',
          gst_rate: 18,
          current_stock: 3, // LOW STOCK!
          minimum_stock: 20,
          supplier_id: null,
        },
        {
          name: 'Plastic Paint Bucket with Handle 10L',
          sku: 'MFG-FG-BKT07',
          category: 'Finished Goods',
          brand: 'Sunrise',
          model: 'SP-PaintPail 10L',
          unit: 'piece',
          barcode: '890333400013',
          purchase_price: 68,
          selling_price: 125,
          hsn_code: '39239090',
          gst_rate: 18,
          current_stock: 160,
          minimum_stock: 40,
          supplier_id: null,
        },
      ]

    case 'other':
    default:
      return [
        {
          name: 'Multi-Surface Floor Cleaner Disinfectant 5L Can',
          sku: 'GEN-CLN-001',
          category: 'Cleaning & Janitorial',
          brand: 'CleanMaster',
          unit: 'can',
          barcode: '890444500001',
          purchase_price: 280,
          selling_price: 450,
          hsn_code: '34022090',
          gst_rate: 18,
          current_stock: 60,
          minimum_stock: 15,
          supplier_id: sup1,
        },
        {
          name: 'Heavy Duty Wet Mop with Telescopic Aluminum Handle',
          sku: 'GEN-MOP-002',
          category: 'Cleaning Supplies',
          brand: 'CleanMaster',
          unit: 'piece',
          barcode: '890444500002',
          purchase_price: 160,
          selling_price: 299,
          hsn_code: '96039000',
          gst_rate: 18,
          current_stock: 45,
          minimum_stock: 10,
          supplier_id: sup1,
        },
        {
          name: 'Microfiber Cleaning Cloths 40x40cm (Pack of 12)',
          sku: 'GEN-CLT-003',
          category: 'Cleaning Supplies',
          brand: 'SparklePro',
          unit: 'pack',
          barcode: '890444500003',
          purchase_price: 180,
          selling_price: 360,
          hsn_code: '63071010',
          gst_rate: 12,
          current_stock: 80,
          minimum_stock: 20,
          supplier_id: sup2,
        },
        {
          name: 'Step-On Foot Pedal Dustbin 20L Heavy Duty Plastic',
          sku: 'GEN-BIN-004',
          category: 'Waste Management',
          brand: 'DuraBin',
          unit: 'piece',
          barcode: '890444500004',
          purchase_price: 320,
          selling_price: 599,
          hsn_code: '39249090',
          gst_rate: 18,
          current_stock: 2, // LOW STOCK!
          minimum_stock: 8,
          supplier_id: sup2,
        },
        {
          name: 'Synthetic Soft Bristle Indoor Broom with Long Handle',
          sku: 'GEN-BRM-005',
          category: 'Cleaning Supplies',
          brand: 'SparklePro',
          unit: 'piece',
          barcode: '890444500005',
          purchase_price: 110,
          selling_price: 220,
          hsn_code: '96031000',
          gst_rate: 18,
          current_stock: 0, // OUT OF STOCK!
          minimum_stock: 12,
          supplier_id: sup3,
        },
        {
          name: 'Heavy Duty Nitrile Chemical Resistant Gloves (Pair)',
          sku: 'GEN-GLV-006',
          category: 'Safety & PPE',
          brand: 'SafeGrip',
          unit: 'pair',
          barcode: '890444500006',
          purchase_price: 65,
          selling_price: 140,
          hsn_code: '40151900',
          gst_rate: 18,
          current_stock: 110,
          minimum_stock: 25,
          supplier_id: sup3,
        },
        {
          name: 'Adjustable Pressure Trigger Spray Bottle 750ml',
          sku: 'GEN-SPR-007',
          category: 'Equipment & Dispensing',
          brand: 'DuraBin',
          unit: 'piece',
          barcode: '890444500007',
          purchase_price: 45,
          selling_price: 99,
          hsn_code: '84248990',
          gst_rate: 18,
          current_stock: 75,
          minimum_stock: 15,
          supplier_id: sup1,
        },
        {
          name: 'Industrial Heavy Duty Scouring Scrub Pads (Pack of 10)',
          sku: 'GEN-SCB-008',
          category: 'Cleaning Supplies',
          brand: 'SparklePro',
          unit: 'pack',
          barcode: '890444500008',
          purchase_price: 75,
          selling_price: 150,
          hsn_code: '68053000',
          gst_rate: 18,
          current_stock: 90,
          minimum_stock: 20,
          supplier_id: sup2,
        },
        {
          name: 'Liquid Hand Wash Antibacterial Refill 5L',
          sku: 'GEN-HND-009',
          category: 'Personal & Washroom Care',
          brand: 'CleanMaster',
          unit: 'can',
          barcode: '890444500009',
          purchase_price: 240,
          selling_price: 399,
          hsn_code: '34013011',
          gst_rate: 18,
          current_stock: 40,
          minimum_stock: 10,
          supplier_id: sup1,
        },
        {
          name: 'Heavy Duty Biodegradable Garbage Bags Large (Roll of 30)',
          sku: 'GEN-BAG-010',
          category: 'Waste Management',
          brand: 'DuraBin',
          unit: 'roll',
          barcode: '890444500010',
          purchase_price: 90,
          selling_price: 180,
          hsn_code: '39232100',
          gst_rate: 18,
          current_stock: 120,
          minimum_stock: 25,
          supplier_id: sup2,
        },
        {
          name: 'Window Glass Wiper Squeegee with Rubber Blade 35cm',
          sku: 'GEN-WIP-011',
          category: 'Cleaning Equipment',
          brand: 'CleanMaster',
          unit: 'piece',
          barcode: '890444500011',
          purchase_price: 120,
          selling_price: 240,
          hsn_code: '96039000',
          gst_rate: 18,
          current_stock: 4, // LOW STOCK!
          minimum_stock: 10,
          supplier_id: sup3,
        },
        {
          name: 'Industrial Stainless Steel Spiral Wire Scrubber (Pack of 12)',
          sku: 'GEN-WIR-012',
          category: 'Cleaning Supplies',
          brand: 'SparklePro',
          unit: 'pack',
          barcode: '890444500012',
          purchase_price: 85,
          selling_price: 165,
          hsn_code: '73231000',
          gst_rate: 18,
          current_stock: 55,
          minimum_stock: 15,
          supplier_id: sup3,
        },
        {
          name: 'Electrostatic Feather Duster Extendable Pole 1.5m',
          sku: 'GEN-DST-013',
          category: 'Cleaning Equipment',
          brand: 'CleanMaster',
          unit: 'piece',
          barcode: '890444500013',
          purchase_price: 150,
          selling_price: 299,
          hsn_code: '96039000',
          gst_rate: 18,
          current_stock: 35,
          minimum_stock: 8,
          supplier_id: sup1,
        },
      ]
  }
}

// -----------------------------------------------------------------------------
// 3. MAIN RUN SEED FUNCTION
// -----------------------------------------------------------------------------

async function runSeed() {
  console.log('\n=================================================================')
  console.log('  Stockroom / IMB: Multi-Industry Master Demo Seed Script')
  console.log('=================================================================')
  console.log(`Target Host: ${supabaseHost}`)
  console.log(`Environment: ${env.nodeEnv}`)
  console.log(`Options:     isFresh=${isFresh}, isForce=${isForce}\n`)

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD_PLAIN, BCRYPT_ROUNDS)

  // Target emails for all 11 businesses (33 users total)
  const allTargetEmails = []
  for (const spec of BUSINESS_SPECS) {
    allTargetEmails.push(`owner@${spec.industry}.stockroom.test`)
    allTargetEmails.push(`manager@${spec.industry}.stockroom.test`)
    allTargetEmails.push(`staff@${spec.industry}.stockroom.test`)
  }

  // ---------------------------------------------------------------------------
  // A. FRESH RESET (if requested)
  // Deletes and cascades ONLY businesses and users belonging to our demo spec.
  // Never touches other users (such as demo@stockroom.test, admin@aflix.com, etc.)
  // ---------------------------------------------------------------------------
  if (isFresh) {
    console.log('[RESET] Cleaning up previous demo data for all 11 industries...')

    // 1. Find existing demo users and businesses
    const { data: existingDemoUsers } = await supabase
      .from('users')
      .select('id, email, business_id')
      .in('email', allTargetEmails)

    const userIds = (existingDemoUsers || []).map((u) => u.id)
    const bizIds = [...new Set((existingDemoUsers || []).map((u) => u.business_id).filter(Boolean))]

    if (bizIds.length > 0) {
      console.log(`[RESET] Removing ${bizIds.length} existing demo businesses and children...`)
      // Delete in reverse dependency order to respect RESTRICT constraints safely
      await supabase.from('refunds').delete().in('business_id', bizIds)
      await supabase.from('returns').delete().in('business_id', bizIds)
      await supabase.from('payments').delete().in('business_id', bizIds)
      await supabase.from('receivings').delete().in('business_id', bizIds)
      await supabase.from('purchase_orders').delete().in('business_id', bizIds)
      await supabase.from('sales_orders').delete().in('business_id', bizIds)
      await supabase.from('stock_transactions').delete().in('business_id', bizIds)
      await supabase.from('notifications').delete().in('business_id', bizIds)
      await supabase.from('loyalty_transactions').delete().in('business_id', bizIds)
      await supabase.from('store_credit_transactions').delete().in('business_id', bizIds)
      await supabase.from('cashier_shifts').delete().in('business_id', bizIds)
      await supabase.from('gift_cards').delete().in('business_id', bizIds)
      await supabase.from('coupons').delete().in('business_id', bizIds)
      await supabase.from('promotions').delete().in('business_id', bizIds)
      await supabase.from('product_variants').delete().in('business_id', bizIds)
      await supabase.from('products').delete().in('business_id', bizIds)
      await supabase.from('colors').delete().in('business_id', bizIds)
      await supabase.from('customers').delete().in('business_id', bizIds)
      await supabase.from('suppliers').delete().in('business_id', bizIds)
      await supabase.from('members').delete().in('business_id', bizIds)
      await supabase.from('roles').delete().in('business_id', bizIds)
      await supabase.from('businesses').delete().in('id', bizIds)
    }

    if (userIds.length > 0) {
      console.log(`[RESET] Removing ${userIds.length} existing demo users...`)
      await supabase.from('users').delete().in('id', userIds)
    }

    console.log('[RESET] Cleanup complete.\n')
  }

  // ---------------------------------------------------------------------------
  // B. SEED EACH INDUSTRY BUSINESS
  // ---------------------------------------------------------------------------
  const summaryReport = []

  for (const spec of BUSINESS_SPECS) {
    const { industry, name, businessType, city, state, gstin, phone, address, invoicePrefix, defaultGstRate } = spec
    console.log(`\n======================================================`)
    console.log(`Processing Industry: ${industry.toUpperCase()} (${name})`)
    console.log(`======================================================`)

    const ownerEmail = `owner@${industry}.stockroom.test`
    const managerEmail = `manager@${industry}.stockroom.test`
    const staffEmail = `staff@${industry}.stockroom.test`

    // Derive enabled modules dynamically from industryConfig & businessTypeConfig
    const indModules = industryConfig[industry]?.modules || []
    const typeModules = businessTypeConfig[businessType]?.modules || []
    const enabled_modules = [...new Set([...indModules, ...typeModules])]
    const hasPos = enabled_modules.includes('pos')
    const staffRoleId = hasPos ? 'ROLE-SALESPERSON' : 'ROLE-STAFF'

    // 1. Create or Find Owner User
    let ownerId
    const { data: existingOwner } = await supabase
      .from('users')
      .select('id')
      .eq('email', ownerEmail)
      .maybeSingle()

    if (existingOwner) {
      ownerId = existingOwner.id
      await supabase
        .from('users')
        .update({
          name: `${name} Owner`,
          password: passwordHash,
          role: 'owner',
          onboarding: { status: 'completed', currentStep: 7, setupVersion: 1 },
        })
        .eq('id', ownerId)
    } else {
      ownerId = crypto.randomUUID()
      const { error: userErr } = await supabase.from('users').insert({
        id: ownerId,
        name: `${name} Owner`,
        email: ownerEmail,
        password: passwordHash,
        role: 'owner',
        onboarding: { status: 'completed', currentStep: 7, setupVersion: 1 },
      })
      if (userErr) throw new Error(`Failed to create owner user: ${userErr.message}`)
    }

    // 2. Create or Find Business
    let businessId
    const { data: existingBiz } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', ownerId)
      .maybeSingle()

    const businessSettings = {
      lowStockLimit: 10,
      allowNegativeStock: false,
      defaultPaymentMethod: 'Cash',
      taxEnabled: true,
      invoicePrefix,
      defaultGstRate,
      upiId: `${invoicePrefix.toLowerCase()}@okhdfcbank`,
      allowPriceOverride: false,
      loyaltySpendPerPoint: 100,
      loyaltyPointValue: 1,
      disabledModules: [],
      paymentOffers: [],
    }

    if (existingBiz) {
      businessId = existingBiz.id
      await supabase
        .from('businesses')
        .update({
          name,
          industry,
          business_type: businessType,
          phone,
          email: ownerEmail,
          address,
          city,
          state,
          country: 'India',
          currency: 'INR',
          gstin,
          enabled_modules,
          settings: businessSettings,
        })
        .eq('id', businessId)
    } else {
      businessId = crypto.randomUUID()
      const { error: bizErr } = await supabase.from('businesses').insert({
        id: businessId,
        name,
        industry,
        business_type: businessType,
        phone,
        email: ownerEmail,
        address,
        city,
        state,
        country: 'India',
        currency: 'INR',
        gstin,
        enabled_modules,
        owner_id: ownerId,
        settings: businessSettings,
      })
      if (bizErr) throw new Error(`Failed to create business: ${bizErr.message}`)
    }

    // Link owner to business
    await supabase.from('users').update({ business_id: businessId }).eq('id', ownerId)

    // 3. Create or Find Manager User
    let managerId
    const { data: existingMgr } = await supabase
      .from('users')
      .select('id')
      .eq('email', managerEmail)
      .maybeSingle()

    if (existingMgr) {
      managerId = existingMgr.id
      await supabase
        .from('users')
        .update({
          name: `${name} Manager`,
          password: passwordHash,
          role: 'team',
          business_id: businessId,
        })
        .eq('id', managerId)
    } else {
      managerId = crypto.randomUUID()
      const { error: mgrErr } = await supabase.from('users').insert({
        id: managerId,
        name: `${name} Manager`,
        email: managerEmail,
        password: passwordHash,
        role: 'team',
        business_id: businessId,
      })
      if (mgrErr) throw new Error(`Failed to create manager user: ${mgrErr.message}`)
    }

    // 4. Create or Find Staff User
    let staffId
    const { data: existingStaff } = await supabase
      .from('users')
      .select('id')
      .eq('email', staffEmail)
      .maybeSingle()

    if (existingStaff) {
      staffId = existingStaff.id
      await supabase
        .from('users')
        .update({
          name: `${name} Staff`,
          password: passwordHash,
          role: 'team',
          business_id: businessId,
        })
        .eq('id', staffId)
    } else {
      staffId = crypto.randomUUID()
      const { error: stfErr } = await supabase.from('users').insert({
        id: staffId,
        name: `${name} Staff`,
        email: staffEmail,
        password: passwordHash,
        role: 'team',
        business_id: businessId,
      })
      if (stfErr) throw new Error(`Failed to create staff user: ${stfErr.message}`)
    }

    // 5. Create Default Roles for this Business
    const rolesPayload = DEFAULT_ROLES.map((r) => ({
      business_id: businessId,
      role_id: r.roleId,
      name: r.name,
      description: r.description || '',
      permissions: r.permissions,
    }))
    await supabase.from('roles').upsert(rolesPayload, { onConflict: 'business_id,role_id' })

    // 6. Create Members for Owner, Manager, and Staff
    const membersPayload = [
      {
        business_id: businessId,
        account_id: ownerId,
        name: `${name} Owner`,
        email: ownerEmail,
        role_id: 'ROLE-ADMIN',
        status: 'active',
      },
      {
        business_id: businessId,
        account_id: managerId,
        name: `${name} Manager`,
        email: managerEmail,
        role_id: 'ROLE-MANAGER',
        status: 'active',
      },
      {
        business_id: businessId,
        account_id: staffId,
        name: `${name} Staff`,
        email: staffEmail,
        role_id: staffRoleId,
        status: 'active',
      },
    ]
    await supabase.from('members').upsert(membersPayload, { onConflict: 'business_id,email' })

    // 7. Create Suppliers (3 per business)
    const rawSuppliers = [
      {
        business_id: businessId,
        supplier_name: `${city} Apex Distributing Co`,
        normalized_name: `${city.toLowerCase()} apex distributing co`,
        contact_person: 'Rajesh Varma',
        phone: '+91 98200 44101',
        email: `rajesh@apexdist-${industry}.test`,
        address: '10 Commercial Enclave',
        city,
        state,
        payment_terms: 'Net 30',
        status: 'active',
      },
      {
        business_id: businessId,
        supplier_name: `National Supply Hub Ltd`,
        normalized_name: 'national supply hub ltd',
        contact_person: 'Amitabh Sengupta',
        phone: '+91 98200 44102',
        email: `orders@nationalsupply-${industry}.test`,
        address: '50 Logistics Park',
        city: 'New Delhi',
        state: 'Delhi',
        payment_terms: 'Net 15',
        status: 'active',
      },
      {
        business_id: businessId,
        supplier_name: `Sterling Regional Importers`,
        normalized_name: 'sterling regional importers',
        contact_person: 'Deepak Chopra',
        phone: '+91 98200 44103',
        email: `deepak@sterling-${industry}.test`,
        address: '88 Harbour Gateway',
        city: 'Mumbai',
        state: 'Maharashtra',
        payment_terms: 'Due on receipt',
        status: 'active',
      },
    ]

    const { data: seededSuppliers } = await supabase
      .from('suppliers')
      .upsert(rawSuppliers, { onConflict: 'business_id,normalized_name' })
      .select('id, supplier_name')

    const supplierIds = (seededSuppliers || []).map((s) => s.id)

    // 8. Create Customers (6-8 per business)
    const rawCustomers = [
      {
        business_id: businessId,
        name: 'Rohan Mehra',
        phone: '+91 98111 22301',
        email: `rohan@client-${industry}.test`,
        address: 'Sector 15, Urban Plaza',
        city,
        state,
        customer_type: 'retail',
        credit_limit: 0,
        payment_terms: 'Due on receipt',
        status: 'active',
        total_purchases: 18500,
        outstanding_balance: 0,
        loyalty_points: 185,
      },
      {
        business_id: businessId,
        name: 'Sharma Retail Enterprise',
        phone: '+91 98111 22302',
        email: `accounts@sharmaenterprise-${industry}.test`,
        address: '42 Main Bazaar',
        city,
        state,
        customer_type: 'wholesale',
        credit_limit: 150000,
        payment_terms: 'Net 30',
        status: 'active',
        total_purchases: 124000,
        outstanding_balance: 28500,
        loyalty_points: 450,
      },
      {
        business_id: businessId,
        name: 'Pooja Singhania',
        phone: '+91 98111 22303',
        email: `pooja@singhania-${industry}.test`,
        address: 'B-44 Defence Colony',
        city,
        state,
        customer_type: 'retail',
        credit_limit: 0,
        payment_terms: 'Due on receipt',
        status: 'active',
        total_purchases: 8900,
        outstanding_balance: 0,
        loyalty_points: 89,
      },
      {
        business_id: businessId,
        name: 'Kalyani Trading Partners',
        phone: '+91 98111 22304',
        email: `kalyani@trading-${industry}.test`,
        address: '109 Commercial Hub',
        city,
        state,
        customer_type: 'dealer',
        credit_limit: 200000,
        payment_terms: 'Net 45',
        status: 'active',
        total_purchases: 210000,
        outstanding_balance: 42000,
        loyalty_points: 820,
      },
      {
        business_id: businessId,
        name: 'Vikramaditya Roy',
        phone: '+91 98111 22305',
        email: `vikram@roy-${industry}.test`,
        address: 'Flat 402, Royal Palms',
        city,
        state,
        customer_type: 'retail',
        credit_limit: 0,
        payment_terms: 'Due on receipt',
        status: 'active',
        total_purchases: 5400,
        outstanding_balance: 0,
        loyalty_points: 54,
      },
      {
        business_id: businessId,
        name: 'Avenue Mart Wholesale',
        phone: '+91 98111 22306',
        email: `buyer@avenuemart-${industry}.test`,
        address: '88 Ring Road Junction',
        city,
        state,
        customer_type: 'wholesale',
        credit_limit: 300000,
        payment_terms: 'Net 60',
        status: 'active',
        total_purchases: 450000,
        outstanding_balance: 65000,
        loyalty_points: 1200,
      },
      {
        business_id: businessId,
        name: 'Sunita Narang',
        phone: '+91 98111 22307',
        email: `sunita@narang-${industry}.test`,
        address: '14 Model Town',
        city,
        state,
        customer_type: 'retail',
        credit_limit: 0,
        payment_terms: 'Due on receipt',
        status: 'active',
        total_purchases: 14200,
        outstanding_balance: 0,
        loyalty_points: 142,
      },
    ]

    // Upsert customers (lookup existing to preserve IDs on re-runs)
    const customerIds = []
    for (const cust of rawCustomers) {
      const { data: existingCust } = await supabase
        .from('customers')
        .select('id')
        .eq('business_id', businessId)
        .eq('email', cust.email)
        .maybeSingle()

      if (existingCust) {
        await supabase.from('customers').update(cust).eq('id', existingCust.id)
        customerIds.push(existingCust.id)
      } else {
        const newId = crypto.randomUUID()
        await supabase.from('customers').insert({ ...cust, id: newId })
        customerIds.push(newId)
      }
    }

    // 9. Create Products (12 to 20 products per industry)
    const rawProducts = generateProductsForIndustry(industry, businessId, supplierIds)
    const seededProducts = []

    for (const p of rawProducts) {
      const payload = {
        ...p,
        business_id: businessId,
      }
      const { data: upsertedProd, error: prodErr } = await supabase
        .from('products')
        .upsert(payload, { onConflict: 'business_id,sku' })
        .select('id, name, sku, purchase_price, selling_price, current_stock, unit')
        .single()

      if (prodErr) {
        console.warn(`  [WARN] Product upsert failed for SKU ${p.sku}: ${prodErr.message}`)
      } else {
        seededProducts.push(upsertedProd)
      }
    }

    // 10. Industry-Specific Extra Entities (Clothing variants, colors, promo, coupon, gift card)
    if (industry === 'clothing') {
      const colorsData = [
        { business_id: businessId, name: 'Navy Blue', normalized_name: 'navy blue', hex_code: '#1e3a8a' },
        { business_id: businessId, name: 'Jet Black', normalized_name: 'jet black', hex_code: '#18181b' },
        { business_id: businessId, name: 'Pearl White', normalized_name: 'pearl white', hex_code: '#f8fafc' },
        { business_id: businessId, name: 'Olive Green', normalized_name: 'olive green', hex_code: '#3f6212' },
        { business_id: businessId, name: 'Rust Orange', normalized_name: 'rust orange', hex_code: '#c2410c' },
        { business_id: businessId, name: 'Beige', normalized_name: 'beige', hex_code: '#d6d3d1' },
      ]
      await supabase.from('colors').upsert(colorsData, { onConflict: 'business_id,normalized_name' })

      // Generate product variants for first 4 clothing products
      const variantRows = []
      const sampleSizes = ['S', 'M', 'L', 'XL']
      for (const prod of seededProducts.slice(0, 4)) {
        for (const size of sampleSizes) {
          variantRows.push({
            product_id: prod.id,
            business_id: businessId,
            size,
            color: 'Navy Blue',
            sku: `${prod.sku}-${size}-BLU`,
            selling_price: prod.selling_price,
            purchase_price: prod.purchase_price,
            current_stock: Math.floor(prod.current_stock / 4) || 5,
            minimum_stock: 4,
            reorder_point: 5,
            target_stock: 20,
            active: true,
          })
        }
      }
      await supabase.from('product_variants').upsert(variantRows, { onConflict: 'business_id,sku' })

      // Promotion
      await supabase.from('promotions').upsert(
        {
          business_id: businessId,
          name: 'Summer Festive 20% Off',
          type: 'percentage',
          discount_value: 20,
          minimum_quantity: 1,
          start_date: daysAgo(30),
          end_date: daysAhead(60),
          active: true,
          usage_count: 42,
          discount_granted: 12600,
        },
        { onConflict: 'business_id,name' },
      )

      // Coupon
      await supabase.from('coupons').upsert(
        {
          business_id: businessId,
          code: 'JAIPUR100',
          discount_type: 'fixed',
          discount_value: 100,
          minimum_order_value: 999,
          maximum_discount: 100,
          valid_from: daysAgo(30),
          valid_until: daysAhead(90),
          total_usage_limit: 500,
          active: true,
          usage_count: 28,
        },
        { onConflict: 'business_id,code' },
      )

      // Gift card
      await supabase.from('gift_cards').upsert(
        {
          business_id: businessId,
          code: 'GC-THRD-5000',
          initial_value: 5000,
          current_balance: 3500,
          issue_date: daysAgo(20),
          expiry_date: daysAhead(365),
          active: true,
          customer_id: customerIds[0] || null,
          customer_name: rawCustomers[0].name,
        },
        { onConflict: 'business_id,code' },
      )
    }

    // 11. Create Purchase Orders (3 POs: Ordered, Partially Received, Received)
    const prodA = seededProducts[0] || {}
    const prodB = seededProducts[1] || prodA
    const prodC = seededProducts[2] || prodA

    const poDefs = [
      {
        orderNumber: `PO-${invoicePrefix}-101`,
        status: 'Ordered',
        paymentStatus: 'Unpaid',
        supplierId: supplierIds[0],
        supplierName: rawSuppliers[0].supplier_name,
        items: [
          {
            productId: prodA.id,
            productName: prodA.name,
            quantity: 40,
            purchasePrice: prodA.purchase_price,
            discount: 0,
            tax: Math.round(40 * prodA.purchase_price * (defaultGstRate / 100)),
            total: Math.round(40 * prodA.purchase_price * (1 + defaultGstRate / 100)),
          },
        ],
        expectedDeliveryDate: daysAhead(4).slice(0, 10),
        notes: 'In-transit consignment from central vendor',
        createdAt: daysAgo(5),
      },
      {
        orderNumber: `PO-${invoicePrefix}-102`,
        status: 'Partially Received',
        paymentStatus: 'Partially Paid',
        supplierId: supplierIds[1] || supplierIds[0],
        supplierName: (rawSuppliers[1] || rawSuppliers[0]).supplier_name,
        items: [
          {
            productId: prodB.id,
            productName: prodB.name,
            quantity: 50,
            purchasePrice: prodB.purchase_price,
            discount: 0,
            tax: Math.round(50 * prodB.purchase_price * (defaultGstRate / 100)),
            total: Math.round(50 * prodB.purchase_price * (1 + defaultGstRate / 100)),
          },
        ],
        expectedDeliveryDate: daysAgo(2).slice(0, 10),
        notes: 'First batch accepted at loading dock',
        createdAt: daysAgo(12),
      },
      {
        orderNumber: `PO-${invoicePrefix}-103`,
        status: 'Received',
        paymentStatus: 'Paid',
        supplierId: supplierIds[2] || supplierIds[0],
        supplierName: (rawSuppliers[2] || rawSuppliers[0]).supplier_name,
        items: [
          {
            productId: prodC.id,
            productName: prodC.name,
            quantity: 60,
            purchasePrice: prodC.purchase_price,
            discount: 0,
            tax: Math.round(60 * prodC.purchase_price * (defaultGstRate / 100)),
            total: Math.round(60 * prodC.purchase_price * (1 + defaultGstRate / 100)),
          },
        ],
        expectedDeliveryDate: daysAgo(18).slice(0, 10),
        notes: 'Fully inspected and accepted into primary stock',
        createdAt: daysAgo(25),
      },
    ]

    const seededPOs = []
    for (const po of poDefs) {
      const subtotal = po.items.reduce((s, i) => s + i.quantity * i.purchasePrice, 0)
      const tax = po.items.reduce((s, i) => s + i.tax, 0)
      const totalAmount = subtotal + tax

      const poPayload = {
        business_id: businessId,
        order_number: po.orderNumber,
        supplier_id: po.supplierId,
        supplier_name: po.supplierName,
        items: po.items,
        subtotal,
        discount: 0,
        tax,
        shipping_charges: 0,
        total_amount: totalAmount,
        status: po.status,
        payment_status: po.paymentStatus,
        expected_delivery_date: po.expectedDeliveryDate,
        notes: po.notes,
        created_by: 'Demo Manager',
        created_at: po.createdAt,
      }

      const { data: existingPO } = await supabase
        .from('purchase_orders')
        .select('id')
        .eq('business_id', businessId)
        .eq('order_number', po.orderNumber)
        .maybeSingle()

      let poId
      if (existingPO) {
        poId = existingPO.id
        await supabase.from('purchase_orders').update(poPayload).eq('id', poId)
      } else {
        poId = crypto.randomUUID()
        await supabase.from('purchase_orders').insert({ ...poPayload, id: poId })
      }

      seededPOs.push({ ...poPayload, id: poId })
    }

    // 12. Create Matching Receivings for PO 2 (partial: 25 units) and PO 3 (full: 60 units)
    const receivingDefs = [
      {
        purchaseOrderId: seededPOs[1].id,
        supplierId: seededPOs[1].supplier_id,
        items: [
          {
            productId: prodB.id,
            productName: prodB.name,
            orderedQuantity: 50,
            receivedQuantity: 25,
            acceptedQuantity: 25,
            damagedQuantity: 0,
            rejectedQuantity: 0,
            batchNumber: `BAT-${invoicePrefix}-01`,
            expiryDate: daysAhead(365).slice(0, 10),
          },
        ],
        notes: 'Partial intake - 25 units verified on Bay 1',
        receivedBy: 'Demo Staff',
        createdAt: daysAgo(2),
      },
      {
        purchaseOrderId: seededPOs[2].id,
        supplierId: seededPOs[2].supplier_id,
        items: [
          {
            productId: prodC.id,
            productName: prodC.name,
            orderedQuantity: 60,
            receivedQuantity: 60,
            acceptedQuantity: 60,
            damagedQuantity: 0,
            rejectedQuantity: 0,
            batchNumber: `BAT-${invoicePrefix}-02`,
            expiryDate: daysAhead(450).slice(0, 10),
          },
        ],
        notes: 'Full order received and QA cleared',
        receivedBy: 'Demo Staff',
        createdAt: daysAgo(17),
      },
    ]

    for (const rec of receivingDefs) {
      const { data: existingRec } = await supabase
        .from('receivings')
        .select('id')
        .eq('business_id', businessId)
        .eq('purchase_order_id', rec.purchaseOrderId)
        .maybeSingle()

      if (!existingRec) {
        await supabase.from('receivings').insert({
          id: crypto.randomUUID(),
          business_id: businessId,
          purchase_order_id: rec.purchaseOrderId,
          supplier_id: rec.supplierId,
          items: rec.items,
          received_by: rec.receivedBy,
          notes: rec.notes,
          created_at: rec.createdAt,
        })
      }
    }

    // 13. Create Sales Orders (10 orders spread over last 45 days)
    const seededSalesOrders = []
    const soIntervals = [42, 38, 34, 29, 25, 20, 15, 10, 5, 2]

    for (let i = 0; i < soIntervals.length; i++) {
      const days = soIntervals[i]
      const orderNum = `SO-${invoicePrefix}-${1001 + i}`
      const invoiceNum = `INV-${invoicePrefix}-${2001 + i}`
      const custId = customerIds[i % customerIds.length]
      const custData = rawCustomers[i % rawCustomers.length]

      // Select 1 or 2 products for each order
      const itemProd1 = seededProducts[i % seededProducts.length] || prodA
      const itemProd2 = seededProducts[(i + 3) % seededProducts.length] || prodB
      const qty1 = (i % 3) + 2
      const qty2 = (i % 2) + 1

      const lineTax1 = Math.round(qty1 * itemProd1.selling_price * (defaultGstRate / 100))
      const lineTax2 = Math.round(qty2 * itemProd2.selling_price * (defaultGstRate / 100))
      const total1 = qty1 * itemProd1.selling_price + lineTax1
      const total2 = qty2 * itemProd2.selling_price + lineTax2

      const orderItems = [
        {
          productId: itemProd1.id,
          productName: itemProd1.name,
          quantity: qty1,
          sellingPrice: itemProd1.selling_price,
          discount: 0,
          tax: lineTax1,
          total: total1,
        },
      ]

      if (i % 2 === 0) {
        orderItems.push({
          productId: itemProd2.id,
          productName: itemProd2.name,
          quantity: qty2,
          sellingPrice: itemProd2.selling_price,
          discount: 0,
          tax: lineTax2,
          total: total2,
        })
      }

      const subtotal = orderItems.reduce((s, it) => s + it.quantity * it.sellingPrice, 0)
      const tax = orderItems.reduce((s, it) => s + it.tax, 0)
      const totalAmount = subtotal + tax

      // Mix status and payment status
      let orderStatus = 'Completed'
      let payStatus = 'Paid'
      let amountPaid = totalAmount
      let balanceDue = 0

      if (i === 6) {
        // Partially paid
        payStatus = 'Partially Paid'
        amountPaid = Math.round(totalAmount * 0.5)
        balanceDue = totalAmount - amountPaid
      } else if (i === 7) {
        // Wholesale credit unpaid
        payStatus = 'Unpaid'
        amountPaid = 0
        balanceDue = totalAmount
      } else if (i === 9) {
        // Recent pending order
        orderStatus = 'Pending'
        payStatus = 'Unpaid'
        amountPaid = 0
        balanceDue = totalAmount
      }

      const soPayload = {
        business_id: businessId,
        order_number: orderNum,
        invoice_number: invoiceNum,
        channel: i % 3 === 0 ? 'POS' : 'Order',
        billing_type: custData.customer_type === 'wholesale' ? 'wholesale' : 'retail',
        customer_id: custId,
        customer_name: custData.name,
        customer_snapshot: { name: custData.name, phone: custData.phone, city: custData.city },
        items: orderItems,
        subtotal,
        discount: 0,
        tax,
        total_amount: totalAmount,
        status: orderStatus,
        payment_status: payStatus,
        amount_paid: amountPaid,
        balance_due: balanceDue,
        notes: `Standard order fulfilment via ${custData.customer_type} channel`,
        created_by: 'Demo Staff',
        created_at: daysAgo(days),
      }

      const { data: existingSO } = await supabase
        .from('sales_orders')
        .select('id')
        .eq('business_id', businessId)
        .eq('order_number', orderNum)
        .maybeSingle()

      let soId
      if (existingSO) {
        soId = existingSO.id
        await supabase.from('sales_orders').update(soPayload).eq('id', soId)
      } else {
        soId = crypto.randomUUID()
        await supabase.from('sales_orders').insert({ ...soPayload, id: soId })
      }

      const orderRecord = { ...soPayload, id: soId }
      seededSalesOrders.push(orderRecord)

      // 14. Add Matching Payments for Paid / Partially Paid Orders
      if (amountPaid > 0) {
        const { data: existingPay } = await supabase
          .from('payments')
          .select('id')
          .eq('business_id', businessId)
          .eq('reference_id', soId)
          .maybeSingle()

        if (!existingPay) {
          const methods = ['UPI', 'Cash', 'Card', 'Bank Transfer']
          const chosenMethod = methods[i % methods.length]
          await supabase.from('payments').insert({
            id: crypto.randomUUID(),
            business_id: businessId,
            type: 'sale',
            reference_id: soId,
            reference_model: 'SalesOrder',
            amount: amountPaid,
            payment_method: chosenMethod,
            payment_date: daysAgo(days).slice(0, 10),
            notes: `Full settlement via ${chosenMethod}`,
            recorded_by: 'Demo Staff',
            transaction_reference: chosenMethod === 'UPI' ? `UPI-${invoicePrefix}-${98231 + i}` : '',
            created_at: daysAgo(days),
          })
        }
      }
    }

    // 15. Create exactly 1 Sales Return and Refund on Order #2 (e.g. 29 days ago)
    const returnTargetOrder = seededSalesOrders[3] || seededSalesOrders[0]
    const returnItem = returnTargetOrder.items[0]
    const returnQty = 1
    const returnValue = returnItem.sellingPrice

    const { data: existingReturn } = await supabase
      .from('returns')
      .select('id')
      .eq('business_id', businessId)
      .eq('order_id', returnTargetOrder.id)
      .maybeSingle()

    let returnId
    if (existingReturn) {
      returnId = existingReturn.id
    } else {
      returnId = crypto.randomUUID()
      await supabase.from('returns').insert({
        id: returnId,
        business_id: businessId,
        type: 'sale',
        order_id: returnTargetOrder.id,
        order_model: 'SalesOrder',
        product_id: returnItem.productId,
        product_name: returnItem.productName,
        order_number: returnTargetOrder.order_number,
        customer_id: returnTargetOrder.customer_id,
        customer_name: returnTargetOrder.customer_name,
        quantity: returnQty,
        reason: 'Customer changed mind',
        condition: 'Sellable',
        sold_quantity: returnItem.quantity,
        unit_selling_price: returnItem.sellingPrice,
        return_value: returnValue,
        outstanding_adjustment: 0,
        refund_required: returnValue,
        refund_amount: returnValue,
        remaining_refund: 0,
        refund_method: 'Original Payment Method',
        refund_status: 'Refunded',
        inventory_action: 'sellable',
        status: 'Completed',
        processed_by: 'Demo Manager',
        created_at: daysAgo(10),
      })

      // Matching Refund record
      await supabase.from('refunds').insert({
        id: crypto.randomUUID(),
        business_id: businessId,
        return_id: returnId,
        order_id: returnTargetOrder.id,
        customer_id: returnTargetOrder.customer_id,
        customer_name: returnTargetOrder.customer_name,
        amount: returnValue,
        method: 'Original Payment Method',
        status: 'Refunded',
        notes: 'Full customer refund approved',
        processed_by: 'Demo Manager',
        created_at: daysAgo(10),
      })

      // Update Sales Order return fields
      await supabase
        .from('sales_orders')
        .update({
          returned_value: returnValue,
          refunded_amount: returnValue,
        })
        .eq('id', returnTargetOrder.id)
    }

    // 16. Create Stock Transactions (Audit Ledger)
    // - Inward from PO receivings
    // - Outward from Completed sales orders
    // - Return inward from sales return
    // - 1-2 manual adjustments
    const stockTransactions = [
      {
        business_id: businessId,
        product_id: prodB.id,
        type: 'stock_in',
        quantity: 25,
        previous_stock: Math.max(0, prodB.current_stock - 25),
        new_stock: prodB.current_stock,
        stock_bucket: 'sellable',
        reason: `PO inward receipt: ${seededPOs[1].order_number}`,
        reference_id: String(seededPOs[1].id),
        created_by: 'Demo Staff',
        created_at: daysAgo(2),
      },
      {
        business_id: businessId,
        product_id: prodC.id,
        type: 'stock_in',
        quantity: 60,
        previous_stock: Math.max(0, prodC.current_stock - 60),
        new_stock: prodC.current_stock,
        stock_bucket: 'sellable',
        reason: `Full order received: ${seededPOs[2].order_number}`,
        reference_id: String(seededPOs[2].id),
        created_by: 'Demo Staff',
        created_at: daysAgo(17),
      },
      {
        business_id: businessId,
        product_id: prodA.id,
        type: 'stock_out',
        quantity: 5,
        previous_stock: prodA.current_stock + 5,
        new_stock: prodA.current_stock,
        stock_bucket: 'sellable',
        reason: `Dispatch fulfillment: ${seededSalesOrders[0].order_number}`,
        reference_id: String(seededSalesOrders[0].id),
        created_by: 'Demo Staff',
        created_at: daysAgo(20),
      },
      {
        business_id: businessId,
        product_id: returnItem.productId,
        type: 'sales_return',
        quantity: 1,
        previous_stock: Math.max(0, returnItem.quantity - 1),
        new_stock: returnItem.quantity,
        stock_bucket: 'sellable',
        reason: `Customer return restocked: ${returnTargetOrder.order_number}`,
        reference_id: String(returnId),
        created_by: 'Demo Manager',
        created_at: daysAgo(10),
      },
      {
        business_id: businessId,
        product_id: prodA.id,
        type: 'adjustment',
        quantity: 2,
        previous_stock: prodA.current_stock - 2,
        new_stock: prodA.current_stock,
        stock_bucket: 'sellable',
        reason: 'Quarterly physical inventory count reconciliation',
        reference_id: 'AUDIT-CYCLE-Q1',
        created_by: 'Demo Manager',
        created_at: daysAgo(8),
      },
    ]

    // Insert stock transactions if not already logged
    for (const st of stockTransactions) {
      await supabase.from('stock_transactions').insert({
        id: crypto.randomUUID(),
        ...st,
      })
    }

    // 17. Create Notifications (3-4 per business)
    const notificationPayloads = [
      {
        business_id: businessId,
        recipient_id: ownerId,
        type: 'low_stock',
        category: 'inventory',
        severity: 'warning',
        title: 'Low Stock Alert',
        message: `${seededProducts.find((p) => p.current_stock > 0 && p.current_stock <= p.minimum_stock)?.name || 'An item'} is running below safe minimum stock levels.`,
        navigation_target: '/products',
        dedupe_key: `low_stock_${businessId}`,
      },
      {
        business_id: businessId,
        recipient_id: ownerId,
        type: 'out_of_stock',
        category: 'inventory',
        severity: 'critical',
        title: 'Out of Stock Critical Notice',
        message: `${seededProducts.find((p) => p.current_stock === 0)?.name || 'An item'} has 0 stock remaining. Immediate reorder required.`,
        navigation_target: '/products',
        dedupe_key: `out_of_stock_${businessId}`,
      },
      {
        business_id: businessId,
        recipient_id: ownerId,
        type: 'order_completed',
        category: 'sales',
        severity: 'success',
        title: 'High-Volume Order Fulfilled',
        message: `Sales Order ${seededSalesOrders[0].order_number} (${seededSalesOrders[0].customer_name}) was delivered and fully paid.`,
        navigation_target: '/orders',
        dedupe_key: `order_complete_${seededSalesOrders[0].order_number}`,
      },
    ]

    if (industry === 'pharmacy') {
      notificationPayloads.push({
        business_id: businessId,
        recipient_id: ownerId,
        type: 'expiry_alert',
        category: 'inventory',
        severity: 'warning',
        title: 'Pharmaceutical Expiry Warning',
        message: '2 medicine batches are expiring within the next 30 days. Prioritize dispensing.',
        navigation_target: '/inventory',
        dedupe_key: `expiry_warn_${businessId}`,
      })
    }

    for (const notif of notificationPayloads) {
      await supabase.from('notifications').upsert(notif, { onConflict: 'business_id,recipient_id,dedupe_key' })
    }

    summaryReport.push({
      industry,
      name,
      businessType,
      city,
      ownerEmail,
      managerEmail,
      staffEmail,
      staffRoleId,
      productCount: seededProducts.length,
      supplierCount: supplierIds.length,
      customerCount: customerIds.length,
      poCount: seededPOs.length,
      soCount: seededSalesOrders.length,
    })

    console.log(`✓ ${name} seeded successfully! (${seededProducts.length} products, ${supplierIds.length} suppliers, ${customerIds.length} customers, 3 POs, 10 SOs)`)
  }

  // ---------------------------------------------------------------------------
  // C. PRINT CREDENTIALS TABLE & SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n\n==================================================================================================================================')
  console.log('                                  STOCKROOM / IMB - DEMO ACCOUNTS CREDENTIALS MATRIX')
  console.log('==================================================================================================================================')
  console.log('| Industry      | Business Name            | Business Type   | Role       | Email                                 | Password   | Login Type |')
  console.log('|---------------|--------------------------|-----------------|------------|---------------------------------------|------------|------------|')

  for (const item of summaryReport) {
    const pad = (str, len) => String(str).padEnd(len, ' ')
    console.log(`| ${pad(item.industry, 13)} | ${pad(item.name, 24)} | ${pad(item.businessType, 15)} | Owner      | ${pad(item.ownerEmail, 37)} | Demo@12345 | Shop owner |`)
    console.log(`| ${pad(item.industry, 13)} | ${pad(item.name, 24)} | ${pad(item.businessType, 15)} | Manager    | ${pad(item.managerEmail, 37)} | Demo@12345 | Team       |`)
    console.log(`| ${pad(item.industry, 13)} | ${pad(item.name, 24)} | ${pad(item.businessType, 15)} | Staff      | ${pad(item.staffEmail, 37)} | Demo@12345 | Team       |`)
  }
  console.log('==================================================================================================================================\n')
  console.log('NOTE: When logging in on the web login screen:')
  console.log('  - For "Owner" accounts, select account type: "Shop owner"')
  console.log('  - For "Manager" & "Staff" accounts, select account type: "Team member"\n')
}

runSeed()
  .then(() => {
    console.log('All 11 industry demo businesses and 33 accounts seeded successfully!\n')
    process.exit(0)
  })
  .catch((err) => {
    console.error('\n[FATAL SEED ERROR]', err)
    process.exit(1)
  })
