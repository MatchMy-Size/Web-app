import { useEffect, useMemo, useRef, useState, type JSX } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/context/auth-context';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { updateCustomerProfile } from '@/lib/customer-profile';
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
    --white: #FFFFFF;
    --red: #C0392B;
    --fd: 'Cormorant Garamond', serif;
    --fs: 'DM Sans', sans-serif;
    --ease: cubic-bezier(0.22, 1, 0.36, 1);
  }

  .pe-root {
    min-height: 100vh;
    background: var(--paper);
    font-family: var(--fs);
  }

  /* ── Topbar ── */
  .pe-topbar {
    position: sticky; top: 0; z-index: 50;
    height: 64px;
    background: rgba(250,250,248,0.92);
    backdrop-filter: blur(14px);
    border-bottom: 1px solid var(--cloud);
    display: flex; align-items: center;
    padding: 0 48px; gap: 14px;
    animation: pe-fadeDown 0.5s var(--ease) both;
  }
  .pe-back-btn {
    display: flex; align-items: center; gap: 7px;
    font-family: var(--fs); font-size: 13px; font-weight: 600;
    color: var(--ash); background: none; border: none;
    cursor: pointer; padding: 8px 14px; border-radius: 8px;
    transition: all 0.18s;
  }
  .pe-back-btn:hover { background: var(--cloud); color: var(--ink); }
  .pe-back-btn svg { width: 14px; height: 14px; }
  .pe-topbar-divider { width: 1px; height: 22px; background: var(--cloud); }
  .pe-topbar-title {
    font-family: var(--fd); font-size: 20px; font-weight: 700;
    color: var(--ink); letter-spacing: -0.4px;
  }
  .pe-save-btn-top {
    margin-left: auto;
    display: flex; align-items: center; gap: 7px;
    font-family: var(--fs); font-size: 13px; font-weight: 600;
    color: var(--white); background: var(--ink);
    border: none; border-radius: 9px;
    padding: 0 18px; height: 36px; cursor: pointer;
    transition: opacity 0.2s, transform 0.15s;
  }
  .pe-save-btn-top:hover:not(:disabled) { opacity: 0.85; transform: translateY(-1px); }
  .pe-save-btn-top:active:not(:disabled) { transform: scale(0.97); }
  .pe-save-btn-top:disabled { opacity: 0.45; cursor: not-allowed; }
  .pe-save-btn-top svg { width: 14px; height: 14px; }

  /* ── Body ── */
  .pe-body {
    max-width: 680px; margin: 0 auto;
    padding: 44px 48px 80px;
    display: flex; flex-direction: column; gap: 28px;
  }

  /* ── Page header ── */
  .pe-header { animation: pe-fadeUp 0.5s 0.05s var(--ease) both; }
  .pe-header-eyebrow {
    display: flex; align-items: center; gap: 8px;
    font-size: 11px; font-weight: 700; color: var(--sage-deep);
    letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 10px;
  }
  .pe-header-eyebrow-line { width: 28px; height: 1.5px; background: var(--sage-deep); }
  .pe-page-title {
    font-family: var(--fd); font-size: clamp(28px, 3.5vw, 40px);
    font-weight: 700; color: var(--ink); letter-spacing: -0.7px;
    line-height: 1.1; margin-bottom: 8px;
  }
  .pe-page-title em { font-style: italic; color: var(--sage-deep); }
  .pe-page-sub { font-size: 13.5px; color: var(--ash); line-height: 1.65; }

  /* ── Avatar editor ── */
  .pe-avatar-section {
    display: flex; align-items: center; gap: 24px;
    background: var(--white); border: 1px solid var(--cloud);
    border-radius: 18px; padding: 24px 28px;
    animation: pe-fadeUp 0.5s 0.1s var(--ease) both;
  }
  .pe-avatar-wrap { position: relative; flex-shrink: 0; }
  .pe-avatar {
    width: 80px; height: 80px; border-radius: 50%;
    background: var(--ink); border: 2px solid var(--cloud);
    display: flex; align-items: center; justify-content: center;
    overflow: hidden; cursor: pointer;
    transition: filter 0.2s;
    position: relative;
  }
  .pe-avatar:hover .pe-avatar-overlay { opacity: 1; }
  .pe-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .pe-avatar-initials {
    font-family: var(--fd); font-size: 28px; font-weight: 700;
    color: var(--white); letter-spacing: -0.5px; pointer-events: none;
  }
  .pe-avatar-overlay {
    position: absolute; inset: 0;
    background: rgba(13,13,13,0.55);
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transition: opacity 0.2s;
    border-radius: 50%;
  }
  .pe-avatar-overlay svg { width: 20px; height: 20px; color: var(--white); }
  .pe-avatar-change-badge {
    position: absolute; bottom: 0; right: 0;
    width: 24px; height: 24px; border-radius: 50%;
    background: var(--sage-deep); border: 2px solid var(--white);
    display: flex; align-items: center; justify-content: center;
  }
  .pe-avatar-change-badge svg { width: 11px; height: 11px; color: var(--white); }

  .pe-avatar-meta { flex: 1; }
  .pe-avatar-name {
    font-family: var(--fd); font-size: 20px; font-weight: 700;
    color: var(--ink); letter-spacing: -0.3px; margin-bottom: 4px;
  }
  .pe-avatar-hint { font-size: 12.5px; color: var(--ash); margin-bottom: 14px; line-height: 1.5; }
  .pe-upload-label {
    display: inline-flex; align-items: center; gap: 7px;
    font-family: var(--fs); font-size: 12.5px; font-weight: 700;
    color: var(--ink); background: var(--paper);
    border: 1.5px solid var(--cloud); border-radius: 9px;
    padding: 8px 14px; cursor: pointer; transition: all 0.18s;
  }
  .pe-upload-label:hover { border-color: var(--ink); background: var(--white); }
  .pe-upload-label svg { width: 13px; height: 13px; }
  .pe-remove-btn {
    font-family: var(--fs); font-size: 12px; font-weight: 600;
    color: var(--red); background: none; border: none;
    cursor: pointer; padding: 0; margin-left: 10px;
    transition: opacity 0.18s;
  }
  .pe-remove-btn:hover { opacity: 0.7; }

  /* ── Form card ── */
  .pe-form-card {
    background: var(--white); border: 1px solid var(--cloud);
    border-radius: 20px; overflow: hidden;
    animation: pe-fadeUp 0.5s 0.15s var(--ease) both;
  }
  .pe-form-section-header {
    display: flex; align-items: center; gap: 10px;
    padding: 16px 28px 12px;
    border-bottom: 1px solid var(--cloud);
  }
  .pe-form-section-icon {
    width: 28px; height: 28px; border-radius: 7px;
    background: var(--paper); border: 1px solid var(--cloud);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .pe-form-section-icon svg { width: 13px; height: 13px; color: var(--ash); }
  .pe-form-section-title {
    font-size: 11px; font-weight: 700; color: var(--ash);
    letter-spacing: 0.8px; text-transform: uppercase;
  }

  .pe-form-body { padding: 24px 28px; display: flex; flex-direction: column; gap: 20px; }

  /* Two-col name row */
  .pe-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

  /* Field */
  .pe-field { display: flex; flex-direction: column; gap: 8px; }
  .pe-field-label {
    font-size: 12px; font-weight: 700; color: var(--ink);
    display: flex; align-items: center; gap: 8px;
  }
  .pe-field-hint {
    font-size: 11px; font-weight: 500; color: var(--ash);
    background: var(--cloud); border-radius: 999px;
    padding: 2px 8px; margin-left: auto;
  }

  .pe-input-wrap {
    display: flex; align-items: center;
    background: var(--white); border: 1.5px solid var(--cloud);
    border-radius: 12px; overflow: hidden;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .pe-input-wrap:focus-within {
    border-color: var(--ink);
    box-shadow: 0 0 0 3px rgba(13,13,13,0.06);
  }
  .pe-input-wrap.disabled {
    background: var(--paper); opacity: 0.65;
  }
  .pe-input-icon {
    padding: 0 14px; display: flex; align-items: center;
    color: var(--ash); flex-shrink: 0;
  }
  .pe-input-icon svg { width: 15px; height: 15px; }
  .pe-text-input {
    flex: 1; height: 50px; border: none; outline: none;
    background: transparent; font-family: var(--fs);
    font-size: 14px; font-weight: 600; color: var(--ink);
    padding: 0 16px;
  }
  .pe-text-input:not(:first-child) { padding-left: 0; }
  .pe-text-input::placeholder { color: var(--mist); font-weight: 400; }
  .pe-text-input:disabled { cursor: not-allowed; color: var(--ash); }

  /* Lock badge for readonly fields */
  .pe-lock-badge {
    display: flex; align-items: center; gap: 4px;
    padding: 0 14px; flex-shrink: 0;
    font-size: 10px; font-weight: 700; color: var(--mist);
    letter-spacing: 0.3px; text-transform: uppercase;
  }
  .pe-lock-badge svg { width: 12px; height: 12px; }

  /* Error */
  .pe-error {
    display: flex; align-items: center; gap: 10px;
    background: rgba(192,57,43,0.06); border: 1px solid rgba(192,57,43,0.18);
    border-radius: 10px; padding: 12px 16px;
    font-size: 13px; color: var(--red);
    animation: pe-shake 0.4s var(--ease);
  }
  .pe-error svg { width: 15px; height: 15px; flex-shrink: 0; }

  /* Success flash */
  .pe-success {
    display: flex; align-items: center; gap: 10px;
    background: var(--sage-light); border: 1px solid var(--sage-dark);
    border-radius: 10px; padding: 12px 16px;
    font-size: 13px; font-weight: 600; color: var(--sage-deep);
    animation: pe-fadeUp 0.3s var(--ease);
  }
  .pe-success svg { width: 15px; height: 15px; flex-shrink: 0; }

  /* ── Save CTA ── */
  .pe-cta-row {
    display: flex; align-items: center; gap: 12px;
    animation: pe-fadeUp 0.5s 0.22s var(--ease) both;
  }
  .pe-cancel-btn {
    font-family: var(--fs); font-size: 14px; font-weight: 600;
    color: var(--ash); background: var(--white);
    border: 1.5px solid var(--cloud); border-radius: 12px;
    padding: 0 20px; height: 50px; cursor: pointer;
    transition: all 0.18s;
  }
  .pe-cancel-btn:hover { color: var(--ink); border-color: var(--mist); }
  .pe-save-btn {
    flex: 1; height: 50px;
    font-family: var(--fs); font-size: 14px; font-weight: 700;
    color: var(--white); background: var(--ink);
    border: none; border-radius: 12px; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    box-shadow: 0 4px 16px rgba(13,13,13,0.16);
    transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
  }
  .pe-save-btn:hover:not(:disabled) {
    opacity: 0.87; transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(13,13,13,0.2);
  }
  .pe-save-btn:active:not(:disabled) { transform: scale(0.98); }
  .pe-save-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .pe-save-btn svg { width: 16px; height: 16px; }

  .pe-spinner {
    width: 16px; height: 16px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    animation: pe-spin 0.7s linear infinite;
  }

  /* ── Keyframes ── */
  @keyframes pe-fadeDown {
    from { opacity: 0; transform: translateY(-14px); }
    to   { opacity: 1; transform: none; }
  }
  @keyframes pe-fadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: none; }
  }
  @keyframes pe-shake {
    0%,100% { transform: translateX(0); }
    20% { transform: translateX(-6px); }
    40% { transform: translateX(6px); }
    60% { transform: translateX(-4px); }
    80% { transform: translateX(4px); }
  }
  @keyframes pe-spin { to { transform: rotate(360deg); } }

  @media (max-width: 640px) {
    .pe-root {
      min-height: 100dvh;
      overflow-x: hidden;
    }

    .pe-topbar {
      height: auto;
      min-height: 58px;
      padding: 10px 14px;
      gap: 8px;
    }

    .pe-back-btn {
      max-width: 112px;
      padding: 8px 0;
      font-size: 12px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .pe-topbar-divider {
      display: none;
    }

    .pe-topbar-title {
      font-size: 18px;
    }

    .pe-save-btn-top {
      height: 36px;
      padding: 0 11px;
      font-size: 0;
      margin-left: auto;
    }

    .pe-save-btn-top svg,
    .pe-save-btn-top .pe-spinner {
      width: 15px;
      height: 15px;
    }

    .pe-body {
      width: 100%;
      padding: 16px 14px calc(112px + env(safe-area-inset-bottom, 0px));
      gap: 16px;
    }

    .pe-page-title {
      font-size: 32px;
      letter-spacing: 0;
    }

    .pe-page-sub {
      font-size: 13px;
      line-height: 1.55;
    }

    .pe-avatar-section {
      align-items: flex-start;
      gap: 14px;
      padding: 16px;
      border-radius: 15px;
    }

    .pe-avatar {
      width: 66px;
      height: 66px;
    }

    .pe-avatar-name,
    .pe-avatar-hint {
      overflow-wrap: anywhere;
    }

    .pe-upload-label {
      min-height: 38px;
      padding: 7px 11px;
      font-size: 12px;
    }

    .pe-form-card {
      border-radius: 15px;
    }

    .pe-form-section-header {
      padding: 14px 16px 11px;
    }

    .pe-form-body {
      padding: 16px;
      gap: 16px;
    }

    .pe-two-col {
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .pe-field-label {
      flex-wrap: wrap;
    }

    .pe-field-hint {
      margin-left: 0;
    }

    .pe-text-input {
      height: 50px;
      font-size: 16px;
    }

    .pe-lock-badge {
      padding: 0 10px;
      font-size: 9px;
    }

    .pe-cta-row {
      position: sticky;
      bottom: calc(92px + env(safe-area-inset-bottom, 0px));
      z-index: 20;
      padding: 8px 0 0;
      background: var(--paper);
    }

    .pe-cancel-btn {
      width: 96px;
      padding: 0 12px;
    }

    .pe-save-btn {
      min-width: 0;
    }
  }
`;

if (!document.getElementById('pe-styles')) {
  const s = document.createElement('style');
  s.id = 'pe-styles';
  s.textContent = CSS;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────────
   SVG icons
───────────────────────────────────────────── */
const Ico = {
  Back:    () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M13 8H3M7 4l-4 4 4 4"/></svg>,
  Save:    () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M13 13H3V3h7l3 3v7z"/><rect x="5" y="9" width="6" height="4" rx="0.5"/><rect x="5" y="3" width="4" height="3" rx="0.5"/></svg>,
  User:    () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>,
  Mail:    () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="4" width="12" height="9" rx="1.5"/><path d="M2 5l6 5 6-5"/></svg>,
  Phone:   () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="4" y="1" width="8" height="14" rx="2"/><circle cx="8" cy="12" r="0.7" fill="currentColor" stroke="none"/></svg>,
  Image:   () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="3" width="12" height="10" rx="2"/><circle cx="6" cy="7" r="1.2"/><path d="M2 11l3.5-3.5L8 10l2-2 4 3"/></svg>,
  Lock:    () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="7" width="10" height="8" rx="2"/><path d="M5 7V5a3 3 0 016 0v2"/></svg>,
  Alert:   () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="6"/><path d="M8 5v4M8 11v.5"/></svg>,
  Check:   () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 8l3.5 3.5L13 5"/></svg>,
  Edit:    () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M11 2l3 3-8 8H3v-3L11 2z"/></svg>,
  Plus:    () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 3v10M3 8h10"/></svg>,
};

/* ─────────────────────────────────────────────
   Focus-animated input wrapper
───────────────────────────────────────────── */
function InputWrap({ icon, disabled = false, lockLabel, children }: {
  icon?: () => JSX.Element;
  disabled?: boolean;
  lockLabel?: string;
  children: React.ReactNode;
}) {
  const Icon = icon;
  return (
    <div className={`pe-input-wrap${disabled ? ' disabled' : ''}`}>
      {Icon && <div className="pe-input-icon"><Icon /></div>}
      {children}
      {lockLabel && (
        <div className="pe-lock-badge">
          <Ico.Lock /> {lockLabel}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */
export function ProfileEditPage() {
  const navigate = useNavigate();
  const { user }  = useAuth();
  const { profile } = useRecommendationData(user?.uid, { subject: 'self' });

  const [firstName,    setFirstName]    = useState('');
  const [lastName,     setLastName]     = useState('');
  const [email,        setEmail]        = useState('');
  const [photoFile,    setPhotoFile]    = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [errorKey,     setErrorKey]     = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFirstName(String(profile?.firstName ?? ''));
    setLastName(String(profile?.lastName  ?? ''));
    setEmail(String(profile?.email        ?? ''));
    setPhotoPreview(typeof profile?.photoURL === 'string' ? profile.photoURL : null);
  }, [profile]);

  const fullName = useMemo(() =>
    `${firstName} ${lastName}`.trim() || 'User',
    [firstName, lastName]
  );
  const initials = useMemo(() =>
    `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase() || 'U',
    [firstName, lastName]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setPhotoFile(file);
    if (file) setPhotoPreview(URL.createObjectURL(file));
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      setSaving(true); setError(null);
      let photoURL = photoPreview;
      if (photoFile) {
        const uploaded = await uploadImageToCloudinary(photoFile);
        photoURL = uploaded.url;
      }
      await updateCustomerProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || null,
        photoURL: photoURL ?? null,
      });
      navigate('/app/profile/details');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save profile.');
      setErrorKey(k => k + 1);
    } finally {
      setSaving(false);
    }
  };

  const phone = String(profile?.phoneNumber ?? '');
  const isDirty = firstName !== String(profile?.firstName ?? '')
    || lastName !== String(profile?.lastName ?? '')
    || email !== String(profile?.email ?? '')
    || !!photoFile;

  return (
    <div className="pe-root">

      {/* ── Topbar ── */}
      <div className="pe-topbar">
        <button className="pe-back-btn" onClick={() => navigate('/app/profile/details')}>
          Profile details
        </button>
        <div className="pe-topbar-divider" />
        <span className="pe-topbar-title">Edit profile</span>
        <button
          className="pe-save-btn-top"
          disabled={saving || !isDirty}
          onClick={handleSave}>
          {saving ? <><div className="pe-spinner" /> Saving…</> : <><Ico.Save /> Save changes</>}
        </button>
      </div>

      {/* ── Body ── */}
      <form className="pe-body" onSubmit={handleSave}>

        {/* Page header */}
        <div className="pe-header">
          <div className="pe-header-eyebrow">
            <div className="pe-header-eyebrow-line" />
            Account settings
          </div>
          <h1 className="pe-page-title">
            Edit your <em>profile</em>
          </h1>
          <p className="pe-page-sub">
            Update your name, email, and photo. Phone number is tied to your sign-in and cannot be changed here.
          </p>
        </div>

        {/* Avatar editor */}
        <div className="pe-avatar-section">
          <div className="pe-avatar-wrap" onClick={() => fileInputRef.current?.click()}>
            <div className="pe-avatar">
              {photoPreview
                ? <img src={photoPreview} alt={fullName} />
                : <span className="pe-avatar-initials">{initials}</span>
              }
              <div className="pe-avatar-overlay"><Ico.Edit /></div>
            </div>
            <div className="pe-avatar-change-badge"><Ico.Plus /></div>
          </div>

          <div className="pe-avatar-meta">
            <div className="pe-avatar-name">{fullName}</div>
            <div className="pe-avatar-hint">
              JPG or PNG, max 5MB. Square images work best.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
              <label className="pe-upload-label">
                <Ico.Image /> {photoPreview ? 'Change photo' : 'Upload photo'}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleFileChange}
                />
              </label>
              {photoPreview && (
                <button type="button" className="pe-remove-btn" onClick={handleRemovePhoto}>
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Personal info card */}
        <div className="pe-form-card">
          <div className="pe-form-section-header">
            <div className="pe-form-section-icon"><Ico.User /></div>
            <span className="pe-form-section-title">Personal information</span>
          </div>
          <div className="pe-form-body">

            {/* Name row */}
            <div className="pe-two-col">
              <div className="pe-field">
                <label className="pe-field-label">First name</label>
                <InputWrap icon={Ico.User}>
                  <input
                    className="pe-text-input"
                    placeholder="First name"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    autoComplete="given-name"
                  />
                </InputWrap>
              </div>
              <div className="pe-field">
                <label className="pe-field-label">Last name</label>
                <InputWrap>
                  <input
                    className="pe-text-input"
                    placeholder="Last name"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    autoComplete="family-name"
                  />
                </InputWrap>
              </div>
            </div>

            {/* Email */}
            <div className="pe-field">
              <label className="pe-field-label">
                Email address
                <span className="pe-field-hint" style={{ marginLeft: 'auto' }}>Optional</span>
              </label>
              <InputWrap icon={Ico.Mail}>
                <input
                  className="pe-text-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </InputWrap>
            </div>

          </div>
        </div>

        {/* Sign-in info card (read-only) */}
        <div className="pe-form-card">
          <div className="pe-form-section-header">
            <div className="pe-form-section-icon"><Ico.Lock /></div>
            <span className="pe-form-section-title">Sign-in credentials</span>
          </div>
          <div className="pe-form-body">
            <div className="pe-field">
              <label className="pe-field-label">Phone number</label>
              <InputWrap icon={Ico.Phone} disabled lockLabel="Fixed">
                <input
                  className="pe-text-input"
                  value={phone}
                  disabled
                  readOnly
                />
              </InputWrap>
              <p style={{ fontSize: 12, color: 'var(--ash)', marginTop: 2, lineHeight: 1.5 }}>
                Your phone number is your sign-in identifier and cannot be changed here.
                To update it, contact support.
              </p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="pe-error" key={errorKey}>
            <Ico.Alert /> {error}
          </div>
        )}

        {/* CTA row */}
        <div className="pe-cta-row">
          <button
            type="button"
            className="pe-cancel-btn"
            onClick={() => navigate('/app/profile/details')}>
            Cancel
          </button>
          <button
            type="submit"
            className="pe-save-btn"
            disabled={saving || !isDirty}>
            {saving
              ? <><div className="pe-spinner" /> Saving…</>
              : <><Ico.Save /> Save changes</>
            }
          </button>
        </div>

      </form>
    </div>
  );
}

export default ProfileEditPage;
