import path from 'node:path';

import {
  ensureKeys,
  getFrontendEnv,
  loadEnvFile,
  projectRoot,
  writeDotEnvFile,
} from './deploy-utils.mjs';

const env = loadEnvFile('.env');

ensureKeys(env, [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
]);

const outputPath = path.join(projectRoot, '.env.production');
const frontendEnv = getFrontendEnv(env);

writeDotEnvFile(outputPath, frontendEnv);

console.log(`Wrote ${outputPath}`);
