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
  { roleName: "Pharmacy Admin", industry: "pharmacy", email: "owner@pharmacy.stockroom.test", password: "Demo@12345", role: "owner", badge: "Admin" },
  { roleName: "Pharmacy Salesperson", industry: "pharmacy", email: "staff@pharmacy.stockroom.test", password: "Demo@12345", role: "team", badge: "Salesperson" },

  // Clothing
  { roleName: "Clothing Admin", industry: "clothing", email: "owner@clothing.stockroom.test", password: "Demo@12345", role: "owner", badge: "Admin" },
  { roleName: "Clothing Salesperson", industry: "clothing", email: "staff@clothing.stockroom.test", password: "Demo@12345", role: "team", badge: "Salesperson" },

  // Electronics
  { roleName: "Electronics Admin", industry: "electronics", email: "owner@electronics.stockroom.test", password: "Demo@12345", role: "owner", badge: "Admin" },
  { roleName: "Electronics Salesperson", industry: "electronics", email: "staff@electronics.stockroom.test", password: "Demo@12345", role: "team", badge: "Salesperson" },

  // Grocery
  { roleName: "Grocery Admin", industry: "grocery", email: "owner@grocery.stockroom.test", password: "Demo@12345", role: "owner", badge: "Admin" },
  { roleName: "Grocery Salesperson", industry: "grocery", email: "staff@grocery.stockroom.test", password: "Demo@12345", role: "team", badge: "Salesperson" },

  // Hardware
  { roleName: "Hardware Admin", industry: "hardware", email: "owner@hardware.stockroom.test", password: "Demo@12345", role: "owner", badge: "Admin" },
  { roleName: "Hardware Salesperson", industry: "hardware", email: "staff@hardware.stockroom.test", password: "Demo@12345", role: "team", badge: "Salesperson" },

  // Automobile
  { roleName: "AutoParts Admin", industry: "automobile", email: "owner@automobile.stockroom.test", password: "Demo@12345", role: "owner", badge: "Admin" },
  { roleName: "AutoParts Salesperson", industry: "automobile", email: "staff@automobile.stockroom.test", password: "Demo@12345", role: "team", badge: "Salesperson" },

  // Wholesale
  { roleName: "Wholesale Admin", industry: "wholesale", email: "owner@wholesale.stockroom.test", password: "Demo@12345", role: "owner", badge: "Admin" },
  { roleName: "Wholesale Salesperson", industry: "wholesale", email: "staff@wholesale.stockroom.test", password: "Demo@12345", role: "team", badge: "Salesperson" },

  // Retail
  { roleName: "Retail Store Admin", industry: "retail", email: "owner@retail.stockroom.test", password: "Demo@12345", role: "owner", badge: "Admin" },
  { roleName: "Retail Salesperson", industry: "retail", email: "staff@retail.stockroom.test", password: "Demo@12345", role: "team", badge: "Salesperson" },

  // Restaurant
  { roleName: "Restaurant Admin", industry: "restaurant", email: "owner@restaurant.stockroom.test", password: "Demo@12345", role: "owner", badge: "Admin" },
  { roleName: "Restaurant Salesperson", industry: "restaurant", email: "staff@restaurant.stockroom.test", password: "Demo@12345", role: "team", badge: "Salesperson" },

  // Manufacturing
  { roleName: "Manufacturing Admin", industry: "manufacturing", email: "owner@manufacturing.stockroom.test", password: "Demo@12345", role: "owner", badge: "Admin" },
  { roleName: "Manufacturing Salesperson", industry: "manufacturing", email: "staff@manufacturing.stockroom.test", password: "Demo@12345", role: "team", badge: "Salesperson" },

  // Other
  { roleName: "General Goods Admin", industry: "other", email: "owner@other.stockroom.test", password: "Demo@12345", role: "owner", badge: "Admin" },
  { roleName: "General Goods Salesperson", industry: "other", email: "staff@other.stockroom.test", password: "Demo@12345", role: "team", badge: "Salesperson" },

  // Base Demo
  { roleName: "Aflix Default Admin", industry: "all", email: "demo@stockroom.test", password: "demo12345", role: "owner", badge: "Admin" },
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
              <svg
                viewBox="0 0 460 380"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="auth-illustration-img"
                style={{ width: '100%', height: 'auto', maxHeight: '390px', borderRadius: '16px' }}
              >
                <rect width="460" height="380" rx="16" fill="var(--surface, #ffffff)" stroke="var(--line, #e2e8f0)" strokeWidth="1.5" />
                {/* Header bar */}
                <rect x="24" y="24" width="140" height="18" rx="5" fill="var(--brand, #3b82f6)" fillOpacity="0.15" />
                <rect x="24" y="52" width="220" height="12" rx="4" fill="var(--muted, #94a3b8)" fillOpacity="0.25" />
                <rect x="360" y="24" width="76" height="26" rx="13" fill="#10b981" fillOpacity="0.12" />
                <circle cx="374" cy="37" r="4" fill="#10b981" />

                {/* Stat Cards Row */}
                <rect x="24" y="86" width="128" height="74" rx="10" fill="var(--surface-subtle, #f8fafc)" stroke="var(--line, #e2e8f0)" />
                <rect x="36" y="98" width="60" height="10" rx="3" fill="var(--muted, #94a3b8)" fillOpacity="0.3" />
                <rect x="36" y="116" width="80" height="20" rx="4" fill="var(--brand, #3b82f6)" fillOpacity="0.85" />
                <rect x="36" y="142" width="48" height="8" rx="2" fill="#10b981" fillOpacity="0.7" />

                <rect x="166" y="86" width="128" height="74" rx="10" fill="var(--surface-subtle, #f8fafc)" stroke="var(--line, #e2e8f0)" />
                <rect x="178" y="98" width="60" height="10" rx="3" fill="var(--muted, #94a3b8)" fillOpacity="0.3" />
                <rect x="178" y="116" width="88" height="20" rx="4" fill="#10b981" fillOpacity="0.85" />
                <rect x="178" y="142" width="56" height="8" rx="2" fill="var(--brand, #3b82f6)" fillOpacity="0.7" />

                <rect x="308" y="86" width="128" height="74" rx="10" fill="var(--surface-subtle, #f8fafc)" stroke="var(--line, #e2e8f0)" />
                <rect x="320" y="98" width="54" height="10" rx="3" fill="var(--muted, #94a3b8)" fillOpacity="0.3" />
                <rect x="320" y="116" width="72" height="20" rx="4" fill="#f59e0b" fillOpacity="0.85" />
                <rect x="320" y="142" width="50" height="8" rx="2" fill="var(--muted, #94a3b8)" fillOpacity="0.5" />

                {/* Chart Graphic */}
                <rect x="24" y="176" width="412" height="120" rx="10" fill="var(--surface-subtle, #f8fafc)" stroke="var(--line, #e2e8f0)" />
                <line x1="44" y1="210" x2="416" y2="210" stroke="var(--line, #e2e8f0)" strokeDasharray="3 3" />
                <line x1="44" y1="240" x2="416" y2="240" stroke="var(--line, #e2e8f0)" strokeDasharray="3 3" />
                <line x1="44" y1="270" x2="416" y2="270" stroke="var(--line, #e2e8f0)" strokeDasharray="3 3" />

                {/* Visual Area Trendline */}
                <path d="M 44 260 Q 90 220, 136 235 T 228 195 T 320 225 T 412 185 L 412 280 L 44 280 Z" fill="url(#authChartGrad)" opacity="0.35" />
                <path d="M 44 260 Q 90 220, 136 235 T 228 195 T 320 225 T 412 185" stroke="var(--brand, #3b82f6)" strokeWidth="3" strokeLinecap="round" />

                {/* Table preview lines */}
                <rect x="24" y="312" width="412" height="44" rx="8" fill="var(--surface-subtle, #f8fafc)" stroke="var(--line, #e2e8f0)" />
                <circle cx="44" cy="334" r="8" fill="var(--brand, #3b82f6)" fillOpacity="0.2" />
                <rect x="62" y="328" width="110" height="12" rx="3" fill="var(--text, #1e293b)" fillOpacity="0.75" />
                <rect x="260" y="328" width="60" height="12" rx="3" fill="#10b981" fillOpacity="0.2" />
                <rect x="360" y="328" width="56" height="12" rx="3" fill="var(--brand, #3b82f6)" fillOpacity="0.8" />

                <defs>
                  <linearGradient id="authChartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand, #3b82f6)" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="var(--brand, #3b82f6)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
