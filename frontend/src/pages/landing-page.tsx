// import { useEffect, type CSSProperties, type ReactNode } from 'react';

// import appStoreIcon from '@/assets/images/appstore.png';
// import cameraIcon from '@/assets/images/camera.png';
// import clothesIcon from '@/assets/images/clothes.png';
// import lockIcon from '@/assets/images/lock.png';
// import playStoreIcon from '@/assets/images/playstore.png';
// import qrCodeIcon from '@/assets/images/qr-code.png';
// import rulerIcon from '@/assets/images/ruler.png';
// import scaleIcon from '@/assets/images/scale.png';
// import searchIcon from '@/assets/images/search.png';
// import starIcon from '@/assets/images/star.png';
// import tshirtIcon from '@/assets/images/t-shirt.png';
// import { AppLogo } from '@/components/app-logo';

// /* ─────────────────────────────────────────────
//    Google Fonts injected once
// ───────────────────────────────────────────── */
// const fontLink = document.createElement('link');
// fontLink.rel = 'stylesheet';
// fontLink.href =
//   'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap';
// if (!document.querySelector('[href*="Cormorant+Garamond"]')) document.head.appendChild(fontLink);

// /* ─────────────────────────────────────────────
//    CSS injected once
// ───────────────────────────────────────────── */
// const CSS = `
//   :root {
//     --sage: #C3D8C1;
//     --sage-light: #D9EBD7;
//     --sage-deep: #7A9E78;
//     --sage-dark: #A3BFA1;
//     --ink: #0D0D0D;
//     --ink2: #1C1C1C;
//     --paper: #FAFAF8;
//     --cloud: #EFEFEF;
//     --ash: #757575;
//     --white: #FFFFFF;
//     --fd: 'Cormorant Garamond', serif;
//     --fs: 'DM Sans', sans-serif;
//     --ease: cubic-bezier(0.22, 1, 0.36, 1);
//   }

//   html { scroll-behavior: smooth; }

//   .lp-body {
//     font-family: var(--fs);
//     background: var(--paper);
//     color: var(--ink);
//     line-height: 1.6;
//     overflow-x: hidden;
//   }

//   /* ── Nav ── */
//   .lp-nav {
//     position: fixed; top: 0; left: 0; right: 0; z-index: 200;
//     display: flex; align-items: center; justify-content: space-between;
//     padding: 0 56px; height: 66px;
//     background: rgba(250,250,248,0.88);
//     backdrop-filter: blur(14px);
//     border-bottom: 1px solid rgba(0,0,0,0.06);
//     animation: lp-slideDown 0.6s var(--ease) both;
//   }
//   .lp-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
//   .lp-logo-mark {
//     width: 42px; height: 42px; border-radius: 12px;
//     background: var(--white);
//     border: 1px solid rgba(0,0,0,0.08);
//     box-shadow: 0 8px 18px rgba(0,0,0,0.06);
//     overflow: hidden;
//     display: flex; align-items: center; justify-content: center;
//     flex-shrink: 0;
//   }
//   .lp-logo-text {
//     font-family: var(--fd); font-size: 20px; font-weight: 600;
//     color: var(--ink); letter-spacing: -0.3px;
//   }
//   .lp-nav-links { display: flex; align-items: center; gap: 36px; list-style: none; }
//   .lp-nav-links a {
//     font-size: 13.5px; font-weight: 500; color: var(--ash);
//     text-decoration: none; transition: color 0.2s;
//   }
//   .lp-nav-links a:hover { color: var(--ink); }
//   .lp-nav-cta { display: flex; align-items: center; gap: 12px; }
//   .lp-btn-ghost {
//     font-family: var(--fs); font-size: 13.5px; font-weight: 500;
//     color: var(--ink); background: none; border: none; cursor: pointer;
//     padding: 8px 16px; border-radius: 8px; transition: background 0.2s;
//   }
//   .lp-btn-ghost:hover { background: var(--cloud); }
//   .lp-btn-ink {
//     font-family: var(--fs); font-size: 13.5px; font-weight: 600;
//     color: var(--white); background: var(--ink); border: none; cursor: pointer;
//     padding: 9px 20px; border-radius: 8px; transition: transform 0.15s, opacity 0.2s;
//   }
//   .lp-btn-ink:hover { opacity: 0.85; transform: translateY(-1px); }
//   .lp-btn-ink:active { transform: scale(0.97); }

//   /* ── Hero ── */
//   .lp-hero {
//     min-height: 100vh;
//     display: grid; grid-template-columns: 1fr 1fr;
//     align-items: center; gap: 64px;
//     padding: 64px 56px 0;
//     max-width: 1320px; margin: 0 auto;
//   }
//   .lp-hero-eyebrow {
//     display: inline-flex; align-items: center; gap: 8px;
//     background: var(--sage-light); border: 1px solid var(--sage-dark);
//     border-radius: 999px; padding: 5px 14px; margin-bottom: 28px;
//     animation: lp-fadeUp 0.7s 0.2s var(--ease) both;
//   }
//   .lp-hero-eyebrow-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--sage-deep); }
//   .lp-hero-eyebrow span {
//     font-size: 12px; font-weight: 600; color: var(--sage-deep);
//     letter-spacing: 0.5px; text-transform: uppercase;
//   }
//   .lp-hero-h1 {
//     font-family: var(--fd); font-size: clamp(52px, 5.5vw, 82px);
//     font-weight: 700; line-height: 1.04; letter-spacing: -1.5px;
//     color: var(--ink); margin-bottom: 24px;
//     animation: lp-fadeUp 0.7s 0.35s var(--ease) both;
//   }
//   .lp-hero-h1 em { font-style: italic; color: var(--sage-deep); }
//   .lp-hero-sub {
//     font-size: 17px; color: var(--ash); line-height: 1.75;
//     max-width: 440px; margin-bottom: 40px;
//     animation: lp-fadeUp 0.7s 0.5s var(--ease) both;
//   }
//   .lp-hero-actions {
//     display: flex; align-items: center; gap: 16px;
//     animation: lp-fadeUp 0.7s 0.65s var(--ease) both;
//   }
//   .lp-btn-hero {
//     font-family: var(--fs); font-size: 15px; font-weight: 600;
//     color: var(--white); background: var(--ink); border: none; cursor: pointer;
//     padding: 14px 28px; border-radius: 10px;
//     display: flex; align-items: center; gap: 8px;
//     box-shadow: 0 4px 20px rgba(0,0,0,0.2);
//     transition: transform 0.15s, box-shadow 0.2s;
//   }
//   .lp-btn-hero:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(0,0,0,0.24); }
//   .lp-btn-hero:active { transform: scale(0.97); }
//   .lp-btn-text {
//     font-family: var(--fs); font-size: 14px; font-weight: 500;
//     color: var(--ash); background: none; border: none; cursor: pointer;
//     transition: color 0.2s;
//   }
//   .lp-btn-text:hover { color: var(--ink); }

//   /* ── Mockup ── */
//   .lp-hero-right {
//     display: flex; justify-content: center;
//     animation: lp-fadeLeft 0.8s 0.4s var(--ease) both;
//   }
//   .lp-mockup { position: relative; width: 330px; }
//   .lp-card {
//     background: var(--white); border-radius: 24px;
//     border: 1px solid var(--cloud); padding: 28px;
//     box-shadow: 0 32px 80px rgba(0,0,0,0.10), 0 8px 24px rgba(0,0,0,0.06);
//     animation: lp-float 4s ease-in-out infinite;
//   }
//   .lp-card-header {
//     display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px;
//   }
//   .lp-card-brand { display: flex; align-items: center; gap: 10px; }
//   .lp-card-logo {
//     width: 40px; height: 40px; border-radius: 10px;
//     background: var(--ink); display: flex; align-items: center; justify-content: center;
//   }
//   .lp-card-brand-name { font-family: var(--fd); font-size: 16px; font-weight: 600; color: var(--ink); }
//   .lp-card-brand-cat { font-size: 11px; color: var(--ash); }
//   .lp-score {
//     background: var(--sage-light); border: 1px solid var(--sage-dark);
//     border-radius: 999px; padding: 4px 12px;
//     font-size: 12px; font-weight: 700; color: var(--sage-deep);
//   }
//   .lp-card-size {
//     text-align: center; padding: 20px 0;
//     border-top: 1px solid var(--cloud); border-bottom: 1px solid var(--cloud);
//     margin-bottom: 20px;
//   }
//   .lp-size-label { font-size: 11px; color: var(--ash); letter-spacing: 0.6px; text-transform: uppercase; margin-bottom: 4px; }
//   .lp-size-num {
//     font-family: var(--fd); font-size: 72px; font-weight: 700;
//     line-height: 1; color: var(--ink); letter-spacing: -3px;
//   }
//   .lp-size-tag { font-size: 12px; font-weight: 600; color: var(--sage-deep); margin-top: 4px; }
//   .lp-card-pills { display: flex; gap: 10px; }
//   .lp-pill {
//     flex: 1; background: var(--paper); border: 1px solid var(--cloud);
//     border-radius: 10px; padding: 10px 12px;
//   }
//   .lp-pill-label { font-size: 10px; color: var(--ash); letter-spacing: 0.4px; text-transform: uppercase; }
//   .lp-pill-val { font-size: 15px; font-weight: 600; color: var(--ink); margin-top: 2px; }

//   .lp-chip {
//     position: absolute; background: var(--white);
//     border: 1px solid var(--cloud); border-radius: 12px;
//     padding: 10px 14px; display: flex; align-items: center; gap: 8px;
//     box-shadow: 0 8px 24px rgba(0,0,0,0.08);
//     font-size: 12px; font-weight: 600; color: var(--ink); white-space: nowrap;
//   }
//   .lp-chip-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
//   .lp-chip-1 { top: -16px; left: -60px; animation: lp-chip1 5s ease-in-out infinite; }
//   .lp-chip-2 { bottom: 48px; right: -56px; animation: lp-chip2 4.5s ease-in-out infinite 0.8s; }
//   .lp-chip-3 { bottom: -14px; left: -36px; animation: lp-chip3 5.5s ease-in-out infinite 0.3s; }

//   /* ── Stats bar ── */
//   .lp-stats { background: var(--ink); padding: 32px 56px; }
//   .lp-stats-inner {
//     max-width: 1320px; margin: 0 auto;
//     display: grid; grid-template-columns: repeat(4, 1fr);
//   }
//   .lp-stat {
//     text-align: center; padding: 16px;
//     border-right: 1px solid rgba(255,255,255,0.08);
//   }
//   .lp-stat:last-child { border-right: none; }
//   .lp-stat-num {
//     font-family: var(--fd); font-size: 44px; font-weight: 700;
//     color: var(--white); letter-spacing: -1px; line-height: 1; margin-bottom: 6px;
//   }
//   .lp-stat-num span { color: var(--sage); }
//   .lp-stat-label { font-size: 13px; color: rgba(255,255,255,0.4); }

//   /* ── Sections ── */
//   .lp-section { padding: 100px 56px; }
//   .lp-section-inner { max-width: 1320px; margin: 0 auto; }
//   .lp-eyebrow {
//     display: inline-flex; align-items: center; gap: 10px; margin-bottom: 20px;
//   }
//   .lp-eyebrow-line { width: 32px; height: 1.5px; background: var(--sage-deep); }
//   .lp-eyebrow span {
//     font-size: 12px; font-weight: 600; color: var(--sage-deep);
//     letter-spacing: 1px; text-transform: uppercase;
//   }
//   .lp-section-title {
//     font-family: var(--fd); font-size: clamp(36px, 4vw, 56px);
//     font-weight: 700; letter-spacing: -1px; line-height: 1.08;
//     color: var(--ink); margin-bottom: 16px;
//   }
//   .lp-section-title em { font-style: italic; color: var(--sage-deep); }
//   .lp-section-sub { font-size: 16px; color: var(--ash); max-width: 520px; line-height: 1.75; }

//   /* ── How it works ── */
//   .lp-how { background: var(--white); }
//   .lp-how-grid {
//     display: grid; grid-template-columns: 1fr 1fr;
//     gap: 80px; align-items: center; margin-top: 64px;
//   }
//   .lp-steps { display: flex; flex-direction: column; }
//   .lp-step {
//     display: flex; gap: 22px; padding: 26px 0;
//     border-bottom: 1px solid var(--cloud); cursor: default;
//   }
//   .lp-step:first-child { border-top: 1px solid var(--cloud); }
//   .lp-step:hover .lp-step-num { background: var(--ink); color: var(--white); }
//   .lp-step-num {
//     width: 40px; height: 40px; border-radius: 10px;
//     background: var(--paper); border: 1px solid var(--cloud);
//     display: flex; align-items: center; justify-content: center;
//     font-family: var(--fd); font-size: 18px; font-weight: 700;
//     color: var(--ink); flex-shrink: 0; transition: all 0.2s;
//   }
//   .lp-step-title { font-size: 15px; font-weight: 600; color: var(--ink); margin-bottom: 6px; }
//   .lp-step-desc { font-size: 13.5px; color: var(--ash); line-height: 1.65; }
//   .lp-how-vis {
//     background: var(--paper); border-radius: 24px;
//     border: 1px solid var(--cloud); padding: 32px;
//     position: relative; overflow: hidden;
//   }
//   .lp-how-vis-glow {
//     position: absolute; inset: 0;
//     background: radial-gradient(ellipse at 70% 20%, rgba(195,216,193,0.2) 0%, transparent 65%);
//     pointer-events: none;
//   }
//   .lp-meas-label-col { font-size: 11px; font-weight: 600; color: var(--ash); width: 72px; text-align: right; }
//   .lp-bar-wrap { flex: 1; background: var(--cloud); border-radius: 999px; height: 8px; overflow: hidden; }
//   .lp-bar { height: 100%; border-radius: 999px; background: var(--sage-deep); }
//   .lp-meas-val { font-size: 12px; font-weight: 700; color: var(--ink); width: 48px; }

