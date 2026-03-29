import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/context/auth-context';
import { useProfileSubject } from '@/context/profile-subject-context';
import { doc, serverTimestamp, setDoc, db } from '@/lib/firebase-db';
import { setFamilyMemberActiveMeasurementProfile } from '@/lib/family-members';
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
    --slate: #4A4A4A;
    --white: #FFFFFF;
    --fd: 'Cormorant Garamond', serif;
    --fs: 'DM Sans', sans-serif;
    --ease: cubic-bezier(0.22, 1, 0.36, 1);
  }

  .mw-root {
    min-height: 100vh;
    background: var(--paper);
    font-family: var(--fs);
  }

  /* ════════════════════════════════════
     TOPBAR
  ════════════════════════════════════ */
  .mw-topbar {
    position: sticky; top: 0; z-index: 50;
    height: 64px;
    background: rgba(250,250,248,0.92);
    backdrop-filter: blur(14px);
    border-bottom: 1px solid var(--cloud);
    display: flex; align-items: center;
    padding: 0 48px; gap: 14px;
    animation: mw-fadeDown 0.5s var(--ease) both;
  }
  .mw-back-btn {
    display: flex; align-items: center; gap: 7px;
    font-family: var(--fs); font-size: 13px; font-weight: 600;
    color: var(--ash); background: none; border: none;
    cursor: pointer; padding: 8px 14px; border-radius: 8px;
    transition: all 0.18s;
  }
  .mw-back-btn:hover { background: var(--cloud); color: var(--ink); }
  .mw-back-btn svg { width: 14px; height: 14px; }
  .mw-topbar-divider { width: 1px; height: 22px; background: var(--cloud); }
  .mw-topbar-title {
    font-family: var(--fd); font-size: 20px; font-weight: 700;
    color: var(--ink); letter-spacing: -0.4px;
  }
  .mw-topbar-right {
    margin-left: auto; display: flex; align-items: center; gap: 10px;
  }
  .mw-unit-toggle {
    display: flex; background: var(--cloud);
    border-radius: 8px; padding: 3px; gap: 2px;
  }
  .mw-unit-btn {
    font-family: var(--fs); font-size: 12px; font-weight: 700;
    padding: 5px 12px; border: none; border-radius: 6px;
    cursor: default; color: var(--ash); background: transparent;
    transition: all 0.2s;
  }
  .mw-unit-btn.active { background: var(--ink); color: var(--white); }
  .mw-add-btn {
    display: flex; align-items: center; gap: 7px;
    font-family: var(--fs); font-size: 13px; font-weight: 600;
    color: var(--white); background: var(--ink);
    border: none; border-radius: 9px;
    padding: 0 18px; height: 36px; cursor: pointer;
    transition: opacity 0.2s, transform 0.15s;
    box-shadow: 0 3px 10px rgba(13,13,13,0.18);
  }
  .mw-add-btn:hover { opacity: 0.85; transform: translateY(-1px); }
  .mw-add-btn:active { transform: scale(0.97); }
  .mw-add-btn svg { width: 14px; height: 14px; }

  /* ════════════════════════════════════
     PAGE LAYOUT  (hero + two-col grid)
  ════════════════════════════════════ */
  .mw-page {
    max-width: 1200px; margin: 0 auto;
    padding: 40px 48px 80px;
    display: flex; flex-direction: column; gap: 32px;
  }

  /* ── Hero row ── */
  .mw-hero-row {
    display: grid; grid-template-columns: 1fr auto;
    gap: 32px; align-items: end;
    animation: mw-fadeUp 0.5s 0.05s var(--ease) both;
  }
  .mw-eyebrow {
    display: flex; align-items: center; gap: 8px;
    font-size: 11px; font-weight: 700; color: var(--sage-deep);
    letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 12px;
  }
  .mw-eyebrow-line { width: 28px; height: 1.5px; background: var(--sage-deep); }
  .mw-hero-title {
    font-family: var(--fd); font-size: clamp(34px, 3.5vw, 52px);
    font-weight: 700; color: var(--ink); letter-spacing: -0.8px;
    line-height: 1.06; margin-bottom: 10px;
  }
  .mw-hero-title em { font-style: italic; color: var(--sage-deep); }
  .mw-hero-sub { font-size: 14px; color: var(--ash); line-height: 1.7; max-width: 480px; }

  /* Stats cluster (right of hero) */
  .mw-hero-stats {
    display: flex; gap: 0;
    background: var(--ink); border-radius: 16px;
    overflow: hidden; flex-shrink: 0;
    box-shadow: 0 6px 24px rgba(13,13,13,0.14);
    align-self: end;
  }
  .mw-hero-stat {
    text-align: center; padding: 18px 28px;
    border-right: 1px solid rgba(255,255,255,0.07);
  }
  .mw-hero-stat:last-child { border-right: none; }
  .mw-hero-stat-num {
    font-family: var(--fd); font-size: 32px; font-weight: 700;
    color: var(--white); letter-spacing: -0.8px; line-height: 1; margin-bottom: 3px;
  }
  .mw-hero-stat-num span { color: var(--sage); }
  .mw-hero-stat-label { font-size: 11px; color: rgba(255,255,255,0.35); white-space: nowrap; }

  /* ── Main two-column grid ── */
  .mw-grid {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 24px;
    align-items: start;
  }

  /* ════════════════════════════════════
     LEFT SIDEBAR
  ════════════════════════════════════ */
  .mw-sidebar { display: flex; flex-direction: column; gap: 18px; }

  /* Summary card */
  .mw-summary-card {
    background: var(--white); border: 1px solid var(--cloud);
    border-radius: 18px; overflow: hidden;
    animation: mw-fadeUp 0.5s 0.1s var(--ease) both;
  }
  .mw-summary-header {
    padding: 14px 20px 10px;
    border-bottom: 1px solid var(--cloud);
    display: flex; align-items: center; gap: 8px;
  }
  .mw-summary-header-icon {
    width: 26px; height: 26px; border-radius: 7px;
    background: var(--paper); border: 1px solid var(--cloud);
    display: flex; align-items: center; justify-content: center;
  }
  .mw-summary-header-icon svg { width: 12px; height: 12px; color: var(--ash); }
  .mw-summary-header-title {
    font-size: 11px; font-weight: 700; color: var(--ash);
    letter-spacing: 0.8px; text-transform: uppercase;
  }

  /* Profile list in sidebar */
  .mw-profile-list-item {
    display: flex; align-items: center; gap: 10px;
    padding: 11px 18px; border-bottom: 1px solid var(--cloud);
    cursor: pointer; background: none; width: 100%;
    text-align: left; font-family: var(--fs);
    transition: background 0.15s;
  }
  .mw-profile-list-item:last-child { border-bottom: none; }
  .mw-profile-list-item:hover { background: var(--paper); }
  .mw-profile-list-item.selected { background: rgba(13,13,13,0.03); }
  .mw-profile-list-emoji {
    width: 34px; height: 34px; border-radius: 9px;
    background: var(--paper); border: 1px solid var(--cloud);
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; flex-shrink: 0; transition: all 0.2s;
  }
  .mw-profile-list-item.selected .mw-profile-list-emoji {
    background: var(--ink); border-color: var(--ink);
  }
  .mw-profile-list-body { flex: 1; min-width: 0; }
  .mw-profile-list-name { font-size: 13px; font-weight: 700; color: var(--ink); }
  .mw-profile-list-count { font-size: 11px; color: var(--ash); margin-top: 1px; }
  .mw-profile-default-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--sage-deep); flex-shrink: 0;
    box-shadow: 0 0 4px var(--sage-deep);
  }
  .mw-profile-list-item.selected .mw-profile-list-name { color: var(--ink); }

  /* Tip card */
  .mw-tip-card {
    background: var(--sage-light); border: 1px solid var(--sage-dark);
    border-radius: 16px; padding: 16px 18px;
    display: flex; gap: 12px; align-items: flex-start;
    animation: mw-fadeUp 0.5s 0.16s var(--ease) both;
  }
  .mw-tip-icon {
    width: 30px; height: 30px; border-radius: 8px;
    background: rgba(163,191,161,0.35);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .mw-tip-icon svg { width: 14px; height: 14px; color: var(--sage-deep); }
  .mw-tip-title { font-size: 12.5px; font-weight: 700; color: var(--ink); margin-bottom: 3px; }
  .mw-tip-sub { font-size: 11.5px; color: var(--sage-deep); line-height: 1.55; font-weight: 500; }

  /* ════════════════════════════════════
     RIGHT  — PROFILE DETAIL PANEL
  ════════════════════════════════════ */
  .mw-detail-panel {
    display: flex; flex-direction: column; gap: 20px;
    animation: mw-slideIn 0.3s var(--ease) both;
  }

  /* Profile header card */
  .mw-detail-header-card {
    background: var(--white); border: 1px solid var(--cloud);
    border-radius: 20px; overflow: hidden;
  }
  .mw-detail-cover {
    height: 80px; background: var(--ink); position: relative; overflow: hidden;
  }
  .mw-detail-cover-glow {
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 80% 50%, rgba(195,216,193,0.14) 0%, transparent 60%);
  }
  .mw-detail-cover-grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 32px 32px;
  }
  .mw-detail-identity {
    display: flex; align-items: flex-end; gap: 18px;
    padding: 0 28px 22px;
    position: relative;
  }
  /* Big emoji overlapping cover */
  .mw-detail-emoji-wrap {
    position: relative; top: -24px; flex-shrink: 0;
    width: 64px; height: 64px; border-radius: 16px;
    background: var(--white); border: 3px solid var(--white);
    box-shadow: 0 4px 16px rgba(0,0,0,0.12);
    display: flex; align-items: center; justify-content: center; font-size: 32px;
  }
  .mw-detail-identity-body { flex: 1; padding-top: 10px; }
  .mw-detail-name {
    font-family: var(--fd); font-size: 22px; font-weight: 700;
    color: var(--ink); letter-spacing: -0.4px; margin-bottom: 4px;
    display: flex; align-items: center; gap: 10px;
  }
  .mw-default-badge {
    display: inline-flex; align-items: center; gap: 4px;
    background: var(--ink); color: var(--white);
    border-radius: 999px; padding: 3px 9px;
    font-family: var(--fs); font-size: 9px; font-weight: 800;
    letter-spacing: 0.4px; text-transform: uppercase;
  }
  .mw-default-badge svg { width: 9px; height: 9px; }
  .mw-detail-counts { font-size: 12.5px; color: var(--ash); }
  .mw-detail-actions { display: flex; gap: 9px; padding-top: 10px; flex-shrink: 0; }
  .mw-action-btn-outline {
    font-family: var(--fs); font-size: 12px; font-weight: 700;
    color: var(--slate); background: var(--white);
    border: 1.5px solid var(--cloud); border-radius: 9px;
    padding: 7px 14px; cursor: pointer; transition: all 0.18s;
    display: flex; align-items: center; gap: 6px;
  }
  .mw-action-btn-outline:hover { border-color: var(--ink); color: var(--ink); transform: translateY(-1px); }
  .mw-action-btn-outline svg { width: 12px; height: 12px; }
  .mw-action-btn-ink {
    font-family: var(--fs); font-size: 12px; font-weight: 700;
    color: var(--white); background: var(--ink);
    border: none; border-radius: 9px; padding: 7px 16px;
    cursor: pointer; transition: opacity 0.18s, transform 0.15s;
    display: flex; align-items: center; gap: 6px;
    box-shadow: 0 3px 10px rgba(13,13,13,0.18);
  }
  .mw-action-btn-ink:hover { opacity: 0.85; transform: translateY(-1px); }
  .mw-action-btn-ink svg { width: 12px; height: 12px; }

  /* ── Measurement sections ── */
  .mw-meas-section {
    background: var(--white); border: 1px solid var(--cloud);
    border-radius: 18px; overflow: hidden;
  }
  .mw-meas-section-header {
    display: flex; align-items: center; gap: 10px;
    padding: 14px 22px 12px;
    border-bottom: 1px solid var(--cloud);
  }
  .mw-meas-section-icon {
    width: 26px; height: 26px; border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
    background: var(--paper); border: 1px solid var(--cloud);
  }
  .mw-meas-section-icon svg { width: 12px; height: 12px; color: var(--ash); }
  .mw-meas-section-icon.accent { background: var(--sage-light); border-color: var(--sage-dark); }
  .mw-meas-section-icon.accent svg { color: var(--sage-deep); }
  .mw-meas-section-title {
    font-size: 11px; font-weight: 700; color: var(--ash);
    letter-spacing: 0.8px; text-transform: uppercase; flex: 1;
  }
  .mw-meas-count-badge {
    background: var(--cloud); border-radius: 999px;
    padding: 2px 8px; font-size: 10px; font-weight: 700; color: var(--ash);
  }

  /* Bar rows (primary) */
  .mw-bar-rows { padding: 16px 22px; display: flex; flex-direction: column; gap: 10px; }
  .mw-bar-row { display: flex; align-items: center; gap: 12px; }
  .mw-bar-label { font-size: 11px; font-weight: 600; color: var(--ash); width: 88px; text-align: right; flex-shrink: 0; }
  .mw-bar-track { flex: 1; height: 7px; background: var(--cloud); border-radius: 999px; overflow: hidden; }
  .mw-bar-fill  { height: 100%; border-radius: 999px; background: var(--sage-deep); }
  .mw-bar-val   { font-size: 12px; font-weight: 700; color: var(--ink); width: 58px; flex-shrink: 0; }

  /* Tile grid (secondary) */
  .mw-tile-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 10px; padding: 16px 22px;
  }
  .mw-tile {
    background: var(--paper); border: 1px solid var(--cloud);
    border-radius: 12px; padding: 11px 13px;
    transition: border-color 0.18s, transform 0.18s;
  }
  .mw-tile:hover { border-color: var(--mist); transform: translateY(-1px); }
  .mw-tile-key {
    font-size: 9.5px; font-weight: 700; color: var(--ash);
    letter-spacing: 0.4px; text-transform: uppercase; margin-bottom: 5px;
  }
  .mw-tile-val {
    font-family: var(--fd); font-size: 20px; font-weight: 700;
    color: var(--ink); letter-spacing: -0.3px; line-height: 1;
  }
  .mw-tile-unit { font-size: 10px; color: var(--ash); margin-top: 2px; font-weight: 600; }

  /* ── Empty ── */
  .mw-empty {
    background: var(--white); border: 1px solid var(--cloud);
    border-radius: 20px; padding: 80px 40px;
    display: flex; flex-direction: column; align-items: center;
    gap: 14px; text-align: center;
    animation: mw-fadeUp 0.5s var(--ease) both;
  }
  .mw-empty-icon {
    width: 72px; height: 72px; border-radius: 50%;
    background: var(--sage-light); border: 1px solid var(--sage-dark);
    display: flex; align-items: center; justify-content: center; font-size: 30px;
  }
  .mw-empty-title { font-family: var(--fd); font-size: 26px; font-weight: 700; color: var(--ink); }
  .mw-empty-sub { font-size: 14px; color: var(--ash); max-width: 320px; line-height: 1.65; }
  .mw-empty-btn {
    font-family: var(--fs); font-size: 13.5px; font-weight: 700;
    color: var(--white); background: var(--ink);
    border: none; border-radius: 10px; padding: 11px 28px;
    cursor: pointer; transition: opacity 0.2s; margin-top: 4px;
    display: flex; align-items: center; gap: 8px;
  }
  .mw-empty-btn:hover { opacity: 0.85; }
  .mw-empty-btn svg { width: 14px; height: 14px; }

  /* no selection state */
  .mw-no-selection {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 12px;
    background: var(--white); border: 1px dashed var(--cloud);
    border-radius: 20px; padding: 72px 40px; text-align: center;
  }
  .mw-no-selection-icon { font-size: 36px; opacity: 0.4; }
  .mw-no-selection-text { font-size: 14px; color: var(--ash); }

  /* ════════════════════════════════════
     KEYFRAMES
  ════════════════════════════════════ */
  @keyframes mw-fadeDown { from { opacity: 0; transform: translateY(-14px); } to { opacity: 1; transform: none; } }
  @keyframes mw-fadeUp   { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
  @keyframes mw-slideIn  { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: none; } }
  @keyframes mw-growBar  { from { width: 0; } to { width: var(--w); } }
  @keyframes mw-spin     { to { transform: rotate(360deg); } }
