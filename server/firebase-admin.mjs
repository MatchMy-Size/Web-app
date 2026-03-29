import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const readEnv = (...keys) => {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return null;
};

const resolveServiceAccount = () => {
  const serviceAccountPath = readEnv('FIREBASE_SERVICE_ACCOUNT_PATH', 'GOOGLE_APPLICATION_CREDENTIALS');
  const inlineJson = readEnv('FIREBASE_SERVICE_ACCOUNT_JSON');

  if (inlineJson) {
    return JSON.parse(inlineJson);
  }

  if (!serviceAccountPath) {
    return null;
  }

  const candidatePaths = path.isAbsolute(serviceAccountPath)
    ? [serviceAccountPath]
    : [
        path.resolve(process.cwd(), serviceAccountPath),
        path.resolve(projectRoot, serviceAccountPath),
      ];

  const absolutePath = candidatePaths.find((candidate) => fs.existsSync(candidate));

  if (!absolutePath) {
    throw new Error(
      `Service account file not found for FIREBASE_SERVICE_ACCOUNT_PATH="${serviceAccountPath}".`,
    );
  }

  return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
};

const projectId = readEnv('FIREBASE_PROJECT_ID', 'GOOGLE_CLOUD_PROJECT', 'GCLOUD_PROJECT') || undefined;
const serviceAccount = resolveServiceAccount();
const credential = serviceAccount ? cert(serviceAccount) : applicationDefault();

const app = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential,
      projectId,
    });

const adminDb = getFirestore(app);
const adminAuth = getAuth(app);

export { adminAuth, adminDb, FieldValue, Timestamp };
