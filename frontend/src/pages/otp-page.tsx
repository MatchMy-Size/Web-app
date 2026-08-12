import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { AppLogo } from '@/components/app-logo';
import {
  clearOtpSession,
  clearPendingRegistration,
  getOtpSession,
  getPendingRegistration,
  setOtpSession,
} from '@/lib/auth-flow';
import { saveCustomerProfile } from '@/lib/customer-profile';
import { createUserWithPhonePassword } from '@/lib/auth-api';
import { requestOtpViaTextLk, verifyOtpSession } from '@/lib/otp-client';

/* ─────────────────────────────────────────────
   Fonts + CSS
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

  .otp-root {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 1fr 1fr;
    font-family: var(--fs);
    background: var(--paper);
    overflow: hidden;
  }

  /* ── Left dark panel ── */
  .otp-left {
    position: relative;
    background: var(--ink);
    display: flex; flex-direction: column;
    justify-content: space-between;
    padding: 48px 56px;
    overflow: hidden;
  }
  .otp-left-glow {
    position: absolute; inset: 0; pointer-events: none;
    background:
      radial-gradient(ellipse at 15% 25%, rgba(195,216,193,0.11) 0%, transparent 55%),
      radial-gradient(ellipse at 85% 75%, rgba(195,216,193,0.07) 0%, transparent 50%);
  }
  .otp-left-grid {
    position: absolute; inset: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
    background-size: 48px 48px;
  }

  /* Brand */
  .otp-brand {
    display: flex; align-items: center; gap: 10px;
    position: relative; z-index: 1;
    text-decoration: none;
    animation: otp-fadeUp 0.6s 0.05s var(--ease) both;
  }
  .otp-brand-mark {
    width: 44px; height: 44px; border-radius: 12px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.16);
    box-shadow: 0 10px 24px rgba(0,0,0,0.18);
    overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .otp-brand-copy {
    display: flex;
    flex-direction: column;
    gap: 3px;
    line-height: 1;
  }
  .otp-brand-name {
    font-family: var(--fd); font-size: 19px; font-weight: 600;
    color: rgba(255,255,255,0.9); letter-spacing: -0.3px;
  }
  .otp-brand-tagline {
    font-size: 10px; font-weight: 600;
    color: rgba(195,216,193,0.85);
    letter-spacing: 0.35px;
    text-transform: uppercase;
  }

  /* Left body */
  .otp-left-body {
    position: relative; z-index: 1;
    animation: otp-fadeUp 0.7s 0.2s var(--ease) both;
  }
  .otp-left-eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(195,216,193,0.12);
    border: 1px solid rgba(195,216,193,0.2);
    border-radius: 999px; padding: 5px 14px;
    margin-bottom: 28px;
  }
  .otp-left-eyebrow-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--sage);
    box-shadow: 0 0 6px var(--sage);
    animation: otp-glow 2.5s ease-in-out infinite;
  }
  .otp-left-eyebrow span {
    font-size: 11px; font-weight: 600; color: var(--sage);
    letter-spacing: 0.6px; text-transform: uppercase;
  }
  .otp-left-h1 {
    font-family: var(--fd); font-size: clamp(42px, 4.5vw, 66px);
    font-weight: 700; color: var(--white);
    line-height: 1.04; letter-spacing: -1.5px;
    margin-bottom: 18px;
  }
  .otp-left-h1 em { font-style: italic; color: var(--sage); }
  .otp-left-sub {
    font-size: 15px; color: rgba(255,255,255,0.45);
    line-height: 1.75; max-width: 360px;
  }

  /* Step tracker */
  .otp-steps {
    position: relative; z-index: 1;
    animation: otp-fadeUp 0.7s 0.35s var(--ease) both;
  }
  .otp-steps-label {
    font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.3);
    text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 14px;
  }
  .otp-steps-row { display: flex; flex-direction: column; gap: 8px; }
  .otp-step-item { display: flex; align-items: center; gap: 12px; }
  .otp-step-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: rgba(255,255,255,0.12); flex-shrink: 0;
    transition: all 0.3s;
  }
  .otp-step-dot.done   { background: var(--sage-dark); }
  .otp-step-dot.active { background: var(--white); box-shadow: 0 0 6px rgba(255,255,255,0.5); }
  .otp-step-text {
    font-size: 12.5px; color: rgba(255,255,255,0.3); font-weight: 500;
    transition: color 0.3s;
  }
  .otp-step-text.done   { color: rgba(255,255,255,0.5); }
  .otp-step-text.active { color: var(--white); font-weight: 600; }

  /* ── Right panel ── */
  .otp-right {
    display: flex; align-items: center; justify-content: center;
    padding: 64px 56px;
    position: relative;
  }

  .otp-form-wrap {
    width: 100%; max-width: 400px;
    animation: otp-fadeUp 0.7s 0.15s var(--ease) both;
  }

  .otp-top-actions {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    margin-bottom: 28px;
  }

  .otp-top-back {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    height: 38px;
    padding: 0 13px;
    border-radius: 999px;
    border: 1px solid var(--cloud);
    background: var(--white);
    color: var(--ink);
    font-family: var(--fs);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 6px 18px rgba(13,13,13,0.05);
    transition: border-color 0.18s, transform 0.18s;
  }

  .otp-top-back:hover {
    border-color: var(--mist);
    transform: translateY(-1px);
  }

  .otp-top-back svg {
    width: 14px;
    height: 14px;
  }

  /* Header */
  .otp-form-header { margin-bottom: 28px; }
  .otp-form-eyebrow {
    font-size: 11px; font-weight: 700; color: var(--sage-deep);
    letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 10px;
  }
  .otp-form-title {
    font-family: var(--fd); font-size: 36px; font-weight: 700;
    color: var(--ink); letter-spacing: -0.8px; line-height: 1.08;
    margin-bottom: 10px;
  }
  .otp-form-sub {
    font-size: 14px; color: var(--ash); line-height: 1.65;
  }
  .otp-form-sub strong { color: var(--ink); font-weight: 700; }
  .otp-phone-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-top: 16px;
    padding: 10px 12px;
    border-radius: 999px;
    border: 1px solid var(--cloud);
    background: var(--white);
    color: var(--ink);
    font-size: 13px;
    font-weight: 700;
    box-shadow: 0 6px 18px rgba(13,13,13,0.05);
  }
  .otp-phone-pill svg {
    width: 15px;
    height: 15px;
    color: var(--sage-deep);
  }
  .otp-time-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin: 16px 0 18px;
    padding: 11px 12px;
    border-radius: 12px;
    background: rgba(13,13,13,0.035);
    color: var(--ash);
    font-size: 12.5px;
    font-weight: 700;
  }
  .otp-time-row strong {
    color: var(--ink);
  }
  .otp-time-row.is-expired {
    background: rgba(192,57,43,0.07);
    color: var(--red);
  }

  /* ── OTP cell grid ── */
  .otp-cells-wrap { position: relative; margin-bottom: 18px; }

  /* Hidden real input layered over cells */
  .otp-hidden-input {
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    opacity: 0; cursor: text; z-index: 2;
    font-size: 1px; /* prevent iOS zoom */
    color: transparent;
    caret-color: transparent;
  }

  .otp-cells {
    display: grid; grid-template-columns: repeat(6, 1fr);
    gap: 8px; cursor: text;
  }

  .otp-cell {
    height: 64px; border-radius: 14px;
    border: 1.5px solid var(--cloud);
    background: var(--white);
    display: flex; align-items: center; justify-content: center;
    font-family: var(--fd); font-size: 28px; font-weight: 700;
    color: var(--ink); letter-spacing: -0.5px;
    transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
    position: relative; z-index: 1;
    user-select: none;
  }
  .otp-cell.filled {
    border-color: var(--ink);
    box-shadow: 0 0 0 3px rgba(13,13,13,0.06);
    transform: scale(1.04);
  }
  .otp-cell.active-cursor {
    border-color: var(--ink);
    box-shadow: 0 0 0 3px rgba(13,13,13,0.06);
  }
  .otp-cell.active-cursor::after {
    content: '';
    position: absolute; width: 2px; height: 24px;
    background: var(--ink); border-radius: 1px;
    animation: otp-blink 1s ease-in-out infinite;
  }
  .otp-cell.error {
    border-color: var(--red);
    box-shadow: 0 0 0 3px rgba(192,57,43,0.08);
    animation: otp-shake 0.4s var(--ease);
  }

  .otp-success {
    display: flex; align-items: center; gap: 10px;
    background: rgba(122,158,120,0.12);
    border: 1px solid rgba(122,158,120,0.26);
    border-radius: 10px; padding: 12px 16px;
    font-size: 13px; color: var(--sage-deep);
    font-weight: 700;
    margin-bottom: 20px;
  }
  .otp-success svg { width: 15px; height: 15px; flex-shrink: 0; }

  /* ── Error banner ── */
  .otp-error {
    display: flex; align-items: center; gap: 10px;
    background: rgba(192,57,43,0.06);
    border: 1px solid rgba(192,57,43,0.18);
    border-radius: 10px; padding: 12px 16px;
    font-size: 13px; color: var(--red);
    margin-bottom: 20px;
  }
  .otp-error svg { width: 15px; height: 15px; flex-shrink: 0; }

  /* ── Submit button ── */
  .otp-submit-bar {
    margin-top: 18px;
  }
  .otp-submit-btn {
    width: 100%; height: 52px;
    font-family: var(--fs); font-size: 15px; font-weight: 600;
    color: var(--white); background: var(--ink);
    border: none; border-radius: 12px; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    box-shadow: 0 4px 16px rgba(13,13,13,0.2);
    transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
  }
  .otp-submit-btn:hover:not(:disabled) {
    opacity: 0.87; transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(13,13,13,0.22);
  }
  .otp-submit-btn:active:not(:disabled) { transform: scale(0.98); }
  .otp-submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .otp-submit-btn svg { width: 16px; height: 16px; }

  /* Spinner */
  .otp-spinner {
    width: 16px; height: 16px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    animation: otp-spin 0.7s linear infinite;
  }

  /* ── Resend footer ── */
  .otp-footer {
    display: flex; align-items: center; justify-content: center;
    gap: 10px; margin-top: 22px;
    font-size: 13px; color: var(--ash);
  }
  .otp-resend-timer {
    display: inline-flex; align-items: center; gap: 6px;
  }
  .otp-resend-limit {
    color: var(--ash);
    font-size: 12.5px;
    font-weight: 600;
  }
  .otp-timer-ring {
    position: relative; width: 20px; height: 20px;
  }
  .otp-timer-ring svg { width: 20px; height: 20px; transform: rotate(-90deg); }
  .otp-timer-ring-bg { fill: none; stroke: var(--cloud); stroke-width: 2; }
  .otp-timer-ring-fill {
    fill: none; stroke: var(--sage-deep); stroke-width: 2;
    stroke-linecap: round;
    transition: stroke-dashoffset 1s linear;
  }
  .otp-resend-btn {
    font-family: var(--fs); font-size: 13px; font-weight: 700;
    color: var(--ink); background: none; border: none; cursor: pointer;
    display: flex; align-items: center; gap: 6px;
    text-decoration: underline; text-underline-offset: 2px;
    text-decoration-color: var(--sage-dark);
    transition: color 0.2s;
  }
  .otp-resend-btn:hover { color: var(--sage-deep); }
  .otp-resend-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .otp-resend-btn svg { width: 13px; height: 13px; }

  /* Secondary actions */
  .otp-secondary-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 14px;
    font-size: 12.5px;
    color: var(--ash);
  }
  .otp-secondary-dot {
    width: 4px;
    height: 4px;
    border-radius: 999px;
    background: var(--mist);
  }
  .otp-back-link {
    display: inline-flex; align-items: center; justify-content: center;
    gap: 6px;
    font-size: 12.5px; color: var(--ash);
    cursor: pointer; background: none; border: none;
    font-family: var(--fs); transition: color 0.2s;
  }
  .otp-back-link:hover { color: var(--ink); }
  .otp-back-link svg { width: 13px; height: 13px; }

  /* ── Keyframes ── */
  @keyframes otp-fadeUp {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: none; }
  }
  @keyframes otp-shake {
    0%,100% { transform: translateX(0); }
    20% { transform: translateX(-6px); }
    40% { transform: translateX(6px); }
    60% { transform: translateX(-4px); }
    80% { transform: translateX(4px); }
  }
  @keyframes otp-blink {
    0%,100% { opacity: 1; }
    50%      { opacity: 0; }
  }
  @keyframes otp-glow {
    0%,100% { opacity: 1; }
    50%      { opacity: 0.55; }
  }
  @keyframes otp-spin { to { transform: rotate(360deg); } }

  @media (max-width: 900px) {
    .otp-root {
      display: block;
      min-height: 100dvh;
      overflow-x: hidden;
    }

    .otp-left {
      display: none;
    }

    .otp-right {
      min-height: 100dvh;
      align-items: flex-start;
      justify-content: center;
      padding: 24px 18px 100px;
    }

    .otp-form-wrap {
      width: 100%;
      max-width: 430px;
      min-height: calc(100dvh - 124px);
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .otp-form-header {
      margin-bottom: 20px;
    }

    .otp-top-actions {
      margin-bottom: 18px;
    }

    .otp-form-eyebrow {
      margin-bottom: 8px;
    }

    .otp-form-title {
      font-size: clamp(34px, 11vw, 42px);
    }

    .otp-form-sub {
      font-size: 14.5px;
      line-height: 1.55;
    }

    .otp-phone-pill {
      width: 100%;
      justify-content: center;
      border-radius: 14px;
    }

    .otp-time-row {
      margin: 14px 0 16px;
    }

    .otp-cells {
      gap: 7px;
    }

    .otp-cell {
      height: 56px;
      border-radius: 13px;
      font-size: 25px;
    }

    .otp-submit-bar {
      position: sticky;
      bottom: 0;
      z-index: 10;
      margin: 20px -18px -100px;
      padding: 12px 18px calc(12px + env(safe-area-inset-bottom));
      background: rgba(250,250,248,0.94);
      border-top: 1px solid var(--cloud);
      backdrop-filter: blur(14px);
    }

    .otp-submit-btn {
      height: 54px;
      border-radius: 14px;
    }
  }

  @media (max-width: 380px) {
    .otp-right {
      padding-inline: 14px;
    }

    .otp-cells {
      gap: 5px;
    }

    .otp-cell {
      height: 50px;
      border-radius: 11px;
      font-size: 23px;
    }

    .otp-submit-bar {
      margin-inline: -14px;
      padding-inline: 14px;
    }
  }
`;

const otpPageStyles = document.getElementById('otp-page-styles');
if (otpPageStyles) {
  otpPageStyles.textContent = CSS;
} else {
  const s = document.createElement('style');
  s.id = 'otp-page-styles';
  s.textContent = CSS;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────────
   SVG icons
───────────────────────────────────────────── */
const Ico = {
  Arrow:   () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg>,
  Back:    () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M13 8H3M7 4l-4 4 4 4"/></svg>,
  Refresh: () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 8a6 6 0 1 1 1.5 4"/><path d="M2 12V8h4"/></svg>,
  Alert:   () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="6"/><path d="M8 5v4M8 11v.5"/></svg>,
  Check:   () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 8l3.5 3.5L13 5"/></svg>,
  Phone:   () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="5" y="1.5" width="6" height="13" rx="1.8"/><path d="M7.5 12.5h1"/></svg>,
};

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const RESEND_SECONDS = 30;
const MAX_RESENDS = 3;
const CIRCUMFERENCE = 2 * Math.PI * 8; // r=8

const formatCountdown = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

const isPhoneAlreadyInUseError = (err: unknown) => {
  const code = (err as { code?: string })?.code ?? '';
  const msg  = (err as { message?: string })?.message?.toLowerCase() ?? '';
  return (
    code === 'account_exists' ||
    code === 'auth/phone-already-in-use' ||
    msg.includes('already exists for this phone') ||
    msg.includes('phone number is already') ||
    (msg.includes('already registered') && msg.includes('phone'))
  );
};

/* ─────────────────────────────────────────────
   Countdown ring component
───────────────────────────────────────────── */
function CountdownRing({ seconds, total }: { seconds: number; total: number }) {
  const offset = CIRCUMFERENCE * (1 - seconds / total);
  return (
    <div className="otp-timer-ring">
      <svg viewBox="0 0 20 20">
        <circle className="otp-timer-ring-bg" cx="10" cy="10" r="8" />
        <circle
          className="otp-timer-ring-fill"
          cx="10" cy="10" r="8"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */
export function OtpPage() {
  const navigate     = useNavigate();
  const registration = useMemo(() => getPendingRegistration(), []);
  const [session,    setSessionState] = useState(getOtpSession());
  const [code,       setCode]         = useState('');
  const [seconds,    setSeconds]      = useState(RESEND_SECONDS);
  const [now,        setNow]          = useState(() => Date.now());
  const [resendCount, setResendCount] = useState(() => Math.min(session?.resendCount ?? 0, MAX_RESENDS));
  const [loading,    setLoading]      = useState(false);
  const [error,      setError]        = useState<string | null>(null);
  const [errorKey,   setErrorKey]     = useState(0);
  const [success,    setSuccess]      = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastSubmittedCodeRef = useRef('');

  /* Redirect if no pending registration */
  useEffect(() => {
    if (!registration || !session) {
      navigate('/auth/register', { replace: true });
    }
  }, [navigate, registration, session]);

  /* Countdown timer */
  useEffect(() => {
    const t = window.setInterval(() => {
      setSeconds(s => (s <= 1 ? 0 : s - 1));
      setNow(Date.now());
    }, 1000);
    return () => window.clearInterval(t);
  }, []);

  /* Auto-focus input on mount */
  useEffect(() => { inputRef.current?.focus(); }, []);

  const showError = (msg: string) => { setError(msg); setErrorKey(k => k + 1); };
  const expiresInMs = Math.max(0, (session?.expiresAt ?? 0) - now);
  const expired = !!session && expiresInMs <= 0;
  const resendsRemaining = Math.max(0, MAX_RESENDS - resendCount);

  const updateCode = (value: string) => {
    const next = value.replace(/\D/g, '').slice(0, 6);
    setCode(next);
    if (error) setError(null);
    if (next !== lastSubmittedCodeRef.current) lastSubmittedCodeRef.current = '';
  };

  /* Verify */
  const verifyCode = useCallback(async () => {
    if (!registration || !session || code.length !== 6 || loading || success || expired) {
      if (expired) showError('This code has expired. Resend a new code.');
      return;
    }
    try {
      lastSubmittedCodeRef.current = code;
      setLoading(true); setError(null);
      await verifyOtpSession(session, code.trim());

      const signedInUser = (await createUserWithPhonePassword(
        registration.phoneNumber,
        registration.password,
        session.sessionId,
      )).user;

      const numericMeasurements = Object.fromEntries(
        Object.entries(registration.measurements).filter(([, v]) => `${v ?? ''}`.trim().length > 0)
      );

      const uid = signedInUser.uid;
      if (!uid) throw new Error('Signed-in user session not found after verification.');

      await saveCustomerProfile({
        uid,
        phoneNumber: registration.phoneNumber,
        email: registration.email,
        firstName: registration.firstName,
        lastName: registration.lastName,
        gender: registration.gender,
        preferredClothing: registration.preferredClothing,
        preferredClothingLabel: registration.preferredClothingLabel,
        measurementProfileKey: registration.measurementProfileKey,
        unit: registration.unit,
        measurements: numericMeasurements,
        primaryMeasurementKeys: registration.primaryMeasurementKeys,
        measurementDisplayNames: registration.measurementDisplayNames,
      });

      setSuccess(true);
      clearOtpSession();
      clearPendingRegistration();
      setTimeout(() => navigate('/app/home', { replace: true }), 800);
    } catch (err) {
      if (isPhoneAlreadyInUseError(err)) {
        showError('This phone number is already registered. Log in or use a different number.');
        return;
      }
      showError('That code is incorrect. Try again.');
    } finally {
      setLoading(false);
    }
  }, [code, expired, loading, navigate, registration, session, success]);

  useEffect(() => {
    if (code.length === 6 && !loading && !success && lastSubmittedCodeRef.current !== code) {
      void verifyCode();
    }
  }, [code, loading, success, verifyCode]);

  const handleVerify = (e: FormEvent) => {
    e.preventDefault();
    void verifyCode();
  };

  /* Resend */
  const handleResend = async () => {
    if (!registration || !session || seconds > 0 || resendCount >= MAX_RESENDS) return;
    try {
      setLoading(true); setError(null);
      const next = await requestOtpViaTextLk(registration.phoneNumber, session.purpose);
      const nextResendCount = resendCount + 1;
      const nextSession = { ...next, resendCount: nextResendCount };
      setOtpSession(nextSession); setSessionState(nextSession);
      setResendCount(nextResendCount);
      setNow(Date.now());
      setCode(''); setSeconds(RESEND_SECONDS); lastSubmittedCodeRef.current = '';
      inputRef.current?.focus();
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      showError(
        message.toLowerCase().includes('limit')
          ? 'You have reached the resend limit. Try again in 10 minutes.'
          : message || 'Could not resend the code. Try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const displayPhone = (() => {
    const raw = registration?.phoneNumber;
    if (!raw) return 'your phone number';
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith('94') && digits.length >= 11) {
      return `+94 ${digits.slice(2, 4)} ${digits.slice(4, 7)} ${digits.slice(-4)}`;
    }
    return raw;
  })();

  return (
    <div className="otp-root">

      {/* ── Left dark panel ── */}
      <div className="otp-left">
        <div className="otp-left-glow" />
        <div className="otp-left-grid" />

        {/* Brand */}
        <Link className="otp-brand" to="/">
          <div className="otp-brand-mark"><AppLogo size={36} decorative /></div>
          <div className="otp-brand-copy">
            <span className="otp-brand-name">MatchMySize</span>
            <span className="otp-brand-tagline">Find Your Perfect Fit</span>
          </div>
        </Link>

        {/* Hero copy */}
        <div className="otp-left-body">
          <div className="otp-left-eyebrow">
            <div className="otp-left-eyebrow-dot" />
            <span>Almost there</span>
          </div>
          <h2 className="otp-left-h1">
            One code<br />to <em>confirm</em><br />it's you.
          </h2>
          <p className="otp-left-sub">
            We protect every account with phone verification. Your code expires soon — enter it now to complete sign-up.
          </p>
        </div>

        {/* Registration step tracker */}
        <div className="otp-steps">
          <div className="otp-steps-label">Registration progress</div>
          <div className="otp-steps-row">
            {[
              { label: 'Gender & clothing', state: 'done' },
              { label: 'Measurements',      state: 'done' },
              { label: 'Account details',   state: 'done' },
              { label: 'Phone verification', state: 'active' },
            ].map(({ label, state }) => (
              <div key={label} className="otp-step-item">
                <div className={`otp-step-dot ${state}`} />
                <span className={`otp-step-text ${state}`}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="otp-right">
        <div className="otp-form-wrap">
          <div className="otp-top-actions">
            <button
              type="button"
              className="otp-top-back"
              onClick={() => navigate('/auth/register')}
            >
              <Ico.Back /> Back
            </button>
          </div>

          {/* Header */}
          <div className="otp-form-header">
            <div className="otp-form-eyebrow">Phone verification</div>
            <h1 className="otp-form-title">Verify your phone</h1>
            <p className="otp-form-sub">
              Enter the 6-digit code we sent to your phone.
            </p>
            <div className="otp-phone-pill">
              <Ico.Phone />
              <span>{displayPhone}</span>
            </div>
          </div>

          <div className={`otp-time-row${expired ? ' is-expired' : ''}`}>
            <span>{expired ? 'Code expired' : 'Code expires in'}</span>
            <strong>{expired ? 'Resend now' : formatCountdown(expiresInMs)}</strong>
          </div>

          {/* OTP cells */}
          <form onSubmit={handleVerify}>
            <div className="otp-cells-wrap">
              <input
                ref={inputRef}
                className="otp-hidden-input"
                inputMode="numeric"
                autoFocus
                maxLength={6}
                value={code}
                onChange={e => updateCode(e.target.value)}
                autoComplete="one-time-code"
                aria-label="6-digit verification code"
                disabled={loading || success || expired}
              />
              <div
                className="otp-cells"
                onClick={() => inputRef.current?.focus()}>
                {Array.from({ length: 6 }, (_, i) => {
                  const filled  = code[i] !== undefined;
                  const cursor  = i === code.length && !success;
                  const hasErr  = !!error;
                  return (
                    <div
                      className={[
                        'otp-cell',
                        filled  ? 'filled'        : '',
                        cursor  ? 'active-cursor'  : '',
                        hasErr  ? 'error'           : '',
                      ].filter(Boolean).join(' ')}
                      key={`${i}-${errorKey}`}>
                      {success && filled ? '✓' : (code[i] ?? '')}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="otp-error" key={errorKey}>
                <Ico.Alert /> {error}
              </div>
            )}

            {success && (
              <div className="otp-success">
                <Ico.Check /> Account created
              </div>
            )}

            {/* Submit */}
            <div className="otp-submit-bar">
              <button
                type="submit"
                className="otp-submit-btn"
                disabled={loading || code.length !== 6 || success || expired}>
                {success
                  ? <><Ico.Check /> Account created</>
                  : loading
                  ? <><div className="otp-spinner" /> Checking code...</>
                  : <>Verify <Ico.Arrow /></>
                }
              </button>
            </div>
          </form>

          {/* Footer — resend */}
          <div className="otp-footer">
            {resendsRemaining <= 0 ? (
              <span className="otp-resend-limit">
                Resend limit reached. Try again in 10 minutes.
              </span>
            ) : seconds > 0 ? (
              <span className="otp-resend-timer">
                <CountdownRing seconds={seconds} total={RESEND_SECONDS} />
                Resend code in {seconds}s · {resendsRemaining} left
              </span>
            ) : (
              <button
                className="otp-resend-btn"
                onClick={handleResend}
                disabled={loading}>
                <Ico.Refresh /> Resend code ({resendsRemaining} left)
              </button>
            )}
          </div>

          <div className="otp-secondary-actions">
            <button
              className="otp-back-link"
              onClick={() => navigate('/auth/register')}>
              Change number
            </button>
            <span className="otp-secondary-dot" aria-hidden="true" />
            <button
              className="otp-back-link"
              onClick={() => navigate('/auth/register')}>
              Back
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}

export default OtpPage;
