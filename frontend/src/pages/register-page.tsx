import {
  useMemo,
  useState,
  useEffect,
  useRef,
  type FormEvent,
  type JSX,
  type ReactNode,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { AppLogo } from '@/components/app-logo';
import {
  CLOTHING_OPTIONS_BY_GENDER,
  DEFAULT_MEASUREMENT_LABELS,
  getClothingTemplate,
  type ClothingChoice,
  type CustomerGender,
  type MeasurementField,
  type MeasurementFieldKey,
} from '@/lib/measurement';
import { requestOtpViaTextLk } from '@/lib/otp-client';
import {
  DEFAULT_PHONE_COUNTRY_CODE,
  getSriLankaLocalPhoneInput,
  isValidE164Phone,
  normalizePhoneForAuth,
} from '@/lib/phone-auth';
import { setOtpSession, setPendingRegistration } from '@/lib/auth-flow';

/* ─────────────────────────────────────────────
   Fonts + global CSS
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

  .rp-root {
    height: 100vh;
    min-height: 100vh;
    display: grid;
    grid-template-columns: 380px 1fr;
    font-family: var(--fs);
    background: var(--paper);
    overflow: hidden;
  }

  /* ── Left sidebar ── */
  .rp-sidebar {
    background: var(--ink);
    display: flex; flex-direction: column;
    justify-content: space-between;
    padding: 40px 36px;
    position: sticky; top: 0; height: 100vh;
    overflow: hidden;
  }
  .rp-sidebar-glow {
    position: absolute; inset: 0; pointer-events: none;
    background:
      radial-gradient(ellipse at 10% 15%, rgba(195,216,193,0.12) 0%, transparent 55%),
      radial-gradient(ellipse at 90% 85%, rgba(195,216,193,0.07) 0%, transparent 50%);
  }
  .rp-sidebar-grid {
    position: absolute; inset: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
    background-size: 44px 44px;
  }

  /* Brand */
  .rp-brand {
    display: flex; align-items: center; gap: 10px;
    position: relative; z-index: 1;
    text-decoration: none;
    animation: rp-fadeUp 0.5s 0.05s var(--ease) both;
  }
  .rp-brand-mark {
    width: 44px; height: 44px; border-radius: 12px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.16);
    box-shadow: 0 10px 24px rgba(0,0,0,0.18);
    overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .rp-brand-copy {
    display: flex;
    flex-direction: column;
    gap: 3px;
    line-height: 1;
  }
  .rp-brand-name {
    font-family: var(--fd); font-size: 19px; font-weight: 600;
    color: rgba(255,255,255,0.9); letter-spacing: -0.3px;
  }
  .rp-brand-tagline {
    font-size: 10px; font-weight: 600;
    color: rgba(195,216,193,0.85);
    letter-spacing: 0.35px;
    text-transform: uppercase;
  }

  /* Step list */
  .rp-step-list {
    position: relative; z-index: 1; flex: 1;
    display: flex; flex-direction: column; justify-content: center;
    gap: 0; padding: 40px 0;
  }
  .rp-step-item {
    display: flex; align-items: flex-start; gap: 16px;
    padding: 18px 0; position: relative;
  }
  .rp-step-item:not(:last-child)::after {
    content: '';
    position: absolute; left: 15px; top: 52px;
    width: 1px; height: calc(100% - 20px);
    background: rgba(255,255,255,0.08);
  }
  .rp-step-node {
    width: 32px; height: 32px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; transition: all 0.35s var(--ease);
    font-size: 12px; font-weight: 700;
    border: 1.5px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.04);
    color: rgba(255,255,255,0.3);
    position: relative; z-index: 1;
  }
  .rp-step-node.is-done {
    background: var(--sage-deep); border-color: var(--sage-deep);
    color: var(--white);
  }
  .rp-step-node.is-active {
    background: var(--white); border-color: var(--white);
    color: var(--ink);
    box-shadow: 0 0 0 4px rgba(255,255,255,0.08);
  }
  .rp-step-node svg { width: 13px; height: 13px; }
  .rp-step-text { padding-top: 5px; }
  .rp-step-label {
    font-size: 13px; font-weight: 600;
    transition: color 0.3s;
    color: rgba(255,255,255,0.3);
  }
  .rp-step-label.is-active { color: var(--white); }
  .rp-step-label.is-done { color: rgba(255,255,255,0.55); }
  .rp-step-desc { font-size: 12px; color: rgba(255,255,255,0.25); margin-top: 2px; line-height: 1.5; }

  /* Sidebar footer */
  .rp-sidebar-footer {
    position: relative; z-index: 1;
    padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.07);
    animation: rp-fadeUp 0.5s 0.3s var(--ease) both;
  }
  .rp-sidebar-footer p { font-size: 12px; color: rgba(255,255,255,0.3); line-height: 1.6; }
  .rp-sidebar-footer a { color: var(--sage); text-decoration: none; }
  .rp-sidebar-footer a:hover { text-decoration: underline; }

  /* ── Main content ── */
  .rp-main {
    display: flex; justify-content: center;
    padding: 48px 64px;
    height: 100vh;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .rp-phase-wrap {
    width: 100%; max-width: 560px;
    margin-block: auto;
  }

  /* Phase transition */
  .rp-phase-enter { animation: rp-slideIn 0.32s var(--ease) both; }
  .rp-phase-exit  { animation: rp-slideOut 0.22s var(--ease) both; }

  @keyframes rp-slideIn {
    from { opacity: 0; transform: translateX(32px); }
    to   { opacity: 1; transform: none; }
  }
  @keyframes rp-slideOut {
    from { opacity: 1; transform: none; }
    to   { opacity: 0; transform: translateX(-32px); }
  }
  @keyframes rp-slideInBack {
    from { opacity: 0; transform: translateX(-32px); }
    to   { opacity: 1; transform: none; }
  }

  /* Phase header */
  .rp-phase-header { margin-bottom: 36px; }
  .rp-phase-eyebrow {
    font-size: 11px; font-weight: 600; color: var(--sage-deep);
    letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 10px;
  }
  .rp-phase-title {
    font-family: var(--fd); font-size: 36px; font-weight: 700;
    color: var(--ink); letter-spacing: -0.8px; line-height: 1.1;
    margin-bottom: 10px;
  }
  .rp-phase-sub { font-size: 14px; color: var(--ash); line-height: 1.65; }

  /* Gender / Choice cards */
  .rp-choice-grid { display: flex; flex-direction: column; gap: 12px; margin-bottom: 32px; }

  .rp-choice-card {
    display: flex; align-items: center; gap: 16px;
    padding: 18px 20px;
    border: 1.5px solid var(--cloud);
    border-radius: 14px;
    background: var(--white);
    cursor: pointer; transition: all 0.2s var(--ease);
  }
  .rp-choice-card:hover { border-color: var(--mist); box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
  .rp-choice-card.is-selected {
    border-color: var(--ink);
    background: rgba(13,13,13,0.03);
    box-shadow: 0 0 0 3px rgba(13,13,13,0.06);
  }

  .rp-choice-icon {
    width: 42px; height: 42px; border-radius: 10px;
    background: var(--paper); border: 1px solid var(--cloud);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; font-size: 18px;
    transition: all 0.2s;
  }
  .rp-choice-card.is-selected .rp-choice-icon {
    background: var(--ink); border-color: var(--ink);
    color: var(--white);
  }
  .rp-choice-icon svg { width: 17px; height: 17px; }

  .rp-choice-text { flex: 1; }
  .rp-choice-title { font-size: 14px; font-weight: 600; color: var(--ink); margin-bottom: 2px; }
  .rp-choice-sub   { font-size: 12px; color: var(--ash); }

  .rp-choice-check {
    width: 22px; height: 22px; border-radius: 50%;
    border: 1.5px solid var(--cloud);
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
  }
  .rp-choice-card.is-selected .rp-choice-check {
    background: var(--ink); border-color: var(--ink);
  }
  .rp-choice-check svg { width: 11px; height: 11px; color: var(--white); opacity: 0; transition: opacity 0.15s; }
  .rp-choice-card.is-selected .rp-choice-check svg { opacity: 1; }

  /* Measurement guide card */
  .rp-measure-card {
    background: var(--white); border: 1px solid var(--cloud);
    border-radius: 16px; padding: 24px;
    display: flex; gap: 18px; margin-bottom: 24px;
    position: relative; overflow: hidden;
  }
  .rp-measure-card::before {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0;
    width: 4px; background: var(--sage-deep);
    border-radius: 16px 0 0 16px;
  }
  .rp-measure-icon-wrap {
    width: 44px; height: 44px; border-radius: 10px;
    background: var(--sage-light); border: 1px solid var(--sage-dark);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .rp-measure-icon-wrap svg { width: 18px; height: 18px; color: var(--sage-deep); }
  .rp-measure-card-body { flex: 1; }
  .rp-measure-card-label {
    font-size: 11px; font-weight: 600; color: var(--sage-deep);
    letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 4px;
  }
  .rp-measure-card-title { font-size: 16px; font-weight: 700; color: var(--ink); margin-bottom: 6px; }
  .rp-measure-card-body-text { font-size: 13px; color: var(--ash); line-height: 1.6; margin-bottom: 8px; }
  .rp-measure-tip {
    display: flex; align-items: flex-start; gap: 6px;
    font-size: 12px; color: var(--sage-deep); font-weight: 600;
  }
  .rp-measure-tip svg { width: 13px; height: 13px; flex-shrink: 0; margin-top: 1px; }

  /* Step mini-progress (inside guide phase) */
  .rp-sub-progress {
    display: flex; gap: 5px; margin-bottom: 24px;
  }
  .rp-sub-bar {
    height: 3px; border-radius: 2px;
    background: var(--cloud); flex: 1;
    transition: background 0.3s, flex 0.3s;
  }
  .rp-sub-bar.is-active { background: var(--ink); flex: 1.6; }
  .rp-sub-bar.is-done   { background: var(--sage-dark); }

  /* Required / optional badge */
  .rp-field-badge {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 10px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;
    padding: 3px 9px; border-radius: 999px;
    margin-left: 8px;
  }
  .rp-field-badge.required { background: rgba(13,13,13,0.07); color: var(--ink); }
  .rp-field-badge.optional { background: var(--cloud); color: var(--ash); }

  /* Inputs */
  .rp-label {
    display: flex; align-items: center;
    font-size: 12px; font-weight: 600; color: var(--ink);
    letter-spacing: 0.2px; margin-bottom: 8px;
  }
  .rp-input-wrap {
    display: flex; align-items: center;
    background: var(--white); border: 1.5px solid var(--cloud);
    border-radius: 12px; overflow: hidden;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .rp-input-wrap:focus-within {
    border-color: var(--ink);
    box-shadow: 0 0 0 3px rgba(13,13,13,0.06);
  }
  .rp-input-wrap.rp-error {
    border-color: var(--red);
    box-shadow: 0 0 0 3px rgba(192,57,43,0.07);
  }
  .rp-input-icon {
    padding: 0 14px; display: flex; align-items: center;
    color: var(--ash); flex-shrink: 0;
  }
  .rp-input-icon svg { width: 15px; height: 15px; }
  .rp-input-country {
    display: flex;
    align-items: center;
    height: 100%;
    padding: 0 14px 0 0;
    margin-right: 14px;
    border-right: 1px solid var(--cloud);
    color: var(--ink);
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.2px;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .rp-input-suffix {
    padding: 0 14px; font-size: 13px; font-weight: 600;
    color: var(--ash); flex-shrink: 0;
  }
  .rp-text-input {
    flex: 1; height: 50px; border: none; outline: none;
    background: transparent; font-family: var(--fs);
    font-size: 14px; font-weight: 500; color: var(--ink);
    padding: 0 16px;
  }
  .rp-text-input::placeholder { color: var(--mist); font-weight: 400; }
  .rp-text-input:not(:first-child) { padding-left: 0; }

  /* Two-col grid for names */
  .rp-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

  /* Unit toggle */
  .rp-unit-toggle {
    display: flex; background: var(--cloud); border-radius: 10px;
    padding: 4px; gap: 4px; width: fit-content;
  }
  .rp-unit-btn {
    font-family: var(--fs); font-size: 13px; font-weight: 600;
    padding: 8px 20px; border: none; border-radius: 7px;
    cursor: pointer; transition: all 0.2s;
    color: var(--ash); background: transparent;
  }
  .rp-unit-btn.is-active {
    background: var(--ink); color: var(--white);
  }

  /* Summary card */
  .rp-summary-card {
    display: flex; align-items: center; justify-content: space-between;
    background: var(--white); border: 1px solid var(--cloud);
    border-radius: 14px; padding: 16px 20px;
    margin-bottom: 28px;
  }
  .rp-summary-label { font-size: 11px; font-weight: 600; color: var(--ash); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .rp-summary-value { font-size: 15px; font-weight: 700; color: var(--ink); }
  .rp-summary-actions { display: flex; gap: 16px; }
  .rp-link-btn {
    font-family: var(--fs); font-size: 12px; font-weight: 600;
    color: var(--sage-deep); background: none; border: none;
    cursor: pointer; text-decoration: underline; text-underline-offset: 2px;
    transition: color 0.2s;
  }
  .rp-link-btn:hover { color: var(--ink); }

  /* Error banner */
  .rp-error-banner {
    display: flex; align-items: center; gap: 10px;
    background: rgba(192,57,43,0.06);
    border: 1px solid rgba(192,57,43,0.18);
    border-radius: 10px; padding: 12px 16px;
    font-size: 13px; color: var(--red);
    margin-bottom: 4px;
    animation: rp-shake 0.4s var(--ease);
  }
  .rp-error-banner svg { width: 15px; height: 15px; flex-shrink: 0; }

  /* Action row */
  .rp-actions {
    display: flex; align-items: center; gap: 12px; margin-top: 28px;
  }
  .rp-btn-back {
    font-family: var(--fs); font-size: 14px; font-weight: 600;
    color: var(--ash); background: var(--white);
    border: 1.5px solid var(--cloud); border-radius: 12px;
    padding: 0 20px; height: 50px; cursor: pointer;
    display: flex; align-items: center; gap: 8px;
    transition: all 0.2s;
  }
  .rp-btn-back:hover { border-color: var(--mist); color: var(--ink); }
  .rp-btn-next {
    flex: 1; height: 50px;
    font-family: var(--fs); font-size: 14px; font-weight: 600;
    color: var(--white); background: var(--ink);
    border: none; border-radius: 12px; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    box-shadow: 0 4px 16px rgba(13,13,13,0.18);
    transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
  }
  .rp-btn-next:hover:not(:disabled) {
    opacity: 0.88; transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(13,13,13,0.22);
  }
  .rp-btn-next:active:not(:disabled) { transform: scale(0.98); }
  .rp-btn-next:disabled { opacity: 0.4; cursor: not-allowed; }
  .rp-btn-next svg { width: 16px; height: 16px; }
  .rp-btn-next-solo { /* no back button */ border-radius: 12px; }

  /* Spinner */
  .rp-spinner {
    width: 16px; height: 16px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: var(--white);
    animation: rp-spin 0.7s linear infinite;
  }

  /* Form fields gap */
  .rp-fields { display: flex; flex-direction: column; gap: 18px; }

  /* Keyframes */
  @keyframes rp-fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: none; }
  }
  @keyframes rp-shake {
    0%,100% { transform: translateX(0); }
    20% { transform: translateX(-6px); }
    40% { transform: translateX(6px); }
    60% { transform: translateX(-4px); }
    80% { transform: translateX(4px); }
  }
  @keyframes rp-spin { to { transform: rotate(360deg); } }

  @media (max-width: 960px) {
    .rp-root {
      height: auto;
      min-height: 100vh;
      grid-template-columns: 1fr;
      overflow: visible;
    }

    .rp-sidebar {
      position: sticky;
      top: 0;
      z-index: 20;
      height: auto;
      padding: 14px 20px;
      gap: 12px;
      flex-direction: row;
      align-items: center;
      justify-content: flex-start;
      background: rgba(250,250,248,0.96);
      backdrop-filter: blur(14px);
      border-bottom: 1px solid var(--cloud);
    }

    .rp-sidebar-glow,
    .rp-sidebar-grid,
    .rp-step-list,
    .rp-sidebar-footer {
      display: none;
    }

    .rp-brand-mark {
      background: var(--white);
      border-color: var(--cloud);
      box-shadow: 0 6px 16px rgba(13,13,13,0.08);
    }

    .rp-brand-name {
      color: var(--ink);
    }

    .rp-brand-tagline {
      color: var(--sage-deep);
    }

    .rp-main {
      height: auto;
      min-height: auto;
      padding: 24px 20px 40px;
      overflow: visible;
    }

    .rp-phase-wrap {
      max-width: 100%;
      margin-block: 0;
    }

    .rp-two-col {
      grid-template-columns: 1fr;
    }

    .rp-summary-card {
      flex-direction: column;
      align-items: flex-start;
      gap: 14px;
    }

    .rp-summary-actions {
      flex-wrap: wrap;
      gap: 10px;
    }

    .rp-unit-toggle {
      width: 100%;
    }

    .rp-unit-btn {
      flex: 1 1 0;
      min-width: 0;
    }

    .rp-actions {
      flex-direction: column;
      align-items: stretch;
      gap: 10px;
    }

    .rp-btn-back,
    .rp-btn-next {
      width: 100%;
      justify-content: center;
    }
  }

  @media (max-width: 640px) {
    .rp-sidebar {
      padding: 12px 16px;
    }

    .rp-brand-mark {
      width: 40px;
      height: 40px;
      border-radius: 10px;
    }

    .rp-brand-name {
      font-size: 18px;
    }

    .rp-brand-tagline {
      font-size: 9px;
    }

    .rp-main {
      padding: 18px 16px 40px;
    }

    .rp-phase-header {
      margin-bottom: 28px;
    }

    .rp-phase-title {
      font-size: clamp(28px, 11vw, 40px);
    }

    .rp-phase-sub {
      font-size: 14px;
    }

    .rp-choice-card {
      padding: 16px;
      gap: 14px;
    }

    .rp-choice-icon {
      width: 38px;
      height: 38px;
    }

    .rp-measure-card {
      flex-direction: column;
      gap: 14px;
      padding: 20px;
    }

    .rp-measure-icon-wrap {
      width: 40px;
      height: 40px;
    }

    .rp-summary-card {
      padding: 16px;
    }

    .rp-summary-actions {
      width: 100%;
    }

    .rp-summary-actions > * {
      flex: 1 1 140px;
    }

    .rp-unit-toggle {
      padding: 3px;
      gap: 3px;
    }

    .rp-unit-btn {
      padding: 10px 12px;
    }

    .rp-fields {
      gap: 16px;
    }

    .rp-actions {
      align-items: stretch;
    }

    .rp-btn-next {
      order: 1;
      width: 100%;
    }

    .rp-btn-back {
      order: 2;
      width: auto;
      min-width: 112px;
      align-self: flex-end;
      justify-content: center;
      padding: 0 18px;
    }

    .rp-btn-back svg {
      width: 12px;
      height: 12px;
    }
  }
`;

if (!document.getElementById('rp-styles')) {
  const s = document.createElement('style');
  s.id = 'rp-styles';
  s.textContent = CSS;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────────
   Inline SVG icons
───────────────────────────────────────────── */
const Ico = {
  Check:  () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 8l3.5 3.5L13 5"/></svg>,
  Arrow:  () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg>,
  Back:   () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M13 8H3M7 4l-4 4 4 4"/></svg>,
  User:   () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>,
  Bag:    () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4h8l1 9H3L4 4z"/><path d="M6 4c0-1.1.9-2 2-2s2 .9 2 2"/></svg>,
  Ruler:  () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1" y="6" width="14" height="4" rx="1"/><path d="M4 6v2M7 6v3M10 6v2M13 6v3"/></svg>,
  Mail:   () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="4" width="12" height="9" rx="1.5"/><path d="M2 5l6 5 6-5"/></svg>,
  Phone:  () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="4" y="1" width="8" height="14" rx="2"/><circle cx="8" cy="12" r="0.7" fill="currentColor" stroke="none"/></svg>,
  Lock:   () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="7" width="10" height="8" rx="2"/><path d="M5 7V5a3 3 0 016 0v2"/></svg>,
  Alert:  () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="6"/><path d="M8 5v4M8 11v.5"/></svg>,
  Bulb:   () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 2a4 4 0 014 4c0 1.7-.9 3.1-2 4v1H6v-1c-1.1-.9-2-2.3-2-4a4 4 0 014-4z"/><path d="M6 13h4"/></svg>,
  Form:   () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5 6h6M5 9h4"/></svg>,
};

/* ─────────────────────────────────────────────
   Phase config
───────────────────────────────────────────── */
type Phase = 'gender' | 'preference' | 'guide' | 'form';
const PHASES: Phase[] = ['gender', 'preference', 'guide', 'form'];

const PHASE_META: Record<Phase, { label: string; desc: string; icon: () => JSX.Element }> = {
  gender:     { label: 'About you',    desc: 'Gender & preferences',   icon: Ico.User  },
  preference: { label: 'Clothing',     desc: 'What you are shopping',  icon: Ico.Bag   },
  guide:      { label: 'Measurements', desc: 'Body measurements',      icon: Ico.Ruler },
  form:       { label: 'Your account', desc: 'Name, email & password', icon: Ico.Form  },
};

const parsePositiveNumber = (v: unknown) => {
  const p = Number.parseFloat(String(v ?? ''));
  return Number.isFinite(p) && p > 0 ? p : null;
};

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */
function PhaseHeader({ phase, title, sub }: { phase: Phase; title: ReactNode; sub: ReactNode }) {
  const idx = PHASES.indexOf(phase);
  return (
    <div className="rp-phase-header">
      <div className="rp-phase-eyebrow">Step {idx + 1} of 4 · {PHASE_META[phase].label}</div>
      <h1 className="rp-phase-title">{title}</h1>
      <p className="rp-phase-sub">{sub}</p>
    </div>
  );
}

function ChoiceCard({ selected, title, sub, icon, onClick }: {
  selected: boolean;
  title: ReactNode;
  sub?: ReactNode;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <div className={`rp-choice-card${selected ? ' is-selected' : ''}`} onClick={onClick}>
      <div className="rp-choice-icon">{icon}</div>
      <div className="rp-choice-text">
        <div className="rp-choice-title">{title}</div>
        {sub && <div className="rp-choice-sub">{sub}</div>}
      </div>
      <div className="rp-choice-check">
        <Ico.Check />
      </div>
    </div>
  );
}

function InputWrap({ icon, suffix, error = false, children }: {
  icon?: ReactNode;
  suffix?: ReactNode;
  error?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`rp-input-wrap${error ? ' rp-error' : ''}`}>
      {icon && <div className="rp-input-icon">{icon}</div>}
      {children}
      {suffix && <div className="rp-input-suffix">{suffix}</div>}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Animated phase container
───────────────────────────────────────────── */
function PhaseContainer({ phaseKey, dir, children }: {
  phaseKey: string;
  dir: 'fwd' | 'back';
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.animation = 'none';
    el.offsetHeight; // reflow
    el.style.animation = dir === 'back'
      ? 'rp-slideInBack 0.32s var(--ease) both'
      : 'rp-slideIn 0.32s var(--ease) both';
  }, [phaseKey]);

  return <div ref={ref} className="rp-phase-wrap">{children}</div>;
}

/* ─────────────────────────────────────────────
   Main RegisterPage
───────────────────────────────────────────── */
export function RegisterPage() {
  const navigate = useNavigate();

  const [phase,       setPhase]       = useState<Phase>('gender');
  const [dir,         setDir]         = useState<'fwd' | 'back'>('fwd');
  const [stepIndex,   setStepIndex]   = useState(0);
  const [gender,      setGender]      = useState<CustomerGender | null>(null);
  const [clothing,    setClothing]    = useState<ClothingChoice | null>(null);
  const [unit,        setUnit]        = useState<'cm' | 'in'>('cm');
  const [measurements, setMeasurements] = useState<Partial<Record<MeasurementFieldKey, string>>>({});
  const [firstName,   setFirstName]   = useState('');
  const [lastName,    setLastName]    = useState('');
  const [email,       setEmail]       = useState('');
  const [phone,       setPhone]       = useState('');
  const [password,    setPassword]    = useState('');
  const [confirmPw,   setConfirmPw]   = useState('');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [errorKey,    setErrorKey]    = useState(0);

  const clothingOptions = gender ? CLOTHING_OPTIONS_BY_GENDER[gender] : [];
  const template = useMemo(() => getClothingTemplate(gender, clothing), [gender, clothing]);
  const steps = template?.fields ?? [];
  const currentStep = steps[stepIndex] ?? null;
  const selectedOption = clothingOptions.find(o => o.key === clothing) ?? null;

  const go = (next: Phase, direction: 'fwd' | 'back' = 'fwd') => {
    setError(null);
    setDir(direction);
    setPhase(next);
  };

  const showError = (msg: string) => {
    setError(msg);
    setErrorKey(k => k + 1);
  };

  const handleGuideNext = () => {
    if (!currentStep) return;
    if (currentStep.isPrimary && parsePositiveNumber(measurements[currentStep.key]) === null) {
      showError(`${currentStep.label} is required to continue.`); return;
    }
    setError(null);
    if (stepIndex === steps.length - 1) { go('form'); return; }
    setDir('fwd');
    setStepIndex(i => i + 1);
  };

  const handleGuidePrev = () => {
    setError(null);
    if (stepIndex === 0) { go('preference', 'back'); return; }
    setDir('back');
    setStepIndex(i => i - 1);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!template || !gender || !clothing || !selectedOption) return;
    const normalizedPhone = normalizePhoneForAuth(phone);
    if (!firstName.trim() || !lastName.trim() || !normalizedPhone) {
      showError('First name, last name, and phone number are required.'); return;
    }
    if (!isValidE164Phone(normalizedPhone)) {
      showError('Enter a valid Sri Lankan mobile number.'); return;
    }
    if (password.length < 6) { showError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPw) { showError('Passwords do not match.'); return; }

    try {
      setLoading(true); setError(null);
      setPendingRegistration({
        firstName: firstName.trim(), lastName: lastName.trim(),
        email: email.trim(), phoneNumber: normalizedPhone, password,
        gender, preferredClothing: clothing,
        preferredClothingLabel: selectedOption.label,
        measurementProfileKey: template.profileKey, unit,
        measurements: Object.fromEntries(template.fields.map(f => [f.key, measurements[f.key] ?? ''])),
        primaryMeasurementKeys: template.fields.filter(f => f.isPrimary).map(f => f.key),
        measurementDisplayNames: Object.fromEntries(template.fields.map(f => [f.key, f.label])),
      });
      const session = await requestOtpViaTextLk(normalizedPhone, 'signup');
      setOtpSession(session);
      navigate('/auth/otp');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Unable to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const phaseIdx = PHASES.indexOf(phase);

  return (
    <div className="rp-root">

      {/* ── Sidebar ── */}
      <aside className="rp-sidebar">
        <div className="rp-sidebar-glow" />
        <div className="rp-sidebar-grid" />

        <Link to="/" className="rp-brand">
          <div className="rp-brand-mark"><AppLogo size={36} decorative /></div>
          <div className="rp-brand-copy">
            <span className="rp-brand-name">MatchMySize</span>
            <span className="rp-brand-tagline">Find Your Perfect Fit</span>
          </div>
        </Link>

        <nav className="rp-step-list">
          {PHASES.map((p, i) => {
            const done   = i < phaseIdx;
            const active = i === phaseIdx;
            const Icon   = PHASE_META[p].icon;
            return (
              <div key={p} className="rp-step-item">
                <div className={`rp-step-node${done ? ' is-done' : active ? ' is-active' : ''}`}>
                  {done ? <Ico.Check /> : <Icon />}
                </div>
                <div className="rp-step-text">
                  <div className={`rp-step-label${done ? ' is-done' : active ? ' is-active' : ''}`}>
                    {PHASE_META[p].label}
                  </div>
                  <div className="rp-step-desc">{PHASE_META[p].desc}</div>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="rp-sidebar-footer">
          <p>
            Already have an account?{' '}
            <Link to="/auth/login">Sign in</Link>
          </p>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="rp-main">
        <PhaseContainer phaseKey={`${phase}-${stepIndex}`} dir={dir}>

          {/* ── Phase 1: Gender ── */}
          {phase === 'gender' && (
            <>
              <PhaseHeader
                phase="gender"
                title="Tell us about you"
                sub="Choose your gender so we can tailor clothing options and measurement guides."
              />
              <div className="rp-choice-grid">
                <ChoiceCard
                  selected={gender === 'men'}
                  title="Men"
                  sub="Men's sizing charts and clothing options"
                  icon={<Ico.User />}
                  onClick={() => setGender('men')}
                />
                <ChoiceCard
                  selected={gender === 'women'}
                  title="Women"
                  sub="Women's sizing charts and clothing options"
                  icon={<Ico.User />}
                  onClick={() => setGender('women')}
                />
              </div>
              <div className="rp-actions">
                <button className="rp-btn-next" disabled={!gender} onClick={() => go('preference')}>
                  Continue <Ico.Arrow />
                </button>
              </div>
            </>
          )}

          {/* ── Phase 2: Preference ── */}
          {phase === 'preference' && (
            <>
              <PhaseHeader
                phase="preference"
                title="What are you shopping for?"
                sub="Pick one category to start. You can add more measurements later from your profile."
              />
              <div className="rp-choice-grid">
                {clothingOptions.map(opt => (
                  <ChoiceCard
                    key={opt.key}
                    selected={clothing === opt.key}
                    title={opt.label}
                    sub={opt.subtitle}
                    icon={<Ico.Bag />}
                    onClick={() => setClothing(opt.key)}
                  />
                ))}
              </div>
              <div className="rp-actions">
                <button className="rp-btn-back" onClick={() => go('gender', 'back')}>
                  <Ico.Back /> Back
                </button>
                <button
                  className="rp-btn-next"
                  disabled={!clothing}
                  onClick={() => { setStepIndex(0); go('guide'); }}>
                  Continue <Ico.Arrow />
                </button>
              </div>
            </>
          )}

          {/* ── Phase 3: Guide ── */}
          {phase === 'guide' && currentStep && (
            <>
              <PhaseHeader
                phase="guide"
                title={`Measure ${template?.label ?? 'your item'}`}
                sub={`Step ${stepIndex + 1} of ${steps.length} · ${currentStep.isPrimary ? 'Required measurement' : 'Optional but recommended'}`}
              />

              {/* Sub-step progress */}
              <div className="rp-sub-progress">
                {steps.map((s, i) => (
                  <div
                    key={s.key}
                    className={`rp-sub-bar${i === stepIndex ? ' is-active' : i < stepIndex ? ' is-done' : ''}`}
                  />
                ))}
              </div>

              {/* Measurement guide card */}
              <div className="rp-measure-card">
                <div className="rp-measure-icon-wrap"><Ico.Ruler /></div>
                <div className="rp-measure-card-body">
                  <div className="rp-measure-card-label">
                    {currentStep.isPrimary ? 'Required' : 'Optional'}
                  </div>
                  <div className="rp-measure-card-title">{currentStep.label}</div>
                  <div className="rp-measure-card-body-text">{currentStep.body}</div>
                  {currentStep.tip && (
                    <div className="rp-measure-tip">
                      <Ico.Bulb /> {currentStep.tip}
                    </div>
                  )}
                </div>
              </div>

              {/* Input */}
              <div style={{ marginBottom: 24 }}>
                <label className="rp-label">
                  {currentStep.label}
                  <span className={`rp-field-badge ${currentStep.isPrimary ? 'required' : 'optional'}`}>
                    {currentStep.isPrimary ? 'Required' : 'Optional'}
                  </span>
                </label>
                <InputWrap suffix={unit} error={!!error}>
                  <input
                    className="rp-text-input"
                    inputMode="decimal"
                    placeholder={`Enter ${currentStep.label.toLowerCase()} in ${unit}`}
                    value={measurements[currentStep.key] ?? ''}
                    onChange={e => setMeasurements(m => ({ ...m, [currentStep.key]: e.target.value }))}
                  />
                </InputWrap>
              </div>

              {error && (
                <div className="rp-error-banner" key={errorKey}>
                  <Ico.Alert /> {error}
                </div>
              )}

              <div className="rp-actions">
                <button className="rp-btn-back" onClick={handleGuidePrev}>
                  <Ico.Back /> Back
                </button>
                <button className="rp-btn-next" onClick={handleGuideNext}>
                  {stepIndex === steps.length - 1 ? <>Continue <Ico.Arrow /></> : <>Next <Ico.Arrow /></>}
                </button>
              </div>
            </>
          )}

          {/* ── Phase 4: Form ── */}
          {phase === 'form' && (
            <>
              <PhaseHeader
                phase="form"
                title="Create your account"
                sub="Almost done — just fill in your details to finish setting up."
              />

              {/* Summary card */}
              <div className="rp-summary-card">
                <div>
                  <div className="rp-summary-label">Your profile</div>
                  <div className="rp-summary-value">{selectedOption?.label ?? 'Selected'}</div>
                </div>
                <div className="rp-summary-actions">
                  <button className="rp-link-btn" onClick={() => go('guide', 'back')}>Edit measurements</button>
                  <button className="rp-link-btn" onClick={() => go('preference', 'back')}>Change clothing</button>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="rp-fields">

                  {/* Name row */}
                  <div className="rp-two-col">
                    <div>
                      <label className="rp-label">First name</label>
                      <InputWrap>
                        <input className="rp-text-input" placeholder="First name" value={firstName} onChange={e => setFirstName(e.target.value)} />
                      </InputWrap>
                    </div>
                    <div>
                      <label className="rp-label">Last name</label>
                      <InputWrap>
                        <input className="rp-text-input" placeholder="Last name" value={lastName} onChange={e => setLastName(e.target.value)} />
                      </InputWrap>
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="rp-label">Email <span style={{color:'var(--ash)',fontWeight:400}}>(optional)</span></label>
                    <InputWrap icon={<Ico.Mail />}>
                      <input className="rp-text-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                    </InputWrap>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="rp-label">Phone number</label>
                    <InputWrap icon={<Ico.Phone />}>
                      <div className="rp-input-country">{DEFAULT_PHONE_COUNTRY_CODE}</div>
                      <input
                        className="rp-text-input"
                        type="tel"
                        inputMode="numeric"
                        maxLength={9}
                        placeholder="77xxxxxxx"
                        value={phone}
                        onChange={e => setPhone(getSriLankaLocalPhoneInput(e.target.value))}
                        autoComplete="tel"
                      />
                    </InputWrap>
                  </div>

                  {/* Unit toggle */}
                  <div>
                    <label className="rp-label">Measurement unit</label>
                    <div className="rp-unit-toggle">
                      <button type="button" className={`rp-unit-btn${unit === 'cm' ? ' is-active' : ''}`} onClick={() => setUnit('cm')}>Centimetres</button>
                      <button type="button" className={`rp-unit-btn${unit === 'in' ? ' is-active' : ''}`} onClick={() => setUnit('in')}>Inches</button>
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="rp-label">Password</label>
                    <InputWrap icon={<Ico.Lock />} error={!!error && error.includes('assword')}>
                      <input className="rp-text-input" type="password" placeholder="Minimum 6 characters" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
                    </InputWrap>
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label className="rp-label">Confirm password</label>
                    <InputWrap icon={<Ico.Lock />} error={!!error && error.includes('match')}>
                      <input className="rp-text-input" type="password" placeholder="Re-enter password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} autoComplete="new-password" />
                    </InputWrap>
                  </div>

                  {error && (
                    <div className="rp-error-banner" key={errorKey}>
                      <Ico.Alert /> {error}
                    </div>
                  )}

                  <div className="rp-actions" style={{ marginTop: 8 }}>
                    <button type="button" className="rp-btn-back" onClick={() => go('guide', 'back')}>
                      <Ico.Back /> Back
                    </button>
                    <button type="submit" className="rp-btn-next" disabled={loading}>
                      {loading
                        ? <><div className="rp-spinner" /> Sending code…</>
                        : <>Send verification code <Ico.Arrow /></>
                      }
                    </button>
                  </div>

                </div>
              </form>
            </>
          )}

        </PhaseContainer>
      </main>
    </div>
  );
}

export default RegisterPage;
