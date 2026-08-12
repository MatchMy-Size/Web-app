import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import clothesIcon from '@/assets/images/clothes.png';
import { useAuth } from '@/context/auth-context';
import {
  buildPairSuggestions,
  resolveBrandDisplay,
  type EnrichedRecommendation,
} from '@/lib/recommendation-view';
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

  .ep-root {
    min-height: 100vh;
    background: var(--paper);
    font-family: var(--fs);
  }

  /* ── Topbar ── */
  .ep-topbar {
    position: sticky; top: 0; z-index: 50;
    height: 64px;
    background: rgba(250,250,248,0.92);
    backdrop-filter: blur(14px);
    border-bottom: 1px solid var(--cloud);
    display: flex; align-items: center;
    padding: 0 48px; gap: 16px;
    animation: ep-fadeDown 0.5s var(--ease) both;
  }
  .ep-topbar-back {
    display: flex; align-items: center; gap: 7px;
    font-family: var(--fs); font-size: 13px; font-weight: 600;
    color: var(--ash); background: none; border: none;
    cursor: pointer; padding: 8px 14px; border-radius: 8px;
    transition: all 0.18s;
  }
  .ep-topbar-back:hover { background: var(--cloud); color: var(--ink); }
  .ep-topbar-back svg { width: 14px; height: 14px; }
  .ep-topbar-divider { width: 1px; height: 22px; background: var(--cloud); }
  .ep-topbar-title {
    font-family: var(--fd); font-size: 20px; font-weight: 700;
    color: var(--ink); letter-spacing: -0.4px;
  }
  .ep-topbar-sub { font-size: 13px; color: var(--ash); }

  /* Mode toggle in topbar */
  .ep-mode-toggle {
    margin-left: auto;
    display: flex; background: var(--cloud);
    border-radius: 10px; padding: 3px; gap: 3px;
  }
  .ep-mode-btn {
    font-family: var(--fs); font-size: 12.5px; font-weight: 600;
    padding: 7px 18px; border: none; border-radius: 7px;
    cursor: pointer; transition: all 0.2s var(--ease);
    color: var(--ash); background: transparent; white-space: nowrap;
  }
  .ep-mode-btn.active {
    background: var(--ink); color: var(--white);
    box-shadow: 0 2px 8px rgba(13,13,13,0.18);
  }

  /* ── Body ── */
  .ep-body {
    max-width: 1280px; margin: 0 auto;
    padding: 40px 48px 80px;
    display: flex; flex-direction: column; gap: 32px;
  }

  /* ── Page header ── */
  .ep-header {
    animation: ep-fadeUp 0.5s 0.05s var(--ease) both;
  }
  .ep-header-eyebrow {
    font-size: 11px; font-weight: 700; color: var(--sage-deep);
    letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 10px;
    display: flex; align-items: center; gap: 8px;
  }
  .ep-header-eyebrow-line { width: 28px; height: 1.5px; background: var(--sage-deep); }
  .ep-page-title {
    font-family: var(--fd); font-size: clamp(32px, 3.5vw, 48px);
    font-weight: 700; color: var(--ink); letter-spacing: -0.8px;
    line-height: 1.08; margin-bottom: 10px;
  }
  .ep-page-title em { font-style: italic; color: var(--sage-deep); }
  .ep-page-sub { font-size: 14.5px; color: var(--ash); line-height: 1.65; max-width: 560px; }

  /* ── Category selector ── */
  .ep-category-bar {
    display: flex; flex-direction: column; gap: 12px;
    animation: ep-fadeUp 0.5s 0.12s var(--ease) both;
  }
  .ep-category-label {
    font-size: 11px; font-weight: 700; color: var(--ash);
    text-transform: uppercase; letter-spacing: 0.7px;
    display: flex; align-items: center; gap: 8px;
  }
  .ep-category-label-hint {
    font-size: 11px; font-weight: 500; color: var(--mist);
    background: var(--cloud); border-radius: 999px;
    padding: 2px 8px; font-weight: 500;
    text-transform: none; letter-spacing: 0;
  }

  .ep-category-chips {
    display: flex; flex-wrap: wrap; gap: 8px;
  }
  .ep-chip {
    display: flex; align-items: center; gap: 7px;
    font-family: var(--fs); font-size: 13px; font-weight: 600;
    padding: 8px 16px; border-radius: 999px;
    border: 1.5px solid var(--cloud);
    background: var(--white); color: var(--ash);
    cursor: pointer; transition: all 0.2s var(--ease);
    white-space: nowrap;
  }
  .ep-chip:hover:not(.active):not(.add) { border-color: var(--mist); color: var(--ink); transform: translateY(-1px); }
  .ep-chip.active {
    background: var(--ink); border-color: var(--ink); color: var(--white);
    box-shadow: 0 4px 12px rgba(13,13,13,0.18);
  }
  .ep-chip.add {
    border-style: dashed; border-color: var(--sage-dark);
    background: var(--sage-light); color: var(--sage-deep);
  }
  .ep-chip.add:hover { background: var(--sage); }
  .ep-chip-count {
    font-size: 10px; font-weight: 800;
    background: rgba(255,255,255,0.22);
    border-radius: 999px; padding: 1px 6px; min-width: 18px; text-align: center;
  }
  .ep-chip:not(.active) .ep-chip-count { background: var(--cloud); color: var(--ash); }
  .ep-chip svg { width: 13px; height: 13px; }

  /* ── Mode content slide ── */
  .ep-content { animation: ep-slideIn 0.32s var(--ease) both; }

  /* ── Compare2 grid ── */
  .ep-compare-grid {
    display: flex; flex-direction: column; gap: 20px;
  }

  .ep-pair-card {
    background: var(--white); border: 1px solid var(--cloud);
    border-radius: 20px; overflow: hidden;
    transition: box-shadow 0.22s, transform 0.22s;
  }
  .ep-pair-card:hover { transform: translateY(-3px); box-shadow: 0 16px 48px rgba(0,0,0,0.08); }

  .ep-pair-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 24px 14px;
    border-bottom: 1px solid var(--cloud);
  }
  .ep-pair-score-wrap { display: flex; align-items: center; gap: 10px; }
  .ep-pair-score-label { font-size: 12px; font-weight: 600; color: var(--ash); }
  .ep-pair-score {
    font-family: var(--fd); font-size: 26px; font-weight: 700;
    color: var(--ink); letter-spacing: -0.5px; line-height: 1;
  }
  .ep-pair-score span { color: var(--sage-deep); }
  .ep-pair-score-bar-wrap {
    flex: 1; max-width: 200px; height: 6px;
    background: var(--cloud); border-radius: 999px; overflow: hidden;
  }
  .ep-pair-score-bar {
    height: 100%; border-radius: 999px; background: var(--sage-deep);
    animation: ep-growBar 1s var(--ease) both;
  }
  .ep-pair-badge {
    font-size: 11px; font-weight: 800; padding: 4px 12px;
    border-radius: 999px;
  }
  .ep-pair-badge.perfect { background: var(--ink); color: var(--white); }
  .ep-pair-badge.great   { background: var(--sage-light); color: var(--sage-deep); border: 1px solid var(--sage-dark); }
  .ep-pair-badge.fair    { background: var(--cloud); color: var(--ash); }

  .ep-pair-columns {
    display: grid; grid-template-columns: 1fr auto 1fr;
    gap: 0; align-items: stretch;
  }
  .ep-pair-vs {
    display: flex; align-items: center; justify-content: center;
    padding: 20px 0;
    border-left: 1px solid var(--cloud);
    border-right: 1px solid var(--cloud);
  }
  .ep-pair-vs-badge {
    width: 32px; height: 32px; border-radius: 50%;
    background: var(--paper); border: 1px solid var(--cloud);
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 800; color: var(--ash);
    letter-spacing: 0.3px;
  }

  /* Item card inside pair */
  .ep-item-card { padding: 20px 24px; }
  .ep-item-brand {
    font-size: 10px; font-weight: 700; color: var(--ash);
    letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 4px;
  }
  .ep-item-title { font-size: 14px; font-weight: 600; color: var(--ink); margin-bottom: 4px; line-height: 1.35; }
  .ep-item-sub   { font-size: 12px; color: var(--ash); margin-bottom: 14px; }
  .ep-item-footer { display: flex; align-items: center; justify-content: space-between; }
  .ep-item-size-wrap { display: flex; align-items: baseline; gap: 4px; }
  .ep-item-size {
    font-family: var(--fd); font-size: 32px; font-weight: 700;
    color: var(--ink); letter-spacing: -0.5px; line-height: 1;
  }
  .ep-item-size-label { font-size: 11px; color: var(--ash); }
  .ep-item-score-badge {
    font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 999px;
  }
  .ep-item-score-badge.perfect { background: rgba(13,13,13,0.07); color: var(--ink); }
  .ep-item-score-badge.great   { background: var(--sage-light); color: var(--sage-deep); }
  .ep-item-score-badge.fair    { background: var(--cloud); color: var(--ash); }

  /* ── Multi grid ── */
  .ep-multi-stack { display: flex; flex-direction: column; gap: 44px; }
  .ep-multi-section-header {
    display: flex; align-items: flex-end; justify-content: space-between;
    margin-bottom: 18px;
  }
  .ep-multi-section-title {
    font-family: var(--fd); font-size: 26px; font-weight: 700;
    color: var(--ink); letter-spacing: -0.5px; margin-bottom: 3px;
  }
  .ep-multi-section-count {
    font-size: 12px; color: var(--ash);
    background: var(--cloud); border-radius: 999px;
    padding: 2px 10px; margin-left: 8px; font-weight: 600;
  }
  .ep-multi-section-sub { font-size: 13px; color: var(--ash); }

  .ep-multi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 16px;
  }

  /* Product card (shared) */
  .ep-product-card {
    background: var(--white); border: 1px solid var(--cloud);
    border-radius: 16px; overflow: hidden;
    transition: transform 0.22s var(--ease), box-shadow 0.22s;
    cursor: pointer;
  }
  .ep-product-card:hover { transform: translateY(-4px); box-shadow: 0 14px 40px rgba(0,0,0,0.08); }
  .ep-product-image {
    width: 100%; aspect-ratio: 4/3;
    background: var(--paper);
    display: flex; align-items: center; justify-content: center;
    position: relative; overflow: hidden;
  }
  .ep-product-image-icon { font-size: 36px; opacity: 0.2; }
  .ep-product-score-badge {
    position: absolute; top: 10px; right: 10px;
    font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 999px;
  }
  .ep-product-score-badge.perfect { background: var(--ink); color: var(--white); }
  .ep-product-score-badge.great   { background: var(--sage-light); color: var(--sage-deep); border: 1px solid var(--sage-dark); }
  .ep-product-score-badge.fair    { background: var(--cloud); color: var(--ash); }
  .ep-product-body { padding: 14px 16px 16px; }
  .ep-product-brand { font-size: 10px; font-weight: 700; color: var(--ash); letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 3px; }
  .ep-product-title { font-size: 13.5px; font-weight: 600; color: var(--ink); margin-bottom: 10px; line-height: 1.35; }
  .ep-product-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 10px; border-top: 1px solid var(--cloud); }
  .ep-product-size {
    font-family: var(--fd); font-size: 26px; font-weight: 700;
    color: var(--ink); letter-spacing: -0.5px; line-height: 1;
  }
  .ep-product-fit-pill {
    font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 999px;
  }
  .ep-product-fit-pill.perfect { background: rgba(13,13,13,0.07); color: var(--ink); }
  .ep-product-fit-pill.great   { background: var(--sage-light); color: var(--sage-deep); }
  .ep-product-fit-pill.fair    { background: var(--cloud); color: var(--ash); }

  /* ── Empty state ── */
  .ep-empty {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 16px; text-align: center;
    background: var(--white); border: 1px solid var(--cloud);
    border-radius: 20px; padding: 72px 40px;
  }
  .ep-empty-icon {
    width: 64px; height: 64px; border-radius: 50%;
    background: var(--sage-light); border: 1px solid var(--sage-dark);
    display: flex; align-items: center; justify-content: center; font-size: 26px;
  }
  .ep-empty.ep-empty-categories .ep-empty-icon {
    font-size: 0;
    background-image: url('${clothesIcon}');
    background-repeat: no-repeat;
    background-position: center;
    background-size: 28px 28px;
  }
  .ep-empty-icon img {
    width: 28px;
    height: 28px;
    display: block;
    object-fit: contain;
  }
  .ep-empty-title { font-family: var(--fd); font-size: 24px; font-weight: 700; color: var(--ink); }
  .ep-empty-sub { font-size: 14px; color: var(--ash); max-width: 340px; line-height: 1.65; }
  .ep-empty-btn {
    font-family: var(--fs); font-size: 13.5px; font-weight: 600;
    color: var(--white); background: var(--ink);
    border: none; border-radius: 10px; padding: 10px 24px;
    cursor: pointer; transition: opacity 0.2s; margin-top: 4px;
  }
  .ep-empty-btn:hover { opacity: 0.85; }

  /* ── Skeleton ── */
  .ep-skeleton {
    background: linear-gradient(90deg, var(--cloud) 25%, var(--paper) 50%, var(--cloud) 75%);
    background-size: 200% 100%;
    animation: ep-shimmer 1.4s ease-in-out infinite;
    border-radius: 8px;
  }
  .ep-skeleton-pair {
    background: var(--white); border: 1px solid var(--cloud);
    border-radius: 20px; overflow: hidden; padding: 20px 24px;
    display: flex; flex-direction: column; gap: 16px;
  }

  /* ── Error ── */
  .ep-error {
    display: flex; align-items: center; gap: 10px;
    background: rgba(192,57,43,0.06); border: 1px solid rgba(192,57,43,0.18);
    border-radius: 12px; padding: 14px 18px;
    font-size: 13px; color: var(--red);
  }
  .ep-error svg { width: 15px; height: 15px; flex-shrink: 0; }

  @media (max-width: 760px) {
    .ep-root {
      min-height: 100dvh;
      overflow-x: hidden;
    }

    .ep-topbar {
      min-height: 60px;
      height: auto;
      padding: 10px 14px;
      gap: 8px;
      flex-wrap: wrap;
    }

    .ep-topbar-back {
      padding: 8px 0;
      font-size: 12px;
    }

    .ep-topbar-divider {
      display: none;
    }

    .ep-topbar-title {
      font-size: 18px;
    }

    .ep-mode-toggle {
      width: 100%;
      margin-left: 0;
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .ep-mode-btn {
      min-height: 38px;
      padding: 7px 8px;
      font-size: 12px;
    }

    .ep-body {
      width: 100%;
      padding: 18px 14px calc(112px + env(safe-area-inset-bottom, 0px));
      gap: 18px;
    }

    .ep-header-eyebrow {
      margin-bottom: 8px;
      font-size: 10px;
    }

    .ep-page-title {
      font-size: 32px;
      letter-spacing: 0;
    }

    .ep-page-sub {
      font-size: 13px;
      line-height: 1.55;
    }

    .ep-category-bar {
      gap: 8px;
    }

    .ep-category-chips {
      flex-wrap: nowrap;
      overflow-x: auto;
      padding: 0 10px 4px 0;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
    }

    .ep-category-chips::-webkit-scrollbar {
      display: none;
    }

    .ep-chip {
      flex: 0 0 auto;
      min-height: 36px;
      padding: 7px 12px;
      font-size: 12px;
    }

    .ep-pair-card,
    .ep-product-card,
    .ep-empty,
    .ep-skeleton-pair {
      border-radius: 14px;
    }

    .ep-pair-header {
      align-items: flex-start;
      gap: 10px;
      padding: 13px 14px;
      flex-direction: column;
    }

    .ep-pair-score-wrap {
      width: 100%;
      gap: 8px;
    }

    .ep-pair-score-bar-wrap {
      max-width: none;
      min-width: 0;
    }

    .ep-pair-columns {
      grid-template-columns: 1fr;
    }

    .ep-pair-vs {
      min-height: 34px;
      padding: 0;
      border-left: 0;
      border-right: 0;
      border-top: 1px solid var(--cloud);
      border-bottom: 1px solid var(--cloud);
    }

    .ep-pair-vs-badge {
      width: 28px;
      height: 28px;
      font-size: 9px;
    }

    .ep-item-card {
      padding: 14px;
    }

    .ep-item-footer {
      gap: 12px;
    }

    .ep-item-title,
    .ep-product-title {
      overflow-wrap: anywhere;
    }

    .ep-multi-stack {
      gap: 24px;
    }

    .ep-multi-section-header {
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .ep-multi-grid {
      grid-template-columns: 1fr;
      gap: 10px;
    }

    .ep-product-card {
      display: grid;
      grid-template-columns: 96px minmax(0, 1fr);
      min-height: 112px;
    }

    .ep-product-image {
      height: 100%;
      min-height: 112px;
      aspect-ratio: auto;
      border-right: 1px solid var(--cloud);
    }

    .ep-product-image img {
      object-fit: contain !important;
      padding: 8px;
    }

    .ep-product-body {
      padding: 10px 12px;
      min-width: 0;
    }

    .ep-product-footer {
      gap: 8px;
    }

    .ep-empty {
      padding: 42px 18px;
    }
  }

  /* ── Keyframes ── */
  @keyframes ep-fadeDown {
    from { opacity: 0; transform: translateY(-14px); }
    to   { opacity: 1; transform: none; }
  }
  @keyframes ep-fadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: none; }
  }
  @keyframes ep-slideIn {
    from { opacity: 0; transform: translateX(20px); }
    to   { opacity: 1; transform: none; }
  }
  @keyframes ep-growBar {
    from { width: 0; }
    to   { width: var(--w); }
  }
  @keyframes ep-shimmer {
    from { background-position: 200% 0; }
    to   { background-position: -200% 0; }
  }
