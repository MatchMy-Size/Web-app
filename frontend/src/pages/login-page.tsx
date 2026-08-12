import { useMemo, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import loginFigures from '@/assets/images/loginfigures.png';
import { AppLogo } from '@/components/app-logo';
import { signInWithPhonePassword } from '@/lib/auth-api';
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
    --sage-light: #EEF3EC;
    --sage-deep: #496657;
    --sage-dark: #536B55;
    --ink: #111111;
    --charcoal: #101210;
    --paper: #FAFAF7;
    --cloud: #EFEFEF;
    --line: #E5E6E2;
    --mist: #D4D4D4;
    --ash: #666863;
    --white: #FFFFFF;
    --red: #C0392B;
    --fd: 'Cormorant Garamond', serif;
    --fs: 'DM Sans', sans-serif;
    --ease: cubic-bezier(0.22, 1, 0.36, 1);
  }

  .lp-login-root {
    min-height: 100vh;
    display: grid;
    grid-template-columns: minmax(420px, 44vw) minmax(0, 1fr);
    font-family: var(--fs);
    background: var(--paper);
    overflow: hidden;
  }

  /* ── Left panel ── */
  .lp-login-left {
    position: relative;
    background: var(--charcoal);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 42px clamp(32px, 4vw, 56px) 34px;
    overflow: hidden;
  }

  /* Background decoration */
  .lp-login-left-glow {
    position: absolute; inset: 0; pointer-events: none;
    background:
      radial-gradient(ellipse at 40% 52%, rgba(238,243,236,0.09) 0%, transparent 48%),
      radial-gradient(ellipse at 15% 18%, rgba(73,102,87,0.16) 0%, transparent 48%),
      linear-gradient(180deg, rgba(16,18,16,0.16), rgba(16,18,16,0.82));
  }
  .lp-login-left-grid {
    position: absolute; inset: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
    background-size: 48px 48px;
  }
  .lp-login-left::before,
  .lp-login-left::after {
    content: '';
    position: absolute;
    pointer-events: none;
    border: 1px solid rgba(195,216,193,0.08);
    border-radius: 50%;
    transform: rotate(-16deg);
  }
  .lp-login-left::before {
    width: 560px;
    height: 210px;
    left: -180px;
    top: 24%;
  }
  .lp-login-left::after {
    width: 640px;
    height: 260px;
    right: -300px;
    bottom: 9%;
  }

  /* Brand */
  .lp-login-brand {
    display: flex; align-items: center; gap: 10px;
    position: relative; z-index: 3;
    text-decoration: none;
    animation: lp-auth-formIn 0.65s 0.08s var(--ease) both;
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

  /* Left artwork */
  .lp-login-left-body {
    position: relative;
    z-index: 2;
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 26px 0 14px;
  }
  .lp-login-visual-stage {
    position: relative;
    width: min(100%, 560px);
    height: min(72vh, 720px);
    min-height: 480px;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }
  .lp-login-visual-stage::before {
    content: '';
    position: absolute;
    left: 8%;
    right: 2%;
    bottom: 9%;
    height: 38%;
    border: 1px solid rgba(238,243,236,0.08);
    border-radius: 50%;
    transform: rotate(11deg);
  }
  .lp-login-figure {
    position: relative;
    z-index: 2;
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center bottom;
    filter: saturate(0.92) contrast(0.98);
    animation: lp-auth-artIn 0.78s 0.18s var(--ease) both;
  }

  /* Editorial footer */
  .lp-login-left-footer {
    position: relative; z-index: 3;
    animation: lp-auth-formIn 0.7s 0.28s var(--ease) both;
  }
  .lp-login-editorial-copy {
    display: flex;
    flex-direction: column;
    gap: 5px;
    color: rgba(195,216,193,0.74);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.26em;
    line-height: 1.5;
    text-transform: uppercase;
  }

  /* ── Right panel ── */
  .lp-login-right {
    display: flex; align-items: center; justify-content: center;
    padding: 64px clamp(36px, 6vw, 78px);
    position: relative;
    background: var(--paper);
  }

  .lp-login-form-wrap {
    width: 100%; max-width: 430px;
    animation: lp-auth-formIn 0.7s 0.12s var(--ease) both;
  }

  .lp-login-mobile-brand,
  .lp-login-mobile-art {
    display: none;
  }

  /* Header */
  .lp-login-form-header { margin-bottom: 34px; }
  .lp-login-form-eyebrow {
    font-size: 11px; font-weight: 700; color: var(--sage-deep);
    letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 12px;
  }
  .lp-login-form-title {
    font-family: var(--fd); font-size: clamp(42px, 4vw, 56px); font-weight: 700;
    color: var(--ink); letter-spacing: -1px; line-height: 1.02;
    margin-bottom: 14px;
  }
  .lp-login-form-title em {
    display: block;
    color: var(--sage-deep);
    font-style: italic;
  }
  .lp-login-form-sub {
    font-size: 14.5px; color: var(--ash); line-height: 1.65;
    max-width: 390px;
  }

  /* Fields */
  .lp-auth-fields { display: flex; flex-direction: column; gap: 18px; }

  .lp-field-label {
    display: block; font-size: 12px; font-weight: 600;
    color: var(--ink); letter-spacing: 0.2px; margin-bottom: 8px;
  }

  .lp-input-wrap {
    position: relative; display: flex; align-items: center;
    min-height: 52px;
    background: var(--white);
    border: 1px solid var(--line);
    border-radius: 12px;
    transition: border-color 0.2s, box-shadow 0.2s;
    overflow: hidden;
  }
  .lp-input-wrap:focus-within {
    border-color: var(--sage-deep);
    box-shadow: 0 0 0 3px rgba(73,102,87,0.08);
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
    border-right: 1px solid var(--line);
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
    background: #182019;
    transform: translateY(-1px);
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
    margin-top: 26px;
  }
  .lp-auth-footer-text a {
    color: var(--ink); font-weight: 600; text-decoration: none;
    border-bottom: 1.5px solid var(--sage);
    padding-bottom: 1px; transition: border-color 0.2s;
  }
  .lp-auth-footer-text a:hover { border-color: var(--ink); }

  .lp-forgot-password {
    display: flex;
    justify-content: flex-end;
    margin-top: -8px;
  }
  .lp-forgot-password a {
    color: var(--ink);
    font-size: 12.5px;
    font-weight: 600;
    text-decoration: none;
    border-bottom: 1px solid var(--sage);
  }
  .lp-forgot-password a:hover { border-color: var(--ink); }

  .lp-success-banner {
    display: flex;
    align-items: center;
    background: rgba(122,158,120,0.1);
    border: 1px solid rgba(122,158,120,0.28);
    border-radius: 10px;
    color: #4b7249;
    font-size: 13px;
    line-height: 1.45;
    margin-bottom: 20px;
    padding: 12px 14px;
  }

  /* Divider */
  .lp-auth-divider {
    display: flex; align-items: center; gap: 14px; margin: 24px 0 0;
  }
  .lp-auth-divider-line { flex: 1; height: 1px; background: var(--line); }
  .lp-auth-divider span {
    font-size: 11.5px;
    color: var(--ash);
    font-weight: 600;
    letter-spacing: 0.04em;
    white-space: nowrap;
  }

  /* Keyframes */
  @keyframes lp-auth-artIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: none; }
  }
  @keyframes lp-auth-formIn {
    from { opacity: 0; transform: translateY(5px); }
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

  @media (max-width: 1100px) {
    body .lp-login-root {
      grid-template-columns: minmax(360px, 42vw) minmax(0, 1fr);
    }
    body .lp-login-left {
      display: flex;
      padding-left: 32px;
      padding-right: 32px;
    }
    body .lp-login-visual-stage {
      min-height: 420px;
      height: min(68vh, 620px);
    }
    body .lp-login-right {
      min-height: 100vh;
      padding: 54px 34px;
    }
  }

  @media (max-width: 768px) {
    body .lp-login-root {
      display: block;
      min-height: 100vh;
      min-height: 100dvh;
      overflow-x: hidden;
      background: var(--paper);
    }
    body .lp-login-left {
      display: none;
    }
    body .lp-login-right {
      min-height: 100vh;
      min-height: 100dvh;
      padding: 24px 20px 36px;
      align-items: flex-start;
      justify-content: center;
    }
    body .lp-login-form-wrap {
      width: 100%;
      max-width: 430px;
      margin: 0 auto;
    }
    body .lp-login-mobile-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      margin-bottom: 18px;
      animation: lp-auth-formIn 0.65s 0.05s var(--ease) both;
    }
    body .lp-login-mobile-brand .lp-login-brand-mark {
      width: 40px;
      height: 40px;
      background: var(--white);
      border-color: rgba(17,17,17,0.08);
      box-shadow: 0 8px 20px rgba(17,17,17,0.06);
    }
    body .lp-login-mobile-brand .lp-login-brand-name {
      color: var(--ink);
    }
    body .lp-login-mobile-brand .lp-login-brand-tagline {
      color: var(--sage-deep);
    }
    body .lp-login-mobile-art {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 210px;
      margin: 0 -6px 26px;
      overflow: hidden;
      animation: lp-auth-artIn 0.78s 0.12s var(--ease) both;
    }
    body .lp-login-mobile-art::before {
      content: '';
      position: absolute;
      width: 285px;
      height: 96px;
      border: 1px solid rgba(73,102,87,0.12);
      border-radius: 50%;
      transform: rotate(-10deg);
    }
    body .lp-login-mobile-art::after {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 52px;
      background: linear-gradient(180deg, rgba(250,250,247,0), var(--paper));
      pointer-events: none;
    }
    body .lp-login-mobile-figure {
      position: relative;
      z-index: 1;
      width: 100%;
      height: 100%;
      object-fit: contain;
      object-position: center center;
      filter: saturate(0.96) contrast(0.98);
    }
    body .lp-login-form-header {
      margin-bottom: 26px;
    }
    body .lp-login-form-title {
      font-size: clamp(38px, 11vw, 48px);
    }
    body .lp-login-form-sub {
      font-size: 14px;
    }
    body .lp-auth-fields {
      gap: 16px;
    }
  }

  @media (max-width: 380px) {
    body .lp-login-right {
      padding: 20px 16px 32px;
    }
    body .lp-login-mobile-art {
      height: 166px;
      margin-bottom: 22px;
    }
    body .lp-login-form-title {
      font-size: 36px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .lp-login-brand,
    .lp-login-left-body,
    .lp-login-left-footer,
    .lp-login-figure,
    .lp-login-mobile-brand,
    .lp-login-mobile-art,
    .lp-login-form-wrap,
    .lp-error-banner,
    .lp-spinner {
      animation: none !important;
      transition: none !important;
    }
  }
`;

const loginStyles = document.getElementById('lp-login-styles');
if (loginStyles) {
  loginStyles.textContent = CSS;
} else {
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
function IconEye({ off }: { off: boolean }) {
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
  const location = useLocation();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password,    setPassword]    = useState('');
  const [showPw,      setShowPw]      = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [errorKey,    setErrorKey]    = useState(0); // re-trigger shake
  const passwordReset = Boolean(
    location.state && typeof location.state === 'object' && 'passwordReset' in location.state
      && location.state.passwordReset,
  );

  const canSubmit = useMemo(() => phoneNumber.trim() && password.trim(), [phoneNumber, password]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
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

        {/* Artwork */}
        <div className="lp-login-left-body">
          <div className="lp-login-visual-stage" aria-hidden="true">
            <img className="lp-login-figure" src={loginFigures} alt="" draggable={false} />
          </div>
        </div>

        {/* Editorial copy */}
        <div className="lp-login-left-footer">
          <div className="lp-login-editorial-copy">
            <span>One profile.</span>
            <span>Every brand.</span>
            <span>Your fit.</span>
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="lp-login-right">
        <div className="lp-login-form-wrap">
          <Link to="/" className="lp-login-mobile-brand">
            <div className="lp-login-brand-mark"><AppLogo size={32} decorative /></div>
            <div className="lp-login-brand-copy">
              <span className="lp-login-brand-name">MatchMySize</span>
              <span className="lp-login-brand-tagline">Find Your Perfect Fit</span>
            </div>
          </Link>

          <div className="lp-login-mobile-art" aria-hidden="true">
            <img className="lp-login-mobile-figure" src={loginFigures} alt="" draggable={false} />
          </div>

          {/* Header */}
          <div className="lp-login-form-header">
            <p className="lp-login-form-eyebrow">WELCOME BACK</p>
            <h1 className="lp-login-form-title">Find your perfect <em>fit again.</em></h1>
            <p className="lp-login-form-sub">
              Sign in to access your measurements, saved sizes and brand matches.
            </p>
          </div>

          {passwordReset && (
            <div className="lp-success-banner" role="status">
              Password updated successfully. Please sign in with your new password.
            </div>
          )}

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

              <div className="lp-forgot-password">
                <Link to="/auth/forgot-password">Forgot password?</Link>
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
            New to MatchMySize?{' '}
            <Link to="/auth/register">Create an account</Link>
          </p>

          <div className="lp-auth-divider" aria-hidden="true">
            <div className="lp-auth-divider-line" />
            <span>500+ brands · One sizing profile</span>
            <div className="lp-auth-divider-line" />
          </div>

        </div>
      </div>

    </div>
  );
}

export default LoginPage;