`;

if (!document.getElementById('mw-styles')) {
  const s = document.createElement('style');
  s.id = 'mw-styles';
  s.textContent = CSS;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────────
   SVG icons
───────────────────────────────────────────── */
const Ico = {
  Back:    () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M13 8H3M7 4l-4 4 4 4"/></svg>,
  Plus:    () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 3v10M3 8h10"/></svg>,
  Edit:    () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M11 2l3 3-8 8H3v-3L11 2z"/></svg>,
  Star:    () => <svg viewBox="0 0 16 16" fill="currentColor" stroke="none"><path d="M8 2l1.5 3.5L13 6l-2.5 2.5.6 3.5L8 10.5 4.9 12l.6-3.5L3 6l3.5-.5L8 2z"/></svg>,
  Check:   () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 8l3.5 3.5L13 5"/></svg>,
  Ruler:   () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1" y="6" width="14" height="4" rx="1"/><path d="M4 6v2M7 6v3M10 6v2M13 6v3"/></svg>,
  Bulb:    () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 2a4 4 0 014 4c0 1.7-.9 3.1-2 4v1H6v-1c-1.1-.9-2-2.3-2-4a4 4 0 014-4z"/><path d="M6 13h4"/></svg>,
  Chevron: () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 4l4 4-4 4"/></svg>,
};

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const CLOTHING_EMOJI: Record<string, string> = {
  tops:'👕', shirts:'👔', tshirts:'👕', blouses:'👚',
  bottoms:'👖', trousers:'👖', jeans:'👖', shorts:'🩳',
  dresses:'👗', skirts:'🩱', suits:'🤵', jackets:'🧥',
  coats:'🧥', shoes:'👟', sneakers:'👟', boots:'🥾', default:'📏',
};
function clothingEmoji(key: string | null) {
  if (!key) return '📏';
  const k = key.toLowerCase();
  for (const [token, emoji] of Object.entries(CLOTHING_EMOJI)) {
    if (k.includes(token)) return emoji;
  }
  return '📏';
}

/* ─────────────────────────────────────────────
   Animated bar row
───────────────────────────────────────────── */
function BarRow({ label, value, unit, delay = 0 }: { label: string; value: string; unit: string; delay?: number }) {
  const num = parseFloat(value) || 0;
  const pct = Math.min((num / 200) * 100, 100);
  return (
    <div className="mw-bar-row">
      <span className="mw-bar-label">{label}</span>
      <div className="mw-bar-track">
        <div className="mw-bar-fill" style={{
          '--w': `${pct}%`, width: `${pct}%`,
          animation: `mw-growBar 1.1s ${delay}s var(--ease) both`,
        } as any} />
      </div>
      <span className="mw-bar-val">{value} {unit}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Detail panel for selected profile
───────────────────────────────────────────── */
function ProfileDetail({
  entry, isDefault, unit, onSetDefault, onEdit,
}: {
  entry: any; isDefault: boolean; unit: string;
  onSetDefault: () => Promise<void>;
  onEdit: () => void;
}) {
  const [settingDefault, setSettingDefault] = useState(false);
  const emoji = clothingEmoji(entry.preferredClothing);
  const primaryKeys: string[] = entry.primaryMeasurementKeys ?? [];
  const allEntries = Object.entries(entry.measurements ?? {}) as [string, string][];
  const primaryEntries = allEntries.filter(([k]) => primaryKeys.includes(k));
  const secondaryEntries = allEntries.filter(([k]) => !primaryKeys.includes(k));

  const handleSetDefault = async () => {
    setSettingDefault(true);
    try { await onSetDefault(); } finally { setSettingDefault(false); }
  };

  return (
    <div className="mw-detail-panel">

      {/* Header card with mini cover */}
      <div className="mw-detail-header-card">
        <div className="mw-detail-cover">
          <div className="mw-detail-cover-glow" />
          <div className="mw-detail-cover-grid" />
        </div>
        <div className="mw-detail-identity">
          <div className="mw-detail-emoji-wrap">{emoji}</div>
          <div className="mw-detail-identity-body">
            <div className="mw-detail-name">
              {entry.preferredClothingLabel}
              {isDefault && (
                <span className="mw-default-badge"><Ico.Star /> Default</span>
              )}
            </div>
            <div className="mw-detail-counts">
              {primaryKeys.length} primary · {allEntries.length} total measurements
            </div>
          </div>
          <div className="mw-detail-actions">
            {!isDefault && (
              <button
                className="mw-action-btn-outline"
                disabled={settingDefault}
                onClick={handleSetDefault}>
                {settingDefault
                  ? <><div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid var(--mist)', borderTopColor: 'var(--ink)', animation: 'mw-spin .7s linear infinite' }} /> Setting…</>
                  : <><Ico.Check /> Set default</>
                }
              </button>
            )}
            <button className="mw-action-btn-ink" onClick={onEdit}>
              <Ico.Edit /> Edit
            </button>
          </div>
        </div>
      </div>

      {/* Primary measurements bar chart */}
      {primaryEntries.length > 0 && (
        <div className="mw-meas-section">
          <div className="mw-meas-section-header">
            <div className="mw-meas-section-icon accent"><Ico.Ruler /></div>
            <span className="mw-meas-section-title">Primary measurements</span>
            <span className="mw-meas-count-badge">{primaryEntries.length}</span>
          </div>
          <div className="mw-bar-rows">
            {primaryEntries.map(([k, v], i) => (
              <BarRow key={k} label={k} value={String(v)} unit={unit} delay={i * 0.06} />
            ))}
          </div>
        </div>
      )}

      {/* All measurements tile grid */}
      {allEntries.length > 0 && (
        <div className="mw-meas-section">
          <div className="mw-meas-section-header">
            <div className="mw-meas-section-icon"><Ico.Ruler /></div>
            <span className="mw-meas-section-title">All measurements</span>
            <span className="mw-meas-count-badge">{allEntries.length}</span>
          </div>
          <div className="mw-tile-grid">
            {allEntries.map(([k, v]) => (
              <div key={k} className="mw-tile">
                <div className="mw-tile-key">{k}</div>
                <div className="mw-tile-val">{String(v)}</div>
                <div className="mw-tile-unit">{unit}</div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */
export function MeasurementsPage() {
  const navigate = useNavigate();
  const { user }  = useAuth();
  const { selectedSubject } = useProfileSubject();
  const { measurementProfiles, profile } = useRecommendationData(user?.uid);
  const activeKey = typeof profile?.activeMeasurementProfileKey === 'string'
    ? profile.activeMeasurementProfileKey : null;
  const unit = (profile?.unit as 'cm' | 'in') ?? 'cm';
  const subjectDescription =
    selectedSubject?.type === 'family'
      ? `Each profile unlocks size recommendations for ${selectedSubject.label}. Setting one as default updates that family profile automatically.`
      : 'Each profile unlocks size recommendations across all supported brands. Setting one as default updates your home feed automatically.';

  const [selectedKey, setSelectedKey] = useState<string | null>(
    () => activeKey ?? measurementProfiles[0]?.profileKey ?? null
  );

  useEffect(() => {
    setSelectedKey(activeKey ?? measurementProfiles[0]?.profileKey ?? null);
  }, [activeKey, measurementProfiles, selectedSubject?.key]);

  const selectedProfile = measurementProfiles.find(p => p.profileKey === selectedKey)
    ?? measurementProfiles[0]
    ?? null;

  const totalMeasurements = measurementProfiles.reduce(
    (a, p) => a + Object.keys(p.measurements ?? {}).length, 0
  );

  const setDefault = async (profileKey: string, preferredClothing: string | null, preferredClothingLabel: string) => {
    if (!user) return;
    if (selectedSubject?.type === 'family') {
      await setFamilyMemberActiveMeasurementProfile({
        ownerUid: user.uid,
        familyMemberId: selectedSubject.id,
        profileKey,
        preferredClothing,
        preferredClothingLabel,
      });
      return;
    }

    await Promise.all([
      setDoc(doc(db, 'users', user.uid), { activeMeasurementProfileKey: profileKey, preferredClothing, preferredClothingLabel, updatedAt: serverTimestamp() }, { merge: true }),
      setDoc(doc(db, 'customerMeasurements', user.uid), { activeProfileKey: profileKey, preferredClothing, preferredClothingLabel, updatedAt: serverTimestamp() }, { merge: true }),
    ]);
  };

  return (
    <div className="mw-root">

      {/* ── Topbar ── */}
      <div className="mw-topbar">
        <button className="mw-back-btn" onClick={() => navigate('/app/profile')}>
          <Ico.Back /> Profile
        </button>
        <div className="mw-topbar-divider" />
        <span className="mw-topbar-title">Measurements</span>

        <div className="mw-topbar-right">
          {/* Unit indicator */}
          <div className="mw-unit-toggle">
            <div className={`mw-unit-btn${unit === 'cm' ? ' active' : ''}`}>cm</div>
            <div className={`mw-unit-btn${unit === 'in' ? ' active' : ''}`}>in</div>
          </div>
          <button className="mw-add-btn" onClick={() => navigate('/app/add-preference')}>
            <Ico.Plus /> {selectedSubject?.type === 'family' ? 'Add measurements' : 'Add category'}
          </button>
        </div>
      </div>

      {/* ── Page ── */}
      <div className="mw-page">

        {/* Hero row */}
        <div className="mw-hero-row">
          <div>
            <div className="mw-eyebrow">
              <div className="mw-eyebrow-line" />
              {selectedSubject?.type === 'family' ? `${selectedSubject.label} · ${selectedSubject.subtitle}` : 'Size profiles'}
            </div>
            <h1 className="mw-hero-title">
              {selectedSubject?.type === 'family' ? (
                <>
                  {selectedSubject.label}'s <em>measurements</em>
                </>
              ) : (
                <>
                  Your <em>measurements</em>
                </>
              )}
            </h1>
            <p className="mw-hero-sub">
              {subjectDescription}
            </p>
          </div>

          {/* Stats */}
          {measurementProfiles.length > 0 && (
            <div className="mw-hero-stats">
              <div className="mw-hero-stat">
                <div className="mw-hero-stat-num">{measurementProfiles.length}</div>
                <div className="mw-hero-stat-label">Profiles</div>
              </div>
              <div className="mw-hero-stat">
                <div className="mw-hero-stat-num">{totalMeasurements}</div>
                <div className="mw-hero-stat-label">Measurements</div>
              </div>
              <div className="mw-hero-stat">
                <div className="mw-hero-stat-num">500<span>+</span></div>
                <div className="mw-hero-stat-label">Brands</div>
              </div>
            </div>
          )}
        </div>

        {/* Empty state */}
        {!measurementProfiles.length && (
          <div className="mw-empty">
            <div className="mw-empty-icon">📏</div>
            <div className="mw-empty-title">
              {selectedSubject?.type === 'family'
                ? `No measurements for ${selectedSubject.label} yet`
                : 'No measurement profiles yet'}
            </div>
            <div className="mw-empty-sub">
              {selectedSubject?.type === 'family'
                ? `Add ${selectedSubject.label}'s first clothing category to start getting personalised size recommendations.`
                : 'Add your first clothing category to start getting personalised size recommendations across 500+ brands.'}
            </div>
            <button className="mw-empty-btn" onClick={() => navigate('/app/add-preference')}>
              <Ico.Plus /> {selectedSubject?.type === 'family' ? 'Add measurements' : 'Add a preference'}
            </button>
          </div>
        )}

        {/* Two-column grid */}
        {measurementProfiles.length > 0 && (
          <div className="mw-grid">

            {/* ── Sidebar ── */}
            <aside className="mw-sidebar">

              {/* Profile list */}
              <div className="mw-summary-card">
                <div className="mw-summary-header">
                  <div className="mw-summary-header-icon"><Ico.Ruler /></div>
                  <span className="mw-summary-header-title">
                    {measurementProfiles.length} profile{measurementProfiles.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {measurementProfiles.map(p => {
                  const isSelected = p.profileKey === (selectedProfile?.profileKey);
                  const isDefault  = p.profileKey === activeKey;
                  return (
                    <button
                      key={p.profileKey}
                      className={`mw-profile-list-item${isSelected ? ' selected' : ''}`}
                      onClick={() => setSelectedKey(p.profileKey)}>
                      <div className="mw-profile-list-emoji">
                        {clothingEmoji(p.preferredClothing)}
                      </div>
                      <div className="mw-profile-list-body">
                        <div className="mw-profile-list-name">{p.preferredClothingLabel}</div>
                        <div className="mw-profile-list-count">
                          {Object.keys(p.measurements ?? {}).length} measurements
                        </div>
                      </div>
                      {isDefault && <div className="mw-profile-default-dot" title="Default" />}
                      <Ico.Chevron />
                    </button>
                  );
                })}
              </div>

              {/* Tip card */}
              <div className="mw-tip-card">
                <div className="mw-tip-icon"><Ico.Bulb /></div>
                <div>
                  <div className="mw-tip-title">Set a default profile</div>
                  <div className="mw-tip-sub">
                    The default profile drives your home feed recommendations. Click "Set default" on any profile to switch.
                  </div>
                </div>
              </div>

            </aside>

            {/* ── Detail panel ── */}
            <div>
              {selectedProfile ? (
                <ProfileDetail
                  key={selectedProfile.profileKey}
                  entry={selectedProfile}
                  isDefault={selectedProfile.profileKey === activeKey}
                  unit={unit}
                  onSetDefault={() => setDefault(
                    selectedProfile.profileKey,
                    selectedProfile.preferredClothing,
                    selectedProfile.preferredClothingLabel,
                  )}
                  onEdit={() => navigate(`/app/add-preference?profileKey=${selectedProfile.profileKey}`)}
                />
              ) : (
                <div className="mw-no-selection">
                  <div className="mw-no-selection-icon">📐</div>
                  <div className="mw-no-selection-text">Select a profile from the left to view details</div>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default MeasurementsPage;
