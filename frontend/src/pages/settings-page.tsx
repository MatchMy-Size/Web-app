import type { JSX } from 'react';
import { useNavigate } from 'react-router-dom';

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
    --red: #B04040;
    --fd: 'Cormorant Garamond', serif;
    --fs: 'DM Sans', sans-serif;
    --ease: cubic-bezier(0.22, 1, 0.36, 1);
  }

  .sp-root {
    min-height: 100vh;
    background: var(--paper);
    font-family: var(--fs);
  }

  /* ── Topbar ── */
  .sp-topbar {
    position: sticky; top: 0; z-index: 50;
    height: 64px;
    background: rgba(250,250,248,0.92);
    backdrop-filter: blur(14px);
    border-bottom: 1px solid var(--cloud);
    display: flex; align-items: center;
    padding: 0 48px; gap: 14px;
    animation: sp-fadeDown 0.5s var(--ease) both;
  }
  .sp-back-btn {
    display: flex; align-items: center; gap: 7px;
    font-family: var(--fs); font-size: 13px; font-weight: 600;
    color: var(--ash); background: none; border: none;
    cursor: pointer; padding: 8px 14px; border-radius: 8px;
    transition: all 0.18s;
  }
  .sp-back-btn:hover { background: var(--cloud); color: var(--ink); }
  .sp-back-btn svg { width: 14px; height: 14px; }
  .sp-topbar-divider { width: 1px; height: 22px; background: var(--cloud); }
  .sp-topbar-title {
    font-family: var(--fd); font-size: 20px; font-weight: 700;
    color: var(--ink); letter-spacing: -0.4px;
  }

  /* ── Body ── */
  .sp-body {
    max-width: 680px; margin: 0 auto;
    padding: 44px 48px 80px;
    display: flex; flex-direction: column; gap: 24px;
  }

  /* ── Page header ── */
  .sp-header { animation: sp-fadeUp 0.5s 0.05s var(--ease) both; }
  .sp-header-eyebrow {
    display: flex; align-items: center; gap: 8px;
    font-size: 11px; font-weight: 700; color: var(--sage-deep);
    letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 10px;
  }
  .sp-header-eyebrow-line { width: 28px; height: 1.5px; background: var(--sage-deep); }
  .sp-page-title {
    font-family: var(--fd); font-size: clamp(28px, 3.5vw, 40px);
    font-weight: 700; color: var(--ink); letter-spacing: -0.7px;
    line-height: 1.1; margin-bottom: 8px;
  }
  .sp-page-title em { font-style: italic; color: var(--sage-deep); }
  .sp-page-sub { font-size: 13.5px; color: var(--ash); line-height: 1.65; }

  /* ── Hero banner ── */
  .sp-hero {
    background: var(--ink); border-radius: 20px;
    padding: 28px 32px; overflow: hidden; position: relative;
    display: flex; align-items: center; gap: 20px;
    animation: sp-fadeUp 0.5s 0.1s var(--ease) both;
    box-shadow: 0 6px 28px rgba(13,13,13,0.12);
  }
  .sp-hero-glow {
    position: absolute; top: -50px; right: -50px;
    width: 180px; height: 180px; border-radius: 50%;
    background: rgba(195,216,193,0.09); pointer-events: none;
  }
  .sp-hero-icon-wrap {
    width: 52px; height: 52px; border-radius: 13px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; position: relative; z-index: 1;
  }
  .sp-hero-icon-wrap svg { width: 24px; height: 24px; color: var(--sage); }
  .sp-hero-body { flex: 1; position: relative; z-index: 1; }
  .sp-hero-label {
    font-size: 11px; font-weight: 700; color: var(--sage);
    letter-spacing: 0.7px; text-transform: uppercase; margin-bottom: 5px;
  }
  .sp-hero-title {
    font-family: var(--fd); font-size: 22px; font-weight: 700;
    color: var(--white); letter-spacing: -0.4px; margin-bottom: 4px;
  }
  .sp-hero-sub { font-size: 12.5px; color: rgba(255,255,255,0.38); line-height: 1.5; }

  /* ── Section card ── */
  .sp-section-card {
    background: var(--white); border: 1px solid var(--cloud);
    border-radius: 20px; overflow: hidden;
    animation: sp-fadeUp var(--dur, 0.5s) var(--del, 0.16s) var(--ease) both;
  }
  .sp-section-header {
    display: flex; align-items: center; gap: 10px;
    padding: 14px 24px 10px;
    border-bottom: 1px solid var(--cloud);
  }
  .sp-section-icon {
    width: 28px; height: 28px; border-radius: 7px;
    background: var(--paper); border: 1px solid var(--cloud);
    display: flex; align-items: center; justify-content: center;
  }
  .sp-section-icon svg { width: 13px; height: 13px; color: var(--ash); }
  .sp-section-title {
    font-size: 11px; font-weight: 700; color: var(--ash);
    letter-spacing: 0.8px; text-transform: uppercase;
  }

  /* Action row */
  .sp-action-row {
    display: flex; align-items: center; gap: 16px;
    padding: 15px 24px;
    border-bottom: 1px solid var(--cloud);
    cursor: pointer; background: none;
    border-left: none; border-right: none; border-top: none;
    width: 100%; text-align: left; font-family: var(--fs);
    transition: background 0.15s;
  }
  .sp-action-row:last-child { border-bottom: none; }
  .sp-action-row:hover { background: var(--paper); }
  .sp-action-row:hover .sp-action-chevron { transform: translateX(3px); opacity: 0.7; }
  .sp-action-row.muted { cursor: default; }
  .sp-action-row.muted:hover { background: transparent; }

  .sp-action-icon-tile {
    width: 38px; height: 38px; border-radius: 10px;
    background: var(--paper); border: 1px solid var(--cloud);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; transition: all 0.2s;
  }
  .sp-action-row:not(.muted):hover .sp-action-icon-tile { background: var(--cloud); border-color: var(--mist); }
  .sp-action-icon-tile.accent { background: var(--sage-light); border-color: var(--sage-dark); }
  .sp-action-icon-tile.accent svg { color: var(--sage-deep); }
  .sp-action-icon-tile svg { width: 16px; height: 16px; color: var(--ash); }

  .sp-action-text { flex: 1; }
  .sp-action-label { font-size: 14px; font-weight: 700; color: var(--ink); margin-bottom: 2px; }
  .sp-action-sub   { font-size: 12px; color: var(--ash); line-height: 1.4; }
  .sp-action-label.muted { color: var(--ash); font-weight: 600; }

  .sp-action-tag {
    font-size: 10px; font-weight: 800; padding: 3px 9px; border-radius: 999px;
    flex-shrink: 0;
  }
  .sp-action-tag.new { background: var(--sage-light); color: var(--sage-deep); border: 1px solid var(--sage-dark); }
  .sp-action-tag.soon { background: var(--cloud); color: var(--ash); }

  .sp-action-chevron {
    color: var(--mist); flex-shrink: 0;
    transition: transform 0.18s, opacity 0.18s;
  }
  .sp-action-chevron svg { width: 15px; height: 15px; }

  /* ── Tip card ── */
  .sp-tip {
    display: flex; align-items: flex-start; gap: 14px;
    background: var(--sage-light); border: 1px solid var(--sage-dark);
    border-radius: 14px; padding: 16px 20px;
    animation: sp-fadeUp 0.5s 0.28s var(--ease) both;
  }
  .sp-tip-icon {
    width: 34px; height: 34px; border-radius: 9px;
    background: rgba(163,191,161,0.35);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .sp-tip-icon svg { width: 16px; height: 16px; color: var(--sage-deep); }
  .sp-tip-title { font-size: 13px; font-weight: 700; color: var(--ink); margin-bottom: 3px; }
  .sp-tip-sub { font-size: 12px; color: var(--sage-deep); line-height: 1.55; font-weight: 500; }

  /* ── Version ── */
  .sp-version {
    text-align: center; font-size: 12px; color: var(--mist);
    animation: sp-fadeUp 0.5s 0.32s var(--ease) both;
  }

  /* ── Keyframes ── */
  @keyframes sp-fadeDown {
    from { opacity: 0; transform: translateY(-14px); }
    to   { opacity: 1; transform: none; }
  }
  @keyframes sp-fadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: none; }
  }
