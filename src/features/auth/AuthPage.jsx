import { useState } from "react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { authApi } from "../../api/authApi.js";
import "./AuthPage.css";

const AUTH_COPY = {
  signin: { title: "Welcome", subtitle: "Sign in to your account to continue.", submit: "LOG IN" },
  signup: { title: "Create Account", subtitle: "Welcome! Set up your workspace in just a few seconds.", submit: "SIGN UP" },
  forgot: { title: "Reset Password", subtitle: "Enter your email to receive a recovery code.", submit: "SEND CODE" },
  reset: { title: "New Password", subtitle: "Enter your reset code and set a new password.", submit: "UPDATE PASSWORD" },
};

const iconProps = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
const IconEye = () => (<svg {...iconProps}><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" /><circle cx="12" cy="12" r="3" /></svg>);
const IconEyeOff = () => (<svg {...iconProps}><path d="M9.9 4.24A10.4 10.4 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.61 3.81M6.53 6.53A18.6 18.6 0 0 0 1 12s4 8 11 8a10.9 10.9 0 0 0 5.47-1.47M14.12 14.12a3 3 0 1 1-4.24-4.24" /><path d="m1 1 22 22" /></svg>);
const IconMail = () => (<svg {...iconProps} strokeWidth={2}><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>);
const IconLock = () => (<svg {...iconProps} strokeWidth={2}><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>);
const IconChevronUp = () => (<svg {...iconProps} strokeWidth={2.2}><polyline points="18 15 12 9 6 15" /></svg>);

const DEMO_INDUSTRIES = [
  { id: "all", label: "All Industries" },
  { id: "pharmacy", label: "Pharmacy" },
  { id: "clothing", label: "Clothing & Apparel" },
  { id: "electronics", label: "Electronics" },
  { id: "grocery", label: "Grocery & Mart" },
  { id: "hardware", label: "Hardware & Tools" },
  { id: "automobile", label: "Automobile Parts" },
  { id: "wholesale", label: "Wholesale Trading" },
  { id: "retail", label: "Retail Corner Store" },
  { id: "restaurant", label: "Restaurant & Kitchen" },
  { id: "manufacturing", label: "Manufacturing" },
  { id: "other", label: "General Goods" },
];

const DEMO_ACCOUNTS = [
  // Pharmacy
  { roleName: "Pharmacy Owner", industry: "pharmacy", email: "owner@pharmacy.stockroom.test", password: "Demo@12345", role: "owner", badge: "Shop Owner" },
  { roleName: "Pharmacy Manager", industry: "pharmacy", email: "manager@pharmacy.stockroom.test", password: "Demo@12345", role: "team", badge: "Manager" },
  { roleName: "Pharmacy Staff", industry: "pharmacy", email: "staff@pharmacy.stockroom.test", password: "Demo@12345", role: "team", badge: "Staff" },

  // Clothing
  { roleName: "Clothing Owner", industry: "clothing", email: "owner@clothing.stockroom.test", password: "Demo@12345", role: "owner", badge: "Shop Owner" },
  { roleName: "Clothing Manager", industry: "clothing", email: "manager@clothing.stockroom.test", password: "Demo@12345", role: "team", badge: "Manager" },
  { roleName: "Clothing Sales Staff", industry: "clothing", email: "staff@clothing.stockroom.test", password: "Demo@12345", role: "team", badge: "Staff" },

  // Electronics
  { roleName: "Electronics Owner", industry: "electronics", email: "owner@electronics.stockroom.test", password: "Demo@12345", role: "owner", badge: "Shop Owner" },
  { roleName: "Electronics Manager", industry: "electronics", email: "manager@electronics.stockroom.test", password: "Demo@12345", role: "team", badge: "Manager" },
  { roleName: "Electronics Staff", industry: "electronics", email: "staff@electronics.stockroom.test", password: "Demo@12345", role: "team", badge: "Staff" },

  // Grocery
  { roleName: "Grocery Owner", industry: "grocery", email: "owner@grocery.stockroom.test", password: "Demo@12345", role: "owner", badge: "Shop Owner" },
  { roleName: "Grocery Manager", industry: "grocery", email: "manager@grocery.stockroom.test", password: "Demo@12345", role: "team", badge: "Manager" },
  { roleName: "Grocery Cashier", industry: "grocery", email: "staff@grocery.stockroom.test", password: "Demo@12345", role: "team", badge: "Staff" },

  // Hardware
  { roleName: "Hardware Owner", industry: "hardware", email: "owner@hardware.stockroom.test", password: "Demo@12345", role: "owner", badge: "Shop Owner" },
  { roleName: "Hardware Manager", industry: "hardware", email: "manager@hardware.stockroom.test", password: "Demo@12345", role: "team", badge: "Manager" },
  { roleName: "Hardware Sales Staff", industry: "hardware", email: "staff@hardware.stockroom.test", password: "Demo@12345", role: "team", badge: "Staff" },

  // Automobile
  { roleName: "AutoParts Owner", industry: "automobile", email: "owner@automobile.stockroom.test", password: "Demo@12345", role: "owner", badge: "Shop Owner" },
  { roleName: "AutoParts Manager", industry: "automobile", email: "manager@automobile.stockroom.test", password: "Demo@12345", role: "team", badge: "Manager" },
  { roleName: "AutoParts Staff", industry: "automobile", email: "staff@automobile.stockroom.test", password: "Demo@12345", role: "team", badge: "Staff" },

  // Wholesale
  { roleName: "Wholesale Owner", industry: "wholesale", email: "owner@wholesale.stockroom.test", password: "Demo@12345", role: "owner", badge: "Shop Owner" },
  { roleName: "Wholesale Manager", industry: "wholesale", email: "manager@wholesale.stockroom.test", password: "Demo@12345", role: "team", badge: "Manager" },
  { roleName: "Wholesale Dispatch Staff", industry: "wholesale", email: "staff@wholesale.stockroom.test", password: "Demo@12345", role: "team", badge: "Staff" },

  // Retail
  { roleName: "Retail Store Owner", industry: "retail", email: "owner@retail.stockroom.test", password: "Demo@12345", role: "owner", badge: "Shop Owner" },
  { roleName: "Retail Store Manager", industry: "retail", email: "manager@retail.stockroom.test", password: "Demo@12345", role: "team", badge: "Manager" },
  { roleName: "Retail Counter Staff", industry: "retail", email: "staff@retail.stockroom.test", password: "Demo@12345", role: "team", badge: "Staff" },

  // Restaurant
  { roleName: "Restaurant Owner", industry: "restaurant", email: "owner@restaurant.stockroom.test", password: "Demo@12345", role: "owner", badge: "Shop Owner" },
  { roleName: "Restaurant Manager", industry: "restaurant", email: "manager@restaurant.stockroom.test", password: "Demo@12345", role: "team", badge: "Manager" },
  { roleName: "Restaurant Staff", industry: "restaurant", email: "staff@restaurant.stockroom.test", password: "Demo@12345", role: "team", badge: "Staff" },

  // Manufacturing
  { roleName: "Manufacturing Owner", industry: "manufacturing", email: "owner@manufacturing.stockroom.test", password: "Demo@12345", role: "owner", badge: "Shop Owner" },
  { roleName: "Plant Manager", industry: "manufacturing", email: "manager@manufacturing.stockroom.test", password: "Demo@12345", role: "team", badge: "Manager" },
  { roleName: "Factory Floor Staff", industry: "manufacturing", email: "staff@manufacturing.stockroom.test", password: "Demo@12345", role: "team", badge: "Staff" },

  // Other
  { roleName: "General Goods Owner", industry: "other", email: "owner@other.stockroom.test", password: "Demo@12345", role: "owner", badge: "Shop Owner" },
  { roleName: "Operations Manager", industry: "other", email: "manager@other.stockroom.test", password: "Demo@12345", role: "team", badge: "Manager" },
  { roleName: "Warehouse Staff", industry: "other", email: "staff@other.stockroom.test", password: "Demo@12345", role: "team", badge: "Staff" },

  // Base Demo
  { roleName: "Aflix Default Admin", industry: "all", email: "demo@stockroom.test", password: "demo12345", role: "owner", badge: "Base Demo" },
];

export default function AuthPage({
  initialReset = "",
  initialMode = "signin",
  onAuthenticated,
  onBackToHome,
}) {
  const [mode, setMode] = useState(initialReset ? "reset" : initialMode);
  const [role, setRole] = useState("owner");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(true);
  const [demoIndustryFilter, setDemoIndustryFilter] = useState("all");
  const [message, setMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [resetToken, setResetToken] = useState(initialReset);
  const copy = AUTH_COPY[mode];

  const filteredDemoAccounts = demoIndustryFilter === "all"
    ? DEMO_ACCOUNTS
    : DEMO_ACCOUNTS.filter(
        (acc) => acc.industry === demoIndustryFilter || acc.industry === "all"
      );

  const goToMode = (next) => {
    setMode(next);
    setMessage(null);
    setShowPassword(false);
  };

  const clearResetUrl = () => {
    try {
      window.history.replaceState({}, "", window.location.pathname);
    } catch {
      /* history unavailable - non-fatal */
    }
  };

  const triggerLogin = async (loginEmail, loginPassword, loginRole) => {
    if (submitting) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const result = await authApi.login({
        email: loginEmail.toLowerCase().trim(),
        password: loginPassword,
        role: loginRole,
      });
      onAuthenticated({ user: result.user, business: result.business });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectDemoAccount = (acc, autoLogin = false) => {
    setIdentifier(acc.email);
    setPassword(acc.password || "Demo@12345");
    setRole(acc.role);
    setMessage(null);

    if (autoLogin) {
      triggerLogin(acc.email, acc.password || "Demo@12345", acc.role);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const rawIdentifier = String(
      data.get("identifier") || identifier || ""
    ).trim();
    const email = rawIdentifier.includes("@")
      ? rawIdentifier.toLowerCase()
      : (rawIdentifier ? `${rawIdentifier.replace(/\s+/g, "_").toLowerCase()}@stockroom.test` : "");
    const formPassword = String(data.get("password") || password || "");
    const name = String(data.get("name") || "").trim();

    if (mode === "signin") {
      if (!rawIdentifier) {
        return setMessage({
          type: "error",
          text: "Please enter your email or username.",
        });
      }
      if (!formPassword) {
        return setMessage({
          type: "error",
          text: "Please enter your password.",
        });
      }
      return triggerLogin(email, formPassword, role);
    }

    if (mode === "forgot") {
      if (!rawIdentifier)
        return setMessage({
          type: "error",
          text: "Enter your username or email.",
        });
      setSubmitting(true);
      try {
        const result = await authApi.forgotPassword({ email });
        setResetToken(result.resetToken || "");
        setMode("reset");
        setShowPassword(false);
        setMessage({
          type: "success",
          text: result.resetToken
            ? `Reset code created for ${result.email}. It is filled in below - set a new password.`
            : result.message,
        });
      } catch (error) {
        setMessage({ type: "error", text: error.message });
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (mode === "reset") {
      const token = String(data.get("token") || "").trim();
      if (!token)
        return setMessage({
          type: "error",
          text: "Enter the reset code from your email.",
        });
      if (formPassword.length < 8)
        return setMessage({
          type: "error",
          text: "Your password must contain at least 8 characters.",
        });
      if (formPassword !== data.get("confirmPassword"))
        return setMessage({
          type: "error",
          text: "The passwords do not match.",
        });
      setSubmitting(true);
      try {
        const result = await authApi.resetPassword({ token, password: formPassword });
        clearResetUrl();
        onAuthenticated({ user: result.user, business: result.business });
        setMessage(null);
      } catch (error) {
        setMessage({ type: "error", text: error.message });
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (mode === "signup") {
      if (!rawIdentifier)
        return setMessage({
          type: "error",
          text: "Enter a username or email.",
        });
      if (formPassword.length < 8)
        return setMessage({
          type: "error",
          text: "Your password must contain at least 8 characters.",
        });
      if (formPassword !== data.get("confirmPassword"))
        return setMessage({
          type: "error",
          text: "The passwords do not match.",
        });
      setSubmitting(true);
      try {
        await authApi.register({ email, password: formPassword, role, name: name || rawIdentifier });
        setMode("signin");
        setMessage({
          type: "success",
          text: "Account created successfully. Sign in with your details.",
        });
        setIdentifier("");
        setPassword("");
        form.reset();
      } catch (error) {
        setMessage({ type: "error", text: error.message });
      } finally {
        setSubmitting(false);
      }
      return;
    }
  };

  const footer =
    mode === "signup"
      ? { text: "Already have an account?", cta: "Log In", go: "signin" }
      : mode === "forgot" || mode === "reset"
      ? { text: "Remembered your password?", cta: "Log In", go: "signin" }
      : { text: "Are you new?", cta: "Create an Account", go: "signup" };

  return (
    <main className="auth-motion-stage">
      <div className="auth-framed-canvas">
        <div className="auth-stage-layout">
          <div className="auth-form-column">
            <MotionConfig transition={{ type: "spring", bounce: 0.15, visualDuration: 0.38 }}>
              <AnimatePresence mode="wait">
                <motion.div
                  className="auth-card-inner"
                  key={mode}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 14 }}
                >
                  {onBackToHome && (
                    <button
                      type="button"
                      onClick={onBackToHome}
                      className="auth-back-home-link"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-soft, #6b5d4f)',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                        marginBottom: '1rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: 0,
                      }}
                    >
                      ← Back to Home
                    </button>
                  )}
                  <div className="auth-card-header">
                    <h1 className="auth-title">{copy.title}</h1>
                    {copy.subtitle && <p className="auth-subtitle">{copy.subtitle}</p>}
                  </div>

                  {(mode === "signin" || mode === "signup") && (
                    <div className="auth-role-tabs" role="tablist" aria-label="Account type">
                      <button
                        className={role === "owner" ? "active" : ""}
                        type="button"
                        onClick={() => setRole("owner")}
                      >
                        Shop Owner
                      </button>
                      <button
                        className={role === "team" ? "active" : ""}
                        type="button"
                        onClick={() => setRole("team")}
                      >
                        Team Member
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="auth-form" noValidate>
                    {mode === "signup" && (
                      <div className="auth-field">
                        <label htmlFor="auth-name">Full Name</label>
                        <div className="auth-input-wrap">
                          <input
                            id="auth-name"
                            name="name"
                            type="text"
                            required
                            placeholder="Jonathan Reichert"
                            autoComplete="name"
                          />
                        </div>
                      </div>
                    )}

                    {mode !== "reset" && (
                      <div className="auth-field">
                        <label htmlFor="auth-identifier">
                          {mode === "signin" ? "Email" : "Email or Username"}
                        </label>
                        <div className="auth-input-wrap with-leading-icon">
                          <span className="auth-input-leading-icon email-icon" aria-hidden="true">
                            <IconMail />
                          </span>
                          <input
                            id="auth-identifier"
                            name="identifier"
                            type="text"
                            required
                            value={identifier}
                            onChange={(e) => {
                              setIdentifier(e.target.value);
                              if (message) setMessage(null);
                            }}
                            placeholder={mode === "signin" ? "owner@pharmacy.stockroom.test" : "you@company.com or username"}
                            autoComplete={mode === "signin" ? "username" : "email"}
                          />
                        </div>
                      </div>
                    )}

                    {mode === "reset" && (
                      <div className="auth-field">
                        <label htmlFor="auth-token">Reset Code</label>
                        <div className="auth-input-wrap">
                          <input
                            id="auth-token"
                            name="token"
                            required
                            placeholder="Paste the code from your email"
                            defaultValue={resetToken}
                          />
                        </div>
                      </div>
                    )}

                    {mode !== "forgot" && (
                      <div className="auth-field">
                        <label htmlFor="auth-password">
                          {mode === "reset" ? "New Password" : "Password"}
                        </label>
                        <div className="auth-input-wrap with-leading-icon has-toggle">
                          <span className="auth-input-leading-icon lock-icon" aria-hidden="true">
                            <IconLock />
                          </span>
                          <input
                            id="auth-password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            required
                            value={password}
                            onChange={(e) => {
                              setPassword(e.target.value);
                              if (message) setMessage(null);
                            }}
                            placeholder="Please enter your password"
                            autoComplete={mode === "signup" ? "new-password" : "current-password"}
                          />
                          <button
                            type="button"
                            className="auth-eye-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <IconEyeOff /> : <IconEye />}
                          </button>
                        </div>
                      </div>
                    )}

                    {(mode === "signup" || mode === "reset") && (
                      <div className="auth-field">
                        <label htmlFor="auth-confirm-password">Confirm Password</label>
                        <div className="auth-input-wrap has-toggle">
                          <input
                            id="auth-confirm-password"
                            name="confirmPassword"
                            type={showPassword ? "text" : "password"}
                            required
                            placeholder="Repeat your password"
                            autoComplete="new-password"
                          />
                        </div>
                      </div>
                    )}

                    {mode === "signin" && (
                      <div className="auth-forgot-row">
                        <a
                          href="#forgot"
                          className="auth-forgot-link"
                          onClick={(event) => {
                            event.preventDefault();
                            goToMode("forgot");
                          }}
                        >
                          Forgot your password?
                        </a>
                      </div>
                    )}

                    <div className="auth-action-row">
                      <button
                        className="auth-submit-btn"
                        type="submit"
                        disabled={submitting}
                      >
                        {submitting ? "..." : copy.submit}
                      </button>
                    </div>

                    {message && (
                      <p className={`form-status ${message.type}`} role="alert">{message.text}</p>
                    )}

                    {mode === "signin" && (
                      <div className="auth-demo-section">
                        <div className="auth-demo-header">
                          <button
                            type="button"
                            className="auth-demo-toggle-btn"
                            onClick={() => setShowDemoAccounts(!showDemoAccounts)}
                            aria-expanded={showDemoAccounts}
                            aria-controls="auth-demo-list"
                          >
                            <span className="auth-demo-toggle-title">Demo accounts (one per role)</span>
                            <span className={`auth-demo-chevron ${showDemoAccounts ? "open" : ""}`} aria-hidden="true">
                              <IconChevronUp />
                            </span>
                          </button>
                        </div>

                        {showDemoAccounts && (
                          <div id="auth-demo-list" className="auth-demo-card">
                            <div className="auth-demo-filter-bar">
                              <select
                                value={demoIndustryFilter}
                                onChange={(e) => setDemoIndustryFilter(e.target.value)}
                                className="auth-demo-industry-select"
                                aria-label="Filter demo accounts by industry"
                              >
                                {DEMO_INDUSTRIES.map((ind) => (
                                  <option key={ind.id} value={ind.id}>
                                    {ind.label}
                                  </option>
                                ))}
                              </select>
                              <span className="auth-demo-hint">Click row to auto-fill</span>
                            </div>

                            <div className="auth-demo-table" role="list">
                              {filteredDemoAccounts.map((acc) => {
                                const isSelected = identifier.toLowerCase() === acc.email.toLowerCase();
                                return (
                                  <div
                                    key={acc.email}
                                    role="listitem"
                                    tabIndex={0}
                                    className={`auth-demo-row ${isSelected ? "selected" : ""}`}
                                    onClick={() => handleSelectDemoAccount(acc)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        handleSelectDemoAccount(acc);
                                      }
                                    }}
                                    title={`Click to fill ${acc.roleName} credentials`}
                                  >
                                    <div className="auth-demo-role-col">
                                      <span className="auth-demo-role-name">{acc.roleName}</span>
                                      <span className={`auth-demo-role-pill ${acc.role}`}>
                                        {acc.badge}
                                      </span>
                                    </div>
                                    <div className="auth-demo-email-col">
                                      <span className="auth-demo-email">{acc.email}</span>
                                      {isSelected && (
                                        <span className="auth-demo-check" title="Active selection">✓</span>
                                      )}
                                      <button
                                        type="button"
                                        className="auth-demo-quick-login-btn"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSelectDemoAccount(acc, true);
                                        }}
                                        title="Quick 1-click Sign In"
                                      >
                                        ⚡ Log in
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </form>

                  <div className="auth-switch-line">
                    <span>{footer.text} </span>
                    <button
                      type="button"
                      className="auth-switch-action"
                      onClick={() => {
                        if (mode === "forgot" || mode === "reset") clearResetUrl();
                        goToMode(footer.go);
                      }}
                    >
                      {footer.cta}
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </MotionConfig>
          </div>

          <div className="auth-illustration-column" aria-hidden="true">
            <div className="auth-illustration-wrap">
              <div className="auth-illustration-ambient" />
              <img
                src="/auth-illustration.jpg"
                alt="Aflix Inventory Analytics"
                className="auth-illustration-img"
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
