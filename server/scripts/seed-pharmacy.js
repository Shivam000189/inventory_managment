import { User, Business, Role, DEFAULT_ROLES, Member, Product, Supplier, Customer, PurchaseOrder, Receiving, SalesOrder, Payment, StockTransaction, Return, Notification } from '../models/index.js'
/**
 * Realistic seed data script specifically for Pharmacy Wholesale businesses (e.g. shivam12@gmail.com / aflix).
 * Fills every module with realistic pharmaceutical products, suppliers, customers, team members,
 * orders, receipts, payments, returns, and notifications.
 */
import { connectDatabase, disconnectDatabase } from '../config/db.js'
import { productService } from '../services/productService.js'
import { supplierService } from '../services/supplierService.js'
import { customerService } from '../services/customerService.js'
import { purchaseOrderService } from '../services/purchaseOrderService.js'
import { receivingService } from '../services/receivingService.js'
import { salesOrderService } from '../services/salesOrderService.js'
import { paymentService } from '../services/paymentService.js'
import { recordOperation } from '../services/inventoryService.js'
import { returnService } from '../services/returnService.js'
import { userService } from '../services/userService.js'
import { updateBusiness } from '../services/businessService.js'
import { notificationEvents } from '../services/notificationEvents.js'

const arg = process.argv.slice(2).find((a) => a.includes('@'))
const TARGET_EMAIL = (arg || 'shivam12@gmail.com').toLowerCase()

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a
const future = (d) => new Date(Date.now() + d * 86400000).toISOString().slice(0, 10)
const past = (d) => new Date(Date.now() - d * 86400000).toISOString().slice(0, 10)

let done = 0
let skipped = 0
async function step(label, fn) {
  try {
    const result = await fn()
    done += 1
    return result
  } catch (error) {
    skipped += 1
    console.warn(`  skip  ${label}: ${error.message}`)
    return null
  }
}

