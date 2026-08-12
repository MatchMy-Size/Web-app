import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { FiArrowRight, FiEye, FiEyeOff, FiImage, FiLock, FiMail, FiPhone, FiShield } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';

import { AppLogo } from '@/components/app-logo';
import sellerAuthImage from '@/assets/images/sellerloginand regis.png';
import { registerSeller, signInSeller } from '@/lib/auth-api';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { requestOtpViaTextLk, verifyOtpSession } from '@/lib/otp-client';
import { isValidE164Phone, normalizePhoneForAuth } from '@/lib/phone-auth';
import type { OtpSession } from '@/lib/auth-flow';
import '@/seller-portal.css';

function SellerAuthFrame({ children }: { children: ReactNode; mode: 'login' | 'register' }) {
  return (
    <main className="seller-auth">
      <section className="seller-auth-story">
        <Link to="/" className="seller-auth-brand"><span><AppLogo size={42} decorative /></span><div><strong>MatchMySize</strong><small>Seller Studio</small></div></Link>
        <div className="seller-auth-visual" aria-hidden="true">
          <img src={sellerAuthImage} alt="" />
        </div>
        <div className="seller-auth-foot">MatchMySize · Seller portal</div>
      </section>
      <section className="seller-auth-form-side">{children}</section>
    </main>
  );
}

export function SellerLoginPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      setLoading(true);
      const value = identifier.includes('@') ? identifier.trim() : normalizePhoneForAuth(identifier);
      const result = await signInSeller(value, password);
      if (result.user.role !== 'seller') throw new Error('This account does not have seller access.');
      navigate('/seller/dashboard', { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to sign in to the seller portal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SellerAuthFrame mode="login">
      <div className="seller-auth-card">
        <p className="seller-kicker">Seller access</p>
        <h2>Welcome back</h2>
        <p className="seller-auth-sub">Use the email or phone number connected to your seller account.</p>
        <form onSubmit={submit} className="seller-form-stack">
          <label><span>Email or phone</span><div className="seller-input-icon"><FiMail /><input value={identifier} onChange={event => setIdentifier(event.target.value)} placeholder="seller@brand.com or +94…" autoComplete="username" required /></div></label>
          <label><span>Password</span><div className="seller-input-icon"><FiLock /><input type={showPassword ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} placeholder="Enter your password" autoComplete="current-password" required /><button type="button" onClick={() => setShowPassword(value => !value)} aria-label="Toggle password">{showPassword ? <FiEyeOff /> : <FiEye />}</button></div></label>
          <div className="seller-form-meta"><Link to="/auth/forgot-password?portal=seller">Forgot password?</Link></div>
          {error && <div className="seller-form-error">{error}</div>}
          <button className="seller-primary-button" type="submit" disabled={loading || !identifier.trim() || !password}>{loading ? 'Signing in…' : <>Open seller studio <FiArrowRight /></>}</button>
        </form>
        <p className="seller-auth-switch">New seller? <Link to="/seller/register">Register your brand</Link></p>
        <p className="seller-auth-customer"><Link to="/auth/login">Sign in as a customer instead</Link></p>
      </div>
    </SellerAuthFrame>
  );
}

type SellerRegistrationDraft = {
  businessName: string;
  contactName: string;
  email: string;
  phoneNumber: string;
  address: string;
  password: string;
  confirmPassword: string;
  photoUrl: string;
};

const emptyRegistration: SellerRegistrationDraft = {
  businessName: '', contactName: '', email: '', phoneNumber: '', address: '', password: '', confirmPassword: '', photoUrl: '',
};

