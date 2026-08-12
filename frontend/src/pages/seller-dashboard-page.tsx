import { useEffect, useState, type FormEvent } from 'react';
import { FiArrowRight, FiCheckCircle, FiEdit3, FiGrid, FiImage, FiMapPin, FiPhone, FiPlus, FiX } from 'react-icons/fi';
import { Link } from 'react-router-dom';

import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { getSellerDashboard, updateSellerProfile, type SellerDashboard, type SellerProfile } from '@/lib/seller-api';
import '@/seller-portal.css';

function LoadingState() {
  return <div className="seller-loading"><span /><p>Loading your seller workspace…</p></div>;
}

export function SellerDashboardPage() {
  const [dashboard, setDashboard] = useState<SellerDashboard | null>(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);

  const load = async () => {
    try {
      setError('');
      setDashboard(await getSellerDashboard());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load seller data.');
    }
  };

  useEffect(() => { void load(); }, []);

  if (!dashboard && !error) return <LoadingState />;
  if (!dashboard) return <main className="seller-page"><div className="seller-form-error seller-page-error">{error}<button type="button" onClick={() => void load()}>Try again</button></div></main>;

  const profile = dashboard.profile;
  return (
    <main className="seller-page">
      <header className="seller-page-header">
        <div><p className="seller-kicker">Seller overview</p><h1>Welcome back, <em>{profile.contactName || 'Seller'}.</em></h1><p>Keep your brand details and size measurements accurate for better customer recommendations.</p></div>
        <Link className="seller-primary-button compact" to="/seller/categories"><FiPlus /> Add size chart</Link>
      </header>

      {error && <div className="seller-form-error seller-page-error">{error}<button type="button" onClick={() => void load()}>Try again</button></div>}

      <>
          <section className="seller-profile-hero">
            <div className="seller-profile-logo">{profile.photoUrl ? <img src={profile.photoUrl} alt={`${profile.businessName} logo`} /> : <span>{profile.businessName?.charAt(0).toUpperCase() || 'S'}</span>}</div>
            <div className="seller-profile-copy">
              <span className="seller-status"><FiCheckCircle /> {profile.status}</span>
              <h2>{profile.businessName}</h2>
              <p>{profile.contactName} · {profile.email}</p>
              <div className="seller-profile-details">
                {profile.phoneNumber && <span><FiPhone />{profile.phoneNumber}</span>}
                {profile.address && <span><FiMapPin />{profile.address}</span>}
              </div>
            </div>
            <button className="seller-secondary-button" type="button" onClick={() => setEditing(true)}><FiEdit3 /> Edit business profile</button>
          </section>

          <section className="seller-stat-grid">
            <article className="seller-stat-card dark"><div className="seller-stat-icon"><FiGrid /></div><span>Published charts</span><strong>{dashboard.categoryCount}</strong><small>Clothing categories connected to customers</small></article>
            <article className="seller-stat-card"><div className="seller-stat-icon"><FiCheckCircle /></div><span>Size entries</span><strong>{dashboard.sizeCount}</strong><small>Individual sizes available for matching</small></article>
            <article className="seller-stat-card sage"><div className="seller-stat-icon"><FiArrowRight /></div><span>Data status</span><strong>{dashboard.sizeCount > 0 ? 'Live' : 'Ready'}</strong><small>{dashboard.sizeCount > 0 ? 'Your data is part of customer recommendations' : 'Add a chart to start matching customers'}</small></article>
          </section>

          <section className="seller-dashboard-grid">
            <article className="seller-panel seller-quick-panel">
              <div className="seller-panel-head"><div><p className="seller-kicker">Quick action</p><h3>Manage size charts</h3></div><FiGrid /></div>
              <p>Add clothing categories and the measurements for every available size. Product inventory is intentionally not part of this portal.</p>
              <Link className="seller-action-row" to="/seller/categories"><span><FiGrid /></span><div><strong>Open size chart manager</strong><small>Create, edit, or archive category measurements</small></div><FiArrowRight /></Link>
            </article>
            <article className="seller-panel seller-guidance-panel">
              <p className="seller-kicker">Measurement standard</p><h3>One consistent source of truth</h3>
              <p>You may enter centimetres or inches. MatchMySize normalizes every seller value into centimetres before saving and matching.</p>
              <div className="seller-guidance-tags"><span>cm storage</span><span>Seller-owned</span><span>Customer-ready</span></div>
            </article>
          </section>
        </>

      {editing && profile && <SellerProfileModal profile={profile} onClose={() => setEditing(false)} onSaved={saved => { setDashboard(current => current ? { ...current, profile: saved } : current); setEditing(false); }} />}
    </main>
  );
}

function SellerProfileModal({ profile, onClose, onSaved }: { profile: SellerProfile; onClose: () => void; onSaved: (profile: SellerProfile) => void }) {
  const [draft, setDraft] = useState(profile);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const update = (key: keyof SellerProfile, value: string) => setDraft(current => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setSaving(true); setError('');
      const saved = await updateSellerProfile({
        businessName: draft.businessName, contactName: draft.contactName, email: draft.email,
        phoneNumber: draft.phoneNumber, address: draft.address, photoUrl: draft.photoUrl,
      });
      onSaved(saved);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save profile.');
    } finally { setSaving(false); }
  };

  const upload = async (file?: File) => {
    if (!file) return;
    try {
      setUploading(true); setError('');
      const result = await uploadImageToCloudinary(file, 'matchmysize/seller-brands');
      update('photoUrl', result.url);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Logo upload failed.'); }
    finally { setUploading(false); }
  };

  return (
    <div className="seller-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="seller-modal" role="dialog" aria-modal="true" aria-labelledby="seller-profile-title">
        <header><div><p className="seller-kicker">Business details</p><h2 id="seller-profile-title">Edit seller profile</h2></div><button type="button" onClick={onClose} aria-label="Close"><FiX /></button></header>
        <form onSubmit={submit}>
          <div className="seller-modal-scroll">
            <div className="seller-logo-upload large"><label>{draft.photoUrl ? <img src={draft.photoUrl} alt="Brand logo" /> : <FiImage />}<input type="file" accept="image/*" onChange={event => void upload(event.target.files?.[0])} /></label><div><strong>Brand logo</strong><small>{uploading ? 'Uploading…' : 'Click the preview to replace it'}</small></div></div>
            <div className="seller-form-grid">
              <label><span>Business / brand name</span><input value={draft.businessName} onChange={event => update('businessName', event.target.value)} required /></label>
              <label><span>Contact name</span><input value={draft.contactName} onChange={event => update('contactName', event.target.value)} required /></label>
              <label><span>Sign-in email</span><input type="email" value={draft.email} readOnly aria-readonly="true" title="Your authentication email cannot be changed here." /><small className="seller-field-help">Contact support to change the sign-in email.</small></label>
              <label><span>Phone number</span><input value={draft.phoneNumber} onChange={event => update('phoneNumber', event.target.value)} /></label>
              <label className="seller-grid-wide"><span>Address</span><textarea value={draft.address} onChange={event => update('address', event.target.value)} rows={3} /></label>
            </div>
            {error && <div className="seller-form-error">{error}</div>}
          </div>
          <footer><button type="button" className="seller-secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="seller-primary-button compact" disabled={saving || uploading}>{saving ? 'Saving…' : 'Save changes'}</button></footer>
        </form>
      </section>
    </div>
  );
}