//   /* ── Features ── */
//   .lp-features-grid {
//     display: grid; grid-template-columns: repeat(3, 1fr);
//     gap: 24px; margin-top: 64px;
//   }
//   .lp-feature-card {
//     background: var(--white); border: 1px solid var(--cloud);
//     border-radius: 20px; padding: 32px;
//     transition: transform 0.22s, box-shadow 0.22s;
//   }
//   .lp-feature-card:hover { transform: translateY(-5px); box-shadow: 0 20px 52px rgba(0,0,0,0.08); }
//   .lp-feature-icon {
//     width: 48px; height: 48px; border-radius: 12px;
//     display: flex; align-items: center; justify-content: center;
//     margin-bottom: 20px; font-size: 22px;
//     background: var(--sage-light); border: 1px solid var(--sage-dark);
//   }
//   .lp-feature-icon img {
//     width: 24px;
//     height: 24px;
//     display: block;
//     object-fit: contain;
//   }
//   .lp-feature-icon.accent { background: var(--sage-light); border-color: var(--sage-dark); }
//   .lp-feature-title { font-size: 15.5px; font-weight: 600; color: var(--ink); margin-bottom: 10px; }
//   .lp-feature-desc { font-size: 13.5px; color: var(--ash); line-height: 1.65; }

//   /* ── Brands ── */
//   .lp-brands { background: var(--white); }
//   .lp-brands-grid {
//     display: grid; grid-template-columns: repeat(6, 1fr);
//     gap: 14px; margin-top: 48px;
//   }
//   .lp-brand-pill {
//     background: var(--paper); border: 1px solid var(--cloud);
//     border-radius: 12px; padding: 14px 10px;
//     text-align: center; font-size: 13px; font-weight: 600; color: var(--ash);
//     transition: all 0.2s; cursor: default;
//   }
//   .lp-brand-pill:hover {
//     background: var(--white); border-color: var(--ink);
//     color: var(--ink); transform: translateY(-3px);
//     box-shadow: 0 8px 20px rgba(0,0,0,0.07);
//   }

//   /* ═══════════════════════════════════════════
//      MOBILE APP SECTION
//   ═══════════════════════════════════════════ */
//   .lp-app-section {
//     padding: 110px 56px;
//     background: var(--ink);
//     position: relative; overflow: hidden;
//   }

//   /* Background decoration */
//   .lp-app-bg-glow-1 {
//     position: absolute; top: -120px; left: -80px;
//     width: 500px; height: 500px; border-radius: 50%;
//     background: rgba(195,216,193,0.06); pointer-events: none;
//   }
//   .lp-app-bg-glow-2 {
//     position: absolute; bottom: -100px; right: -60px;
//     width: 400px; height: 400px; border-radius: 50%;
//     background: rgba(195,216,193,0.04); pointer-events: none;
//   }
//   .lp-app-grid-overlay {
//     position: absolute; inset: 0; pointer-events: none;
//     background-image:
//       linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
//       linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
//     background-size: 52px 52px;
//   }

//   .lp-app-inner {
//     max-width: 1320px; margin: 0 auto;
//     display: grid; grid-template-columns: 1fr 1fr;
//     gap: 80px; align-items: center;
//     position: relative; z-index: 1;
//   }

//   /* Left: copy */
//   .lp-app-left {}

//   .lp-app-eyebrow {
//     display: inline-flex; align-items: center; gap: 8px;
//     background: rgba(195,216,193,0.12);
//     border: 1px solid rgba(195,216,193,0.2);
//     border-radius: 999px; padding: 5px 14px; margin-bottom: 28px;
//   }
//   .lp-app-eyebrow-dot {
//     width: 7px; height: 7px; border-radius: 50%;
//     background: var(--sage);
//     box-shadow: 0 0 6px var(--sage);
//     animation: lp-pulseDot 2.5s ease-in-out infinite;
//   }
//   .lp-app-eyebrow span {
//     font-size: 12px; font-weight: 600; color: var(--sage);
//     letter-spacing: 0.5px; text-transform: uppercase;
//   }

//   .lp-app-title {
//     font-family: var(--fd); font-size: clamp(44px, 5vw, 72px);
//     font-weight: 700; color: var(--white);
//     line-height: 1.04; letter-spacing: -1.5px;
//     margin-bottom: 22px;
//   }
//   .lp-app-title em { font-style: italic; color: var(--sage); }

//   .lp-app-sub {
//     font-size: 16px; color: rgba(255,255,255,0.48);
//     line-height: 1.75; max-width: 440px; margin-bottom: 40px;
//   }

//   /* Feature bullets */
//   .lp-app-bullets {
//     display: flex; flex-direction: column; gap: 14px;
//     margin-bottom: 44px;
//   }
//   .lp-app-bullet {
//     display: flex; align-items: center; gap: 14px;
//   }
//   .lp-app-bullet-icon {
//     width: 36px; height: 36px; border-radius: 9px;
//     background: rgba(195,216,193,0.10);
//     border: 1px solid rgba(195,216,193,0.16);
//     display: flex; align-items: center; justify-content: center;
//     flex-shrink: 0; font-size: 16px;
//   }
//   .lp-app-bullet-icon img {
//     width: 18px;
//     height: 18px;
//     display: block;
//     object-fit: contain;
//   }
//   .lp-app-bullet-text {
//     font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.75);
//     line-height: 1.4;
//   }

//   /* Download buttons */
//   .lp-app-downloads { display: flex; gap: 14px; flex-wrap: wrap; }

//   .lp-store-btn {
//     display: flex; align-items: center; gap: 12px;
//     background: rgba(255,255,255,0.07);
//     border: 1px solid rgba(255,255,255,0.12);
//     border-radius: 14px; padding: 12px 20px;
//     cursor: pointer; text-decoration: none;
//     transition: background 0.2s, transform 0.15s, border-color 0.2s;
//     min-width: 160px;
//   }
//   .lp-store-btn:hover {
//     background: rgba(255,255,255,0.12);
//     border-color: rgba(255,255,255,0.22);
//     transform: translateY(-2px);
//   }
//   .lp-store-btn:active { transform: scale(0.97); }

//   .lp-store-icon { flex-shrink: 0; }
//   .lp-store-icon img {
//     width: 26px;
//     height: 26px;
//     display: block;
//     object-fit: contain;
//   }

//   .lp-store-text {}
//   .lp-store-text-small {
//     font-size: 10px; font-weight: 600;
//     color: rgba(255,255,255,0.45);
//     letter-spacing: 0.3px; display: block; margin-bottom: 1px;
//   }
//   .lp-store-text-big {
//     font-size: 15px; font-weight: 700;
//     color: var(--white); display: block; letter-spacing: -0.2px;
//   }

//   /* Coming soon badge */
//   .lp-store-btn.coming-soon {
//     opacity: 0.55; cursor: default; pointer-events: none;
//   }
//   .lp-coming-badge {
//     font-size: 9px; font-weight: 800;
//     background: var(--sage-deep); color: var(--white);
//     border-radius: 999px; padding: 2px 7px;
//     letter-spacing: 0.3px; text-transform: uppercase;
//     margin-top: 2px; display: inline-block;
//   }

//   /* Right: phone mockups */
//   .lp-app-right {
//     display: flex; align-items: center; justify-content: center;
//     position: relative;
//   }

//   .lp-phones-wrap {
//     position: relative; width: 380px; height: 520px;
//   }

//   /* Phone frame */
//   .lp-phone {
//     position: absolute;
//     width: 220px;
//     background: #0D0D0D;
//     border-radius: 36px;
//     border: 2px solid rgba(255,255,255,0.12);
//     overflow: hidden;
//     box-shadow: 0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05);
//   }
//   .lp-phone-notch {
//     position: absolute; top: 0; left: 50%; transform: translateX(-50%);
//     width: 80px; height: 28px;
//     background: #0D0D0D; border-radius: 0 0 18px 18px;
//     z-index: 10;
//     display: flex; align-items: center; justify-content: center; gap: 5px;
//   }
//   .lp-phone-notch-cam {
//     width: 10px; height: 10px; border-radius: 50%;
//     background: #1a1a1a; border: 1px solid rgba(255,255,255,0.06);
//   }

//   .lp-phone-screen {
//     width: 100%;
//     background: var(--paper);
//     display: flex; flex-direction: column;
//     padding-top: 28px;
//     min-height: 400px;
//   }

//   /* Phone 1: Home screen (left, slightly behind) */
//   .lp-phone-1 {
//     left: 0; top: 40px;
//     animation: lp-float 4.5s ease-in-out infinite;
//     z-index: 1;
//   }
//   .lp-phone-1 .lp-phone-screen { background: var(--paper); }

//   /* Home screen UI */
//   .lp-ph-home-topbar {
//     display: flex; align-items: center; justify-content: space-between;
//     padding: 8px 14px 6px;
//   }
//   .lp-ph-brand-name {
//     font-family: var(--fd); font-size: 13px; font-weight: 700; color: var(--ink);
//   }
//   .lp-ph-avatar {
//     width: 24px; height: 24px; border-radius: 50%;
//     background: var(--ink); display: flex; align-items: center; justify-content: center;
//     font-size: 9px; font-weight: 800; color: var(--white); flex-shrink: 0;
//   }
//   .lp-ph-greeting {
//     padding: 8px 14px 12px;
//   }
//   .lp-ph-greeting-sub { font-size: 9px; color: var(--ash); margin-bottom: 2px; }
//   .lp-ph-greeting-title { font-family: var(--fd); font-size: 16px; font-weight: 700; color: var(--ink); letter-spacing: -.3px; }
//   .lp-ph-search {
//     margin: 0 14px 12px;
//     height: 28px; background: var(--cloud); border-radius: 8px;
//     display: flex; align-items: center; padding: 0 10px; gap: 6px;
//   }
//   .lp-ph-search-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--ash); opacity: 0.4; }
//   .lp-ph-search-bar { flex: 1; height: 3px; background: var(--mist, #D4D4D4); border-radius: 2px; opacity: 0.5; }
//   .lp-ph-chips {
//     display: flex; gap: 6px; padding: 0 14px 12px; overflow: hidden;
//   }
//   .lp-ph-chip {
//     font-size: 8px; font-weight: 700; padding: 4px 9px;
//     border-radius: 999px; border: 1px solid var(--cloud); white-space: nowrap;
//     background: var(--white); color: var(--ash);
//   }
//   .lp-ph-chip.active { background: var(--ink); color: var(--white); border-color: var(--ink); }
//   .lp-ph-grid {
//     display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 0 14px;
//   }
//   .lp-ph-card {
//     background: var(--white); border-radius: 12px;
//     border: 1px solid var(--cloud); overflow: hidden;
//   }
//   .lp-ph-card-img {
//     height: 52px; background: var(--cloud);
//     display: flex; align-items: center; justify-content: center;
//     position: relative;
//   }
//   .lp-ph-card-score {
//     position: absolute; top: 4px; right: 4px;
//     background: var(--ink); border-radius: 4px; padding: 2px 5px;
//     font-size: 7px; font-weight: 800; color: var(--white);
//   }
//   .lp-ph-card-body { padding: 6px 8px; }
//   .lp-ph-card-brand { font-size: 7px; font-weight: 700; color: var(--ash); text-transform: uppercase; letter-spacing: .3px; }
//   .lp-ph-card-size { font-family: var(--fd); font-size: 16px; font-weight: 700; color: var(--ink); line-height: 1; }

//   /* Phone 2: Size result (right, front) */
//   .lp-phone-2 {
//     right: 0; top: 0;
//     animation: lp-float 3.8s ease-in-out infinite 0.6s;
//     z-index: 2;
//   }
//   .lp-phone-2 .lp-phone-screen { background: var(--ink); }

//   .lp-ph-result-topbar {
//     display: flex; align-items: center; justify-content: space-between;
//     padding: 8px 14px 10px;
//   }
//   .lp-ph-result-back {
//     width: 20px; height: 20px; border-radius: 6px;
//     background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1);
//     display: flex; align-items: center; justify-content: center;
//   }
//   .lp-ph-result-back-line {
//     width: 8px; height: 1.5px; background: rgba(255,255,255,0.6);
//     border-radius: 1px;
//   }
//   .lp-ph-result-label { font-size: 9px; font-weight: 700; color: rgba(255,255,255,0.5); }
//   .lp-ph-brand-section {
//     padding: 0 14px 14px;
//     display: flex; align-items: center; gap: 8px;
//   }
//   .lp-ph-brand-logo {
//     width: 28px; height: 28px; border-radius: 7px;
//     background: rgba(255,255,255,0.10); border: 1px solid rgba(255,255,255,0.08);
//     display: flex; align-items: center; justify-content: center;
//     font-size: 10px; font-weight: 800; color: var(--sage);
//     flex-shrink: 0;
//   }
//   .lp-ph-brand-info {}
//   .lp-ph-brand-name-sm { font-size: 11px; font-weight: 700; color: var(--white); }
//   .lp-ph-brand-cat-sm { font-size: 9px; color: rgba(255,255,255,0.35); }
//   .lp-ph-score-badge {
//     margin-left: auto;
//     background: var(--sage-light); border-radius: 999px;
//     padding: 3px 9px;
//     font-size: 9px; font-weight: 800; color: var(--sage-deep);
//   }
//   .lp-ph-size-hero {
//     text-align: center; padding: 16px 14px 14px;
//     border-top: 1px solid rgba(255,255,255,0.07);
//     border-bottom: 1px solid rgba(255,255,255,0.07);
//     margin: 0 14px 14px;
//     border-radius: 12px;
//     background: rgba(255,255,255,0.04);
//   }
//   .lp-ph-size-eyebrow { font-size: 8px; font-weight: 700; color: rgba(255,255,255,0.35); letter-spacing: .5px; text-transform: uppercase; margin-bottom: 4px; }
//   .lp-ph-size-big { font-family: var(--fd); font-size: 52px; font-weight: 700; color: var(--white); letter-spacing: -2px; line-height: 1; }
//   .lp-ph-size-tag { font-size: 9px; font-weight: 700; color: var(--sage); margin-top: 4px; }
//   .lp-ph-meas-row {
//     display: flex; gap: 6px; padding: 0 14px;
//   }
//   .lp-ph-meas-chip {
//     flex: 1; background: rgba(255,255,255,0.06);
//     border: 1px solid rgba(255,255,255,0.08);
//     border-radius: 8px; padding: 6px 8px;
//   }
//   .lp-ph-meas-chip-label { font-size: 7px; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: .3px; }
//   .lp-ph-meas-chip-val { font-size: 10px; font-weight: 700; color: var(--white); margin-top: 2px; }