// Allowed fields for Pharmacy Wholesale:
// ['name', 'sku', 'category', 'purchasePrice', 'sellingPrice', 'currentStock', 'minimumStock', 'supplier', 'description', 'hsnCode', 'gstRate', 'genericName', 'manufacturer', 'batchNumber', 'manufacturingDate', 'expiryDate', 'mrp', 'unit', 'wholesalePrice', 'wholesaleMinQuantity', 'dealerPrice']
const PHARMACY_PRODUCTS = [
  {
    name: 'Augmentin 625 Duo Tablet',
    sku: 'MED-AUG-625',
    category: 'Antibiotics',
    genericName: 'Amoxicillin (500mg) + Clavulanic Acid (125mg)',
    manufacturer: 'GlaxoSmithKline Pharmaceuticals',
    batchNumber: 'AUG-24B01',
    manufacturingDate: past(180),
    expiryDate: future(540),
    mrp: 235,
    purchasePrice: 145,
    sellingPrice: 210,
    wholesalePrice: 175,
    wholesaleMinQuantity: 10,
    dealerPrice: 165,
    unit: 'box',
    hsnCode: '30041000',
    gstRate: 12,
    currentStock: 95,
    minimumStock: 20,
    description: 'Broad-spectrum antibiotic strip of 10 tablets in box. High demand line.',
  },
  {
    name: 'Dolo 650 Tablet',
    sku: 'MED-DOLO-650',
    category: 'Analgesics',
    genericName: 'Paracetamol IP 650mg',
    manufacturer: 'Micro Labs Ltd',
    batchNumber: 'DOL-24F12',
    manufacturingDate: past(90),
    expiryDate: future(730),
    mrp: 38,
    purchasePrice: 22,
    sellingPrice: 34,
    wholesalePrice: 27,
    wholesaleMinQuantity: 20,
    dealerPrice: 25,
    unit: 'box',
    hsnCode: '30049099',
    gstRate: 12,
    currentStock: 160,
    minimumStock: 30,
    description: 'Fast-acting antipyretic & analgesic tablets (15 tablets per strip).',
  },
  {
    name: 'Azithral 500 Tablet',
    sku: 'MED-AZI-500',
    category: 'Antibiotics',
    genericName: 'Azithromycin IP 500mg',
    manufacturer: 'Alembic Pharmaceuticals',
    batchNumber: 'AZI-24C08',
    manufacturingDate: past(150),
    expiryDate: future(480),
    mrp: 139,
    purchasePrice: 82,
    sellingPrice: 125,
    wholesalePrice: 102,
    wholesaleMinQuantity: 10,
    dealerPrice: 95,
    unit: 'box',
    hsnCode: '30041000',
    gstRate: 12,
    currentStock: 65,
    minimumStock: 15,
    description: 'Macrolide antibiotic 500mg (pack of 5 tablets).',
  },
  {
    name: 'Pantocid 40 Tablet',
    sku: 'MED-PAN-40',
    category: 'Gastrointestinal',
    genericName: 'Pantoprazole Gastro-resistant 40mg',
    manufacturer: 'Sun Pharmaceutical Industries',
    batchNumber: 'PAN-24E05',
    manufacturingDate: past(120),
    expiryDate: future(600),
    mrp: 168,
    purchasePrice: 95,
    sellingPrice: 152,
    wholesalePrice: 120,
    wholesaleMinQuantity: 10,
    dealerPrice: 112,
    unit: 'box',
    hsnCode: '30049099',
    gstRate: 12,
    currentStock: 50,
    minimumStock: 15,
    description: 'Proton pump inhibitor for acidity and GERD (15 tablets strip).',
  },
  {
    name: 'Glycomet-GP 2 Tablet',
    sku: 'MED-GLY-GP2',
    category: 'Chronic Care',
    genericName: 'Metformin (500mg) + Glimepiride (2mg)',
    manufacturer: 'USV Private Limited',
    batchNumber: 'GLY-24D11',
    manufacturingDate: past(130),
    expiryDate: future(660),
    mrp: 205,
    purchasePrice: 120,
    sellingPrice: 180,
    wholesalePrice: 148,
    wholesaleMinQuantity: 10,
    dealerPrice: 138,
    unit: 'box',
    hsnCode: '30049099',
    gstRate: 12,
    currentStock: 55,
    minimumStock: 12,
    description: 'Oral anti-diabetic dual combination (15 tablets strip).',
  },
  {
    name: 'Cetcip 10 Tablet',
    sku: 'MED-CET-10',
    category: 'Antiallergic',
    genericName: 'Cetirizine Hydrochloride IP 10mg',
    manufacturer: 'Cipla Ltd',
    batchNumber: 'CET-24A03',
    manufacturingDate: past(180),
    expiryDate: future(400),
    mrp: 26,
    purchasePrice: 14,
    sellingPrice: 23,
    wholesalePrice: 18,
    wholesaleMinQuantity: 20,
    dealerPrice: 16,
    unit: 'box',
    hsnCode: '30049099',
    gstRate: 12,
    currentStock: 120,
    minimumStock: 25,
    description: 'Non-sedating antihistamine for seasonal allergy relief (10 tablets).',
  },
  {
    name: 'Atorva 10 Tablet',
    sku: 'MED-ATR-10',
    category: 'Cardiovascular',
    genericName: 'Atorvastatin IP 10mg',
    manufacturer: 'Zydus Lifesciences',
    batchNumber: 'ATR-24G09',
    manufacturingDate: past(90),
    expiryDate: future(540),
    mrp: 122,
    purchasePrice: 68,
    sellingPrice: 108,
    wholesalePrice: 86,
    wholesaleMinQuantity: 10,
    dealerPrice: 80,
    unit: 'box',
    hsnCode: '30049099',
    gstRate: 12,
    currentStock: 45,
    minimumStock: 12,
    description: 'Lipid-lowering HMG-CoA reductase inhibitor (15 tablets strip).',
  },
  {
    name: 'Shelcal 500 Tablet',
    sku: 'MED-SHE-500',
    category: 'Vitamins & Supplements',
    genericName: 'Calcium (500mg) + Vitamin D3 (250 IU)',
    manufacturer: 'Torrent Pharmaceuticals',
    batchNumber: 'SHE-24H14',
    manufacturingDate: past(60),
    expiryDate: future(700),
    mrp: 151,
    purchasePrice: 85,
    sellingPrice: 135,
    wholesalePrice: 108,
    wholesaleMinQuantity: 10,
    dealerPrice: 100,
    unit: 'box',
    hsnCode: '30049099',
    gstRate: 12,
    currentStock: 75,
    minimumStock: 15,
    description: 'Calcium and Vitamin D3 dietary supplement (15 tablets strip).',
  },
  {
    name: 'Combiflam Tablet',
    sku: 'MED-COM-TAB',
    category: 'Analgesics',
    genericName: 'Ibuprofen (400mg) + Paracetamol (325mg)',
    manufacturer: 'Sanofi India Ltd',
    batchNumber: 'COM-24B07',
    manufacturingDate: past(150),
    expiryDate: future(600),
    mrp: 54,
    purchasePrice: 31,
    sellingPrice: 48,
    wholesalePrice: 38,
    wholesaleMinQuantity: 20,
    dealerPrice: 35,
    unit: 'box',
    hsnCode: '30049099',
    gstRate: 12,
    currentStock: 105,
    minimumStock: 20,
    description: 'Dual-action analgesic and anti-inflammatory formulation (20 tablets).',
  },
  {
    name: 'Benadryl Cough Formula 100ml',
    sku: 'MED-BEN-100',
    category: 'Respiratory',
    genericName: 'Diphenhydramine HCl + Ammonium Chloride',
    manufacturer: 'Johnson & Johnson Consumer',
    batchNumber: 'BEN-24J02',
    manufacturingDate: past(110),
    expiryDate: future(450),
    mrp: 134,
    purchasePrice: 80,
    sellingPrice: 120,
    wholesalePrice: 98,
    wholesaleMinQuantity: 12,
    dealerPrice: 90,
    unit: 'piece',
    hsnCode: '30049099',
    gstRate: 12,
    currentStock: 40,
    minimumStock: 10,
    description: 'Oral cough syrup for soothing bronchial congestion (100ml glass bottle).',
  },
  {
    name: 'Betadine 10% Ointment 20g',
    sku: 'MED-BET-20G',
    category: 'Topicals',
    genericName: 'Povidone-Iodine Ointment 10% w/w',
    manufacturer: 'Win-Medicare Pvt Ltd',
    batchNumber: 'BET-24K04',
    manufacturingDate: past(90),
    expiryDate: future(720),
    mrp: 125,
    purchasePrice: 72,
    sellingPrice: 110,
    wholesalePrice: 88,
    wholesaleMinQuantity: 15,
    dealerPrice: 82,
    unit: 'piece',
    hsnCode: '30049099',
    gstRate: 12,
    currentStock: 55,
    minimumStock: 12,
    description: 'Antiseptic microbicidal water-soluble ointment (20g aluminum tube).',
  },
  {
    name: 'Taxim-O 200 Tablet',
    sku: 'MED-TAX-200',
    category: 'Antibiotics',
    genericName: 'Cefixime Trihydrate IP 200mg',
    manufacturer: 'Alkem Laboratories',
    batchNumber: 'TAX-24L06',
    manufacturingDate: past(180),
    expiryDate: future(380),
    mrp: 138,
    purchasePrice: 78,
    sellingPrice: 122,
    wholesalePrice: 96,
    wholesaleMinQuantity: 10,
    dealerPrice: 90,
    unit: 'box',
    hsnCode: '30041000',
    gstRate: 12,
    currentStock: 5, // LOW STOCK TRIGGER (min is 15)
    minimumStock: 15,
    description: 'Third-generation cephalosporin antibiotic (10 tablets per box).',
  },
  {
    name: 'Pan-D Capsule',
    sku: 'MED-PAND-CAP',
    category: 'Gastrointestinal',
    genericName: 'Pantoprazole (40mg) + Domperidone (30mg SR)',
    manufacturer: 'Alkem Laboratories',
    batchNumber: 'PND-24D09',
    manufacturingDate: past(120),
    expiryDate: future(540),
    mrp: 210,
    purchasePrice: 115,
    sellingPrice: 185,
    wholesalePrice: 145,
    wholesaleMinQuantity: 10,
    dealerPrice: 135,
    unit: 'box',
    hsnCode: '30049099',
    gstRate: 12,
    currentStock: 0, // OUT OF STOCK TRIGGER
    minimumStock: 15,
    description: 'Gastro-resistant pantoprazole and sustained-release domperidone capsules.',
  },
  {
    name: 'Montair-LC Tablet',
    sku: 'MED-MON-LC',
    category: 'Respiratory',
    genericName: 'Montelukast (10mg) + Levocetirizine (5mg)',
    manufacturer: 'Cipla Ltd',
    batchNumber: 'MON-23E11',
    manufacturingDate: past(500),
    expiryDate: future(42), // EXPIRING SOON TRIGGER (~42 days remaining)
    mrp: 248,
    purchasePrice: 140,
    sellingPrice: 220,
    wholesalePrice: 175,
    wholesaleMinQuantity: 10,
    dealerPrice: 165,
    unit: 'box',
    hsnCode: '30049099',
    gstRate: 12,
    currentStock: 22,
    minimumStock: 10,
    description: 'Antiasthmatic anti-allergy prescription formulation (10 tablets strip).',
  },
  {
    name: 'Becosules Z Capsule',
    sku: 'MED-BEC-CAP',
    category: 'Vitamins & Supplements',
    genericName: 'Vitamin B-Complex + Vitamin C + Zinc',
    manufacturer: 'Pfizer Limited',
    batchNumber: 'BEC-24A02',
    manufacturingDate: past(90),
    expiryDate: future(660),
    mrp: 65,
    purchasePrice: 38,
    sellingPrice: 58,
    wholesalePrice: 46,
    wholesaleMinQuantity: 20,
    dealerPrice: 42,
    unit: 'box',
    hsnCode: '30049099',
    gstRate: 12,
    currentStock: 90,
    minimumStock: 20,
    description: 'Comprehensive Vitamin B-Complex with Zinc for tissue repair (20 capsules).',
  },
  {
    name: 'Volini Pain Relief Gel 50g',
    sku: 'MED-VOL-50G',
    category: 'Topicals',
    genericName: 'Diclofenac Diethylamine + Linseed Oil Gel',
    manufacturer: 'Sun Pharmaceutical Industries',
    batchNumber: 'VOL-24F08',
    manufacturingDate: past(100),
    expiryDate: future(620),
    mrp: 175,
    purchasePrice: 98,
    sellingPrice: 155,
    wholesalePrice: 122,
    wholesaleMinQuantity: 12,
    dealerPrice: 115,
    unit: 'piece',
    hsnCode: '30049099',
    gstRate: 12,
    currentStock: 48,
    minimumStock: 10,
    description: 'Scientifically formulated pain relief gel with micro-particles (50g tube).',
  },
  {
    name: 'Telma 40 Tablet',
    sku: 'MED-TEL-40',
    category: 'Cardiovascular',
    genericName: 'Telmisartan IP 40mg',
    manufacturer: 'Glenmark Pharmaceuticals',
    batchNumber: 'TEL-24H03',
    manufacturingDate: past(70),
    expiryDate: future(730),
    mrp: 158,
    purchasePrice: 88,
    sellingPrice: 140,
    wholesalePrice: 110,
    wholesaleMinQuantity: 10,
    dealerPrice: 102,
    unit: 'box',
    hsnCode: '30049099',
    gstRate: 12,
    currentStock: 6, // LOW STOCK TRIGGER (min is 12)
    minimumStock: 12,
    description: 'Blood pressure medication, angiotensin II receptor antagonist (15 tablets).',
  },
  {
    name: 'Limcee 500 Chewable Tablet',
    sku: 'MED-LIM-500',
    category: 'Vitamins & Supplements',
    genericName: 'Ascorbic Acid (Vitamin C) 500mg Orange',
    manufacturer: 'Abbott India Ltd',
    batchNumber: 'LIM-24M05',
    manufacturingDate: past(120),
    expiryDate: future(540),
    mrp: 30,
    purchasePrice: 16,
    sellingPrice: 26,
    wholesalePrice: 20,
    wholesaleMinQuantity: 25,
    dealerPrice: 18,
    unit: 'box',
    hsnCode: '30049099',
    gstRate: 12,
    currentStock: 130,
    minimumStock: 25,
    description: 'Chewable Vitamin C immunity booster tablets with natural orange flavor (15 tabs).',
  },
]

