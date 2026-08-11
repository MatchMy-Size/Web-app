import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

import { AppLogo } from '@/components/app-logo';
import { useProfileSubject } from '@/context/profile-subject-context';
import { signOutUser } from '@/lib/auth-api';

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
    --fd: 'Cormorant Garamond', serif;
    --fs: 'DM Sans', sans-serif;
    --ease: cubic-bezier(0.22, 1, 0.36, 1);
    --nav-h: 64px;
    --mobile-tab-h: 80px;
  }

  /* ── Shell ── */
  .tn-shell {
    position: fixed; top: 0; left: 0; right: 0;
    z-index: 200;
    height: var(--nav-h);
    background: rgba(250,250,248,0.88);
    backdrop-filter: blur(16px) saturate(1.4);
    border-bottom: 1px solid rgba(0,0,0,0.07);
    animation: tn-slideDown 0.55s var(--ease) both;
  }

  /* Thin sage progress accent at very top */
  .tn-progress-line {
    position: absolute; top: 0; left: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--sage-dark), var(--sage-deep));
    transition: width 0.4s var(--ease);
    border-radius: 0 2px 2px 0;
  }

  .tn-inner {
    max-width: 1400px; margin: 0 auto;
    height: 100%; padding: 0 40px;
    display: flex; align-items: center; gap: 0;
  }

  /* ── Brand ── */
  .tn-brand {
    display: flex; align-items: center; gap: 10px;
    text-decoration: none; margin-right: 48px; flex-shrink: 0;
  }
  .tn-brand-mark {
    width: 42px; height: 42px; border-radius: 12px;
    background: var(--white);
    border: 1px solid rgba(0,0,0,0.08);
    box-shadow: 0 8px 18px rgba(0,0,0,0.06);
    overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    transition: transform 0.2s var(--ease);
  }
  .tn-brand:hover .tn-brand-mark { transform: rotate(-4deg) scale(1.05); }
  .tn-brand-copy {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
    line-height: 1;
  }
  .tn-brand-name {
    font-family: var(--fd); font-size: 20px; font-weight: 600;
    color: var(--ink); letter-spacing: -0.3px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .tn-brand-tagline {
    font-size: 10px; font-weight: 600;
    color: var(--sage-deep);
    letter-spacing: 0.35px;
    text-transform: uppercase;
  }

  /* ── Nav links ── */
  .tn-links {
    position: fixed !important;
    top: auto !important;
    left: 50%;
    right: auto;
    bottom: 10px !important;
    bottom: calc(10px + env(safe-area-inset-bottom, 0px)) !important;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 4px;
    width: min(560px, calc(100vw - 28px));
    height: 66px;
    padding: 6px;
    overflow: visible;
    background: rgba(250,250,248,0.94);
    backdrop-filter: blur(18px) saturate(1.35);
    border: 1px solid rgba(0,0,0,0.08);
    border-radius: 18px;
    box-shadow: 0 16px 38px rgba(13,13,13,0.14);
    transform: translateX(-50%);
    z-index: 500;
    will-change: transform;
  }

  /* Sliding indicator pill (absolutely positioned) */
  .tn-indicator {
    display: none;
    position: absolute;
    background: var(--ink);
    border-radius: 8px;
    pointer-events: none;
    z-index: 0;
    transition: left 0.35s var(--ease), width 0.35s var(--ease), opacity 0.2s;
    top: 50%; transform: translateY(-50%);
    height: 36px;
  }

  .tn-link {
    position: relative; z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    height: 54px;
    padding: 7px 4px;
    border-radius: 13px;
    font-family: var(--fs); font-size: 10.5px; font-weight: 500;
    line-height: 1;
    color: var(--ash); text-decoration: none;
    transition: color 0.2s;
    white-space: nowrap;
    border: none; background: none; cursor: pointer;
    text-align: center;
  }
  .tn-link svg { width: 18px; height: 18px; flex-shrink: 0; transition: color 0.2s; }
  .tn-link:hover:not(.tn-active) { color: var(--ink); }
  .tn-link:hover:not(.tn-active) svg { color: var(--ink); }

  .tn-link.tn-active {
    background: var(--ink);
    color: var(--white);
  }
  .tn-link.tn-active svg { color: var(--white); }

  .tn-link-badge {
    font-size: 10px; font-weight: 800;
    background: var(--sage-light); color: var(--sage-deep);
    border-radius: 999px; padding: 1px 6px;
    line-height: 1.6; min-width: 18px; text-align: center;
    transition: background 0.2s, color 0.2s;
  }
  .tn-link.tn-active .tn-link-badge {
    background: rgba(255,255,255,0.18); color: var(--white);
  }

  /* ── Right actions ── */
  .tn-actions {
    display: flex; align-items: center; gap: 8px; margin-left: auto; flex-shrink: 0;
  }

  .tn-icon-btn {
    width: 36px; height: 36px; border-radius: 9px;
    background: none; border: 1.5px solid var(--cloud);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: var(--ash);
    transition: all 0.18s; position: relative;
    flex-shrink: 0;
  }
  .tn-icon-btn:hover { background: var(--cloud); color: var(--ink); border-color: var(--mist); }
  .tn-icon-btn svg { width: 15px; height: 15px; }

  /* Notification dot */
  .tn-notif-dot {
    position: absolute; top: 7px; right: 7px;
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--sage-deep);
    border: 1.5px solid var(--paper);
    animation: tn-pulse 2.5s ease-in-out infinite;
  }

  /* Search */
  .tn-search-wrap {
    display: flex; align-items: center; gap: 8px;
    background: var(--white); border: 1.5px solid var(--cloud);
    border-radius: 9px; padding: 0 12px;
    height: 36px; transition: all 0.2s;
    min-width: 180px; max-width: 240px;
  }
  .tn-search-wrap:focus-within {
    border-color: var(--ink); box-shadow: 0 0 0 3px rgba(13,13,13,0.05);
    min-width: 240px;
  }
  .tn-search-wrap svg { width: 14px; height: 14px; color: var(--ash); flex-shrink: 0; }
  .tn-search-input {
    flex: 1; border: none; outline: none; background: transparent;
    font-family: var(--fs); font-size: 13px; color: var(--ink);
    min-width: 0;
  }
  .tn-search-input::placeholder { color: var(--mist); }

  /* Shortcut hint */
  .tn-search-hint {
    font-size: 10px; font-weight: 600; color: var(--mist);
    background: var(--cloud); border-radius: 4px;
    padding: 2px 5px; flex-shrink: 0; letter-spacing: 0.2px;
  }
  .tn-search-wrap:focus-within .tn-search-hint { display: none; }

  /* Divider */
  .tn-divider {
    width: 1px; height: 24px; background: var(--cloud); flex-shrink: 0;
  }

  /* User avatar button */
  .tn-user-btn {
    display: flex; align-items: center; gap: 9px;
    background: none; border: 1.5px solid var(--cloud);
    border-radius: 10px; padding: 5px 12px 5px 6px;
    cursor: pointer; transition: all 0.18s; flex-shrink: 0;
    min-width: 142px;
    max-width: 186px;
  }
  .tn-user-btn:hover,
  .tn-user-btn.is-open { border-color: var(--mist); background: var(--cloud); }
  .tn-avatar {
    width: 26px; height: 26px; border-radius: 50%;
    background: var(--ink); display: flex; align-items: center; justify-content: center;
    font-family: var(--fd); font-size: 11px; font-weight: 700; color: var(--white);
    flex-shrink: 0;
  }
  .tn-user-copy {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
    flex: 1;
    text-align: left;
  }
  .tn-user-name { font-size: 12.5px; font-weight: 700; color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .tn-user-sub { font-size: 10.5px; font-weight: 600; color: var(--ash); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .tn-user-caret {
    width: 10px; height: 10px; flex-shrink: 0; color: var(--ash);
    transition: transform 0.18s;
  }
  .tn-user-btn.is-open .tn-user-caret { transform: rotate(180deg); }

  .tn-subject-avatar {
    width: 26px; height: 26px; border-radius: 50%;
    background: var(--sage-light);
    border: 1px solid var(--sage-dark);
    display: flex; align-items: center; justify-content: center;
    font-family: var(--fs); font-size: 11px; font-weight: 800;
    color: var(--sage-deep);
    flex-shrink: 0;
    text-transform: uppercase;
  }
  .tn-subject-copy {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
    text-align: left;
    flex: 1;
  }
  .tn-subject-label {
    font-size: 12.5px; font-weight: 700; color: var(--ink);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .tn-subject-sub {
    font-size: 10.5px; font-weight: 600; color: var(--ash);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .tn-subject-caret {
    width: 10px; height: 10px; flex-shrink: 0;
    color: var(--ash);
    transition: transform 0.18s;
  }
  .tn-subject-btn.is-open .tn-subject-caret { transform: rotate(180deg); }
  .tn-subject-menu {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    width: 240px;
    background: rgba(250,250,248,0.98);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(0,0,0,0.08);
    border-radius: 14px;
    box-shadow: 0 18px 40px rgba(13,13,13,0.12);
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .tn-subject-item {
    display: flex; align-items: center; gap: 10px;
    width: 100%;
    background: none;
    border: none;
    border-radius: 10px;
    padding: 9px 10px;
    cursor: pointer;
    text-align: left;
    transition: all 0.18s;
  }
  .tn-subject-item:hover { background: var(--cloud); }
  .tn-subject-item.active {
    background: var(--ink);
  }
  .tn-subject-item.active .tn-subject-avatar {
    background: rgba(255,255,255,0.12);
    border-color: rgba(255,255,255,0.18);
    color: var(--white);
  }
  .tn-subject-item-copy {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
    flex: 1;
  }
  .tn-subject-item-label {
    font-size: 12.5px; font-weight: 700; color: var(--ink);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .tn-subject-item-sub {
    font-size: 10.5px; font-weight: 600; color: var(--ash);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .tn-subject-item.active .tn-subject-item-label,
  .tn-subject-item.active .tn-subject-item-sub {
    color: var(--white);
  }
  .tn-subject-check {
    width: 14px; height: 14px; flex-shrink: 0;
    color: transparent;
  }
  .tn-subject-item.active .tn-subject-check {
    color: var(--sage);
  }
  .tn-subject-menu-footer {
    margin-top: 4px;
    padding-top: 8px;
    border-top: 1px solid var(--cloud);
  }
  .tn-subject-manage {
    width: 100%;
    background: var(--white);
    border: 1px solid var(--cloud);
    border-radius: 10px;
    padding: 9px 10px;
    font-family: var(--fs); font-size: 12px; font-weight: 700;
    color: var(--ink);
    cursor: pointer;
    transition: all 0.18s;
  }
  .tn-subject-manage:hover {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--white);
  }
  .tn-subject-logout {
    width: 100%;
    margin-top: 6px;
    padding: 9px 10px;
    display: flex; align-items: center; justify-content: center; gap: 7px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 10px;
    font-family: var(--fs); font-size: 12px; font-weight: 700;
    color: #B43A3A;
    cursor: pointer;
    transition: all 0.18s;
  }
  .tn-subject-logout:hover:not(:disabled) {
    background: #FFF1F0;
    border-color: #F4CECB;
  }
  .tn-subject-logout:disabled {
    opacity: 0.55;
    cursor: wait;
  }
  .tn-subject-logout svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
  }

  .tn-user-wrap {
    position: relative;
    flex-shrink: 0;
  }

  /* CTA button */
  .tn-cta-btn {
    font-family: var(--fs); font-size: 13px; font-weight: 600;
    color: var(--white); background: var(--ink);
    border: none; border-radius: 9px;
    padding: 0 16px; height: 36px; cursor: pointer;
    display: flex; align-items: center; gap: 6px;
    transition: opacity 0.2s, transform 0.15s;
    white-space: nowrap; flex-shrink: 0;
  }
  .tn-cta-btn:hover { opacity: 0.85; transform: translateY(-1px); }
  .tn-cta-btn:active { transform: scale(0.97); }
  .tn-cta-btn svg { width: 13px; height: 13px; }

  /* ── Keyframes ── */
  @keyframes tn-slideDown {
    from { opacity: 0; transform: translateY(-100%); }
    to   { opacity: 1; transform: none; }
  }
  @keyframes tn-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.6; transform: scale(0.85); }
  }

  /* ── Page offset so content starts below nav ── */
  .tn-page-offset { padding-top: var(--nav-h); }

  @media (max-width: 960px) {
    :root {
      --nav-h: 76px;
      --mobile-tab-h: 80px;
    }

    .tn-shell {
      height: auto;
      min-height: var(--nav-h);
    }

    .tn-inner {
      padding: 10px 16px;
      gap: 12px;
      flex-wrap: wrap;
      align-items: center;
    }

    .tn-brand {
      margin-right: auto;
    }

    .tn-search-wrap,
    .tn-divider {
      display: none;
    }

    .tn-cta-btn {
      display: none;
    }

    .tn-subject-sub {
      display: none;
    }

    .tn-user-sub {
      display: none;
    }

    .tn-links::-webkit-scrollbar { display: none; }

    .tn-indicator {
      display: none;
    }

    .tn-link.tn-active {
      background: var(--ink);
      border-color: var(--ink);
      color: var(--white);
    }

    .tn-actions {
      margin-left: 0;
      min-width: 0;
      flex: 1 1 auto;
      justify-content: flex-end;
      flex-wrap: wrap;
      row-gap: 8px;
    }

    .tn-user-wrap {
      min-width: 0;
    }

    .tn-subject-menu {
      width: min(320px, calc(100vw - 24px));
      max-height: min(70vh, 420px);
      overflow: auto;
    }

    .tn-user-btn {
      min-width: 0;
      padding-right: 8px;
      max-width: min(220px, 34vw);
    }
  }

  @media (max-width: 640px) {
    :root {
      --nav-h: 72px;
      --mobile-tab-h: 80px;
    }

    .tn-inner {
      padding: 10px 12px;
      gap: 8px;
      align-items: center;
      flex-wrap: nowrap;
    }

    .tn-brand {
      min-width: 0;
      margin-right: auto;
      gap: 8px;
    }

    .tn-brand-name {
      font-size: 18px;
    }

    .tn-brand-tagline {
      font-size: 9px;
    }

    .tn-actions {
      width: auto;
      justify-content: flex-end;
      gap: 8px;
      flex-wrap: nowrap;
      flex: 1 1 auto;
      min-width: 0;
    }

    .tn-icon-btn {
      width: 40px;
      height: 40px;
      border-radius: 12px;
    }

    .tn-subject-label {
      font-size: 12px;
    }

    .tn-user-wrap {
      position: relative;
      flex: 0 1 150px;
      min-width: 0;
      z-index: 4;
    }

    .tn-user-btn {
      width: 100%;
      max-width: none;
      min-height: 40px;
      padding: 5px 8px 5px 6px;
      gap: 8px;
    }

    .tn-subject-menu {
      position: absolute;
      top: calc(100% + 8px);
      left: 0;
      right: 0;
      width: auto;
      max-height: min(60vh, 420px);
      z-index: 30;
    }

    .tn-links {
      width: calc(100vw - 24px);
    }
  }

  @media (max-width: 390px) {
    .tn-brand-name {
      max-width: 118px;
      font-size: 16px;
    }

    .tn-brand-tagline {
      display: none;
    }

    .tn-user-wrap {
      flex-basis: 118px;
    }
  }
`;

const topNavStyles = document.getElementById('tn-styles');
if (topNavStyles) {
  topNavStyles.textContent = CSS;
} else {
  const s = document.createElement('style');
  s.id = 'tn-styles';
  s.textContent = CSS;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────────
   SVG icons
───────────────────────────────────────────── */
const Ico = {
  Home:    () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7.5L8 2l6 5.5V14H2V7.5z"/></svg>,
  Compass: () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="6"/><path d="M10.5 5.5l-2 4.5-4.5 2 2-4.5 4.5-2z"/></svg>,
  Ruler:   () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1" y="6" width="14" height="4" rx="1"/><path d="M4 6v2M7 6v3M10 6v2M13 6v3"/></svg>,
  User:    () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>,
  Bell:    () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 2a4 4 0 014 4c0 2.5.5 4 1.5 5H2.5C3.5 10 4 8.5 4 6a4 4 0 014-4z"/><path d="M6.5 13a1.5 1.5 0 003 0"/></svg>,
  Search:  () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5l3 3"/></svg>,
  Plus:    () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 3v10M3 8h10"/></svg>,
  Settings:() => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="2.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M3.1 12.9l1.4-1.4M11.5 4.5l1.4-1.4"/></svg>,
  Caret:   () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6l4 4 4-4"/></svg>,
  Check:   () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 8.5l3 3L12.5 5.5"/></svg>,
  Logout:  () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 2.5H3.5a1 1 0 00-1 1v9a1 1 0 001 1h3M10.5 5l3 3-3 3M13.5 8h-8"/></svg>,
};

/* ─────────────────────────────────────────────
   Nav items config
───────────────────────────────────────────── */
const NAV_ITEMS = [
  { to: '/app/home',         label: 'Home',         icon: Ico.Home },
  { to: '/app/explore',      label: 'Explore',      icon: Ico.Compass },
  { to: '/app/measurements', label: 'Measurements', icon: Ico.Ruler },
  { to: '/app/profile',      label: 'Profile',      icon: Ico.User },
];

/* ─────────────────────────────────────────────
   Sliding indicator hook
───────────────────────────────────────────── */
function useSlidingIndicator(deps: string) {
  const linksRef  = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });

  const update = () => {
    const container = linksRef.current;
    if (!container) return;
    const active = container.querySelector<HTMLElement>('.tn-active');
    if (!active) { setIndicatorStyle(s => ({ ...s, opacity: 0 })); return; }
    const cr = container.getBoundingClientRect();
    const ar = active.getBoundingClientRect();
    setIndicatorStyle({ left: ar.left - cr.left, width: ar.width, opacity: 1 });
  };

  useEffect(() => {
    // slight delay so DOM has settled
    const t = setTimeout(update, 20);
    return () => clearTimeout(t);
  }, [deps]);

  useEffect(() => {
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return { linksRef, indicatorStyle };
}

/* ─────────────────────────────────────────────
   Progress line (shows scroll depth)
───────────────────────────────────────────── */
function useScrollProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      setPct(total > 0 ? Math.round((scrolled / total) * 100) : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return pct;
}

/* ─────────────────────────────────────────────
   Props
───────────────────────────────────────────── */
type TopNavProps = {
  /** User display name (e.g. "Kasun Fernando") */
  userName?: string;
  /** Show notification dot on bell */
  hasNotifications?: boolean;
  /** Called when search value changes */
  onSearch?: (query: string) => void;
  /** Show "Add preference" CTA */
  showAddCta?: boolean;
};

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */
export function TopNav({
  userName,
  hasNotifications = true,
  onSearch,
  showAddCta = false,
}: TopNavProps) {
  const { selectedSubject, subjectOptions, setSelectedSubjectKey } = useProfileSubject();
  const location = useLocation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [subjectMenuOpen, setSubjectMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const { linksRef, indicatorStyle } = useSlidingIndicator(location.pathname);
  const scrollPct = useScrollProgress();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    onSearch?.(e.target.value);
  };

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    setSubjectMenuOpen(false);
    try {
      await signOutUser();
    } catch {
      // signOutUser always clears the local session, even if the remote logout fails.
    } finally {
      navigate('/auth/login', { replace: true });
      setSigningOut(false);
    }
  };

  // Keyboard shortcut: / to focus search
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const subjectMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!subjectMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!subjectMenuRef.current?.contains(event.target as Node)) {
        setSubjectMenuOpen(false);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    return () => window.removeEventListener('mousedown', handlePointerDown);
  }, [subjectMenuOpen]);

  const displayName = userName
    ? userName.split(' ')[0]
    : 'Account';
  const currentSubject = selectedSubject ?? subjectOptions[0] ?? null;
  const currentSubjectLabel = currentSubject?.label ?? displayName;
  const currentSubjectSubtitle =
    currentSubject?.type === 'family'
      ? currentSubject.subtitle
      : 'My profile';
  const currentSubjectInitials =
    currentSubjectLabel
      .split(' ')
      .map((word) => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'ME';

  const navLinks = (
    <nav className="tn-links" ref={linksRef} aria-label="Primary navigation">
      {/* Sliding indicator */}
      <div
        className="tn-indicator"
        style={{
          left:    indicatorStyle.left,
          width:   indicatorStyle.width,
          opacity: indicatorStyle.opacity,
        }}
      />

      {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
        const active = location.pathname === to || location.pathname.startsWith(`${to}/`);
        return (
          <NavLink
            key={to}
            to={to}
            className={`tn-link${active ? ' tn-active' : ''}`}>
            <Icon />
            {label}
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <>
      <header className="tn-shell">
        {/* Scroll progress line */}
        <div className="tn-progress-line" style={{ width: `${scrollPct}%` }} />

        <div className="tn-inner">

        {/* Brand */}
        <NavLink to="/app/home" className="tn-brand">
          <div className="tn-brand-mark"><AppLogo size={34} decorative /></div>
          <div className="tn-brand-copy">
            <span className="tn-brand-name">MatchMySize</span>
            <span className="tn-brand-tagline">Find Your Perfect Fit</span>
          </div>
        </NavLink>

        {/* Right actions */}
        <div className="tn-actions">

          {/* Search */}
          <div className="tn-search-wrap">
            <Ico.Search />
            <input
              ref={searchRef}
              className="tn-search-input"
              placeholder="Search brands…"
              value={search}
              onChange={handleSearch}
            />
            <span className="tn-search-hint">/</span>
          </div>

          <div className="tn-divider" />

          {/* Bell */}
          <button className="tn-icon-btn" onClick={() => {}}>
            <Ico.Bell />
            {hasNotifications && <div className="tn-notif-dot" />}
          </button>

          {/* Add preference CTA */}
          {showAddCta && (
            <button className="tn-cta-btn" onClick={() => navigate('/app/add-preference')}>
              <Ico.Plus /> {currentSubject?.type === 'family' ? 'Add measurements' : 'Add preference'}
            </button>
          )}

          <div className="tn-divider" />

          {/* Profile selector */}
          <div className="tn-user-wrap" ref={subjectMenuRef}>
            <button
              className={`tn-user-btn${subjectMenuOpen ? ' is-open' : ''}`}
              onClick={() => setSubjectMenuOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={subjectMenuOpen}>
              <div className="tn-avatar">{currentSubjectInitials}</div>
              <div className="tn-user-copy">
                <span className="tn-user-name">{currentSubjectLabel}</span>
                <span className="tn-user-sub">{currentSubjectSubtitle}</span>
              </div>
              <div className="tn-user-caret"><Ico.Caret /></div>
            </button>

            {subjectMenuOpen && (
              <div className="tn-subject-menu" role="menu">
                {subjectOptions.map((option) => {
                  const optionInitials =
                    option.label
                      .split(' ')
                      .map((word) => word[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase() || 'P';
                  const active = currentSubject?.key === option.key;

                  return (
                    <button
                      key={option.key}
                      className={`tn-subject-item${active ? ' active' : ''}`}
                      role="menuitemradio"
                      aria-checked={active}
                      onClick={() => {
                        setSelectedSubjectKey(option.key);
                        setSubjectMenuOpen(false);
                      }}>
                      <div className="tn-subject-avatar">{optionInitials}</div>
                      <div className="tn-subject-item-copy">
                        <span className="tn-subject-item-label">{option.label}</span>
                        <span className="tn-subject-item-sub">{option.subtitle}</span>
                      </div>
                      <div className="tn-subject-check"><Ico.Check /></div>
                    </button>
                  );
                })}

                <div className="tn-subject-menu-footer">
                  <button
                    className="tn-subject-manage"
                    onClick={() => {
                      setSubjectMenuOpen(false);
                      navigate('/app/profile');
                    }}>
                    Manage family profiles
                  </button>
                  <button
                    type="button"
                    className="tn-subject-logout"
                    role="menuitem"
                    disabled={signingOut}
                    onClick={() => void handleSignOut()}>
                    <Ico.Logout /> {signingOut ? 'Logging out…' : 'Log out'}
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        </div>
      </header>
      {navLinks}
    </>
  );
}

export default TopNav;