//   /* Tab bar on phone 1 */
//   .lp-ph-tabbar {
//     display: flex; margin-top: auto; padding: 10px 14px 12px;
//     background: rgba(255,255,255,0.92); border-top: 1px solid var(--cloud);
//     justify-content: space-around;
//   }
//   .lp-ph-tab {
//     display: flex; flex-direction: column; align-items: center; gap: 3px;
//   }
//   .lp-ph-tab-dot { width: 14px; height: 14px; border-radius: 3px; background: var(--cloud); }
//   .lp-ph-tab-dot.active { background: var(--ink); }
//   .lp-ph-tab-label { font-size: 6px; font-weight: 700; color: var(--ash); }
//   .lp-ph-tab-label.active { color: var(--ink); }

//   /* CTA button on phone 2 */
//   .lp-ph-cta-btn {
//     margin: 14px 14px 0;
//     height: 32px; background: var(--sage-deep); border-radius: 9px;
//     display: flex; align-items: center; justify-content: center;
//     font-size: 9px; font-weight: 800; color: var(--white); letter-spacing: .2px;
//   }

//   /* Floating tag */
//   .lp-app-float-tag {
//     position: absolute; right: -20px; top: 60px;
//     background: var(--white); border: 1px solid var(--cloud);
//     border-radius: 12px; padding: 10px 14px;
//     display: flex; align-items: center; gap: 8px;
//     box-shadow: 0 8px 24px rgba(0,0,0,0.15);
//     font-size: 11px; font-weight: 700; color: var(--ink);
//     white-space: nowrap; z-index: 5;
//     animation: lp-chip2 5s ease-in-out infinite 1s;
//   }
//   .lp-app-float-tag-dot {
//     width: 8px; height: 8px; border-radius: 50%;
//     background: var(--sage-deep); flex-shrink: 0;
//     box-shadow: 0 0 5px var(--sage-deep);
//   }

//   /* ── CTA ── */
//   .lp-cta { background: var(--ink); padding: 110px 56px; position: relative; overflow: hidden; }
//   .lp-cta-glow {
//     position: absolute; inset: 0;
//     background: radial-gradient(ellipse at 20% 50%, rgba(195,216,193,0.09) 0%, transparent 55%),
//                 radial-gradient(ellipse at 80% 20%, rgba(195,216,193,0.05) 0%, transparent 50%);
//     pointer-events: none;
//   }
//   .lp-cta-inner { max-width: 680px; margin: 0 auto; text-align: center; position: relative; z-index: 1; }
//   .lp-cta-title {
//     font-family: var(--fd); font-size: clamp(40px, 5vw, 66px);
//     font-weight: 700; color: var(--white); letter-spacing: -1.5px;
//     line-height: 1.04; margin-bottom: 20px;
//   }
//   .lp-cta-title em { font-style: italic; color: var(--sage); }
//   .lp-cta-sub { font-size: 16px; color: rgba(255,255,255,0.45); margin-bottom: 44px; line-height: 1.75; }
//   .lp-cta-actions { display: flex; align-items: center; justify-content: center; gap: 16px; }
//   .lp-btn-sage {
//     font-family: var(--fs); font-size: 15px; font-weight: 600;
//     color: var(--ink); background: var(--sage-light);
//     border: 1px solid var(--sage-dark); cursor: pointer;
//     padding: 14px 28px; border-radius: 10px;
//     display: flex; align-items: center; gap: 8px;
//     transition: transform 0.15s, box-shadow 0.2s;
//   }
//   .lp-btn-sage:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(195,216,193,0.3); }
//   .lp-btn-sage:active { transform: scale(0.97); }
//   .lp-btn-ghost-white {
//     font-family: var(--fs); font-size: 14px; font-weight: 500;
//     color: rgba(255,255,255,0.4); background: none; border: none; cursor: pointer;
//     transition: color 0.2s;
//   }
//   .lp-btn-ghost-white:hover { color: var(--white); }

//   /* ── Footer ── */
//   .lp-footer {
//     background: var(--ink); border-top: 1px solid rgba(255,255,255,0.07);
//     padding: 30px 56px;
//     display: flex; align-items: center; justify-content: space-between;
//   }
//   .lp-footer-logo { font-family: var(--fd); font-size: 17px; font-weight: 600; color: rgba(255,255,255,0.35); }
//   .lp-footer-copy { font-size: 12px; color: rgba(255,255,255,0.22); }
//   .lp-footer-links { display: flex; gap: 24px; }
//   .lp-footer-links a { font-size: 12px; color: rgba(255,255,255,0.28); text-decoration: none; transition: color 0.2s; }
//   .lp-footer-links a:hover { color: rgba(255,255,255,0.7); }

//   /* ── Scroll reveal ── */
//   .lp-reveal {
//     opacity: 0; transform: translateY(28px);
//     transition: opacity 0.7s var(--ease), transform 0.7s var(--ease);
//   }
//   .lp-reveal.lp-vis { opacity: 1; transform: none; }
//   .lp-d1 { transition-delay: 0.08s; }
//   .lp-d2 { transition-delay: 0.16s; }
//   .lp-d3 { transition-delay: 0.24s; }
//   .lp-d4 { transition-delay: 0.32s; }
//   .lp-d5 { transition-delay: 0.40s; }
//   .lp-d6 { transition-delay: 0.48s; }

//   /* ── Keyframes ── */
//   @keyframes lp-slideDown {
//     from { transform: translateY(-100%); opacity: 0; }
//     to   { transform: translateY(0);     opacity: 1; }
//   }
//   @keyframes lp-fadeUp {
//     from { opacity: 0; transform: translateY(24px); }
//     to   { opacity: 1; transform: none; }
//   }
//   @keyframes lp-fadeLeft {
//     from { opacity: 0; transform: translateX(40px); }
//     to   { opacity: 1; transform: none; }
//   }
//   @keyframes lp-float {
//     0%, 100% { transform: translateY(0); }
//     50%       { transform: translateY(-10px); }
//   }
//   @keyframes lp-chip1 {
//     0%, 100% { transform: translate(0, 0); }
//     50%       { transform: translate(-4px, -8px); }
//   }
//   @keyframes lp-chip2 {
//     0%, 100% { transform: translate(0, 0); }
//     50%       { transform: translate(4px, -7px); }
//   }
//   @keyframes lp-chip3 {
//     0%, 100% { transform: translate(0, 0); }
//     50%       { transform: translate(-3px, 6px); }
//   }
//   @keyframes lp-growBar {
//     from { width: 0; }
//     to   { width: var(--w); }
//   }
//   @keyframes lp-pulseDot {
//     0%, 100% { opacity: 1; box-shadow: 0 0 5px var(--sage); }
//     50%       { opacity: 0.5; box-shadow: 0 0 2px var(--sage); }
//   }
// `;

// if (!document.getElementById('lp-styles')) {
//   const s = document.createElement('style');
//   s.id = 'lp-styles';
//   s.textContent = CSS;
//   document.head.appendChild(s);
// }

// /* ─────────────────────────────────────────────
//    Sub-components
// ───────────────────────────────────────────── */
// type MeasureBarStyle = CSSProperties & { '--w': string };

// function MeasureBar({ label, pct, val, delay = 0 }: { label: string; pct: string; val: string; delay?: number }) {
//   const barStyle: MeasureBarStyle = {
//     '--w': pct,
//     width: pct,
//     animation: `lp-growBar 1.4s ${delay}s cubic-bezier(0.22,1,0.36,1) both`,
//   };
//   return (
//     <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
//       <span className="lp-meas-label-col">{label}</span>
//       <div className="lp-bar-wrap"><div className="lp-bar" style={barStyle} /></div>
//       <span className="lp-meas-val">{val}</span>
//     </div>
//   );
// }

// function FeatureCard({ icon, accent, title, desc }: { icon: ReactNode; accent: boolean; title: string; desc: string }) {
//   return (
//     <div className="lp-feature-card">
//       <div className={`lp-feature-icon${accent ? ' accent' : ''}`}>{icon}</div>
//       <div className="lp-feature-title">{title}</div>
//       <div className="lp-feature-desc">{desc}</div>
//     </div>
//   );
// }

// const FEATURES = [
//   { icon: <img src={rulerIcon} alt="" aria-hidden="true" />,  accent: true,  title: 'Guided measurements',   desc: 'Step-by-step illustrated guides make measuring yourself accurate and effortless — even for first timers.' },
//   { icon: <img src={searchIcon} alt="" aria-hidden="true" />, accent: true,  title: '500+ brand database',    desc: 'Every major brand and hundreds of niche labels, all with real sizing data mapped to your body.' },
//   { icon: <img src={qrCodeIcon} alt="" aria-hidden="true" />, accent: false, title: 'QR scan in-store',       desc: 'Scan any clothing tag QR code in a physical store. Get your size in under a second, right on the spot.' },
//   { icon: <img src={clothesIcon} alt="" aria-hidden="true" />, accent: false, title: 'Multi-category profiles', desc: 'Different sizes for tops, trousers, dresses, and shoes — one profile handles every type you wear.' },
//   { icon: <img src={scaleIcon} alt="" aria-hidden="true" />,  accent: true,  title: 'Outfit fit scoring',     desc: 'Compare outfits across brands with a combined fit score so you know which complete look works best.' },
//   { icon: <img src={lockIcon} alt="" aria-hidden="true" />,   accent: false, title: 'Private by design',      desc: 'Your measurements stay on your account. We never share or sell your sizing data to brands or third parties.' },
// ];

// const BRANDS = [
//   'H&M','Zara','Nike','Uniqlo','Adidas','Mango',
//   "Levi's",'Gap','Marks & Spencer','Pull & Bear','Massimo Dutti','Bershka',
// ];

// const STATS = [
//   { num: '500', suffix: '+', label: 'Brands supported' },
//   { num: '98',  suffix: '%', label: 'Size accuracy' },
//   { num: '2',   suffix: 'M+', label: 'Sizes matched' },
//   { num: '0',   suffix: '',   label: 'Returns from bad fit' },
// ];

// const APP_BULLETS = [
//   { icon: <img src={cameraIcon} alt="" aria-hidden="true" />, text: 'Scan QR codes in-store for instant size recommendations' },
//   { icon: <img src={tshirtIcon} alt="" aria-hidden="true" />, text: 'Guided measurement illustrations for every clothing type' },
//   { icon: <img src={starIcon} alt="" aria-hidden="true" />, text: 'Outfit fit scoring across multiple brands at once' },
//   { icon: <img src={clothesIcon} alt="" aria-hidden="true" />, text: 'Save profiles for tops, trousers, dresses, shoes and more' },
// ];

// /* ─────────────────────────────────────────────
//    Phone mockup: Home screen
// ───────────────────────────────────────────── */
// function PhoneHome() {
//   return (
//     <div className="lp-phone lp-phone-1" style={{ height: 400 }}>
//       <div className="lp-phone-notch">
//         <div className="lp-phone-notch-cam" />
//       </div>
//       <div className="lp-phone-screen" style={{ background: 'var(--paper)' }}>
//         <div className="lp-ph-home-topbar">
//           <span className="lp-ph-brand-name">MatchMySize</span>
//           <div className="lp-ph-avatar">K</div>
//         </div>
//         <div className="lp-ph-greeting">
//           <div className="lp-ph-greeting-sub">Good morning,</div>
//           <div className="lp-ph-greeting-title">Find your size</div>
//         </div>
//         <div className="lp-ph-search">
//           <div className="lp-ph-search-dot" />
//           <div className="lp-ph-search-bar" />
//         </div>
//         <div className="lp-ph-chips">
//           <div className="lp-ph-chip active">Tops</div>
//           <div className="lp-ph-chip">Jeans</div>
//           <div className="lp-ph-chip">Shoes</div>
//         </div>
//         <div className="lp-ph-grid">
//           {[
//             { brand: 'H&M', score: '96%', size: 'M' },
//             { brand: 'Zara', score: '91%', size: 'S' },
//             { brand: 'Nike', score: '98%', size: 'L' },
//             { brand: 'Uniqlo', score: '94%', size: 'M' },
//           ].map(({ brand, score, size }) => (
//             <div className="lp-ph-card" key={brand}>
//               <div className="lp-ph-card-img">
//                 <div style={{ width: '100%', height: '100%', background: 'var(--cloud)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
//                   👕
//                 </div>
//                 <div className="lp-ph-card-score">{score}</div>
//               </div>
//               <div className="lp-ph-card-body">
//                 <div className="lp-ph-card-brand">{brand}</div>
//                 <div className="lp-ph-card-size">{size}</div>
//               </div>
//             </div>
//           ))}
//         </div>
//         <div className="lp-ph-tabbar">
//           {[['Home', true], ['Explore', false], ['Scan', false], ['Profile', false]].map(([label, active]) => (
//             <div className="lp-ph-tab" key={String(label)}>
//               <div className={`lp-ph-tab-dot${active ? ' active' : ''}`} />
//               <div className={`lp-ph-tab-label${active ? ' active' : ''}`}>{label}</div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ─────────────────────────────────────────────
//    Phone mockup: Size result screen
// ───────────────────────────────────────────── */
// function PhoneResult() {
//   return (
//     <div className="lp-phone lp-phone-2" style={{ height: 420 }}>
//       <div className="lp-phone-notch">
//         <div className="lp-phone-notch-cam" />
//       </div>
//       <div className="lp-phone-screen" style={{ background: 'var(--ink)' }}>
//         <div className="lp-ph-result-topbar">
//           <div className="lp-ph-result-back"><div className="lp-ph-result-back-line" /></div>
//           <span className="lp-ph-result-label">Size result</span>
//           <div style={{ width: 20 }} />
//         </div>
//         <div className="lp-ph-brand-section">
//           <div className="lp-ph-brand-logo">H&M</div>
//           <div className="lp-ph-brand-info">
//             <div className="lp-ph-brand-name-sm">H&M</div>
//             <div className="lp-ph-brand-cat-sm">Tops & Shirts</div>
//           </div>
//           <div className="lp-ph-score-badge">96%</div>
//         </div>
//         <div className="lp-ph-size-hero">
//           <div className="lp-ph-size-eyebrow">Your size</div>
//           <div className="lp-ph-size-big">M</div>
//           <div className="lp-ph-size-tag">✓ Excellent fit</div>
//         </div>
//         <div className="lp-ph-meas-row">
//           {[['Chest','92 cm'],['Waist','78 cm'],['Shoulder','44 cm']].map(([l,v]) => (
//             <div className="lp-ph-meas-chip" key={l}>
//               <div className="lp-ph-meas-chip-label">{l}</div>
//               <div className="lp-ph-meas-chip-val">{v}</div>
//             </div>
//           ))}
//         </div>
//         <div className="lp-ph-cta-btn">Find in store →</div>
//       </div>
//     </div>
//   );
// }

