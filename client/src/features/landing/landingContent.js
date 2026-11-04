// Copy and data for the public marketing page. Kept separate from the
// components so wording, prices and FAQs can be edited without touching JSX.

export const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Product tour", href: "#tour" },
  { label: "Pricing", href: "#pricing" },
  { label: "Industries", href: "#industries" },
  { label: "FAQ", href: "#faq" },
];

export const MARQUEE_ITEMS = [
  "Pharmacies",
  "Kirana & grocery",
  "Clothing wholesale",
  "Electronics",
  "Hardware stores",
  "Cosmetics",
  "Stationery",
  "Distributors",
  "Footwear",
  "Mobile accessories",
];

export const STATS = [
  { value: 60, suffix: "s", label: "to bill a full basket at the POS counter" },
  { value: 30, suffix: "-day", label: "early warning on batches nearing expiry" },
  { value: 99.9, suffix: "%", label: "cloud sync uptime across your counters", decimals: 1 },
  { value: 0, prefix: "₹", label: "to start. No card, no setup fee" },
];

export const FEATURES = [
  {
    key: "pos",
    size: "wide",
    icon: "pos",
    eyebrow: "Point of sale",
    title: "A billing counter your staff learns in five minutes",
    body: "Scan, search or tap to add items. Split payments across cash, UPI and credit, print GST-ready invoices and close the shift with a reconciled cash drawer.",
    points: ["Cash · UPI · Card · Credit", "Thermal & A4 invoices", "Shift open / close"],
  },
  {
    key: "inventory",
    icon: "box",
    eyebrow: "Inventory",
    title: "Stock that counts itself",
    body: "Every sale, return and receipt moves stock automatically, with a full ledger behind every number.",
  },
  {
    key: "expiry",
    icon: "clock",
    eyebrow: "Batches & expiry",
    title: "Nothing expires on the shelf",
    body: "Track batches, see what expires in 30 days and pull expired stock from sale in one click.",
  },
  {
    key: "purchase",
    icon: "truck",
    eyebrow: "Purchasing",
    title: "Reorder before you run out",
    body: "Low-stock alerts turn into purchase orders. Receive partial deliveries and keep supplier dues straight.",
  },
  {
    key: "payments",
    icon: "wallet",
    eyebrow: "Payments",
    title: "Every rupee, settled",
    body: "Sales inflows, vendor outflows and outstanding credit in one real-time settlement ledger.",
  },
  {
    key: "team",
    size: "wide",
    icon: "users",
    eyebrow: "Team & roles",
    title: "Hand over the counter, not the keys",
    body: "Invite cashiers and managers with their own logins. Owners keep full control, and team members only see what their role allows.",
    points: ["Owner & team logins", "Permission-aware menus", "Activity you can trust"],
  },
  {
    key: "reports",
    icon: "trend",
    eyebrow: "Reports & alerts",
    title: "Know your numbers by closing time",
    body: "Daily sales, stock value and dues in clear reports, with notifications when something needs you.",
  },
];

export const STEPS = [
  {
    n: "01",
    title: "Create your workspace",
    body: "Sign up as a shop owner, pick your industry and currency. Stockroom tailors the modules to how you sell.",
  },
  {
    n: "02",
    title: "Bring in your products",
    body: "Import from Excel or a supplier PDF, or add items by hand with batches, variants and bulk prices.",
  },
  {
    n: "03",
    title: "Open the counter",
    body: "Start a shift, bill your first customer and watch the dashboard fill in live.",
  },
];

export const TOUR_TABS = [
  {
    key: "inventory",
    label: "Inventory",
    title: "See every shelf at a glance",
    body: "Search by name or SKU, filter by category and spot what needs restocking before customers notice.",
    bullets: ["Live stock with reorder levels", "Stock-in, adjustments and full history", "Categories, variants and colours"],
  },
  {
    key: "purchasing",
    label: "Purchasing",
    title: "From low stock to delivered",
    body: "Raise a purchase order in seconds, receive it against the PO, and stock updates on its own.",
    bullets: ["Purchase orders & receiving", "Supplier directory and dues", "Partial deliveries handled"],
  },
  {
    key: "sales",
    label: "Sales",
    title: "Counter, bulk and credit sales",
    body: "Bill walk-in customers at the POS, take bulk orders for wholesale buyers and track who owes what.",
    bullets: ["POS terminal with invoices", "Bulk orders & credit sales", "Returns and refunds"],
  },
  {
    key: "business",
    label: "Business",
    title: "Your business, set up your way",
    body: "Identity, industry, contact and regional details in one profile, with team access managed by role.",
    bullets: ["Business profile & currency", "User management by role", "Reports and notifications"],
  },
];

