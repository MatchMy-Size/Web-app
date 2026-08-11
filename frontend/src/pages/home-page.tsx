import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/context/auth-context';
import rulerIcon from '@/assets/images/ruler.png';
import {
  submitFitFeedback,
  type FitExperience,
  type FitOutcome,
} from '@/lib/fit-feedback';
import { getClothingTemplate, normalizeGender } from '@/lib/measurement';
import { resolveBrandDisplay, type EnrichedRecommendation } from '@/lib/recommendation-view';
import { submitSiteFeedback } from '@/lib/site-feedback';
import type { BrandRecommendation } from '@/lib/size-recommendation';
import { getCategoryBadge, useRecommendationData } from '@/lib/use-recommendation-data';

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

  .hp-root {
    min-height: 100%;
    width: 100%;
    margin-left: 0;
    font-family: var(--fs);
    background: var(--paper);
    overflow-x: hidden;
  }

  /* ══════════════════════════════════
     LEFT SIDEBAR NAV
  ══════════════════════════════════ */
  .hp-nav {
    position: fixed; top: 0; left: 0; bottom: 0;
    width: var(--nav-w);
    background: var(--white);
    border-right: 1px solid var(--cloud);
    display: flex; flex-direction: column;
    padding: 28px 20px;
    z-index: 50;
    animation: hp-fadeRight 0.5s var(--ease) both;
  }

  .hp-nav-brand {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 40px; text-decoration: none;
  }
  .hp-nav-brand-mark {
    width: 34px; height: 34px; border-radius: 9px;
    background: var(--ink);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .hp-nav-brand-name {
    font-family: var(--fd); font-size: 18px; font-weight: 600;
    color: var(--ink); letter-spacing: -0.3px;
  }

  .hp-nav-section-label {
    font-size: 10px; font-weight: 700; color: var(--mist);
    letter-spacing: 1px; text-transform: uppercase;
    padding: 0 10px; margin-bottom: 6px;
  }

  .hp-nav-links {
    display: flex; flex-direction: column; gap: 2px;
    margin-bottom: 32px;
  }

  .hp-nav-link {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; border-radius: 10px;
    font-size: 13.5px; font-weight: 500; color: var(--ash);
    text-decoration: none; cursor: pointer;
    background: none; border: none; font-family: var(--fs);
    transition: all 0.15s; text-align: left; width: 100%;
  }
  .hp-nav-link:hover { background: var(--paper); color: var(--ink); }
  .hp-nav-link.is-active {
    background: var(--ink); color: var(--white);
  }
  .hp-nav-link.is-active svg { color: var(--white); }
  .hp-nav-link svg { width: 16px; height: 16px; flex-shrink: 0; }
  .hp-nav-link-badge {
    margin-left: auto; background: var(--sage-light);
    border-radius: 999px; padding: 1px 7px;
    font-size: 10px; font-weight: 700; color: var(--sage-deep);
  }
  .hp-nav-link.is-active .hp-nav-link-badge {
    background: rgba(255,255,255,0.15); color: rgba(255,255,255,0.8);
  }

  .hp-nav-spacer { flex: 1; }

  .hp-nav-user {
    display: flex; align-items: center; gap: 10px;
    padding: 12px;
    background: var(--paper); border-radius: 12px;
    border: 1px solid var(--cloud);
    margin-top: 8px;
  }
  .hp-nav-avatar {
    width: 34px; height: 34px; border-radius: 50%;
    background: var(--ink); display: flex; align-items: center; justify-content: center;
    font-family: var(--fd); font-size: 14px; font-weight: 700; color: var(--white);
    flex-shrink: 0;
  }
  .hp-nav-user-name { font-size: 13px; font-weight: 600; color: var(--ink); }
  .hp-nav-user-role { font-size: 11px; color: var(--ash); }
  .hp-nav-settings-btn {
    margin-left: auto; width: 28px; height: 28px; border-radius: 7px;
    background: none; border: 1px solid var(--cloud);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: var(--ash); transition: all 0.15s;
    flex-shrink: 0;
  }
  .hp-nav-settings-btn:hover { background: var(--cloud); color: var(--ink); }
  .hp-nav-settings-btn svg { width: 13px; height: 13px; }

  /* ══════════════════════════════════
     MAIN CONTENT
  ══════════════════════════════════ */
  .hp-main {
    margin-left: 0;
    width: 100%;
    min-width: 0;
    min-height: 100%;
    display: flex; flex-direction: column;
  }

  /* ── Topbar ── */
  .hp-topbar {
    position: sticky; top: var(--nav-h, 64px); z-index: 40;
    background: rgba(250,250,248,0.92);
    backdrop-filter: blur(14px);
    border-bottom: 1px solid var(--cloud);
    padding: 0 40px;
    height: 64px;
    display: flex; align-items: center; gap: 20px;
    animation: hp-fadeDown 0.5s var(--ease) both;
  }

  .hp-topbar-heading {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }

  .hp-topbar-title {
    font-family: var(--fd); font-size: 22px; font-weight: 700;
    color: var(--ink); letter-spacing: -0.4px;
  }
  .hp-topbar-sub {
    font-size: 13px; color: var(--ash);
    display: none;
  }

  .hp-search-wrap {
    flex: 1; max-width: 420px;
    display: flex; align-items: center; gap: 10px;
    background: var(--white);
    border: 1.5px solid var(--cloud);
    border-radius: 10px; padding: 0 14px;
    height: 40px;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .hp-search-wrap:focus-within {
    border-color: var(--ink);
    box-shadow: 0 0 0 3px rgba(13,13,13,0.05);
  }
  .hp-search-wrap svg { width: 15px; height: 15px; color: var(--ash); flex-shrink: 0; }
  .hp-search-input {
    flex: 1; border: none; outline: none; background: transparent;
    font-family: var(--fs); font-size: 13.5px; color: var(--ink);
  }
  .hp-search-input::placeholder { color: var(--mist); }

  .hp-topbar-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
  .hp-icon-btn {
    width: 36px; height: 36px; border-radius: 9px;
    background: none; border: 1.5px solid var(--cloud);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: var(--ash);
    transition: all 0.15s; position: relative;
  }
  .hp-icon-btn:hover { background: var(--cloud); color: var(--ink); border-color: var(--mist); }
  .hp-icon-btn svg { width: 15px; height: 15px; }
  .hp-notif-dot {
    position: absolute; top: 6px; right: 6px;
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--sage-deep); border: 1.5px solid var(--paper);
  }

  .hp-add-btn {
    display: flex; align-items: center; gap: 6px;
    font-family: var(--fs); font-size: 13px; font-weight: 600;
    color: var(--white); background: var(--ink);
    border: none; border-radius: 9px;
    padding: 0 16px; height: 36px; cursor: pointer;
    transition: opacity 0.2s, transform 0.15s;
    white-space: nowrap;
  }
  .hp-add-btn:hover { opacity: 0.85; transform: translateY(-1px); }
  .hp-add-btn svg { width: 14px; height: 14px; }

  /* ── Page body ── */
  .hp-body { flex: 1; padding: 32px 40px 64px; display: flex; flex-direction: column; gap: 28px; }

  /* ── Stats row ── */
  .hp-stats-row {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    animation: hp-fadeUp 0.5s 0.1s var(--ease) both;
  }
  .hp-stat-card {
    background: var(--white); border: 1px solid var(--cloud);
    border-radius: 14px; padding: 20px 22px;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .hp-stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.06); }
  .hp-stat-card.accent { background: var(--ink); border-color: var(--ink); }
  .hp-stat-label { font-size: 11px; font-weight: 600; color: var(--ash); letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 8px; }
  .hp-stat-card.accent .hp-stat-label { color: rgba(255,255,255,0.45); }
  .hp-stat-num { font-family: var(--fd); font-size: 32px; font-weight: 700; color: var(--ink); letter-spacing: -0.8px; line-height: 1; }
  .hp-stat-card.accent .hp-stat-num { color: var(--white); }
  .hp-stat-num span { color: var(--sage-deep); }
  .hp-stat-card.accent .hp-stat-num span { color: var(--sage); }
  .hp-stat-sub { font-size: 12px; color: var(--ash); margin-top: 4px; }
  .hp-stat-card.accent .hp-stat-sub { color: rgba(255,255,255,0.35); }

  /* ── Filter bar ── */
  .hp-filter-bar {
    display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
    animation: hp-fadeUp 0.5s 0.18s var(--ease) both;
  }
  .hp-mobile-summary { display: contents; }
  .hp-filter-section {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }
  .hp-filter-label {
    font-size: 11px; font-weight: 700; color: var(--ash);
    text-transform: uppercase; letter-spacing: 0.6px; white-space: nowrap;
  }

  .hp-pill-group { display: flex; gap: 6px; flex-wrap: wrap; }
  .hp-pill {
    font-family: var(--fs); font-size: 12.5px; font-weight: 600;
    padding: 7px 14px; border-radius: 999px;
    border: 1.5px solid var(--cloud);
    background: var(--white); color: var(--ash);
    cursor: pointer; transition: all 0.18s;
    display: flex; align-items: center; gap: 5px;
    white-space: nowrap;
  }
  .hp-pill:hover { border-color: var(--mist); color: var(--ink); }
  .hp-pill.is-active {
    background: var(--ink); border-color: var(--ink); color: var(--white);
  }
  .hp-pill.is-add {
    border-style: dashed; color: var(--sage-deep);
    border-color: var(--sage-dark); background: var(--sage-light);
  }
  .hp-pill.is-add:hover { background: var(--sage); }
  .hp-pill-count {
    background: rgba(255,255,255,0.2); border-radius: 999px;
    padding: 0 6px; font-size: 10px; font-weight: 800;
    min-width: 18px; text-align: center;
  }
  .hp-pill:not(.is-active) .hp-pill-count {
    background: var(--cloud); color: var(--ash);
  }

  .hp-filter-divider { width: 1px; height: 24px; background: var(--cloud); }

  .hp-measurement-prompt {
    display: flex; align-items: center; gap: 14px;
    padding: 15px 18px;
    border: 1px solid var(--sage-dark); border-radius: 14px;
    background: var(--sage-light);
    animation: hp-fadeUp 0.5s 0.22s var(--ease) both;
  }
  .hp-measurement-prompt-icon {
    width: 34px; height: 34px; flex: 0 0 auto;
    display: grid; place-items: center;
    color: var(--sage-deep); background: rgba(255,255,255,0.6); border-radius: 10px;
  }
  .hp-measurement-prompt-icon svg { width: 18px; height: 18px; }
  .hp-measurement-prompt-copy { min-width: 0; }
  .hp-measurement-prompt-title { color: var(--ink); font-size: 13px; font-weight: 700; }
  .hp-measurement-prompt-sub { margin-top: 2px; color: var(--ash); font-size: 12px; line-height: 1.45; }
  .hp-measurement-prompt-btn {
    flex: 0 0 auto; margin-left: auto; padding: 8px 12px;
    border: 1px solid var(--sage-dark); border-radius: 9px;
    color: var(--sage-deep); background: var(--white);
    font-family: var(--fs); font-size: 12px; font-weight: 700; cursor: pointer;
  }
  .hp-measurement-prompt-btn:hover { background: var(--paper); }

  /* ── Section header ── */
  .hp-section-header {
    display: flex; align-items: flex-end; justify-content: space-between; gap: 16px;
  }

  .hp-section-heading {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  .hp-section-title-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
  }

  .hp-section-title {
    font-family: var(--fd); font-size: 26px; font-weight: 700;
    color: var(--ink); letter-spacing: -0.5px;
  }
  .hp-section-sub { font-size: 13px; color: var(--ash); }
  .hp-section-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 12px; color: var(--ash);
    background: var(--cloud); border-radius: 999px;
    padding: 3px 10px; min-width: 36px; font-weight: 600;
  }

  /* ── Product grid ── */
  .hp-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 20px;
    animation: hp-fadeUp 0.5s 0.28s var(--ease) both;
  }

  .hp-product-card {
    background: var(--white); border: 1px solid var(--cloud);
    border-radius: 18px; overflow: hidden;
    transition: transform 0.22s var(--ease), box-shadow 0.22s;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    min-width: 0;
    padding: 0;
    color: inherit;
    font: inherit;
    text-align: left;
  }
  .hp-product-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 16px 48px rgba(0,0,0,0.09);
  }
  .hp-product-card:focus-visible {
    outline: 3px solid rgba(122,158,120,0.34);
    outline-offset: 4px;
    border-color: var(--sage-deep);
  }

  .hp-card-image {
    width: 100%; aspect-ratio: 4/3;
    background: var(--paper);
    display: flex; align-items: center; justify-content: center;
    position: relative; overflow: hidden;
  }
  .hp-card-image-placeholder {
    font-size: 40px; opacity: 0.25;
  }
  .hp-card-image img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: 12px;
  }
  .hp-card-score-badge {
    position: absolute; top: 10px; right: 10px;
    border-radius: 999px; padding: 4px 10px;
    font-size: 11px; font-weight: 800;
    display: flex; align-items: center; gap: 4px;
  }
  .hp-card-score-badge.perfect { background: var(--ink); color: var(--white); }
  .hp-card-score-badge.great   { background: var(--sage-light); color: var(--sage-deep); border: 1px solid var(--sage-dark); }
  .hp-card-score-badge.fair    { background: var(--cloud); color: var(--ash); }
  .hp-card-score-badge.unavailable { background: var(--cloud); color: var(--ash); }

  .hp-card-body {
    padding: 16px 18px 18px;
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 160px;
  }
  .hp-card-brand { font-size: 11px; font-weight: 700; color: var(--ash); letter-spacing: 0.4px; text-transform: uppercase; margin-bottom: 4px; }
  .hp-card-title { font-size: 14px; font-weight: 600; color: var(--ink); margin-bottom: 6px; line-height: 1.35; }
  .hp-card-sub { font-size: 12px; color: var(--ash); margin-bottom: 12px; }

  .hp-card-footer {
    display: flex; align-items: center; justify-content: space-between;
    padding-top: 12px; border-top: 1px solid var(--cloud);
    gap: 12px;
    margin-top: auto;
  }
  .hp-card-size-wrap { display: flex; align-items: baseline; gap: 5px; }
  .hp-card-size {
    font-family: var(--fd); font-size: 28px; font-weight: 700;
    color: var(--ink); letter-spacing: -0.5px; line-height: 1;
  }
  .hp-card-size-label { font-size: 11px; color: var(--ash); font-weight: 500; }

  .hp-card-fit-pill {
    font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 999px;
  }
  .hp-card-fit-pill.perfect { background: rgba(13,13,13,0.07); color: var(--ink); }
  .hp-card-fit-pill.great   { background: var(--sage-light); color: var(--sage-deep); }
  .hp-card-fit-pill.fair    { background: var(--cloud); color: var(--ash); }
  .hp-card-unavailable { font-size: 11px; line-height: 1.4; color: var(--ash); font-weight: 600; }
  .hp-card-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    align-self: flex-start;
    min-height: 30px;
    margin-top: 12px;
    padding: 0 11px;
    border: 1px solid var(--cloud);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font-size: 11px;
    font-weight: 800;
    line-height: 1;
    transition: background 0.18s, border-color 0.18s, color 0.18s;
  }
  .hp-product-card:hover .hp-card-action {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--white);
  }

  /* ── Recommendation details modal ── */
  .hp-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: grid;
    place-items: center;
    padding: 16px;
    overflow-y: auto;
    background: rgba(13,13,13,0.58);
    backdrop-filter: blur(10px);
    animation: hp-modalFade 0.2s ease both;
  }
  .hp-modal {
    position: relative;
    width: min(480px, 100%);
    max-height: calc(100dvh - 32px);
    overflow-y: auto;
    background: var(--white);
    border: 1px solid rgba(255,255,255,0.72);
    border-radius: 28px;
    box-shadow: 0 36px 100px rgba(0,0,0,0.3);
    animation: hp-modalUp 0.32s var(--ease) both;
  }
  .hp-modal-close {
    position: absolute;
    top: 16px;
    right: 16px;
    z-index: 3;
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    border: 1px solid var(--cloud);
    border-radius: 50%;
    background: rgba(255,255,255,0.94);
    color: var(--ink);
    font: 500 23px/1 var(--fs);
    cursor: pointer;
    transition: background 0.18s, transform 0.18s;
  }
  .hp-modal-close:hover { background: var(--cloud); transform: rotate(5deg); }
  .hp-modal-image {
    position: relative;
    width: 100%;
    height: 220px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: var(--paper);
    border-bottom: 1px solid var(--cloud);
  }
  .hp-modal-image img { width: 100%; height: 100%; object-fit: contain; }
  .hp-modal-image-placeholder { width: 72px; height: 72px; color: var(--ash); opacity: 0.42; }
  .hp-modal-image-placeholder svg { width: 100%; height: 100%; }
  .hp-modal-score {
    position: absolute;
    top: 18px;
    left: 18px;
    border-radius: 999px;
    padding: 8px 14px;
    font-size: 13px;
    font-weight: 800;
  }
  .hp-modal-score.perfect { background: var(--ink); color: var(--white); }
  .hp-modal-score.great { background: var(--sage-light); color: var(--sage-deep); border: 1px solid var(--sage-dark); }
  .hp-modal-score.fair { background: var(--cloud); color: var(--ash); }
  .hp-modal-score.unavailable { background: var(--cloud); color: var(--ash); }
  .hp-modal-body { padding: 22px 26px 26px; }
  .hp-modal-eyebrow { margin-bottom: 6px; color: var(--ash); font-size: 11px; font-weight: 700; letter-spacing: 0.7px; text-transform: uppercase; }
  .hp-modal-title { margin: 0; color: var(--ink); font-family: var(--fd); font-size: 32px; font-weight: 700; line-height: 1.08; letter-spacing: -0.7px; }
  .hp-modal-subcategory { margin-top: 7px; color: var(--ash); font-size: 13px; }
  .hp-modal-copy { margin: 15px 0 0; color: var(--ash); font-size: 13.5px; line-height: 1.65; }
  .hp-modal-result {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;
    margin-top: 18px;
    padding: 18px 0;
    border-top: 1px solid var(--cloud);
    border-bottom: 1px solid var(--cloud);
  }
  .hp-modal-size-label { margin-bottom: 6px; color: var(--ash); font-size: 10px; font-weight: 700; letter-spacing: 0.7px; text-transform: uppercase; }
  .hp-modal-size { display: flex; align-items: baseline; gap: 8px; }
  .hp-modal-size strong { color: var(--ink); font-family: var(--fd); font-size: 52px; line-height: 0.78; letter-spacing: -2px; }
  .hp-modal-size span { color: var(--ash); font-size: 13px; font-weight: 600; }
  .hp-modal-fit { border-radius: 999px; padding: 8px 14px; font-size: 12px; font-weight: 700; white-space: nowrap; }
  .hp-modal-fit.perfect { background: rgba(13,13,13,0.07); color: var(--ink); }
  .hp-modal-fit.great { background: var(--sage-light); color: var(--sage-deep); }
  .hp-modal-fit.fair { background: var(--cloud); color: var(--ash); }
  .hp-modal-unavailable { display: flex; align-items: flex-start; gap: 9px; margin-top: 18px; padding: 14px; border: 1px solid var(--cloud); border-radius: 12px; background: var(--paper); color: var(--ash); font-size: 13px; line-height: 1.5; }
  .hp-modal-unavailable svg { width: 17px; height: 17px; flex: 0 0 auto; margin-top: 1px; color: var(--sage-deep); }
  .hp-modal-unavailable strong { display: block; margin-bottom: 3px; color: var(--ink); }
  .hp-modal-metrics { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 10px; margin-top: 16px; }
  .hp-modal-metric { padding: 13px 14px; border: 1px solid var(--cloud); border-radius: 12px; background: var(--paper); }
  .hp-modal-metric-label { color: var(--ash); font-size: 10px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
  .hp-modal-metric-value { margin-top: 3px; color: var(--ink); font-size: 14px; font-weight: 700; }
  .hp-modal-confidence-note { display: flex; align-items: flex-start; gap: 10px; margin-top: 12px; padding: 13px 14px; border-radius: 12px; font-size: 12.5px; line-height: 1.5; }
  .hp-modal-confidence-note.high { border: 1px solid var(--sage-dark); background: var(--sage-light); color: var(--sage-deep); }
  .hp-modal-confidence-note.limited { border: 1px solid var(--cloud); background: var(--paper); color: var(--ash); }
  .hp-modal-confidence-note strong { display: block; margin-bottom: 2px; color: var(--ink); font-size: 12px; }
  .hp-modal-confidence-dot { width: 8px; height: 8px; margin-top: 5px; flex: 0 0 auto; border-radius: 50%; background: currentColor; }
  .hp-modal-reasons { margin-top: 16px; padding: 15px 16px; border: 1px solid var(--cloud); border-radius: 12px; background: var(--paper); }
  .hp-modal-reasons-title { color: var(--ink); font-size: 11px; font-weight: 800; letter-spacing: 0.55px; text-transform: uppercase; }
  .hp-modal-reasons ul { display: grid; gap: 7px; margin: 10px 0 0; padding-left: 18px; color: var(--ash); font-size: 12.5px; line-height: 1.5; }
  .hp-modal-missing { display: flex; align-items: flex-start; gap: 9px; margin-top: 12px; padding: 13px 14px; border: 1px solid var(--sage-dark); border-radius: 12px; background: var(--sage-light); color: var(--sage-deep); font-size: 12.5px; line-height: 1.5; }
  .hp-modal-missing svg { width: 16px; height: 16px; flex: 0 0 auto; margin-top: 1px; }
  .hp-modal-add-measurements { display: inline-flex; align-items: center; justify-content: center; min-height: 34px; margin-top: 10px; padding: 0 12px; border: 1px solid var(--sage-deep); border-radius: 8px; background: var(--white); color: var(--sage-deep); font-family: var(--fs); font-size: 11px; font-weight: 800; cursor: pointer; }
  .hp-modal-add-measurements:hover { background: var(--paper); }
  .hp-modal-note { margin-top: 14px; color: var(--ash); font-size: 11px; line-height: 1.55; }
  .hp-fit-feedback { margin-top: 18px; padding: 17px; border: 1px solid var(--cloud); border-radius: 15px; background: var(--paper); }
  .hp-fit-feedback-heading { color: var(--ink); font-size: 14px; font-weight: 800; }
  .hp-fit-feedback-copy { margin-top: 4px; color: var(--ash); font-size: 12px; line-height: 1.5; }
  .hp-fit-feedback-open { min-height: 38px; margin-top: 13px; padding: 0 15px; border: 0; border-radius: 9px; background: var(--ink); color: var(--white); font-family: var(--fs); font-size: 12px; font-weight: 800; cursor: pointer; }
  .hp-fit-feedback-form { display: grid; gap: 14px; margin-top: 16px; }
  .hp-fit-feedback-field { display: grid; gap: 8px; }
  .hp-fit-feedback-label { color: var(--ink); font-size: 11px; font-weight: 800; letter-spacing: 0.35px; }
  .hp-fit-feedback-options { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; }
  .hp-fit-feedback-options.outcomes { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .hp-fit-feedback-option { min-height: 38px; padding: 7px 9px; border: 1px solid var(--mist); border-radius: 9px; background: var(--white); color: var(--ash); font-family: var(--fs); font-size: 11px; font-weight: 700; cursor: pointer; transition: border-color 0.18s, background 0.18s, color 0.18s; }
  .hp-fit-feedback-option:hover { border-color: var(--sage-dark); color: var(--ink); }
  .hp-fit-feedback-option.active { border-color: var(--ink); background: var(--ink); color: var(--white); }
  .hp-fit-feedback-note { width: 100%; min-height: 82px; resize: vertical; padding: 11px 12px; border: 1px solid var(--mist); border-radius: 9px; background: var(--white); color: var(--ink); font: 12px/1.5 var(--fs); outline: none; }
  .hp-fit-feedback-note:focus { border-color: var(--sage-deep); box-shadow: 0 0 0 3px rgba(122,158,120,0.12); }
  .hp-fit-feedback-count { color: var(--ash); font-size: 10px; text-align: right; }
  .hp-fit-feedback-actions { display: flex; gap: 8px; }
  .hp-fit-feedback-submit, .hp-fit-feedback-cancel { min-height: 39px; padding: 0 14px; border-radius: 9px; font-family: var(--fs); font-size: 11px; font-weight: 800; cursor: pointer; }
  .hp-fit-feedback-submit { flex: 1; border: 0; background: var(--ink); color: var(--white); }
  .hp-fit-feedback-submit:disabled { cursor: not-allowed; opacity: 0.45; }
  .hp-fit-feedback-cancel { border: 1px solid var(--mist); background: var(--white); color: var(--ash); }
  .hp-fit-feedback-error { color: var(--red); font-size: 11px; line-height: 1.45; }
  .hp-fit-feedback-success { margin-top: 13px; padding: 12px 13px; border: 1px solid var(--sage-dark); border-radius: 10px; background: var(--sage-light); color: var(--sage-deep); font-size: 12px; font-weight: 700; line-height: 1.45; }

  /* ── Empty state ── */
  .hp-empty {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 80px 40px; text-align: center;
    background: var(--white); border: 1px solid var(--cloud);
    border-radius: 20px; gap: 16px;
  }
  .hp-empty-icon {
    width: 64px; height: 64px; border-radius: 50%;
    background: var(--sage-light); border: 1px solid var(--sage-dark);
    display: flex; align-items: center; justify-content: center;
    font-size: 0;
    background-image: url('${rulerIcon}');
    background-repeat: no-repeat;
    background-position: center;
    background-size: 28px 28px;
  }
  .hp-empty-title { font-family: var(--fd); font-size: 24px; font-weight: 700; color: var(--ink); }
  .hp-empty-sub { font-size: 14px; color: var(--ash); max-width: 340px; line-height: 1.6; }
  .hp-empty-btn {
    font-family: var(--fs); font-size: 13.5px; font-weight: 600;
    color: var(--white); background: var(--ink);
    border: none; border-radius: 10px; padding: 10px 24px; cursor: pointer;
    transition: opacity 0.2s; margin-top: 4px;
  }
  .hp-empty-btn:hover { opacity: 0.85; }

  /* ── Skeleton loader ── */
  .hp-skeleton {
    background: linear-gradient(90deg, var(--cloud) 25%, var(--paper) 50%, var(--cloud) 75%);
    background-size: 200% 100%;
    animation: hp-shimmer 1.4s ease-in-out infinite;
    border-radius: 8px;
  }
  .hp-skeleton-card {
    background: var(--white); border: 1px solid var(--cloud);
    border-radius: 18px; overflow: hidden;
  }

  /* ── Tip banner ── */
  .hp-tip {
    display: flex; align-items: center; gap: 16px;
    background: var(--sage-light);
    border: 1px solid var(--sage-dark);
    border-radius: 14px; padding: 18px 22px;
    animation: hp-fadeUp 0.5s 0.35s var(--ease) both;
  }
  .hp-tip-icon {
    width: 40px; height: 40px; border-radius: 10px;
    background: rgba(163,191,161,0.4);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .hp-tip-icon svg { width: 18px; height: 18px; color: var(--sage-deep); }
  .hp-tip-title { font-size: 13.5px; font-weight: 700; color: var(--ink); margin-bottom: 2px; }
  .hp-tip-sub { font-size: 12.5px; color: var(--sage-deep); line-height: 1.5; }
  .hp-tip-btn {
    margin-left: auto; flex-shrink: 0;
    font-family: var(--fs); font-size: 12.5px; font-weight: 700;
    color: var(--ink); background: var(--white);
    border: 1px solid var(--sage-dark); border-radius: 8px;
    padding: 8px 16px; cursor: pointer; white-space: nowrap;
    display: inline-flex; align-items: center; justify-content: center;
    transition: all 0.15s;
  }
  .hp-tip-btn:hover { background: var(--ink); color: var(--white); border-color: var(--ink); }

  /* ── Overall public feedback ── */
  .hp-public-feedback {
    display: grid;
    grid-template-columns: minmax(230px, 0.75fr) minmax(320px, 1.25fr);
    gap: 32px;
    padding: 30px;
    border-radius: 20px;
    background: var(--ink);
    color: var(--white);
    animation: hp-fadeUp 0.5s 0.4s var(--ease) both;
  }
  .hp-public-feedback-eyebrow { color: var(--sage); font-size: 10px; font-weight: 800; letter-spacing: 0.8px; text-transform: uppercase; }
  .hp-public-feedback-title { margin-top: 8px; font-family: var(--fd); font-size: 32px; font-weight: 700; line-height: 1.05; letter-spacing: -0.5px; }
  .hp-public-feedback-copy { max-width: 380px; margin-top: 10px; color: rgba(255,255,255,0.5); font-size: 12.5px; line-height: 1.65; }
  .hp-public-feedback-form { display: grid; gap: 13px; padding: 20px; border: 1px solid rgba(255,255,255,0.1); border-radius: 15px; background: rgba(255,255,255,0.06); }
  .hp-public-feedback-label { color: rgba(255,255,255,0.72); font-size: 11px; font-weight: 700; }
  .hp-public-feedback-stars { display: flex; gap: 6px; }
  .hp-public-feedback-star { padding: 0; border: 0; background: transparent; color: rgba(255,255,255,0.2); font-size: 25px; line-height: 1; cursor: pointer; transition: color 0.15s, transform 0.15s; }
  .hp-public-feedback-star:hover { transform: translateY(-1px); }
  .hp-public-feedback-star.active { color: var(--sage); }
  .hp-public-feedback-textarea { width: 100%; min-height: 88px; resize: vertical; padding: 11px 12px; border: 1px solid rgba(255,255,255,0.14); border-radius: 10px; background: rgba(255,255,255,0.08); color: var(--white); font: 12.5px/1.55 var(--fs); outline: none; }
  .hp-public-feedback-textarea::placeholder { color: rgba(255,255,255,0.3); }
  .hp-public-feedback-textarea:focus { border-color: var(--sage-dark); box-shadow: 0 0 0 3px rgba(195,216,193,0.08); }
  .hp-public-feedback-meta { display: flex; align-items: center; justify-content: space-between; gap: 12px; color: rgba(255,255,255,0.36); font-size: 10px; line-height: 1.4; }
  .hp-public-feedback-submit { min-height: 41px; border: 1px solid var(--sage-dark); border-radius: 9px; background: var(--sage-light); color: var(--ink); font-family: var(--fs); font-size: 12px; font-weight: 800; cursor: pointer; }
  .hp-public-feedback-submit:disabled { cursor: not-allowed; opacity: 0.4; }
  .hp-public-feedback-error { color: #ffaaa2; font-size: 11px; }
  .hp-public-feedback-success { display: grid; place-items: center; min-height: 190px; padding: 26px; border: 1px solid rgba(195,216,193,0.28); border-radius: 15px; background: rgba(195,216,193,0.1); color: var(--sage); font-size: 13px; font-weight: 700; text-align: center; }

  @media (max-width: 1200px) {
    .hp-stats-row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .hp-grid {
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    }
  }

  @media (max-width: 920px) {
    .hp-root {
      width: 100%;
      margin-left: 0;
    }

    .hp-nav {
      display: none;
    }

    .hp-main {
      width: 100%;
      margin-left: 0;
      min-height: 0;
    }

    .hp-topbar {
      height: auto;
      min-height: 64px;
      flex-wrap: wrap;
      padding: 14px 20px;
      gap: 14px;
    }

    .hp-search-wrap {
      order: 3;
      flex: 1 1 100%;
      max-width: none;
    }

    .hp-topbar-actions {
      margin-left: 0;
      margin-right: 0;
    }

    .hp-body {
      padding: 24px 20px 96px;
    }

    .hp-public-feedback { grid-template-columns: 1fr; }
  }

  @media (max-width: 640px) {
    .hp-topbar {
      padding: 14px 16px;
      align-items: stretch;
    }

    .hp-topbar-heading {
      width: 100%;
    }

    .hp-topbar-actions {
      width: 100%;
      flex-wrap: wrap;
      justify-content: flex-start;
    }

    .hp-add-btn {
      flex: 1 1 180px;
      justify-content: center;
    }

    .hp-body {
      padding: 8px 12px calc(104px + env(safe-area-inset-bottom, 0px));
      gap: 12px;
    }

    .hp-mobile-summary {
      position: sticky;
      top: var(--nav-h, 72px);
      z-index: 35;
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin: -10px -12px 0;
      padding: 8px 12px 10px;
      background: var(--paper);
      backdrop-filter: none;
      border-bottom: 1px solid rgba(0,0,0,0.07);
    }

    .hp-stats-row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 7px;
    }

    .hp-stat-card-total,
    .hp-stat-card-brands {
      display: none;
    }

    .hp-stat-card {
      min-width: 0;
      border-radius: 10px;
      padding: 10px 11px;
      box-shadow: 0 6px 16px rgba(13,13,13,0.04);
    }

    .hp-stat-card:hover {
      transform: none;
      box-shadow: 0 6px 16px rgba(13,13,13,0.04);
    }

    .hp-stat-label {
      margin-bottom: 5px;
      font-size: 9px;
      letter-spacing: 0.45px;
    }

    .hp-stat-num {
      font-size: 24px;
      letter-spacing: 0;
    }

    .hp-stat-sub {
      margin-top: 3px;
      font-size: 10px;
      line-height: 1.35;
    }

    .hp-grid {
      grid-template-columns: 1fr;
      gap: 8px;
    }

    .hp-filter-bar {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 8px;
      min-width: 0;
    }

    .hp-filter-section {
      display: grid;
      grid-template-columns: 68px minmax(0, 1fr);
      align-items: center;
      gap: 6px;
      min-width: 0;
    }

    .hp-filter-label {
      font-size: 10px;
    }

    .hp-section-header,
    .hp-measurement-prompt,
    .hp-tip {
      flex-direction: column;
      align-items: flex-start;
    }

    .hp-filter-divider {
      display: none;
    }

    .hp-tip-btn {
      margin-left: 0;
      width: 100%;
      justify-content: center;
    }

    .hp-public-feedback { padding: 22px; gap: 22px; }
    .hp-public-feedback-form { padding: 16px; }
    .hp-public-feedback-meta { align-items: flex-start; flex-direction: column; }

    .hp-measurement-prompt-btn {
      width: auto;
      margin-left: 0;
      min-height: 26px;
      padding: 0 9px;
      border-radius: 999px;
      font-size: 10.5px;
      white-space: nowrap;
    }

    .hp-pill-group {
      width: 100%;
      gap: 8px;
    }

    .hp-pill-scroll {
      flex-wrap: nowrap;
      overflow-x: auto;
      padding: 0 16px 3px 0;
      scroll-padding-right: 16px;
      scroll-snap-type: x proximity;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
    }

    .hp-pill-scroll::-webkit-scrollbar {
      display: none;
    }

    .hp-pill {
      flex: 0 0 auto;
      justify-content: center;
      min-height: 36px;
      padding: 7px 11px;
      font-size: 11.5px;
      scroll-snap-align: start;
    }

    .hp-section-header {
      gap: 6px;
      margin-top: 0;
    }

    .hp-section-title {
      font-size: 24px;
    }

    .hp-section-sub {
      font-size: 12px;
      line-height: 1.5;
    }

    .hp-measurement-prompt {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: 24px minmax(0, 1fr) auto;
      align-items: center;
      min-height: 40px;
      padding: 7px 9px;
      gap: 7px;
      border-radius: 12px;
      overflow: hidden;
    }

    .hp-measurement-prompt-icon {
      width: 24px;
      height: 24px;
      border-radius: 7px;
    }

    .hp-measurement-prompt-icon svg {
      width: 13px;
      height: 13px;
    }

    .hp-measurement-prompt-copy {
      min-width: 0;
    }

    .hp-measurement-prompt-title {
      font-size: 11.5px;
      line-height: 1.2;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .hp-measurement-prompt-sub {
      display: none;
    }

    .hp-product-card {
      display: grid;
      grid-template-columns: 88px minmax(0, 1fr);
      min-height: 104px;
      border-radius: 12px;
    }

    .hp-product-card:hover {
      transform: none;
      box-shadow: none;
    }

    .hp-card-image {
      height: 100%;
      min-height: 104px;
      aspect-ratio: auto;
      border-right: 1px solid var(--cloud);
    }

    .hp-card-image img {
      object-fit: contain;
      padding: 8px;
    }

    .hp-card-score-badge {
      top: auto;
      right: 6px;
      bottom: 6px;
      max-width: calc(100% - 12px);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      padding: 3px 7px;
      font-size: 9.5px;
    }

    .hp-card-score-badge.unavailable {
      display: none;
    }

    .hp-card-body {
      min-height: 0;
      padding: 9px 11px;
      justify-content: space-between;
    }

    .hp-card-brand {
      margin-bottom: 3px;
      font-size: 10px;
    }

    .hp-card-title {
      margin-bottom: 3px;
      font-size: 13px;
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .hp-card-sub {
      margin-bottom: 6px;
      font-size: 11px;
    }

    .hp-card-footer {
      flex-direction: row;
      align-items: center;
      padding-top: 6px;
      gap: 6px;
      margin-top: 4px;
    }

    .hp-card-size {
      font-size: 23px;
    }

    .hp-card-size-label {
      font-size: 10px;
    }

    .hp-card-fit-pill {
      margin-left: auto;
      padding: 4px 8px;
      font-size: 10px;
      white-space: nowrap;
    }

    .hp-card-unavailable {
      font-size: 10.5px;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .hp-card-action {
      min-height: 27px;
      margin-top: 6px;
      padding: 0 9px;
      font-size: 10px;
    }

    .hp-skeleton-card {
      display: grid;
      grid-template-columns: 88px minmax(0, 1fr);
      border-radius: 12px;
    }

    .hp-skeleton-card > .hp-skeleton {
      height: auto !important;
      min-height: 104px;
    }

    .hp-modal-backdrop { padding: 14px; }
    .hp-modal { border-radius: 22px; }
    .hp-modal-image { height: 190px; }
    .hp-modal-body { padding: 20px; }
    .hp-modal-title { font-size: 29px; }
  }

  /* ── Error ── */
  .hp-error {
    display: flex; align-items: center; gap: 10px;
    background: rgba(192,57,43,0.06); border: 1px solid rgba(192,57,43,0.18);
    border-radius: 12px; padding: 14px 18px;
    font-size: 13px; color: var(--red);
  }
  .hp-error svg { width: 15px; height: 15px; flex-shrink: 0; }

  /* ── Keyframes ── */
  @keyframes hp-fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: none; }
  }
  @keyframes hp-fadeDown {
    from { opacity: 0; transform: translateY(-16px); }
    to   { opacity: 1; transform: none; }
  }
  @keyframes hp-fadeRight {
    from { opacity: 0; transform: translateX(-20px); }
    to   { opacity: 1; transform: none; }
  }
  @keyframes hp-shimmer {
    from { background-position: 200% 0; }
    to   { background-position: -200% 0; }
  }
  @keyframes hp-modalFade {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes hp-modalUp {
    from { opacity: 0; transform: translateY(20px) scale(0.97); }
    to   { opacity: 1; transform: none; }
  }

  @media (prefers-reduced-motion: reduce) {
    .hp-modal-backdrop, .hp-modal { animation: none; }
  }
`;

const homePageStyles = document.getElementById('hp-styles');
if (homePageStyles) {
  homePageStyles.textContent = CSS;
} else {
  const s = document.createElement('style');
  s.id = 'hp-styles';
  s.textContent = CSS;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────────
   Inline SVG icons
───────────────────────────────────────────── */
const Ico = {
  Home:     () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 7.5L8 2l6 5.5V14H2V7.5z"/></svg>,
  Search:   () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5l3 3"/></svg>,
  Scan:     () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="2" width="4" height="4" rx="1"/><rect x="10" y="2" width="4" height="4" rx="1"/><rect x="2" y="10" width="4" height="4" rx="1"/><path d="M10 10h4v4"/><path d="M10 10v2"/></svg>,
  Star:     () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 2l1.5 3.5L13 6l-2.5 2.5.6 3.5L8 10.5 4.9 12l.6-3.5L3 6l3.5-.5L8 2z"/></svg>,
  User:     () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>,
  Settings: () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="2.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M3.1 12.9l1.4-1.4M11.5 4.5l1.4-1.4"/></svg>,
  Bell:     () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 2a4 4 0 014 4c0 2.5.5 4 1.5 5H2.5C3.5 10 4 8.5 4 6a4 4 0 014-4z"/><path d="M6.5 13a1.5 1.5 0 003 0"/></svg>,
  Plus:     () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 3v10M3 8h10"/></svg>,
  Bulb:     () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 2a4 4 0 014 4c0 1.7-.9 3.1-2 4v1H6v-1c-1.1-.9-2-2.3-2-4a4 4 0 014-4z"/><path d="M6 13h4"/></svg>,
  Alert:    () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="6"/><path d="M8 5v4M8 11v.5"/></svg>,
  Shirt:    () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M6 2l2 2 2-2 3 2-1.5 3H11v7H5V7H3.5L2 4l3-2z"/></svg>,
};

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const MATCH_FILTERS = [
  { value: 'all',     label: 'All matches' },
  { value: 'perfect', label: 'Perfect fit' },
  { value: 'great',   label: 'Great fit'   },
] as const;
type MatchFilter = typeof MATCH_FILTERS[number]['value'];

function isRecommendationAvailable(card: BrandRecommendation) {
  return card.availability === 'recommended';
}
function isPerfectFit(card: BrandRecommendation) {
  return isRecommendationAvailable(card) && card.matchScore >= 75 && card.confidence === 'high';
}
function isGreatFit(card: BrandRecommendation) {
  return isRecommendationAvailable(card) && card.matchScore >= 60 && !isPerfectFit(card);
}
function getScoreClass(card: EnrichedRecommendation) {
  if (!isRecommendationAvailable(card)) return 'unavailable';
  return isPerfectFit(card) ? 'perfect' : 'great';
}
function getFitLabel(card: EnrichedRecommendation) {
  return isPerfectFit(card) ? 'Perfect fit' : 'Great fit';
}
function formatMeasurementKeys(keys: string[]) {
  const labels = keys.map((key) => key.charAt(0).toUpperCase() + key.slice(1));
  if (labels.length < 2) return labels[0] ?? 'Primary measurement';
  return `${labels.slice(0, -1).join(', ')} or ${labels[labels.length - 1]}`;
}
function normalizeMeasurementKeyForPrompt(key: string) {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}
function isEnteredMeasurement(value: unknown) {
  const numeric = typeof value === 'number' ? value : typeof value === 'string' ? Number.parseFloat(value) : NaN;
  return Number.isFinite(numeric) && numeric > 0;
}

function getRecommendationEmptyState(
  status: string | undefined,
  hasProfile: boolean,
  additionalMeasurementGuidance: string,
) {
  switch (status) {
    case 'no-reliable-match':
      return {
        title: 'No reliable size recommendation yet',
        description:
          `None of the available size charts is close enough to your saved measurements. Check the values, then ${additionalMeasurementGuidance}`,
        action: 'Review measurements',
      };
    case 'no-comparable-key-measurements':
      return {
        title: 'Primary measurement unavailable',
        description:
          `The available brand charts do not include your primary measurement for this category. ${additionalMeasurementGuidance} Or try another clothing category.`,
        action: 'Add measurements',
      };
    case 'missing-measurements':
      return {
        title: 'Add measurements to get started',
        description: 'Save your measurements before we can calculate a reliable size recommendation.',
        action: 'Add measurements',
      };
    default:
      return {
        title: 'No matches yet',
        description: hasProfile
          ? 'Add more measurements or switch to another clothing category to unlock recommendations.'
          : 'Complete your profile first to unlock size recommendations.',
        action: 'Add measurements',
      };
  }
}

/* ─────────────────────────────────────────────
   Product card
───────────────────────────────────────────── */
function ProductCard({ card, onOpen }: { card: EnrichedRecommendation; onOpen: () => void }) {
  const cls = getScoreClass(card);
  const measurementUnavailable = !isRecommendationAvailable(card);
  const unavailableMeasurements = formatMeasurementKeys(card.unavailablePrimaryMeasurementKeys);
  const image = card.imageUrl || card.seller?.photoURL || null;
  return (
    <button
      type="button"
      className="hp-product-card"
      aria-label={measurementUnavailable
        ? `View ${card.brandDisplay} ${card.title} measurement availability details`
        : `View ${card.brandDisplay} ${card.title} recommendation details`}
      onClick={onOpen}>
      <div className="hp-card-image">
        {image
          ? <img src={image} alt={card.title} />
          : <div className="hp-card-image-placeholder"><Ico.Shirt /></div>
        }
        <div className={`hp-card-score-badge ${cls}`}>
          {measurementUnavailable ? 'Primary measurement unavailable' : `${card.matchScore}%`}
        </div>
      </div>
      <div className="hp-card-body">
        <div className="hp-card-brand">{card.brandDisplay}</div>
        <div className="hp-card-title">{card.title}</div>
        {card.subCategory && <div className="hp-card-sub">{card.subCategory}</div>}
        <div className="hp-card-footer">
          {measurementUnavailable ? (
            <span className="hp-card-unavailable">Primary measurement unavailable: {unavailableMeasurements} is not included in this chart.</span>
          ) : (
            <>
              <div className="hp-card-size-wrap">
                <span className="hp-card-size">{card.sizeLabel ?? '—'}</span>
                <span className="hp-card-size-label">size</span>
              </div>
              <span className={`hp-card-fit-pill ${cls}`}>{getFitLabel(card)}</span>
            </>
          )}
        </div>
        <span className="hp-card-action">View fit details</span>
      </div>
    </button>
  );
}

function RecommendationDetailsModal({
  card,
  measurementProfileKey,
  onClose,
  onAddMeasurements,
}: {
  card: EnrichedRecommendation;
  measurementProfileKey: string;
  onClose: () => void;
  onAddMeasurements: () => void;
}) {
  const cls = getScoreClass(card);
  const measurementUnavailable = !isRecommendationAvailable(card);
  const unavailableMeasurements = formatMeasurementKeys(card.unavailablePrimaryMeasurementKeys);
  const missingMeasurements = formatMeasurementKeys(card.missingMeasurements);
  const image = card.imageUrl || card.seller?.photoURL || null;
  const [feedbackExpanded, setFeedbackExpanded] = useState(false);
  const [experience, setExperience] = useState<FitExperience | null>(null);
  const [outcome, setOutcome] = useState<FitOutcome | null>(null);
  const [feedbackNote, setFeedbackNote] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const handleFeedbackSubmit = async () => {
    if (!experience || !outcome || feedbackSubmitting) return;

    setFeedbackSubmitting(true);
    setFeedbackError(null);
    try {
      await submitFitFeedback({
        catalogId: card.id,
        measurementProfileKey,
        experience,
        outcome,
        recommendationScore: card.score,
        confidence: card.confidence,
        note: feedbackNote.trim() || null,
      });
      setFeedbackSubmitted(true);
      setFeedbackExpanded(false);
    } catch (error) {
      setFeedbackError(error instanceof Error ? error.message : 'Unable to save your fit feedback.');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <div className="hp-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="hp-modal" role="dialog" aria-modal="true" aria-labelledby="hp-modal-title">
        <button className="hp-modal-close" type="button" aria-label="Close recommendation details" onClick={onClose} autoFocus>×</button>
        <div className="hp-modal-image">
          {image
            ? <img src={image} alt={`${card.brandDisplay} ${card.title}`} />
            : <div className="hp-modal-image-placeholder"><Ico.Shirt /></div>
          }
          <span className={`hp-modal-score ${cls}`}>
            {measurementUnavailable ? 'Primary measurement unavailable' : `${card.matchScore}% match`}
          </span>
        </div>
        <div className="hp-modal-body">
          <div className="hp-modal-eyebrow">{card.brandDisplay}</div>
          <h2 className="hp-modal-title" id="hp-modal-title">{card.title}</h2>
          {(card.subCategory || card.category) && (
            <div className="hp-modal-subcategory">{[card.subCategory, card.category].filter(Boolean).join(' · ')}</div>
          )}
          <p className="hp-modal-copy">{card.explanation}</p>
          {measurementUnavailable ? (
            <div className="hp-modal-unavailable">
              <Ico.Alert />
              <div>
                <strong>Primary measurement unavailable</strong>
                <span>This brand's chart does not provide {unavailableMeasurements}, so it cannot be evaluated using your primary measurement.</span>
              </div>
            </div>
          ) : (
            <div className="hp-modal-result">
              <div>
                <div className="hp-modal-size-label">Your recommended size</div>
                <div className="hp-modal-size"><strong>{card.recommendedSize || '—'}</strong><span>size</span></div>
              </div>
              <span className={`hp-modal-fit ${cls}`}>{getFitLabel(card)}</span>
            </div>
          )}
          <div className="hp-modal-metrics">
            <div className="hp-modal-metric">
              <div className="hp-modal-metric-label">Fit score</div>
              <div className="hp-modal-metric-value">{card.score}%</div>
            </div>
            <div className="hp-modal-metric">
              <div className="hp-modal-metric-label">Comparable measurements</div>
              <div className="hp-modal-metric-value">{card.commonMeasurementCount}</div>
            </div>
            <div className="hp-modal-metric">
              <div className="hp-modal-metric-label">Key measurements matched</div>
              <div className="hp-modal-metric-value">{card.primaryMatchedCount} / {card.primaryExpectedCount}</div>
            </div>
            <div className="hp-modal-metric">
              <div className="hp-modal-metric-label">Fit confidence</div>
              <div className="hp-modal-metric-value">{card.confidence === 'high' ? 'High' : 'Limited'}</div>
            </div>
          </div>
          <div className={`hp-modal-confidence-note ${card.confidence}`}>
            <span className="hp-modal-confidence-dot" aria-hidden="true" />
            <div>
              <strong>{card.confidence === 'high' ? 'High confidence' : 'Limited confidence'}</strong>
              <span>{card.confidenceExplanation}</span>
            </div>
          </div>
          {card.reasons.length > 0 && (
            <div className="hp-modal-reasons">
              <div className="hp-modal-reasons-title">Why this result</div>
              <ul>
                {card.reasons.map(reason => <li key={reason}>{reason}</li>)}
              </ul>
            </div>
          )}
          {card.missingMeasurements.length > 0 && (
            <div className="hp-modal-missing">
              <Ico.Alert />
              <div>
                <span>Useful measurements to add: <strong>{missingMeasurements}</strong>. This brand's chart supports them, and they provide more comparison data.</span>
                <br />
                <button type="button" className="hp-modal-add-measurements" onClick={onAddMeasurements}>
                  Add useful measurements
                </button>
              </div>
            </div>
          )}
          {!measurementUnavailable && (
            <div className="hp-fit-feedback">
              <div className="hp-fit-feedback-heading">Did this recommendation fit?</div>
              <div className="hp-fit-feedback-copy">
                After trying or buying this item, tell us how it fit. Your feedback helps improve future recommendations.
              </div>
              {feedbackSubmitted ? (
                <div className="hp-fit-feedback-success" role="status">
                  Thank you — your fit feedback has been saved.
                </div>
              ) : !feedbackExpanded ? (
                <button className="hp-fit-feedback-open" type="button" onClick={() => setFeedbackExpanded(true)}>
                  Leave fit feedback
                </button>
              ) : (
                <div className="hp-fit-feedback-form">
                  <div className="hp-fit-feedback-field">
                    <div className="hp-fit-feedback-label">What did you do?</div>
                    <div className="hp-fit-feedback-options">
                      {([
                        ['TRIED', 'Tried it'],
                        ['BOUGHT', 'Bought it'],
                      ] as const).map(([value, label]) => (
                        <button
                          className={`hp-fit-feedback-option ${experience === value ? 'active' : ''}`}
                          type="button"
                          key={value}
                          aria-pressed={experience === value}
                          onClick={() => setExperience(value)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="hp-fit-feedback-field">
                    <div className="hp-fit-feedback-label">How did the recommended size fit?</div>
                    <div className="hp-fit-feedback-options outcomes">
                      {([
                        ['TOO_SMALL', 'Too small'],
                        ['PERFECT', 'Perfect'],
                        ['TOO_LARGE', 'Too large'],
                      ] as const).map(([value, label]) => (
                        <button
                          className={`hp-fit-feedback-option ${outcome === value ? 'active' : ''}`}
                          type="button"
                          key={value}
                          aria-pressed={outcome === value}
                          onClick={() => setOutcome(value)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="hp-fit-feedback-field">
                    <label className="hp-fit-feedback-label" htmlFor="hp-fit-feedback-note">Note (optional)</label>
                    <textarea
                      className="hp-fit-feedback-note"
                      id="hp-fit-feedback-note"
                      maxLength={1000}
                      value={feedbackNote}
                      onChange={event => setFeedbackNote(event.target.value)}
                      placeholder="Tell us where it felt tight, loose, or especially comfortable."
                    />
                    <div className="hp-fit-feedback-count">{feedbackNote.length} / 1000</div>
                  </div>
                  {feedbackError && <div className="hp-fit-feedback-error" role="alert">{feedbackError}</div>}
                  <div className="hp-fit-feedback-actions">
                    <button
                      className="hp-fit-feedback-cancel"
                      type="button"
                      disabled={feedbackSubmitting}
                      onClick={() => {
                        setFeedbackExpanded(false);
                        setFeedbackError(null);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className="hp-fit-feedback-submit"
                      type="button"
                      disabled={!experience || !outcome || feedbackSubmitting}
                      onClick={() => void handleFeedbackSubmit()}
                    >
                      {feedbackSubmitting ? 'Saving…' : 'Submit feedback'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>,
    document.body,
  );
}

function PublicFeedbackPanel() {
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const normalizedMessage = message.trim();

  const handleSubmit = async () => {
    if (!rating || normalizedMessage.length < 10 || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      await submitSiteFeedback(rating, normalizedMessage);
      setSubmitted(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to publish your feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="hp-public-feedback" aria-labelledby="hp-public-feedback-title">
      <div>
        <div className="hp-public-feedback-eyebrow">Your voice matters</div>
        <h2 className="hp-public-feedback-title" id="hp-public-feedback-title">Share your MatchMySize experience</h2>
        <p className="hp-public-feedback-copy">
          Tell future shoppers what you think about MatchMySize overall. This is separate from feedback about a specific size recommendation.
        </p>
      </div>
      {submitted ? (
        <div className="hp-public-feedback-success" role="status">
          Thank you. Your review is now available in the customer stories section of our landing page.
        </div>
      ) : (
        <div className="hp-public-feedback-form">
          <div>
            <div className="hp-public-feedback-label">Your rating</div>
            <div className="hp-public-feedback-stars" role="group" aria-label="Overall rating">
              {[1, 2, 3, 4, 5].map(value => (
                <button
                  className={`hp-public-feedback-star ${value <= rating ? 'active' : ''}`}
                  type="button"
                  key={value}
                  aria-label={`${value} ${value === 1 ? 'star' : 'stars'}`}
                  aria-pressed={rating === value}
                  onClick={() => setRating(value)}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="hp-public-feedback-label" htmlFor="hp-public-feedback-message">Your feedback</label>
            <textarea
              className="hp-public-feedback-textarea"
              id="hp-public-feedback-message"
              maxLength={500}
              value={message}
              onChange={event => setMessage(event.target.value)}
              placeholder="What was useful, and what could we improve?"
            />
          </div>
          <div className="hp-public-feedback-meta">
            <span>This will be public using only your first name and last initial.</span>
            <span>{message.length} / 500</span>
          </div>
          {error && <div className="hp-public-feedback-error" role="alert">{error}</div>}
          <button
            className="hp-public-feedback-submit"
            type="button"
            disabled={!rating || normalizedMessage.length < 10 || submitting}
            onClick={() => void handleSubmit()}
          >
            {submitting ? 'Publishing…' : 'Publish feedback'}
          </button>
        </div>
      )}
    </section>
  );
}

/* ─────────────────────────────────────────────
   Skeleton card
───────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="hp-skeleton-card">
      <div className="hp-skeleton" style={{ height: 160 }} />
      <div style={{ padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="hp-skeleton" style={{ height: 10, width: '40%' }} />
        <div className="hp-skeleton" style={{ height: 14, width: '75%' }} />
        <div className="hp-skeleton" style={{ height: 10, width: '55%' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <div className="hp-skeleton" style={{ height: 28, width: '30%' }} />
          <div className="hp-skeleton" style={{ height: 24, width: '28%', borderRadius: 999 }} />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */
export function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    profile, sellers, sections, categoryOptions, measurementProfiles,
    normalizedGender, activeSectionKey, loading, error,
  } = useRecommendationData(user?.uid);

  const [search,       setSearch]       = useState('');
  const [choiceFilter, setChoiceFilter] = useState<string | null>(null);
  const [matchFilter,  setMatchFilter]  = useState<MatchFilter>('all');
  const [selectedCard, setSelectedCard] = useState<EnrichedRecommendation | null>(null);

  const preferredSection = useMemo(() => {
    const active = sections.find(s => s.profileKey === activeSectionKey) ?? null;
    if (active?.recommendations.length) return active;
    return sections.find(s => s.recommendations.length > 0) ?? active ?? sections[0] ?? null;
  }, [activeSectionKey, sections]);

  useEffect(() => {
    if (choiceFilter && sections.some(s => s.choice === choiceFilter)) return;
    if (preferredSection?.choice) setChoiceFilter(preferredSection.choice);
  }, [choiceFilter, preferredSection, sections]);

  const selectedSection = useMemo(() =>
    sections.find(s => s.choice === choiceFilter)
    ?? preferredSection
    ?? null,
    [choiceFilter, preferredSection, sections]
  );

  const selectedMeasurementProfile = measurementProfiles.find(
    (entry) => entry.profileKey === selectedSection?.profileKey,
  );
  const savedMeasurementKeys = Object.entries(selectedMeasurementProfile?.measurements ?? {})
    .filter(([, value]) => isEnteredMeasurement(value))
    .map(([key]) => normalizeMeasurementKeyForPrompt(key));
  const primaryMeasurementKeys = (selectedMeasurementProfile?.primaryMeasurementKeys ?? [])
    .map(normalizeMeasurementKeyForPrompt)
    .filter(Boolean);
  const hasOnlyPrimaryMeasurements =
    savedMeasurementKeys.length > 0 &&
    primaryMeasurementKeys.length > 0 &&
    savedMeasurementKeys.every((key) => primaryMeasurementKeys.includes(key));
  const selectedClothingLabel = selectedMeasurementProfile?.preferredClothingLabel ?? selectedSection?.label ?? 'this item';
  const selectedTemplate = getClothingTemplate(
    normalizeGender(selectedMeasurementProfile?.gender),
    selectedMeasurementProfile?.preferredClothing,
  );
  const additionalMeasurementLabels = selectedTemplate?.fields
    .filter((field) => !field.isPrimary)
    .map((field) => field.label)
    .slice(0, 2) ?? [];
  const additionalMeasurementText = additionalMeasurementLabels.length
    ? `add ${formatMeasurementKeys(additionalMeasurementLabels)} measurements`
    : 'add more measurements';
  const compactMeasurementText = additionalMeasurementLabels.length
    ? formatMeasurementKeys(additionalMeasurementLabels.map(label => label.replace(/\s+length$/i, '')))
    : 'more measurements';
  const measurementPromptText = `Add ${compactMeasurementText.toLowerCase()} for better ${selectedClothingLabel.toLowerCase()} fits.`;
  const measurementCtaLabel =
    selectedClothingLabel && selectedClothingLabel !== 'this item'
      ? `Add ${selectedClothingLabel.toLowerCase()} measurements`
      : 'Add measurements';
  const editMeasurementParams = new URLSearchParams();
  if (selectedMeasurementProfile?.preferredClothing) {
    editMeasurementParams.set('choice', selectedMeasurementProfile.preferredClothing);
  }
  if (selectedMeasurementProfile?.profileKey) {
    editMeasurementParams.set('profileKey', selectedMeasurementProfile.profileKey);
  }
  const editMeasurementsPath = `/app/add-preference${editMeasurementParams.size ? `?${editMeasurementParams.toString()}` : ''}`;

  const cards = useMemo<EnrichedRecommendation[]>(() => {
    const base = (selectedSection?.recommendations ?? []).map(r => {
      const seller = r.sellerUserId ? sellers[r.sellerUserId] ?? null : null;
      return { ...r, brandDisplay: resolveBrandDisplay(r.brand, seller), seller } satisfies EnrichedRecommendation;
    });
    return base.filter(entry => {
      const matchesSearch = !search.trim()
        || `${entry.brandDisplay} ${entry.title} ${entry.subCategory}`.toLowerCase().includes(search.trim().toLowerCase());
      if (!matchesSearch) return false;
      if (matchFilter === 'perfect') return isPerfectFit(entry);
      if (matchFilter === 'great') return isGreatFit(entry);
      return true;
    });
  }, [matchFilter, search, selectedSection, sellers]);

  const categoryItems = categoryOptions.map(opt => ({
    value: opt.key, label: opt.label,
    badge: getCategoryBadge(sections, opt.key),
  }));

  const handleChoiceChange = (next: string) => {
    if (!sections.some(s => s.choice === next)) {
      navigate(`/app/add-preference?choice=${next}`); return;
    }
    setChoiceFilter(next);
  };

  // Derived stats
  const recommendedSectionCards = (selectedSection?.recommendations ?? []).filter(isRecommendationAvailable);
  const availableCards = cards.filter(isRecommendationAvailable);
  const unavailableCardCount = cards.length - availableCards.length;
  const totalCards    = recommendedSectionCards.length;
  const perfectCount  = availableCards.filter(isPerfectFit).length;
  const avgScore      = availableCards.length ? Math.round(availableCards.reduce((a, c) => a + c.matchScore, 0) / availableCards.length) : 0;
  const hasUnfilteredRecommendations = recommendedSectionCards.length > 0;
  const emptyState = getRecommendationEmptyState(
    selectedSection?.status,
    !!profile,
    `${additionalMeasurementText} for a more reliable ${selectedClothingLabel.toLowerCase()} fit.`,
  );

  return (
    <div className="hp-root">
      <div className="hp-main">

        {/* Page body */}
        <div className="hp-body">

          <div className="hp-mobile-summary">
            {/* Stats row */}
            <div className="hp-stats-row">
              <div className="hp-stat-card hp-stat-card-total accent">
                <div className="hp-stat-label">Total matches</div>
                <div className="hp-stat-num">{totalCards}{totalCards > 0 && <span>+</span>}</div>
                <div className="hp-stat-sub">Across all categories</div>
              </div>
              <div className="hp-stat-card hp-stat-card-perfect">
                <div className="hp-stat-label">Perfect fits</div>
                <div className="hp-stat-num">{perfectCount}</div>
                <div className="hp-stat-sub">Score ≥ 75%</div>
              </div>
              <div className="hp-stat-card hp-stat-card-average">
                <div className="hp-stat-label">Avg fit score</div>
                <div className="hp-stat-num">{avgScore || '—'}<span>{avgScore ? '%' : ''}</span></div>
                <div className="hp-stat-sub">Current category</div>
              </div>
              <div className="hp-stat-card hp-stat-card-brands">
                <div className="hp-stat-label">Brands</div>
                <div className="hp-stat-num">500<span>+</span></div>
                <div className="hp-stat-sub">In our database</div>
              </div>
            </div>

            {/* Category + match filter bar */}
            <div className="hp-filter-bar">
              <div className="hp-filter-section">
                <span className="hp-filter-label">Category</span>
                <div className="hp-pill-group hp-pill-scroll">
                  {categoryItems.map(item => (
                    <button
                      key={item.value}
                      className={`hp-pill${choiceFilter === item.value ? ' is-active' : ''}`}
                      onClick={() => handleChoiceChange(item.value)}>
                      {item.label}
                      {item.badge !== undefined && (
                        <span className="hp-pill-count">{item.badge}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="hp-filter-divider" />
              <div className="hp-filter-section">
                <span className="hp-filter-label">Fit</span>
                <div className="hp-pill-group hp-pill-scroll">
                  {MATCH_FILTERS.map(f => {
                    const count = f.value === 'all' ? availableCards.length
                      : f.value === 'perfect' ? cards.filter(isPerfectFit).length
                      : cards.filter(isGreatFit).length;
                    return (
                      <button
                        key={f.value}
                        className={`hp-pill${matchFilter === f.value ? ' is-active' : ''}`}
                        onClick={() => setMatchFilter(f.value)}>
                        {f.label}
                        <span className="hp-pill-count">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {hasOnlyPrimaryMeasurements && (
            <div className="hp-measurement-prompt">
              <div className="hp-measurement-prompt-icon"><Ico.Bulb /></div>
              <div className="hp-measurement-prompt-copy">
                <div className="hp-measurement-prompt-title">{measurementPromptText}</div>
              </div>
              <button
                type="button"
                className="hp-measurement-prompt-btn"
                aria-label={measurementCtaLabel}
                onClick={() => navigate(editMeasurementsPath)}>
                Add
              </button>
            </div>
          )}

          {/* Section header */}
          <div className="hp-section-header">
            <div className="hp-section-heading">
              <div className="hp-section-title-row">
                <span className="hp-section-title">{selectedSection?.label ?? 'Recommended'}</span>
                <span className="hp-section-count">{totalCards}</span>
              </div>
              <div className="hp-section-sub">
                {unavailableCardCount
                  ? `${unavailableCardCount} brand ${unavailableCardCount === 1 ? 'does' : 'do'} not provide your primary measurement for this clothing item. Open the card for details.`
                  : 'Reliable results need a comparable key measurement and a score of at least 60%.'}
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="hp-error">
              <Ico.Alert /> {error}
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div className="hp-grid">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : cards.length ? (
            <div className="hp-grid">
              {cards.map(card => <ProductCard key={card.id} card={card} onOpen={() => setSelectedCard(card)} />)}
            </div>
          ) : (
            <div className="hp-empty">
              <div className="hp-empty-icon">📏</div>
              <div className="hp-empty-title">{hasUnfilteredRecommendations ? 'No matching results' : emptyState.title}</div>
              <div className="hp-empty-sub">
                {hasUnfilteredRecommendations
                  ? 'Try clearing the search or choosing a different fit filter.'
                  : emptyState.description}
              </div>
              <button className="hp-empty-btn" onClick={() => {
                if (hasUnfilteredRecommendations) {
                  setSearch('');
                  setMatchFilter('all');
                  return;
                }
                navigate('/app/add-preference');
              }}>
                {hasUnfilteredRecommendations ? 'Clear filters' : measurementCtaLabel || emptyState.action}
              </button>
            </div>
          )}

          {/* Tip banner */}
          {normalizedGender !== 'unknown' && (
            <div className="hp-tip">
              <div className="hp-tip-icon"><Ico.Bulb /></div>
              <div>
                <div className="hp-tip-title">Explore more clothing categories</div>
                <div className="hp-tip-sub">
                  Add measurements for another category to unlock recommendations across all your wardrobe types.
                </div>
              </div>
              <button className="hp-tip-btn" onClick={() => navigate('/app/add-preference')}>
                Add category
              </button>
            </div>
          )}

          <PublicFeedbackPanel />

        </div>
      </div>

      {selectedCard && (
        <RecommendationDetailsModal
          card={selectedCard}
          measurementProfileKey={selectedMeasurementProfile?.profileKey ?? 'default'}
          onClose={() => setSelectedCard(null)}
          onAddMeasurements={() => {
            setSelectedCard(null);
            navigate(editMeasurementsPath);
          }}
        />
      )}
    </div>
  );
}

export default HomePage;
