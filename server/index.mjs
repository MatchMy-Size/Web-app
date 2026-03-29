import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

import { adminAuth, adminDb } from './firebase-admin.mjs';
import { requestOtp, verifyOtp } from './otp-service.mjs';

dotenv.config();

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');
const port = Number(process.env.PORT || 4040);

app.use(cors({ origin: true, credentials: false }));
app.use(express.json({ limit: '1mb' }));

const getBearerToken = (req) => {
  const header = req.headers.authorization;
  if (typeof header !== 'string') return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
};

const requireAuth = async (req, res, next) => {
  try {
    const token = getBearerToken(req);
    if (!token) {
      res.status(401).json({ status: 'error', message: 'Missing authorization token.' });
      return;
    }

    const decoded = await adminAuth.verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unauthorized request.',
    });
  }
};

const parseSellerUserId = (sellerRef) => {
  if (typeof sellerRef !== 'string') return null;
  const normalized = sellerRef.trim();
  if (!normalized) return null;

  const segments = normalized.split('/').filter(Boolean);
  if (!segments.length) return null;
  if (segments.length >= 2 && segments[segments.length - 2] === 'users') {
    return segments[segments.length - 1] ?? null;
  }

  return segments[segments.length - 1] ?? null;
};

const readText = (...candidates) => {
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }
  return null;
};

const buildSellerPublicProfile = (uid, record) => {
  const displayName =
    readText(
      record.displayName,
      `${readText(record.firstName) ?? ''} ${readText(record.lastName) ?? ''}`.trim(),
      record.email,
    ) || 'Seller';

  return {
    uid,
    businessName:
      readText(
        record.businessName,
        record.storeName,
        record.shopName,
        record.companyName,
        record.sellerName,
        record.brandName,
        record.displayName,
      ) || displayName,
    displayName,
    photoURL: readText(
      record.photoURL,
      record.photoUrl,
      record.imageUrl,
      record.imageURL,
      record.profilePhoto,
      record.profileImage,
      record.bannerImage,
      record.bannerURL,
      record.bannerUrl,
      record.logoUrl,
      record.logoURL,
    ),
  };
};

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/otp/request', async (req, res) => {
  try {
    const payload = await requestOtp(req.body || {});
    res.json({ status: 'success', data: payload });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unable to request OTP.',
    });
  }
});

app.post('/api/otp/verify', async (req, res) => {
  try {
    const payload = await verifyOtp(req.body || {});
    res.json({ status: 'success', data: payload });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unable to verify OTP.',
    });
  }
});

app.get('/api/catalog/bootstrap', requireAuth, async (_req, res) => {
  try {
    const brandSnapshot = await adminDb.collection('brandSizesMeasurements').get();
    const brandRows = brandSnapshot.docs.map((entry) => ({
      id: entry.id,
      ...entry.data(),
    }));

    const sellerUserIds = Array.from(
      new Set(
        brandRows
          .map((row) => parseSellerUserId(row.sellerUid ?? row.sellerId ?? row.sellerRef))
          .filter(Boolean),
      ),
    );

    const sellerEntries = await Promise.all(
      sellerUserIds.map(async (uid) => {
        const snap = await adminDb.collection('users').doc(uid).get();
        if (!snap.exists) return [uid, null];
        return [uid, buildSellerPublicProfile(uid, snap.data() || {})];
      }),
    );

    const sellers = Object.fromEntries(
      sellerEntries.filter((entry) => entry[1] !== null),
    );

    res.json({
      status: 'success',
      data: {
        brandRows,
        sellers,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unable to load catalog data.',
    });
  }
});

app.use(express.static(distDir));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    next();
    return;
  }

  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(port, () => {
  console.log(`MatchMySize web server running on http://localhost:${port}`);
});