export function SellerRegisterPage() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState(emptyRegistration);
  const [otpSession, setOtpSession] = useState<OtpSession | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const normalizedPhone = useMemo(() => normalizePhoneForAuth(draft.phoneNumber), [draft.phoneNumber]);

  const update = (key: keyof SellerRegistrationDraft, value: string) => setDraft(current => ({ ...current, [key]: value }));

  const uploadLogo = async (file?: File) => {
    if (!file) return;
    try {
      setUploading(true);
      setError('');
      const uploaded = await uploadImageToCloudinary(file, 'matchmysize/seller-brands');
      update('photoUrl', uploaded.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Logo upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const requestOtp = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!isValidE164Phone(normalizedPhone)) return setError('Enter a valid phone number.');
    if (draft.password.length < 6) return setError('Password must contain at least 6 characters.');
    if (draft.password !== draft.confirmPassword) return setError('Passwords do not match.');
    try {
      setLoading(true);
      setOtpSession(await requestOtpViaTextLk(normalizedPhone, 'signup'));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not send the verification code.');
    } finally {
      setLoading(false);
    }
  };

  const complete = async (event: FormEvent) => {
    event.preventDefault();
    if (!otpSession || otpCode.length !== 6) return;
    setError('');
    try {
      setLoading(true);
      await verifyOtpSession(otpSession, otpCode);
      const result = await registerSeller({
        phoneNumber: normalizedPhone,
        email: draft.email.trim(),
        password: draft.password,
        otpSessionId: otpSession.sessionId,
        businessName: draft.businessName.trim(),
        contactName: draft.contactName.trim(),
        address: draft.address.trim(),
        photoUrl: draft.photoUrl,
      });
      if (result.user.role !== 'seller') throw new Error('Seller account setup was not completed.');
      navigate('/seller/dashboard', { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Seller registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SellerAuthFrame mode="register">
      <div className="seller-auth-card seller-register-card">
        <p className="seller-kicker">Create a seller account</p>
        <h2>{otpSession ? 'Verify your phone' : 'Register your brand'}</h2>
        <p className="seller-auth-sub">{otpSession ? `Enter the six-digit code sent to ${normalizedPhone}.` : 'Create your brand workspace and publish your first size chart.'}</p>

        {!otpSession ? (
          <form onSubmit={requestOtp} className="seller-form-stack">
            <div className="seller-logo-upload">
              <label>
                {draft.photoUrl ? <img src={draft.photoUrl} alt="Brand logo preview" /> : <FiImage />}
                <input type="file" accept="image/*" onChange={event => void uploadLogo(event.target.files?.[0])} />
              </label>
              <div><strong>Brand logo</strong><small>{uploading ? 'Uploading…' : 'Optional · PNG, JPG or WebP'}</small></div>
            </div>
            <div className="seller-form-grid">
              <label><span>Business / brand name</span><input value={draft.businessName} onChange={event => update('businessName', event.target.value)} required /></label>
              <label><span>Contact name</span><input value={draft.contactName} onChange={event => update('contactName', event.target.value)} required /></label>
              <label><span>Business email</span><div className="seller-input-icon"><FiMail /><input type="email" value={draft.email} onChange={event => update('email', event.target.value)} required /></div></label>
              <label><span>Phone number</span><div className="seller-input-icon"><FiPhone /><input value={draft.phoneNumber} onChange={event => update('phoneNumber', event.target.value)} placeholder="0771234567" required /></div></label>
              <label className="seller-grid-wide"><span>Business address</span><input value={draft.address} onChange={event => update('address', event.target.value)} /></label>
              <label><span>Password</span><input type="password" value={draft.password} onChange={event => update('password', event.target.value)} minLength={6} required /></label>
              <label><span>Confirm password</span><input type="password" value={draft.confirmPassword} onChange={event => update('confirmPassword', event.target.value)} minLength={6} required /></label>
            </div>
            {error && <div className="seller-form-error">{error}</div>}
            <button className="seller-primary-button" type="submit" disabled={loading || uploading}>{loading ? 'Sending code…' : <>Verify phone <FiArrowRight /></>}</button>
          </form>
        ) : (
          <form onSubmit={complete} className="seller-form-stack">
            <div className="seller-otp-icon"><FiShield /></div>
            <input className="seller-otp-input" value={otpCode} onChange={event => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoFocus placeholder="000000" aria-label="Verification code" />
            {error && <div className="seller-form-error">{error}</div>}
            <button className="seller-primary-button" type="submit" disabled={loading || otpCode.length !== 6}>{loading ? 'Creating workspace…' : <>Create seller workspace <FiArrowRight /></>}</button>
            <button className="seller-text-button" type="button" onClick={() => { setOtpSession(null); setOtpCode(''); setError(''); }}>Edit registration details</button>
          </form>
        )}
        <p className="seller-auth-switch">Already registered? <Link to="/seller/login">Seller sign in</Link></p>
      </div>
    </SellerAuthFrame>
  );
}
