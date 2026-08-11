import { useEffect, useMemo, useRef, useState, type JSX } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/context/auth-context';
import { getOtpSession, setOtpSession, type OtpSession } from '@/lib/auth-flow';
import { attachPasswordToVerifiedPhone, resetPasswordWithVerifiedPhone } from '@/lib/auth-api';
import { requestOtpViaTextLk, requestPasswordResetOtp, verifyOtpSession } from '@/lib/otp-client';
import {
  DEFAULT_PHONE_COUNTRY_CODE,
  getSriLankaLocalPhoneInput,
  isValidE164Phone,
  normalizePhoneForAuth,
} from '@/lib/phone-auth';
import { useRecommendationData } from '@/lib/use-recommendation-data';

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

  .cp-root {
    min-height: 100vh;
    background: var(--paper);
    font-family: var(--fs);
    display: grid;
    grid-template-columns: 1fr 480px 1fr;
    grid-template-rows: auto 1fr;
  }

  /* ── Topbar ── */
  .cp-topbar {
    grid-column: 1 / -1;
    height: 64px;
    background: rgba(250,250,248,0.9);
    backdrop-filter: blur(14px);
    border-bottom: 1px solid var(--cloud);
    display: flex; align-items: center; gap: 14px;
    padding: 0 48px;
    position: sticky; top: 0; z-index: 50;
    animation: cp-fadeDown 0.5s var(--ease) both;
  }
  .cp-back-btn {
    display: flex; align-items: center; gap: 7px;
    font-family: var(--fs); font-size: 13px; font-weight: 600;
    color: var(--ash); background: none; border: none;
    cursor: pointer; padding: 8px 14px; border-radius: 8px;
    transition: all 0.18s;
  }
  .cp-back-btn:hover { background: var(--cloud); color: var(--ink); }
  .cp-back-btn svg { width: 14px; height: 14px; }
  .cp-topbar-divider { width: 1px; height: 22px; background: var(--cloud); }
  .cp-topbar-title {
    font-family: var(--fd); font-size: 20px; font-weight: 700;
    color: var(--ink); letter-spacing: -0.4px;
  }

  /* Stepper in topbar */
  .cp-stepper {
    margin-left: auto;
    display: flex; align-items: center; gap: 0;
  }
  .cp-step-item {
    display: flex; align-items: center; gap: 8px;
    padding: 6px 14px; position: relative;
  }
  .cp-step-item:not(:last-child)::after {
    content: '';
    position: absolute; right: -1px; top: 50%;
    transform: translateY(-50%);
    width: 20px; height: 1px;
    background: var(--cloud);
  }
  .cp-step-node {
    width: 26px; height: 26px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 800;
    border: 1.5px solid var(--cloud);
    background: var(--paper); color: var(--mist);
    flex-shrink: 0; transition: all 0.3s var(--ease);
  }
  .cp-step-node.done   { background: var(--sage-deep); border-color: var(--sage-deep); color: var(--white); }
  .cp-step-node.active { background: var(--ink);       border-color: var(--ink);       color: var(--white); }
  .cp-step-node svg { width: 12px; height: 12px; }
  .cp-step-label {
    font-size: 12px; font-weight: 600; color: var(--mist);
    transition: color 0.3s;
  }
  .cp-step-label.done   { color: var(--sage-deep); }
  .cp-step-label.active { color: var(--ink); }

  /* ── Main column ── */
  .cp-main {
    grid-column: 2;
    padding: 48px 0 80px;
    display: flex; flex-direction: column; gap: 24px;
  }

  /* Slide transitions */
  .cp-slide { animation: cp-slideIn 0.32s var(--ease) both; }
  .cp-slide-back { animation: cp-slideInBack 0.32s var(--ease) both; }

  @keyframes cp-slideIn {
    from { opacity: 0; transform: translateX(28px); }
    to   { opacity: 1; transform: none; }
  }
  @keyframes cp-slideInBack {
    from { opacity: 0; transform: translateX(-28px); }
    to   { opacity: 1; transform: none; }
  }
  @keyframes cp-fadeDown {
    from { opacity: 0; transform: translateY(-14px); }
    to   { opacity: 1; transform: none; }
  }
  @keyframes cp-fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: none; }
  }
  @keyframes cp-shake {
    0%,100% { transform: translateX(0); }
    20% { transform: translateX(-6px); }
    40% { transform: translateX(6px); }
    60% { transform: translateX(-4px); }
    80% { transform: translateX(4px); }
  }
  @keyframes cp-spin { to { transform: rotate(360deg); } }
  @keyframes cp-growBar {
    from { width: 0; }
    to   { width: var(--w); }
  }

  /* ── Hero card ── */
  .cp-hero-card {
    background: var(--ink);
    border-radius: 20px; padding: 28px 28px 28px 24px;
    display: flex; gap: 18px; align-items: flex-start;
    position: relative; overflow: hidden;
  }
  .cp-hero-glow {
    position: absolute; top: -40px; right: -40px;
    width: 160px; height: 160px; border-radius: 50%;
    background: rgba(195,216,193,0.08);
    pointer-events: none;
  }
  .cp-hero-icon-wrap {
    width: 48px; height: 48px; border-radius: 12px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .cp-hero-icon-wrap svg { width: 22px; height: 22px; color: var(--sage); }
  .cp-hero-body { flex: 1; position: relative; z-index: 1; }
  .cp-hero-eyebrow {
    font-size: 11px; font-weight: 700; color: var(--sage);
    letter-spacing: 0.7px; text-transform: uppercase; margin-bottom: 6px;
  }
  .cp-hero-title {
    font-family: var(--fd); font-size: 26px; font-weight: 700;
    color: var(--white); letter-spacing: -0.5px; line-height: 1.1;
    margin-bottom: 6px;
  }
  .cp-hero-sub { font-size: 13px; color: rgba(255,255,255,0.45); line-height: 1.6; }

  /* ── Field ── */
  .cp-field { display: flex; flex-direction: column; gap: 8px; }
  .cp-field-label {
    display: flex; align-items: center; gap: 8px;
    font-size: 12px; font-weight: 700; color: var(--ink);
  }
  .cp-field-hint {
    font-size: 11px; font-weight: 500; color: var(--ash);
    background: var(--cloud); border-radius: 999px;
    padding: 2px 8px; margin-left: auto;
  }

  .cp-input-wrap {
    display: flex; align-items: center;
    background: var(--white); border: 1.5px solid var(--cloud);
    border-radius: 12px; overflow: hidden;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .cp-input-wrap:focus-within {
    border-color: var(--ink);
    box-shadow: 0 0 0 3px rgba(13,13,13,0.06);
  }
  .cp-input-wrap.cp-err {
    border-color: var(--red);
    box-shadow: 0 0 0 3px rgba(192,57,43,0.07);
  }
  .cp-input-icon {
    padding: 0 14px; display: flex; align-items: center;
    color: var(--ash); flex-shrink: 0;
  }
  .cp-input-icon svg { width: 15px; height: 15px; }
  .cp-input-country {
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
  .cp-text-input {
    flex: 1; height: 52px; border: none; outline: none;
    background: transparent; font-family: var(--fs);
    font-size: 15px; font-weight: 600; color: var(--ink);
    padding: 0 16px;
  }
  .cp-text-input:not(:first-child) { padding-left: 0; }
  .cp-text-input::placeholder { color: var(--mist); font-weight: 400; }

  /* Eye toggle */
  .cp-eye-btn {
    width: 46px; height: 52px; border: none; background: none;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    color: var(--ash); transition: color 0.18s; flex-shrink: 0;
  }
  .cp-eye-btn:hover { color: var(--ink); }
  .cp-eye-btn svg { width: 16px; height: 16px; }

  /* OTP digit display */
  .cp-otp-preview {
    display: flex; gap: 8px; margin-top: 4px;
  }
  .cp-otp-cell {
    flex: 1; height: 52px; border-radius: 10px;
    border: 1.5px solid var(--cloud);
    background: var(--paper);
    display: flex; align-items: center; justify-content: center;
    font-family: var(--fd); font-size: 22px; font-weight: 700;
    color: var(--ink); transition: all 0.18s;
  }
  .cp-otp-cell.filled { border-color: var(--ink); background: var(--white); }

  /* Sent banner */
  .cp-sent-banner {
    display: flex; align-items: center; gap: 10px;
    background: var(--sage-light);
    border: 1px solid var(--sage-dark);
    border-radius: 10px; padding: 12px 16px;
    font-size: 13px; font-weight: 600; color: var(--sage-deep);
    animation: cp-fadeUp 0.35s var(--ease) both;
  }
  .cp-sent-banner svg { width: 15px; height: 15px; flex-shrink: 0; }

  /* Password strength */
  .cp-strength-row {
    display: flex; align-items: center; gap: 10px;
    padding: 0 2px;
  }
  .cp-strength-bars { flex: 1; display: flex; gap: 4px; }
  .cp-strength-bar  { flex: 1; height: 4px; border-radius: 2px; background: var(--cloud); transition: background 0.3s; }
  .cp-strength-label { font-size: 11px; font-weight: 700; width: 44px; text-align: right; transition: color 0.3s; }

  /* Password match indicator */
  .cp-match-row {
    display: flex; align-items: center; gap: 7px;
    font-size: 12px; font-weight: 600;
  }
  .cp-match-row svg { width: 14px; height: 14px; }

  /* Error */
  .cp-error {
    display: flex; align-items: center; gap: 10px;
    background: rgba(192,57,43,0.06);
    border: 1px solid rgba(192,57,43,0.18);
    border-radius: 10px; padding: 12px 16px;
    font-size: 13px; color: var(--red);
  }
  .cp-error svg { width: 15px; height: 15px; flex-shrink: 0; }

  /* Actions */
  .cp-actions { display: flex; gap: 12px; align-items: center; }
  .cp-btn-back {
    font-family: var(--fs); font-size: 14px; font-weight: 600;
    color: var(--ash); background: var(--white);
    border: 1.5px solid var(--cloud); border-radius: 12px;
    padding: 0 20px; height: 50px; cursor: pointer;
    display: flex; align-items: center; gap: 8px;
    transition: all 0.18s;
  }
  .cp-btn-back:hover { color: var(--ink); border-color: var(--mist); }
  .cp-btn-back svg { width: 15px; height: 15px; }

  .cp-btn-next {
    flex: 1; height: 50px;
    font-family: var(--fs); font-size: 14px; font-weight: 700;
    color: var(--white); background: var(--ink);
    border: none; border-radius: 12px; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    box-shadow: 0 4px 16px rgba(13,13,13,0.16);
    transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s, background 0.3s;
  }
  .cp-btn-next:hover:not(:disabled) {
    opacity: 0.87; transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(13,13,13,0.2);
  }
  .cp-btn-next:active:not(:disabled) { transform: scale(0.98); }
  .cp-btn-next:disabled { opacity: 0.4; cursor: not-allowed; }
  .cp-btn-next.success  { background: var(--sage-deep); }
  .cp-btn-next svg { width: 16px; height: 16px; }

  .cp-spinner {
    width: 16px; height: 16px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    animation: cp-spin 0.7s linear infinite;
  }

  /* Fields gap */
  .cp-fields { display: flex; flex-direction: column; gap: 18px; }
`;

if (!document.getElementById('cp-styles')) {
  const s = document.createElement('style');
  s.id = 'cp-styles';
  s.textContent = CSS;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────────
   SVG icons
───────────────────────────────────────────── */
const Ico = {
  Back:    () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M13 8H3M7 4l-4 4 4 4"/></svg>,
  Arrow:   () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg>,
  Check:   () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 8l3.5 3.5L13 5"/></svg>,
  CheckCircle: () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="6"/><path d="M5 8l2.5 2.5L11 6"/></svg>,
  Alert:   () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="6"/><path d="M8 5v4M8 11v.5"/></svg>,
  Phone:   () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="4" y="1" width="8" height="14" rx="2"/><circle cx="8" cy="12" r="0.7" fill="currentColor" stroke="none"/></svg>,
  Keypad:  () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="2" width="4" height="3" rx="1"/><rect x="6.5" y="2" width="3" height="3" rx="1"/><rect x="10" y="2" width="4" height="3" rx="1"/><rect x="2" y="6.5" width="4" height="3" rx="1"/><rect x="6.5" y="6.5" width="3" height="3" rx="1"/><rect x="10" y="6.5" width="4" height="3" rx="1"/><rect x="6.5" y="11" width="3" height="3" rx="1"/></svg>,
  Lock:    () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="7" width="10" height="8" rx="2"/><path d="M5 7V5a3 3 0 016 0v2"/><circle cx="8" cy="11" r="1" fill="currentColor" stroke="none"/></svg>,
  Eye:     () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z"/><circle cx="8" cy="8" r="1.8"/></svg>,
  EyeOff:  () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 2l12 12M6.5 6.6A3 3 0 0011.4 11M4.2 4.3C2.8 5.4 2 7 2 8s2.5 4 6 4c1.2 0 2.3-.3 3.2-.8M12.7 10.5C13.7 9.5 14 8 14 8s-2.5-4-6-4c-.4 0-.8 0-1.2.1"/></svg>,
  Signal:  () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M14 3a9 9 0 010 10M11 5a6 6 0 010 6M8 7a3 3 0 010 2"/><circle cx="8" cy="8" r="1" fill="currentColor" stroke="none"/></svg>,
};

/* ─────────────────────────────────────────────
   Password strength
───────────────────────────────────────────── */
function getStrength(pw: string) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 6)  s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(s, 4);
}
const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['', '#C0392B', '#E67E22', '#2980B9', '#7A9E78'];

/* ─────────────────────────────────────────────
   Step slide wrapper
───────────────────────────────────────────── */
function StepWrap({ stepKey, dir, children }: { stepKey: string; dir: 'fwd' | 'back'; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.animation = 'none';
    void el.offsetHeight;
    el.style.animation = dir === 'back'
      ? 'cp-slideInBack 0.32s var(--ease) both'
      : 'cp-slideIn 0.32s var(--ease) both';
  }, [stepKey, dir]);
  return <div ref={ref}>{children}</div>;
}

/* ─────────────────────────────────────────────
   Step types
───────────────────────────────────────────── */
type Step = 'verify' | 'otp' | 'password';
const STEP_META: Record<Step, { idx: number; label: string; eyebrow: string; title: string; sub: string; icon: () => JSX.Element }> = {
  verify:   { idx: 0, label: 'Verify',   eyebrow: 'Step 1 of 3',   title: 'Verify your phone',  sub: "We'll send a one-time code to confirm it's you.",      icon: Ico.Phone  },
  otp:      { idx: 1, label: 'OTP code', eyebrow: 'Step 2 of 3',   title: 'Enter the code',     sub: 'Check your messages for the 6-digit verification code.', icon: Ico.Keypad },
  password: { idx: 2, label: 'Password', eyebrow: 'Step 3 of 3',   title: 'Set new password',   sub: 'Choose a strong password with at least 6 characters.',  icon: Ico.Lock   },
};
const STEPS: Step[] = ['verify', 'otp', 'password'];

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */
type PasswordFlowMode = 'change' | 'reset';

export function ChangePasswordPage() {
  return <PasswordFlow mode="change" />;
}

export function ForgotPasswordPage() {
  return <PasswordFlow mode="reset" />;
}

function PasswordFlow({ mode }: { mode: PasswordFlowMode }) {
  const navigate = useNavigate();
  const { user }  = useAuth();
  const { profile } = useRecommendationData(mode === 'change' ? user?.uid : null, { subject: 'self' });
  const isPasswordReset = mode === 'reset';

  const [step,        setStep]        = useState<Step>('verify');
  const [dir,         setDir]         = useState<'fwd' | 'back'>('fwd');
  const [phone,       setPhone]       = useState(
    isPasswordReset ? '' : getSriLankaLocalPhoneInput(String(profile?.phoneNumber ?? '')),
  );
  const [session,     setSession]     = useState<OtpSession | null>(getOtpSession());
  const [code,        setCode]        = useState('');
  const [newPw,       setNewPw]       = useState('');
  const [confirmPw,   setConfirmPw]   = useState('');
  const [showPw,      setShowPw]      = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [errorKey,    setErrorKey]    = useState(0);
  const [sentTo,      setSentTo]      = useState<string | null>(null);

  useEffect(() => {
    if (!isPasswordReset && profile?.phoneNumber) {
      setPhone(getSriLankaLocalPhoneInput(String(profile.phoneNumber)));
    }
  }, [isPasswordReset, profile?.phoneNumber]);

  const showError = (msg: string) => { setError(msg); setErrorKey(k => k + 1); };
  const go = (next: Step, direction: 'fwd' | 'back') => {
    setDir(direction); setError(null); setStep(next);
  };

  const handleSendOtp = async () => {
    const normalized = normalizePhoneForAuth(phone);
    if (!isValidE164Phone(normalized)) { showError('Enter a valid Sri Lankan mobile number.'); return; }
    try {
      setLoading(true); setError(null);
      const nextSession = isPasswordReset
        ? await requestPasswordResetOtp(normalized)
        : await requestOtpViaTextLk(normalized, 'changePassword');
      setOtpSession(nextSession); setSession(nextSession);
      setSentTo(normalized);
      go('otp', 'fwd');
    } catch (e) { showError(e instanceof Error ? e.message : 'Unable to send OTP.'); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (!session) return;
    try {
      setLoading(true); setError(null);
      await verifyOtpSession(session, code.trim());
      go('password', 'fwd');
    } catch (e) { showError(e instanceof Error ? e.message : 'Unable to verify OTP.'); }
    finally { setLoading(false); }
  };

  const handleSavePassword = async () => {
    if (!session) return;
    if (newPw.length < 6) { showError('Password must be at least 6 characters.'); return; }
    if (newPw !== confirmPw) { showError('Passwords do not match.'); return; }
    try {
      setLoading(true); setError(null);
      if (isPasswordReset) {
        await resetPasswordWithVerifiedPhone(session.phoneNumber, newPw, session.sessionId);
      } else {
        await attachPasswordToVerifiedPhone(session.phoneNumber, newPw, session.sessionId);
      }
      setOtpSession(null);
      navigate(isPasswordReset ? '/auth/login' : '/app/settings', {
        replace: true,
        state: isPasswordReset ? { passwordReset: true } : undefined,
      });
    } catch (e) { showError(e instanceof Error ? e.message : 'Unable to change password.'); }
    finally { setLoading(false); }
  };

  const strength     = getStrength(newPw);
  const pwMatch      = confirmPw.length > 0 && newPw === confirmPw;
  const pwMismatch   = confirmPw.length > 0 && newPw !== confirmPw;
  const meta         = STEP_META[step];
  const Icon         = meta.icon;

  return (
    <div className="cp-root">

      {/* ── Topbar ── */}
      <div className="cp-topbar">
        <button
          className="cp-back-btn"
          onClick={() => navigate(isPasswordReset ? '/auth/login' : '/app/settings')}
        >
          {isPasswordReset ? 'Back to sign in' : 'Back to settings'}
        </button>
        <div className="cp-topbar-divider" />
        <span className="cp-topbar-title">{isPasswordReset ? 'Reset password' : 'Change password'}</span>

        {/* Step indicator */}
        <div className="cp-stepper">
          {STEPS.map((s, i) => {
            const done   = i < meta.idx;
            const active = i === meta.idx;
            return (
              <div key={s} className="cp-step-item">
                <div className={`cp-step-node${done ? ' done' : active ? ' active' : ''}`}>
                  {done ? <Ico.Check /> : i + 1}
                </div>
                <span className={`cp-step-label${done ? ' done' : active ? ' active' : ''}`}>
                  {STEP_META[s].label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Main ── */}
      <main className="cp-main">
        <StepWrap stepKey={step} dir={dir}>

          {/* ── Hero card ── */}
          <div className="cp-hero-card">
            <div className="cp-hero-glow" />
            <div className="cp-hero-icon-wrap"><Icon /></div>
            <div className="cp-hero-body">
              <div className="cp-hero-eyebrow">{meta.eyebrow}</div>
              <div className="cp-hero-title">{meta.title}</div>
              <div className="cp-hero-sub">{meta.sub}</div>
            </div>
          </div>

          {/* ── STEP: Verify ── */}
          {step === 'verify' && (
            <div className="cp-fields">
              <div className="cp-field">
                <div className="cp-field-label">
                  Phone number
                  <span className="cp-field-hint" style={{ marginLeft: 'auto' }}>Sri Lanka</span>
                </div>
                <div className={`cp-input-wrap${error ? ' cp-err' : ''}`}>
                  <div className="cp-input-icon"><Ico.Phone /></div>
                  <div className="cp-input-country">{DEFAULT_PHONE_COUNTRY_CODE}</div>
                  <input
                    className="cp-text-input"
                    type="tel"
                    inputMode="numeric"
                    maxLength={9}
                    placeholder="77xxxxxxx"
                    value={phone}
                    onChange={e => setPhone(getSriLankaLocalPhoneInput(e.target.value))}
                    onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                    autoComplete="tel"
                  />
                </div>
              </div>

              {error && (
                <div className="cp-error" key={errorKey} style={{ animation: 'cp-shake 0.4s var(--ease)' }}>
                  <Ico.Alert /> {error}
                </div>
              )}

              <div className="cp-actions">
                <button className="cp-btn-next" disabled={loading || !phone.trim()} onClick={handleSendOtp}>
                  {loading
                    ? <><div className="cp-spinner" /> Sending…</>
                    : <>Send OTP <Ico.Arrow /></>
                  }
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: OTP ── */}
          {step === 'otp' && (
            <div className="cp-fields">
              {sentTo && (
                <div className="cp-sent-banner">
                  <Ico.Signal /> Code sent to {sentTo}
                </div>
              )}

              <div className="cp-field">
                <div className="cp-field-label">
                  6-digit code
                  <span className="cp-field-hint" style={{ marginLeft: 'auto' }}>{code.length}/6</span>
                </div>
                <div className={`cp-input-wrap${error ? ' cp-err' : ''}`}>
                  <div className="cp-input-icon"><Ico.Keypad /></div>
                  <input
                    className="cp-text-input"
                    inputMode="numeric"
                    placeholder="Enter OTP"
                    value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    onKeyDown={e => e.key === 'Enter' && code.length === 6 && handleVerifyOtp()}
                    autoFocus
                    autoComplete="one-time-code"
                  />
                </div>
                {/* Digit preview */}
                <div className="cp-otp-preview">
                  {Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className={`cp-otp-cell${code[i] !== undefined ? ' filled' : ''}`}>
                      {code[i] ?? ''}
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="cp-error" key={errorKey} style={{ animation: 'cp-shake 0.4s var(--ease)' }}>
                  <Ico.Alert /> {error}
                </div>
              )}

              <div className="cp-actions">
                <button className="cp-btn-back" onClick={() => go('verify', 'back')}>
                  Back
                </button>
                <button
                  className="cp-btn-next"
                  disabled={loading || code.length < 6}
                  onClick={handleVerifyOtp}>
                  {loading
                    ? <><div className="cp-spinner" /> Verifying…</>
                    : <>Continue <Ico.Arrow /></>
                  }
                </button>
              </div>

              {/* Resend */}
              <button
                style={{ fontFamily: 'var(--fs)', fontSize: 13, fontWeight: 600, color: 'var(--ash)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center', padding: '4px 0' }}
                onClick={handleSendOtp}
                disabled={loading}>
                Didn't receive it? Resend code
              </button>
            </div>
          )}

          {/* ── STEP: Password ── */}
          {step === 'password' && (
            <div className="cp-fields">
              {/* New password */}
              <div className="cp-field">
                <div className="cp-field-label">New password</div>
                <div className={`cp-input-wrap${error && error.includes('6') ? ' cp-err' : ''}`}>
                  <div className="cp-input-icon"><Ico.Lock /></div>
                  <input
                    className="cp-text-input"
                    type={showPw ? 'text' : 'password'}
                    placeholder="Minimum 6 characters"
                    value={newPw}
                    onChange={e => setNewPw(e.target.value)}
                    autoFocus
                    autoComplete="new-password"
                  />
                  <button type="button" className="cp-eye-btn" onClick={() => setShowPw(v => !v)}>
                    {showPw ? <Ico.EyeOff /> : <Ico.Eye />}
                  </button>
                </div>
                {/* Strength meter */}
                {newPw && (
                  <div className="cp-strength-row" style={{ animation: 'cp-fadeUp 0.3s var(--ease) both' }}>
                    <div className="cp-strength-bars">
                      {[1,2,3,4].map(i => (
                        <div
                          key={i}
                          className="cp-strength-bar"
                          style={{ background: i <= strength ? STRENGTH_COLORS[strength] : 'var(--cloud)' }}
                        />
                      ))}
                    </div>
                    <span
                      className="cp-strength-label"
                      style={{ color: strength ? STRENGTH_COLORS[strength] : 'var(--ash)' }}>
                      {STRENGTH_LABELS[strength]}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div className="cp-field">
                <div className="cp-field-label">Confirm password</div>
                <div className={`cp-input-wrap${pwMismatch ? ' cp-err' : ''}`}>
                  <div className="cp-input-icon"><Ico.Lock /></div>
                  <input
                    className="cp-text-input"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    value={confirmPw}
                    onChange={e => setConfirmPw(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button type="button" className="cp-eye-btn" onClick={() => setShowConfirm(v => !v)}>
                    {showConfirm ? <Ico.EyeOff /> : <Ico.Eye />}
                  </button>
                </div>
                {/* Match indicator */}
                {confirmPw && (
                  <div
                    className="cp-match-row"
                    style={{ color: pwMatch ? 'var(--sage-deep)' : 'var(--red)', animation: 'cp-fadeUp 0.25s var(--ease) both' }}>
                    {pwMatch ? <Ico.CheckCircle /> : <Ico.Alert />}
                    {pwMatch ? 'Passwords match' : 'Passwords do not match'}
                  </div>
                )}
              </div>

              {error && (
                <div className="cp-error" key={errorKey} style={{ animation: 'cp-shake 0.4s var(--ease)' }}>
                  <Ico.Alert /> {error}
                </div>
              )}

              <div className="cp-actions">
                <button className="cp-btn-back" onClick={() => go('otp', 'back')}>
                  Back
                </button>
                <button
                  className={`cp-btn-next${pwMatch ? ' success' : ''}`}
                  disabled={loading || !newPw || !confirmPw}
                  onClick={handleSavePassword}>
                  {loading
                    ? <><div className="cp-spinner" /> Saving…</>
                    : <><Ico.CheckCircle /> Save password</>
                  }
                </button>
              </div>
            </div>
          )}

        </StepWrap>
      </main>
    </div>
  );
}

export default ChangePasswordPage;
