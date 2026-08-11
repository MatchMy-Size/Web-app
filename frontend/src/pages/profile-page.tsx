import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/context/auth-context';
import { useProfileSubject } from '@/context/profile-subject-context';
import { createFamilyMember } from '@/lib/family-members';
import { signOutUser } from '@/lib/auth-api';
import { useRecommendationData } from '@/lib/use-recommendation-data';

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
    --red: #B04040;
    --fd: 'Cormorant Garamond', serif;
    --fs: 'DM Sans', sans-serif;
    --ease: cubic-bezier(0.22, 1, 0.36, 1);
  }

  .wp-root {
    min-height: 100vh;
    background: var(--paper);
    font-family: var(--fs);
  }

  /* ════════════════════════════════════
     COVER BANNER
  ════════════════════════════════════ */
  .wp-cover {
    position: relative;
    height: 220px;
    background: var(--ink);
    overflow: hidden;
  }

  /* Animated gradient mesh */
  .wp-cover-mesh {
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse at 15% 50%, rgba(195,216,193,0.18) 0%, transparent 50%),
      radial-gradient(ellipse at 85% 20%, rgba(195,216,193,0.10) 0%, transparent 45%),
      radial-gradient(ellipse at 50% 100%, rgba(195,216,193,0.07) 0%, transparent 40%);
    animation: wp-meshShift 8s ease-in-out infinite alternate;
  }
  .wp-cover-grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
    background-size: 56px 56px;
  }
  /* Decorative circles */
  .wp-cover-circle-1 {
    position: absolute; top: -60px; right: 80px;
    width: 260px; height: 260px; border-radius: 50%;
    border: 1px solid rgba(195,216,193,0.08);
  }
  .wp-cover-circle-2 {
    position: absolute; bottom: -80px; right: 200px;
    width: 180px; height: 180px; border-radius: 50%;
    border: 1px solid rgba(195,216,193,0.05);
  }

  /* Edit cover button */
  .wp-cover-edit-btn {
    position: absolute; bottom: 16px; right: 20px;
    display: flex; align-items: center; gap: 6px;
    font-family: var(--fs); font-size: 12px; font-weight: 700;
    color: rgba(255,255,255,0.7);
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 8px; padding: 7px 14px; cursor: pointer;
    transition: all 0.2s; z-index: 2;
  }
  .wp-cover-edit-btn:hover { background: rgba(255,255,255,0.14); color: var(--white); }
  .wp-cover-edit-btn svg { width: 13px; height: 13px; }

  /* ════════════════════════════════════
     PROFILE IDENTITY ROW
  ════════════════════════════════════ */
  .wp-identity-row {
    max-width: 1100px; margin: 0 auto;
    padding: 0 40px;
    position: relative;
    animation: wp-fadeUp 0.5s 0.1s var(--ease) both;
  }

  /* Avatar (overlaps cover) */
  .wp-avatar-wrap {
    position: absolute;
    top: -52px; left: 40px;
  }
  .wp-avatar-ring {
    position: absolute; inset: -4px; border-radius: 50%;
    border: 1.5px solid rgba(195,216,193,0.3);
    animation: wp-ringPulse 1.4s 0.6s ease-out forwards;
    opacity: 0;
  }
  .wp-avatar {
    width: 104px; height: 104px; border-radius: 50%;
    background: var(--ink);
    border: 4px solid var(--paper);
    display: flex; align-items: center; justify-content: center;
    overflow: hidden; position: relative; z-index: 1;
    box-shadow: 0 8px 28px rgba(0,0,0,0.18);
    animation: wp-popIn 0.55s 0.15s var(--ease) both;
    opacity: 0;
  }
  .wp-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .wp-avatar-initials {
    font-family: var(--fd); font-size: 36px; font-weight: 700;
    color: var(--white); letter-spacing: -0.5px;
  }
  /* Online dot */
  .wp-online-dot {
    position: absolute; bottom: 6px; right: 6px;
    width: 16px; height: 16px; border-radius: 50%;
    background: var(--sage-deep);
    border: 2.5px solid var(--paper);
    z-index: 2;
    animation: wp-pulseDot 2.5s ease-in-out infinite;
  }

  /* Meta area (right of avatar) */
  .wp-identity-meta {
    padding-top: 16px;
    padding-left: 136px; /* avatar width + gap */
    display: flex; align-items: flex-end;
    justify-content: space-between; gap: 24px;
    padding-bottom: 24px;
  }
  .wp-identity-left {}
  .wp-role-pill {
    display: inline-flex; align-items: center; gap: 6px;
    background: var(--sage-light); border: 1px solid var(--sage-dark);
    border-radius: 999px; padding: 4px 12px; margin-bottom: 8px;
  }
  .wp-role-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--sage-deep); }
  .wp-role-text { font-size: 11px; font-weight: 700; color: var(--sage-deep); letter-spacing: 0.4px; text-transform: uppercase; }
  .wp-fullname {
    font-family: var(--fd); font-size: 32px; font-weight: 700;
    color: var(--ink); letter-spacing: -0.6px; line-height: 1.1;
    margin-bottom: 5px;
  }
  .wp-contact {
    font-size: 13px; color: var(--ash);
    display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
  }
  .wp-contact-item { display: flex; align-items: center; gap: 5px; }
  .wp-contact-item svg { width: 13px; height: 13px; color: var(--mist); }

  /* Action buttons */
  .wp-identity-actions { display: flex; gap: 10px; flex-shrink: 0; align-self: flex-start; margin-top: 16px; }
  .wp-btn-edit {
    display: flex; align-items: center; gap: 7px;
    font-family: var(--fs); font-size: 13px; font-weight: 700;
    color: var(--white); background: var(--ink);
    border: none; border-radius: 10px;
    padding: 0 18px; height: 40px; cursor: pointer;
    transition: opacity 0.2s, transform 0.15s;
    box-shadow: 0 4px 14px rgba(0,0,0,0.18);
  }
  .wp-btn-edit:hover { opacity: 0.87; transform: translateY(-1px); }
  .wp-btn-edit:active { transform: scale(0.97); }
  .wp-btn-edit svg { width: 14px; height: 14px; }

  .wp-btn-outline {
    display: flex; align-items: center; gap: 7px;
    font-family: var(--fs); font-size: 13px; font-weight: 600;
    color: var(--slate); background: var(--white);
    border: 1.5px solid var(--cloud); border-radius: 10px;
    padding: 0 16px; height: 40px; cursor: pointer;
    transition: all 0.18s;
  }
  .wp-btn-outline:hover { border-color: var(--mist); color: var(--ink); transform: translateY(-1px); }
  .wp-btn-outline svg { width: 14px; height: 14px; }

  /* ════════════════════════════════════
     TAB DIVIDER
  ════════════════════════════════════ */
  .wp-tab-bar {
    border-bottom: 1px solid var(--cloud);
    background: rgba(250,250,248,0.95);
    backdrop-filter: blur(12px);
    position: sticky; top: 64px; z-index: 40;
    animation: wp-fadeDown 0.4s 0.2s var(--ease) both;
    opacity: 0;
  }
  .wp-tab-bar-inner {
    max-width: 1100px; margin: 0 auto;
    padding: 0 40px;
    display: flex; gap: 0;
  }
  .wp-tab {
    font-family: var(--fs); font-size: 13.5px; font-weight: 600;
    color: var(--ash); background: none; border: none;
    padding: 14px 20px; cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: color 0.18s, border-color 0.18s;
    position: relative; top: 1px;
  }
  .wp-tab:hover { color: var(--ink); }
  .wp-tab.active { color: var(--ink); border-bottom-color: var(--ink); }

  /* ════════════════════════════════════
     PAGE BODY  (sidebar + main)
  ════════════════════════════════════ */
  .wp-page-body {
    max-width: 1100px; margin: 0 auto;
    padding: 32px 40px 80px;
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 28px;
    align-items: start;
  }

  /* ── Sidebar ── */
  .wp-sidebar { display: flex; flex-direction: column; gap: 20px; }

  /* Info card */
  .wp-info-card {
    background: var(--white); border: 1px solid var(--cloud);
    border-radius: 18px; overflow: hidden;
    animation: wp-fadeUp 0.5s 0.18s var(--ease) both;
    opacity: 0;
  }
  .wp-info-card-header {
    padding: 16px 20px 12px;
    border-bottom: 1px solid var(--cloud);
    display: flex; align-items: center; gap: 8px;
  }
  .wp-info-card-icon {
    width: 26px; height: 26px; border-radius: 7px;
    background: var(--paper); border: 1px solid var(--cloud);
    display: flex; align-items: center; justify-content: center;
  }
  .wp-info-card-icon svg { width: 12px; height: 12px; color: var(--ash); }
  .wp-info-card-title {
    font-size: 11px; font-weight: 700; color: var(--ash);
    letter-spacing: 0.8px; text-transform: uppercase;
  }

  /* Info rows inside card */
  .wp-info-row {
    display: flex; align-items: center; gap: 12px;
    padding: 13px 20px;
    border-bottom: 1px solid var(--cloud);
  }
  .wp-info-row:last-child { border-bottom: none; }
  .wp-info-row-icon {
    width: 30px; height: 30px; border-radius: 8px;
    background: var(--paper); border: 1px solid var(--cloud);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .wp-info-row-icon svg { width: 13px; height: 13px; color: var(--ash); }
  .wp-info-row-icon.accent { background: var(--sage-light); border-color: var(--sage-dark); }
  .wp-info-row-icon.accent svg { color: var(--sage-deep); }
  .wp-info-row-body { flex: 1; min-width: 0; }
  .wp-info-row-label { font-size: 10px; font-weight: 600; color: var(--ash); margin-bottom: 1px; }
  .wp-info-row-value { font-size: 13.5px; font-weight: 700; color: var(--ink); }
  .wp-info-row-value.empty { color: var(--mist); font-weight: 400; }

  /* Preference tag */
  .wp-pref-tag {
    display: inline-flex; align-items: center; gap: 5px;
    background: var(--sage-light); border: 1px solid var(--sage-dark);
    border-radius: 999px; padding: 3px 10px;
    font-size: 11px; font-weight: 700; color: var(--sage-deep);
  }

  /* Quick links card */
  .wp-links-card {
    background: var(--white); border: 1px solid var(--cloud);
    border-radius: 18px; overflow: hidden;
    animation: wp-fadeUp 0.5s 0.24s var(--ease) both;
    opacity: 0;
  }
  .wp-link-row {
    display: flex; align-items: center; gap: 12px;
    padding: 13px 20px;
    border-bottom: 1px solid var(--cloud);
    cursor: pointer; background: none; width: 100%;
    text-align: left; font-family: var(--fs);
    transition: background 0.15s;
  }
  .wp-link-row:last-child { border-bottom: none; }
  .wp-link-row:hover { background: var(--paper); }
  .wp-link-row:hover .wp-link-chevron { transform: translateX(3px); }
  .wp-link-icon {
    width: 30px; height: 30px; border-radius: 8px;
    background: var(--paper); border: 1px solid var(--cloud);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    transition: all 0.18s;
  }
  .wp-link-row:hover .wp-link-icon { background: var(--cloud); border-color: var(--mist); }
  .wp-link-icon.danger { background: rgba(176,64,64,0.07); border-color: rgba(176,64,64,0.15); }
  .wp-link-icon svg { width: 13px; height: 13px; color: var(--ash); }
  .wp-link-icon.danger svg { color: var(--red); }
  .wp-link-label { flex: 1; font-size: 13.5px; font-weight: 700; color: var(--ink); }
  .wp-link-label.danger { color: var(--red); }
  .wp-link-sub { font-size: 11px; color: var(--ash); }
  .wp-link-badge {
    background: var(--sage-light); border: 1px solid var(--sage-dark);
    border-radius: 999px; padding: 2px 8px;
    font-size: 10px; font-weight: 800; color: var(--sage-deep);
    flex-shrink: 0;
  }
  .wp-link-chevron {
    color: var(--mist); transition: transform 0.18s;
  }
  .wp-link-chevron svg { width: 14px; height: 14px; }

  /* Danger link row */
  .wp-signout-card {
    background: rgba(176,64,64,0.04);
    border: 1px solid rgba(176,64,64,0.12);
    border-radius: 18px; overflow: hidden;
    animation: wp-fadeUp 0.5s 0.3s var(--ease) both;
    opacity: 0;
  }

  /* ── Main column ── */
  .wp-main { display: flex; flex-direction: column; gap: 24px; }

  /* Stats grid */
  .wp-stats-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;
    animation: wp-fadeUp 0.5s 0.14s var(--ease) both;
    opacity: 0;
  }
  .wp-stat-card {
    background: var(--white); border: 1px solid var(--cloud);
    border-radius: 16px; padding: 20px 22px;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .wp-stat-card:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(0,0,0,0.07); }
  .wp-stat-card.accent { background: var(--ink); border-color: var(--ink); }
  .wp-stat-icon {
    width: 36px; height: 36px; border-radius: 9px;
    background: var(--paper); border: 1px solid var(--cloud);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 14px;
  }
  .wp-stat-card.accent .wp-stat-icon { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.1); }
  .wp-stat-icon svg { width: 15px; height: 15px; color: var(--ash); }
  .wp-stat-card.accent .wp-stat-icon svg { color: var(--sage); }
  .wp-stat-label { font-size: 11px; font-weight: 700; color: var(--ash); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
  .wp-stat-card.accent .wp-stat-label { color: rgba(255,255,255,0.4); }
  .wp-stat-num {
    font-family: var(--fd); font-size: 36px; font-weight: 700;
    color: var(--ink); letter-spacing: -1px; line-height: 1;
  }
  .wp-stat-card.accent .wp-stat-num { color: var(--white); }
  .wp-stat-num span { color: var(--sage-deep); }
  .wp-stat-card.accent .wp-stat-num span { color: var(--sage); }

  /* Activity / measurements section */
  .wp-section-card {
    background: var(--white); border: 1px solid var(--cloud);
    border-radius: 18px; overflow: hidden;
    animation: wp-fadeUp 0.5s 0.22s var(--ease) both;
    opacity: 0;
  }
  .wp-section-card-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 24px 14px;
    border-bottom: 1px solid var(--cloud);
  }
  .wp-section-card-title-row { display: flex; align-items: center; gap: 10px; }
  .wp-section-card-icon {
    width: 28px; height: 28px; border-radius: 7px;
    background: var(--paper); border: 1px solid var(--cloud);
    display: flex; align-items: center; justify-content: center;
  }
  .wp-section-card-icon svg { width: 13px; height: 13px; color: var(--ash); }
  .wp-section-card-heading {
    font-size: 14px; font-weight: 700; color: var(--ink);
  }
  .wp-section-card-action {
    font-family: var(--fs); font-size: 12px; font-weight: 700;
    color: var(--sage-deep); background: var(--sage-light);
    border: 1px solid var(--sage-dark); border-radius: 7px;
    padding: 6px 14px; cursor: pointer; transition: all 0.18s;
    display: flex; align-items: center; gap: 5px;
  }
  .wp-section-card-action:hover { background: var(--sage); }
  .wp-section-card-action svg { width: 12px; height: 12px; }

  /* Measurement profile rows */
  .wp-meas-row {
    display: flex; align-items: center; gap: 16px;
    padding: 16px 24px;
    border-bottom: 1px solid var(--cloud);
    transition: background 0.15s;
  }
  .wp-meas-row:last-child { border-bottom: none; }
  .wp-meas-row:hover { background: var(--paper); }
  .wp-meas-emoji {
    width: 42px; height: 42px; border-radius: 11px;
    background: var(--paper); border: 1px solid var(--cloud);
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; flex-shrink: 0;
  }
  .wp-meas-row-body { flex: 1; }
  .wp-meas-row-name { font-size: 14px; font-weight: 700; color: var(--ink); margin-bottom: 3px; }
  .wp-meas-row-sub { font-size: 12px; color: var(--ash); }
  .wp-meas-bars { display: flex; gap: 5px; align-items: center; }
  .wp-meas-bar-seg {
    width: 28px; height: 4px; border-radius: 2px; background: var(--sage-dark);
    opacity: 0.35;
  }
  .wp-meas-bar-seg.filled { opacity: 1; }
  .wp-default-tag {
    background: var(--ink); color: var(--white);
    border-radius: 999px; padding: 3px 10px;
    font-size: 10px; font-weight: 800; letter-spacing: 0.3px;
    flex-shrink: 0;
  }
  .wp-meas-row-edit {
    font-family: var(--fs); font-size: 12px; font-weight: 700;
    color: var(--ash); background: var(--paper);
    border: 1px solid var(--cloud); border-radius: 7px;
    padding: 5px 12px; cursor: pointer; transition: all 0.18s;
    display: flex; align-items: center; gap: 5px; flex-shrink: 0;
  }
  .wp-meas-row-edit:hover { border-color: var(--ink); color: var(--ink); }
  .wp-meas-row-edit svg { width: 12px; height: 12px; }

  /* Empty meas state */
  .wp-meas-empty {
    padding: 48px 24px; text-align: center;
    display: flex; flex-direction: column; align-items: center; gap: 12px;
  }
  .wp-meas-empty-icon { font-size: 36px; }
  .wp-meas-empty-title { font-family: var(--fd); font-size: 18px; font-weight: 700; color: var(--ink); }
  .wp-meas-empty-sub { font-size: 13px; color: var(--ash); max-width: 280px; line-height: 1.6; }

  /* Brands section */
  .wp-brands-section {
    animation: wp-fadeUp 0.5s 0.28s var(--ease) both;
    opacity: 0;
  }
  .wp-brands-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 10px; padding: 20px 24px;
  }
  .wp-brand-chip {
    background: var(--paper); border: 1px solid var(--cloud);
    border-radius: 10px; padding: 10px 8px;
    text-align: center; font-size: 12px; font-weight: 700; color: var(--ash);
    transition: all 0.18s; cursor: default;
  }
  .wp-brand-chip:hover {
    background: var(--white); border-color: var(--ink);
    color: var(--ink); transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0,0,0,0.06);
  }
  .wp-brands-more {
    padding: 0 24px 20px;
    font-size: 12.5px; color: var(--ash);
  }
  .wp-brands-more a { color: var(--sage-deep); font-weight: 700; text-decoration: none; }

  /* Version */
  .wp-version {
    text-align: center; font-size: 12px; color: var(--mist);
    animation: wp-fadeUp 0.5s 0.34s var(--ease) both;
    opacity: 0;
  }

  /* ════════════════════════════════════
     KEYFRAMES
  ════════════════════════════════════ */
  @keyframes wp-fadeUp   { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
  @keyframes wp-fadeDown { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: none; } }
  @keyframes wp-popIn    { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
  @keyframes wp-ringPulse {
    0%   { opacity: 0; transform: scale(0.9); }
    40%  { opacity: 1; }
    100% { opacity: 0; transform: scale(1.25); }
  }
  @keyframes wp-pulseDot {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.5; }
  }
  @keyframes wp-meshShift {
    0%   { opacity: 1; }
    100% { opacity: 0.7; transform: scale(1.04) translate(10px, -8px); }
  }
  @keyframes wp-spin { to { transform: rotate(360deg); } }

  /* Simplified profile hub */
  .wp-simple-page {
    width: min(760px, 100%);
    margin: 0 auto;
    padding: 24px 24px calc(110px + env(safe-area-inset-bottom, 0px));
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .wp-simple-hero {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 18px;
    background: var(--white);
    border: 1px solid var(--cloud);
    border-radius: 18px;
  }

  .wp-simple-avatar {
    width: 62px;
    height: 62px;
    border-radius: 50%;
    background: var(--ink);
    color: var(--white);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;
    font-family: var(--fd);
    font-size: 22px;
    font-weight: 700;
  }

  .wp-simple-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .wp-simple-id {
    flex: 1;
    min-width: 0;
  }

  .wp-simple-name {
    font-family: var(--fd);
    font-size: 31px;
    font-weight: 700;
    line-height: 1;
    color: var(--ink);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .wp-simple-contact {
    margin-top: 7px;
    color: var(--ash);
    font-size: 13px;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .wp-simple-edit {
    min-height: 40px;
    padding: 0 14px;
    border: 0;
    border-radius: 12px;
    background: var(--ink);
    color: var(--white);
    font-family: var(--fs);
    font-size: 13px;
    font-weight: 800;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    cursor: pointer;
    flex-shrink: 0;
  }

  .wp-simple-edit svg {
    width: 14px;
    height: 14px;
  }

  .wp-simple-section {
    background: var(--white);
    border: 1px solid var(--cloud);
    border-radius: 16px;
    overflow: hidden;
  }

  .wp-simple-section-title {
    padding: 14px 16px 8px;
    color: var(--ash);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.6px;
    text-transform: uppercase;
  }

  .wp-simple-row {
    width: 100%;
    min-height: 58px;
    padding: 12px 16px;
    border: 0;
    border-top: 1px solid var(--cloud);
    background: transparent;
    display: flex;
    align-items: center;
    gap: 12px;
    text-align: left;
    font-family: var(--fs);
    cursor: pointer;
  }

  .wp-simple-row:first-of-type {
    border-top: 0;
  }

  .wp-simple-row:hover {
    background: var(--paper);
  }

  .wp-simple-row-icon {
    width: 36px;
    height: 36px;
    border-radius: 11px;
    background: var(--paper);
    border: 1px solid var(--cloud);
    color: var(--ash);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .wp-simple-row-icon svg {
    width: 15px;
    height: 15px;
  }

  .wp-simple-row-icon.accent {
    background: var(--sage-light);
    border-color: var(--sage-dark);
    color: var(--sage-deep);
  }

  .wp-simple-row-icon.danger {
    background: rgba(176,64,64,0.07);
    border-color: rgba(176,64,64,0.15);
    color: var(--red);
  }

  .wp-simple-row-copy {
    flex: 1;
    min-width: 0;
  }

  .wp-simple-row-label {
    color: var(--ink);
    font-size: 14px;
    font-weight: 800;
  }

  .wp-simple-row-sub {
    margin-top: 2px;
    color: var(--ash);
    font-size: 12px;
    line-height: 1.35;
  }

  .wp-simple-row.danger .wp-simple-row-label {
    color: var(--red);
  }

  .wp-simple-chevron {
    color: var(--mist);
    flex-shrink: 0;
  }

  .wp-simple-chevron svg {
    width: 15px;
    height: 15px;
  }

  .wp-simple-badge {
    flex-shrink: 0;
    min-width: 24px;
    padding: 4px 8px;
    border-radius: 999px;
    background: var(--sage-light);
    color: var(--sage-deep);
    font-size: 11px;
    font-weight: 800;
    text-align: center;
  }

  .wp-family-mini-form {
    padding: 12px 16px 16px;
    border-top: 1px solid var(--cloud);
    display: grid;
    gap: 10px;
  }

  .wp-family-mini-form input {
    width: 100%;
    min-height: 44px;
    padding: 0 12px;
    border: 1.5px solid var(--cloud);
    border-radius: 12px;
    background: var(--paper);
    color: var(--ink);
    font-family: var(--fs);
    font-size: 14px;
    outline: none;
  }

  .wp-family-mini-form input:focus {
    border-color: var(--ink);
    box-shadow: 0 0 0 3px rgba(13,13,13,0.06);
  }

  .wp-family-mini-actions {
    display: flex;
    gap: 9px;
  }

  .wp-family-mini-primary,
  .wp-family-mini-secondary {
    min-height: 42px;
    border-radius: 12px;
    font-family: var(--fs);
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;
  }

  .wp-family-mini-primary {
    flex: 1;
    border: 0;
    background: var(--ink);
    color: var(--white);
  }

  .wp-family-mini-primary:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .wp-family-mini-secondary {
    padding: 0 14px;
    border: 1.5px solid var(--cloud);
    background: var(--white);
    color: var(--ash);
  }

  .wp-family-mini-error {
    color: var(--red);
    font-size: 12px;
    font-weight: 700;
  }

  @media (max-width: 640px) {
    .wp-simple-page {
      padding: 16px 18px calc(110px + env(safe-area-inset-bottom, 0px));
      gap: 12px;
    }

    .wp-simple-hero {
      align-items: flex-start;
      padding: 15px;
      border-radius: 16px;
    }

    .wp-simple-avatar {
      width: 54px;
      height: 54px;
      font-size: 20px;
    }

    .wp-simple-name {
      font-size: 27px;
      white-space: normal;
    }

    .wp-simple-edit {
      width: 40px;
      padding: 0;
      font-size: 0;
    }

    .wp-simple-edit svg {
      width: 15px;
      height: 15px;
    }

    .wp-simple-row {
      min-height: 56px;
      padding: 11px 14px;
    }
  }
`;

const profilePageStyles = document.getElementById('wp-styles');
if (profilePageStyles) {
  profilePageStyles.textContent = CSS;
} else {
  const s = document.createElement('style');
  s.id = 'wp-styles';
  s.textContent = CSS;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────────
   Inline SVGs
───────────────────────────────────────────── */
const Ico = {
  Back:     () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M13 8H3M7 4l-4 4 4 4"/></svg>,
  Edit:     () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M11 2l3 3-8 8H3v-3L11 2z"/></svg>,
  User:     () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>,
  Ruler:    () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1" y="6" width="14" height="4" rx="1"/><path d="M4 6v2M7 6v3M10 6v2M13 6v3"/></svg>,
  Settings: () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="2.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M3.1 12.9l1.4-1.4M11.5 4.5l1.4-1.4"/></svg>,
  Logout:   () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10 11l4-3-4-3M14 8H6M6 3H3a1 1 0 00-1 1v8a1 1 0 001 1h3"/></svg>,
  Chevron:  () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 4l4 4-4 4"/></svg>,
  Mail:     () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="4" width="12" height="9" rx="1.5"/><path d="M2 5l6 5 6-5"/></svg>,
  Phone:    () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="4" y="1" width="8" height="14" rx="2"/><circle cx="8" cy="12" r="0.7" fill="currentColor" stroke="none"/></svg>,
  Shield:   () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 2l5 2v4c0 3-2.5 5.5-5 6-2.5-.5-5-3-5-6V4l5-2z"/></svg>,
  Help:     () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="6"/><path d="M6 6a2 2 0 114 0c0 1.5-2 1.5-2 3M8 13v.5"/></svg>,
  Plus:     () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 3v10M3 8h10"/></svg>,
  Star:     () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 2l1.5 3.5L13 6l-2.5 2.5.6 3.5L8 10.5 4.9 12l.6-3.5L3 6l3.5-.5L8 2z"/></svg>,
  Bag:      () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4h8l1 9H3L4 4z"/><path d="M6 4c0-1.1.9-2 2-2s2 .9 2 2"/></svg>,
  Camera:   () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1" y="4" width="14" height="10" rx="2"/><circle cx="8" cy="9" r="2.5"/><path d="M5 4l1-2h4l1 2"/></svg>,
};

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const CLOTHING_EMOJI: Record<string, string> = {
  tops: '👕', shirts: '👔', tshirts: '👕', blouses: '👚',
  bottoms: '👖', trousers: '👖', jeans: '👖', dresses: '👗',
  shoes: '👟', sneakers: '👟', boots: '🥾', default: '📏',
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
   Main Component
───────────────────────────────────────────── */
export function ProfilePage() {
  const navigate   = useNavigate();
  const { user }   = useAuth();
  const { familyMembers, selectedSubject, selectFamilyMember, selectSelf } = useProfileSubject();
  const { profile, measurementProfiles } = useRecommendationData(user?.uid, { subject: 'self' });
  const [signingOut, setSigningOut] = useState(false);
  const [showFamilyForm, setShowFamilyForm] = useState(false);
  const [familyName, setFamilyName] = useState('');
  const [familyRelation, setFamilyRelation] = useState('');
  const [familySaving, setFamilySaving] = useState(false);
  const [familyError, setFamilyError] = useState<string | null>(null);

  const fullName = useMemo(() =>
    `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim() || 'User',
    [profile]
  );
  const initials = useMemo(() =>
    `${profile?.firstName?.[0] ?? ''}${profile?.lastName?.[0] ?? ''}`.toUpperCase() || 'U',
    [profile]
  );

  const email    = String(profile?.email ?? user?.email ?? '');
  const phone    = String(profile?.phoneNumber ?? '');

  const openFamilyMeasurements = (memberId: string, route: '/app/measurements' | '/app/add-preference') => {
    selectFamilyMember(memberId);
    navigate(route);
  };

  const handleSignOut = async () => {
    try { setSigningOut(true); await signOutUser(); navigate('/auth/login', { replace: true }); }
    finally { setSigningOut(false); }
  };

  const handleAddFamilyMember = async () => {
    if (!user) return;

    const trimmedName = familyName.trim();
    const trimmedRelation = familyRelation.trim();
    if (!trimmedName || !trimmedRelation) {
      setFamilyError('Name and relation are required.');
      return;
    }

    try {
      setFamilySaving(true);
      setFamilyError(null);
      const memberId = await createFamilyMember({
        ownerUid: user.uid,
        firstName: trimmedName,
        relation: trimmedRelation,
      });
      selectFamilyMember(memberId);
      setFamilyName('');
      setFamilyRelation('');
      setShowFamilyForm(false);
      navigate('/app/add-preference');
    } catch (error) {
      setFamilyError(error instanceof Error ? error.message : 'Unable to add family member.');
    } finally {
      setFamilySaving(false);
    }
  };

  return (
    <div className="wp-root">
      <main className="wp-simple-page">
        <section className="wp-simple-hero">
          <div className="wp-simple-avatar">
            {profile?.photoURL
              ? <img src={profile.photoURL} alt={fullName} />
              : <span className="wp-avatar-initials">{initials}</span>
            }
          </div>
          <div className="wp-simple-id">
            <div className="wp-simple-name">{fullName}</div>
            <div className="wp-simple-contact">
              {email || phone || 'No contact info'}
            </div>
          </div>
          <button className="wp-simple-edit" type="button" onClick={() => navigate('/app/profile/edit')}>
            <Ico.Edit /> Edit
          </button>
        </section>

        <section className="wp-simple-section">
          <div className="wp-simple-section-title">Account</div>
          <button className="wp-simple-row" type="button" onClick={() => navigate('/app/profile/details')}>
            <div className="wp-simple-row-icon"><Ico.User /></div>
            <div className="wp-simple-row-copy">
              <div className="wp-simple-row-label">Personal details</div>
              <div className="wp-simple-row-sub">Name, email, phone, and profile photo</div>
            </div>
            <div className="wp-simple-chevron"><Ico.Chevron /></div>
          </button>
          <button className="wp-simple-row" type="button" onClick={() => navigate('/app/change-password')}>
            <div className="wp-simple-row-icon"><Ico.Shield /></div>
            <div className="wp-simple-row-copy">
              <div className="wp-simple-row-label">Change password</div>
              <div className="wp-simple-row-sub">Update your account password</div>
            </div>
            <div className="wp-simple-chevron"><Ico.Chevron /></div>
          </button>
          <button className="wp-simple-row" type="button" onClick={() => navigate('/app/settings')}>
            <div className="wp-simple-row-icon"><Ico.Settings /></div>
            <div className="wp-simple-row-copy">
              <div className="wp-simple-row-label">Notifications</div>
              <div className="wp-simple-row-sub">Manage alerts and account preferences</div>
            </div>
            <div className="wp-simple-chevron"><Ico.Chevron /></div>
          </button>
        </section>

        <section className="wp-simple-section">
          <div className="wp-simple-section-title">Measurements</div>
          <button
            className="wp-simple-row"
            type="button"
            onClick={() => {
              selectSelf();
              navigate('/app/measurements');
            }}>
            <div className="wp-simple-row-icon accent"><Ico.Ruler /></div>
            <div className="wp-simple-row-copy">
              <div className="wp-simple-row-label">My measurements</div>
              <div className="wp-simple-row-sub">
                {measurementProfiles.length
                  ? `${measurementProfiles.length} clothing categories saved`
                  : 'Add your first clothing category'}
              </div>
            </div>
            {measurementProfiles.length > 0 && (
              <span className="wp-simple-badge">{measurementProfiles.length}</span>
            )}
            <div className="wp-simple-chevron"><Ico.Chevron /></div>
          </button>
          <button
            className="wp-simple-row"
            type="button"
            onClick={() => {
              selectSelf();
              navigate('/app/add-preference');
            }}>
            <div className="wp-simple-row-icon accent"><Ico.Plus /></div>
            <div className="wp-simple-row-copy">
              <div className="wp-simple-row-label">Add measurements</div>
              <div className="wp-simple-row-sub">Add another clothing category</div>
            </div>
            <div className="wp-simple-chevron"><Ico.Chevron /></div>
          </button>
        </section>

        <section className="wp-simple-section">
          <div className="wp-simple-section-title">Family</div>
          {familyMembers.map((member) => {
            const isSelected = selectedSubject?.type === 'family' && selectedSubject.id === member.id;
            return (
              <button
                key={member.id}
                className="wp-simple-row"
                type="button"
                onClick={() => openFamilyMeasurements(member.id, '/app/measurements')}>
                <div className="wp-simple-row-icon"><Ico.User /></div>
                <div className="wp-simple-row-copy">
                  <div className="wp-simple-row-label">{member.firstName}</div>
                  <div className="wp-simple-row-sub">
                    {member.relation}{isSelected ? ' · selected' : ''}
                  </div>
                </div>
                {isSelected && <span className="wp-simple-badge">On</span>}
                <div className="wp-simple-chevron"><Ico.Chevron /></div>
              </button>
            );
          })}
          <button
            className="wp-simple-row"
            type="button"
            onClick={() => {
              setFamilyError(null);
              setShowFamilyForm((open) => !open);
            }}>
            <div className="wp-simple-row-icon accent"><Ico.Plus /></div>
            <div className="wp-simple-row-copy">
              <div className="wp-simple-row-label">Add family member</div>
              <div className="wp-simple-row-sub">
                {familyMembers.length
                  ? `${familyMembers.length} family profile${familyMembers.length === 1 ? '' : 's'} saved`
                  : 'Create a profile for someone else'}
              </div>
            </div>
            <div className="wp-simple-chevron"><Ico.Chevron /></div>
          </button>

          {showFamilyForm && (
            <div className="wp-family-mini-form">
              <input
                value={familyName}
                onChange={(event) => setFamilyName(event.target.value)}
                placeholder="Name"
              />
              <input
                value={familyRelation}
                onChange={(event) => setFamilyRelation(event.target.value)}
                placeholder="Relation"
              />
              {familyError && <div className="wp-family-mini-error">{familyError}</div>}
              <div className="wp-family-mini-actions">
                <button
                  className="wp-family-mini-primary"
                  type="button"
                  disabled={familySaving}
                  onClick={handleAddFamilyMember}>
                  {familySaving ? 'Saving...' : 'Save member'}
                </button>
                <button
                  className="wp-family-mini-secondary"
                  type="button"
                  onClick={() => {
                    setShowFamilyForm(false);
                    setFamilyError(null);
                    setFamilyName('');
                    setFamilyRelation('');
                  }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="wp-simple-section">
          <div className="wp-simple-section-title">App</div>
          <button className="wp-simple-row" type="button" onClick={() => navigate('/app/settings')}>
            <div className="wp-simple-row-icon"><Ico.Settings /></div>
            <div className="wp-simple-row-copy">
              <div className="wp-simple-row-label">Settings</div>
              <div className="wp-simple-row-sub">App preferences and account controls</div>
            </div>
            <div className="wp-simple-chevron"><Ico.Chevron /></div>
          </button>
          <button
            className="wp-simple-row danger"
            type="button"
            disabled={signingOut}
            onClick={handleSignOut}>
            <div className="wp-simple-row-icon danger"><Ico.Logout /></div>
            <div className="wp-simple-row-copy">
              <div className="wp-simple-row-label">
                {signingOut ? 'Signing out...' : 'Sign out'}
              </div>
              <div className="wp-simple-row-sub">Return to the login screen</div>
            </div>
            {!signingOut && <div className="wp-simple-chevron"><Ico.Chevron /></div>}
          </button>
        </section>
      </main>
    </div>
  );
}

export default ProfilePage;
