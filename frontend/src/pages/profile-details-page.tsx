import { useMemo, useEffect, useRef, type JSX } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/context/auth-context';
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
    --fd: 'Cormorant Garamond', serif;
    --fs: 'DM Sans', sans-serif;
    --ease: cubic-bezier(0.22, 1, 0.36, 1);
  }

  .pd-root {
    min-height: 100vh;
    background: var(--paper);
    font-family: var(--fs);
  }

  /* ── Topbar ── */
  .pd-topbar {
    position: sticky; top: 0; z-index: 50;
    height: 64px;
    background: rgba(250,250,248,0.92);
    backdrop-filter: blur(14px);
    border-bottom: 1px solid var(--cloud);
    display: flex; align-items: center;
    padding: 0 48px; gap: 14px;
    animation: pd-fadeDown 0.5s var(--ease) both;
  }
  .pd-back-btn {
    display: flex; align-items: center; gap: 7px;
    font-family: var(--fs); font-size: 13px; font-weight: 600;
    color: var(--ash); background: none; border: none;
    cursor: pointer; padding: 8px 14px; border-radius: 8px;
    transition: all 0.18s;
  }
  .pd-back-btn:hover { background: var(--cloud); color: var(--ink); }
  .pd-back-btn svg { width: 14px; height: 14px; }
  .pd-topbar-divider { width: 1px; height: 22px; background: var(--cloud); }
  .pd-topbar-title {
    font-family: var(--fd); font-size: 20px; font-weight: 700;
    color: var(--ink); letter-spacing: -0.4px;
  }
  .pd-edit-btn {
    margin-left: auto;
    display: flex; align-items: center; gap: 7px;
    font-family: var(--fs); font-size: 13px; font-weight: 600;
    color: var(--white); background: var(--ink);
    border: none; border-radius: 9px;
    padding: 0 16px; height: 36px; cursor: pointer;
    transition: opacity 0.2s, transform 0.15s;
  }
  .pd-edit-btn:hover { opacity: 0.85; transform: translateY(-1px); }
  .pd-edit-btn:active { transform: scale(0.97); }
  .pd-edit-btn svg { width: 14px; height: 14px; }

  /* ── Body ── */
  .pd-body {
    max-width: 760px; margin: 0 auto;
    padding: 44px 48px 80px;
    display: flex; flex-direction: column; gap: 28px;
  }

  /* ── Hero card ── */
  .pd-hero {
    background: var(--ink); border-radius: 20px;
    padding: 36px 36px 32px;
    display: flex; align-items: center; gap: 24px;
    position: relative; overflow: hidden;
    animation: pd-fadeUp 0.5s 0.05s var(--ease) both;
  }
  .pd-hero-glow {
    position: absolute; top: -60px; right: -60px;
    width: 220px; height: 220px; border-radius: 50%;
    background: rgba(195,216,193,0.08); pointer-events: none;
  }
  .pd-hero-glow2 {
    position: absolute; bottom: -80px; left: -40px;
    width: 180px; height: 180px; border-radius: 50%;
    background: rgba(195,216,193,0.04); pointer-events: none;
  }

  /* Avatar */
  .pd-avatar-wrap {
    position: relative; flex-shrink: 0;
    animation: pd-popIn 0.6s 0.2s var(--ease) both;
  }
  .pd-avatar-ring {
    position: absolute; inset: -4px; border-radius: 50%;
    border: 1.5px solid rgba(195,216,193,0.25);
    animation: pd-ringPulse 2s ease-out 0.8s both;
  }
  .pd-avatar {
    width: 80px; height: 80px; border-radius: 50%;
    background: rgba(255,255,255,0.10);
    border: 1.5px solid rgba(255,255,255,0.15);
    display: flex; align-items: center; justify-content: center;
    overflow: hidden; position: relative; z-index: 1;
  }
  .pd-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .pd-avatar-initials {
    font-family: var(--fd); font-size: 30px; font-weight: 700;
    color: var(--white); letter-spacing: -0.5px;
  }

  /* Hero text */
  .pd-hero-body { flex: 1; position: relative; z-index: 1; }
  .pd-hero-role {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(195,216,193,0.12);
    border: 1px solid rgba(195,216,193,0.2);
    border-radius: 999px; padding: 4px 12px; margin-bottom: 10px;
  }
  .pd-hero-role-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--sage);
    box-shadow: 0 0 5px var(--sage);
  }
  .pd-hero-role-text {
    font-size: 11px; font-weight: 700; color: var(--sage);
    letter-spacing: 0.5px; text-transform: uppercase;
  }
  .pd-hero-name {
    font-family: var(--fd); font-size: 30px; font-weight: 700;
    color: var(--white); letter-spacing: -0.6px; line-height: 1.1;
    margin-bottom: 6px;
  }
  .pd-hero-sub { font-size: 13px; color: rgba(255,255,255,0.4); }

  /* Hero action */
  .pd-hero-edit-btn {
    position: relative; z-index: 1; flex-shrink: 0;
    display: flex; align-items: center; gap: 7px;
    font-family: var(--fs); font-size: 12.5px; font-weight: 700;
    color: var(--ink); background: var(--sage-light);
    border: 1px solid var(--sage-dark); border-radius: 9px;
    padding: 9px 16px; cursor: pointer;
    transition: transform 0.15s, box-shadow 0.2s;
  }
  .pd-hero-edit-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(195,216,193,0.3); }
  .pd-hero-edit-btn:active { transform: scale(0.97); }
  .pd-hero-edit-btn svg { width: 13px; height: 13px; }

  /* ── Section card ── */
  .pd-section-card {
    background: var(--white); border: 1px solid var(--cloud);
    border-radius: 20px; overflow: hidden;
    animation: pd-fadeUp var(--dur, 0.5s) var(--del, 0.12s) var(--ease) both;
  }
  .pd-section-header {
    display: flex; align-items: center; gap: 10px;
    padding: 18px 28px 14px;
    border-bottom: 1px solid var(--cloud);
  }
  .pd-section-icon {
    width: 30px; height: 30px; border-radius: 8px;
    background: var(--paper); border: 1px solid var(--cloud);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .pd-section-icon svg { width: 14px; height: 14px; color: var(--ash); }
  .pd-section-title {
    font-size: 11px; font-weight: 700; color: var(--ash);
    letter-spacing: 0.8px; text-transform: uppercase;
  }

  /* Detail rows */
  .pd-detail-row {
    display: flex; align-items: center;
    padding: 16px 28px;
    border-bottom: 1px solid var(--cloud);
    gap: 16px; transition: background 0.15s;
  }
  .pd-detail-row:last-child { border-bottom: none; }
  .pd-detail-row:hover { background: var(--paper); }
  .pd-detail-icon {
    width: 34px; height: 34px; border-radius: 9px;
    background: var(--paper); border: 1px solid var(--cloud);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .pd-detail-icon svg { width: 14px; height: 14px; color: var(--ash); }
  .pd-detail-icon.accent { background: var(--sage-light); border-color: var(--sage-dark); }
  .pd-detail-icon.accent svg { color: var(--sage-deep); }
  .pd-detail-label {
    font-size: 11px; font-weight: 600; color: var(--ash);
    margin-bottom: 2px; letter-spacing: 0.2px;
  }
  .pd-detail-value {
    font-size: 14px; font-weight: 700; color: var(--ink);
  }
  .pd-detail-value.empty { color: var(--mist); font-weight: 500; }
  .pd-detail-text { flex: 1; min-width: 0; }

  /* Gender badge */
  .pd-gender-badge {
    display: inline-flex; align-items: center; gap: 5px;
    background: rgba(13,13,13,0.06); border-radius: 999px;
    padding: 3px 10px; font-size: 11px; font-weight: 700; color: var(--ink);
    text-transform: capitalize;
  }

  /* Preference badge */
  .pd-pref-badge {
    display: inline-flex; align-items: center; gap: 5px;
    background: var(--sage-light); border: 1px solid var(--sage-dark);
    border-radius: 999px; padding: 3px 10px;
    font-size: 11px; font-weight: 700; color: var(--sage-deep);
  }

  /* ── Read-only notice ── */
  .pd-readonly-notice {
    display: flex; align-items: center; gap: 12px;
    background: rgba(13,13,13,0.04); border: 1px solid var(--cloud);
    border-radius: 12px; padding: 14px 18px;
    font-size: 13px; color: var(--ash); line-height: 1.5;
    animation: pd-fadeUp 0.5s 0.3s var(--ease) both;
  }
  .pd-readonly-notice svg { width: 15px; height: 15px; flex-shrink: 0; color: var(--mist); }

  /* ── Keyframes ── */
  @keyframes pd-fadeDown {
    from { opacity: 0; transform: translateY(-14px); }
    to   { opacity: 1; transform: none; }
  }
  @keyframes pd-fadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: none; }
  }
  @keyframes pd-popIn {
    from { opacity: 0; transform: scale(0.78); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes pd-ringPulse {
    0%   { opacity: 0; transform: scale(0.9); }
    50%  { opacity: 1; }
    100% { opacity: 0; transform: scale(1.2); }
  }

  @media (max-width: 640px) {
    .pd-root {
      min-height: 100dvh;
      overflow-x: hidden;
    }

    .pd-topbar {
      height: auto;
      min-height: 58px;
      padding: 10px 14px;
      gap: 8px;
    }

    .pd-back-btn {
      padding: 8px 0;
      font-size: 12px;
    }

    .pd-topbar-divider {
      display: none;
    }

    .pd-topbar-title {
      font-size: 18px;
    }

    .pd-edit-btn {
      height: 36px;
      padding: 0 11px;
      font-size: 12px;
      margin-left: auto;
    }

    .pd-body {
      width: 100%;
      padding: 16px 14px calc(112px + env(safe-area-inset-bottom, 0px));
      gap: 16px;
    }

    .pd-hero {
      align-items: flex-start;
      gap: 14px;
      padding: 20px 16px;
      border-radius: 16px;
      flex-wrap: wrap;
    }

    .pd-avatar {
      width: 64px;
      height: 64px;
    }

    .pd-avatar-initials {
      font-size: 24px;
    }

    .pd-hero-body {
      min-width: 0;
      flex: 1 1 calc(100% - 82px);
    }

    .pd-hero-name {
      font-size: 25px;
      overflow-wrap: anywhere;
    }

    .pd-hero-sub {
      overflow-wrap: anywhere;
    }

    .pd-hero-edit-btn {
      width: 100%;
      justify-content: center;
      min-height: 40px;
    }

    .pd-section-card {
      border-radius: 15px;
    }

    .pd-section-header {
      padding: 14px 16px 11px;
    }

    .pd-detail-row {
      align-items: flex-start;
      gap: 12px;
      padding: 14px 16px;
    }

    .pd-detail-value,
    .pd-pref-badge,
    .pd-gender-badge {
      overflow-wrap: anywhere;
    }

    .pd-readonly-notice {
      align-items: flex-start;
      padding: 13px 14px;
      border-radius: 12px;
    }
  }
`;

if (!document.getElementById('pd-styles')) {
  const s = document.createElement('style');
  s.id = 'pd-styles';
  s.textContent = CSS;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────────
   SVG icons
───────────────────────────────────────────── */
const Ico = {
  Back:    () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M13 8H3M7 4l-4 4 4 4"/></svg>,
  Edit:    () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M11 2l3 3-8 8H3v-3L11 2z"/></svg>,
  User:    () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>,
  Phone:   () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="4" y="1" width="8" height="14" rx="2"/><circle cx="8" cy="12" r="0.7" fill="currentColor" stroke="none"/></svg>,
  Mail:    () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="4" width="12" height="9" rx="1.5"/><path d="M2 5l6 5 6-5"/></svg>,
  Gender:  () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="4"/><path d="M12 4l2-2M14 4h-2v2"/><path d="M8 12v2"/></svg>,
  Shirt:   () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M6 2l2 2 2-2 3 2-1.5 3H11v7H5V7H3.5L2 4l3-2z"/></svg>,
  Shield:  () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 2l5 2v4c0 3-2.5 5.5-5 6-2.5-.5-5-3-5-6V4l5-2z"/></svg>,
  Info:    () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="6"/><path d="M8 7v5M8 5v.5"/></svg>,
};

/* ─────────────────────────────────────────────
   Detail row component
───────────────────────────────────────────── */
function DetailRow({ icon, accent = false, label, value, children }: {
  icon: () => JSX.Element;
  accent?: boolean;
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  const Icon = icon;
  const isEmpty = !value || value === 'Not set';
  return (
    <div className="pd-detail-row">
      <div className={`pd-detail-icon${accent ? ' accent' : ''}`}><Icon /></div>
      <div className="pd-detail-text">
        <div className="pd-detail-label">{label}</div>
        {children ?? (
          <div className={`pd-detail-value${isEmpty ? ' empty' : ''}`}>
            {isEmpty ? '—' : value}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */
export function ProfileDetailsPage() {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const { profile } = useRecommendationData(user?.uid, { subject: 'self' });

  const fullName = useMemo(() =>
    `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim() || 'User',
    [profile]
  );
  const initials = useMemo(() =>
    `${profile?.firstName?.[0] ?? ''}${profile?.lastName?.[0] ?? ''}`.toUpperCase() || 'U',
    [profile]
  );

  const phone    = String(profile?.phoneNumber ?? '');
  const email    = String(profile?.email ?? '');
  const gender   = String(profile?.gender ?? '');
  const prefLabel = String(profile?.preferredClothingLabel ?? profile?.preferredClothing ?? '');
  const role     = String(profile?.role ?? 'customer');

  const display = (v: string) => v || 'Not set';

  return (
    <div className="pd-root">

      {/* ── Topbar ── */}
      <div className="pd-topbar">
        <button className="pd-back-btn" onClick={() => navigate('/app/profile')}>
          Profile
        </button>
        <div className="pd-topbar-divider" />
        <span className="pd-topbar-title">Profile details</span>
        <button className="pd-edit-btn" onClick={() => navigate('/app/profile/edit')}>
          <Ico.Edit /> Edit profile
        </button>
      </div>

      {/* ── Body ── */}
      <div className="pd-body">

        {/* Hero card */}
        <div className="pd-hero">
          <div className="pd-hero-glow" />
          <div className="pd-hero-glow2" />

          <div className="pd-avatar-wrap">
            <div className="pd-avatar-ring" />
            <div className="pd-avatar">
              {profile?.photoURL
                ? <img src={profile.photoURL} alt={fullName} />
                : <span className="pd-avatar-initials">{initials}</span>
              }
            </div>
          </div>

          <div className="pd-hero-body">
            <div className="pd-hero-role">
              <div className="pd-hero-role-dot" />
              <span className="pd-hero-role-text">{role}</span>
            </div>
            <div className="pd-hero-name">{fullName}</div>
            <div className="pd-hero-sub">
              {email || phone || 'Account member'}
            </div>
          </div>

          <button className="pd-hero-edit-btn" onClick={() => navigate('/app/profile/edit')}>
            <Ico.Edit /> Edit
          </button>
        </div>

        {/* Personal info section */}
        <div className="pd-section-card" style={{ '--del': '0.14s' } as any}>
          <div className="pd-section-header">
            <div className="pd-section-icon"><Ico.User /></div>
            <span className="pd-section-title">Personal information</span>
          </div>

          <DetailRow icon={Ico.User} label="Full name" value={display(fullName !== 'User' ? fullName : '')} />
          <DetailRow icon={Ico.Phone} label="Phone number" value={display(phone)} />
          <DetailRow icon={Ico.Mail} label="Email address" value={display(email)} />
          <DetailRow icon={Ico.Gender} label="Gender">
            {gender ? (
              <span className="pd-gender-badge">{gender}</span>
            ) : (
              <span className="pd-detail-value empty">—</span>
            )}
          </DetailRow>
        </div>

        {/* Clothing preferences section */}
        <div className="pd-section-card" style={{ '--del': '0.22s' } as any}>
          <div className="pd-section-header">
            <div className="pd-section-icon"><Ico.Shirt /></div>
            <span className="pd-section-title">Clothing preferences</span>
          </div>

          <DetailRow icon={Ico.Shirt} accent label="Default preference">
            {prefLabel ? (
              <span className="pd-pref-badge">
                👕 {prefLabel}
              </span>
            ) : (
              <span className="pd-detail-value empty">—</span>
            )}
          </DetailRow>
        </div>

        {/* Account section */}
        <div className="pd-section-card" style={{ '--del': '0.28s' } as any}>
          <div className="pd-section-header">
            <div className="pd-section-icon"><Ico.Shield /></div>
            <span className="pd-section-title">Account</span>
          </div>
          <DetailRow icon={Ico.Shield} label="Account role">
            <span className="pd-gender-badge" style={{ textTransform: 'capitalize' }}>{role}</span>
          </DetailRow>
        </div>

        {/* Read-only notice */}
        <div className="pd-readonly-notice">
          <Ico.Info />
          This page shows your current profile information. To make changes, click <strong style={{ color: 'var(--ink)' }}>Edit profile</strong>.
        </div>

      </div>
    </div>
  );
}

export default ProfileDetailsPage;
