import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  ensureKeys,
  getProjectId,
  loadEnvFile,
  runCommand,
  writeYamlEnvFile,
} from './deploy-utils.mjs';

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');

const env = loadEnvFile('.env');
const projectId = getProjectId(env);
const serviceName = env.CLOUD_RUN_SERVICE?.trim() || 'matchmysize-api';
const region = env.CLOUD_RUN_REGION?.trim() || 'us-central1';
const image = `gcr.io/${projectId}/${serviceName}`;

ensureKeys(env, [
  'TEXTLK_API_TOKEN',
  'TEXTLK_SENDER_ID',
  'TEXTLK_BASE_URL',
  'TEXTLK_OTP_TEMPLATE',
  'TEXTLK_OTP_TTL_MS',
]);

const runtimeEnv = {
  NODE_ENV: 'production',
  FIREBASE_PROJECT_ID: projectId,
  TEXTLK_API_TOKEN: env.TEXTLK_API_TOKEN,
  TEXTLK_SENDER_ID: env.TEXTLK_SENDER_ID,
  TEXTLK_BASE_URL: env.TEXTLK_BASE_URL,
  TEXTLK_OTP_TEMPLATE: env.TEXTLK_OTP_TEMPLATE,
  TEXTLK_OTP_TTL_MS: env.TEXTLK_OTP_TTL_MS,
};

const envFilePath = path.join(os.tmpdir(), `matchmysize-cloudrun-${Date.now()}.yaml`);

writeYamlEnvFile(envFilePath, runtimeEnv);

console.log(`Deploying Cloud Run service "${serviceName}" to project "${projectId}" in region "${region}"`);

try {
  runCommand('gcloud', ['builds', 'submit', '--project', projectId, '--tag', image], { dryRun });
  runCommand(
    'gcloud',
    [
      'run',
      'deploy',
      serviceName,
      '--project',
      projectId,
      '--image',
      image,
      '--region',
      region,
      '--allow-unauthenticated',
      '--env-vars-file',
      envFilePath,
    ],
    { dryRun },
  );
} finally {
  if (fs.existsSync(envFilePath)) {
    fs.unlinkSync(envFilePath);
  }
}
