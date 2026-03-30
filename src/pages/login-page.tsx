import { useMemo, useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { AppLogo } from '@/components/app-logo';
import { signInWithPhonePassword } from '@/lib/firebase-auth';
import {
  DEFAULT_PHONE_COUNTRY_CODE,
  getSriLankaLocalPhoneInput,
  isValidE164Phone,
  normalizePhoneForAuth,
} from '@/lib/phone-auth';

/* ─────────────────────────────────────────────
   Fonts + CSS injected once
───────────────────────────────────────────── */
const fontLink = document.createElement('link');
fontLink.rel = 'stylesheet';
fontLink.href =
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap';
if (!document.querySelector('[href*="Cormorant+Garamond"]')) document.head.appendChild(fontLink);

const CSS = `
  :root {
    --sage: #C3D8C1;
    --sage-light: #D9EBD7;
    --sage-deep: #7A9E78;
    --sage-dark: #A3BFA1;
    --ink: #0D0D0D;
    --paper: #FAFAF8;
    --cloud: #EFEFEF;
    --mist: #D4D4D4;
    --ash: #757575;
    --white: #FFFFFF;
    --red: #C0392B;
    --fd: 'Cormorant Garamond', serif;
    --fs: 'DM Sans', sans-serif;
    --ease: cubic-bezier(0.22, 1, 0.36, 1);
  }

  .lp-login-root {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 1fr 1fr;
    font-family: var(--fs);
    background: var(--paper);
    overflow: hidden;
  }

  /* ── Left panel ── */
  .lp-login-left {
    position: relative;
    background: var(--ink);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 48px 56px;
    overflow: hidden;
  }

  /* Background decoration */
  .lp-login-left-glow {
    position: absolute; inset: 0; pointer-events: none;
    background:
      radial-gradient(ellipse at 15% 20%, rgba(195,216,193,0.10) 0%, transparent 55%),
      radial-gradient(ellipse at 85% 80%, rgba(195,216,193,0.07) 0%, transparent 50%);
  }
  .lp-login-left-grid {
    position: absolute; inset: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
    background-size: 48px 48px;
  }

  /* Brand */
  .lp-login-brand {
    display: flex; align-items: center; gap: 10px;
    position: relative; z-index: 1;
    text-decoration: none;
    animation: lp-auth-fadeUp 0.6s 0.1s var(--ease) both;
  }
  .lp-login-brand-mark {
    width: 44px; height: 44px; border-radius: 12px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.16);
    box-shadow: 0 10px 24px rgba(0,0,0,0.18);
    overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .lp-login-brand-copy {
    display: flex;
    flex-direction: column;
    gap: 3px;
    line-height: 1;
  }
  .lp-login-brand-name {
    font-family: var(--fd); font-size: 20px; font-weight: 600;
    color: rgba(255,255,255,0.9); letter-spacing: -0.3px;
  }
  .lp-login-brand-tagline {
    font-size: 10px; font-weight: 600;
    color: rgba(195,216,193,0.85);
    letter-spacing: 0.35px;
    text-transform: uppercase;
  }

  /* Left hero copy */
  .lp-login-left-body {
    position: relative; z-index: 1;
    animation: lp-auth-fadeUp 0.7s 0.25s var(--ease) both;
  }
  .lp-login-left-eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(195,216,193,0.12);
    border: 1px solid rgba(195,216,193,0.2);
    border-radius: 999px; padding: 5px 14px; margin-bottom: 28px;
  }
  .lp-login-left-eyebrow-dot {
    width: 6px; height: 6px; border-radius: 50%; background: var(--sage);
    box-shadow: 0 0 6px var(--sage);
  }
  .lp-login-left-eyebrow span {
    font-size: 11px; font-weight: 600; color: var(--sage);
    letter-spacing: 0.6px; text-transform: uppercase;
  }
  .lp-login-left-h1 {
    font-family: var(--fd); font-size: clamp(44px, 4.5vw, 68px);
    font-weight: 700; color: var(--white);
    line-height: 1.04; letter-spacing: -1.5px;
    margin-bottom: 20px;
  }
  .lp-login-left-h1 em { font-style: italic; color: var(--sage); }
  .lp-login-left-sub {
    font-size: 15px; color: rgba(255,255,255,0.45);
    line-height: 1.75; max-width: 380px;
  }

  /* Brand testimonial chip */
  .lp-login-left-footer {
    position: relative; z-index: 1;
    animation: lp-auth-fadeUp 0.7s 0.4s var(--ease) both;
  }
  .lp-login-left-stat-row {
    display: flex; align-items: center; gap: 24px;
    padding-top: 32px; border-top: 1px solid rgba(255,255,255,0.08);
  }
  .lp-login-left-stat { display: flex; flex-direction: column; gap: 3px; }
  .lp-login-left-stat-num {
    font-family: var(--fd); font-size: 28px; font-weight: 700;
    color: var(--white); letter-spacing: -0.8px; line-height: 1;
  }
  .lp-login-left-stat-num span { color: var(--sage); }
  .lp-login-left-stat-label { font-size: 12px; color: rgba(255,255,255,0.35); }
  .lp-login-left-stat-divider { width: 1px; height: 40px; background: rgba(255,255,255,0.08); }

  /* ── Right panel ── */
  .lp-login-right {
    display: flex; align-items: center; justify-content: center;
    padding: 64px 56px;
    position: relative;
  }

  .lp-login-form-wrap {
    width: 100%; max-width: 420px;
    animation: lp-auth-fadeUp 0.7s 0.15s var(--ease) both;
  }

  /* Header */
  .lp-login-form-header { margin-bottom: 40px; }
  .lp-login-form-eyebrow {
    font-size: 12px; font-weight: 600; color: var(--sage-deep);
    letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 10px;
  }
  .lp-login-form-title {
    font-family: var(--fd); font-size: 38px; font-weight: 700;
    color: var(--ink); letter-spacing: -1px; line-height: 1.08;
    margin-bottom: 10px;
  }
  .lp-login-form-sub {
    font-size: 14px; color: var(--ash); line-height: 1.6;
  }

  /* Fields */
  .lp-auth-fields { display: flex; flex-direction: column; gap: 18px; }

  .lp-field-label {
    display: block; font-size: 12px; font-weight: 600;
    color: var(--ink); letter-spacing: 0.2px; margin-bottom: 8px;
  }

  .lp-input-wrap {
    position: relative; display: flex; align-items: center;
    background: var(--white);
    border: 1.5px solid var(--cloud);
    border-radius: 12px;
    transition: border-color 0.2s, box-shadow 0.2s;
    overflow: hidden;
  }
  .lp-input-wrap:focus-within {
    border-color: var(--ink);
    box-shadow: 0 0 0 3px rgba(13,13,13,0.06);
  }
  .lp-input-wrap.lp-input-error {
    border-color: var(--red);
    box-shadow: 0 0 0 3px rgba(192,57,43,0.08);
  }

  .lp-input-prefix {
    padding: 0 14px; display: flex; align-items: center; justify-content: center;
    color: var(--ash); flex-shrink: 0;
  }
  .lp-input-prefix svg { width: 16px; height: 16px; }

  .lp-input-country {
    display: flex;
    align-items: center;
    height: 100%;
    padding: 0 14px 0 0;
    margin-right: 14px;
    border-right: 1px solid var(--cloud);
    color: var(--ink);
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.2px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .lp-text-input {
    flex: 1; height: 52px;
    border: none; outline: none; background: transparent;
    font-family: var(--fs); font-size: 15px; font-weight: 500;
    color: var(--ink); padding: 0 16px;
  }
  .lp-text-input::placeholder { color: var(--mist); font-weight: 400; }
  .lp-text-input:not(:first-child) { padding-left: 0; }

  .lp-eye-btn {
    width: 48px; height: 52px; border: none; background: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: var(--ash); transition: color 0.2s;
    flex-shrink: 0;
  }
  .lp-eye-btn:hover { color: var(--ink); }
  .lp-eye-btn svg { width: 17px; height: 17px; }

  /* Error */
  .lp-error-banner {
    display: flex; align-items: center; gap: 10px;
    background: rgba(192,57,43,0.06);
    border: 1px solid rgba(192,57,43,0.18);
    border-radius: 10px; padding: 12px 16px;
    font-size: 13px; color: var(--red);
    animation: lp-auth-shake 0.4s var(--ease);
  }
  .lp-error-banner svg { width: 15px; height: 15px; flex-shrink: 0; }

  /* Submit button */
  .lp-submit-btn {
    width: 100%; height: 52px;
    font-family: var(--fs); font-size: 15px; font-weight: 600;
    color: var(--white); background: var(--ink);
    border: none; border-radius: 12px; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
    box-shadow: 0 4px 16px rgba(13,13,13,0.2);
    margin-top: 8px;
  }
  .lp-submit-btn:hover:not(:disabled) {
    opacity: 0.88; transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(13,13,13,0.22);
  }
  .lp-submit-btn:active:not(:disabled) { transform: scale(0.98); }
  .lp-submit-btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .lp-submit-btn svg { width: 17px; height: 17px; }

  /* Spinner */
  .lp-spinner {
    width: 17px; height: 17px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: var(--white);
    animation: lp-spin 0.7s linear infinite;
  }

  /* Footer link */
  .lp-auth-footer-text {
    text-align: center; font-size: 13.5px; color: var(--ash);
    margin-top: 28px;
  }
  .lp-auth-footer-text a {
    color: var(--ink); font-weight: 600; text-decoration: none;
    border-bottom: 1.5px solid var(--sage);
    padding-bottom: 1px; transition: border-color 0.2s;
  }
  .lp-auth-footer-text a:hover { border-color: var(--ink); }

  /* Divider */
  .lp-auth-divider {
    display: flex; align-items: center; gap: 14px; margin: 24px 0;
  }
  .lp-auth-divider-line { flex: 1; height: 1px; background: var(--cloud); }
  .lp-auth-divider span { font-size: 12px; color: var(--mist); font-weight: 500; }

  /* Keyframes */
  @keyframes lp-auth-fadeUp {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: none; }
  }
  @keyframes lp-auth-shake {
    0%,100% { transform: translateX(0); }
    20%      { transform: translateX(-6px); }
    40%      { transform: translateX(6px); }
    60%      { transform: translateX(-4px); }
    80%      { transform: translateX(4px); }
  }
  @keyframes lp-spin {
    to { transform: rotate(360deg); }
  }
`;

if (!document.getElementById('lp-login-styles')) {
  const s = document.createElement('style');
  s.id = 'lp-login-styles';
  s.textContent = CSS;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────────
   SVG icons (inline — no react-icons dep needed
   in the output, but we keep the same logic)
───────────────────────────────────────────── */
function IconPhone() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="3" y="1" width="10" height="14" rx="2" />
      <circle cx="8" cy="12" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}
function IconLock() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="3" y="7" width="10" height="8" rx="2" />
      <path d="M5 7V5a3 3 0 016 0v2" />
      <circle cx="8" cy="11" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
function IconEye({ off }) {
  return off ? (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M2 2l12 12M6.5 6.6A3 3 0 0111.4 11M4.2 4.3C2.8 5.4 2 7 2 8s2.5 4 6 4c1.2 0 2.3-.3 3.2-.8" />
      <path d="M12.7 10.5C13.7 9.5 14 8 14 8s-2.5-4-6-4c-.4 0-.8 0-1.2.1" />
    </svg>
  ) : (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" />
      <circle cx="8" cy="8" r="1.8" />
    </svg>
  );
}
function IconArrow() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}
function IconAlert() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="8" r="6" />
      <path d="M8 5v4M8 11v.5" />
    </svg>
  );
}

