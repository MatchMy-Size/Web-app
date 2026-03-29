import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

function loadEnvFile(filename = '.env') {
  const filePath = path.join(projectRoot, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing ${filename} in ${projectRoot}.`);
  }

  return dotenv.parse(fs.readFileSync(filePath, 'utf8'));
}

function ensureKeys(env, keys) {
  const missing = keys.filter((key) => {
    const value = env[key];
    return typeof value !== 'string' || !value.trim();
  });

  if (missing.length) {
    throw new Error(`Missing required environment values: ${missing.join(', ')}`);
  }
}

function getProjectId(env) {
  const projectId = env.FIREBASE_PROJECT_ID?.trim() || env.VITE_FIREBASE_PROJECT_ID?.trim();
  if (!projectId) {
    throw new Error('Missing FIREBASE_PROJECT_ID or VITE_FIREBASE_PROJECT_ID in .env.');
  }

  return projectId;
}

function getFrontendEnv(env) {
  const frontendEnv = Object.fromEntries(
    Object.entries(env).filter(([key]) => key.startsWith('VITE_')),
  );

  frontendEnv.VITE_API_BASE_URL = '';
  return frontendEnv;
}

function writeDotEnvFile(filePath, values) {
  const lines = Object.entries(values).map(([key, value]) => `${key}=${value ?? ''}`);
  fs.writeFileSync(filePath, `${lines.join('\n')}\n`, 'utf8');
}

function writeYamlEnvFile(filePath, values) {
  const lines = Object.entries(values).map(([key, value]) => `${key}: ${JSON.stringify(String(value ?? ''))}`);
  fs.writeFileSync(filePath, `${lines.join('\n')}\n`, 'utf8');
}

function runCommand(command, args, { dryRun = false, env = process.env } = {}) {
  const printable = [command, ...args].join(' ');
  console.log(`> ${printable}`);

  if (dryRun) return;

  const result = spawnSync(command, args, {
    cwd: projectRoot,
    stdio: 'inherit',
    env,
    shell: process.platform === 'win32',
  });

  if (result.error) {
    if ('code' in result.error && result.error.code === 'ENOENT') {
      throw new Error(`${command} is not installed or not available on PATH.`);
    }
    throw result.error;
  }

  if (typeof result.status === 'number' && result.status !== 0) {
    throw new Error(`${command} exited with code ${result.status}.`);
  }
}

export {
  ensureKeys,
  getFrontendEnv,
  getProjectId,
  loadEnvFile,
  projectRoot,
  runCommand,
  writeDotEnvFile,
  writeYamlEnvFile,
};