export const INDUSTRIES = [
  { name: "Pharmacy", note: "Batches, expiry alerts and schedule tracking", icon: "pill" },
  { name: "Grocery & kirana", note: "Fast billing, loose items and daily credit", icon: "basket" },
  { name: "Clothing", note: "Sizes, colours and wholesale bulk pricing", icon: "shirt" },
  { name: "Electronics", note: "Serials, warranties and supplier returns", icon: "chip" },
  { name: "Hardware", note: "Thousands of SKUs and contractor accounts", icon: "wrench" },
  { name: "Wholesale", note: "Bulk orders, slabs and outstanding dues", icon: "boxes" },
];

// Placeholder quotes: replace these with real customer testimonials before launch.
export const TESTIMONIALS = [
  {
    quote: "Expiry alerts alone paid for it. We used to find expired strips during audits. Now we pull them a month early.",
    name: "Pharmacy owner",
    place: "Agra",
  },
  {
    quote: "My cashier learned the POS on day one. Closing the shift used to take 40 minutes. Now the drawer just matches.",
    name: "Supermarket owner",
    place: "Jaipur",
  },
  {
    quote: "Bulk pricing and credit sales finally live in one place. I know exactly which retailer owes what.",
    name: "Clothing wholesaler",
    place: "Surat",
  },
];

export const FAQS = [
  {
    q: "Do I need to install anything?",
    a: "No. Stockroom runs in the browser on any laptop, tablet or phone. Sign in and your workspace is ready.",
  },
  {
    q: "Can my staff use it without seeing my reports?",
    a: "Yes. Team members sign in with their own accounts and only see the modules their role allows. Owners keep full access.",
  },
  {
    q: "Does it handle batches and expiry dates?",
    a: "Yes. Every product can carry batches with expiry dates. The dashboard flags stock expiring within 30 days and anything already expired.",
  },
  {
    q: "Can I import my existing product list?",
    a: "Yes. Upload an Excel sheet or a supplier PDF and map the columns. Products, prices and opening stock come across in one go.",
  },
  {
    q: "Which payment methods does the POS support?",
    a: "Cash, UPI, card and customer credit, including split payments on a single bill. Outstanding credit is tracked per customer.",
  },
  {
    q: "Is my data safe?",
    a: "Your data is stored in the cloud with encrypted connections, secure cookie sessions and role-based access. You can export it at any time.",
  },
];


export const BILLING_INTERVALS = [
  { id: "monthly", label: "Monthly", months: 1, discount: 0, cadence: "Billed monthly" },
  { id: "quarterly", label: "3 Months · 10% OFF", months: 3, discount: 0.10, cadence: "Billed quarterly" },
  { id: "biannual", label: "6 Months · 20% OFF", months: 6, discount: 0.20, cadence: "Billed bi-annually" },
];

export const PRICING_PLANS = [
  {
    id: "starter",
    name: "Starter",
    description: "Ideal for small businesses and single-warehouse teams.",
    basePrice: 299,
    popular: false,
    ctaText: "Get Starter",
    features: [
      "Up to 2,500 active SKUs",
      "1 warehouse location",
      "Barcode & QR scanning",
      "Shopify & WooCommerce sync",
      "Low-stock email alerts",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    badge: "Popular",
    description: "Complete automation for growing multi-channel businesses.",
    basePrice: 349,
    popular: true,
    ctaText: "Get Growth",
    features: [
      "Up to 25,000 active SKUs",
      "Up to 5 warehouse locations",
      "Automated purchase orders",
      "AI demand forecasting",
      "Batch / Lot tracking",
      "Priority support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Advanced inventory control for large-scale businesses.",
    basePrice: 399,
    popular: false,
    ctaText: "Get Enterprise",
    features: [
      "Unlimited SKUs",
      "Unlimited warehouses",
      "Custom ERP integrations",
      "RFID hardware integration",
      "Custom SLA",
      "Dedicated account manager",
    ],
  },
];