// /* ─────────────────────────────────────────────
//    Main component
// ───────────────────────────────────────────── */
// export function LandingPage() {
//   useEffect(() => {
//     const els = document.querySelectorAll('.lp-reveal');
//     const io = new IntersectionObserver(
//       (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('lp-vis'); }),
//       { threshold: 0.1 }
//     );
//     els.forEach(el => io.observe(el));
//     return () => io.disconnect();
//   }, []);

//   return (
//     <div className="lp-body">

//       {/* ── Navbar ── */}
//       <nav className="lp-nav">
//         <a className="lp-logo" href="/">
//           <div className="lp-logo-mark"><AppLogo size={34} decorative /></div>
//           <span className="lp-logo-text">MatchMySize</span>
//         </a>
//         <ul className="lp-nav-links">
//           <li><a href="#how">How it works</a></li>
//           <li><a href="#features">Features</a></li>
//           <li><a href="#app">Mobile app</a></li>
//           <li><a href="#brands">Brands</a></li>
//         </ul>
//         <div className="lp-nav-cta">
//           <button className="lp-btn-ghost" onClick={() => window.location.href = '/auth/login'}>Sign in</button>
//           <button className="lp-btn-ink" onClick={() => window.location.href = '/auth/register'}>Get started →</button>
//         </div>
//       </nav>

//       {/* ── Hero ── */}
//       <section style={{ padding: 0 }}>
//         <div className="lp-hero">
//           <div>
//             <div className="lp-hero-eyebrow">
//               <div className="lp-hero-eyebrow-dot" />
//               <span>500+ brands · Perfect fit every time</span>
//             </div>
//             <h1 className="lp-hero-h1">Wear what<br />actually <em>fits</em><br />you.</h1>
//             <p className="lp-hero-sub">
//               Enter your measurements once. MatchMySize tells you exactly which size to order across every brand — no more returns, no more guessing.
//             </p>
//             <div className="lp-hero-actions">
//               <button className="lp-btn-hero" onClick={() => window.location.href = '/auth/register'}>Find my size <span>→</span></button>
//               <button className="lp-btn-text" onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}>See how it works ↓</button>
//             </div>
//           </div>
//           <div className="lp-hero-right">
//             <div className="lp-mockup">
//               <div className="lp-chip lp-chip-1"><div className="lp-chip-dot" style={{ background: '#C3D8C1' }} />98% fit score</div>
//               <div className="lp-chip lp-chip-2"><div className="lp-chip-dot" style={{ background: '#0D0D0D' }} />Nike · True to size</div>
//               <div className="lp-chip lp-chip-3"><div className="lp-chip-dot" style={{ background: '#A3BFA1' }} />Zara · Size down</div>
//               <div className="lp-card">
//                 <div className="lp-card-header">
//                   <div className="lp-card-brand">
//                     <div className="lp-card-logo">
//                       <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
//                         <rect x="3" y="3" width="7" height="7" rx="2" fill="#C3D8C1" />
//                         <rect x="12" y="3" width="7" height="7" rx="2" fill="rgba(255,255,255,0.3)" />
//                         <rect x="3" y="12" width="7" height="7" rx="2" fill="rgba(255,255,255,0.2)" />
//                         <rect x="12" y="12" width="7" height="7" rx="2" fill="rgba(255,255,255,0.1)" />
//                       </svg>
//                     </div>
//                     <div>
//                       <div className="lp-card-brand-name">H&M</div>
//                       <div className="lp-card-brand-cat">Tops & Shirts</div>
//                     </div>
//                   </div>
//                   <div className="lp-score">96%</div>
//                 </div>
//                 <div className="lp-card-size">
//                   <div className="lp-size-label">Your size</div>
//                   <div className="lp-size-num">M</div>
//                   <div className="lp-size-tag">✓ Excellent fit</div>
//                 </div>
//                 <div className="lp-card-pills">
//                   {[['Chest','92 cm'],['Waist','78 cm'],['Shoulder','44 cm']].map(([l,v]) => (
//                     <div key={l} className="lp-pill">
//                       <div className="lp-pill-label">{l}</div>
//                       <div className="lp-pill-val">{v}</div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* ── Stats bar ── */}
//       <div className="lp-stats">
//         <div className="lp-stats-inner">
//           {STATS.map(({ num, suffix, label }, i) => (
//             <div key={label} className={`lp-stat lp-reveal lp-d${i}`}>
//               <div className="lp-stat-num">{num}<span>{suffix}</span></div>
//               <div className="lp-stat-label">{label}</div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* ── How it works ── */}
//       <section className="lp-section lp-how" id="how">
//         <div className="lp-section-inner">
//           <div className="lp-eyebrow lp-reveal"><div className="lp-eyebrow-line" /><span>How it works</span></div>
//           <h2 className="lp-section-title lp-reveal lp-d1">Three steps to <em>perfect fit</em></h2>
//           <p className="lp-section-sub lp-reveal lp-d2">No tape measure expertise required. We guide you through every measurement with clear illustrations.</p>
//           <div className="lp-how-grid">
//             <div className="lp-steps lp-reveal lp-d2">
//               {[
//                 ['Measure yourself', 'Chest, waist, hips and more — guided step-by-step with illustrated guides for each measurement point.'],
//                 ['Choose a brand', 'Browse 500+ brands across all clothing categories. Search, filter, or scan a QR tag in-store.'],
//                 ['Get your exact size', 'Instantly see your recommended size with a fit score — no trial and error, no returns.'],
//               ].map(([title, desc], i) => (
//                 <div key={title} className="lp-step">
//                   <div className="lp-step-num">{i + 1}</div>
//                   <div>
//                     <div className="lp-step-title">{title}</div>
//                     <div className="lp-step-desc">{desc}</div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//             <div className="lp-how-vis lp-reveal lp-d3">
//               <div className="lp-how-vis-glow" />
//               <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
//                 <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--ash)', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 8 }}>Your measurements</p>
//                 <MeasureBar label="Chest"    pct="78%" val="92 cm" delay={0} />
//                 <MeasureBar label="Waist"    pct="62%" val="78 cm" delay={0.12} />
//                 <MeasureBar label="Hips"     pct="84%" val="98 cm" delay={0.24} />
//                 <MeasureBar label="Shoulder" pct="54%" val="44 cm" delay={0.36} />
//                 <MeasureBar label="Inseam"   pct="70%" val="80 cm" delay={0.48} />
//                 <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--cloud)' }}>
//                   <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//                     <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>H&M Tops → Size</span>
//                     <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//                       <span style={{ fontFamily: 'var(--fd)', fontSize: 34, fontWeight: 700, color: 'var(--ink)', letterSpacing: -1 }}>M</span>
//                       <span className="lp-score">96%</span>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* ── Features ── */}
//       <section className="lp-section" id="features" style={{ background: 'var(--paper)' }}>
//         <div className="lp-section-inner">
//           <div className="lp-eyebrow lp-reveal"><div className="lp-eyebrow-line" /><span>Features</span></div>
//           <h2 className="lp-section-title lp-reveal lp-d1">Built for how you <em>actually</em> shop</h2>
//           <div className="lp-features-grid">
//             {FEATURES.map(({ icon, accent, title, desc }, i) => (
//               <div key={title} className={`lp-reveal lp-d${i % 6}`}>
//                 <FeatureCard icon={icon} accent={accent} title={title} desc={desc} />
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* ══════════════════════════════════════
//           MOBILE APP SECTION
//       ══════════════════════════════════════ */}
//       <section className="lp-app-section" id="app">
//         <div className="lp-app-bg-glow-1" />
//         <div className="lp-app-bg-glow-2" />
//         <div className="lp-app-grid-overlay" />

//         <div className="lp-app-inner">

//           {/* Left — copy */}
//           <div className="lp-app-left">
//             <div className="lp-app-eyebrow lp-reveal">
//               <div className="lp-app-eyebrow-dot" />
//               <span>Now on mobile</span>
//             </div>

//             <h2 className="lp-app-title lp-reveal lp-d1">
//               Your perfect fit,<br /><em>in your pocket</em>
//             </h2>

//             <p className="lp-app-sub lp-reveal lp-d2">
//               The MatchMySize mobile app brings all your size profiles everywhere you shop — online or in-store. Scan, check, buy with confidence.
//             </p>

//             <div className="lp-app-bullets lp-reveal lp-d3">
//               {APP_BULLETS.map(({ icon, text }) => (
//                 <div className="lp-app-bullet" key={text}>
//                   <div className="lp-app-bullet-icon">{icon}</div>
//                   <span className="lp-app-bullet-text">{text}</span>
//                 </div>
//               ))}
//             </div>

//             <div className="lp-app-downloads lp-reveal lp-d4">
//               {/* App Store */}
//               <a href="#" className="lp-store-btn">
//                 <div className="lp-store-icon">
//                   <img src={appStoreIcon} alt="App Store" />
//                 </div>
//                 <div className="lp-store-text">
//                   <span className="lp-store-text-small">Download on the</span>
//                   <span className="lp-store-text-big">App Store</span>
//                 </div>
//               </a>

//               {/* Google Play */}
//               <a href="#" className="lp-store-btn">
//                 <div className="lp-store-icon">
//                   <img src={playStoreIcon} alt="Google Play" />
//                 </div>
//                 <div className="lp-store-text">
//                   <span className="lp-store-text-small">Get it on</span>
//                   <span className="lp-store-text-big">Google Play</span>
//                 </div>
//               </a>
//             </div>

//             {/* QR code hint */}
//             <p className="lp-reveal lp-d5" style={{ marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.28)', lineHeight: 1.6 }}>
//               Available for iOS 15+ and Android 8+. Free to download.
//             </p>
//           </div>

//           {/* Right — phone mockups */}
//           <div className="lp-app-right lp-reveal lp-d2">
//             <div className="lp-phones-wrap">
//               <PhoneHome />
//               <PhoneResult />

//               {/* Floating tag */}
//               <div className="lp-app-float-tag">
//                 <div className="lp-app-float-tag-dot" />
//                 Scan QR in-store
//               </div>
//             </div>
//           </div>

//         </div>
//       </section>

//       {/* ── Brands ── */}
//       <section className="lp-section lp-brands" id="brands">
//         <div className="lp-section-inner">
//           <div className="lp-eyebrow lp-reveal"><div className="lp-eyebrow-line" /><span>Supported brands</span></div>
//           <h2 className="lp-section-title lp-reveal lp-d1">Every brand, <em>one profile</em></h2>
//           <p className="lp-section-sub lp-reveal lp-d2">From fast fashion to luxury — if they make clothes, we have their sizing.</p>
//           <div className="lp-brands-grid">
//             {BRANDS.map((b, i) => (
//               <div key={b} className={`lp-brand-pill lp-reveal lp-d${i % 6}`}>{b}</div>
//             ))}
//           </div>
//           <p className="lp-reveal" style={{ marginTop: 32, fontSize: 13, color: 'var(--ash)', textAlign: 'center' }}>
//             + 488 more brands and growing
//           </p>
//         </div>
//       </section>

//       {/* ── CTA ── */}
//       <section className="lp-cta">
//         <div className="lp-cta-glow" />
//         <div className="lp-cta-inner">
//           <h2 className="lp-cta-title lp-reveal">Stop guessing.<br />Start wearing <em>your</em> size.</h2>
//           <p className="lp-cta-sub lp-reveal lp-d1">Join thousands of shoppers who never buy the wrong size again. Free to use, always.</p>
//           <div className="lp-cta-actions lp-reveal lp-d2">
//             <button className="lp-btn-sage" onClick={() => window.location.href = '/auth/register'}>Create free account →</button>
//             <button className="lp-btn-ghost-white" onClick={() => window.location.href = '/auth/login'}>Already have an account</button>
//           </div>
//         </div>
//       </section>

//       {/* ── Footer ── */}
//       <footer className="lp-footer">
//         <span className="lp-footer-logo">MatchMySize</span>
//         <span className="lp-footer-copy">© 2025 MatchMySize. All rights reserved.</span>
//         <div className="lp-footer-links">
//           <a href="#">Privacy</a>
//           <a href="#">Terms</a>
//           <a href="#">Contact</a>
//         </div>
//       </footer>

//     </div>
//   );
// }

// export default LandingPage;












import { useEffect, type CSSProperties, type ReactNode } from 'react';