const PHARMACY_SUPPLIERS = [
  {
    supplierName: 'Cipla C&F Distribution Hub',
    contactPerson: 'Rajesh Mathur',
    phone: '+91 98110 44221',
    email: 'cfa.agra@cipladist.example',
    address: 'Plot 18, Transport Nagar',
    city: 'Agra',
    state: 'Uttar Pradesh',
    taxNumber: '09AABCC1234F1Z1',
    paymentTerms: 'Net 30',
  },
  {
    supplierName: 'Sun Pharma Regional Depot',
    contactPerson: 'Vikram Singhal',
    phone: '+91 98370 55112',
    email: 'depot.upwest@sunpharma.example',
    address: 'Warehouse Complex, Fazalganj',
    city: 'Kanpur',
    state: 'Uttar Pradesh',
    taxNumber: '09AABCS5678F1Z9',
    paymentTerms: 'Net 30',
  },
  {
    supplierName: 'Dr. Reddy Regional Agency',
    contactPerson: 'Ananya Deshmukh',
    phone: '+91 99120 77443',
    email: 'orders@drreddyagency.example',
    address: 'Sector 63 Logistics Park',
    city: 'Noida',
    state: 'Uttar Pradesh',
    taxNumber: '09AABCD9012F1Z3',
    paymentTerms: 'Net 15',
  },
  {
    supplierName: 'Mankind Pharma Stockist Ltd',
    contactPerson: 'Suresh Bansal',
    phone: '+91 98970 88334',
    email: 'bansal@mankindstockist.example',
    address: 'Sanjay Place Commercial Complex',
    city: 'Agra',
    state: 'Uttar Pradesh',
    taxNumber: '09AABCM3456F1Z5',
    paymentTerms: 'Net 15',
  },
  {
    supplierName: 'Abbott Healthcare Logistics',
    contactPerson: 'Pradeep Saxena',
    phone: '+91 98290 11995',
    email: 'supply@abbottlogistics.example',
    address: 'Okhla Industrial Phase III',
    city: 'New Delhi',
    state: 'Delhi',
    taxNumber: '07AABCA7890F1Z7',
    paymentTerms: 'Net 30',
  },
  {
    supplierName: 'MedLife Wholesale Pharma Supplies',
    contactPerson: 'Arvind Joshi',
    phone: '+91 94150 22886',
    email: 'contact@medlifewholesale.example',
    address: 'Transport Nagar Depot',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    taxNumber: '09AABCL2345F1Z2',
    paymentTerms: 'Due on receipt',
  },
]