`;

if (!document.getElementById('sp-styles')) {
  const s = document.createElement('style');
  s.id = 'sp-styles';
  s.textContent = CSS;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────────
   SVG icons
───────────────────────────────────────────── */
const Ico = {
  Back:     () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M13 8H3M7 4l-4 4 4 4"/></svg>,
  Lock:     () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="7" width="10" height="8" rx="2"/><path d="M5 7V5a3 3 0 016 0v2"/><circle cx="8" cy="11" r="1" fill="currentColor" stroke="none"/></svg>,
  Shield:   () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 2l5 2v4c0 3-2.5 5.5-5 6-2.5-.5-5-3-5-6V4l5-2z"/></svg>,
  Bell:     () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 2a4 4 0 014 4c0 2.5.5 4 1.5 5H2.5C3.5 10 4 8.5 4 6a4 4 0 014-4z"/><path d="M6.5 13a1.5 1.5 0 003 0"/></svg>,
  Ruler:    () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1" y="6" width="14" height="4" rx="1"/><path d="M4 6v2M7 6v3M10 6v2M13 6v3"/></svg>,
  Doc:      () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="1" width="10" height="14" rx="2"/><path d="M6 5h4M6 8h4M6 11h2"/></svg>,
  Help:     () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="6"/><path d="M6 6a2 2 0 114 0c0 1.5-2 1.5-2 3M8 13v.5"/></svg>,
  Chevron:  () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 4l4 4-4 4"/></svg>,
  Bulb:     () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 2a4 4 0 014 4c0 1.7-.9 3.1-2 4v1H6v-1c-1.1-.9-2-2.3-2-4a4 4 0 014-4z"/><path d="M6 13h4"/></svg>,
  Globe:    () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="6"/><path d="M2 8h12M8 2a9 9 0 010 12M8 2a9 9 0 000 12"/></svg>,
};

/* ─────────────────────────────────────────────
   Action row component
───────────────────────────────────────────── */
function ActionRow({ icon, accent = false, label, sub, tag, tagType, onClick, muted }: {
  icon: () => JSX.Element;
  accent?: boolean;
  label: string;
  sub?: string;
  tag?: string;
  tagType?: 'new' | 'soon';
  onClick?: () => void;
  muted?: boolean;
}) {
  const Icon = icon;
  return (
    <button
      type="button"
      className={`sp-action-row${muted ? ' muted' : ''}`}
      onClick={muted ? undefined : onClick}>
      <div className={`sp-action-icon-tile${accent ? ' accent' : ''}`}><Icon /></div>
      <div className="sp-action-text">
        <div className={`sp-action-label${muted ? ' muted' : ''}`}>{label}</div>
        {sub && <div className="sp-action-sub">{sub}</div>}
      </div>
      {tag && <span className={`sp-action-tag ${tagType ?? 'soon'}`}>{tag}</span>}
      {!muted && (
        <div className="sp-action-chevron"><Ico.Chevron /></div>
      )}
    </button>
  );
}

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */
export function SettingsPage() {
  const navigate = useNavigate();

  return (
    <div className="sp-root">

      {/* ── Topbar ── */}
      <div className="sp-topbar">
        <button className="sp-back-btn" onClick={() => navigate('/app/profile')}>
          <Ico.Back /> Profile
        </button>
        <div className="sp-topbar-divider" />
        <span className="sp-topbar-title">Settings</span>
      </div>

      {/* ── Body ── */}
      <div className="sp-body">

        {/* Page header */}
        <div className="sp-header">
          <div className="sp-header-eyebrow">
            <div className="sp-header-eyebrow-line" />
            Configuration
          </div>
          <h1 className="sp-page-title">
            Account &amp; <em>settings</em>
          </h1>
          <p className="sp-page-sub">
            Manage your password, notification preferences, and privacy options.
          </p>
        </div>

        {/* Dark hero banner */}
        <div className="sp-hero">
          <div className="sp-hero-glow" />
          <div className="sp-hero-icon-wrap"><Ico.Shield /></div>
          <div className="sp-hero-body">
            <div className="sp-hero-label">Account security</div>
            <div className="sp-hero-title">Your account is protected</div>
            <div className="sp-hero-sub">
              OTP verification is required for all sensitive changes.
            </div>
          </div>
        </div>

        {/* Security section */}
        <div className="sp-section-card" style={{ '--del': '0.14s' } as any}>
          <div className="sp-section-header">
            <div className="sp-section-icon"><Ico.Shield /></div>
            <span className="sp-section-title">Security</span>
          </div>
          <ActionRow
            icon={Ico.Lock}
            accent
            label="Change password"
            sub="Verify via OTP, then set a new password"
            onClick={() => navigate('/app/change-password')}
          />
        </div>

        {/* Preferences section */}
        <div className="sp-section-card" style={{ '--del': '0.20s' } as any}>
          <div className="sp-section-header">
            <div className="sp-section-icon"><Ico.Bell /></div>
            <span className="sp-section-title">Preferences</span>
          </div>
          <ActionRow
            icon={Ico.Bell}
            label="Notifications"
            sub="Manage alerts and reminders"
            tag="Soon"
            tagType="soon"
            muted
          />
          <ActionRow
            icon={Ico.Ruler}
            label="Default measurement unit"
            sub="Centimetres or inches"
            tag="Soon"
            tagType="soon"
            muted
          />
        </div>

        {/* Legal section */}
        <div className="sp-section-card" style={{ '--del': '0.26s' } as any}>
          <div className="sp-section-header">
            <div className="sp-section-icon"><Ico.Doc /></div>
            <span className="sp-section-title">Legal</span>
          </div>
          <ActionRow
            icon={Ico.Shield}
            label="Privacy policy"
            sub="How we collect and use your data"
            onClick={() => {}}
          />
          <ActionRow
            icon={Ico.Doc}
            label="Terms of service"
            sub="Usage rules and conditions"
            onClick={() => {}}
          />
          <ActionRow
            icon={Ico.Globe}
            label="Open source licences"
            sub="Third-party libraries used"
            onClick={() => {}}
          />
        </div>

        {/* About section */}
        <div className="sp-section-card" style={{ '--del': '0.30s' } as any}>
          <div className="sp-section-header">
            <div className="sp-section-icon"><Ico.Help /></div>
            <span className="sp-section-title">About</span>
          </div>
          <ActionRow
            icon={Ico.Help}
            label="Help &amp; FAQ"
            sub="How to measure, tips, troubleshooting"
            onClick={() => {}}
          />
          <ActionRow
            icon={Ico.Globe}
            label="App version"
            sub="v1.0.0 · MatchMySize"
            muted
          />
        </div>

        {/* Security tip */}
        <div className="sp-tip">
          <div className="sp-tip-icon"><Ico.Bulb /></div>
          <div>
            <div className="sp-tip-title">OTP-protected changes</div>
            <div className="sp-tip-sub">
              All security-sensitive actions like changing your password require verification
              to your registered phone number — keeping your account safe.
            </div>
          </div>
        </div>

        {/* Version */}
        <div className="sp-version">MatchMySize · v1.0.0</div>

      </div>
    </div>
  );
}

export default SettingsPage;
