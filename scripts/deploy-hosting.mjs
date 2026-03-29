import path from 'node:path';

import {
  getFrontendEnv,
  getProjectId,
  loadEnvFile,
  projectRoot,
  runCommand,
  writeDotEnvFile,
} from './deploy-utils.mjs';

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');

const env = loadEnvFile('.env');
const projectId = getProjectId(env);
const outputPath = path.join(projectRoot, '.env.production');

writeDotEnvFile(outputPath, getFrontendEnv(env));
console.log(`Wrote ${outputPath}`);

runCommand('npm', ['run', 'build'], { dryRun });
runCommand('npx', ['firebase-tools', 'deploy', '--project', projectId, '--only', 'hosting'], { dryRun });