`;

if (!document.getElementById('ep-styles')) {
  const s = document.createElement('style');
  s.id = 'ep-styles';
  s.textContent = CSS;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────────
   SVG icons
───────────────────────────────────────────── */
const Ico = {
  Back:    () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M13 8H3M7 4l-4 4 4 4"/></svg>,
  Plus:    () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 3v10M3 8h10"/></svg>,
  Alert:   () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="6"/><path d="M8 5v4M8 11v.5"/></svg>,
  Shirt:   () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M6 2l2 2 2-2 3 2-1.5 3H11v7H5V7H3.5L2 4l3-2z"/></svg>,
  Compass: () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="6"/><path d="M10.5 5.5l-2 4.5-4.5 2 2-4.5 4.5-2z"/></svg>,
};

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
type MatchMode = 'compare2' | 'multi';

function scoreClass(score: number) {
  if (score >= 75) return 'perfect';
  if (score >= 60) return 'great';
  return 'fair';
}
function fitLabel(score: number) {
  if (score >= 75) return 'Perfect fit';
  if (score >= 60) return 'Great fit';
  return 'Can try';
}

/* ─────────────────────────────────────────────
   Content slide wrapper
───────────────────────────────────────────── */
function ContentSlide({ modeKey, children }: { modeKey: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.animation = 'none';
    void el.offsetHeight;
    el.style.animation = 'ep-slideIn 0.32s var(--ease) both';
  }, [modeKey]);
  return <div ref={ref}>{children}</div>;
}

/* ─────────────────────────────────────────────
   Mini product card
───────────────────────────────────────────── */
function ProductCard({ card }: { card: EnrichedRecommendation }) {
  const cls = scoreClass(card.matchScore);
  const image = card.imageUrl || card.seller?.photoURL || null;
  return (
    <div className="ep-product-card">
      <div className="ep-product-image">
        {image
          ? <img src={image} alt={card.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div className="ep-product-image-icon">👕</div>
        }
        <div className={`ep-product-score-badge ${cls}`}>{card.matchScore}%</div>
      </div>
      <div className="ep-product-body">
        <div className="ep-product-brand">{card.brandDisplay}</div>
        <div className="ep-product-title">{card.title}</div>
        <div className="ep-product-footer">
          <span className="ep-product-size">{card.sizeLabel ?? '?'}</span>
          <span className={`ep-product-fit-pill ${cls}`}>{fitLabel(card.matchScore)}</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Pair card
───────────────────────────────────────────── */
function PairCard({ pair }: { pair: any }) {
  const cls = scoreClass(pair.score);
  const barW = `${Math.min(pair.score, 100)}%`;
  return (
    <div className="ep-pair-card">
      <div className="ep-pair-header">
        <div className="ep-pair-score-wrap">
          <span className="ep-pair-score-label">Combined fit</span>
          <span className="ep-pair-score">{pair.score}<span>%</span></span>
          <div className="ep-pair-score-bar-wrap">
            <div className="ep-pair-score-bar" style={{ '--w': barW, width: barW } as any} />
          </div>
        </div>
        <div className={`ep-pair-badge ${cls}`}>{fitLabel(pair.score)}</div>
      </div>
      <div className="ep-pair-columns">
        <PairItem card={pair.left} />
        <div className="ep-pair-vs"><div className="ep-pair-vs-badge">VS</div></div>
        <PairItem card={pair.right} />
      </div>
    </div>
  );
}

function PairItem({ card }: { card: EnrichedRecommendation }) {
  const cls = scoreClass(card.matchScore);
  return (
    <div className="ep-item-card">
      <div className="ep-item-brand">{card.brandDisplay}</div>
      <div className="ep-item-title">{card.title}</div>
      {card.subCategory && <div className="ep-item-sub">{card.subCategory}</div>}
      <div className="ep-item-footer">
        <div className="ep-item-size-wrap">
          <span className="ep-item-size">{card.sizeLabel ?? '?'}</span>
          <span className="ep-item-size-label">size</span>
        </div>
        <span className={`ep-item-score-badge ${cls}`}>{card.matchScore}%</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Skeleton loaders
───────────────────────────────────────────── */
function SkeletonPair() {
  return (
    <div className="ep-skeleton-pair">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="ep-skeleton" style={{ height: 12, width: '20%' }} />
        <div className="ep-skeleton" style={{ height: 24, width: '8%', borderRadius: 999 }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px 1fr', gap: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 0' }}>
          <div className="ep-skeleton" style={{ height: 10, width: '40%' }} />
          <div className="ep-skeleton" style={{ height: 14, width: '70%' }} />
          <div className="ep-skeleton" style={{ height: 28, width: '25%' }} />
        </div>
        <div />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 0' }}>
          <div className="ep-skeleton" style={{ height: 10, width: '40%' }} />
          <div className="ep-skeleton" style={{ height: 14, width: '70%' }} />
          <div className="ep-skeleton" style={{ height: 28, width: '25%' }} />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */
export function ExplorePage() {
  const navigate = useNavigate();
  const { user }  = useAuth();
  const { sellers, sections, categoryOptions, loading, error } = useRecommendationData(user?.uid);
  const [mode,            setMode]            = useState<MatchMode>('compare2');
  const [selectedChoices, setSelectedChoices] = useState<string[]>([]);

  useEffect(() => {
    if (selectedChoices.length || !sections.length) return;
    setSelectedChoices(sections.slice(0, 2).map(s => s.choice ?? '').filter(Boolean));
  }, [sections, selectedChoices.length]);

  const selectedSections = useMemo(
    () => sections.filter(s => selectedChoices.includes(s.choice ?? '')),
    [sections, selectedChoices]
  );

  const comparePairs = useMemo(() => {
    if (selectedSections.length < 2) return [];
    return buildPairSuggestions(selectedSections[0], selectedSections[1], sellers);
  }, [selectedSections, sellers]);

  const multiSections = useMemo(() => selectedSections.map(section => ({
    ...section,
    cards: section.recommendations.slice(0, 6).map(r => {
      const seller = r.sellerUserId ? sellers[r.sellerUserId] ?? null : null;
      return { ...r, brandDisplay: resolveBrandDisplay(r.brand, seller), seller } satisfies EnrichedRecommendation;
    }),
  })), [selectedSections, sellers]);

  const categoryItems = categoryOptions.map(opt => ({
    value: opt.key, label: opt.label,
    badge: getCategoryBadge(sections, opt.key),
  }));

  const toggleChoice = (choice: string) => {
    if (!sections.some(s => s.choice === choice)) {
      navigate(`/app/add-preference?choice=${choice}`); return;
    }
    setSelectedChoices(curr => {
      if (curr.includes(choice)) return curr.filter(c => c !== choice);
      if (mode === 'compare2' && curr.length >= 2) return [curr[1], choice];
      return [...curr, choice];
    });
  };

  const handleModeChange = (next: MatchMode) => {
    setMode(next);
    if (next === 'compare2' && selectedChoices.length > 2)
      setSelectedChoices(c => c.slice(0, 2));
  };

  return (
    <div className="ep-root">

      {/* ── Topbar ── */}
      <div className="ep-topbar">
        <button className="ep-topbar-back" onClick={() => navigate('/app/home')}>
          Home
        </button>
        <div className="ep-topbar-divider" />
        <span className="ep-topbar-title">Explore</span>

        {/* Mode toggle */}
        <div className="ep-mode-toggle">
          {([['compare2', 'Compare 2'], ['multi', 'Multi-view']] as const).map(([val, label]) => (
            <button
              key={val}
              className={`ep-mode-btn${mode === val ? ' active' : ''}`}
              onClick={() => handleModeChange(val)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="ep-body">

        {/* Header */}
        <div className="ep-header">
          <div className="ep-header-eyebrow">
            <div className="ep-header-eyebrow-line" />
            Outfit matching
          </div>
          <h1 className="ep-page-title">
            Explore <em>combinations</em>
          </h1>
          <p className="ep-page-sub">
            {mode === 'compare2'
              ? 'Compare two clothing categories side by side to find the best matching pairs across brands.'
              : 'Browse multiple clothing categories together to plan your full outfit across brands.'}
          </p>
        </div>

        {/* Category selector */}
        {categoryItems.length > 0 && (
          <div className="ep-category-bar">
            <div className="ep-category-label">
              Categories
              <span className="ep-category-label-hint">
                {mode === 'compare2'
                  ? `${selectedChoices.length}/2 selected`
                  : `${selectedChoices.length} selected`}
              </span>
            </div>
            <div className="ep-category-chips">
              {categoryItems.map(item => (
                <button
                  key={item.value}
                  className={`ep-chip${selectedChoices.includes(item.value) ? ' active' : ''}`}
                  onClick={() => toggleChoice(item.value)}>
                  {item.label}
                  {item.badge !== undefined && (
                    <span className="ep-chip-count">{item.badge}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="ep-error"><Ico.Alert /> {error}</div>
        )}

        {/* Content */}
        <ContentSlide modeKey={mode}>

          {/* Loading */}
          {loading && (
            mode === 'compare2' ? (
              <div className="ep-compare-grid">
                {[0,1,2].map(i => <SkeletonPair key={i} />)}
              </div>
            ) : (
              <div className="ep-multi-grid">
                {[0,1,2,3,4,5].map(i => (
                  <div key={i} className="ep-skeleton" style={{ height: 240, borderRadius: 16 }} />
                ))}
              </div>
            )
          )}

          {/* No sections */}
          {!loading && !sections.length && (
            <div className="ep-empty">
              <div className="ep-empty-icon"><Ico.Compass /></div>
              <div className="ep-empty-title">Nothing to explore yet</div>
              <div className="ep-empty-sub">
                Add at least one clothing category with measurements to start comparing fit recommendations.
              </div>
              <button className="ep-empty-btn" onClick={() => navigate('/app/add-preference')}>
                Add a preference
              </button>
            </div>
          )}

          {/* Compare 2 mode */}
          {!loading && sections.length > 0 && mode === 'compare2' && (
            comparePairs.length ? (
              <div className="ep-compare-grid">
                {comparePairs.map(pair => (
                  <PairCard key={pair.id} pair={pair} />
                ))}
              </div>
            ) : (
              <div className="ep-empty ep-empty-categories">
                <div className="ep-empty-icon">👔</div>
                <div className="ep-empty-title">Pick two categories</div>
                <div className="ep-empty-sub">
                  Select any two saved clothing categories above to see the best matching pairs.
                </div>
              </div>
            )
          )}

          {/* Multi mode */}
          {!loading && sections.length > 0 && mode === 'multi' && (
            multiSections.length ? (
              <div className="ep-multi-stack">
                {multiSections.map(section => (
                  <div key={section.profileKey}>
                    <div className="ep-multi-section-header">
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span className="ep-multi-section-title">{section.label}</span>
                          <span className="ep-multi-section-count">{section.cards.length}</span>
                        </div>
                        <div className="ep-multi-section-sub">Top size matches for this category</div>
                      </div>
                    </div>
                    <div className="ep-multi-grid">
                      {section.cards.map(card => (
                        <ProductCard key={card.id} card={card} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ep-empty">
                <div className="ep-empty-icon">👕</div>
                <div className="ep-empty-title">Select categories to explore</div>
                <div className="ep-empty-sub">
                  Choose one or more clothing categories above to see multi-view recommendations.
                </div>
              </div>
            )
          )}

        </ContentSlide>

      </div>
    </div>
  );
}

export default ExplorePage;
