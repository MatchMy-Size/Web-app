import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { TopNav } from '@/components/top-nav';
import { useAuth } from '@/context/auth-context';
import { useProfileSubject } from '@/context/profile-subject-context';

/* ─────────────────────────────────────────────
   CSS injected once
───────────────────────────────────────────── */
const CSS = `
  :root {
    --sage: #C3D8C1;
    --sage-light: #D9EBD7;
    --sage-deep: #7A9E78;
    --ink: #0D0D0D;
    --paper: #FAFAF8;
    --cloud: #EFEFEF;
    --white: #FFFFFF;
    --nav-h: 64px;
    --ease: cubic-bezier(0.22, 1, 0.36, 1);
  }

  /* ── Base reset for the shell ── */
  .as-root {
    min-height: 100vh;
    background: var(--paper);
    display: flex;
    flex-direction: column;
  }

  /* ── Page offset (below fixed TopNav) ── */
  .as-offset {
    flex: 1;
    padding-top: var(--nav-h);
    display: flex;
    flex-direction: column;
  }

  /* ── Route content area ── */
  .as-content {
    flex: 1;
    /* Page transitions are driven by .as-page-enter on the inner wrapper */
  }

  /* ── Page transition wrapper ── */
  .as-page {
    animation: as-pageIn 0.32s var(--ease) both;
  }

  @keyframes as-pageIn {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: none; }
  }

  /* ── Loading bar ── */
  .as-loading-bar {
    position: fixed;
    top: var(--nav-h);
    left: 0; right: 0;
    height: 2px;
    z-index: 199;
    background: linear-gradient(90deg, var(--sage-deep) 0%, var(--sage) 60%, transparent 100%);
    transform-origin: left;
    animation: as-loadBar 0.6s var(--ease) both;
  }

  @keyframes as-loadBar {
    from { transform: scaleX(0); opacity: 1; }
    80%  { transform: scaleX(0.9); opacity: 1; }
    to   { transform: scaleX(1); opacity: 0; }
  }

  /* ── Subtle grain texture overlay ── */
  .as-grain {
    position: fixed; inset: 0;
    pointer-events: none; z-index: 999;
    opacity: 0.25;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E");
  }

  /* ── Scroll-to-top fade button ── */
  .as-scroll-top {
    position: fixed;
    right: 32px; bottom: 32px;
    width: 40px; height: 40px;
    border-radius: 50%;
    background: var(--ink);
    border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: var(--white);
    box-shadow: 0 4px 16px rgba(13,13,13,0.22);
    z-index: 100;
    transition: opacity 0.3s var(--ease), transform 0.2s var(--ease);
  }
  .as-scroll-top:hover { transform: translateY(-2px) scale(1.05); }
  .as-scroll-top.hidden { opacity: 0; pointer-events: none; transform: translateY(8px); }
  .as-scroll-top svg { width: 16px; height: 16px; }

  /* ── Route-specific max-width normalisation ──
     Pages that want full-width (home, explore) handle
     their own max-width internally.
     Pages using the shared narrow layout get this cap. ── */
  .as-inner {
    width: 100%;
  }
`;

if (!document.getElementById('as-styles')) {
  const s = document.createElement('style');
  s.id = 'as-styles';
  s.textContent = CSS;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────────
   Scroll-to-top button
───────────────────────────────────────────── */
function ScrollTopBtn() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 320);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      className={`as-scroll-top${visible ? '' : ' hidden'}`}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top">
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M8 13V3M4 7l4-4 4 4" />
      </svg>
    </button>
  );
}

/* ─────────────────────────────────────────────
   Page transition wrapper — re-animates on route change
───────────────────────────────────────────── */
function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Reset + retrigger animation
    el.style.animation = 'none';
    void el.offsetHeight;
    el.style.animation = 'as-pageIn 0.32s var(--ease) both';
    // Scroll to top on route change
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  return <div ref={ref} className="as-page">{children}</div>;
}

/* ─────────────────────────────────────────────
   Loading bar — shown briefly after route changes
───────────────────────────────────────────── */
function LoadingBar() {
  const location  = useLocation();
  const [key, setKey] = useState(0);

  useEffect(() => {
    setKey(k => k + 1);
  }, [location.pathname]);

  return <div key={key} className="as-loading-bar" />;
}

/* ─────────────────────────────────────────────
   Main AppShell
───────────────────────────────────────────── */
export function AppShell() {
  const { user } = useAuth();
  const { selfProfile } = useProfileSubject();

  const firstName =
    typeof selfProfile?.firstName === 'string' && selfProfile.firstName.trim()
      ? selfProfile.firstName.trim()
      : '';
  const lastName =
    typeof selfProfile?.lastName === 'string' && selfProfile.lastName.trim()
      ? selfProfile.lastName.trim()
      : '';
  const profileName = `${firstName} ${lastName}`.trim() || undefined;

  const displayName =
    profileName ??
    user?.displayName ??
    user?.email ??
    undefined;

  return (
    <div className="as-root">
      {/* Grain texture overlay */}
      <div className="as-grain" aria-hidden="true" />

      {/* Fixed top navigation */}
      <TopNav
        userName={displayName}
        hasNotifications
        showAddCta
      />

      {/* Sage progress line on route change */}
      <LoadingBar />

      {/* Main content area */}
      <div className="as-offset">
        <div className="as-content">
          <div className="as-inner">
            <PageTransition>
              <Outlet />
            </PageTransition>
          </div>
        </div>
      </div>

      {/* Scroll-to-top button */}
      <ScrollTopBtn />
    </div>
  );
}

export default AppShell;
