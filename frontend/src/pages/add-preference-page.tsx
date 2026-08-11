import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import manImage from '@/assets/images/man.png';
import womenImage from '@/assets/images/women.png';
import { MeasurementValidationDialog } from '@/components/measurement-validation-dialog';
import { useAuth } from '@/context/auth-context';
import { useProfileSubject } from '@/context/profile-subject-context';
import {
  CLOTHING_OPTIONS_BY_GENDER,
  DEFAULT_MEASUREMENT_LABELS,
  getClothingTemplate,
  normalizeClothingChoice,
  normalizeGender,
  type ClothingChoice,
  type CustomerGender,
  type MeasurementField,
} from '@/lib/measurement';
import { saveCustomerMeasurementProfile } from '@/lib/customer-profile';
import { saveFamilyMemberMeasurementProfile } from '@/lib/family-members';
import {
  validateMeasurements,
  type MeasurementValidationWarning,
} from '@/lib/measurement-validation';
import {
  buildFallbackOptions,
  extractMeasurementProfiles,
  type CustomerMeasurementProfile,
} from '@/lib/recommendation-view';
import { useRecommendationData } from '@/lib/use-recommendation-data';
import { useCatalogSummary } from '@/lib/catalog-summary';

/* ─────────────────────────────────────────────
   Fonts
───────────────────────────────────────────── */
const fontLink = document.createElement('link');
fontLink.rel = 'stylesheet';
fontLink.href =
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap';
if (!document.querySelector('[href*="Cormorant+Garamond"]')) document.head.appendChild(fontLink);

