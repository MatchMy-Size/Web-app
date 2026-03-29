/**
 * MatchMySize — UI Component Library
 *
 * All components are self-contained with inline CSS (injected once).
 * No framer-motion dependency — all animations use CSS keyframes + transitions.
 *
 * Components:
 *   Button, Field, ChoiceCard, SegmentedControl,
 *   BannerCarousel, ProductCard, EmptyState, PageHeader, StatCard
 */

import {
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react';

import type { EnrichedRecommendation } from '@/lib/recommendation-view';

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

  /* ══════════════════════════════════════════
     BUTTON
  ══════════════════════════════════════════ */
  .ui-btn {
    display: inline-flex; align-items: center; justify-content: center;
    gap: 7px; padding: 0 20px; height: 42px;
    font-family: var(--fs); font-size: 13.5px; font-weight: 700;
    border-radius: 11px; border: none; cursor: pointer;
    transition: opacity 0.18s, transform 0.15s, box-shadow 0.18s, background 0.18s;
    white-space: nowrap; letter-spacing: 0.1px;
    position: relative; overflow: hidden;
  }
  .ui-btn::after {
    content: '';
    position: absolute; inset: 0;
    background: rgba(255,255,255,0);
    transition: background 0.15s;
  }
  .ui-btn:active:not(:disabled)::after { background: rgba(255,255,255,0.1); }

  .ui-btn:hover:not(:disabled) { transform: translateY(-1px); }
  .ui-btn:active:not(:disabled) { transform: scale(0.97) translateY(0); }
  .ui-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
  .ui-btn svg { width: 15px; height: 15px; flex-shrink: 0; }

  /* Primary */
  .ui-btn-primary {
    background: var(--ink); color: var(--white);
    box-shadow: 0 3px 12px rgba(13,13,13,0.18);
  }
  .ui-btn-primary:hover:not(:disabled) { box-shadow: 0 6px 20px rgba(13,13,13,0.22); }

  /* Secondary */
  .ui-btn-secondary {
    background: var(--white); color: var(--ink);
    border: 1.5px solid var(--cloud);
  }
  .ui-btn-secondary:hover:not(:disabled) { border-color: var(--mist); background: var(--paper); }

  /* Ghost */
  .ui-btn-ghost {
    background: transparent; color: var(--ash);
    border: none;
  }
  .ui-btn-ghost:hover:not(:disabled) { background: var(--cloud); color: var(--ink); }

  /* Danger */
  .ui-btn-danger {
    background: rgba(192,57,43,0.07); color: var(--red);
    border: 1.5px solid rgba(192,57,43,0.18);
  }
  .ui-btn-danger:hover:not(:disabled) { background: rgba(192,57,43,0.12); }

  /* Sage */
  .ui-btn-sage {
    background: var(--sage-light); color: var(--ink);
    border: 1px solid var(--sage-dark);
  }
  .ui-btn-sage:hover:not(:disabled) { background: var(--sage); }

  /* Size modifiers */
  .ui-btn-sm { height: 34px; padding: 0 14px; font-size: 12.5px; border-radius: 8px; }
  .ui-btn-lg { height: 52px; padding: 0 28px; font-size: 15px; border-radius: 13px; }
  .ui-btn-full { width: 100%; }

  /* Spinner inside button */
  .ui-btn-spinner {
    width: 14px; height: 14px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: currentColor;
    animation: ui-spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  /* ══════════════════════════════════════════
     FIELD
  ══════════════════════════════════════════ */
  .ui-field {
    display: flex; flex-direction: column; gap: 7px;
  }
  .ui-field-label {
    font-size: 12px; font-weight: 700; color: var(--ink);
    display: flex; align-items: center; gap: 6px;
  }
  .ui-field-hint {
    font-size: 11px; font-weight: 500; color: var(--ash);
    background: var(--cloud); border-radius: 999px;
    padding: 2px 8px; margin-left: auto;
  }
  .ui-field-children { width: 100%; }

  /* ══════════════════════════════════════════
     CHOICE CARD
  ══════════════════════════════════════════ */
  .ui-choice-card {
    display: flex; align-items: center; gap: 14px;
    padding: 16px 18px;
    background: var(--white); border: 1.5px solid var(--cloud);
    border-radius: 14px; cursor: pointer; width: 100%;
    font-family: var(--fs); text-align: left;
    transition: border-color 0.2s, background 0.2s, box-shadow 0.2s, transform 0.15s;
  }
  .ui-choice-card:hover:not(.ui-choice-selected) {
    border-color: var(--mist); transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(13,13,13,0.05);
  }
  .ui-choice-card.ui-choice-selected {
    border-color: var(--ink); background: rgba(13,13,13,0.03);
    box-shadow: 0 0 0 3px rgba(13,13,13,0.06);
  }
  .ui-choice-icon {
    width: 42px; height: 42px; border-radius: 10px;
    background: var(--paper); border: 1px solid var(--cloud);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; font-size: 18px;
    transition: background 0.2s, border-color 0.2s;
  }
  .ui-choice-icon svg { width: 18px; height: 18px; color: var(--ash); }
  .ui-choice-card.ui-choice-selected .ui-choice-icon {
    background: var(--ink); border-color: var(--ink);
  }
  .ui-choice-card.ui-choice-selected .ui-choice-icon svg { color: var(--white); }
  .ui-choice-copy { flex: 1; }
  .ui-choice-title { font-size: 14px; font-weight: 700; color: var(--ink); margin-bottom: 2px; }
  .ui-choice-sub   { font-size: 12px; color: var(--ash); }
  .ui-choice-check {
    width: 22px; height: 22px; border-radius: 50%;
    border: 1.5px solid var(--cloud);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; transition: all 0.2s;
  }
  .ui-choice-card.ui-choice-selected .ui-choice-check {
    background: var(--ink); border-color: var(--ink);
  }
  .ui-choice-check svg { width: 11px; height: 11px; color: var(--white); opacity: 0; transition: opacity 0.15s; }
  .ui-choice-card.ui-choice-selected .ui-choice-check svg { opacity: 1; }

  /* ══════════════════════════════════════════
     SEGMENTED CONTROL
  ══════════════════════════════════════════ */
  .ui-segmented {
    display: flex; background: var(--cloud);
    border-radius: 12px; padding: 4px; gap: 3px;
    position: relative; width: fit-content;
  }
  .ui-segmented-indicator {
    position: absolute; top: 4px; bottom: 4px;
    background: var(--ink); border-radius: 9px;
    transition: left 0.3s var(--ease), width 0.3s var(--ease);
    pointer-events: none; z-index: 0;
    box-shadow: 0 2px 8px rgba(13,13,13,0.18);
  }
  .ui-segmented-item {
    position: relative; z-index: 1;
    font-family: var(--fs); font-size: 12.5px; font-weight: 700;
    padding: 8px 16px; border: none; background: transparent;
    border-radius: 8px; cursor: pointer; white-space: nowrap;
    color: var(--ash); transition: color 0.2s;
    display: flex; align-items: center; gap: 6px;
  }
  .ui-segmented-item.ui-seg-active { color: var(--white); }
  .ui-segmented-item em {
    font-style: normal; font-size: 10px; font-weight: 800;
    background: rgba(255,255,255,0.18); border-radius: 999px;
    padding: 1px 6px; min-width: 18px; text-align: center;
    transition: background 0.2s;
  }
  .ui-segmented-item:not(.ui-seg-active) em { background: var(--mist); color: var(--ash); }

  /* ══════════════════════════════════════════
     BANNER CAROUSEL
  ══════════════════════════════════════════ */
  .ui-banner {
    border-radius: 20px; padding: 28px 32px;
    position: relative; overflow: hidden;
    min-height: 140px; display: flex; flex-direction: column;
    justify-content: space-between; transition: background 0.5s;
  }
  .ui-banner-glow {
    position: absolute; top: -60px; right: -60px;
    width: 200px; height: 200px; border-radius: 50%;
    pointer-events: none; transition: background 0.5s;
  }

  /* Tones */
  .ui-banner-ink    { background: var(--ink); }
  .ui-banner-forest { background: #1A2E1A; }
  .ui-banner-sage   { background: var(--sage-deep); }

  .ui-banner-ink    .ui-banner-glow { background: rgba(195,216,193,0.09); }
  .ui-banner-forest .ui-banner-glow { background: rgba(195,216,193,0.12); }
  .ui-banner-sage   .ui-banner-glow { background: rgba(255,255,255,0.10); }

  .ui-banner-copy {
    position: relative; z-index: 1;
    animation: ui-bannerIn 0.38s var(--ease) both;
  }
  .ui-banner-eyebrow {
    font-size: 11px; font-weight: 800; letter-spacing: 1.2px;
    text-transform: uppercase; margin-bottom: 8px; display: block;
    color: rgba(255,255,255,0.45);
  }
  .ui-banner-title {
    font-family: var(--fd); font-size: 24px; font-weight: 700;
    color: var(--white); letter-spacing: -0.4px; line-height: 1.15;
    margin-bottom: 6px;
  }
  .ui-banner-body { font-size: 13px; color: rgba(255,255,255,0.50); line-height: 1.6; }

  .ui-banner-dots {
    display: flex; gap: 6px; align-items: center;
    position: relative; z-index: 1; margin-top: 20px;
  }
  .ui-banner-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: rgba(255,255,255,0.25);
    border: none; cursor: pointer; padding: 0;
    transition: background 0.2s, width 0.25s var(--ease);
  }
  .ui-banner-dot.ui-dot-active {
    background: var(--white); width: 20px; border-radius: 3px;
  }

  /* ══════════════════════════════════════════
     PRODUCT CARD
  ══════════════════════════════════════════ */
  .ui-product-card {
    background: var(--white); border: 1px solid var(--cloud);
    border-radius: 18px; overflow: hidden;
    transition: transform 0.22s var(--ease), box-shadow 0.22s;
    display: flex; flex-direction: column;
  }
  .ui-product-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 16px 48px rgba(13,13,13,0.09);
  }
  .ui-product-media {
    width: 100%; aspect-ratio: 4/3;
    background: var(--paper); position: relative; overflow: hidden;
    display: flex; align-items: center; justify-content: center;
  }
  .ui-product-media img { width: 100%; height: 100%; object-fit: cover; }
  .ui-product-no-img {
    font-size: 11px; font-weight: 600; color: var(--mist);
    letter-spacing: 0.3px; text-transform: uppercase;
  }

  /* Match pill */
  .ui-match-pill {
    position: absolute; top: 10px; right: 10px;
    display: flex; flex-direction: column; align-items: center;
    background: var(--ink); border-radius: 10px;
    padding: 6px 10px; line-height: 1;
  }
  .ui-match-pill strong {
    font-family: var(--fd); font-size: 18px; font-weight: 700;
    color: var(--white); letter-spacing: -0.3px;
  }
  .ui-match-pill span {
    font-size: 9px; font-weight: 700; color: var(--sage);
    letter-spacing: 0.5px; text-transform: uppercase; margin-top: 1px;
  }
  .ui-match-pill.great .ui-match-pill strong { color: var(--sage); }

  .ui-product-body { padding: 16px 18px 18px; flex: 1; display: flex; flex-direction: column; gap: 10px; }

  .ui-product-brand-row {
    display: flex; align-items: center; justify-content: space-between; gap: 6px;
  }
  .ui-product-brand-row strong {
    font-size: 11px; font-weight: 800; color: var(--ash);
    letter-spacing: 0.5px; text-transform: uppercase;
  }
  .ui-product-brand-row span {
    font-size: 10px; font-weight: 600; color: var(--mist);
    background: var(--cloud); border-radius: 999px;
    padding: 2px 7px;
  }

  .ui-product-title {
    font-size: 14px; font-weight: 700; color: var(--ink);
    line-height: 1.35; margin: 0;
  }

  .ui-product-meta {
    display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
    padding-top: 10px; border-top: 1px solid var(--cloud);
  }
  .ui-product-meta-cell { display: flex; flex-direction: column; gap: 2px; }
  .ui-product-meta-cell small {
    font-size: 9px; font-weight: 700; color: var(--mist);
    letter-spacing: 0.5px; text-transform: uppercase;
  }
  .ui-product-meta-cell strong {
    font-size: 13px; font-weight: 700; color: var(--ink);
  }
  .ui-size-pill {
    font-family: var(--fd); font-size: 20px; font-weight: 700;
    color: var(--ink); letter-spacing: -0.3px; line-height: 1;
  }

  /* Fit score colour */
  .ui-product-card.score-perfect .ui-match-pill { background: var(--sage-deep); border: 1px solid var(--sage-dark); }
  .ui-product-card.score-perfect .ui-match-pill strong { color: var(--white); }
  .ui-product-card.score-perfect .ui-match-pill span   { color: rgba(255,255,255,0.82); }
  .ui-product-card.score-great   .ui-match-pill { background: var(--sage-light); border: 1px solid var(--sage-dark); }
  .ui-product-card.score-great   .ui-match-pill strong { color: var(--sage-deep); }
  .ui-product-card.score-great   .ui-match-pill span   { color: var(--sage-deep); }
  .ui-product-card.score-fair    .ui-match-pill { background: var(--cloud); }
  .ui-product-card.score-fair    .ui-match-pill strong { color: var(--ash); }
  .ui-product-card.score-fair    .ui-match-pill span   { color: var(--ash); }

  /* ══════════════════════════════════════════
     EMPTY STATE
  ══════════════════════════════════════════ */
  .ui-empty {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; text-align: center;
    gap: 16px; padding: 72px 40px;
    background: var(--white); border: 1px solid var(--cloud);
    border-radius: 20px;
    animation: ui-fadeUp 0.45s var(--ease) both;
  }
  .ui-empty-icon {
    width: 68px; height: 68px; border-radius: 50%;
    background: var(--sage-light); border: 1px solid var(--sage-dark);
    display: flex; align-items: center; justify-content: center;
    font-size: 28px;
  }
  .ui-empty-title {
    font-family: var(--fd); font-size: 24px; font-weight: 700;
    color: var(--ink); letter-spacing: -0.4px;
  }
  .ui-empty-body {
    font-size: 14px; color: var(--ash); max-width: 340px; line-height: 1.65;
  }

  /* ══════════════════════════════════════════
     PAGE HEADER
  ══════════════════════════════════════════ */
  .ui-page-header {
    display: flex; align-items: flex-end;
    justify-content: space-between; gap: 20px;
    margin-bottom: 28px;
    animation: ui-fadeUp 0.45s var(--ease) both;
  }
  .ui-page-header-eyebrow {
    display: flex; align-items: center; gap: 8px;
    font-size: 11px; font-weight: 700; color: var(--sage-deep);
    letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 10px;
  }
  .ui-page-header-eyebrow-line { width: 28px; height: 1.5px; background: var(--sage-deep); }
  .ui-page-header h1 {
    font-family: var(--fd); font-size: clamp(28px, 3.5vw, 42px);
    font-weight: 700; color: var(--ink); letter-spacing: -0.7px;
    line-height: 1.1; margin: 0 0 8px;
  }
  .ui-page-header h1 em { font-style: italic; color: var(--sage-deep); }
  .ui-page-header p {
    font-size: 14px; color: var(--ash); line-height: 1.65; margin: 0;
    max-width: 520px;
  }
  .ui-page-header-actions {
    display: flex; align-items: center; gap: 10px; flex-shrink: 0;
  }

  /* ══════════════════════════════════════════
     STAT CARD
  ══════════════════════════════════════════ */
  .ui-stat-card {
    background: var(--white); border: 1px solid var(--cloud);
    border-radius: 14px; padding: 18px 20px;
    display: flex; flex-direction: column; gap: 5px;
    transition: transform 0.2s, box-shadow 0.2s;
    animation: ui-fadeUp 0.45s var(--ease) both;
  }
  .ui-stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(13,13,13,0.06); }
  .ui-stat-card.accent { background: var(--ink); border-color: var(--ink); }
  .ui-stat-card-label {
    font-size: 11px; font-weight: 700; color: var(--ash);
    letter-spacing: 0.5px; text-transform: uppercase;
  }
  .ui-stat-card.accent .ui-stat-card-label { color: rgba(255,255,255,0.4); }
  .ui-stat-card-value {
    font-family: var(--fd); font-size: 32px; font-weight: 700;
    color: var(--ink); letter-spacing: -0.8px; line-height: 1;
  }
  .ui-stat-card.accent .ui-stat-card-value { color: var(--white); }
  .ui-stat-card-value span { color: var(--sage-deep); }
  .ui-stat-card.accent .ui-stat-card-value span { color: var(--sage); }

  /* ══════════════════════════════════════════
     SHARED KEYFRAMES
  ══════════════════════════════════════════ */
  @keyframes ui-spin    { to { transform: rotate(360deg); } }
  @keyframes ui-fadeUp  { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
  @keyframes ui-bannerIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
`;

if (!document.getElementById('ui-lib-styles')) {
  const s = document.createElement('style');
  s.id = 'ui-lib-styles';
  s.textContent = CSS;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────────
   Inline SVG icons
───────────────────────────────────────────── */
function IcoCheck() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M3 8l3.5 3.5L13 5" />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const cx = (...parts: (string | false | null | undefined)[]) =>
  parts.filter(Boolean).join(' ');

function scoreClass(score: number) {
  if (score >= 75) return 'score-perfect';
  if (score >= 60) return 'score-great';
  return 'score-fair';
}

/* ════════════════════════════════════════════
   BUTTON
════════════════════════════════════════════ */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'sage';
export type ButtonSize    = 'sm' | 'md' | 'lg';

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  loading,
  fullWidth,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <button
      type={props.type ?? 'button'}
      className={cx(
        'ui-btn',
        `ui-btn-${variant}`,
        size === 'sm' && 'ui-btn-sm',
        size === 'lg' && 'ui-btn-lg',
        fullWidth && 'ui-btn-full',
        className,
      )}
      disabled={props.disabled || loading}
      {...props}>
      {loading && <div className="ui-btn-spinner" />}
      {children}
    </button>
  );
}

/* ════════════════════════════════════════════
   FIELD
════════════════════════════════════════════ */
export function Field({ label, hint, children }: {
  label: string; hint?: string; children: ReactNode;
}) {
  return (
    <div className="ui-field">
      <span className="ui-field-label">
        {label}
        {hint && <span className="ui-field-hint">{hint}</span>}
      </span>
      <div className="ui-field-children">{children}</div>
    </div>
  );
}

/* ════════════════════════════════════════════
   CHOICE CARD
════════════════════════════════════════════ */
export function ChoiceCard({ selected, title, subtitle, icon, onClick }: {
  selected: boolean;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cx('ui-choice-card', selected && 'ui-choice-selected')}
      onClick={onClick}>
      {icon && <span className="ui-choice-icon">{icon}</span>}
      <span className="ui-choice-copy">
        <span className="ui-choice-title">{title}</span>
        {subtitle && <span className="ui-choice-sub">{subtitle}</span>}
      </span>
      <span className="ui-choice-check"><IcoCheck /></span>
    </button>
  );
}

/* ════════════════════════════════════════════
   SEGMENTED CONTROL
════════════════════════════════════════════ */
export function SegmentedControl<T extends string>({
  items,
  value,
  onChange,
}: {
  items: Array<{ value: T; label: string; badge?: string | number | null }>;
  value: T;
  onChange: (next: T) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const activeBtn = container.querySelector<HTMLElement>('.ui-seg-active');
    if (!activeBtn) return;
    const cr = container.getBoundingClientRect();
    const ar = activeBtn.getBoundingClientRect();
    setIndicatorStyle({ left: ar.left - cr.left, width: ar.width });
  }, [value, items]);

  return (
    <div className="ui-segmented" ref={containerRef}>
      <div
        className="ui-segmented-indicator"
        style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
      />
      {items.map(item => (
        <button
          key={item.value}
          type="button"
          className={cx('ui-segmented-item', item.value === value && 'ui-seg-active')}
          onClick={() => onChange(item.value)}>
          <span>{item.label}</span>
          {item.badge !== undefined && item.badge !== null && (
            <em>{item.badge}</em>
          )}
        </button>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════
   BANNER CAROUSEL
════════════════════════════════════════════ */
const BANNERS = [
  {
    id: 'adidas',
    eyebrow: 'ADIDAS',
    title: 'Precision fit',
    body: 'Use your saved measurements to narrow the right size faster.',
    tone: 'forest' as const,
  },
  {
    id: 'nike',
    eyebrow: 'NIKE',
    title: 'Built for motion',
    body: 'See the closest size match across activewear essentials.',
    tone: 'ink' as const,
  },
  {
    id: 'zara',
    eyebrow: 'ZARA',
    title: 'Editorial sizing',
    body: 'Compare fitted and relaxed silhouettes against your profile.',
    tone: 'sage' as const,
  },
];

export function BannerCarousel() {
  const [index,   setIndex]   = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const active = BANNERS[index];

  useEffect(() => {
    const t = window.setInterval(() => {
      setIndex(i => (i + 1) % BANNERS.length);
      setAnimKey(k => k + 1);
    }, 3600);
    return () => window.clearInterval(t);
  }, []);

  const goTo = (i: number) => { setIndex(i); setAnimKey(k => k + 1); };

  return (
    <div className={cx('ui-banner', `ui-banner-${active.tone}`)}>
      <div className="ui-banner-glow" />
      <div key={animKey} className="ui-banner-copy">
        <span className="ui-banner-eyebrow">{active.eyebrow}</span>
        <div className="ui-banner-title">{active.title}</div>
        <div className="ui-banner-body">{active.body}</div>
      </div>
      <div className="ui-banner-dots">
        {BANNERS.map((b, i) => (
          <button
            key={b.id}
            type="button"
            className={cx('ui-banner-dot', i === index && 'ui-dot-active')}
            onClick={() => goTo(i)}
            aria-label={`Go to ${b.eyebrow}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   PRODUCT CARD
════════════════════════════════════════════ */
function resolveImage(rec: EnrichedRecommendation) {
  return rec.imageUrl || rec.seller?.photoURL || null;
}

export function ProductCard({ recommendation: rec }: { recommendation: EnrichedRecommendation }) {
  const image = resolveImage(rec);
  const matchValue = rec.matchScore % 1 === 0
    ? rec.matchScore.toFixed(0)
    : rec.matchScore.toFixed(1);
  const cls = scoreClass(rec.matchScore);

  return (
    <article className={cx('ui-product-card', cls)}>
      <div className="ui-product-media">
        {image
          ? <img src={image} alt={rec.brandDisplay} />
          : <span className="ui-product-no-img">No image</span>
        }
        <div className="ui-match-pill">
          <strong>{matchValue}%</strong>
          <span>Match</span>
        </div>
      </div>

      <div className="ui-product-body">
        <div className="ui-product-brand-row">
          <strong>{rec.brandDisplay}</strong>
          {rec.subCategory && <span>{rec.subCategory}</span>}
        </div>
        <p className="ui-product-title">{rec.title}</p>

        <div className="ui-product-meta">
          <div className="ui-product-meta-cell">
            <small>Suggested size</small>
            <strong className="ui-size-pill">{rec.sizeLabel}</strong>
          </div>
          <div className="ui-product-meta-cell">
            <small>Category</small>
            <strong>{rec.category}</strong>
          </div>
          <div className="ui-product-meta-cell">
            <small>Fields matched</small>
            <strong>{rec.commonMeasurementCount}</strong>
          </div>
          <div className="ui-product-meta-cell">
            <small>Brand</small>
            <strong>{rec.seller?.displayName || rec.brandDisplay}</strong>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ════════════════════════════════════════════
   EMPTY STATE
════════════════════════════════════════════ */
const EMPTY_ICONS: Record<string, string> = {
  default:      '📏',
  measurements: '📐',
  brands:       '🏷️',
  search:       '🔍',
  profile:      '👤',
};

export function EmptyState({ title, body, action, icon = 'default' }: {
  title: string;
  body: string;
  action?: ReactNode;
  icon?: keyof typeof EMPTY_ICONS | string;
}) {
  const emoji = EMPTY_ICONS[icon] ?? icon;
  return (
    <div className="ui-empty">
      <div className="ui-empty-icon">{emoji}</div>
      <div className="ui-empty-title">{title}</div>
      <p className="ui-empty-body">{body}</p>
      {action}
    </div>
  );
}

/* ════════════════════════════════════════════
   PAGE HEADER
════════════════════════════════════════════ */
export function PageHeader({ title, subtitle, actions, eyebrow }: {
  title: string | ReactNode;
  subtitle?: string;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <header className="ui-page-header">
      <div>
        {eyebrow && (
          <div className="ui-page-header-eyebrow">
            <div className="ui-page-header-eyebrow-line" />
            {eyebrow}
          </div>
        )}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && (
        <div className="ui-page-header-actions">{actions}</div>
      )}
    </header>
  );
}

/* ════════════════════════════════════════════
   STAT CARD
════════════════════════════════════════════ */
export function StatCard({ label, value, suffix, accent }: {
  label: string;
  value: string | number;
  suffix?: string;
  accent?: boolean;
}) {
  return (
    <div className={cx('ui-stat-card', accent && 'accent')}>
      <span className="ui-stat-card-label">{label}</span>
      <strong className="ui-stat-card-value">
        {value}
        {suffix && <span>{suffix}</span>}
      </strong>
    </div>
  );
}
