import { useNavigate } from 'react-router-dom';
import type { IconType } from 'react-icons';
import { GiShorts } from 'react-icons/gi';
import { PiCoatHanger, PiDress, PiPants, PiShirtFolded, PiTShirt } from 'react-icons/pi';

import { useAuth } from '@/context/auth-context';
import { useProfileSubject } from '@/context/profile-subject-context';
import {
  DEFAULT_MEASUREMENT_LABELS,
  getClothingTemplate,
  normalizeGender,
  type ClothingChoice,
  type CustomerGender,
} from '@/lib/measurement';
import type { CustomerMeasurementProfile } from '@/lib/recommendation-view';
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
  .mw-detail-wrap { min-width: 0; }

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

  @media (max-width: 920px) {
    .mw-topbar {
      position: static !important;
      top: auto !important;
      z-index: 1;
      height: auto;
      min-height: 0;
      display: grid;
      grid-template-columns: 1fr;
      align-items: stretch;
      padding: 10px 18px 8px;
      gap: 10px;
      animation: none;
      background: var(--paper);
      backdrop-filter: none;
    }

    .mw-topbar-divider {
      display: none;
    }

    .mw-back-btn {
      display: none;
    }

    .mw-topbar-title {
      margin: 0;
      font-size: 24px;
      line-height: 1;
    }

    .mw-topbar-right {
      width: 100%;
      margin-left: 0;
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      gap: 10px;
    }

    .mw-unit-toggle {
      height: 42px;
      border-radius: 12px;
    }

    .mw-unit-btn {
      min-width: 52px;
      font-size: 13px;
      border-radius: 9px;
    }

    .mw-add-btn {
      width: 100%;
      height: 42px;
      justify-content: center;
      border-radius: 12px;
      font-size: 13px;
    }

    .mw-page {
      padding: 10px 18px calc(112px + env(safe-area-inset-bottom, 0px));
      gap: 12px;
    }

    .mw-hero-row {
      display: block;
      animation: none;
    }

    .mw-hero-row > div:first-child {
      display: none;
    }

    .mw-hero-stats {
      width: 100%;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
      background: transparent;
      border-radius: 0;
      overflow: visible;
      box-shadow: none;
    }

    .mw-hero-stat {
      min-width: 0;
      padding: 10px 8px;
      border: 1px solid var(--cloud);
      border-radius: 12px;
      background: var(--white);
    }

    .mw-hero-stat-num {
      margin-bottom: 3px;
      color: var(--ink);
      font-size: 24px;
      letter-spacing: 0;
    }

    .mw-hero-stat-num span {
      color: var(--sage-deep);
    }

    .mw-hero-stat-label {
      color: var(--ash);
      font-size: 10px;
      white-space: normal;
      line-height: 1.2;
    }

    .mw-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .mw-sidebar {
      order: 1;
      gap: 0;
    }

    .mw-detail-wrap {
      order: 2;
    }

    .mw-summary-card {
      border: 0;
      border-radius: 0;
      background: transparent;
      overflow: visible;
      animation: none;
    }

    .mw-summary-header,
    .mw-tip-card {
      display: none;
    }

    .mw-profile-list-item {
      margin-bottom: 8px;
      padding: 11px 12px;
      border: 1px solid var(--cloud);
      border-radius: 13px;
      background: var(--white);
    }

    .mw-profile-list-item:last-child {
      margin-bottom: 0;
      border-bottom: 1px solid var(--cloud);
    }

    .mw-profile-list-item.selected {
      border-color: var(--ink);
      background: var(--white);
      box-shadow: 0 8px 22px rgba(13,13,13,0.08);
    }

    .mw-profile-list-emoji {
      width: 38px;
      height: 38px;
      border-radius: 11px;
      font-size: 18px;
    }

    .mw-profile-list-name {
      font-size: 13.5px;
    }

    .mw-profile-list-count {
      font-size: 11px;
    }

    .mw-detail-panel {
      gap: 12px;
      animation: none;
    }

    .mw-detail-header-card,
    .mw-meas-section {
      border-radius: 14px;
    }

    .mw-detail-cover {
      display: none;
    }

    .mw-detail-identity {
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
      padding: 12px;
    }

    .mw-detail-emoji-wrap {
      top: 0;
      width: 44px;
      height: 44px;
      border: 1px solid var(--cloud);
      border-radius: 12px;
      box-shadow: none;
      font-size: 24px;
    }

    .mw-detail-identity-body {
      min-width: 0;
      padding-top: 0;
    }

    .mw-detail-name {
      margin-bottom: 2px;
      font-size: 21px;
      line-height: 1.1;
    }

    .mw-detail-counts {
      font-size: 11.5px;
    }

    .mw-detail-actions {
      width: 100%;
      padding-top: 4px;
      gap: 8px;
    }

    .mw-action-btn-outline,
    .mw-action-btn-ink {
      flex: 1;
      min-height: 38px;
      justify-content: center;
      padding: 0 12px;
      border-radius: 11px;
    }

    .mw-meas-section-header {
      padding: 11px 13px 10px;
    }

    .mw-bar-rows {
      padding: 12px 13px;
      gap: 9px;
    }

    .mw-bar-row {
      gap: 8px;
    }

    .mw-bar-label {
      width: 74px;
      font-size: 10.5px;
    }

    .mw-bar-val {
      width: 54px;
      font-size: 11.5px;
    }

    .mw-tile-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
      padding: 12px 13px;
    }

    .mw-tile {
      border-radius: 11px;
      padding: 10px 11px;
    }

    .mw-empty {
      padding: 40px 20px;
      border-radius: 16px;
    }
  }

  @media (max-width: 390px) {
    .mw-page {
      padding-left: 14px;
      padding-right: 14px;
    }

    .mw-hero-stat-num {
      font-size: 22px;
    }

    .mw-hero-stat-label {
      font-size: 9.5px;
    }
  }

  /* ════════════════════════════════════
     KEYFRAMES
  ════════════════════════════════════ */
  @keyframes mw-fadeDown { from { opacity: 0; transform: translateY(-14px); } to { opacity: 1; transform: none; } }
  @keyframes mw-fadeUp   { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
  @keyframes mw-slideIn  { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: none; } }
  @keyframes mw-growBar  { from { width: 0; } to { width: var(--w); } }
  @keyframes mw-spin     { to { transform: rotate(360deg); } }

  /* Simplified measurements UI */
  .mw-topbar {
    position: static;
    height: auto;
    min-height: 64px;
    padding: 16px clamp(18px, 4vw, 48px);
    background: var(--paper);
    backdrop-filter: none;
    animation: none;
  }

  .mw-back-btn,
  .mw-topbar-divider {
    display: none;
  }

  .mw-topbar-title {
    font-size: clamp(28px, 4vw, 38px);
    line-height: 1;
    letter-spacing: 0;
  }

  .mw-topbar-right {
    margin-left: auto;
  }

  .mw-page {
    max-width: 1240px;
    padding: 22px 24px calc(104px + env(safe-area-inset-bottom, 0px));
    gap: 14px;
  }

  .mw-hero-row,
  .mw-summary-header,
  .mw-tip-card {
    display: none !important;
  }

  .mw-grid {
    display: flex;
    flex-direction: column;
    gap: 14px;
    width: 100%;
  }

  .mw-card-flow {
    width: 100%;
  }

  .mw-sidebar,
  .mw-detail-wrap {
    min-width: 0;
  }

  .mw-category-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    overflow: visible;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    animation: none;
  }

  .mw-category-card {
    width: 100%;
    max-width: none;
    min-height: 148px;
    margin: 0;
    padding: 14px;
    border: 1px solid var(--cloud);
    border-radius: 16px;
    background: var(--white);
    color: var(--ink);
    box-shadow: none;
    display: flex;
    flex-direction: column;
    gap: 11px;
    text-align: left;
    font-family: var(--fs);
    cursor: pointer;
    transition: border-color 0.18s, box-shadow 0.18s, transform 0.18s, background 0.18s;
  }

  .mw-category-card:hover {
    background: var(--white);
    border-color: var(--mist);
    transform: translateY(-1px);
  }

  .mw-category-card.is-default {
    border-color: var(--cloud);
    background: var(--white);
    color: var(--ink);
    box-shadow: none;
  }

  .mw-category-card.is-missing {
    border-color: var(--sage-dark);
    background: linear-gradient(180deg, var(--sage-light), #F4FAF2);
    color: var(--ink);
  }

  .mw-category-card.is-missing:hover {
    border-color: var(--sage-deep);
    background: linear-gradient(180deg, var(--sage-light), #F4FAF2);
  }

  .mw-category-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .mw-category-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: var(--paper);
    border: 1px solid var(--cloud);
    color: var(--ink);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .mw-category-icon svg {
    width: 22px;
    height: 22px;
    display: block;
  }

  .mw-category-card.is-missing .mw-category-icon {
    background: rgba(255,255,255,0.62);
    border-color: rgba(122,158,120,0.28);
    color: var(--sage-deep);
  }

  .mw-category-card.is-default .mw-category-icon {
    background: var(--paper);
    border-color: var(--cloud);
    color: var(--ink);
  }

  .mw-category-name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 19px;
    font-weight: 800;
    line-height: 1.1;
  }

  .mw-profile-default-dot {
    width: 6px;
    height: 6px;
    background: var(--sage-deep);
    box-shadow: none;
  }

  .mw-category-card.is-default .mw-profile-default-dot {
    background: var(--sage-deep);
    opacity: 1;
  }

  .mw-category-status {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 46px;
    padding: 5px 9px;
    border-radius: 999px;
    background: var(--cloud);
    color: var(--ash);
    font-size: 10px;
    font-weight: 800;
    line-height: 1;
  }

  .mw-category-card.is-missing .mw-category-status {
    background: var(--white);
    color: var(--sage-deep);
  }

  .mw-category-card.is-default .mw-category-status {
    background: var(--sage-light);
    color: var(--sage-deep);
  }

  .mw-body-part-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    min-height: 28px;
  }

  .mw-body-part {
    display: inline-flex;
    align-items: center;
    min-height: 24px;
    padding: 4px 8px;
    border-radius: 999px;
    background: var(--paper);
    border: 1px solid var(--cloud);
    color: var(--slate);
    font-size: 11px;
    font-weight: 800;
    line-height: 1;
  }

  .mw-body-part strong {
    margin-left: 6px;
    color: inherit;
    font-weight: 900;
  }

  .mw-body-part.is-filled {
    background: var(--cloud);
    color: var(--ink);
  }

  .mw-body-part.is-primary {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--white);
  }

  .mw-category-card.is-default .mw-body-part {
    background: var(--paper);
    border-color: var(--cloud);
    color: var(--slate);
  }

  .mw-category-card.is-default .mw-body-part.is-primary,
  .mw-category-card.is-default .mw-body-part.is-filled {
    background: var(--cloud);
    border-color: var(--cloud);
    color: var(--ink);
  }

  .mw-category-foot {
    margin-top: auto;
    color: var(--ash);
    font-size: 12px;
    font-weight: 700;
  }

  .mw-category-card.is-missing .mw-category-foot {
    color: var(--sage-deep);
  }

  .mw-category-card.is-default .mw-category-foot {
    color: var(--ash);
  }

  .mw-detail-panel {
    gap: 0;
    animation: none;
  }

  .mw-simple-card {
    background: var(--white);
    border: 1px solid var(--cloud);
    border-radius: 16px;
    padding: 18px;
  }

  .mw-simple-header {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 14px;
    align-items: start;
  }

  .mw-simple-kicker {
    font-size: 11px;
    font-weight: 800;
    color: var(--sage-deep);
    letter-spacing: 0.5px;
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  .mw-simple-title {
    display: flex;
    align-items: center;
    gap: 9px;
    min-width: 0;
    font-family: var(--fd);
    font-size: 30px;
    font-weight: 700;
    color: var(--ink);
    line-height: 1;
  }

  .mw-simple-title-text {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mw-simple-meta {
    margin-top: 8px;
    font-size: 13px;
    color: var(--ash);
  }

  .mw-simple-list {
    margin-top: 16px;
    border-top: 1px solid var(--cloud);
  }

  .mw-simple-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    min-height: 56px;
    border-bottom: 1px solid var(--cloud);
  }

  .mw-simple-row:last-child {
    border-bottom: 0;
  }

  .mw-simple-label {
    min-width: 0;
    font-size: 14px;
    font-weight: 700;
    color: var(--slate);
    text-transform: capitalize;
  }

  .mw-primary-tag {
    display: inline-flex;
    margin-left: 8px;
    padding: 2px 7px;
    border-radius: 999px;
    background: var(--sage-light);
    color: var(--sage-deep);
    font-size: 10px;
    font-weight: 800;
    vertical-align: middle;
  }

  .mw-simple-value {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: baseline;
    gap: 4px;
    font-family: var(--fd);
    font-size: 32px;
    font-weight: 700;
    color: var(--ink);
    line-height: 1;
  }

  .mw-simple-unit {
    font-family: var(--fs);
    font-size: 13px;
    font-weight: 700;
    color: var(--ash);
  }

  .mw-default-badge {
    padding: 4px 9px;
    font-size: 9px;
  }

  .mw-simple-empty {
    margin-top: 14px;
    padding: 16px;
    border: 1px dashed var(--mist);
    border-radius: 12px;
    color: var(--ash);
    font-size: 13px;
    text-align: center;
  }

  .mw-action-btn-ink {
    min-height: 42px;
    padding: 0 16px;
    border-radius: 12px;
    font-size: 13px;
    white-space: nowrap;
  }

  /* Keep the current single-card layout when there is not enough room for two readable cards. */
  @media (max-width: 860px) {
    .mw-page {
      max-width: 760px;
    }

    .mw-category-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 620px) {
    .mw-topbar {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
      padding: 14px 18px 12px;
    }

    .mw-topbar-title {
      font-size: 30px;
    }

    .mw-topbar-right {
      width: 100%;
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      gap: 10px;
      margin-left: 0;
    }

    .mw-unit-toggle,
    .mw-add-btn {
      height: 44px;
      border-radius: 13px;
    }

    .mw-add-btn {
      width: 100%;
      justify-content: center;
      font-size: 0;
    }

    .mw-add-btn::after {
      content: 'Add';
      font-size: 14px;
    }

    .mw-page {
      padding: 12px 18px calc(108px + env(safe-area-inset-bottom, 0px));
      gap: 12px;
      overflow-x: hidden;
    }

    .mw-category-grid {
      grid-template-columns: 1fr;
      gap: 10px;
      margin-inline: 0;
      padding: 0;
    }

    .mw-category-card {
      min-height: 142px;
      padding: 14px;
      border-radius: 15px;
      width: 100%;
    }

    .mw-category-name {
      font-size: 18px;
    }

    .mw-simple-card {
      padding: 15px;
      border-radius: 14px;
    }

    .mw-simple-header {
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .mw-simple-title {
      font-size: 28px;
    }

    .mw-action-btn-ink {
      width: 100%;
      justify-content: center;
    }

    .mw-body-part-grid {
      gap: 5px;
    }

    .mw-body-part {
      max-width: 100%;
      min-height: 23px;
      padding: 4px 7px;
      font-size: 10.5px;
    }

    .mw-simple-row {
      min-height: 52px;
      gap: 10px;
    }

    .mw-simple-value {
      font-size: 28px;
    }
  }

  @media (max-width: 390px) {
    .mw-topbar {
      padding-inline: 14px;
    }

    .mw-page {
      padding-inline: 14px;
    }

    .mw-category-card {
      min-height: 132px;
    }

    .mw-category-name {
      font-size: 17px;
    }

    .mw-body-part {
      font-size: 10px;
    }
  }
`;

const measurementPageStyles = document.getElementById('mw-styles');
if (measurementPageStyles) {
  measurementPageStyles.textContent = CSS;
} else {
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
const CLOTHING_ICONS: Array<[string, IconType]> = [
  ['tshirt', PiTShirt],
  ['tee', PiTShirt],
  ['shirt', PiShirtFolded],
  ['blouse', PiShirtFolded],
  ['trouser', PiPants],
  ['pant', PiPants],
  ['jean', PiPants],
  ['short', GiShorts],
  ['dress', PiDress],
];

function clothingIcon(key: string | null) {
  if (!key) return PiCoatHanger;
  const k = key.toLowerCase();
  for (const [token, Icon] of CLOTHING_ICONS) {
    if (k.includes(token)) return Icon;
  }
  return PiCoatHanger;
}

function ClothingCategoryIcon({ categoryKey }: { categoryKey: string | null }) {
  const Icon = clothingIcon(categoryKey);
  return <Icon aria-hidden="true" focusable="false" />;
}

const fallbackMeasurementLabel = (key: string) =>
  DEFAULT_MEASUREMENT_LABELS[key as keyof typeof DEFAULT_MEASUREMENT_LABELS] ??
  key
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, char => char.toUpperCase());

function categoryMeasurementParts(
  gender: CustomerGender | null,
  choice: ClothingChoice,
  savedProfile: CustomerMeasurementProfile | null,
) {
  const template = getClothingTemplate(gender, choice);
  if (template) {
    return template.fields.map(field => ({
      key: field.key,
      label: field.label,
      isPrimary: field.isPrimary,
    }));
  }

  const primaryKeys = savedProfile?.primaryMeasurementKeys ?? [];
  return Object.keys(savedProfile?.measurements ?? {}).map(key => ({
    key,
    label: fallbackMeasurementLabel(key),
    isPrimary: primaryKeys.includes(key),
  }));
}

/* ─────────────────────────────────────────────
   Detail panel for selected profile
───────────────────────────────────────────── */
function ProfileDetail({
  entry, isDefault, unit, onEdit,
}: {
  entry: any; isDefault: boolean; unit: string;
  onEdit: () => void;
}) {
  const primaryKeys: string[] = entry.primaryMeasurementKeys ?? [];
  const allEntries = Object.entries(entry.measurements ?? {}) as [string, string][];

  return (
    <div className="mw-detail-panel">
      <section className="mw-simple-card">
        <div className="mw-simple-header">
          <div>
            <div className="mw-simple-kicker">Selected category</div>
            <div className="mw-simple-title">
              <span className="mw-simple-title-text">{entry.preferredClothingLabel}</span>
              {isDefault && (
                <span className="mw-default-badge"><Ico.Star /> Default</span>
              )}
            </div>
            <div className="mw-simple-meta">
              {allEntries.length} measurement{allEntries.length !== 1 ? 's' : ''} saved
            </div>
          </div>
          <button className="mw-action-btn-ink" onClick={onEdit}>
            <Ico.Edit /> Edit measurements
          </button>
        </div>

        {allEntries.length > 0 ? (
          <div className="mw-simple-list">
            {allEntries.map(([k, v]) => (
              <div key={k} className="mw-simple-row">
                <div className="mw-simple-label">
                  {k}
                  {primaryKeys.includes(k) && <span className="mw-primary-tag">Primary</span>}
                </div>
                <div className="mw-simple-value">
                  {String(v)}
                  <span className="mw-simple-unit">{unit}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mw-simple-empty">
            No measurements saved for this category yet.
          </div>
        )}
      </section>
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
  const { categoryOptions, measurementProfiles, normalizedGender, profile } = useRecommendationData(user?.uid);
  const activeKey = typeof profile?.activeMeasurementProfileKey === 'string'
    ? profile.activeMeasurementProfileKey : null;
  const unit = (profile?.unit as 'cm' | 'in') ?? 'cm';

  const customerGender =
    normalizeGender(normalizedGender) ??
    normalizeGender(profile?.gender) ??
    normalizeGender(measurementProfiles[0]?.gender);
  const hasAvailableCategories = categoryOptions.length > 0;

  return (
    <div className="mw-root">

      {/* ── Topbar ── */}
      <div className="mw-topbar">
        <span className="mw-topbar-title">Measurements</span>

        <div className="mw-topbar-right">
          {/* Unit indicator */}
          <div className="mw-unit-toggle">
            <div className={`mw-unit-btn${unit === 'cm' ? ' active' : ''}`}>cm</div>
            <div className={`mw-unit-btn${unit === 'in' ? ' active' : ''}`}>in</div>
          </div>
          <button className="mw-add-btn" onClick={() => navigate('/app/add-preference')}>
            <Ico.Plus /> Add measurements
          </button>
        </div>
      </div>

      {/* ── Page ── */}
      <div className="mw-page">

        {/* Empty state */}
        {!measurementProfiles.length && !hasAvailableCategories && (
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
                : 'Add your first clothing category to start getting size recommendations.'}
            </div>
            <button className="mw-empty-btn" onClick={() => navigate('/app/add-preference')}>
              <Ico.Plus /> Add measurements
            </button>
          </div>
        )}

        {/* Category cards */}
        {(measurementProfiles.length > 0 || hasAvailableCategories) && (
          <div className="mw-grid">
            <div className="mw-card-flow">
              <div className="mw-category-grid">
                {categoryOptions.map(option => {
                  const savedProfile = measurementProfiles.find(p => p.preferredClothing === option.key) ?? null;
                  const isDefault  = !!savedProfile && savedProfile.profileKey === activeKey;
                  const cardGender = normalizeGender(savedProfile?.gender) ?? customerGender;
                  const parts = categoryMeasurementParts(cardGender, option.key, savedProfile);
                  const statusLabel = isDefault ? 'Default' : savedProfile ? 'Added' : 'Add';
                  const savedCount = Object.keys(savedProfile?.measurements ?? {}).length;
                  const cardUnit = savedProfile?.unit === 'in' || savedProfile?.unit === 'cm'
                    ? savedProfile.unit
                    : unit;
                  return (
                    <button
                      key={option.key}
                      className={`mw-category-card ${savedProfile ? 'is-added' : 'is-missing'}${isDefault ? ' is-default' : ''}`}
                      onClick={() => navigate(
                        savedProfile
                          ? `/app/add-preference?profileKey=${savedProfile.profileKey}`
                          : `/app/add-preference?choice=${option.key}`
                      )}>
                      <div className="mw-category-card-top">
                        <div className="mw-category-icon"><ClothingCategoryIcon categoryKey={option.key} /></div>
                        <span className="mw-category-status">{statusLabel}</span>
                      </div>
                      <div className="mw-category-name">{option.label}</div>
                      <div className="mw-body-part-grid">
                        {parts.map(part => {
                          const savedValue = savedProfile?.measurements?.[part.key];
                          const hasValue = savedValue !== undefined && savedValue !== null && String(savedValue).trim().length > 0;
                          return (
                            <span
                              key={part.key}
                              className={`mw-body-part${part.isPrimary ? ' is-primary' : ''}${hasValue ? ' is-filled' : ''}`}>
                              {part.label}
                              {hasValue && <strong>{String(savedValue)} {cardUnit}</strong>}
                            </span>
                          );
                        })}
                      </div>
                      <div className="mw-category-foot">
                        {savedProfile
                          ? `${savedCount} saved · Tap to edit`
                          : 'Add measurements'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default MeasurementsPage;