/* ─────────────────────────────────────────────
   CSS
───────────────────────────────────────────── */
const CSS = `
  :root {
    --sage: #C3D8C1; --sage-light: #D9EBD7; --sage-deep: #7A9E78; --sage-dark: #A3BFA1;
    --ink: #0D0D0D; --paper: #FAFAF8; --cloud: #EFEFEF; --mist: #D4D4D4;
    --ash: #757575; --slate: #4A4A4A; --white: #FFFFFF; --red: #C0392B;
    --fd: 'Cormorant Garamond', serif; --fs: 'DM Sans', sans-serif;
    --ease: cubic-bezier(0.22, 1, 0.36, 1);
  }

  .ap-root { min-height: 100vh; background: var(--paper); font-family: var(--fs); }

  /* ════════════════════════════════════
     TOPBAR
  ════════════════════════════════════ */
  .ap-topbar {
    position: sticky; top: 0; z-index: 50;
    height: 64px;
    background: rgba(250,250,248,0.92);
    backdrop-filter: blur(14px);
    border-bottom: 1px solid var(--cloud);
    display: flex; align-items: center;
    padding: 0 48px; gap: 14px;
    animation: ap-fadeDown 0.5s var(--ease) both;
  }
  .ap-topbar-back {
    display: flex; align-items: center; gap: 7px;
    font-family: var(--fs); font-size: 13px; font-weight: 600;
    color: var(--ash); background: none; border: none; cursor: pointer;
    padding: 8px 14px; border-radius: 8px; transition: all 0.18s;
  }
  .ap-topbar-back:hover { background: var(--cloud); color: var(--ink); }
  .ap-topbar-back svg { width: 14px; height: 14px; }
  .ap-topbar-divider { width: 1px; height: 22px; background: var(--cloud); }
  .ap-topbar-title {
    font-family: var(--fd); font-size: 20px; font-weight: 700;
    color: var(--ink); letter-spacing: -0.4px;
  }
  .ap-topbar-right { margin-left: auto; display: flex; align-items: center; gap: 20px; }

  /* Step progress in topbar */
  .ap-step-track { display: flex; align-items: center; gap: 0; }
  .ap-step-item {
    display: flex; align-items: center; gap: 8px;
    font-size: 12px; font-weight: 600; color: var(--mist);
    transition: color 0.2s;
  }
  .ap-step-item.active { color: var(--ink); }
  .ap-step-item.done   { color: var(--sage-deep); }
  .ap-step-num {
    width: 22px; height: 22px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 800;
    background: var(--cloud); color: var(--ash);
    transition: all 0.2s;
    flex-shrink: 0;
  }
  .ap-step-item.active .ap-step-num { background: var(--ink); color: var(--white); }
  .ap-step-item.done   .ap-step-num { background: var(--sage-deep); color: var(--white); }
  .ap-step-connector { width: 28px; height: 1px; background: var(--cloud); margin: 0 6px; }
  .ap-step-connector.done { background: var(--sage-dark); }

  /* Sub-step progress bar (full-width, below topbar) */
  .ap-progress-bar {
    height: 2px; background: var(--cloud);
    position: sticky; top: 64px; z-index: 49;
  }
  .ap-progress-fill {
    height: 100%; background: var(--ink);
    transition: width 0.4s var(--ease);
  }

  /* ════════════════════════════════════
     TWO-COLUMN LAYOUT
  ════════════════════════════════════ */
  .ap-layout {
    max-width: 1200px; margin: 0 auto;
    padding: 48px 48px 80px;
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 48px;
    align-items: start;
  }

  /* ── LEFT SIDEBAR ── */
  .ap-sidebar { display: flex; flex-direction: column; gap: 20px; }

  /* Context card */
  .ap-ctx-card {
    background: var(--ink); border-radius: 18px; padding: 24px;
    overflow: hidden; position: relative;
    animation: ap-fadeUp 0.5s 0.05s var(--ease) both;
  }
  .ap-ctx-glow {
    position: absolute; top: -60px; right: -60px;
    width: 160px; height: 160px; border-radius: 50%;
    background: rgba(195,216,193,0.08); pointer-events: none;
  }
  .ap-ctx-eyebrow {
    font-size: 10px; font-weight: 700; letter-spacing: 0.7px;
    text-transform: uppercase; color: rgba(255,255,255,0.38);
    margin-bottom: 12px; position: relative; z-index: 1;
  }
  .ap-ctx-title {
    font-family: var(--fd); font-size: 22px; font-weight: 700;
    color: var(--white); letter-spacing: -0.4px; line-height: 1.15;
    margin-bottom: 6px; position: relative; z-index: 1;
  }
  .ap-ctx-title em { font-style: italic; color: var(--sage); }
  .ap-ctx-sub {
    font-size: 12.5px; color: rgba(255,255,255,0.4);
    position: relative; z-index: 1; line-height: 1.55;
  }

  /* Sidebar step list */
  .ap-sidebar-steps { display: flex; flex-direction: column; gap: 4px; animation: ap-fadeUp 0.5s 0.1s var(--ease) both; }
  .ap-sidebar-step {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 14px; border-radius: 12px;
    transition: background 0.18s;
    cursor: default;
  }
  .ap-sidebar-step.active { background: var(--cloud); }
  .ap-sidebar-step-num {
    width: 28px; height: 28px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 800;
    background: var(--cloud); color: var(--ash); flex-shrink: 0;
    transition: all 0.2s;
  }
  .ap-sidebar-step.done   .ap-sidebar-step-num { background: var(--sage-deep); color: var(--white); }
  .ap-sidebar-step.active .ap-sidebar-step-num { background: var(--ink); color: var(--white); box-shadow: 0 0 0 3px rgba(13,13,13,0.08); }
  .ap-sidebar-step-body { flex: 1; }
  .ap-sidebar-step-label { font-size: 13px; font-weight: 700; color: var(--ash); transition: color 0.2s; }
  .ap-sidebar-step.done   .ap-sidebar-step-label { color: var(--sage-deep); }
  .ap-sidebar-step.active .ap-sidebar-step-label { color: var(--ink); }
  .ap-sidebar-step-sub { font-size: 11px; color: var(--mist); margin-top: 1px; }
  .ap-sidebar-step.active .ap-sidebar-step-sub { color: var(--ash); }

  /* Sidebar measurement summary */
  .ap-sidebar-meas { animation: ap-fadeUp 0.5s 0.16s var(--ease) both; }
  .ap-sidebar-meas-header {
    font-size: 11px; font-weight: 700; color: var(--ash);
    text-transform: uppercase; letter-spacing: 0.7px;
    margin-bottom: 12px;
    display: flex; align-items: center; gap: 8px;
  }
  .ap-sidebar-meas-header::after { content:''; flex:1; height:1px; background: var(--cloud); }
  .ap-sidebar-meas-row {
    display: flex; align-items: center; gap: 10px; margin-bottom: 8px;
  }
  .ap-sidebar-meas-row:last-child { margin-bottom: 0; }
  .ap-sidebar-meas-key { font-size: 11.5px; font-weight: 600; color: var(--ash); width: 70px; text-align: right; flex-shrink: 0; }
  .ap-sidebar-bar-track { flex: 1; height: 5px; background: var(--cloud); border-radius: 999px; overflow: hidden; }
  .ap-sidebar-bar-fill { height: 100%; border-radius: 999px; background: var(--sage-deep); }
  .ap-sidebar-meas-val { font-size: 11.5px; font-weight: 700; color: var(--ink); width: 44px; flex-shrink: 0; }

  /* Tip card */
  .ap-tip-card {
    background: var(--sage-light); border: 1px solid var(--sage-dark);
    border-radius: 14px; padding: 16px 18px;
    display: flex; gap: 12px; align-items: flex-start;
    animation: ap-fadeUp 0.5s 0.2s var(--ease) both;
  }
  .ap-tip-icon {
    width: 30px; height: 30px; border-radius: 8px;
    background: rgba(163,191,161,0.35);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .ap-tip-icon svg { width: 14px; height: 14px; color: var(--sage-deep); }
  .ap-tip-title { font-size: 12.5px; font-weight: 700; color: var(--ink); margin-bottom: 3px; }
  .ap-tip-sub { font-size: 11.5px; color: var(--sage-deep); line-height: 1.55; }

  /* ── RIGHT MAIN CONTENT ── */
  .ap-main { display: flex; flex-direction: column; gap: 28px; }

  /* Phase slide animations */
  .ap-phase-enter-fwd  { animation: ap-slideInFwd  0.3s var(--ease) both; }
  .ap-phase-enter-back { animation: ap-slideInBack 0.3s var(--ease) both; }

  /* Page title area */
  .ap-page-header { animation: ap-fadeUp 0.45s var(--ease) both; }
  .ap-page-eyebrow {
    font-size: 11px; font-weight: 700; color: var(--sage-deep);
    letter-spacing: 0.8px; text-transform: uppercase;
    display: flex; align-items: center; gap: 8px; margin-bottom: 12px;
  }
  .ap-page-eyebrow-line { width: 28px; height: 1.5px; background: var(--sage-deep); }
  .ap-page-title {
    font-family: var(--fd); font-size: clamp(32px, 3.5vw, 48px);
    font-weight: 700; color: var(--ink); letter-spacing: -0.8px;
    line-height: 1.06; margin-bottom: 10px;
  }
  .ap-page-title em { font-style: italic; color: var(--sage-deep); }
  .ap-page-sub { font-size: 14.5px; color: var(--ash); line-height: 1.7; max-width: 540px; }

  /* ── CHOICE GRID ── */
  .ap-choice-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 14px;
  }
  .ap-choice-card {
    display: flex; flex-direction: column; gap: 14px;
    padding: 22px;
    background: var(--white); border: 1.5px solid var(--cloud);
    border-radius: 16px; cursor: pointer;
    font: inherit; color: inherit; text-align: left; appearance: none;
    transition: all 0.2s var(--ease);
    position: relative;
  }
  .ap-choice-card:hover { border-color: var(--mist); box-shadow: 0 6px 22px rgba(0,0,0,0.06); transform: translateY(-2px); }
  .ap-choice-card:focus-visible {
    outline: none;
    border-color: var(--ink);
    box-shadow: 0 0 0 4px rgba(13,13,13,0.09);
  }
  .ap-choice-card.selected {
    border-color: var(--ink);
    background: rgba(13,13,13,0.02);
    box-shadow: 0 0 0 3px rgba(13,13,13,0.06);
  }
  .ap-choice-icon {
    width: 44px; height: 44px; border-radius: 11px;
    background: var(--paper); border: 1px solid var(--cloud);
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s;
  }
  .ap-choice-card.selected .ap-choice-icon { background: var(--ink); border-color: var(--ink); }
  .ap-choice-icon svg { width: 18px; height: 18px; color: var(--ash); }
  .ap-choice-card.selected .ap-choice-icon svg { color: var(--white); }
  .ap-choice-card-title { font-size: 14.5px; font-weight: 700; color: var(--ink); }
  .ap-choice-card-sub   { font-size: 12.5px; color: var(--ash); line-height: 1.4; margin-top: -4px; }
  .ap-gender-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
    max-width: 820px;
  }
  .ap-gender-card {
    padding: 14px;
    min-height: 386px;
    border-radius: 22px;
    overflow: hidden;
  }
  .ap-gender-image {
    height: 272px;
    margin: 0 0 2px;
    border-radius: 18px;
    border: 1px solid rgba(13,13,13,0.08);
    background: linear-gradient(180deg, #FFFFFF 0%, #F5F7F2 100%);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    overflow: hidden;
    transition: border-color 0.2s var(--ease), background 0.2s var(--ease);
  }
  .ap-choice-card.selected .ap-gender-image {
    border-color: rgba(73,102,87,0.28);
    background: linear-gradient(180deg, #FFFFFF 0%, #EEF3EC 100%);
  }
  .ap-gender-image img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center bottom;
    transform: scale(1.14);
    filter: drop-shadow(0 18px 22px rgba(13,13,13,0.1));
  }
  .ap-gender-copy {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .ap-gender-card .ap-choice-card-title {
    font-size: 18px;
    margin-top: 10px;
  }
  .ap-gender-card .ap-choice-card-sub {
    font-size: 13px;
    line-height: 1.5;
  }
  .ap-check-circle {
    position: absolute; top: 14px; right: 14px;
    width: 20px; height: 20px; border-radius: 50%;
    border: 1.5px solid var(--cloud);
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s;
  }
  .ap-choice-card.selected .ap-check-circle { background: var(--ink); border-color: var(--ink); }
  .ap-check-circle svg { width: 10px; height: 10px; color: var(--white); opacity: 0; transition: opacity 0.15s; }
  .ap-choice-card.selected .ap-check-circle svg { opacity: 1; }

  /* ── GUIDE SECTION ── */
  .ap-guide-layout {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 28px; align-items: start;
  }

  /* Sub-step tabs */
  .ap-field-tabs {
    display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 24px;
  }
  .ap-field-tab {
    display: flex; align-items: center; gap: 7px;
    font-family: var(--fs); font-size: 12.5px; font-weight: 600;
    padding: 7px 14px; border-radius: 999px;
    border: 1.5px solid var(--cloud); background: var(--white);
    color: var(--ash); cursor: pointer; transition: all 0.18s;
    white-space: nowrap;
  }
  .ap-field-tab:hover { border-color: var(--mist); color: var(--ink); }
  .ap-field-tab.done   { border-color: var(--sage-dark); color: var(--sage-deep); background: var(--sage-light); }
  .ap-field-tab.active { border-color: var(--ink); color: var(--white); background: var(--ink); }
  .ap-field-tab-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

  /* Guide card */
  .ap-guide-card {
    background: var(--white); border: 1px solid var(--cloud);
    border-radius: 18px; overflow: hidden;
  }
  .ap-guide-cover {
    height: 72px; background: var(--ink); position: relative; overflow: hidden;
  }
  .ap-guide-cover-glow {
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 80% 50%, rgba(195,216,193,0.12) 0%, transparent 60%);
  }
  .ap-guide-cover-grid {
    position: absolute; inset: 0;
    background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 28px 28px;
  }
  .ap-guide-cover-badge {
    position: absolute; bottom: 14px; left: 20px;
    display: flex; align-items: center; gap: 6px;
  }
  .ap-guide-cover-tag {
    font-size: 9px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;
    padding: 4px 10px; border-radius: 999px;
    display: flex; align-items: center; gap: 5px;
  }
  .ap-guide-cover-tag.required { background: var(--white); color: var(--ink); }
  .ap-guide-cover-tag.optional { background: rgba(255,255,255,0.12); color: rgba(255,255,255,0.6); border: 1px solid rgba(255,255,255,0.15); }
  .ap-guide-body { padding: 22px 24px; }
  .ap-guide-step-label { font-size: 11px; font-weight: 700; color: var(--ash); letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 8px; }
  .ap-guide-title { font-family: var(--fd); font-size: 22px; font-weight: 700; color: var(--ink); letter-spacing: -0.3px; margin-bottom: 10px; }
  .ap-guide-desc { font-size: 13.5px; color: var(--ash); line-height: 1.65; margin-bottom: 14px; }
  .ap-guide-tip {
    display: flex; align-items: flex-start; gap: 8px;
    background: var(--sage-light); border: 1px solid var(--sage-dark);
    border-radius: 10px; padding: 12px 14px;
    font-size: 12.5px; color: var(--sage-deep); font-weight: 600; line-height: 1.5;
  }
  .ap-guide-tip svg { width: 13px; height: 13px; flex-shrink: 0; margin-top: 2px; }

  /* Input panel */
  .ap-input-panel {}
  .ap-field-label {
    display: flex; align-items: center; gap: 8px;
    font-size: 12px; font-weight: 700; color: var(--ink); margin-bottom: 10px;
  }
  .ap-field-badge {
    font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 999px;
  }
  .ap-field-badge.required { background: rgba(13,13,13,0.07); color: var(--ink); }
  .ap-field-badge.optional { background: var(--cloud); color: var(--ash); }
  .ap-input-wrap {
    display: flex; align-items: center;
    background: var(--white); border: 1.5px solid var(--cloud);
    border-radius: 14px; overflow: hidden;
    transition: border-color 0.2s, box-shadow 0.2s;
    margin-bottom: 16px;
  }
  .ap-input-wrap:focus-within {
    border-color: var(--ink);
    box-shadow: 0 0 0 3px rgba(13,13,13,0.06);
  }
  .ap-input-wrap.error { border-color: var(--red); box-shadow: 0 0 0 3px rgba(192,57,43,0.07); }
  .ap-text-input {
    flex: 1; height: 64px; border: none; outline: none;
    background: transparent; font-family: var(--fd);
    font-size: 32px; font-weight: 700; color: var(--ink);
    padding: 0 22px; letter-spacing: -0.5px;
  }
  .ap-text-input::placeholder { color: var(--mist); font-family: var(--fs); font-size: 20px; font-weight: 400; letter-spacing: 0; }
  .ap-input-unit {
    padding: 0 20px; font-size: 14px; font-weight: 700;
    color: var(--ash); border-left: 1px solid var(--cloud);
    height: 64px; display: flex; align-items: center;
    background: var(--paper); flex-shrink: 0;
  }

  /* Quick ref grid */
  .ap-ref-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 6px; }
  .ap-ref-tile {
    background: var(--white); border: 1px solid var(--cloud);
    border-radius: 12px; padding: 12px 14px;
    transition: border-color 0.18s;
  }
  .ap-ref-tile:hover { border-color: var(--mist); }
  .ap-ref-tile.filled { border-color: var(--sage-dark); background: var(--sage-light); }
  .ap-ref-tile-key { font-size: 9.5px; font-weight: 700; color: var(--ash); text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 4px; }
  .ap-ref-tile.filled .ap-ref-tile-key { color: var(--sage-deep); }
  .ap-ref-tile-val { font-family: var(--fd); font-size: 20px; font-weight: 700; color: var(--ink); line-height: 1; }
  .ap-ref-tile-unit { font-size: 10px; color: var(--ash); margin-top: 2px; }

  /* Error */
  .ap-error {
    display: flex; align-items: center; gap: 10px;
    background: rgba(192,57,43,0.06); border: 1px solid rgba(192,57,43,0.18);
    border-radius: 10px; padding: 12px 16px;
    font-size: 13px; color: var(--red); margin-bottom: 4px;
  }
  .ap-error svg { width: 15px; height: 15px; flex-shrink: 0; }

  /* ── Action row ── */
  .ap-actions { display: flex; align-items: center; gap: 12px; }
  .ap-btn-back {
    font-family: var(--fs); font-size: 13.5px; font-weight: 600;
    color: var(--slate); background: var(--white);
    border: 1.5px solid var(--cloud); border-radius: 11px;
    padding: 0 20px; height: 48px; cursor: pointer;
    display: flex; align-items: center; gap: 8px;
    transition: all 0.18s;
  }
  .ap-btn-back:hover { color: var(--ink); border-color: var(--mist); transform: translateY(-1px); }
  .ap-btn-back svg { width: 14px; height: 14px; }
  .ap-btn-next {
    flex: 1; height: 48px;
    font-family: var(--fs); font-size: 14px; font-weight: 700;
    color: var(--white); background: var(--ink);
    border: none; border-radius: 11px; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    box-shadow: 0 4px 16px rgba(13,13,13,0.16);
    transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
  }
  .ap-btn-next:hover:not(:disabled) { opacity: 0.87; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(13,13,13,0.2); }
  .ap-btn-next:active:not(:disabled) { transform: scale(0.98); }
  .ap-btn-next:disabled { opacity: 0.4; cursor: not-allowed; }
  .ap-btn-next svg { width: 15px; height: 15px; }
  .ap-btn-next.success { background: var(--sage-deep); box-shadow: 0 4px 16px rgba(122,158,120,0.28); }
  .ap-spinner { width: 15px; height: 15px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; animation: ap-spin 0.7s linear infinite; }

  /* Edit banner */
  .ap-edit-banner {
    display: flex; align-items: center; gap: 14px;
    background: var(--sage-light); border: 1px solid var(--sage-dark);
    border-radius: 14px; padding: 16px 20px;
  }
  .ap-edit-banner-icon {
    width: 36px; height: 36px; border-radius: 9px;
    background: rgba(163,191,161,0.4);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .ap-edit-banner-icon svg { width: 16px; height: 16px; color: var(--sage-deep); }
  .ap-edit-banner-label { font-size: 11px; font-weight: 700; color: var(--sage-deep); text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 2px; }
  .ap-edit-banner-value { font-size: 14px; font-weight: 700; color: var(--ink); }

  /* Simple edit mode */
  .ap-edit-simple {
    width: min(780px, 100%);
    margin: 0 auto;
    padding: 38px 48px 112px;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  .ap-edit-hero {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 18px;
  }
  .ap-edit-eyebrow {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
    color: var(--sage-deep);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.7px;
    text-transform: uppercase;
  }
  .ap-edit-eyebrow::before {
    content: '';
    width: 28px;
    height: 1.5px;
    background: var(--sage-deep);
  }
  .ap-edit-title {
    font-family: var(--fd);
    font-size: clamp(31px, 5vw, 46px);
    font-weight: 700;
    color: var(--ink);
    letter-spacing: -0.8px;
    line-height: 1.05;
  }
  .ap-edit-title em {
    color: var(--sage-deep);
    font-style: italic;
  }
  .ap-edit-sub {
    max-width: 520px;
    margin-top: 8px;
    color: var(--ash);
    font-size: 13.5px;
    line-height: 1.6;
  }
  .ap-edit-unit {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 58px;
    height: 38px;
    padding: 0 14px;
    border-radius: 999px;
    background: var(--ink);
    color: var(--white);
    font-size: 13px;
    font-weight: 800;
  }
  .ap-edit-card {
    background: var(--white);
    border: 1px solid var(--cloud);
    border-radius: 18px;
    overflow: hidden;
  }
  .ap-edit-section {
    border-bottom: 1px solid var(--cloud);
  }
  .ap-edit-section:last-child {
    border-bottom: none;
  }
  .ap-edit-section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 18px 10px;
  }
  .ap-edit-section-title {
    color: var(--ash);
    font-size: 10.5px;
    font-weight: 800;
    letter-spacing: 0.65px;
    text-transform: uppercase;
  }
  .ap-edit-section-note {
    color: var(--ash);
    font-size: 11px;
  }
  .ap-edit-field {
    display: grid;
    grid-template-columns: minmax(120px, 1fr) minmax(140px, 190px);
    align-items: center;
    gap: 14px;
    padding: 12px 18px;
    border-top: 1px solid var(--cloud);
  }
  .ap-edit-field-copy {
    min-width: 0;
  }
  .ap-edit-field-label {
    display: flex;
    align-items: center;
    gap: 7px;
    color: var(--ink);
    font-size: 13px;
    font-weight: 800;
  }
  .ap-edit-required-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--ink);
  }
  .ap-edit-field-tip {
    margin-top: 3px;
    color: var(--ash);
    font-size: 11.5px;
    line-height: 1.4;
  }
  .ap-edit-input-wrap {
    display: flex;
    align-items: center;
    height: 44px;
    overflow: hidden;
    border: 1.5px solid var(--cloud);
    border-radius: 12px;
    background: var(--paper);
    transition: border-color 0.18s, box-shadow 0.18s;
  }
  .ap-edit-input-wrap:focus-within {
    border-color: var(--ink);
    box-shadow: 0 0 0 3px rgba(13,13,13,0.06);
  }
  .ap-edit-input {
    min-width: 0;
    flex: 1;
    height: 100%;
    padding: 0 13px;
    border: 0;
    outline: none;
    background: transparent;
    color: var(--ink);
    font-family: var(--fd);
    font-size: 24px;
    font-weight: 700;
  }
  .ap-edit-input::placeholder {
    color: var(--mist);
    font-family: var(--fs);
    font-size: 13px;
    font-weight: 600;
  }
  .ap-edit-input-unit {
    height: 100%;
    min-width: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-left: 1px solid var(--cloud);
    color: var(--ash);
    font-size: 12px;
    font-weight: 800;
  }
  .ap-edit-actions {
    display: flex;
    gap: 10px;
  }
  .ap-edit-secondary,
  .ap-edit-save {
    min-height: 48px;
    border-radius: 12px;
    font-family: var(--fs);
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;
  }
  .ap-edit-secondary {
    flex: 0 0 auto;
    padding: 0 18px;
    border: 1.5px solid var(--cloud);
    background: var(--white);
    color: var(--ash);
  }
  .ap-edit-save {
    flex: 1;
    border: 0;
    background: var(--ink);
    color: var(--white);
    box-shadow: 0 4px 16px rgba(13,13,13,0.16);
  }
  .ap-edit-save:disabled {
    cursor: not-allowed;
    opacity: 0.48;
  }

  /* No gender */
  .ap-no-gender {
    display: flex; flex-direction: column; align-items: center; gap: 14px;
    background: var(--white); border: 1px solid var(--cloud);
    border-radius: 20px; padding: 72px 40px; text-align: center;
  }
  .ap-no-gender-icon { width: 64px; height: 64px; border-radius: 50%; background: rgba(192,57,43,0.07); display: flex; align-items: center; justify-content: center; }
  .ap-no-gender-icon svg { width: 28px; height: 28px; color: var(--red); }
  .ap-no-gender-title { font-family: var(--fd); font-size: 26px; font-weight: 700; color: var(--ink); }
  .ap-no-gender-sub { font-size: 14px; color: var(--ash); max-width: 320px; line-height: 1.65; }

  @media (max-width: 760px) {
    .ap-topbar {
      height: auto;
      min-height: 62px;
      padding: 10px 14px;
      gap: 8px;
    }
    .ap-topbar-divider {
      display: none;
    }
    .ap-topbar-back {
      padding: 8px 0;
    }
    .ap-topbar-title {
      margin-left: auto;
      font-size: 18px;
    }
    .ap-topbar-right {
      display: none;
    }
    .ap-progress-bar {
      top: 62px;
    }
    .ap-layout {
      grid-template-columns: 1fr;
      padding: 18px 16px calc(112px + env(safe-area-inset-bottom, 0px));
      gap: 22px;
    }
    .ap-sidebar {
      display: none;
    }
    .ap-main {
      gap: 18px;
    }
    .ap-page-header {
      margin-bottom: 18px !important;
    }
    .ap-page-title {
      font-size: 31px;
    }
    .ap-page-sub {
      font-size: 13px;
    }
    .ap-choice-grid {
      grid-template-columns: 1fr;
      gap: 10px;
    }
    .ap-choice-card {
      padding: 16px;
      border-radius: 14px;
    }
    .ap-guide-layout {
      grid-template-columns: 1fr;
      gap: 14px;
    }
    .ap-guide-cover {
      display: none;
    }
    .ap-guide-body {
      padding: 16px;
    }
    .ap-field-tabs {
      flex-wrap: nowrap;
      overflow-x: auto;
      margin-bottom: 14px;
      padding-bottom: 4px;
      scrollbar-width: none;
    }
    .ap-field-tabs::-webkit-scrollbar {
      display: none;
    }
    .ap-field-tab {
      flex: 0 0 auto;
    }
    .ap-text-input {
      height: 58px;
      font-size: 28px;
    }
    .ap-input-unit {
      height: 58px;
    }
    .ap-actions {
      position: sticky;
      bottom: calc(92px + env(safe-area-inset-bottom, 0px));
      z-index: 20;
      padding-top: 8px;
      background: var(--paper);
    }
    .ap-btn-back,
    .ap-btn-next {
      min-height: 46px;
      height: auto;
    }

    .ap-edit-simple {
      width: 100%;
      padding: 18px 14px calc(112px + env(safe-area-inset-bottom, 0px));
      gap: 14px;
    }
    .ap-edit-hero {
      align-items: flex-start;
      gap: 10px;
    }
    .ap-edit-title {
      font-size: 31px;
    }
    .ap-edit-sub {
      font-size: 12.5px;
      line-height: 1.5;
    }
    .ap-edit-unit {
      min-width: 50px;
      height: 34px;
      padding: 0 12px;
    }
    .ap-edit-card {
      border-radius: 14px;
    }
    .ap-edit-section-head {
      padding: 12px 13px 9px;
    }
    .ap-edit-section-note {
      display: none;
    }
    .ap-edit-field {
      grid-template-columns: 1fr;
      gap: 8px;
      padding: 11px 13px 12px;
    }
    .ap-edit-field-label {
      font-size: 12.5px;
    }
    .ap-edit-field-tip {
      display: none;
    }
    .ap-edit-input-wrap {
      height: 42px;
    }
    .ap-edit-input {
      font-size: 23px;
    }
    .ap-edit-actions {
      position: sticky;
      bottom: calc(92px + env(safe-area-inset-bottom, 0px));
      z-index: 20;
      padding-top: 8px;
      background: var(--paper);
    }
    .ap-edit-secondary {
      display: none;
    }
    .ap-edit-save {
      min-height: 48px;
    }

    .ap-gender-grid {
      grid-template-columns: 1fr;
      gap: 12px;
    }
    .ap-gender-card {
      flex-direction: row;
      align-items: center;
      min-height: auto;
      padding: 12px;
      border-radius: 18px;
      gap: 14px;
    }
    .ap-gender-image {
      width: 116px;
      height: 136px;
      border-radius: 15px;
      flex-shrink: 0;
    }
    .ap-gender-copy {
      flex: 1;
      min-width: 0;
      gap: 5px;
    }
    .ap-gender-card .ap-choice-card-title {
      font-size: 17px;
      margin-top: 0;
    }
    .ap-gender-card .ap-choice-card-sub {
      font-size: 12.5px;
      line-height: 1.45;
    }
    .ap-gender-card .ap-check-circle {
      position: static;
      width: 26px;
      height: 26px;
      margin-left: auto;
      flex-shrink: 0;
      order: 4;
    }
    .ap-btn-next {
      min-height: 48px;
      height: auto;
      padding: 12px 14px;
      line-height: 1.25;
      text-align: center;
      white-space: normal;
    }
  }

  /* Keyframes */
  @keyframes ap-fadeDown { from{opacity:0;transform:translateY(-14px)} to{opacity:1;transform:none} }
  @keyframes ap-fadeUp   { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:none} }
  @keyframes ap-slideInFwd  { from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:none} }
  @keyframes ap-slideInBack { from{opacity:0;transform:translateX(-24px)} to{opacity:1;transform:none} }
  @keyframes ap-shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
  @keyframes ap-spin  { to{transform:rotate(360deg)} }
  @keyframes ap-growBar { from{width:0} to{width:var(--w)} }
`;

