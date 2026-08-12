import { useEffect, useRef } from 'react';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';

import { AppLogo } from '@/components/app-logo';
import { useAuth } from '@/context/auth-context';

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
    --ash: #757575;
    --white: #FFFFFF;
    --fd: 'Cormorant Garamond', serif;
    --fs: 'DM Sans', sans-serif;
    --ease: cubic-bezier(0.22, 1, 0.36, 1);
  }

  /* ══ GUARD LOADING SCREEN ══════════════════════════════════ */

  .gl-root {
    position: fixed; inset: 0;
    background: var(--paper);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 0;
    font-family: var(--fs);
    z-index: 500;
    animation: gl-fadeIn 0.3s var(--ease) both;
  }

  /* Subtle grain */
  .gl-root::before {
    content: '';
    position: absolute; inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events: none; opacity: 0.35;
  }

  /* Brand mark */
  .gl-brand {
    position: absolute; top: 32px; left: 50%;
    transform: translateX(-50%);
    display: flex; align-items: center; gap: 10px;
    text-decoration: none;
    animation: gl-slideDown 0.5s 0.1s var(--ease) both;
    opacity: 0;
  }
  .gl-brand-mark {
    width: 40px; height: 40px; border-radius: 12px;
    background: var(--white);
    border: 1px solid rgba(0,0,0,0.08);
    box-shadow: 0 8px 18px rgba(0,0,0,0.06);
    overflow: hidden;
    display: flex; align-items: center; justify-content: center;
  }
  .gl-brand-copy {
    display: flex;
    flex-direction: column;
    gap: 3px;
    line-height: 1;
  }
  .gl-brand-name {
    font-family: var(--fd); font-size: 19px; font-weight: 600;
    color: var(--ink); letter-spacing: -0.3px;
  }
  .gl-brand-tagline {
    font-size: 10px; font-weight: 600;
    color: var(--sage-deep);
    letter-spacing: 0.35px;
    text-transform: uppercase;
  }

  /* Centre content */
  .gl-centre {
    display: flex; flex-direction: column; align-items: center;
    gap: 28px; position: relative; z-index: 1;
  }

  /* Logo spinner */
  .gl-spinner-wrap {
    position: relative; width: 80px; height: 80px;
    animation: gl-popIn 0.5s 0.2s var(--ease) both; opacity: 0;
  }
  .gl-spinner-ring {
    position: absolute; inset: 0; border-radius: 50%;
    border: 2px solid var(--cloud);
    border-top-color: var(--ink);
    animation: gl-spin 0.85s linear infinite;
  }
  .gl-spinner-ring-sage {
    position: absolute; inset: 6px; border-radius: 50%;
    border: 1.5px solid transparent;
    border-top-color: var(--sage-deep);
    animation: gl-spin 1.2s linear infinite reverse;
  }
  .gl-spinner-icon {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .gl-spinner-icon-inner {
    width: 52px; height: 52px; border-radius: 16px;
    background: var(--white);
    border: 1px solid rgba(0,0,0,0.08);
    box-shadow: 0 10px 24px rgba(0,0,0,0.08);
    overflow: hidden;
    display: flex; align-items: center; justify-content: center;
  }

  /* Text block */
  .gl-text {
    text-align: center;
    animation: gl-fadeUp 0.5s 0.35s var(--ease) both; opacity: 0;
  }
  .gl-title {
    font-family: var(--fd); font-size: 26px; font-weight: 700;
    color: var(--ink); letter-spacing: -0.5px; line-height: 1.1;
    margin-bottom: 8px;
  }
  .gl-title em { font-style: italic; color: var(--sage-deep); }
  .gl-sub {
    font-size: 13px; color: var(--ash); line-height: 1.6;
  }

  /* Dot progress */
  .gl-dots {
    display: flex; gap: 6px;
    animation: gl-fadeUp 0.5s 0.48s var(--ease) both; opacity: 0;
  }
  .gl-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--sage-dark);
    animation: gl-dotBounce 1.2s ease-in-out infinite;
  }
  .gl-dot:nth-child(1) { animation-delay: 0s; }
  .gl-dot:nth-child(2) { animation-delay: 0.15s; }
  .gl-dot:nth-child(3) { animation-delay: 0.3s; }

  /* Bottom hint */
  .gl-hint {
    position: absolute; bottom: 32px; left: 50%;
    transform: translateX(-50%);
    font-size: 11px; color: var(--ash);
    white-space: nowrap;
    animation: gl-fadeUp 0.5s 0.6s var(--ease) both; opacity: 0;
  }

  /* ══ KEYFRAMES ══════════════════════════════════════════════ */

  @keyframes gl-fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes gl-slideDown {
    from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
  @keyframes gl-popIn {
    from { opacity: 0; transform: scale(0.82); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes gl-fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: none; }
  }
  @keyframes gl-spin {
    to { transform: rotate(360deg); }
  }
  @keyframes gl-dotBounce {
    0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
    40%           { transform: scale(1.2); opacity: 1; }
  }
`;

if (!document.getElementById('gl-styles')) {
  const s = document.createElement('style');
  s.id = 'gl-styles';
  s.textContent = CSS;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────────
   Logo mark SVG (consistent with TopNav)
───────────────────────────────────────────── */
/* ─────────────────────────────────────────────
   Guard loading screen
   variant: 'auth'    — checking session (neutral)
            'profile' — loading user profile data (warmer)
───────────────────────────────────────────── */
type GuardVariant = 'auth' | 'profile';

function GuardLoading({ variant = 'auth' }: { variant?: GuardVariant }) {
  const copy = {
    auth: {
      title: <>Checking your <em>session</em></>,
      sub: 'Verifying your sign-in credentials…',
      hint: 'This only takes a moment',
    },
    profile: {
      title: <>Loading your <em>fit profile</em></>,
      sub: 'Fetching your measurements and preferences…',
      hint: 'Setting up your personalised experience',
    },
  }[variant];

  return (
    <div className="gl-root">

      {/* Brand top-centre */}
      <Link to="/" className="gl-brand">
        <div className="gl-brand-mark"><AppLogo size={32} decorative /></div>
        <div className="gl-brand-copy">
          <span className="gl-brand-name">MatchMySize</span>
          <span className="gl-brand-tagline">Find Your Perfect Fit</span>
        </div>
      </Link>

      {/* Centre content */}
      <div className="gl-centre">
        {/* Concentric spinner with logo */}
        <div className="gl-spinner-wrap">
          <div className="gl-spinner-ring" />
          <div className="gl-spinner-ring-sage" />
          <div className="gl-spinner-icon">
            <div className="gl-spinner-icon-inner">
              <AppLogo size={40} decorative />
            </div>
          </div>
        </div>

        {/* Copy */}
        <div className="gl-text">
          <div className="gl-title">{copy.title}</div>
          <div className="gl-sub">{copy.sub}</div>
        </div>

        {/* Bouncing dots */}
        <div className="gl-dots">
          <div className="gl-dot" />
          <div className="gl-dot" />
          <div className="gl-dot" />
        </div>
      </div>

      {/* Subtle hint at bottom */}
      <div className="gl-hint">{copy.hint}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Route guards
───────────────────────────────────────────── */
export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <GuardLoading variant="profile" />;
  if (!user) return (
    <Navigate to="/auth/login" replace state={{ from: location.pathname }} />
  );
  return <Outlet />;
}

export function CustomerRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <GuardLoading variant="profile" />;
  if (!user) return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />;
  if (user.role === 'seller') return <Navigate to="/seller/dashboard" replace />;
  return <Outlet />;
}

export function SellerRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <GuardLoading variant="profile" />;
  if (!user) return <Navigate to="/seller/login" replace state={{ from: location.pathname }} />;
  if (user.role !== 'seller') return <Navigate to="/app/home" replace />;
  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { user, loading } = useAuth();

  if (loading) return <GuardLoading variant="auth" />;
  if (user) return <Navigate to={user.role === 'seller' ? '/seller/dashboard' : '/app/home'} replace />;
  return <Outlet />;
}