const PHARMACY_CUSTOMERS = [
  {
    name: 'Sharma Medicos & Healthcare',
    phone: '+91 98371 12345',
    email: 'sharmamedicos.agra@example.com',
    city: 'Agra',
    state: 'Uttar Pradesh',
    address: 'Shop 14, Sanjay Place Market',
    customerType: 'wholesale',
    gstin: '09AABCS1111A1Z1',
    creditLimit: 150000,
    paymentTerms: 'Net 15',
    notes: 'Wholesale chemist buyer · Regular monthly bulk orders',
  },
  {
    name: 'Apollo Pharmacy Franchise Unit',
    phone: '+91 98972 23456',
    email: 'apollo.dayalbagh@example.com',
    city: 'Agra',
    state: 'Uttar Pradesh',
    address: 'Dayalbagh Road',
    customerType: 'wholesale',
    gstin: '09AABCA2222B1Z2',
    creditLimit: 250000,
    paymentTerms: 'Net 30',
    notes: 'High-volume retail chemist · Prefers NEFT/Bank transfer',
  },
  {
    name: 'Sanjeevani Drug House',
    phone: '+91 98373 34567',
    email: 'sanjeevani.kamlanagar@example.com',
    city: 'Agra',
    state: 'Uttar Pradesh',
    address: 'Main Market, Kamla Nagar',
    customerType: 'wholesale',
    gstin: '09AABCS3333C1Z3',
    creditLimit: 100000,
    paymentTerms: 'Net 15',
    notes: 'Wholesale medical store · Regular purchaser of antibiotics & acute care',
  },
  {
    name: 'Care & Cure Chemist',
    phone: '+91 98974 45678',
    email: 'carecure.shahganj@example.com',
    city: 'Agra',
    state: 'Uttar Pradesh',
    address: 'Hospital Road, Shahganj',
    customerType: 'wholesale',
    gstin: '09AABCC4444D1Z4',
    creditLimit: 120000,
    paymentTerms: 'Due on receipt',
    notes: 'Hospital attached pharmacy · Orders acute care medicines weekly',
  },
  {
    name: 'City Health Medical Hall',
    phone: '+91 98375 56789',
    email: 'cityhealth.rajamandi@example.com',
    city: 'Agra',
    state: 'Uttar Pradesh',
    address: 'Station Road, Raja Ki Mandi',
    customerType: 'wholesale',
    gstin: '09AABCU5555E1Z5',
    creditLimit: 80000,
    paymentTerms: 'Net 7',
    notes: 'Wholesale & retail medical hall in Raja Ki Mandi',
  },
  {
    name: 'Lifeline Multispeciality Pharmacy',
    phone: '+91 98976 67890',
    email: 'pharmacy@lifelinehospital.example',
    city: 'Agra',
    state: 'Uttar Pradesh',
    address: 'National Highway 19, Sikandra',
    customerType: 'wholesale',
    gstin: '09AABCL6666F1Z6',
    creditLimit: 300000,
    paymentTerms: 'Net 30',
    notes: 'Multispeciality hospital pharmacy · Institutional procurement account',
  },
  {
    name: 'Gupta Bros Chemist',
    phone: '+91 98377 78901',
    email: 'guptabros.bodla@example.com',
    city: 'Agra',
    state: 'Uttar Pradesh',
    address: 'Bodla Crossing',
    customerType: 'retail',
    gstin: '',
    creditLimit: 50000,
    paymentTerms: 'Due on receipt',
    notes: 'Retail pharmacy store in Bodla · Cash/UPI settlements',
  },
  {
    name: 'Prabhat Medical Agencies',
    phone: '+91 98978 89012',
    email: 'prabhat.sadar@example.com',
    city: 'Agra',
    state: 'Uttar Pradesh',
    address: 'Sadar Bazaar Commercial Lane',
    customerType: 'wholesale',
    gstin: '09AABCP7777G1Z7',
    creditLimit: 90000,
    paymentTerms: 'Net 15',
    notes: 'Clinic and nursing home supplier across Central Agra',
  },
  {
    name: 'Balaji Pharma Retail',
    phone: '+91 98379 90123',
    email: 'balaji.mathura@example.com',
    city: 'Mathura',
    state: 'Uttar Pradesh',
    address: 'Krishna Nagar Highway',
    customerType: 'wholesale',
    gstin: '09AABCB8888H1Z8',
    creditLimit: 140000,
    paymentTerms: 'Net 30',
    notes: 'Outstation wholesale buyer in Mathura · Dispatched by express road cargo',
  },
  {
    name: 'Apex Medicare Centre',
    phone: '+91 98970 01234',
    email: 'apexmedicare.firozabad@example.com',
    city: 'Firozabad',
    state: 'Uttar Pradesh',
    address: 'Station Road Glass Market',
    customerType: 'wholesale',
    gstin: '09AABCA9999I1Z9',
    creditLimit: 75000,
    paymentTerms: 'Net 15',
    notes: 'Regional clinic distributor in Firozabad',
  },
]