const addPreferenceStyles = document.getElementById('ap-styles');
if (addPreferenceStyles) {
  addPreferenceStyles.textContent = CSS;
} else {
  const s = document.createElement('style');
  s.id = 'ap-styles';
  s.textContent = CSS;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────────
   Icons
───────────────────────────────────────────── */
const Ico = {
  Back:        () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M13 8H3M7 4l-4 4 4 4"/></svg>,
  Arrow:       () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg>,
  Check:       () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 8l3.5 3.5L13 5"/></svg>,
  User:        () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>,
  Ruler:       () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1" y="6" width="14" height="4" rx="1"/><path d="M4 6v2M7 6v3M10 6v2M13 6v3"/></svg>,
  Bag:         () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4h8l1 9H3L4 4z"/><path d="M6 4c0-1.1.9-2 2-2s2 .9 2 2"/></svg>,
  Bulb:        () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 2a4 4 0 014 4c0 1.7-.9 3.1-2 4v1H6v-1c-1.1-.9-2-2.3-2-4a4 4 0 014-4z"/><path d="M6 13h4"/></svg>,
  Alert:       () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="6"/><path d="M8 5v4M8 11v.5"/></svg>,
  CheckCircle: () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="6"/><path d="M5 8l2.5 2.5L11 6"/></svg>,
  Edit:        () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M11 2l3 3-8 8H3v-3L11 2z"/></svg>,
};

/* ─────────────────────────────────────────────
   Phase transition wrapper
───────────────────────────────────────────── */
function PhaseWrap({ phaseKey, dir, children }: { phaseKey: string; dir: 'fwd' | 'back'; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.animation = 'none';
    void el.offsetHeight;
    el.style.animation = dir === 'back'
      ? 'ap-slideInBack 0.3s var(--ease) both'
      : 'ap-slideInFwd  0.3s var(--ease) both';
  }, [phaseKey, dir]);
  return <div ref={ref}>{children}</div>;
}

