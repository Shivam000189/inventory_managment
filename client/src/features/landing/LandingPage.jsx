import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import Icon from "./components/LandingIcons.jsx";
import { DashboardMock, PhoneMock, TourPanel } from "./components/DeviceMockups.jsx";
import {
  BILLING_INTERVALS,
  FAQS,
  FEATURES,
  INDUSTRIES,
  MARQUEE_ITEMS,
  NAV_LINKS,
  PRICING_PLANS,
  STATS,
  STEPS,
  TESTIMONIALS,
  TOUR_TABS,
} from "./landingContent.js";
import "./landing.css";

const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
};

const stagger = (i) => ({ ...reveal, transition: { ...reveal.transition, delay: i * 0.07 } });

function CountUp({ value, decimals = 0, prefix = "", suffix = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / 1400, 1);
      setDisplay(value * (1 - Math.pow(1 - t, 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value]);

  return (
    <span ref={ref}>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}

const HERO_WORDS = ["calm", "smart", "fast", "happy"];

function RotatingWord() {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % HERO_WORDS.length), 2600);
    return () => clearInterval(id);
  }, [reduceMotion]);

  return (
    <span className="lp-rotator" aria-hidden="true">
      <AnimatePresence mode="wait" initial={false}>
        <motion.em
          key={HERO_WORDS[index]}
          initial={{ y: "0.45em", opacity: 0, filter: "blur(8px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: "-0.45em", opacity: 0, filter: "blur(8px)" }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          {HERO_WORDS[index]}
        </motion.em>
      </AnimatePresence>
      <svg className="lp-swash" viewBox="0 0 220 24" preserveAspectRatio="none">
        <path d="M4 17c40-9 92-13 140-10 26 2 48 5 72 9" />
      </svg>
    </span>
  );
}

function SectionHead({ eyebrow, title, accent, body, light }) {
  return (
    <motion.div className={`lp-section-head${light ? " light" : ""}`} {...reveal}>
      <span className="lp-eyebrow">{eyebrow}</span>
      <h2>
        {title} {accent && <em>{accent}</em>}
      </h2>
      {body && <p>{body}</p>}
    </motion.div>
  );
}

function Wave({ className, flip }) {
  return (
    <svg className={`lp-wave ${className || ""}`} viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true" style={flip ? { transform: "scaleY(-1)" } : undefined}>
      <path d="M0,64 C180,118 340,10 560,44 C760,76 900,118 1100,80 C1260,50 1360,30 1440,40 L1440,120 L0,120 Z" />
    </svg>
  );
}

export default function LandingPage({ onSignIn, onSignUp }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [tab, setTab] = useState(TOUR_TABS[0].key);
  const [openFaq, setOpenFaq] = useState(0);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const deviceY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const phoneY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const reduceMotion = useReducedMotion();
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const rotateX = useSpring(useTransform(tiltY, [-0.5, 0.5], [7, -7]), { stiffness: 120, damping: 18 });
  const rotateY = useSpring(useTransform(tiltX, [-0.5, 0.5], [-9, 9]), { stiffness: 120, damping: 18 });

  const handleTilt = (event) => {
    if (reduceMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    tiltX.set((event.clientX - rect.left) / rect.width - 0.5);
    tiltY.set((event.clientY - rect.top) / rect.height - 0.5);
  };
  const resetTilt = () => {
    tiltX.set(0);
    tiltY.set(0);
  };

  useEffect(() => {
    document.title = "Stockroom · Inventory, POS & billing for modern shops";
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    if (window.location.hash === "#pricing" || window.location.pathname === "/pricing") {
      setTimeout(() => {
        const el = document.getElementById("pricing");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 150);
    }
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const activeTab = TOUR_TABS.find((t) => t.key === tab);
  const year = new Date().getFullYear();

  return (
    <div className="lp">
      {/* ---------- Navigation ---------- */}
      <header className={`lp-nav${scrolled ? " scrolled" : ""}`}>
        <div className="lp-container lp-nav-inner">
          <a className="lp-logo" href="#top" aria-label="Stockroom home">
            <span className="lp-logo-mark"><i /></span>
            stockroom
          </a>
          <nav className="lp-nav-links" aria-label="Primary">
            {NAV_LINKS.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}
          </nav>
          <div className="lp-nav-actions">
            <button type="button" className="lp-btn lp-btn-ghost" onClick={onSignIn}>Sign in</button>
            <button type="button" className="lp-btn lp-btn-primary" onClick={onSignUp}>Start free <Icon name="arrow" size={15} /></button>
            <button type="button" className="lp-menu-toggle" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
              <Icon name={menuOpen ? "close" : "menu"} size={20} />
            </button>
          </div>
        </div>
        <AnimatePresence>
          {menuOpen && (
            <motion.div className="lp-mobile-menu" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {NAV_LINKS.map((l) => <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}>{l.label}</a>)}
              <div>
                <button type="button" className="lp-btn lp-btn-ghost" onClick={onSignIn}>Sign in</button>
                <button type="button" className="lp-btn lp-btn-primary" onClick={onSignUp}>Start free</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ---------- Hero ---------- */}
      <section className="lp-hero" id="top" ref={heroRef}>
        <div className="lp-hero-glow" aria-hidden="true" />
        <div className="lp-hero-aurora" aria-hidden="true"><i /><i /><i /></div>
        <div className="lp-hero-grid" aria-hidden="true" />
        <div className="lp-hero-grain" aria-hidden="true" />
        <div className="lp-container lp-hero-inner">
          <motion.div className="lp-hero-copy" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
            <span className="lp-badge">
              <b><i className="lp-live-dot" />New</b>
              POS terminal with UPI, split &amp; credit payments
              <Icon name="arrow" size={13} />
            </span>
            <h1 aria-label="Run your whole shop from one calm counter.">
              <span className="lp-h1-line">Run your whole</span>{" "}
              <span className="lp-h1-line">shop from one</span>{" "}
              <span className="lp-h1-line lp-h1-plain"><RotatingWord /> counter.</span>
            </h1>
            <p>
              Billing, stock, batches, purchasing and payments in one warm, fast workspace,
              built for pharmacies, grocers, wholesalers and every shop in between.
            </p>
            <div className="lp-hero-ctas">
              <button type="button" className="lp-btn lp-btn-cream lp-btn-lg lp-btn-shine" onClick={onSignUp}>Create free workspace <Icon name="arrow" size={17} /></button>
              <button type="button" className="lp-btn lp-btn-outline lp-btn-lg" onClick={onSignIn}>Sign in to dashboard</button>
            </div>
            <ul className="lp-hero-trust">
              <li><Icon name="check" size={14} />No card required</li>
              <li><Icon name="check" size={14} />GST-ready invoices</li>
              <li><Icon name="check" size={14} />Owner &amp; team logins</li>
            </ul>
          </motion.div>

          <div className="lp-hero-visual" onMouseMove={handleTilt} onMouseLeave={resetTilt}>
            <div className="lp-hero-halo" aria-hidden="true" />
            <motion.div className="lp-hero-stage" style={{ rotateX, rotateY }}>
              <motion.div className="lp-hero-device" style={{ y: deviceY }} initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}>
                <DashboardMock />
              </motion.div>
              <motion.div className="lp-hero-phone" style={{ y: phoneY }} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}>
                <PhoneMock variant="dashboard" />
              </motion.div>
              <motion.div className="lp-float lp-float-a" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8 }}>
                <span className="tone-green"><Icon name="download" size={15} /></span>
                <div><small>Collected today</small><b>₹41,900</b></div>
              </motion.div>
              <motion.div className="lp-float lp-float-b" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1 }}>
                <span className="tone-amber"><Icon name="alert" size={15} /></span>
                <div><small>Low stock</small><b>Paracetamol · 8 left</b></div>
              </motion.div>
              <motion.div className="lp-float lp-float-c" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.2 }}>
                <i className="lp-live-dot" />
                <div><small>UPI payment received</small><b>₹477.00 · Counter #01</b></div>
              </motion.div>
            </motion.div>
          </div>
        </div>
        <Wave className="lp-wave-cream" />
      </section>

      {/* ---------- Marquee ---------- */}
      <section className="lp-marquee-wrap" aria-label="Built for">
        <p>Built for the shops that keep India running</p>
        <div className="lp-marquee">
          <div className="lp-marquee-track">
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
              <span key={i}>{item}<i /></span>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Stats ---------- */}
      <section className="lp-container lp-stats">
        {STATS.map((s, i) => (
          <motion.div key={s.label} className="lp-stat" {...stagger(i)}>
            <strong><CountUp value={s.value} decimals={s.decimals} prefix={s.prefix} suffix={s.suffix} /></strong>
            <span>{s.label}</span>
          </motion.div>
        ))}
      </section>

      {/* ---------- Features ---------- */}
      <section className="lp-section" id="features">
        <div className="lp-container">
          <SectionHead
            eyebrow="Everything behind the counter"
            title="One workspace for stock, sales and"
            accent="the money in between."
            body="Each module talks to the others, so a sale updates stock, a delivery updates your supplier dues and the dashboard always tells the truth."
          />
          <div className="lp-bento">
            {FEATURES.map((f, i) => (
              <motion.article key={f.key} className={`lp-feature${f.size === "wide" ? " wide" : ""}`} {...stagger(i)}>
                <span className="lp-feature-icon"><Icon name={f.icon} size={22} /></span>
                <span className="lp-feature-eyebrow">{f.eyebrow}</span>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
                {f.points && (
                  <ul>
                    {f.points.map((p) => <li key={p}><Icon name="check" size={14} />{p}</li>)}
                  </ul>
                )}
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Product tour ---------- */}
      <section className="lp-section lp-tour" id="tour">
        <div className="lp-container">
          <SectionHead eyebrow="Product tour" title="Four tabs." accent="Your whole business." body="The same quick navigation you get on the dashboard. Pick a tab to look inside." />
          <motion.div className="lp-tour-tabs" role="tablist" aria-label="Product areas" {...reveal}>
            {TOUR_TABS.map((t) => (
              <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} className={tab === t.key ? "active" : ""} onClick={() => setTab(t.key)}>
                {tab === t.key && <motion.span layoutId="lp-tab-pill" className="lp-tab-pill" transition={{ type: "spring", bounce: 0.2, duration: 0.5 }} />}
                <span className="lp-tab-label">{t.label}</span>
              </button>
            ))}
          </motion.div>
          <div className="lp-tour-body">
            <AnimatePresence mode="wait">
              <motion.div key={tab} className="lp-tour-copy" initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 18 }} transition={{ duration: 0.35 }}>
                <h3>{activeTab.title}</h3>
                <p>{activeTab.body}</p>
                <ul>
                  {activeTab.bullets.map((b) => <li key={b}><span><Icon name="check" size={13} /></span>{b}</li>)}
                </ul>
                <button type="button" className="lp-link" onClick={onSignUp}>Try it on your own stock <Icon name="arrow" size={15} /></button>
              </motion.div>
            </AnimatePresence>
            <AnimatePresence mode="wait">
              <motion.div key={tab} className="lp-tour-visual" initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -12, scale: 0.98 }} transition={{ duration: 0.4 }}>
                <TourPanel tab={tab} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="lp-section">
        <div className="lp-container">
          <SectionHead eyebrow="Up and running today" title="From sign-up to first bill in" accent="three steps." />
          <div className="lp-steps">
            {STEPS.map((s, i) => (
              <motion.div key={s.n} className="lp-step" {...stagger(i)}>
                <span className="lp-step-n">{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Mobile ---------- */}
      <section className="lp-mobile">
        <Wave className="lp-wave-dark" flip />
        <div className="lp-container lp-mobile-inner">
          <SectionHead
            light
            eyebrow="In your pocket"
            title="Check the counter"
            accent="from anywhere."
            body="Stockroom is fully responsive. Owners check today's sales, approve purchase orders and see dues from their phone, with no app to install."
          />
          <div className="lp-phones">
            {["login", "dashboard", "payments"].map((v, i) => (
              <motion.div key={v} className={`lp-phones-item item-${i}`} {...stagger(i)}>
                <PhoneMock variant={v} />
              </motion.div>
            ))}
          </div>
        </div>
        <Wave className="lp-wave-cream" />
      </section>

      {/* ---------- Industries ---------- */}
      <section className="lp-section" id="industries">
        <div className="lp-container">
          <SectionHead eyebrow="Industry-aware" title="Tailored to the way" accent="you sell." body="Pick your industry at sign-up and Stockroom switches on the modules that matter: batches for pharmacies, variants for clothing, bulk slabs for wholesale." />
          <div className="lp-industries">
            {INDUSTRIES.map((ind, i) => (
              <motion.div key={ind.name} className="lp-industry" {...stagger(i)}>
                <span><Icon name={ind.icon} size={24} /></span>
                <div>
                  <h3>{ind.name}</h3>
                  <p>{ind.note}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Testimonials ---------- */}
      <section className="lp-section lp-testimonials">
        <div className="lp-container">
          <SectionHead eyebrow="Shopkeepers say" title="Quieter counters," accent="happier owners." />
          <div className="lp-quotes">
            {TESTIMONIALS.map((t, i) => (
              <motion.figure key={t.name} className="lp-quote" {...stagger(i)}>
                <div className="lp-stars" aria-label="5 out of 5">{[0, 1, 2, 3, 4].map((s) => <Icon key={s} name="star" size={14} />)}</div>
                <blockquote>“{t.quote}”</blockquote>
                <figcaption><i>{t.name.charAt(0)}</i><div><b>{t.name}</b><span>{t.place}</span></div></figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Plans & Pricing ---------- */}
      <section className="lp-section lp-pricing-section" id="pricing">
        <div className="lp-container">
          <div className="lp-pricing-header">
            <h2 className="lp-pricing-title">Plans &amp; Pricing</h2>
            <p className="lp-pricing-subtitle">Choose the right plan to manage your inventory.</p>

            <div className="lp-pricing-toggle-wrap">
              <div className="lp-pricing-toggle" role="tablist" aria-label="Billing frequency">
                {BILLING_INTERVALS.map((interval) => {
                  const isActive = billingCycle === interval.id;
                  return (
                    <button
                      key={interval.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={`lp-pricing-toggle-btn${isActive ? " active" : ""}`}
                      onClick={() => setBillingCycle(interval.id)}
                    >
                      {interval.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lp-pricing-grid">
            {PRICING_PLANS.map((plan, i) => {
              const activeInterval = BILLING_INTERVALS.find((it) => it.id === billingCycle) || BILLING_INTERVALS[0];
              const effectiveMonthly = Math.round(plan.basePrice * (1 - activeInterval.discount));
              const totalPrice = effectiveMonthly * activeInterval.months;
              const isPopular = plan.popular;

              let cadenceText = "Billed monthly";
              let totalText = `Total: ₹${effectiveMonthly} / month`;

              if (activeInterval.months === 3) {
                cadenceText = `Billed quarterly at ₹${totalPrice.toLocaleString("en-IN")}`;
                totalText = `Total: ₹${totalPrice.toLocaleString("en-IN")} / 3 months`;
              } else if (activeInterval.months === 6) {
                cadenceText = `Billed bi-annually at ₹${totalPrice.toLocaleString("en-IN")}`;
                totalText = `Total: ₹${totalPrice.toLocaleString("en-IN")} / 6 months`;
              }

              return (
                <motion.div
                  key={plan.id}
                  className={`lp-pricing-card${isPopular ? " popular" : ""}`}
                  {...stagger(i)}
                >
                  <div className="lp-pricing-card-header">
                    <div className="lp-pricing-card-title-row">
                      <h3 className="lp-pricing-card-name">{plan.name}</h3>
                      {plan.badge && (
                        <span className="lp-pricing-badge">{plan.badge}</span>
                      )}
                    </div>
                    <p className="lp-pricing-card-desc">{plan.description}</p>
                  </div>

                  <div className="lp-pricing-price-wrap">
                    <div className="lp-pricing-price-row">
                      <span className="lp-pricing-amount">₹{effectiveMonthly}</span>
                      <span className="lp-pricing-unit">/ month</span>
                    </div>
                    <span className="lp-pricing-cadence">{cadenceText}</span>
                  </div>

                  <div className="lp-pricing-divider" />

                  <ul className="lp-pricing-features">
                    {plan.features.map((feature, fi) => (
                      <li key={fi} className="lp-pricing-feature-item">
                        <span className="lp-pricing-check" aria-hidden="true">
                          <Icon name="check" size={15} />
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="lp-pricing-card-footer">
                    <button
                      type="button"
                      className={`lp-pricing-btn${isPopular ? " lp-pricing-btn-cream" : " lp-pricing-btn-dark"}`}
                      onClick={onSignUp}
                    >
                      {plan.ctaText}
                    </button>
                    <div className="lp-pricing-total-line">{totalText}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="lp-pricing-footnote-wrap">
            <p className="lp-pricing-footnote">
              All prices in INR. 10% off on 3-month billing and 20% off on 6-month billing.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="lp-section" id="faq">
        <div className="lp-container lp-faq-wrap">
          <SectionHead eyebrow="FAQ" title="Questions," accent="answered." body="Can't find what you're looking for? Sign in and reach us from inside the app." />
          <div className="lp-faq">
            {FAQS.map((f, i) => {
              const open = openFaq === i;
              return (
                <motion.div key={f.q} className={`lp-faq-item${open ? " open" : ""}`} {...stagger(i)}>
                  <button type="button" aria-expanded={open} onClick={() => setOpenFaq(open ? -1 : i)}>
                    {f.q}
                    <span><Icon name="plus" size={16} /></span>
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div className="lp-faq-answer" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                        <p>{f.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------- Final CTA ---------- */}
      <section className="lp-container">
        <motion.div className="lp-cta" {...reveal}>
          <div className="lp-hero-glow" aria-hidden="true" />
          <span className="lp-eyebrow">Open your counter</span>
          <h2>Your shop, finally <em>in order.</em></h2>
          <p>Create a free workspace in under a minute. Bring your team when you're ready.</p>
          <div className="lp-hero-ctas">
            <button type="button" className="lp-btn lp-btn-cream lp-btn-lg" onClick={onSignUp}>Start free <Icon name="arrow" size={17} /></button>
            <button type="button" className="lp-btn lp-btn-outline lp-btn-lg" onClick={onSignIn}>I already have an account</button>
          </div>
        </motion.div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner">
          <div className="lp-footer-brand">
            <a className="lp-logo" href="#top"><span className="lp-logo-mark"><i /></span>stockroom</a>
            <p>Inventory, POS and billing for modern shops.</p>
            <span className="lp-footer-secure"><Icon name="shield" size={15} />Encrypted sessions · Role-based access</span>
          </div>
          <div className="lp-footer-cols">
            <div><b>Product</b><a href="#features">Features</a><a href="#tour">Product tour</a><a href="#pricing">Pricing</a><a href="#industries">Industries</a></div>
            <div><b>Solutions</b><a href="#industries">Pharmacy</a><a href="#industries">Grocery</a><a href="#industries">Wholesale</a></div>
            <div><b>Account</b><button type="button" onClick={onSignIn}>Sign in</button><button type="button" onClick={onSignUp}>Create account</button><a href="#faq">Help &amp; FAQ</a></div>
          </div>
        </div>
        <div className="lp-container lp-footer-bottom">
          <span>© {year} Stockroom. All rights reserved.</span>
          <span><a href="#terms">Terms</a> · <a href="#privacy">Privacy</a></span>
        </div>
      </footer>
    </div>
  );
}
