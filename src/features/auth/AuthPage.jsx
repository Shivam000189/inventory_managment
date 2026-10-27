import { useState } from "react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { authApi } from "../../api/authApi.js";

const AUTH_COPY = {
  signin: { title: "Login", subtitle: "Welcome to log in to your background management system.", submit: "LOGIN" },
  signup: { title: "Create Account", subtitle: "Welcome! Set up your workspace in just a few seconds.", submit: "SIGN UP" },
  forgot: { title: "Reset Password", subtitle: "Enter your email to receive a recovery code.", submit: "SEND CODE" },
  reset: { title: "New Password", subtitle: "Enter your reset code and set a new password.", submit: "UPDATE PASSWORD" },
};

const iconProps = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
const IconEye = () => (<svg {...iconProps}><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" /><circle cx="12" cy="12" r="3" /></svg>);
const IconEyeOff = () => (<svg {...iconProps}><path d="M9.9 4.24A10.4 10.4 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.61 3.81M6.53 6.53A18.6 18.6 0 0 0 1 12s4 8 11 8a10.9 10.9 0 0 0 5.47-1.47M14.12 14.12a3 3 0 1 1-4.24-4.24" /><path d="m1 1 22 22" /></svg>);

export default function AuthPage({ initialReset = "", onAuthenticated }) {
  const [mode, setMode] = useState(initialReset ? "reset" : "signin");
  const [role, setRole] = useState("owner");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [resetToken, setResetToken] = useState(initialReset);
  const copy = AUTH_COPY[mode];

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const identifier = String(
      data.get("identifier") || data.get("email") || data.get("username") || ""
    ).trim();
    const email = identifier.includes("@")
      ? identifier.toLowerCase()
      : (identifier ? `${identifier.replace(/\s+/g, "_").toLowerCase()}@stockroom.test` : "");
    const password = String(data.get("password") || "");
    const name = String(data.get("name") || "").trim();

    if (mode === "forgot") {
      if (!identifier)
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
      if (password.length < 8)
        return setMessage({
          type: "error",
          text: "Your password must contain at least 8 characters.",
        });
      if (password !== data.get("confirmPassword"))
        return setMessage({
          type: "error",
          text: "The passwords do not match.",
        });
      setSubmitting(true);
      try {
        const result = await authApi.resetPassword({ token, password });
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
      if (!identifier)
        return setMessage({
          type: "error",
          text: "Enter a username or email.",
        });
      if (password.length < 8)
        return setMessage({
          type: "error",
          text: "Your password must contain at least 8 characters.",
        });
      if (password !== data.get("confirmPassword"))
        return setMessage({
          type: "error",
          text: "The passwords do not match.",
        });
      setSubmitting(true);
      try {
        await authApi.register({ email, password, role, name: name || identifier });
        setMode("signin");
        setMessage({
          type: "success",
          text: "Account created successfully. Sign in with your details.",
        });
        form.reset();
      } catch (error) {
        setMessage({ type: "error", text: error.message });
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!identifier)
      return setMessage({
        type: "error",
        text: "Please enter your username.",
      });
    if (!password)
      return setMessage({
        type: "error",
        text: "Please enter your password.",
      });

    setSubmitting(true);
    try {
      const result = await authApi.login({ email, password, role });
      onAuthenticated({ user: result.user, business: result.business });
      setMessage(null);
      form.reset();
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setSubmitting(false);
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
                        <div className="auth-input-wrap">
                          <input
                            id="auth-identifier"
                            name="identifier"
                            type="text"
                            required
                            placeholder={mode === "signin" ? "1185780732@qq.com" : "you@company.com or username"}
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
                        <div className="auth-input-wrap has-toggle">
                          <input
                            id="auth-password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            required
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
                          Forgot password?
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