import appStoreIcon from '@/assets/images/appstore.png';
import cameraIcon from '@/assets/images/camera.png';
import clothesIcon from '@/assets/images/clothes.png';
import fashionFigure from '@/assets/images/figure.png';
import lockIcon from '@/assets/images/lock.png';
import playStoreIcon from '@/assets/images/playstore.png';
import qrCodeIcon from '@/assets/images/qr-code.png';
import rulerIcon from '@/assets/images/ruler.png';
import scaleIcon from '@/assets/images/scale.png';
import searchIcon from '@/assets/images/search.png';
import starIcon from '@/assets/images/star.png';
import tshirtIcon from '@/assets/images/t-shirt.png';
import { AppLogo } from '@/components/app-logo';
import { BRAND_LOGOS } from '@/lib/brand-logos';
import { useCatalogSummary } from '@/lib/catalog-summary';

/* ─────────────────────────────────────────────
   Google Fonts
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
    --ink: #0D0D0D; --ink2: #1C1C1C; --paper: #FAFAF8; --cloud: #EFEFEF;
    --ash: #757575; --white: #FFFFFF;
    --fd: 'Cormorant Garamond', serif; --fs: 'DM Sans', sans-serif;
    --ease: cubic-bezier(0.22, 1, 0.36, 1);
  }
  html { scroll-behavior: smooth; }
  .lp-body { font-family: var(--fs); background: var(--paper); color: var(--ink); line-height: 1.6; overflow-x: hidden; }

  /* Nav */
  .lp-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 200; display: flex; align-items: center; justify-content: space-between; padding: 0 56px; height: 66px; background: rgba(250,250,248,0.88); backdrop-filter: blur(14px); border-bottom: 1px solid rgba(0,0,0,0.06); animation: lp-slideDown 0.6s var(--ease) both; }
  .lp-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
  .lp-logo-mark { width: 42px; height: 42px; border-radius: 12px; background: var(--white); border: 1px solid rgba(0,0,0,0.08); box-shadow: 0 8px 18px rgba(0,0,0,0.06); overflow: hidden; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .lp-logo-copy { display: flex; flex-direction: column; gap: 2px; line-height: 1; }
  .lp-logo-text { font-family: var(--fd); font-size: 20px; font-weight: 600; color: var(--ink); letter-spacing: -0.3px; }
  .lp-logo-tagline { font-size: 10px; font-weight: 600; color: var(--sage-deep); letter-spacing: 0.35px; text-transform: uppercase; }
  .lp-nav-links { display: flex; align-items: center; gap: 36px; list-style: none; }
  .lp-nav-links a { font-size: 13.5px; font-weight: 500; color: var(--ash); text-decoration: none; transition: color 0.2s; }
  .lp-nav-links a:hover { color: var(--ink); }
  .lp-nav-cta { display: flex; align-items: center; gap: 12px; }
  .lp-btn-ghost { font-family: var(--fs); font-size: 13.5px; font-weight: 500; color: var(--ink); background: none; border: none; cursor: pointer; padding: 8px 16px; border-radius: 8px; transition: background 0.2s; }
  .lp-btn-ghost:hover { background: var(--cloud); }
  .lp-btn-ink { font-family: var(--fs); font-size: 13.5px; font-weight: 600; color: var(--white); background: var(--ink); border: none; cursor: pointer; padding: 9px 20px; border-radius: 8px; transition: transform 0.15s, opacity 0.2s; }
  .lp-btn-ink:hover { opacity: 0.85; transform: translateY(-1px); }
  .lp-btn-ink:active { transform: scale(0.97); }

  /* Hero */
  .lp-hero { min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 64px; padding: 64px 56px 0; max-width: 1320px; margin: 0 auto; }
  .lp-hero-eyebrow { display: inline-flex; align-items: center; gap: 8px; background: var(--sage-light); border: 1px solid var(--sage-dark); border-radius: 999px; padding: 5px 14px; margin-bottom: 28px; animation: lp-fadeUp 0.7s 0.2s var(--ease) both; }
  .lp-hero-eyebrow-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--sage-deep); }
  .lp-hero-eyebrow span { font-size: 12px; font-weight: 600; color: var(--sage-deep); letter-spacing: 0.5px; text-transform: uppercase; }
  .lp-hero-h1 { font-family: var(--fd); font-size: clamp(52px, 5.5vw, 82px); font-weight: 700; line-height: 1.04; letter-spacing: -1.5px; color: var(--ink); margin-bottom: 24px; animation: lp-fadeUp 0.7s 0.35s var(--ease) both; }
  .lp-hero-h1 em { font-style: italic; color: var(--sage-deep); }
  .lp-hero-sub { font-size: 17px; color: var(--ash); line-height: 1.75; max-width: 440px; margin-bottom: 40px; animation: lp-fadeUp 0.7s 0.5s var(--ease) both; }
  .lp-hero-actions { display: flex; align-items: center; gap: 16px; animation: lp-fadeUp 0.7s 0.65s var(--ease) both; }
  .lp-btn-hero { font-family: var(--fs); font-size: 15px; font-weight: 600; color: var(--white); background: var(--ink); border: none; cursor: pointer; padding: 14px 28px; border-radius: 10px; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); transition: transform 0.15s, box-shadow 0.2s; }
  .lp-btn-hero:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(0,0,0,0.24); }
  .lp-btn-hero:active { transform: scale(0.97); }
  .lp-btn-text { font-family: var(--fs); font-size: 14px; font-weight: 500; color: var(--ash); background: none; border: none; cursor: pointer; transition: color 0.2s; }
  .lp-btn-text:hover { color: var(--ink); }

  /* Hero right */
  .lp-hero-right { position: relative; animation: lp-fadeLeft 0.8s 0.4s var(--ease) both; }

  /* ═══ AUTO-SCROLLING BRAND LOGOS ═══ */
  .fb-scene {
    width: 100%;
    height: 480px;
    display: flex;
    align-items: center;
    overflow: hidden;
    -webkit-mask-image: linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent);
    mask-image: linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent);
  }
  .fb-track {
    display: flex;
    align-items: center;
    gap: 24px;
    width: max-content;
    animation: fb-scroll 20s linear infinite;
    will-change: transform;
  }
  .fb-group {
    display: flex;
    align-items: center;
    gap: 24px;
    flex-shrink: 0;
  }
  .fb-logo {
    width: clamp(210px, 18vw, 250px);
    height: 152px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    background: transparent;
    border: 0;
    border-radius: 0;
    box-shadow: none;
    user-select: none;
    cursor: default;
    transition: transform 0.22s;
  }
  .fb-logo img {
    max-width: 100%;
    max-height: 100%;
    display: block;
    object-fit: contain;
    mix-blend-mode: multiply;
  }
  .fb-logo:hover {
    transform: scale(1.05);
  }
  .fb-scene:hover .fb-track { animation-play-state: paused; }

  /* Stats */
  .lp-stats { background: var(--ink); padding: 32px 56px; }
  .lp-stats-inner { max-width: 1320px; margin: 0 auto; display: grid; grid-template-columns: repeat(4, 1fr); }
  .lp-stat { text-align: center; padding: 16px; border-right: 1px solid rgba(255,255,255,0.08); }
  .lp-stat:last-child { border-right: none; }
  .lp-stat-num { font-family: var(--fd); font-size: 44px; font-weight: 700; color: var(--white); letter-spacing: -1px; line-height: 1; margin-bottom: 6px; }
  .lp-stat-num span { color: var(--sage); }
  .lp-stat-label { font-size: 13px; color: rgba(255,255,255,0.4); }

  /* Sections */
  .lp-section { padding: 100px 56px; }
  .lp-section-inner { max-width: 1320px; margin: 0 auto; }
  .lp-eyebrow { display: inline-flex; align-items: center; gap: 10px; margin-bottom: 20px; }
  .lp-eyebrow-line { width: 32px; height: 1.5px; background: var(--sage-deep); }
  .lp-eyebrow span { font-size: 12px; font-weight: 600; color: var(--sage-deep); letter-spacing: 1px; text-transform: uppercase; }
  .lp-section-title { font-family: var(--fd); font-size: clamp(36px, 4vw, 56px); font-weight: 700; letter-spacing: -1px; line-height: 1.08; color: var(--ink); margin-bottom: 16px; }
  .lp-section-title em { font-style: italic; color: var(--sage-deep); }
  .lp-section-sub { font-size: 16px; color: var(--ash); max-width: 520px; line-height: 1.75; }

  /* How it works */
  .lp-how { background: var(--white); position: relative; overflow: hidden; }
  .lp-how-grid {
    display: grid;
    grid-template-columns: minmax(290px, 0.78fr) minmax(620px, 1.22fr);
    gap: clamp(42px, 5vw, 76px);
    align-items: center;
    margin-top: 52px;
  }
  .lp-steps {
    position: relative;
    display: flex;
    flex-direction: column;
  }
  .lp-steps::before {
    content: '';
    position: absolute;
    left: 20px;
    top: 38px;
    bottom: 38px;
    width: 1px;
    background: linear-gradient(180deg, rgba(73,102,87,0.28), rgba(73,102,87,0.08));
  }
  .lp-step {
    position: relative;
    display: grid;
    grid-template-columns: 42px 1fr;
    gap: 20px;
    padding: 26px 0;
    border-bottom: 1px solid rgba(13,13,13,0.08);
    cursor: default;
  }
  .lp-step:first-child { border-top: 1px solid rgba(13,13,13,0.08); }
  .lp-step:hover .lp-step-num,
  .lp-step:first-child .lp-step-num {
    background: #EEF3EC;
    border-color: rgba(73,102,87,0.3);
    color: #496657;
  }
  .lp-step-num {
    position: relative;
    z-index: 1;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: var(--paper);
    border: 1px solid var(--cloud);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--fd);
    font-size: 18px;
    font-weight: 700;
    color: var(--ink);
    flex-shrink: 0;
    transition: background 0.2s, border-color 0.2s, color 0.2s;
  }
  .lp-step-kicker {
    display: flex;
    align-items: center;
    gap: 9px;
    margin-bottom: 6px;
  }
  .lp-step-icon {
    width: 20px;
    height: 20px;
    color: #496657;
    opacity: 0.72;
    flex-shrink: 0;
  }
  .lp-step-icon svg,
  .lp-meas-icon svg {
    width: 100%;
    height: 100%;
    display: block;
    stroke: currentColor;
  }
  .lp-step-title { font-size: 15px; font-weight: 600; color: var(--ink); }
  .lp-step-desc { font-size: 13.5px; color: var(--ash); line-height: 1.65; }
  .lp-how-vis {
    min-height: 620px;
    background: #FAFAF7;
    border-radius: 24px;
    border: 1px solid rgba(13,13,13,0.08);
    padding: clamp(24px, 2.5vw, 32px);
    position: relative;
    overflow: hidden;
    display: grid;
    grid-template-columns: minmax(300px, 1fr) minmax(290px, 0.9fr);
    gap: clamp(18px, 2.4vw, 30px);
    align-items: center;
  }
  .lp-how-vis-glow {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse at 38% 54%, rgba(238,243,236,0.86) 0%, transparent 46%),
      radial-gradient(ellipse at 82% 20%, rgba(195,216,193,0.16) 0%, transparent 62%);
    pointer-events: none;
  }
  .lp-fashion-figure-wrap {
    position: relative;
    z-index: 1;
    min-height: 560px;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    align-self: stretch;
  }
  .lp-fashion-figure {
    width: min(100%, clamp(340px, 28vw, 430px));
    height: clamp(500px, 39vw, 620px);
    max-width: 430px;
    max-height: 620px;
    object-fit: contain;
    filter: drop-shadow(0 26px 36px rgba(13,13,13,0.06));
    opacity: 0;
    transform: translateY(18px);
    animation: lp-figureIn 0.78s 0.2s var(--ease) both;
  }
  .lp-measuring-tape,
  .lp-fabric-art {
    position: absolute;
    pointer-events: none;
    color: #496657;
  }
  .lp-measuring-tape {
    width: 740px;
    height: auto;
    left: -170px;
    top: -92px;
    opacity: 0.1;
    transform: rotate(-5deg);
  }
  .lp-fabric-art {
    width: 620px;
    right: -250px;
    bottom: -112px;
    opacity: 0.14;
  }
  .lp-editorial-note {
    position: absolute;
    z-index: 2;
    font-size: 9px;
    font-weight: 700;
    line-height: 1;
    letter-spacing: 0.24em;
    color: rgba(73,102,87,0.2);
    text-transform: uppercase;
    white-space: nowrap;
  }
  .lp-note-fit { left: -4px; bottom: 58px; transform: rotate(-90deg); transform-origin: left bottom; }
  .lp-note-return { right: 4px; top: 38px; }
  .lp-measurement-card {
    position: relative;
    z-index: 2;
    width: min(100%, 360px);
    justify-self: end;
    background: rgba(255,255,255,0.92);
    border: 1px solid rgba(13,13,13,0.08);
    border-radius: 22px;
    padding: 24px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.05);
    backdrop-filter: blur(12px);
  }
  .lp-measurement-card-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 20px;
  }
  .lp-measurement-card-title p {
    font-size: 11px;
    font-weight: 700;
    color: #666863;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .lp-measurement-card-title span {
    font-family: var(--fd);
    font-size: 18px;
    font-weight: 600;
    color: #496657;
  }
  .lp-meas-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .lp-meas-row {
    display: grid;
    grid-template-columns: 100px 1fr 52px;
    gap: 12px;
    align-items: center;
  }
  .lp-meas-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .lp-meas-icon {
    width: 18px;
    height: 18px;
    color: #496657;
    opacity: 0.64;
    flex-shrink: 0;
  }
  .lp-meas-label-col {
    font-size: 10px;
    font-weight: 700;
    color: #666863;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .lp-bar-wrap {
    position: relative;
    height: 7px;
    background: rgba(13,13,13,0.07);
    border-radius: 999px;
  }
  .lp-bar {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    border-radius: 999px;
    background: #496657;
  }
  .lp-bar-marker {
    position: absolute;
    top: 50%;
    left: var(--x);
    width: 11px;
    height: 11px;
    border-radius: 50%;
    background: #496657;
    border: 2px solid var(--white);
    box-shadow: 0 0 0 1px rgba(73,102,87,0.24);
    transform: translate(-50%, -50%) scale(0.72);
    opacity: 0;
    animation: lp-markerIn 0.42s var(--ease) both;
  }
  .lp-meas-val {
    font-size: 12px;
    font-weight: 700;
    color: var(--ink);
    text-align: right;
    white-space: nowrap;
  }
  .lp-card-result {
    margin-top: 26px;
    padding-top: 22px;
    border-top: 1px solid rgba(13,13,13,0.1);
  }
  .lp-result-brand {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-bottom: 12px;
    font-size: 12px;
    font-weight: 700;
    color: var(--ink);
    letter-spacing: 0.02em;
  }
  .lp-result-brand span {
    color: #666863;
    font-weight: 600;
  }
  .lp-result-label {
    display: block;
    font-size: 11px;
    font-weight: 700;
    color: #666863;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .lp-result-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
  }
  .lp-result-size {
    font-family: var(--fd);
    font-size: 64px;
    font-weight: 700;
    line-height: 0.9;
    color: var(--ink);
  }
  .lp-result-match {
    border-radius: 999px;
    background: #EEF3EC;
    border: 1px solid rgba(73,102,87,0.16);
    color: #496657;
    padding: 7px 12px;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.08em;
    white-space: nowrap;
  }

  /* Features */
  .lp-features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 64px; }
  .lp-feature-card { background: var(--white); border: 1px solid var(--cloud); border-radius: 20px; padding: 32px; transition: transform 0.22s, box-shadow 0.22s; }
  .lp-feature-card:hover { transform: translateY(-5px); box-shadow: 0 20px 52px rgba(0,0,0,0.08); }
  .lp-feature-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; background: var(--sage-light); border: 1px solid var(--sage-dark); }
  .lp-feature-icon img { width: 24px; height: 24px; display: block; object-fit: contain; }
  .lp-feature-title { font-size: 15.5px; font-weight: 600; color: var(--ink); margin-bottom: 10px; }
  .lp-feature-desc { font-size: 13.5px; color: var(--ash); line-height: 1.65; }

  /* Brands */
  .lp-brands { background: var(--white); }
  .lp-brands-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 14px; margin-top: 48px; }
  .lp-brand-pill { background: var(--paper); border: 1px solid var(--cloud); border-radius: 12px; padding: 14px 10px; text-align: center; font-size: 13px; font-weight: 600; color: var(--ash); transition: all 0.2s; cursor: default; }
  .lp-brand-pill:hover { background: var(--white); border-color: var(--ink); color: var(--ink); transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,0.07); }

  /* App section */
  .lp-app-section { padding: 110px 56px; background: var(--ink); position: relative; overflow: hidden; }
  .lp-app-bg-glow-1 { position: absolute; top: -120px; left: -80px; width: 500px; height: 500px; border-radius: 50%; background: rgba(195,216,193,0.06); pointer-events: none; }
  .lp-app-bg-glow-2 { position: absolute; bottom: -100px; right: -60px; width: 400px; height: 400px; border-radius: 50%; background: rgba(195,216,193,0.04); pointer-events: none; }
  .lp-app-grid-overlay { position: absolute; inset: 0; pointer-events: none; background-image: linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px); background-size: 52px 52px; }
  .lp-app-inner { max-width: 1320px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; position: relative; z-index: 1; }
  .lp-app-eyebrow { display: inline-flex; align-items: center; gap: 8px; background: rgba(195,216,193,0.12); border: 1px solid rgba(195,216,193,0.2); border-radius: 999px; padding: 5px 14px; margin-bottom: 28px; }
  .lp-app-eyebrow-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--sage); box-shadow: 0 0 6px var(--sage); animation: lp-pulseDot 2.5s ease-in-out infinite; }
  .lp-app-eyebrow span { font-size: 12px; font-weight: 600; color: var(--sage); letter-spacing: 0.5px; text-transform: uppercase; }
  .lp-app-title { font-family: var(--fd); font-size: clamp(44px, 5vw, 72px); font-weight: 700; color: var(--white); line-height: 1.04; letter-spacing: -1.5px; margin-bottom: 22px; }
  .lp-app-title em { font-style: italic; color: var(--sage); }
  .lp-app-sub { font-size: 16px; color: rgba(255,255,255,0.48); line-height: 1.75; max-width: 440px; margin-bottom: 40px; }
  .lp-app-bullets { display: flex; flex-direction: column; gap: 14px; margin-bottom: 44px; }
  .lp-app-bullet { display: flex; align-items: center; gap: 14px; }
  .lp-app-bullet-icon { width: 36px; height: 36px; border-radius: 9px; background: rgba(195,216,193,0.10); border: 1px solid rgba(195,216,193,0.16); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .lp-app-bullet-icon img { width: 18px; height: 18px; display: block; object-fit: contain; }
  .lp-app-bullet-text { font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.75); line-height: 1.4; }
  .lp-app-downloads { display: flex; gap: 14px; flex-wrap: wrap; }
  .lp-store-btn { display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12); border-radius: 14px; padding: 12px 20px; cursor: pointer; text-decoration: none; transition: background 0.2s, transform 0.15s, border-color 0.2s; min-width: 160px; }
  .lp-store-btn:hover { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.22); transform: translateY(-2px); }
  .lp-store-btn:active { transform: scale(0.97); }
  .lp-store-icon img { width: 26px; height: 26px; display: block; object-fit: contain; }
  .lp-store-text-small { font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.45); letter-spacing: 0.3px; display: block; margin-bottom: 1px; }
  .lp-store-text-big { font-size: 15px; font-weight: 700; color: var(--white); display: block; letter-spacing: -0.2px; }
  .lp-app-right { display: flex; align-items: center; justify-content: center; position: relative; }
  .lp-phones-wrap { position: relative; width: 380px; height: 520px; }
  .lp-phone { position: absolute; width: 220px; background: #0D0D0D; border-radius: 36px; border: 2px solid rgba(255,255,255,0.12); overflow: hidden; box-shadow: 0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05); }
  .lp-phone-notch { position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 80px; height: 28px; background: #0D0D0D; border-radius: 0 0 18px 18px; z-index: 10; display: flex; align-items: center; justify-content: center; gap: 5px; }
  .lp-phone-notch-cam { width: 10px; height: 10px; border-radius: 50%; background: #1a1a1a; border: 1px solid rgba(255,255,255,0.06); }
  .lp-phone-screen { width: 100%; background: var(--paper); display: flex; flex-direction: column; padding-top: 28px; min-height: 400px; }
  .lp-phone-1 { left: 0; top: 40px; animation: lp-float 4.5s ease-in-out infinite; z-index: 1; }
  .lp-phone-1 .lp-phone-screen { background: var(--paper); }
  .lp-ph-home-topbar { display: flex; align-items: center; justify-content: space-between; padding: 8px 14px 6px; }
  .lp-ph-brand { display: flex; align-items: center; gap: 6px; min-width: 0; }
  .lp-ph-brand-mark {
    width: 18px; height: 18px; border-radius: 6px;
    background: var(--white);
    border: 1px solid rgba(0,0,0,0.08);
    box-shadow: 0 4px 10px rgba(0,0,0,0.06);
    overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .lp-ph-brand-name { font-family: var(--fd); font-size: 13px; font-weight: 700; color: var(--ink); }
  .lp-ph-avatar { width: 24px; height: 24px; border-radius: 50%; background: var(--ink); display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 800; color: var(--white); flex-shrink: 0; }
  .lp-ph-greeting { padding: 8px 14px 12px; }
  .lp-ph-greeting-sub { font-size: 9px; color: var(--ash); margin-bottom: 2px; }
  .lp-ph-greeting-title { font-family: var(--fd); font-size: 16px; font-weight: 700; color: var(--ink); letter-spacing: -.3px; }
  .lp-ph-search { margin: 0 14px 12px; height: 28px; background: var(--cloud); border-radius: 8px; display: flex; align-items: center; padding: 0 10px; gap: 6px; }
  .lp-ph-search-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--ash); opacity: 0.4; }
  .lp-ph-search-bar { flex: 1; height: 3px; background: #D4D4D4; border-radius: 2px; opacity: 0.5; }
  .lp-ph-chips { display: flex; gap: 6px; padding: 0 14px 12px; overflow: hidden; }
  .lp-ph-chip { font-size: 8px; font-weight: 700; padding: 4px 9px; border-radius: 999px; border: 1px solid var(--cloud); white-space: nowrap; background: var(--white); color: var(--ash); }
  .lp-ph-chip.active { background: var(--ink); color: var(--white); border-color: var(--ink); }
  .lp-ph-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 0 14px; }
  .lp-ph-card { background: var(--white); border-radius: 12px; border: 1px solid var(--cloud); overflow: hidden; }
  .lp-ph-card-img { height: 52px; background: var(--cloud); display: flex; align-items: center; justify-content: center; position: relative; }
  .lp-ph-card-score { position: absolute; top: 4px; right: 4px; background: var(--ink); border-radius: 4px; padding: 2px 5px; font-size: 7px; font-weight: 800; color: var(--white); }
  .lp-ph-card-body { padding: 6px 8px; }
  .lp-ph-card-brand { font-size: 7px; font-weight: 700; color: var(--ash); text-transform: uppercase; letter-spacing: .3px; }
  .lp-ph-card-size { font-family: var(--fd); font-size: 16px; font-weight: 700; color: var(--ink); line-height: 1; }
  .lp-ph-tabbar { display: flex; margin-top: auto; padding: 10px 14px 12px; background: rgba(255,255,255,0.92); border-top: 1px solid var(--cloud); justify-content: space-around; }
  .lp-ph-tab { display: flex; flex-direction: column; align-items: center; gap: 3px; }
  .lp-ph-tab-dot { width: 14px; height: 14px; border-radius: 3px; background: var(--cloud); }
  .lp-ph-tab-dot.active { background: var(--ink); }
  .lp-ph-tab-label { font-size: 6px; font-weight: 700; color: var(--ash); }
  .lp-ph-tab-label.active { color: var(--ink); }
  .lp-phone-2 { right: 0; top: 0; animation: lp-float 3.8s ease-in-out infinite 0.6s; z-index: 2; }
  .lp-phone-2 .lp-phone-screen { background: var(--ink); }
  .lp-ph-result-topbar { display: flex; align-items: center; justify-content: space-between; padding: 8px 14px 10px; }
  .lp-ph-result-back { width: 20px; height: 20px; border-radius: 6px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; }
  .lp-ph-result-back-line { width: 8px; height: 1.5px; background: rgba(255,255,255,0.6); border-radius: 1px; }
  .lp-ph-result-label { font-size: 9px; font-weight: 700; color: rgba(255,255,255,0.5); }
  .lp-ph-brand-section { padding: 0 14px 14px; display: flex; align-items: center; gap: 8px; }
  .lp-ph-brand-logo { width: 28px; height: 28px; border-radius: 7px; background: rgba(255,255,255,0.10); border: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; color: var(--sage); flex-shrink: 0; }
  .lp-ph-brand-name-sm { font-size: 11px; font-weight: 700; color: var(--white); }
  .lp-ph-brand-cat-sm { font-size: 9px; color: rgba(255,255,255,0.35); }
  .lp-ph-score-badge { margin-left: auto; background: var(--sage-light); border-radius: 999px; padding: 3px 9px; font-size: 9px; font-weight: 800; color: var(--sage-deep); }
  .lp-ph-size-hero { text-align: center; padding: 16px 14px 14px; border-top: 1px solid rgba(255,255,255,0.07); border-bottom: 1px solid rgba(255,255,255,0.07); margin: 0 14px 14px; border-radius: 12px; background: rgba(255,255,255,0.04); }
  .lp-ph-size-eyebrow { font-size: 8px; font-weight: 700; color: rgba(255,255,255,0.35); letter-spacing: .5px; text-transform: uppercase; margin-bottom: 4px; }
  .lp-ph-size-big { font-family: var(--fd); font-size: 52px; font-weight: 700; color: var(--white); letter-spacing: -2px; line-height: 1; }
  .lp-ph-size-tag { font-size: 9px; font-weight: 700; color: var(--sage); margin-top: 4px; }
  .lp-ph-meas-row { display: flex; gap: 6px; padding: 0 14px; }
  .lp-ph-meas-chip { flex: 1; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 6px 8px; }
  .lp-ph-meas-chip-label { font-size: 7px; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: .3px; }
  .lp-ph-meas-chip-val { font-size: 10px; font-weight: 700; color: var(--white); margin-top: 2px; }
  .lp-ph-cta-btn { margin: 14px 14px 0; height: 32px; background: var(--sage-deep); border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 800; color: var(--white); letter-spacing: .2px; }
  .lp-app-float-tag { position: absolute; right: -20px; top: 60px; background: var(--white); border: 1px solid var(--cloud); border-radius: 12px; padding: 10px 14px; display: flex; align-items: center; gap: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.15); font-size: 11px; font-weight: 700; color: var(--ink); white-space: nowrap; z-index: 5; animation: lp-chip2 5s ease-in-out infinite 1s; }
  .lp-app-float-tag-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--sage-deep); flex-shrink: 0; box-shadow: 0 0 5px var(--sage-deep); }

  /* CTA */
  .lp-cta { background: var(--ink); padding: 110px 56px; position: relative; overflow: hidden; }
  .lp-cta-glow { position: absolute; inset: 0; background: radial-gradient(ellipse at 20% 50%, rgba(195,216,193,0.09) 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, rgba(195,216,193,0.05) 0%, transparent 50%); pointer-events: none; }
  .lp-cta-inner { max-width: 680px; margin: 0 auto; text-align: center; position: relative; z-index: 1; }
  .lp-cta-title { font-family: var(--fd); font-size: clamp(40px, 5vw, 66px); font-weight: 700; color: var(--white); letter-spacing: -1.5px; line-height: 1.04; margin-bottom: 20px; }
  .lp-cta-title em { font-style: italic; color: var(--sage); }
  .lp-cta-sub { font-size: 16px; color: rgba(255,255,255,0.45); margin-bottom: 44px; line-height: 1.75; }
  .lp-cta-actions { display: flex; align-items: center; justify-content: center; gap: 16px; }
  .lp-btn-sage { font-family: var(--fs); font-size: 15px; font-weight: 600; color: var(--ink); background: var(--sage-light); border: 1px solid var(--sage-dark); cursor: pointer; padding: 14px 28px; border-radius: 10px; display: flex; align-items: center; gap: 8px; transition: transform 0.15s, box-shadow 0.2s; }
  .lp-btn-sage:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(195,216,193,0.3); }
  .lp-btn-sage:active { transform: scale(0.97); }
  .lp-btn-ghost-white { font-family: var(--fs); font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.4); background: none; border: none; cursor: pointer; transition: color 0.2s; }
  .lp-btn-ghost-white:hover { color: var(--white); }

  /* Footer */
  .lp-footer { background: var(--ink); border-top: 1px solid rgba(255,255,255,0.07); padding: 30px 56px; display: flex; align-items: center; justify-content: space-between; }
  .lp-footer-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
  .lp-footer-logo-mark {
    width: 28px; height: 28px; border-radius: 9px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.1);
    display: flex; align-items: center; justify-content: center;
    overflow: hidden;
    flex-shrink: 0;
  }
  .lp-footer-logo-text { font-family: var(--fd); font-size: 17px; font-weight: 600; color: rgba(255,255,255,0.35); }
  .lp-footer-copy { font-size: 12px; color: rgba(255,255,255,0.22); }
  .lp-footer-links { display: flex; gap: 24px; }
  .lp-footer-links a { font-size: 12px; color: rgba(255,255,255,0.28); text-decoration: none; transition: color 0.2s; }
  .lp-footer-links a:hover { color: rgba(255,255,255,0.7); }

  /* Scroll reveal */
  .lp-reveal { opacity: 0; transform: translateY(28px); transition: opacity 0.7s var(--ease), transform 0.7s var(--ease); }
  .lp-reveal.lp-vis { opacity: 1; transform: none; }
  .lp-d1{transition-delay:.08s} .lp-d2{transition-delay:.16s} .lp-d3{transition-delay:.24s}
  .lp-d4{transition-delay:.32s} .lp-d5{transition-delay:.40s} .lp-d6{transition-delay:.48s}

  /* Keyframes */
  @keyframes lp-slideDown { from{transform:translateY(-100%);opacity:0} to{transform:translateY(0);opacity:1} }
  @keyframes lp-fadeUp    { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:none} }
  @keyframes lp-fadeLeft  { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:none} }
  @keyframes lp-float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes lp-chip2     { 0%,100%{transform:translate(0,0)} 50%{transform:translate(4px,-7px)} }
  @keyframes lp-growBar   { from{width:0} to{width:var(--w)} }
  @keyframes lp-markerIn  { from{opacity:0;transform:translate(-50%,-50%) scale(.72)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} }
  @keyframes lp-figureIn  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes lp-pulseDot  { 0%,100%{opacity:1;box-shadow:0 0 5px var(--sage)} 50%{opacity:.5;box-shadow:0 0 2px var(--sage)} }
  @keyframes fb-scroll    { from{transform:translateX(0)} to{transform:translateX(calc(-50% - 12px))} }

  @media (max-width: 1100px) {
    body .lp-how-grid {
      grid-template-columns: 1fr;
      gap: 40px;
    }
    .lp-how-vis {
      min-height: auto;
      grid-template-columns: minmax(280px, 0.84fr) minmax(310px, 1fr);
      padding: 28px;
    }
    .lp-fashion-figure-wrap {
      min-height: 460px;
    }
    .lp-fashion-figure {
      width: clamp(350px, 42vw, 460px);
    }
    .lp-measuring-tape {
      left: -220px;
      top: -112px;
    }
  }

  @media (max-width: 700px) {
    .fb-scene { height: 330px; }
    .fb-track, .fb-group { gap: 16px; }
    .fb-logo { width: 190px; height: 124px; }
    @keyframes fb-scroll { from{transform:translateX(0)} to{transform:translateX(calc(-50% - 8px))} }
  }

  @media (prefers-reduced-motion: reduce) {
    .fb-scene {
      overflow-x: auto;
      -webkit-mask-image: none;
      mask-image: none;
      scroll-snap-type: x mandatory;
    }
    .fb-track { animation: none; }
    .fb-logo { scroll-snap-align: center; }
    .lp-fashion-figure,
    .lp-bar,
    .lp-bar-marker,
    .lp-reveal,
    .lp-nav,
    .lp-hero-eyebrow,
    .lp-hero-h1,
    .lp-hero-sub,
    .lp-hero-actions,
    .lp-hero-right,
    .lp-phone,
    .lp-app-float-tag {
      animation: none !important;
      transition: none !important;
    }
    .lp-fashion-figure,
    .lp-bar-marker,
    .lp-reveal {
      opacity: 1;
      transform: none;
    }
  }