const getLoginErrorMessage = (error: unknown) => {
  const code = typeof error === 'object' && error && 'code' in error
    ? String((error as { code?: string }).code ?? '')
    : '';

  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/user-not-found' ||
    code === 'auth/wrong-password' ||
    code === 'auth/invalid-login-credentials'
  ) {
    return 'Phone number or password is incorrect.';
  }

  return error instanceof Error ? error.message : 'Unable to sign in.';
};
/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */
export function LoginPage() {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password,    setPassword]    = useState('');
  const [showPw,      setShowPw]      = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [errorKey,    setErrorKey]    = useState(0); // re-trigger shake

  const canSubmit = useMemo(() => phoneNumber.trim() && password.trim(), [phoneNumber, password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const normalizedPhone = normalizePhoneForAuth(phoneNumber);
    if (!isValidE164Phone(normalizedPhone)) {
      setError('Enter a valid Sri Lankan mobile number.');
      setErrorKey(k => k + 1);
      return;
    }
    try {
      setLoading(true);
      await signInWithPhonePassword(normalizedPhone, password);
      navigate('/app/home', { replace: true });
    } catch (err) {
      setError(getLoginErrorMessage(err));
      setErrorKey(k => k + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lp-login-root">

      {/* ── Left panel ── */}
      <div className="lp-login-left">
        <div className="lp-login-left-glow" />
        <div className="lp-login-left-grid" />

        {/* Brand */}
        <Link to="/" className="lp-login-brand">
          <div className="lp-login-brand-mark"><AppLogo size={36} decorative /></div>
          <div className="lp-login-brand-copy">
            <span className="lp-login-brand-name">MatchMySize</span>
            <span className="lp-login-brand-tagline">Find Your Perfect Fit</span>
          </div>
        </Link>

        {/* Hero copy */}
        <div className="lp-login-left-body">
          <div className="lp-login-left-eyebrow">
            <div className="lp-login-left-eyebrow-dot" />
            <span>500+ brands supported</span>
          </div>
          <h2 className="lp-login-left-h1">
            Your size,<br /><em>every</em><br />brand.
          </h2>
          <p className="lp-login-left-sub">
            One set of measurements unlocks perfect sizing across every brand in our database — online and in-store.
          </p>
        </div>

        {/* Stats */}
        <div className="lp-login-left-footer">
          <div className="lp-login-left-stat-row">
            <div className="lp-login-left-stat">
              <span className="lp-login-left-stat-num">500<span>+</span></span>
              <span className="lp-login-left-stat-label">Brands</span>
            </div>
            <div className="lp-login-left-stat-divider" />
            <div className="lp-login-left-stat">
              <span className="lp-login-left-stat-num">98<span>%</span></span>
              <span className="lp-login-left-stat-label">Accuracy</span>
            </div>
            <div className="lp-login-left-stat-divider" />
            <div className="lp-login-left-stat">
              <span className="lp-login-left-stat-num">0</span>
              <span className="lp-login-left-stat-label">Returns from bad fit</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="lp-login-right">
        <div className="lp-login-form-wrap">

          {/* Header */}
          <div className="lp-login-form-header">
            <p className="lp-login-form-eyebrow">Welcome back</p>
            <h1 className="lp-login-form-title">Sign in</h1>
            <p className="lp-login-form-sub">
              Enter your registered phone number and password to continue.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="lp-auth-fields">

              {/* Phone */}
              <div>
                <label className="lp-field-label">Phone number</label>
                <div className={`lp-input-wrap${error ? ' lp-input-error' : ''}`}>
                  <div className="lp-input-prefix"><IconPhone /></div>
                  <div className="lp-input-country">{DEFAULT_PHONE_COUNTRY_CODE}</div>
                  <input
                    className="lp-text-input"
                    type="tel"
                    inputMode="numeric"
                    maxLength={9}
                    placeholder="77xxxxxxx"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(getSriLankaLocalPhoneInput(e.target.value))}
                    autoComplete="tel"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="lp-field-label">Password</label>
                <div className={`lp-input-wrap${error ? ' lp-input-error' : ''}`}>
                  <div className="lp-input-prefix"><IconLock /></div>
                  <input
                    className="lp-text-input"
                    type={showPw ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button type="button" className="lp-eye-btn" onClick={() => setShowPw(v => !v)}>
                    <IconEye off={showPw} />
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="lp-error-banner" key={errorKey}>
                  <IconAlert />
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                className="lp-submit-btn"
                disabled={!canSubmit || loading}>
                {loading
                  ? <><div className="lp-spinner" /> Signing in…</>
                  : <>Sign in <IconArrow /></>
                }
              </button>

            </div>
          </form>

          {/* Footer */}
          <p className="lp-auth-footer-text">
            New here?{' '}
            <Link to="/auth/register">Create an account</Link>
          </p>

        </div>
      </div>

    </div>
  );
}

export default LoginPage;