const PHARMACY_TEAM = [
  { name: 'Karan Mehra', email: 'karan.m@aflixmed.in', role: 'Salesperson' },
]

async function resetBusinessData(businessId) {
  for (const Model of [Product, Supplier, Customer, PurchaseOrder, Receiving, SalesOrder, Payment, StockTransaction, Return, Notification]) {
    await Model.deleteMany({ business: businessId })
  }
  await Member.deleteMany({ business: businessId, roleId: { $ne: 'ROLE-ADMIN' } })
}

async function run() {
  await connectDatabase()

  let user = await User.findOne({ email: TARGET_EMAIL }).select('+password')
  if (!user) {
    user = await User.create({
      email: TARGET_EMAIL,
      password: 'Shivam#123',
      role: 'owner',
      name: 'Shivam',
    })
    console.log(`Created user account: ${TARGET_EMAIL}`)
  } else {
    // Ensure the password is Shivam#123
    const match = await user.comparePassword('Shivam#123')
    if (!match) {
      user.password = 'Shivam#123'
      user.failedLoginAttempts = 0
      user.lockUntil = null
      await user.save()
      console.log(`Updated password for ${TARGET_EMAIL} to Shivam#123`)
    }
  }

  let business = user.business ? await Business.findById(user.business) : null
  if (!business) {
    business = await Business.create({
      name: 'aflix',
      industry: 'pharmacy',
      businessType: 'wholesale',
      phone: '9999999999',
      email: TARGET_EMAIL,
      address: 'amita nagar 64',
      city: 'Agra',
      state: 'Uttar Pradesh',
      country: 'India',
      currency: 'INR',
      gstin: '09SKA1234567890',
      owner: user._id,
      settings: {
        lowStockLimit: 12,
        allowNegativeStock: false,
        defaultPaymentMethod: 'UPI',
        taxEnabled: true,
        invoicePrefix: 'AFLX',
        defaultGstRate: 12,
      },
    })
    user.business = business._id
    user.onboarding = {
      status: 'completed',
      currentStep: 7,
      setupVersion: 1,
      completedAt: new Date(),
      draft: {
        businessName: 'aflix',
        ownerName: 'Shivam',
        phone: '9999999999',
        email: TARGET_EMAIL,
        city: 'Agra',
        state: 'Uttar Pradesh',
        country: 'India',
        currency: 'INR',
        industry: 'Pharmacy',
        businessType: 'Wholesale',
      },
    }
    await user.save()
    await Member.create({ business: business._id, account: user._id, name: user.name || 'Shivam', email: user.email, roleId: 'ROLE-ADMIN', status: 'active' })
    console.log(`Created business "${business.name}" for ${TARGET_EMAIL}`)
  } else {
    // Ensure onboarding is marked completed so login doesn't redirect to wizard
    user.onboarding = {
      status: 'completed',
      currentStep: 7,
      setupVersion: 1,
      completedAt: user.onboarding?.completedAt || new Date(),
      draft: user.onboarding?.draft || {
        businessName: business.name,
        ownerName: user.name || 'Shivam',
        phone: business.phone,
        email: TARGET_EMAIL,
        city: business.city,
        state: business.state,
        country: 'India',
        currency: 'INR',
        industry: 'Pharmacy',
        businessType: 'Wholesale',
      },
    }
    await user.save()
  }

  const roleCount = await Role.countDocuments({ business: business._id })
  if (!roleCount) {
    await Role.insertMany(DEFAULT_ROLES.map((r) => ({ ...r, business: business._id })))
  }

  const bid = String(business._id)
  console.log(`\n======================================================`)
  console.log(`Seeding realistic Pharmacy Wholesale data for "${business.name}" (${TARGET_EMAIL})...`)
  console.log(`======================================================`)

  await resetBusinessData(business._id)

  // 1. PRODUCTS
  console.log('\n[1/9] Seeding 18 pharmaceutical products with batches & expiry dates...')
  const products = []
  for (const def of PHARMACY_PRODUCTS) {
    const p = await step(`product: ${def.name}`, () => productService.create(bid, def))
    if (p) products.push(p)
  }

  // 2. SUPPLIERS
  console.log('\n[2/9] Seeding pharmaceutical suppliers & CFAs...')
  const suppliers = []
  for (const def of PHARMACY_SUPPLIERS) {
    const s = await step(`supplier: ${def.supplierName}`, () => supplierService.create(bid, def))
    if (s) suppliers.push(s)
  }

  // 3. CUSTOMERS
  console.log('\n[3/9] Seeding retail chemists, pharmacies & hospital customers...')
  const customers = []
  for (const def of PHARMACY_CUSTOMERS) {
    const c = await step(`customer: ${def.name}`, () => customerService.create(bid, def))
    if (c) customers.push(c)
  }

  // 4. TEAM MEMBERS
  console.log('\n[4/9] Seeding pharmacy team members...')
  for (const m of PHARMACY_TEAM) {
    const created = await step(`member: ${m.name} (${m.role})`, () => userService.createMember(bid, m))
    if (created) {
      await notificationEvents.member(bid, created, 'created')
    }
  }

  // 5. BUSINESS SETTINGS UPDATE
  console.log('\n[5/9] Configuring business settings for pharmacy...')
  await step('update business settings', () =>
    updateBusiness(bid, {
      settings: {
        lowStockLimit: 12,
        invoicePrefix: 'AFLX',
        defaultPaymentMethod: 'UPI',
        taxEnabled: true,
        allowNegativeStock: false,
        defaultGstRate: 12,
        upiId: 'aflixpharma@icici',
      },
    }),
  )

  // 6. PURCHASE ORDERS & RECEIVINGS
  console.log('\n[6/9] Seeding purchase orders and goods receipt entries...')
  const purchaseOrders = []
  for (let i = 0; i < 6; i += 1) {
    const supplier = suppliers[i % suppliers.length]
    const chosenProducts = [
      products[i * 2 % products.length],
      products[(i * 2 + 1) % products.length],
      products[(i * 2 + 2) % products.length],
    ]
    const items = chosenProducts.map((p) => ({
      productId: p.productId,
      quantity: rand(30, 80),
      purchasePrice: p.purchasePrice,
      discount: rand(0, 50),
      tax: Math.round(p.purchasePrice * 0.12 * 10) / 10,
    }))
    const po = await step(`purchase order ${i + 1} from ${supplier.supplierName}`, () =>
      purchaseOrderService.createOrder(
        bid,
        {
          supplierId: supplier.supplierId,
          items,
          shippingCharges: rand(100, 350),
          expectedDeliveryDate: i === 3 ? future(-2) : future(rand(4, 18)),
          notes: pick(['Quarterly stock replenishment', 'Urgent critical medicines order', 'Direct CFA delivery to warehouse', 'Regular monthly booking']),
        },
        TARGET_EMAIL,
      ),
    )
    if (po) {
      await notificationEvents.purchaseCreated(bid, po)
      purchaseOrders.push(po)
    }
  }

  // Update statuses for POs
  // PO 0, 1: Received
  // PO 2: Partially Received
  // PO 3: Ordered
  // PO 4: Approved
  // PO 5: Cancelled
  for (let idx = 0; idx < purchaseOrders.length; idx += 1) {
    const po = purchaseOrders[idx]
    if (idx === 5) {
      const cancelled = await step(`cancel PO ${po.orderNumber}`, () => purchaseOrderService.setStatus(bid, po.purchaseOrderId, 'Cancelled'))
      if (cancelled) await notificationEvents.purchaseStatus(bid, cancelled)
    } else if (idx === 4) {
      const approved = await step(`approve PO ${po.orderNumber}`, () => purchaseOrderService.setStatus(bid, po.purchaseOrderId, 'Approved'))
      if (approved) await notificationEvents.purchaseStatus(bid, approved)
    } else if (idx === 3) {
      const ordered = await step(`place PO ${po.orderNumber}`, () => purchaseOrderService.setStatus(bid, po.purchaseOrderId, 'Ordered'))
      if (ordered) await notificationEvents.purchaseStatus(bid, ordered)
    } else {
      // Receive PO 0, 1 (full) and PO 2 (partial)
      await purchaseOrderService.setStatus(bid, po.purchaseOrderId, 'Ordered')
      const isFull = idx !== 2
      const receivingItems = po.items.map((line) => {
        const prod = products.find((p) => String(p.productId) === String(line.productId))
        return {
          productId: line.productId,
          receivedQuantity: isFull ? line.quantity : Math.max(1, Math.floor(line.quantity * 0.6)),
          damagedQuantity: 0,
          rejectedQuantity: 0,
          batchNumber: prod?.batchNumber || `B-${rand(1000, 9999)}`,
          expiryDate: prod?.expiryDate ? new Date(prod.expiryDate).toISOString().slice(0, 10) : future(365),
        }
      })
      const receipt = await step(`receiving for ${po.orderNumber}`, () =>
        receivingService.createReceiving(
          bid,
          {
            purchaseOrderId: po.purchaseOrderId,
            items: receivingItems,
            notes: isFull ? 'Verified against CFA delivery challan; batch inspection passed.' : 'First consignment received; balance to follow next week.',
          },
          TARGET_EMAIL,
        ),
      )
      if (receipt) await notificationEvents.received(bid, receipt)
    }
  }

  // 7. SALES ORDERS
  console.log('\n[7/9] Seeding wholesale sales orders...')
  const salesOrders = []
  // Select products that have positive stock
  const inStockProducts = products.filter((p) => (p.currentStock || 0) > 10)

  for (let i = 0; i < 10; i += 1) {
    const customer = customers[i % customers.length]
    const p1 = inStockProducts[i % inStockProducts.length]
    const p2 = inStockProducts[(i + 3) % inStockProducts.length]
    const chosen = [p1, p2].filter(Boolean)

    const items = chosen.map((p) => ({
      productId: p.productId,
      quantity: rand(2, 5),
      sellingPrice: p.wholesalePrice || p.sellingPrice,
      discount: rand(0, 40),
      tax: Math.round((p.wholesalePrice || p.sellingPrice) * 0.12 * 10) / 10,
    }))

    const so = await step(`sales order ${i + 1} for ${customer.name}`, () =>
      salesOrderService.createOrder(
        bid,
        {
          customerId: customer.customerId,
          items,
          notes: pick(['Wholesale chemist supply', 'Urgent pharmacy counter replenishment', 'Hospital outpatient bulk order', 'Regular weekly delivery']),
        },
        TARGET_EMAIL,
      ),
    )
    if (so) {
      await notificationEvents.salesCreated(bid, so)
      salesOrders.push(so)
    }
  }

  // Complete first 6 sales orders, cancel 1, keep 3 pending
  for (let i = 0; i < salesOrders.length; i += 1) {
    const so = salesOrders[i]
    if (i < 6) {
      const completed = await step(`complete sales order ${so.orderNumber}`, () => salesOrderService.completeOrder(bid, so.orderId, TARGET_EMAIL))
      if (completed) await notificationEvents.salesStatus(bid, completed)
    } else if (i === 6) {
      const cancelled = await step(`cancel sales order ${so.orderNumber}`, () => salesOrderService.cancelOrder(bid, so.orderId))
      if (cancelled) await notificationEvents.salesStatus(bid, cancelled)
    }
  }

  // 8. PAYMENTS (Sales and Purchases)
  console.log('\n[8/9] Recording payments...')
  const completedSales = (await salesOrderService.listOrders(bid, {})).filter((o) => o.status === 'Completed')
  for (let i = 0; i < completedSales.length; i += 1) {
    const order = completedSales[i]
    const isFull = i % 2 === 0
    const amount = isFull ? order.totalAmount : Math.round(order.totalAmount * 0.5 * 100) / 100
    const pay = await step(`customer payment for ${order.orderNumber}`, () =>
      paymentService.createPayment(
        bid,
        {
          type: 'sale',
          referenceId: order.orderId,
          amount,
          paymentMethod: pick(['UPI', 'Bank transfer', 'Cash']),
          paymentDate: past(rand(1, 14)),
          notes: isFull ? 'Invoice settled in full' : '50% advance received via NEFT/UPI',
        },
        TARGET_EMAIL,
      ),
    )
    if (pay) await notificationEvents.payment(bid, pay)
  }

  const receivedPOs = (await purchaseOrderService.listOrders(bid, {})).filter((o) => ['Received', 'Partially Received'].includes(o.status))
  for (const po of receivedPOs) {
    const amount = Math.round(po.totalAmount * 0.7 * 100) / 100
    const pay = await step(`supplier payment for ${po.orderNumber}`, () =>
      paymentService.createPayment(
        bid,
        {
          type: 'purchase',
          referenceId: po.purchaseOrderId,
          amount,
          paymentMethod: pick(['Bank transfer', 'UPI']),
          paymentDate: past(rand(1, 10)),
          notes: 'RTGS remittance to manufacturer CFA',
        },
        TARGET_EMAIL,
      ),
    )
    if (pay) await notificationEvents.payment(bid, pay)
  }

  // 9. RETURNS & STOCK ADJUSTMENTS
  console.log('\n[9/9] Adding returns and inventory audit operations...')
  if (completedSales.length > 0) {
    const returnOrder = completedSales[0]
    const item = returnOrder.items[0]
    const ret = await step(`sales return for ${returnOrder.orderNumber}`, () =>
      returnService.createReturn(
        bid,
        {
          type: 'sale',
          orderId: returnOrder.orderId,
          productId: item.productId,
          quantity: 1,
          reason: 'Damaged product',
          condition: 'Damaged',
          refundAmount: Math.round(item.sellingPrice),
          notes: 'Outer packaging seal damaged during local transit.',
        },
        TARGET_EMAIL,
      ),
    )
    if (ret) await notificationEvents.returned(bid, ret)
  }

  // Manual stock adjustment
  const auditProduct = products.find((p) => p.sku === 'MED-AUG-625')
  if (auditProduct) {
    const op = await step(`inventory adjustment for ${auditProduct.sku}`, () =>
      recordOperation(bid, {
        section: 'Adjustments',
        productId: auditProduct.productId,
        quantity: auditProduct.currentStock + 5,
        reason: 'Monthly physical warehouse cycle count correction',
        createdBy: TARGET_EMAIL,
      }),
    )
    if (op) await notificationEvents.inventory(bid, op)
  }

  // SUMMARY
  const counts = {
    products: await Product.countDocuments({ business: business._id }),
    suppliers: await Supplier.countDocuments({ business: business._id }),
    customers: await Customer.countDocuments({ business: business._id }),
    purchaseOrders: await PurchaseOrder.countDocuments({ business: business._id }),
    receivings: await Receiving.countDocuments({ business: business._id }),
    salesOrders: await SalesOrder.countDocuments({ business: business._id }),
    payments: await Payment.countDocuments({ business: business._id }),
    stockTransactions: await StockTransaction.countDocuments({ business: business._id }),
    returns: await Return.countDocuments({ business: business._id }),
    members: await Member.countDocuments({ business: business._id }),
    notifications: await Notification.countDocuments({ business: business._id }),
  }

  console.log(`\n======================================================`)
  console.log(`Demo data seeding completed successfully!`)
  console.log(`${done} operations succeeded, ${skipped} skipped.`)
  console.log(`======================================================`)
  console.table(counts)
  console.log(`\nSign in credentials:`)
  console.log(`  Email:    ${TARGET_EMAIL}`)
  console.log(`  Password: Shivam#123`)
  console.log(`  Business: ${business.name} (Pharmacy Wholesale)`)
  console.log(`======================================================\n`)

  await disconnectDatabase()
  process.exit(0)
}

run().catch(async (error) => {
  console.error('\nFatal seeding error:', error)
  await disconnectDatabase()
  process.exit(1)
})