`;

const landingStyles = document.getElementById('lp-styles');
if (landingStyles) {
  landingStyles.textContent = CSS;
} else {
  const s = document.createElement('style');
  s.id = 'lp-styles';
  s.textContent = CSS;
  document.head.appendChild(s);
}

/* ═══════════════════════════════════════════════
   AUTO-SCROLLING BRANDS
═══════════════════════════════════════════════ */
const FB_BRANDS = BRAND_LOGOS;

function BrandLogoGroup({ duplicate = false }:{ duplicate?: boolean }) {
  return (
    <div className="fb-group" aria-hidden={duplicate || undefined}>
      {FB_BRANDS.map(brand=>(
        <div key={brand.key} className="fb-logo">
          <img src={brand.src} alt={duplicate ? '' : brand.name}/>
        </div>
      ))}
    </div>
  );
}

function AutoScrollingBrands() {
  return (
    <div className="fb-scene" aria-label="Supported clothing brands">
      <div className="fb-track">
        <BrandLogoGroup/>
        <BrandLogoGroup duplicate/>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Other sub-components
───────────────────────────────────────────── */
type MeasureBarStyle = CSSProperties & { '--w': string };
type MarkerStyle = CSSProperties & { '--x': string };
type MeasurementKind = 'chest' | 'waist' | 'hips' | 'shoulder' | 'inseam';
type StepIconKind = 'measure' | 'brand' | 'check';

const MEASUREMENTS: Array<{ kind: MeasurementKind; label: string; pct: string; val: string }> = [
  { kind: 'chest', label: 'Chest', pct: '78%', val: '92 cm' },
  { kind: 'waist', label: 'Waist', pct: '62%', val: '78 cm' },
  { kind: 'hips', label: 'Hips', pct: '84%', val: '98 cm' },
  { kind: 'shoulder', label: 'Shoulder', pct: '54%', val: '44 cm' },
  { kind: 'inseam', label: 'Inseam', pct: '70%', val: '80 cm' },
];

const getHowSteps = (brandCount: number) => [
  { icon: 'measure' as const, title: 'Measure yourself', desc: 'Chest, waist, hips and more — guided step-by-step with illustrated guides for each measurement point.' },
  { icon: 'brand' as const, title: 'Choose a brand', desc: `Browse ${brandCount} active brands across all clothing categories. Search, filter, or scan a QR tag in-store.` },
  { icon: 'check' as const, title: 'Get your exact size', desc: 'Instantly see your recommended size with a fit score — no trial and error, no returns.' },
];

function StepIcon({ kind }: { kind: StepIconKind }) {
  if (kind === 'brand') {
    return (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M8 4 5 6.5l-2 3 3.2 2.1L8 9.5V20h8V9.5l1.8 2.1L21 9.5l-2-3L16 4l-2 2h-4L8 4Z" />
      </svg>
    );
  }
  if (kind === 'check') {
    return (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" />
        <path d="m8.3 12.3 2.4 2.4 5-5.3" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="6" width="16" height="12" rx="6" />
      <path d="M8 9h.01M11 9h.01M14 9h.01M17 9h.01M8 15h8" />
    </svg>
  );
}

function MeasurementIcon({ kind }: { kind: MeasurementKind }) {
  const common = { fill: 'none', strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
  if (kind === 'shoulder') {
    return <svg viewBox="0 0 24 24" {...common}><path d="M4 12h16" /><path d="m7 9-3 3 3 3" /><path d="m17 9 3 3-3 3" /></svg>;
  }
  if (kind === 'inseam') {
    return <svg viewBox="0 0 24 24" {...common}><path d="M12 4v16" /><path d="m9 7 3-3 3 3" /><path d="m9 17 3 3 3-3" /></svg>;
  }
  if (kind === 'waist') {
    return <svg viewBox="0 0 24 24" {...common}><path d="M5 12c2.2-2 4.5-3 7-3s4.8 1 7 3" /><path d="M5 12c2.2 2 4.5 3 7 3s4.8-1 7-3" /></svg>;
  }
  if (kind === 'hips') {
    return <svg viewBox="0 0 24 24" {...common}><path d="M6 11c1.8 4 3.8 6 6 6s4.2-2 6-6" /><path d="M8 7c1.2 1.1 2.5 1.6 4 1.6s2.8-.5 4-1.6" /></svg>;
  }
  return <svg viewBox="0 0 24 24" {...common}><path d="M5 12h14" /><path d="m8 9-3 3 3 3" /><path d="m16 9 3 3-3 3" /></svg>;
}

function HowItWorksStep({ icon, title, desc, index }: { icon: StepIconKind; title: string; desc: string; index: number }) {
  return (
    <div className="lp-step">
      <div className="lp-step-num">{index + 1}</div>
      <div>
        <div className="lp-step-kicker">
          <span className="lp-step-icon"><StepIcon kind={icon} /></span>
          <div className="lp-step-title">{title}</div>
        </div>
        <div className="lp-step-desc">{desc}</div>
      </div>
    </div>
  );
}

function MeasureBar({ kind, label, pct, val, delay = 0 }: { kind: MeasurementKind; label: string; pct: string; val: string; delay?: number }) {
  const barStyle: MeasureBarStyle = {
    '--w': pct,
    width: pct,
    animation: `lp-growBar 0.82s ${delay}s cubic-bezier(0.22,1,0.36,1) both`,
  };
  const markerStyle: MarkerStyle = {
    '--x': pct,
    animationDelay: `${delay + 0.46}s`,
  };
  return (
    <div className="lp-meas-row">
      <div className="lp-meas-meta">
        <span className="lp-meas-icon"><MeasurementIcon kind={kind} /></span>
        <span className="lp-meas-label-col">{label}</span>
      </div>
      <div className="lp-bar-wrap">
        <div className="lp-bar" style={barStyle} />
        <span className="lp-bar-marker" style={markerStyle} />
      </div>
      <span className="lp-meas-val">{val}</span>
    </div>
  );
}

function MeasurementCard() {
  return (
    <div className="lp-measurement-card">
      <div className="lp-measurement-card-title">
        <p>Your Measurements</p>
        <span>Profile 01</span>
      </div>
      <div className="lp-meas-list">
        {MEASUREMENTS.map((measurement, index) => (
          <MeasureBar key={measurement.kind} {...measurement} delay={index * 0.1} />
        ))}
      </div>
      <div className="lp-card-result">
        <div className="lp-result-brand">H&amp;M <span>· Tops</span><span aria-hidden="true">→</span></div>
        <span className="lp-result-label">Your recommended size</span>
        <div className="lp-result-row">
          <span className="lp-result-size">M</span>
          <span className="lp-result-match">96% MATCH</span>
        </div>
      </div>
    </div>
  );
}

function DecorativeMeasuringTape() {
  return (
    <svg className="lp-measuring-tape" viewBox="0 0 720 210" fill="none" aria-hidden="true">
      <path d="M34 132C162 40 312 43 438 96c90 38 184 47 248-16" stroke="currentColor" strokeWidth="24" strokeLinecap="round" opacity="0.18" />
      <path d="M34 132C162 40 312 43 438 96c90 38 184 47 248-16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M50 124l11 14M94 98l8 12M140 76l11 16M190 59l8 13M240 54l11 18M292 60l8 13M342 73l10 16M392 91l8 13M444 99l9 17M494 115l7 13M546 121l7 17M598 115l8 13M646 98l10 16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <text x="132" y="58" fill="currentColor" fontFamily="DM Sans, sans-serif" fontSize="15" fontWeight="700">70</text>
      <text x="264" y="46" fill="currentColor" fontFamily="DM Sans, sans-serif" fontSize="15" fontWeight="700">80</text>
      <text x="428" y="83" fill="currentColor" fontFamily="DM Sans, sans-serif" fontSize="15" fontWeight="700">90</text>
      <text x="600" y="101" fill="currentColor" fontFamily="DM Sans, sans-serif" fontSize="15" fontWeight="700">100</text>
    </svg>
  );
}

function FabricLineArt() {
  return (
    <svg className="lp-fabric-art" viewBox="0 0 640 420" fill="none" aria-hidden="true">
      <path d="M20 304C94 212 171 263 246 181c71-78 145-159 245-122 66 24 86 83 125 119" stroke="currentColor" strokeWidth="1.2" />
      <path d="M48 350c76-88 162-46 236-121 81-82 144-147 245-98 42 21 67 55 88 86" stroke="currentColor" strokeWidth="1" />
      <path d="M152 385c46-79 131-90 204-108 79-20 120-67 145-136" stroke="currentColor" strokeWidth="0.9" />
    </svg>
  );
}

function FashionMeasurementIllustration() {
  return (
    <div className="lp-fashion-figure-wrap">
      <DecorativeMeasuringTape />
      <FabricLineArt />
      <span className="lp-editorial-note lp-note-fit">Fit confidence every time</span>
      <span className="lp-editorial-note lp-note-return">Better fits. Less returns.</span>
      <img className="lp-fashion-figure" src={fashionFigure} alt="" aria-hidden="true" draggable={false} />
    </div>
  );
}

function FeatureCard({icon,title,desc}:{icon:ReactNode;title:string;desc:string}) {
  return <div className="lp-feature-card"><div className="lp-feature-icon">{icon}</div><div className="lp-feature-title">{title}</div><div className="lp-feature-desc">{desc}</div></div>;
}

const getFeatures = (brandCount: number) => [
  {icon:<img src={rulerIcon}  alt="" aria-hidden="true"/>,title:'Guided measurements',   desc:'Step-by-step illustrated guides make measuring yourself accurate and effortless — even for first timers.'},
  {icon:<img src={searchIcon} alt="" aria-hidden="true"/>,title:`${brandCount} active brands`,desc:'Every active brand has real sizing data mapped to your body.'},
  {icon:<img src={qrCodeIcon} alt="" aria-hidden="true"/>,title:'QR scan in-store',       desc:'Scan any clothing tag QR code in a physical store. Get your size in under a second.'},
  {icon:<img src={clothesIcon}alt="" aria-hidden="true"/>,title:'Multi-category profiles',desc:'Different sizes for tops, trousers, dresses, and shoes — one profile handles every type you wear.'},
  {icon:<img src={scaleIcon}  alt="" aria-hidden="true"/>,title:'Outfit fit scoring',     desc:'Compare outfits across brands with a combined fit score so you know which complete look works best.'},
  {icon:<img src={lockIcon}   alt="" aria-hidden="true"/>,title:'Private by design',      desc:'Your measurements stay on your account. We never share or sell your sizing data.'},
];
const getStats = (brandCount: number) => [
  {num:String(brandCount),suffix:'',label:'Active brands'},
  {num:'98',suffix:'%',label:'Size accuracy'},
  {num:'2',suffix:'M+',label:'Sizes matched'},
  {num:'0',suffix:'',label:'Returns from bad fit'},
];
const APP_BULLETS=[
  {icon:<img src={cameraIcon} alt="" aria-hidden="true"/>,text:'Scan QR codes in-store for instant size recommendations'},
  {icon:<img src={tshirtIcon} alt="" aria-hidden="true"/>,text:'Guided measurement illustrations for every clothing type'},
  {icon:<img src={starIcon}   alt="" aria-hidden="true"/>,text:'Outfit fit scoring across multiple brands at once'},
  {icon:<img src={clothesIcon}alt="" aria-hidden="true"/>,text:'Save profiles for tops, trousers, dresses, shoes and more'},
];

function PhoneHome() {
  return (
      <div className="lp-phone lp-phone-1" style={{height:400}}>
      <div className="lp-phone-notch"><div className="lp-phone-notch-cam"/></div>
      <div className="lp-phone-screen" style={{background:'var(--paper)'}}>
        <div className="lp-ph-home-topbar">
          <div className="lp-ph-brand">
            <div className="lp-ph-brand-mark"><AppLogo size={14} decorative /></div>
            <span className="lp-ph-brand-name">MatchMySize</span>
          </div>
          <div className="lp-ph-avatar">K</div>
        </div>
        <div className="lp-ph-greeting"><div className="lp-ph-greeting-sub">Good morning,</div><div className="lp-ph-greeting-title">Find your size</div></div>
        <div className="lp-ph-search"><div className="lp-ph-search-dot"/><div className="lp-ph-search-bar"/></div>
        <div className="lp-ph-chips"><div className="lp-ph-chip active">Tops</div><div className="lp-ph-chip">Jeans</div><div className="lp-ph-chip">Shoes</div></div>
        <div className="lp-ph-grid">
          {[{brand:'EKKO',score:'96%',size:'M'},{brand:'King Street',score:'91%',size:'S'},{brand:'Hustle',score:'98%',size:'L'},{brand:'ODEL',score:'94%',size:'M'}].map(({brand,score,size})=>(
            <div className="lp-ph-card" key={brand}>
              <div className="lp-ph-card-img"><div style={{width:'100%',height:'100%',background:'var(--cloud)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>👕</div><div className="lp-ph-card-score">{score}</div></div>
              <div className="lp-ph-card-body"><div className="lp-ph-card-brand">{brand}</div><div className="lp-ph-card-size">{size}</div></div>
            </div>
          ))}
        </div>
        <div className="lp-ph-tabbar">
          {[['Home',true],['Explore',false],['Scan',false],['Profile',false]].map(([l,a])=>(
            <div className="lp-ph-tab" key={String(l)}><div className={`lp-ph-tab-dot${a?' active':''}`}/><div className={`lp-ph-tab-label${a?' active':''}`}>{l}</div></div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PhoneResult() {
  return (
    <div className="lp-phone lp-phone-2" style={{height:420}}>
      <div className="lp-phone-notch"><div className="lp-phone-notch-cam"/></div>
      <div className="lp-phone-screen" style={{background:'var(--ink)'}}>
        <div className="lp-ph-result-topbar"><div className="lp-ph-result-back"><div className="lp-ph-result-back-line"/></div><span className="lp-ph-result-label">Size result</span><div style={{width:20}}/></div>
        <div className="lp-ph-brand-section"><div className="lp-ph-brand-logo">EKKO</div><div><div className="lp-ph-brand-name-sm">EKKO</div><div className="lp-ph-brand-cat-sm">Tops & Shirts</div></div><div className="lp-ph-score-badge">96%</div></div>
        <div className="lp-ph-size-hero"><div className="lp-ph-size-eyebrow">Your size</div><div className="lp-ph-size-big">M</div><div className="lp-ph-size-tag">✓ Excellent fit</div></div>
        <div className="lp-ph-meas-row">{[['Chest','92 cm'],['Waist','78 cm'],['Shoulder','44 cm']].map(([l,v])=><div className="lp-ph-meas-chip" key={l}><div className="lp-ph-meas-chip-label">{l}</div><div className="lp-ph-meas-chip-val">{v}</div></div>)}</div>
        <div className="lp-ph-cta-btn">Find in store →</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main page
───────────────────────────────────────────── */
export function LandingPage() {
  const { brandCount, brandNames } = useCatalogSummary();
  const features = getFeatures(brandCount);
  const stats = getStats(brandCount);
  const brands = brandNames.length ? brandNames : BRAND_LOGOS.map((brand) => brand.name);

  useEffect(() => {
    const els = document.querySelectorAll('.lp-reveal');
    const io = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('lp-vis'); }),
      { threshold: 0.1 }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="lp-body">

      <nav className="lp-nav">
        <a className="lp-logo" href="/">
          <div className="lp-logo-mark"><AppLogo size={34} decorative/></div>
          <div className="lp-logo-copy">
            <span className="lp-logo-text">MatchMySize</span>
            <span className="lp-logo-tagline">Find Your Perfect Fit</span>
          </div>
        </a>
        <ul className="lp-nav-links"><li><a href="#how">How it works</a></li><li><a href="#features">Features</a></li><li><a href="#app">Mobile app</a></li><li><a href="#brands">Brands</a></li></ul>
        <div className="lp-nav-cta"><button className="lp-btn-ghost" onClick={()=>window.location.href='/auth/login'}>Sign in</button><button className="lp-btn-ink" onClick={()=>window.location.href='/auth/register'}>Get started →</button></div>
      </nav>

      {/* ── Hero ── */}
      <section style={{padding:0}}>
        <div className="lp-hero">
          {/* Left — copy */}
          <div>
            <div className="lp-hero-eyebrow"><div className="lp-hero-eyebrow-dot"/><span>{brandCount} active brands · Perfect fit every time</span></div>
            <h1 className="lp-hero-h1">Wear what<br/>actually <em>fits</em><br/>you.</h1>
            <p className="lp-hero-sub">Enter your measurements once. MatchMySize tells you exactly which size to order across every brand — no more returns, no more guessing.</p>
            <div className="lp-hero-actions">
              <button className="lp-btn-hero" onClick={()=>window.location.href='/auth/register'}>Find my size <span>→</span></button>
              <button className="lp-btn-text" onClick={()=>document.getElementById('how')?.scrollIntoView({behavior:'smooth'})}>See how it works ↓</button>
            </div>
          </div>
          {/* Right — horizontally auto-scrolling brand logos */}
          <div className="lp-hero-right">
            <AutoScrollingBrands/>
          </div>
        </div>
      </section>

      <div className="lp-stats">
        <div className="lp-stats-inner">
          {stats.map(({num,suffix,label},i)=>(
            <div key={label} className={`lp-stat lp-reveal lp-d${i}`}><div className="lp-stat-num">{num}<span>{suffix}</span></div><div className="lp-stat-label">{label}</div></div>
          ))}
        </div>
      </div>

      <section className="lp-section lp-how" id="how" style={{background:'var(--white)'}}>
        <div className="lp-section-inner">
          <div className="lp-eyebrow lp-reveal"><div className="lp-eyebrow-line"/><span>How it works</span></div>
          <h2 className="lp-section-title lp-reveal lp-d1">Three steps to <em>perfect fit</em></h2>
          <p className="lp-section-sub lp-reveal lp-d2">No tape measure expertise required. We guide you through every measurement with clear illustrations.</p>
          <div className="lp-how-grid">
            <div className="lp-steps lp-reveal lp-d2">
              {getHowSteps(brandCount).map((step,i)=>(
                <HowItWorksStep key={step.title} {...step} index={i} />
              ))}
            </div>
            <div className="lp-how-vis lp-reveal lp-d3">
              <div className="lp-how-vis-glow"/>
              <FashionMeasurementIllustration />
              <MeasurementCard />
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section" id="features" style={{background:'var(--paper)'}}>
        <div className="lp-section-inner">
          <div className="lp-eyebrow lp-reveal"><div className="lp-eyebrow-line"/><span>Features</span></div>
          <h2 className="lp-section-title lp-reveal lp-d1">Built for how you <em>actually</em> shop</h2>
          <div className="lp-features-grid">
            {features.map(({icon,title,desc},i)=>(
              <div key={title} className={`lp-reveal lp-d${i%6}`}><FeatureCard icon={icon} title={title} desc={desc}/></div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-app-section" id="app">
        <div className="lp-app-bg-glow-1"/><div className="lp-app-bg-glow-2"/><div className="lp-app-grid-overlay"/>
        <div className="lp-app-inner">
          <div>
            <div className="lp-app-eyebrow lp-reveal"><div className="lp-app-eyebrow-dot"/><span>Now on mobile</span></div>
            <h2 className="lp-app-title lp-reveal lp-d1">Your perfect fit,<br/><em>in your pocket</em></h2>
            <p className="lp-app-sub lp-reveal lp-d2">The MatchMySize mobile app brings all your size profiles everywhere you shop — online or in-store.</p>
            <div className="lp-app-bullets lp-reveal lp-d3">{APP_BULLETS.map(({icon,text})=>(<div className="lp-app-bullet" key={text}><div className="lp-app-bullet-icon">{icon}</div><span className="lp-app-bullet-text">{text}</span></div>))}</div>
            <div className="lp-app-downloads lp-reveal lp-d4">
              <a href="#" className="lp-store-btn"><div className="lp-store-icon"><img src={appStoreIcon} alt="App Store"/></div><div><span className="lp-store-text-small">Download on the</span><span className="lp-store-text-big">App Store</span></div></a>
              <a href="#" className="lp-store-btn"><div className="lp-store-icon"><img src={playStoreIcon} alt="Google Play"/></div><div><span className="lp-store-text-small">Get it on</span><span className="lp-store-text-big">Google Play</span></div></a>
            </div>
            <p className="lp-reveal lp-d5" style={{marginTop:20,fontSize:12,color:'rgba(255,255,255,0.28)',lineHeight:1.6}}>Available for iOS 15+ and Android 8+. Free to download.</p>
          </div>
          <div className="lp-app-right lp-reveal lp-d2">
            <div className="lp-phones-wrap"><PhoneHome/><PhoneResult/><div className="lp-app-float-tag"><div className="lp-app-float-tag-dot"/>Scan QR in-store</div></div>
          </div>
        </div>
      </section>

      <section className="lp-section lp-brands" id="brands" style={{background:'var(--white)'}}>
        <div className="lp-section-inner">
          <div className="lp-eyebrow lp-reveal"><div className="lp-eyebrow-line"/><span>Supported brands</span></div>
          <h2 className="lp-section-title lp-reveal lp-d1">Every brand, <em>one profile</em></h2>
          <p className="lp-section-sub lp-reveal lp-d2">From fast fashion to luxury — if they make clothes, we have their sizing.</p>
          <div className="lp-brands-grid">{brands.map((brand,i)=><div key={brand} className={`lp-brand-pill lp-reveal lp-d${i%6}`}>{brand}</div>)}</div>
          <p className="lp-reveal" style={{marginTop:32,fontSize:13,color:'var(--ash)',textAlign:'center'}}>{brandCount} active brands with live sizing data.</p>
        </div>
      </section>

      <section className="lp-cta">
        <div className="lp-cta-glow"/>
        <div className="lp-cta-inner">
          <h2 className="lp-cta-title lp-reveal">Stop guessing.<br/>Start wearing <em>your</em> size.</h2>
          <p className="lp-cta-sub lp-reveal lp-d1">Join thousands of shoppers who never buy the wrong size again. Free to use, always.</p>
          <div className="lp-cta-actions lp-reveal lp-d2">
            <button className="lp-btn-sage" onClick={()=>window.location.href='/auth/register'}>Create free account →</button>
            <button className="lp-btn-ghost-white" onClick={()=>window.location.href='/auth/login'}>Already have an account</button>
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        <a className="lp-footer-logo" href="/">
          <div className="lp-footer-logo-mark"><AppLogo size={22} decorative /></div>
          <span className="lp-footer-logo-text">MatchMySize</span>
        </a>
        <span className="lp-footer-copy">© 2025 MatchMySize. All rights reserved.</span>
        <div className="lp-footer-links"><a href="#">Privacy</a><a href="#">Terms</a><a href="#">Contact</a></div>
      </footer>

    </div>
  );
}

export default LandingPage;
