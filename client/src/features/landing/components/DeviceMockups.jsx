// Product mockups drawn in HTML/CSS (no screenshots), based on the real
// dashboard, POS and mobile screens. Sample figures only.
import Icon from "./LandingIcons.jsx";

const KPIS = [
  { label: "Today's sales", value: "₹48,260", note: "Today's billing", tone: "green", icon: "trend" },
  { label: "Needs restocking", value: "12", note: "Reorder alert", tone: "amber", icon: "alert" },
  { label: "Expiring in 30 days", value: "7", note: "Expiry tracking", tone: "blue", icon: "clock" },
  { label: "Tracked batches", value: "1,284", note: "Batch records", tone: "brown", icon: "layers" },
];

const BARS = [38, 52, 44, 68, 58, 82, 74, 92, 70, 86, 64, 96];

const PRODUCTS = [
  { name: "Paracetamol 500mg", sku: "PH-1042", stock: 8, status: "low" },
  { name: "Vitamin C chewable", sku: "PH-2210", stock: 142, status: "ok" },
  { name: "Cough syrup 100ml", sku: "PH-0871", stock: 23, status: "exp" },
  { name: "ORS sachet orange", sku: "PH-3301", stock: 260, status: "ok" },
];

export function DashboardMock() {
  return (
    <div className="lp-window" aria-hidden="true">
      <div className="lp-window-bar">
        <span /><span /><span />
        <div className="lp-window-url">app.stockroom.in/dashboard</div>
      </div>
      <div className="lp-dash">
        <aside className="lp-dash-side">
          <div className="lp-dash-logo"><i />stockroom<b>PRO</b></div>
          {["Overview", "Inventory", "Purchases", "Orders / Sales", "Payments", "POS Terminal", "Reports"].map((item, i) => (
            <div key={item} className={`lp-dash-nav${i === 0 ? " active" : ""}`}><i />{item}</div>
          ))}
          <div className="lp-dash-sync"><i />Cloud sync active <b>99.9%</b></div>
        </aside>
        <div className="lp-dash-main">
          <div className="lp-dash-top">
            <div className="lp-dash-crumb"><i />Main store / <b>Dashboard</b></div>
            <div className="lp-dash-search"><Icon name="search" size={11} />Search products or SKU</div>
            <div className="lp-dash-avatar">S</div>
          </div>
          <small className="lp-dash-date">Thursday, October 1 · Store shift #1 open</small>
          <h4>Welcome back, Shubham</h4>
          <div className="lp-dash-kpis">
            {KPIS.map((kpi) => (
              <div key={kpi.label} className="lp-kpi">
                <div className="lp-kpi-head">
                  <span>{kpi.label}</span>
                  <em className={`tone-${kpi.tone}`}><Icon name={kpi.icon} size={10} /></em>
                </div>
                <strong>{kpi.value}</strong>
                <small className={`tone-${kpi.tone}`}><i />{kpi.note}</small>
              </div>
            ))}
          </div>
          <div className="lp-dash-grid">
            <div className="lp-dash-card">
              <div className="lp-dash-card-head"><b>Sales this week</b><span>+18.4%</span></div>
              <div className="lp-bars">
                {BARS.map((h, i) => <i key={i} style={{ height: `${h}%` }} />)}
              </div>
            </div>
            <div className="lp-dash-card">
              <div className="lp-dash-card-head"><b>Stock alerts</b><span className="red">3</span></div>
              {PRODUCTS.slice(0, 3).map((p) => (
                <div key={p.sku} className="lp-alert-row">
                  <i className={`dot-${p.status}`} />
                  <span>{p.name}</span>
                  <b>{p.stock}</b>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PhoneMock({ variant = "dashboard" }) {
  return (
    <div className="lp-phone" aria-hidden="true">
      <div className="lp-phone-notch" />
      <div className="lp-phone-screen">
        {variant === "dashboard" && (
          <>
            <div className="lp-ph-top"><span className="lp-ph-menu"><Icon name="menu" size={11} /></span><span className="lp-ph-avatar">S</span></div>
            <h5>Welcome back</h5>
            <div className="lp-ph-kpis">
              <div><small>Today's sales</small><b>₹48,260</b><em className="tone-green">● Billing</em></div>
              <div><small>Restock</small><b>12</b><em className="tone-amber">● Reorder</em></div>
              <div><small>Expiring</small><b>7</b><em className="tone-blue">● 30 days</em></div>
              <div><small>Expired</small><b>0</b><em className="tone-blue">● Clear</em></div>
            </div>
            <div className="lp-ph-pos">
              <div><small>POS bills</small><b>86</b></div>
              <div><small>Collected</small><b className="green">₹41,900</b></div>
            </div>
            <div className="lp-ph-btn">Open POS Terminal →</div>
          </>
        )}
        {variant === "payments" && (
          <>
            <h5>Payments</h5>
            <span className="lp-ph-pill">● Counter #01 online</span>
            <div className="lp-ph-tabs"><b>Sales payments</b><span>Vendor outflow</span></div>
            {[
              { l: "Sales collections today", v: "₹41,900.00", n: "86 transactions", icon: "download", tone: "green" },
              { l: "Purchases paid out", v: "₹18,450.00", n: "Across 4 vendors", icon: "upload", tone: "amber" },
              { l: "Outstanding dues", v: "₹6,320.00", n: "5 credit accounts", icon: "clock", tone: "red", red: true },
            ].map((c) => (
              <div key={c.l} className="lp-ph-card">
                <div><small>{c.l}</small><em className={`tone-${c.tone}`}><Icon name={c.icon} size={10} /></em></div>
                <b className={c.red ? "red" : ""}>{c.v}</b>
                <span>{c.n}</span>
              </div>
            ))}
          </>
        )}
        {variant === "login" && (
          <div className="lp-ph-login">
            <div className="lp-ph-login-hero">
              <span>stockroom</span>
              <svg viewBox="0 0 400 220" preserveAspectRatio="none"><path d="M0,140 C70,190 120,80 200,110 C270,135 310,70 400,90 L400,220 L0,220 Z" /></svg>
            </div>
            <div className="lp-ph-login-body">
              <h5>Sign in</h5>
              <div className="lp-ph-switch"><b>⌂ Shop owner</b><span>♧ Team member</span></div>
              <small>Email</small>
              <div className="lp-ph-input">you@yourbusiness.com</div>
              <small>Password</small>
              <div className="lp-ph-input">••••••••••</div>
              <div className="lp-ph-btn">Login</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function TourPanel({ tab }) {
  if (tab === "inventory") {
    return (
      <div className="lp-tour-mock">
        <div className="lp-tour-mock-head"><b>Inventory overview</b><span>View all →</span></div>
        <div className="lp-tour-filters"><div><Icon name="search" size={12} />Search products or SKU</div><span>All categories ▾</span></div>
        <div className="lp-table">
          <div className="lp-table-row head"><span>Product</span><span>SKU</span><span>Stock</span><span>Status</span></div>
          {PRODUCTS.map((p) => (
            <div key={p.sku} className="lp-table-row">
              <span>{p.name}</span><span className="mono">{p.sku}</span><span>{p.stock}</span>
              <span><em className={`lp-chip chip-${p.status}`}>{p.status === "low" ? "Low stock" : p.status === "exp" ? "Expiring" : "In stock"}</em></span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (tab === "purchasing") {
    return (
      <div className="lp-tour-mock">
        <div className="lp-tour-mock-head"><b>Purchase order PO-0218</b><span className="lp-chip chip-ok">Partially received</span></div>
        <div className="lp-po-steps">
          {["Draft", "Ordered", "Receiving", "Closed"].map((s, i) => (
            <div key={s} className={i < 3 ? "done" : ""}><i>{i < 2 ? <Icon name="check" size={10} /> : i + 1}</i>{s}</div>
          ))}
        </div>
        <div className="lp-table">
          <div className="lp-table-row head"><span>Item</span><span>Ordered</span><span>Received</span><span>Cost</span></div>
          {[["Paracetamol 500mg", 200, 200, "₹1,840"], ["Cough syrup 100ml", 60, 36, "₹2,160"], ["Bandage roll 5cm", 120, 0, "₹960"]].map((r) => (
            <div key={r[0]} className="lp-table-row"><span>{r[0]}</span><span>{r[1]}</span><span>{r[2]}</span><span>{r[3]}</span></div>
          ))}
        </div>
        <div className="lp-tour-foot"><span>Supplier · Shree Medical Distributors</span><b>₹4,960</b></div>
      </div>
    );
  }
  if (tab === "sales") {
    return (
      <div className="lp-tour-mock lp-pos-mock">
        <div className="lp-pos-items">
          <div className="lp-tour-mock-head"><b>POS · Counter #01</b><span className="lp-chip chip-ok">Shift open</span></div>
          {[["Vitamin C chewable", "2 × ₹120", "₹240"], ["ORS sachet orange", "5 × ₹22", "₹110"], ["Paracetamol 500mg", "1 × ₹32", "₹32"], ["Hand sanitiser 200ml", "1 × ₹95", "₹95"]].map((r) => (
            <div key={r[0]} className="lp-pos-line"><div><b>{r[0]}</b><small>{r[1]}</small></div><span>{r[2]}</span></div>
          ))}
        </div>
        <div className="lp-pos-pay">
          <small>Total payable</small>
          <strong>₹477.00</strong>
          <div className="lp-pos-methods"><b>UPI</b><span>Cash</span><span>Card</span><span>Credit</span></div>
          <div className="lp-qr"><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
          <div className="lp-ph-btn">Complete sale</div>
        </div>
      </div>
    );
  }
  return (
    <div className="lp-tour-mock">
      <div className="lp-tour-mock-head"><b>Business profile</b><span className="lp-chip chip-ok">INR · Pharmacy</span></div>
      <div className="lp-form-grid">
        {[["Business name", "Main Street Pharmacy"], ["Industry", "Pharmacy ▾"], ["Business type", "Retail ▾"], ["Currency", "INR ▾"], ["Phone", "+91 98765 43210"], ["Country", "India"]].map(([l, v]) => (
          <div key={l}><small>{l}</small><div className="lp-ph-input">{v}</div></div>
        ))}
      </div>
      <div className="lp-team-row">
        {[["S", "Owner"], ["R", "Manager"], ["A", "Cashier"], ["+", "Invite"]].map(([a, r]) => (
          <div key={r}><i>{a}</i><span>{r}</span></div>
        ))}
      </div>
    </div>
  );
}
