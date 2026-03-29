import crypto from 'node:crypto';
import process from 'node:process';

import { FieldValue, Timestamp, adminDb } from './firebase-admin.mjs';

const DEFAULT_TTL_MS = 5 * 60 * 1000;

const readEnv = (...keys) => {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return null;
};

const normalizePhoneForAuth = (phoneNumber) => phoneNumber.trim().replace(/\s+/g, '');
const PHONE_E164_REGEX = /^\+[1-9]\d{7,14}$/;
const isValidE164Phone = (phoneNumber) => PHONE_E164_REGEX.test(normalizePhoneForAuth(phoneNumber));

const getOtpTtl = () => {
  const raw = readEnv('TEXTLK_OTP_TTL_MS', 'EXPO_PUBLIC_TEXTLK_OTP_TTL_MS');
  const parsed = Number.parseInt(raw || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TTL_MS;
};

const buildOtpMessage = (code, ttlMs) => {
  const template =
    readEnv('TEXTLK_OTP_TEMPLATE', 'EXPO_PUBLIC_TEXTLK_OTP_TEMPLATE') ||
    'Your MatchMySize verification code is {code}. It expires in {minutes} minutes.';

  return template
    .replaceAll('{code}', code)
    .replaceAll('{minutes}', String(Math.max(1, Math.round(ttlMs / 60000))));
};

const hashCode = (sessionId, code) =>
  crypto.createHash('sha256').update(`${sessionId}:${code}`).digest('hex');

const sendTextLkSms = async ({ recipient, message }) => {
  const token = readEnv('TEXTLK_API_TOKEN', 'EXPO_PUBLIC_TEXTLK_API_TOKEN');
  const senderId = readEnv('TEXTLK_SENDER_ID', 'EXPO_PUBLIC_TEXTLK_SENDER_ID');
  const baseUrl = readEnv('TEXTLK_BASE_URL', 'EXPO_PUBLIC_TEXTLK_BASE_URL') || 'https://app.text.lk/api/v3';

  if (!token || !senderId) {
    throw new Error('Text.lk configuration is missing.');
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/sms/send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recipient,
      sender_id: senderId,
      type: 'plain',
      message,
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.status === 'error') {
    throw new Error(payload?.message || 'Unable to send OTP via Text.lk.');
  }

  return payload;
};

export const requestOtp = async ({ phoneNumber, purpose = 'signup' }) => {
  const normalizedPhone = normalizePhoneForAuth(phoneNumber || '');

  if (!isValidE164Phone(normalizedPhone)) {
    throw new Error('Phone number must be in E.164 format, e.g. +9477xxxxxxx.');
  }

  const code = `${Math.floor(100000 + Math.random() * 900000)}`;
  const sessionId = crypto.randomUUID();
  const ttlMs = getOtpTtl();
  const now = Date.now();
  const expiresAt = now + ttlMs;
  const message = buildOtpMessage(code, ttlMs);

  const smsResponse = await sendTextLkSms({
    recipient: normalizedPhone.replace(/^\+/, ''),
    message,
  });

  await adminDb.collection('otpSessions').doc(sessionId).set({
    purpose,
    phoneNumber: normalizedPhone,
    codeHash: hashCode(sessionId, code),
    status: 'pending',
    createdAt: Timestamp.fromMillis(now),
    expiresAt: Timestamp.fromMillis(expiresAt),
    messageUid: smsResponse?.data?.uid || null,
    lastAttemptAt: null,
    usedAt: null,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return {
    sessionId,
    purpose,
    phoneNumber: normalizedPhone,
    expiresAt,
  };
};

export const verifyOtp = async ({ sessionId, code, purpose, phoneNumber }) => {
  const trimmedCode = String(code || '').trim();
  if (!/^\d{4,8}$/.test(trimmedCode)) {
    throw new Error('Enter the verification code.');
  }

  const sessionRef = adminDb.collection('otpSessions').doc(String(sessionId || '').trim());
  const snapshot = await sessionRef.get();

  if (!snapshot.exists) {
    throw new Error('OTP session not found. Request a new code.');
  }

  const data = snapshot.data() || {};
  const expiresAt = data.expiresAt?.toMillis?.() || 0;
  const normalizedPhone = normalizePhoneForAuth(phoneNumber || data.phoneNumber || '');

  if (data.status === 'verified' || data.usedAt) {
    throw new Error('This code has already been used. Request a new one.');
  }

  if (Date.now() > expiresAt) {
    await sessionRef.set({ status: 'expired', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    throw new Error('The verification code has expired. Request a new one.');
  }

  if (purpose && data.purpose !== purpose) {
    throw new Error('OTP purpose mismatch. Request a new code.');
  }

  if (normalizedPhone && data.phoneNumber !== normalizedPhone) {
    throw new Error('OTP phone number mismatch. Request a new code.');
  }

  if (hashCode(snapshot.id, trimmedCode) !== data.codeHash) {
    await sessionRef.set({ lastAttemptAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    throw new Error('Incorrect verification code.');
  }

  await sessionRef.set({ status: 'verified', usedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }, { merge: true });

  return {
    sessionId: snapshot.id,
    purpose: data.purpose,
    phoneNumber: data.phoneNumber,
    verified: true,
  };
};
