import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { posApi } from "../../api/posApi.js";
import { useResource } from "../../hooks/useResource.js";
import AsyncBoundary from "../../components/feedback/AsyncBoundary.jsx";
import { PageHeader } from "../../components/ui/PageHeader.jsx";
import { Button } from "../../components/ui/Button.jsx";
import PosReceiptModal from "./components/PosReceiptModal.jsx";
import PosCart from "./components/PosCart.jsx";
import PosPaymentSection from "./components/PosPaymentSection.jsx";
import "./pos-terminal.css";

const METHODS = [
  "Cash",
  "UPI",
  "QR",
  "Debit Card",
  "Credit Card",
  "Bank transfer",
  "Store Credit",
  "Gift Card",
  "Pay Later",
];

const createPaymentRow = (method = "Cash", amount = 0, reference = "") => ({
  id: Math.random().toString(36).slice(2, 9),
  method,
  amount,
  reference,
});

const money = (currency, value) =>
  `${currency === 'INR' ? '₹' : currency || '₹'}${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function POS({ business = {}, account = {} }) {
  const load = useCallback(
    () =>
      Promise.all([
        posApi.catalog(),
        posApi.customers(),
        posApi.invoices(),
      ]),
    [],
  );
  const { data, loading, error, refetch, setData } = useResource(
    load,
    [],
    [[], [], []],
  );
  const [products, customers, invoices] = data;
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [billingType, setBillingType] = useState(
    business.businessType === "wholesale" ? "wholesale" : "retail",
  );
  const [customerMode, setCustomerMode] = useState("walkin");
  const [customerId, setCustomerId] = useState("");
  const [cart, setCart] = useState([]);
  const [discountType, setDiscountType] = useState("fixed");
  const [discountValue, setDiscountValue] = useState(0);
  const [offerCode, setOfferCode] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [loyaltyPointsRedeemed, setLoyaltyPointsRedeemed] = useState(0);
  const [payments, setPayments] = useState([
    createPaymentRow(business.settings?.defaultPaymentMethod || "Cash", 0, ""),
  ]);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    state: business.state || "",
    gstin: "",
  });
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [lastInvoice, setLastInvoice] = useState(null);
  const [openingInvoice, setOpeningInvoice] = useState(null);
  const [qr, setQr] = useState("");
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [mobileStep, setMobileStep] = useState('cart'); // 'cart' | 'pay'

  const searchRef = useRef(null);
  const checkoutPendingRef = useRef(false);
  const canOverride =
    account.role === "owner" ||
    account.permissions?.includes("override_pos_price");

  const categories = useMemo(
    () => [...new Set(products.map((product) => product.category).filter(Boolean))],
    [products],
  );

  const visible = useMemo(
    () =>
      products
        .filter((product) =>
          `${product.name} ${product.sku} ${product.barcode || ""} ${product.size || ""} ${product.color || ""}`
            .toLowerCase()
            .includes(search.toLowerCase()),
        )
        .filter((product) => categoryFilter === "all" || product.category === categoryFilter),
    [products, search, categoryFilter],
  );

  const priceFor = (product, quantity) =>
    billingType === "wholesale" &&
    product.wholesalePrice > 0 &&
    quantity >= (product.wholesaleMinQuantity || 10)
      ? product.wholesalePrice
      : product.sellingPrice;

  const add = (product) =>
    setCart((current) => {
      const existing = current.find(
        (item) => item.cartKey === `${product.productId}:${product.variantId || ''}`,
      );
      if (existing)
        return current.map((item) =>
          item.cartKey === `${product.productId}:${product.variantId || ''}`
            ? {
                ...item,
                quantity: Math.min(product.currentStock, item.quantity + 1),
                unitPrice: priceFor(
                  product,
                  Math.min(product.currentStock, item.quantity + 1),
                ),
              }
            : item,
        );
      if (product.currentStock <= 0) return current;
      return [
        ...current,
        {
          productId: product.productId,
          variantId: product.variantId || '',
          cartKey: `${product.productId}:${product.variantId || ''}`,
          name: product.name,
          sku: product.sku,
          stock: product.currentStock,
          quantity: 1,
          unitPrice: priceFor(product, 1),
          discount: 0,
          gstRate: product.gstRate || business.settings?.defaultGstRate || 0,
        },
      ];
    });

  const update = (id, field, value) =>
    setCart((current) =>
      current.map((item) => {
        if (item.cartKey !== id) return item;
        const next = { ...item, [field]: Number(value) };
        const product = products.find(
          (row) =>
            String(row.productId) === String(item.productId) &&
            String(row.variantId || "") === String(item.variantId || ""),
        );
        if (field === "quantity") {
          const availableStock = Number(product?.currentStock ?? item.stock ?? 1);
          next.quantity = Math.max(
            1,
            Math.min(availableStock, Math.floor(next.quantity || 1)),
          );
          if (!canOverride && product)
            next.unitPrice = priceFor(product, next.quantity);
        }
        return next;
      }),
    );

  const remove = (id) =>
    setCart((current) => current.filter((item) => item.cartKey !== id));

  const subtotal = cart.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );
  const lineDiscount = cart.reduce(
    (sum, item) => sum + Number(item.discount || 0),
    0,
  );
  const beforeBillDiscount = Math.max(0, subtotal - lineDiscount);
  const globalDiscount = Math.min(
    beforeBillDiscount,
    discountType === "percent"
      ? (beforeBillDiscount * Math.min(100, discountValue)) / 100
      : discountValue,
  );

  const activePaymentOffers = (business.settings?.paymentOffers || []).filter(
    (offer) => offer.active !== false && offer.code,
  );

  const offerMethodMatches = (offer) =>
    !offer.paymentMethod ||
    offer.paymentMethod === "Any" ||
    payments.some((payment) => payment.method === offer.paymentMethod);

  const selectedOffer = activePaymentOffers.find(
    (offer) =>
      offer.active !== false &&
      offer.code === offerCode &&
      offerMethodMatches(offer) &&
      beforeBillDiscount >= Number(offer.minimumAmount || 0),
  );

  let offerDiscount = selectedOffer
    ? selectedOffer.discountType === "fixed"
      ? Number(selectedOffer.value)
      : (beforeBillDiscount * Number(selectedOffer.value || 0)) / 100
    : 0;

  if (selectedOffer?.maximumDiscount > 0)
    offerDiscount = Math.min(offerDiscount, selectedOffer.maximumDiscount);

  offerDiscount = Math.min(
    Math.max(0, beforeBillDiscount - globalDiscount),
    offerDiscount,
  );

  const chosenOffer = activePaymentOffers.find((offer) => offer.code === offerCode);
  const offerNotice = !chosenOffer
    ? ""
    : selectedOffer
      ? `Applied − ${money(business.currency, offerDiscount)}`
      : beforeBillDiscount < Number(chosenOffer.minimumAmount || 0)
        ? `Needs a bill of ${money(business.currency, chosenOffer.minimumAmount)} to apply`
        : `Applies only when paying by ${chosenOffer.paymentMethod}`;

  const taxable = Math.max(
    0,
    beforeBillDiscount - globalDiscount - offerDiscount,
  );

  const estimatedTax =
    beforeBillDiscount > 0
      ? cart.reduce(
          (sum, item) =>
            sum +
            (taxable *
              (Math.max(0, item.quantity * item.unitPrice - item.discount) /
                beforeBillDiscount) *
              item.gstRate) /
              100,
          0,
        )
      : 0;

  const estimatedTotal = Math.round(taxable + estimatedTax);
  const paid = payments
    .filter((payment) => !["Credit", "Pay Later"].includes(payment.method))
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  const qrPaymentSelected = payments.some((payment) =>
    ["UPI", "QR"].includes(payment.method),
  );

  const qrAmount =
    payments
      .filter((payment) => ["UPI", "QR"].includes(payment.method))
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0) ||
    Math.max(0, estimatedTotal - paid);

  useEffect(() => {
    const upiId = business.settings?.upiId;
    let active = true;
    const renderQr = async () => {
      if (!qrPaymentSelected || !upiId || estimatedTotal <= 0 || qrAmount <= 0) {
        if (active) setQr("");
        return;
      }
      try {
        const image = await QRCode.toDataURL(
          `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(business.name || 'Store')}&am=${qrAmount.toFixed(2)}&cu=INR`,
          { width: 180, margin: 1 },
        );
        if (active) setQr(image);
      } catch {
        if (active) setQr("");
      }
    };
    renderQr();
    return () => {
      active = false;
    };
  }, [business, estimatedTotal, qrAmount, qrPaymentSelected]);

  // Keyboard shortcuts (F8=Cash, F9=UPI, F10=Card, Esc=Close mobile sheet)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "F8") {
        event.preventDefault();
        setPayments([createPaymentRow("Cash", 0, "")]);
      } else if (event.key === "F9") {
        event.preventDefault();
        setPayments([createPaymentRow("UPI", 0, "")]);
      } else if (event.key === "F10") {
        event.preventDefault();
        setPayments([createPaymentRow("Debit Card", 0, "")]);
      } else if (event.key === "Escape" && mobileCartOpen) {
        event.preventDefault();
        setMobileCartOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileCartOpen]);

  const scan = (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const exact =
      products.find((product) =>
        [product.barcode, product.sku]
          .filter(Boolean)
          .some((value) => value.toLowerCase() === search.trim().toLowerCase()),
      ) || visible[0];
    if (exact) {
      add(exact);
      setSearch("");
    }
  };

  const setPayment = (index, field, value) =>
    setPayments((current) =>
      current.map((payment, i) =>
        i === index
          ? { ...payment, [field]: field === "amount" ? Number(value) : value }
          : payment,
      ),
    );

  const checkout = async () => {
    if (!cart.length || checkoutPendingRef.current) return;
    checkoutPendingRef.current = true;
    setSaving(true);
    setMessage(null);
    try {
      const result = await posApi.checkout({
        billingType,
        customerId: customerMode === "existing" ? customerId : "",
        newCustomer: customerMode === "new" ? newCustomer : null,
        items: cart.map((item) => ({
          productId: item.productId,
          variantId: item.variantId || undefined,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
        })),
        discount: { type: discountType, value: Number(discountValue) || 0 },
        offerCode,
        couponCode,
        loyaltyPointsRedeemed,
        payments,
        notes: "",
      });
      setInvoice(result.invoice);
      setLastInvoice(result.invoice);
      setData((current) => [
        current[0],
        current[1],
        [result.invoice, ...current[2].filter((row) => row.orderId !== result.invoice.orderId)],
      ]);
      setCart([]);
      setDiscountValue(0);
      setOfferCode("");
      setCouponCode("");
      setLoyaltyPointsRedeemed(0);
      setSearch("");
      setMobileCartOpen(false);
      setMobileStep('cart');
      if (customerMode === "new" && result.invoice.customerId) {
        setCustomerMode("existing");
        setCustomerId(result.invoice.customerId);
      }
      setPayments([
        createPaymentRow(business.settings?.defaultPaymentMethod || "Cash", 0, ""),
      ]);
      setMessage({
        type: "success",
        text: `Sale saved. Bill ${result.invoice.invoiceNumber} is ready to print or save.`,
      });
      try {
        setData(await load());
      } catch {
        setMessage({
          type: "warning",
          text: `Bill ${result.invoice.invoiceNumber} was saved, but the catalog could not refresh. Refresh the page before the next sale.`,
        });
      }
    } catch (caught) {
      setMessage({ type: "error", text: caught.message || "Checkout failed." });
    } finally {
      checkoutPendingRef.current = false;
      setSaving(false);
    }
  };

  const openSavedInvoice = async (orderId) => {
    setOpeningInvoice(orderId);
    try {
      setInvoice(await posApi.invoice(orderId));
    } catch (caught) {
      setMessage({ type: "error", text: caught.message || "Could not open this bill. Please try again." });
    } finally {
      setOpeningInvoice(null);
    }
  };

  const cartUnits = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Common customer selector block
  const customerSelectorBlock = (
    <div className="pos-customer">
      <label>Customer</label>
      <div className="customer-mode">
        <button
          className={customerMode === "walkin" ? "active" : ""}
          type="button"
          onClick={() => setCustomerMode("walkin")}
        >
          Walk-in
        </button>
        <button
          className={customerMode === "existing" ? "active" : ""}
          type="button"
          onClick={() => setCustomerMode("existing")}
        >
          Existing
        </button>
        <button
          className={customerMode === "new" ? "active" : ""}
          type="button"
          onClick={() => setCustomerMode("new")}
        >
          New
        </button>
      </div>
      {customerMode === "existing" && (
        <select
          value={customerId}
          onChange={(event) => setCustomerId(event.target.value)}
          aria-label="Select existing customer"
        >
          <option value="">Select customer</option>
          {customers.map((customer) => (
            <option value={customer.customerId} key={customer.customerId}>
              {customer.name} · {customer.gstin || customer.phone || "Retail"}
            </option>
          ))}
        </select>
      )}
      {customerMode === "new" && (
        <div className="new-customer-grid">
          {["name", "phone", "email", "state", "gstin"].map((field) => (
            <input
              key={field}
              placeholder={field.toUpperCase()}
              value={newCustomer[field]}
              onChange={(event) =>
                setNewCustomer({
                  ...newCustomer,
                  [field]: event.target.value,
                })
              }
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <section className="pos-page" aria-labelledby="pos-title">
      <PageHeader
        kicker="Orders / Sales / POS"
        title="Billing & Checkout"
        description={`Cashier: ${account.name || account.email || 'Cashier'} · ${business.name || 'Store'}`}
        actions={
          <div className="pos-billing-switch">
            <button
              className={billingType === "retail" ? "active" : ""}
              type="button"
              onClick={() => setBillingType("retail")}
            >
              Retail
            </button>
            <button
              className={billingType === "wholesale" ? "active" : ""}
              type="button"
              onClick={() => setBillingType("wholesale")}
            >
              Wholesale
            </button>
          </div>
        }
      />

      {message && (
        <div className={`form-status ${message.type}`} role="status">
          {message.text}
        </div>
      )}

      {lastInvoice && (
        <section className="pos-bill-success" aria-label="Last generated bill">
          <div>
            <strong>Bill {lastInvoice.invoiceNumber}</strong>
            <p>{lastInvoice.customerName} · {lastInvoice.paymentStatus}</p>
            <span>
              Paid {money(lastInvoice.business?.currency || business.currency, lastInvoice.amountPaid)}
              {lastInvoice.balanceDue > 0 &&
                ` · Balance due ${money(lastInvoice.business?.currency || business.currency, lastInvoice.balanceDue)}`}
            </span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={() => setInvoice(lastInvoice)}
          >
            View / Print Bill
          </Button>
        </section>
      )}

      <div className="pos-layout">
        {/* Catalog Section */}
        <section className="pos-catalog">
          <div className="pos-search">
            <span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="10.5" cy="10.5" r="6.5" />
                <path d="m16 16 4.5 4.5" />
              </svg>
            </span>
            <input
              ref={searchRef}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={scan}
              placeholder="Scan barcode or search name / SKU, then press Enter"
              aria-label="Search or scan products"
              autoFocus
            />
            <small>Scanner ready · Camera / USB</small>
          </div>

          {categories.length > 1 && (
            <div className="pos-category-pills" role="tablist" aria-label="Filter by category">
              <button
                type="button"
                className={categoryFilter === "all" ? "active" : ""}
                aria-pressed={categoryFilter === "all"}
                onClick={() => setCategoryFilter("all")}
              >
                All items
              </button>
              {categories.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={categoryFilter === value ? "active" : ""}
                  aria-pressed={categoryFilter === value}
                  onClick={() => setCategoryFilter(value)}
                >
                  {value}
                </button>
              ))}
            </div>
          )}

          <AsyncBoundary
            loading={loading}
            error={error}
            onRetry={refetch}
            isEmpty={!visible.length}
            emptyText="No matching products."
          >
            <div className="pos-product-grid">
              {visible.map((product) => (
                <button
                  type="button"
                  className="pos-product"
                  key={`${product.productId}:${product.variantId || ''}`}
                  onClick={() => add(product)}
                  disabled={product.currentStock <= 0}
                >
                  <em
                    className={
                      product.currentStock <= 0
                        ? "out"
                        : product.currentStock <= product.minimumStock
                          ? "low"
                          : ""
                    }
                  >
                    {product.currentStock <= 0
                      ? "Out of stock"
                      : product.currentStock <= product.minimumStock
                        ? `Low stock (${product.currentStock} left)`
                        : `${product.currentStock} in stock`}
                  </em>
                  <span className="product-thumb">{(product.name || 'P')[0]}</span>
                  <strong>{product.name}</strong>
                  <small>
                    {product.sku}
                    {product.barcode ? ` · ${product.barcode}` : ""}
                  </small>
                  <span className="pos-product-price">
                    <b>PRICE</b>
                    {money(
                      business.currency,
                      billingType === "wholesale" && product.wholesalePrice
                        ? product.wholesalePrice
                        : product.sellingPrice,
                    )}
                    <i aria-hidden="true">+</i>
                  </span>
                </button>
              ))}
            </div>
          </AsyncBoundary>

          <div className="pos-history">
            <div className="section-heading">
              <div>
                <p className="dashboard-kicker">Saved bills</p>
                <h2>Recent invoices</h2>
              </div>
            </div>
            {invoices.slice(0, 8).map((row) => (
              <button
                type="button"
                key={row.orderId}
                disabled={Boolean(openingInvoice) || saving}
                onClick={() => openSavedInvoice(row.orderId)}
              >
                <span>
                  <strong>
                    {openingInvoice === row.orderId ? "Opening bill…" : row.invoiceNumber}
                  </strong>
                  <small>
                    {row.customerName} · {new Date(row.createdAt).toLocaleString()}
                  </small>
                </span>
                <span>
                  {money(business.currency, row.totalAmount)}
                  <small>{row.paymentStatus}</small>
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Desktop / Tablet Checkout Rail */}
        <aside className="pos-checkout desktop-checkout">
          {customerSelectorBlock}
          <PosCart
            cart={cart}
            setCart={setCart}
            update={update}
            remove={remove}
            canOverride={canOverride}
            business={business}
            subtotal={subtotal}
            lineDiscount={lineDiscount}
            globalDiscount={globalDiscount}
            offerDiscount={offerDiscount}
            estimatedTax={estimatedTax}
            estimatedTotal={estimatedTotal}
            discountType={discountType}
            setDiscountType={setDiscountType}
            discountValue={discountValue}
            setDiscountValue={setDiscountValue}
            activePaymentOffers={activePaymentOffers}
            offerCode={offerCode}
            setOfferCode={setOfferCode}
            offerNotice={offerNotice}
            selectedOffer={selectedOffer}
            couponCode={couponCode}
            setCouponCode={setCouponCode}
            customerMode={customerMode}
            customerId={customerId}
            customers={customers}
            loyaltyPointsRedeemed={loyaltyPointsRedeemed}
            setLoyaltyPointsRedeemed={setLoyaltyPointsRedeemed}
            money={money}
          />
          <PosPaymentSection
            payments={payments}
            setPayments={setPayments}
            setPayment={setPayment}
            createPaymentRow={createPaymentRow}
            METHODS={METHODS}
            business={business}
            estimatedTotal={estimatedTotal}
            qrPaymentSelected={qrPaymentSelected}
            qr={qr}
            qrAmount={qrAmount}
            saving={saving}
            checkout={checkout}
            cartLength={cart.length}
            money={money}
          />
        </aside>
      </div>

      {/* Mobile Sticky Bottom Summary Bar (< 768px) */}
      <div className="pos-mobile-bottom-bar">
        <div className="pos-mobile-bar-info">
          <span className="pos-mobile-bar-units">
            {cart.length} {cart.length === 1 ? 'item' : 'items'} ({cartUnits} units)
          </span>
          <strong className="pos-mobile-bar-total">
            {money(business.currency, estimatedTotal)}
          </strong>
        </div>
        <Button
          variant="primary"
          size="md"
          type="button"
          onClick={() => {
            setMobileStep(cart.length ? 'cart' : 'cart');
            setMobileCartOpen(true);
          }}
          disabled={!cart.length}
        >
          View Cart ({cart.length}) →
        </Button>
      </div>

      {/* Mobile Cart / Checkout Drawer Sheet (< 768px) */}
      {mobileCartOpen && (
        <>
          <div
            className="pos-mobile-drawer-backdrop"
            role="presentation"
            onClick={() => setMobileCartOpen(false)}
          />
          <div
            className="pos-mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile POS Checkout"
          >
            <div className="pos-mobile-drawer-header">
              <div className="pos-mobile-drawer-tabs">
                <button
                  type="button"
                  className={mobileStep === 'cart' ? 'active' : ''}
                  onClick={() => setMobileStep('cart')}
                >
                  1. Items ({cart.length})
                </button>
                <button
                  type="button"
                  className={mobileStep === 'pay' ? 'active' : ''}
                  onClick={() => setMobileStep('pay')}
                >
                  2. Payment ({money(business.currency, estimatedTotal)})
                </button>
              </div>
              <button
                type="button"
                className="pos-mobile-drawer-close"
                aria-label="Close cart drawer"
                onClick={() => setMobileCartOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="pos-mobile-drawer-content">
              {mobileStep === 'cart' ? (
                <>
                  <PosCart
                    cart={cart}
                    setCart={setCart}
                    update={update}
                    remove={remove}
                    canOverride={canOverride}
                    business={business}
                    subtotal={subtotal}
                    lineDiscount={lineDiscount}
                    globalDiscount={globalDiscount}
                    offerDiscount={offerDiscount}
                    estimatedTax={estimatedTax}
                    estimatedTotal={estimatedTotal}
                    discountType={discountType}
                    setDiscountType={setDiscountType}
                    discountValue={discountValue}
                    setDiscountValue={setDiscountValue}
                    activePaymentOffers={activePaymentOffers}
                    offerCode={offerCode}
                    setOfferCode={setOfferCode}
                    offerNotice={offerNotice}
                    selectedOffer={selectedOffer}
                    couponCode={couponCode}
                    setCouponCode={setCouponCode}
                    customerMode={customerMode}
                    customerId={customerId}
                    customers={customers}
                    loyaltyPointsRedeemed={loyaltyPointsRedeemed}
                    setLoyaltyPointsRedeemed={setLoyaltyPointsRedeemed}
                    money={money}
                  />
                  <div className="pos-mobile-step-action">
                    <Button
                      variant="primary"
                      size="lg"
                      type="button"
                      onClick={() => setMobileStep('pay')}
                      disabled={!cart.length}
                    >
                      Proceed to Payment ({money(business.currency, estimatedTotal)}) →
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {customerSelectorBlock}
                  <PosPaymentSection
                    payments={payments}
                    setPayments={setPayments}
                    setPayment={setPayment}
                    createPaymentRow={createPaymentRow}
                    METHODS={METHODS}
                    business={business}
                    estimatedTotal={estimatedTotal}
                    qrPaymentSelected={qrPaymentSelected}
                    qr={qr}
                    qrAmount={qrAmount}
                    saving={saving}
                    checkout={checkout}
                    cartLength={cart.length}
                    money={money}
                  />
                  <div className="pos-mobile-step-action">
                    <Button
                      variant="secondary"
                      size="md"
                      type="button"
                      onClick={() => setMobileStep('cart')}
                    >
                      ← Back to Cart
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      <footer className="pos-statusbar">
        <span><i />Stockroom · POS Terminal</span>
        <span>Register #02 · {billingType === "wholesale" ? "Wholesale" : "Retail"} Mode</span>
        <span>{business.currency === "INR" ? "Node ap-south-1 · Mumbai" : "Workspace Region"}</span>
        <span className="pos-statusbar-suite">Enterprise Retail OS</span>
      </footer>

      {invoice && (
        <PosReceiptModal invoice={invoice} onClose={() => setInvoice(null)} />
      )}
    </section>
  );
}