function sanitizeMeasurementValues(values: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(values)
      .map(([key, value]) => [key, value.trim()] as const)
      .filter(([, value]) => value.length > 0)
  );
}

function inferGenderFromProfileKey(profileKey: string | null | undefined): CustomerGender | null {
  if (!profileKey) return null;
  if (profileKey.startsWith('men_')) return 'men';
  if (profileKey.startsWith('women_')) return 'women';
  return null;
}

function EditMeasurementSection({
  title,
  note,
  fields,
  measurements,
  unit,
  onChange,
}: {
  title: string;
  note: string;
  fields: MeasurementField[];
  measurements: Record<string, string>;
  unit: 'cm' | 'in';
  onChange: (key: string, value: string) => void;
}) {
  if (!fields.length) return null;

  return (
    <section className="ap-edit-section">
      <div className="ap-edit-section-head">
        <div className="ap-edit-section-title">{title}</div>
        <div className="ap-edit-section-note">{note}</div>
      </div>
      {fields.map(field => (
        <label className="ap-edit-field" key={field.key}>
          <div className="ap-edit-field-copy">
            <div className="ap-edit-field-label">
              {field.isPrimary && <span className="ap-edit-required-dot" aria-hidden="true" />}
              {field.label}
            </div>
            <div className="ap-edit-field-tip">{field.tip}</div>
          </div>
          <div className="ap-edit-input-wrap">
            <input
              className="ap-edit-input"
              inputMode="decimal"
              placeholder={field.isPrimary ? 'Required' : 'Optional'}
              value={measurements[field.key] ?? ''}
              onChange={event => onChange(field.key, event.target.value)}
            />
            <span className="ap-edit-input-unit">{unit}</span>
          </div>
        </label>
      ))}
    </section>
  );
}

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */
export function AddPreferencePage() {
  const navigate = useNavigate();
  const { user }  = useAuth();
  const { brandCount } = useCatalogSummary();
  const { selectedSubject, profilesLoading } = useProfileSubject();
  const [searchParams] = useSearchParams();
  const { profile } = useRecommendationData(user?.uid);

  const initialProfileKey = searchParams.get('profileKey');
  const isEditRequest = !!initialProfileKey;
  const initialChoice     = normalizeClothingChoice(searchParams.get('choice'));

  const [choice,       setChoice]       = useState<ClothingChoice | null>(initialChoice);
  const [measurements, setMeasurements] = useState<Record<string, string>>({});
  const [stepIndex,    setStepIndex]    = useState(0);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [errorKey,     setErrorKey]     = useState(0);
  const [dir,          setDir]          = useState<'fwd' | 'back'>('fwd');
  const [phase,        setPhase]        = useState<'choose' | 'guide'>(initialChoice ? 'guide' : 'choose');
  const [chosenGender, setChosenGender] = useState<CustomerGender | null>(null);
  const [measurementWarning, setMeasurementWarning] = useState<MeasurementValidationWarning | null>(null);
  const [pendingWarningAction, setPendingWarningAction] = useState<'advance' | 'save' | null>(null);
  const [acceptedWarnings, setAcceptedWarnings] = useState<Record<string, number>>({});
  const [hydratedEditKey, setHydratedEditKey] = useState<string | null>(null);

  const measurementProfiles = useMemo(
    () => (profile ? extractMeasurementProfiles(profile) : []),
    [profile]
  );
  const editingProfile = useMemo<CustomerMeasurementProfile | null>(() => {
    if (!initialProfileKey) return null;
    return measurementProfiles.find(e => e.profileKey === initialProfileKey) ?? null;
  }, [initialProfileKey, measurementProfiles]);

  const storedGender =
    normalizeGender(editingProfile?.gender) ??
    inferGenderFromProfileKey(editingProfile?.profileKey) ??
    normalizeGender(profile?.gender) ??
    null;
  const normalizedGender = chosenGender ?? storedGender;

  const options = useMemo(() => {
    const savedOptions = buildFallbackOptions(measurementProfiles);
    if (!normalizedGender) return savedOptions;
    const merged = new Map<string, (typeof savedOptions)[number]>();
    CLOTHING_OPTIONS_BY_GENDER[normalizedGender].forEach(o => merged.set(o.key, o));
    savedOptions.forEach(o => { if (!merged.has(o.key)) merged.set(o.key, o); });
    return Array.from(merged.values());
  }, [measurementProfiles, normalizedGender]);

  const template    = useMemo(() => getClothingTemplate(normalizedGender, choice), [choice, normalizedGender]);
  const currentStep = template?.fields[stepIndex] ?? null;
  const unit        = (profile?.unit as 'cm' | 'in') ?? 'cm';

  const subjectLabel  = selectedSubject?.type === 'family'
    ? `${selectedSubject.label} · ${selectedSubject.subtitle}` : 'your profile';
  const returnPath    = selectedSubject?.type === 'family' || isEditRequest ? '/app/measurements' : '/app/home';
  const returnLabel   = selectedSubject?.type === 'family' || isEditRequest ? 'Measurements' : 'Home';
  const requiresGenderStep = !storedGender;
  const isEditing = !!editingProfile;
  const editHydrationKey =
    isEditRequest && selectedSubject?.key && editingProfile
      ? `${selectedSubject.key}:${editingProfile.profileKey}`
      : null;
  const editFormReady =
    isEditRequest &&
    isEditing &&
    !!template &&
    !!editHydrationKey &&
    hydratedEditKey === editHydrationKey;
  const editIsLoading =
    isEditRequest &&
    (profilesLoading || (isEditing && !!editHydrationKey && hydratedEditKey !== editHydrationKey));

  useEffect(() => {
    if (!isEditRequest) return;
    setChoice(null);
    setMeasurements({});
    setStepIndex(0);
    setError(null);
    setMeasurementWarning(null);
    setPendingWarningAction(null);
    setAcceptedWarnings({});
    setHydratedEditKey(null);
    setPhase('guide');
  }, [initialProfileKey, isEditRequest]);

  useEffect(() => {
    if (!editingProfile || !editHydrationKey || hydratedEditKey === editHydrationKey) return;
    setChoice(editingProfile.preferredClothing);
    setMeasurements(Object.fromEntries(
      Object.entries(editingProfile.measurements).map(([k, v]) => [k, String(v)])
    ));
    setStepIndex(0);
    setError(null);
    setMeasurementWarning(null);
    setPendingWarningAction(null);
    setAcceptedWarnings({});
    setPhase('guide');
    setHydratedEditKey(editHydrationKey);
  }, [editingProfile, editHydrationKey, hydratedEditKey]);

  useEffect(() => { setChosenGender(storedGender ?? null); }, [selectedSubject?.key, storedGender]);

  useEffect(() => {
    if (isEditRequest) return;
    setChoice(initialChoice); setMeasurements({}); setStepIndex(0); setError(null);
    setMeasurementWarning(null); setPendingWarningAction(null); setAcceptedWarnings({});
    setPhase(initialChoice ? 'guide' : 'choose');
  }, [initialChoice, selectedSubject?.key, isEditRequest]);

  const showError = (msg: string) => { setError(msg); setErrorKey(k => k + 1); };

  const goStep = (direction: 'fwd' | 'back', fn: () => void) => {
    setDir(direction); setError(null); fn();
  };

  const persistMeasurements = async (measurementValues: Record<string, string>) => {
    if (!user || !template || !choice || !normalizedGender) return;
    const cleanedMeasurements = sanitizeMeasurementValues(measurementValues);
    const preferredClothingLabel =
      options.find(o => o.key === choice)?.label ?? template.label;
    const measurementPayload = {
      gender: normalizedGender, preferredClothing: choice, preferredClothingLabel,
      measurementProfileKey: editingProfile?.profileKey ?? template.profileKey,
      unit, measurements: cleanedMeasurements,
      primaryMeasurementKeys: template.fields.filter(f => f.isPrimary).map(f => f.key),
      measurementDisplayNames: Object.fromEntries(template.fields.map(f => [f.key, f.label])),
      setAsActive: true,
    };

    if (selectedSubject?.type === 'family') {
      await saveFamilyMemberMeasurementProfile({ ownerUid: user.uid, familyMemberId: selectedSubject.id, ...measurementPayload });
    } else {
      await saveCustomerMeasurementProfile({ uid: user.uid, ...measurementPayload });
    }
    navigate(returnPath);
  };

  const saveAfterValidation = async (measurementValues: Record<string, string>) => {
    try {
      setSaving(true); setError(null);
      await persistMeasurements(measurementValues);
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Unable to save measurements.');
    } finally {
      setSaving(false);
    }
  };

  const firstUnacceptedWarning = (warnings: MeasurementValidationWarning[]) =>
    warnings.find(warning => acceptedWarnings[warning.field] !== warning.enteredValue);

  const handleNextStep = async () => {
    if (!currentStep) return;
    const rawValue = measurements[currentStep.key] ?? '';
    const parsedValue = Number.parseFloat(rawValue);
    if (currentStep.isPrimary && (!Number.isFinite(parsedValue) || parsedValue <= 0)) {
      showError(`${currentStep.label} is required.`);
      return;
    }

    if (rawValue.trim()) {
      try {
        setSaving(true); setError(null);
        const validation = await validateMeasurements({
          unit,
          measurements: { [currentStep.key]: rawValue },
        });
        const warning = firstUnacceptedWarning(validation.warnings);
        if (warning) {
          setMeasurementWarning(warning);
          setPendingWarningAction('advance');
          return;
        }
      } catch (e) {
        showError(e instanceof Error ? e.message : 'Unable to validate this measurement.');
        return;
      } finally {
        setSaving(false);
      }
    }

    goStep('fwd', () => setStepIndex(i => i + 1));
  };

  const handleSave = async () => {
    if (!user || !template || !choice || !normalizedGender) return;
    const cleanedMeasurements = sanitizeMeasurementValues(measurements);
    const primaryKeys = template.fields.filter(f => f.isPrimary).map(f => f.key);
    for (const key of primaryKeys) {
      const p = Number.parseFloat(cleanedMeasurements[key] ?? '');
      if (!Number.isFinite(p) || p <= 0) { showError(`${DEFAULT_MEASUREMENT_LABELS[key]} is required.`); return; }
    }
    try {
      setSaving(true); setError(null);
      const validation = await validateMeasurements({ unit, measurements: cleanedMeasurements });
      const warning = firstUnacceptedWarning(validation.warnings);
      if (warning) {
        setMeasurementWarning(warning);
        setPendingWarningAction('save');
        return;
      }
      await persistMeasurements(cleanedMeasurements);
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Unable to save measurements.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Sidebar step list ── */
  const totalFields = template?.fields.length ?? 0;
  const progressPct = totalFields > 0 ? ((stepIndex) / totalFields) * 100 : 0;

  const sidebarSteps = [
    ...(requiresGenderStep ? [{ key: 'gender', label: 'Sizing model', sub: storedGender ? normalizedGender ?? '' : "Choose men's or women's" }] : []),
    { key: 'choose', label: 'Category', sub: choice ? options.find(o => o.key === choice)?.label ?? choice : 'Pick clothing type' },
    ...(template?.fields.map((f, i) => ({
      key: f.key,
      label: f.label,
      sub: measurements[f.key] ? `${measurements[f.key]} ${unit}` : (f.isPrimary ? 'Required' : 'Optional'),
    })) ?? []),
  ];

  const getCurrentSidebarIndex = () => {
    if (!normalizedGender && requiresGenderStep) return 0;
    if (phase === 'choose') return requiresGenderStep ? 1 : 0;
    return (requiresGenderStep ? 2 : 1) + stepIndex;
  };
  const currentSidebarIdx = getCurrentSidebarIndex();

  const filledMeasurements = template?.fields.slice(0, stepIndex).filter(f => measurements[f.key]) ?? [];

  return (
    <div className="ap-root">

      {/* ── Topbar ── */}
      <div className="ap-topbar">
        <button className="ap-topbar-back" onClick={() => navigate(returnPath)}>
          {returnLabel}
        </button>
        <div className="ap-topbar-divider" />
        <span className="ap-topbar-title">
          {isEditRequest ? 'Edit measurements' : 'Add preference'}
        </span>

        {/* Step indicators */}
        {!isEditRequest && (
        <div className="ap-topbar-right">
          <div className="ap-step-track">
            {requiresGenderStep && (
              <>
                <div className={`ap-step-item${!normalizedGender ? ' active' : ' done'}`}>
                  <div className="ap-step-num">
                    {normalizedGender ? <Ico.Check /> : '1'}
                  </div>
                  <span>Model</span>
                </div>
                <div className={`ap-step-connector${normalizedGender ? ' done' : ''}`}/>
              </>
            )}
            <div className={`ap-step-item${phase === 'choose' && normalizedGender ? ' active' : phase === 'guide' ? ' done' : ''}`}>
              <div className="ap-step-num">
                {phase === 'guide' ? <Ico.Check /> : requiresGenderStep ? '2' : '1'}
              </div>
              <span>Category</span>
            </div>
            <div className={`ap-step-connector${phase === 'guide' ? ' done' : ''}`}/>
            <div className={`ap-step-item${phase === 'guide' ? ' active' : ''}`}>
              <div className="ap-step-num">{requiresGenderStep ? '3' : '2'}</div>
              <span>Measure</span>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Progress bar */}
      {!isEditRequest && phase === 'guide' && totalFields > 0 && (
        <div className="ap-progress-bar">
          <div className="ap-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      )}

      {isEditRequest ? (
        <div className="ap-edit-simple">
          {editFormReady ? (
            <>
              <div className="ap-edit-hero">
                <div>
                  <div className="ap-edit-eyebrow">Quick edit</div>
                  <h1 className="ap-edit-title">
                    Edit <em>{editingProfile?.preferredClothingLabel ?? template.label}</em>
                  </h1>
                  <p className="ap-edit-sub">
                    Update any saved value directly. Required fields keep recommendations working; optional fields improve fit accuracy.
                  </p>
                </div>
                <div className="ap-edit-unit">{unit}</div>
              </div>

              <div className="ap-edit-card">
                <EditMeasurementSection
                  title="Required"
                  note="Needed for recommendations"
                  fields={template.fields.filter(field => field.isPrimary)}
                  measurements={measurements}
                  unit={unit}
                  onChange={(key, value) => setMeasurements(current => ({ ...current, [key]: value }))}
                />
                <EditMeasurementSection
                  title="Improve accuracy"
                  note="Optional"
                  fields={template.fields.filter(field => !field.isPrimary)}
                  measurements={measurements}
                  unit={unit}
                  onChange={(key, value) => setMeasurements(current => ({ ...current, [key]: value }))}
                />
              </div>

              {error && (
                <div className="ap-error" key={errorKey} style={{ animation: 'ap-shake 0.4s var(--ease)' }}>
                  <Ico.Alert /> {error}
                </div>
              )}

              <div className="ap-edit-actions">
                <button className="ap-edit-secondary" type="button" onClick={() => navigate(returnPath)}>
                  Cancel
                </button>
                <button className="ap-edit-save" type="button" disabled={saving} onClick={handleSave}>
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </>
          ) : (
            <div className="ap-no-gender">
              <div className="ap-no-gender-icon"><Ico.Ruler /></div>
              <div className="ap-no-gender-title">
                {editIsLoading
                  ? 'Loading measurements'
                  : isEditing && !template
                    ? 'Cannot edit this category'
                    : 'Measurement profile not found'}
              </div>
              <div className="ap-no-gender-sub">
                {editIsLoading
                  ? 'Getting your saved measurements ready.'
                  : isEditing && !template
                    ? 'This saved category is missing sizing information. Add the category again to refresh it.'
                  : 'This profile may have been removed or is unavailable for the selected person.'}
              </div>
              {!editIsLoading && (
                <button className="ap-btn-next" type="button" onClick={() => navigate('/app/measurements')}>
                  Go to measurements
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
      <>
        {/* ── Two-column layout ── */}
        <div className="ap-layout">

        {/* ── LEFT SIDEBAR ── */}
        <aside className="ap-sidebar">

          {/* Context card */}
          <div className="ap-ctx-card">
            <div className="ap-ctx-glow" />
            <div className="ap-ctx-eyebrow">For {subjectLabel}</div>
            <div className="ap-ctx-title">
              {isEditing ? <>Editing <em>{editingProfile?.preferredClothingLabel}</em></> : <>Add your <em>measurements</em></>}
            </div>
            <div className="ap-ctx-sub">
              {isEditing
                ? 'Update your measurements below. Changes apply to all brand recommendations.'
                : `Enter your measurements to unlock size recommendations across ${brandCount} active brands.`}
            </div>
          </div>

          {/* Step list */}
          <div className="ap-sidebar-steps">
            {sidebarSteps.map((step, i) => {
              const isDone   = i < currentSidebarIdx;
              const isActive = i === currentSidebarIdx;
              return (
                <div key={step.key} className={`ap-sidebar-step${isDone ? ' done' : isActive ? ' active' : ''}`}>
                  <div className="ap-sidebar-step-num">
                    {isDone ? <Ico.Check /> : i + 1}
                  </div>
                  <div className="ap-sidebar-step-body">
                    <div className="ap-sidebar-step-label">{step.label}</div>
                    <div className="ap-sidebar-step-sub">{step.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Measurements so far (only during guide) */}
          {phase === 'guide' && filledMeasurements.length > 0 && (
            <div className="ap-sidebar-meas">
              <div className="ap-sidebar-meas-header">Entered so far</div>
              {filledMeasurements.map(f => {
                const val = parseFloat(measurements[f.key] ?? '0') || 0;
                const pct = Math.min((val / 150) * 100, 100);
                return (
                  <div key={f.key} className="ap-sidebar-meas-row">
                    <span className="ap-sidebar-meas-key">{f.label}</span>
                    <div className="ap-sidebar-bar-track">
                      <div className="ap-sidebar-bar-fill" style={{ '--w': `${pct}%`, width: `${pct}%` } as any} />
                    </div>
                    <span className="ap-sidebar-meas-val">{measurements[f.key]} {unit}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tip */}
          <div className="ap-tip-card">
            <div className="ap-tip-icon"><Ico.Bulb /></div>
            <div>
              <div className="ap-tip-title">
                {phase === 'guide' ? 'Measuring tip' : 'Why measurements?'}
              </div>
              <div className="ap-tip-sub">
                {phase === 'guide' && currentStep
                  ? (currentStep.tip ?? 'Measure over light clothing, standing upright.')
                  : 'Accurate measurements ensure you always get the right size, across every brand.'}
              </div>
            </div>
          </div>
        </aside>

        {/* ── RIGHT MAIN ── */}
        <main className="ap-main">

          {/* Gender phase */}
          {!normalizedGender && (
            <PhaseWrap phaseKey="gender" dir={dir}>
              <div className="ap-page-header" style={{ marginBottom: 28 }}>
                <div className="ap-page-eyebrow"><div className="ap-page-eyebrow-line"/>Sizing model</div>
                <h1 className="ap-page-title">Choose a <em>sizing model</em></h1>
                <p className="ap-page-sub">Pick the fit guide for {subjectLabel}. This is only needed once before adding clothing measurements.</p>
              </div>

              <div className="ap-choice-grid ap-gender-grid">
                {([
                  { value: 'men' as CustomerGender, title: "Men's sizing", subtitle: 'Shirts, T-shirts, trousers and shorts', image: manImage },
                  { value: 'women' as CustomerGender, title: "Women's sizing", subtitle: 'Blouses, dresses, trousers and shorts', image: womenImage },
                ]).map(opt => (
                  <button
                    type="button"
                    key={opt.value}
                    className={`ap-choice-card ap-gender-card${chosenGender === opt.value ? ' selected' : ''}`}
                    aria-pressed={chosenGender === opt.value}
                    onClick={() => setChosenGender(opt.value)}>
                    <div className="ap-check-circle"><Ico.Check /></div>
                    <div className="ap-gender-image">
                      <img src={opt.image} alt="" aria-hidden="true" />
                    </div>
                    <div className="ap-gender-copy">
                      <div className="ap-choice-card-title">{opt.title}</div>
                      <div className="ap-choice-card-sub">{opt.subtitle}</div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="ap-actions" style={{ marginTop: 8 }}>
                <button className="ap-btn-next" disabled={!chosenGender}
                  onClick={() => goStep('fwd', () => { setStepIndex(0); setPhase(choice ? 'guide' : 'choose'); })}>
                  {chosenGender === 'men' ? "Continue with men's sizing" : chosenGender === 'women' ? "Continue with women's sizing" : 'Choose a sizing model'} <Ico.Arrow />
                </button>
              </div>
            </PhaseWrap>
          )}

          {/* Choose phase */}
          {normalizedGender && phase === 'choose' && (
            <PhaseWrap phaseKey="choose" dir={dir}>
              {isEditing && (
                <div className="ap-edit-banner" style={{ marginBottom: 24 }}>
                  <div className="ap-edit-banner-icon"><Ico.Edit /></div>
                  <div>
                    <div className="ap-edit-banner-label">Editing</div>
                    <div className="ap-edit-banner-value">{editingProfile?.preferredClothingLabel}</div>
                  </div>
                </div>
              )}

              <div className="ap-page-header" style={{ marginBottom: 28 }}>
                <div className="ap-page-eyebrow"><div className="ap-page-eyebrow-line"/>Category</div>
                <h1 className="ap-page-title">What are you <em>shopping for?</em></h1>
                <p className="ap-page-sub">Choose a clothing category to add measurements for {subjectLabel}. You can add more categories later.</p>
              </div>

              <div className="ap-choice-grid">
                {options.map(opt => (
                  <div
                    key={opt.key}
                    className={`ap-choice-card${choice === opt.key ? ' selected' : ''}`}
                    onClick={() => setChoice(opt.key)}>
                    <div className="ap-check-circle"><Ico.Check /></div>
                    <div className="ap-choice-icon"><Ico.Bag /></div>
                    <div className="ap-choice-card-title">{opt.label}</div>
                    {opt.subtitle && <div className="ap-choice-card-sub">{opt.subtitle}</div>}
                  </div>
                ))}
              </div>

              <div className="ap-actions" style={{ marginTop: 8 }}>
                {requiresGenderStep && (
                  <button className="ap-btn-back" onClick={() => goStep('back', () => setChosenGender(null))}>
                    Change model
                  </button>
                )}
                <button className="ap-btn-next" disabled={!choice}
                  onClick={() => goStep('fwd', () => { setStepIndex(0); setPhase('guide'); })}>
                  Continue <Ico.Arrow />
                </button>
              </div>
            </PhaseWrap>
          )}

          {/* Guide phase */}
          {normalizedGender && phase === 'guide' && template && currentStep && (
            <PhaseWrap phaseKey={`guide-${stepIndex}`} dir={dir}>

              <div className="ap-page-header" style={{ marginBottom: 24 }}>
                <div className="ap-page-eyebrow">
                  <div className="ap-page-eyebrow-line"/>
                  {template.label} · {stepIndex + 1} of {template.fields.length}
                </div>
                <h1 className="ap-page-title">
                  Measure <em>{currentStep.label.toLowerCase()}</em>
                </h1>
              </div>

              {/* Sub-step tabs */}
              <div className="ap-field-tabs">
                {template.fields.map((f, i) => {
                  const isDone   = i < stepIndex;
                  const isActive = i === stepIndex;
                  return (
                    <div
                      key={f.key}
                      className={`ap-field-tab${isDone ? ' done' : isActive ? ' active' : ''}`}>
                      {isDone && <Ico.Check />}
                      {f.label}
                      {!isDone && !isActive && <div className="ap-field-tab-dot" />}
                    </div>
                  );
                })}
              </div>

              {/* Two-column: guide card + input */}
              <div className="ap-guide-layout">

                {/* Guide card */}
                <div className="ap-guide-card">
                  <div className="ap-guide-cover">
                    <div className="ap-guide-cover-glow"/>
                    <div className="ap-guide-cover-grid"/>
                    <div className="ap-guide-cover-badge">
                      <div className={`ap-guide-cover-tag ${currentStep.isPrimary ? 'required' : 'optional'}`}>
                        {currentStep.isPrimary ? '★ Required' : 'Optional'}
                      </div>
                    </div>
                  </div>
                  <div className="ap-guide-body">
                    <div className="ap-guide-step-label">{template.label} measurement</div>
                    <div className="ap-guide-title">{currentStep.label}</div>
                    <div className="ap-guide-desc">{currentStep.body}</div>
                    {currentStep.tip && (
                      <div className="ap-guide-tip">
                        <Ico.Bulb /> {currentStep.tip}
                      </div>
                    )}
                  </div>
                </div>

                {/* Input + reference */}
                <div className="ap-input-panel">
                  <div className="ap-field-label">
                    Enter {currentStep.label.toLowerCase()}
                    <span className={`ap-field-badge ${currentStep.isPrimary ? 'required' : 'optional'}`}>
                      {currentStep.isPrimary ? 'Required' : 'Optional'}
                    </span>
                  </div>

                  <div className={`ap-input-wrap${error ? ' error' : ''}`}>
                    <input
                      className="ap-text-input"
                      inputMode="decimal"
                      placeholder="0.0"
                      value={measurements[currentStep.key] ?? ''}
                      onChange={e => setMeasurements(m => ({ ...m, [currentStep.key]: e.target.value }))}
                      key={currentStep.key}
                      autoFocus
                    />
                    <div className="ap-input-unit">{unit}</div>
                  </div>

                  {/* Previously filled tiles */}
                  {stepIndex > 0 && (
                    <div className="ap-ref-grid">
                      {template.fields.slice(0, stepIndex).map(f => (
                        <div key={f.key} className={`ap-ref-tile${measurements[f.key] ? ' filled' : ''}`}>
                          <div className="ap-ref-tile-key">{f.label}</div>
                          <div className="ap-ref-tile-val">{measurements[f.key] || '—'}</div>
                          <div className="ap-ref-tile-unit">{measurements[f.key] ? unit : ''}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Error */}
                  {error && (
                    <div className="ap-error" key={errorKey} style={{ animation: 'ap-shake 0.4s var(--ease)' }}>
                      <Ico.Alert /> {error}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="ap-actions" style={{ marginTop: 8 }}>
                <button className="ap-btn-back"
                  onClick={() => goStep('back', () => {
                    if (stepIndex === 0) setPhase('choose');
                    else setStepIndex(i => i - 1);
                  })}>
                  {stepIndex === 0 ? 'Change type' : 'Previous'}
                </button>

                {stepIndex === template.fields.length - 1 ? (
                  <button className="ap-btn-next success" disabled={saving} onClick={handleSave}>
                    {saving ? <><div className="ap-spinner"/>Saving…</> : <><Ico.CheckCircle />Save preference</>}
                  </button>
                ) : (
                  <button className="ap-btn-next" disabled={saving} onClick={handleNextStep}>
                    {saving ? <><div className="ap-spinner"/>Checking…</> : <>Next step <Ico.Arrow /></>}
                  </button>
                )}
              </div>

            </PhaseWrap>
          )}

        </main>
      </div>
      </>
      )}

      <MeasurementValidationDialog
        warning={measurementWarning}
        onEditValue={() => {
          setMeasurementWarning(null);
          setPendingWarningAction(null);
        }}
        onKeepEnteredValue={() => {
          const warning = measurementWarning;
          const action = pendingWarningAction;
          if (!warning || !action) return;
          setAcceptedWarnings(current => ({
            ...current,
            [warning.field]: warning.enteredValue,
          }));
          setMeasurementWarning(null);
          setPendingWarningAction(null);
          if (action === 'advance') {
            goStep('fwd', () => setStepIndex(i => i + 1));
          } else {
            void saveAfterValidation(measurements);
          }
        }}
        onUseSuggestedValue={() => {
          const warning = measurementWarning;
          const action = pendingWarningAction;
          if (!warning || !action) return;
          const correctedMeasurements = {
            ...measurements,
            [warning.field]: String(warning.suggestedValue),
          };
          setMeasurements(correctedMeasurements);
          setAcceptedWarnings(current => {
            const next = { ...current };
            delete next[warning.field];
            return next;
          });
          setMeasurementWarning(null);
          setPendingWarningAction(null);
          if (action === 'advance') {
            goStep('fwd', () => setStepIndex(i => i + 1));
          } else {
            void saveAfterValidation(correctedMeasurements);
          }
        }}
      />
    </div>
  );
}

export default AddPreferencePage;
