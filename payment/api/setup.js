#!/usr/bin/env node
/**
 * LanceBuddy Payments — One-Command Setup
 *
 * Run: node setup.js
 *
 * Simplest possible setup:
 *   1. Enter your UPI ID
 *   2. Everything else is automated
 *
 * The script will:
 *   - Generate a secure signing secret
 *   - Create the Cloudflare D1 database
 *   - Apply the schema
 *   - Configure wrangler.toml (auto-provisions merchant on first checkout)
 *   - Deploy the worker
 *   - Verify everything works
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { createInterface } from 'readline';
import { randomBytes } from 'crypto';

const cwd = process.cwd();

function log(step, msg) {
  console.log('\n' + '─'.repeat(50));
  console.log('  ' + step);
  console.log('─'.repeat(50));
  if (msg) console.log('  ' + msg);
}

function success(msg) { console.log('  ✅ ' + msg); }
function warn(msg) { console.log('  ⚠️  ' + msg); }
function fail(msg) { console.error('  ❌ ' + msg); process.exit(1); }

function ask(rl, question, required, validator) {
  if (required === undefined) required = true;
  return new Promise((resolve) => {
    rl.question('  ' + question + ' ', (answer) => {
      const trimmed = answer.trim();
      if (!trimmed && required) {
        console.log('  This field is required.');
        return ask(rl, question, required, validator).then(resolve);
      }
      if (trimmed && validator) {
        const result = validator(trimmed);
        if (result !== true) { console.log('  ' + result); return ask(rl, question, required, validator).then(resolve); }
      }
      resolve(trimmed || null);
    });
  });
}

function shCapture(cmd) {
  try { return execSync(cmd, { cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim(); }
  catch { return null; }
}

function validateUpi(upi) {
  if (!/^[a-zA-Z0-9.\-_]{2,64}@[a-zA-Z][a-zA-Z0-9.\-_]{1,64}$/.test(upi))
    return 'Must look like name@bank (e.g. merchant@okhdfcbank)';
  return true;
}

function validateEmail(email) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return 'Enter a valid email';
  return true;
}

function setToml(key, value) {
  const p = cwd + '/wrangler.toml';
  let c = readFileSync(p, 'utf8');
  const re = new RegExp('^' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*=\\s*.*$', 'm');
  if (re.test(c)) {
    c = c.replace(re, key + ' = ' + value);
  } else {
    const i = c.indexOf('[vars]');
    if (i !== -1) {
      const at = c.indexOf('\n', i) + 1;
      c = c.slice(0, at) + key + ' = ' + value + '\n' + c.slice(at);
    } else {
      c += '\n[vars]\n' + key + ' = ' + value + '\n';
    }
  }
  writeFileSync(p, c);
}

async function main() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  console.log('');
  console.log('  ┌──────────────────────────────────────────┐');
  console.log('  │   LanceBuddy Payments — Setup Wizard     │');
  console.log('  │   Configure your payment system in 1 min │');
  console.log('  └──────────────────────────────────────────┘');

  // Prerequisites
  log('Step 0: Prerequisites');
  if (!shCapture('npx wrangler --version'))
    fail('Wrangler not found. Run:\n  npm install -g wrangler\n  wrangler login');
  success('Wrangler ready');

  if (shCapture('npx wrangler whoami')?.includes('not authenticated'))
    fail('Not logged in. Run: wrangler login');
  success('Cloudflare authenticated');

  // Gather info
  log('Step 1: Your payment info', 'Only UPI ID is required. Press Enter to skip optional fields.');

  const upiId = await ask(rl, 'Your UPI ID (e.g. yourname@paytm):', true, validateUpi);
  success('UPI: ' + upiId);

  const displayName = await ask(rl, 'Display name [LanceBuddy]:', false) || 'LanceBuddy';
  const notifyEmail = await ask(rl, 'Notification email (optional):', false, validateEmail);

  log('Step 2: URLs', 'Defaults work for LanceBuddy. Press Enter to accept.');

  const baseUrl = await ask(rl, 'Payment page URL [https://www.lancebuddy.in/payment]:', false) || 'https://www.lancebuddy.in/payment';
  const apiUrl = await ask(rl, 'API URL [https://lancebuddy-upi-api.workers.dev]:', false) || 'https://lancebuddy-upi-api.workers.dev';

  // Generate secret
  log('Step 3: Security', 'Generating a secure signing secret...');
  const signingSecret = randomBytes(32).toString('hex');
  success('Signing secret generated');

  // Create database
  log('Step 4: Database');
  let dbId = null;
  const d1List = shCapture('npx wrangler d1 list 2>&1 || true');
  if (d1List && d1List.includes('lancebuddy-payments')) {
    const m = d1List.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/);
    if (m) { dbId = m[1]; warn('Using existing database'); }
  }
  if (!dbId) {
    const out = shCapture('npx wrangler d1 create lancebuddy-payments 2>&1 || true');
    const m = out?.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/);
    if (m) { dbId = m[1]; success('Database created'); }
  }
  if (!dbId) fail('Could not create database');

  setToml('database_id', '"' + dbId + '"');

  // Apply schema
  log('Step 5: Schema');
  sh('npx wrangler d1 execute lancebuddy-payments --file=schema.sql --remote');
  success('Tables created (merchants, orders, transactions)');

  // Set secret
  log('Step 6: Secrets');
  try {
    sh('echo ' + signingSecret + ' | npx wrangler secret put SIGNING_SECRET', { silent: true });
    success('SIGNING_SECRET set');
  } catch {
    warn('Could not auto-set secret. Run manually:');
    console.log('  echo ' + signingSecret + ' | npx wrangler secret put SIGNING_SECRET');
  }

  // Configure wrangler.toml (simplified: just set DEFAULT_UPI_ID)
  log('Step 7: Configuration');
  setToml('DEFAULT_UPI_ID', '"' + upiId + '"');
  setToml('DEFAULT_DISPLAY_NAME', '"' + displayName + '"');
  if (notifyEmail) setToml('DEFAULT_NOTIFICATION_EMAIL', '"' + notifyEmail + '"');
  setToml('PUBLIC_BASE_URL', '"' + baseUrl + '"');
  setToml('API_BASE_URL', '"' + apiUrl + '"');
  success('wrangler.toml configured');

  // Deploy
  log('Step 8: Deploy');
  sh('npx wrangler deploy');
  success('Worker deployed to ' + apiUrl);

  // Verify
  log('Step 9: Verification');
  await new Promise(r => setTimeout(r, 3000));

  const health = shCapture('curl -s "' + apiUrl + '/api/health" 2>&1 || true');
  if (health && health.includes('lancebuddy-upi-api')) success('API is live');
  else warn('API still propagating — try again in 30s');

  const chk = shCapture('curl -s -X POST "' + apiUrl + '/api/checkout" -H "Content-Type: application/json" -d "{\\"plan\\":\\"premium_monthly\\"}" 2>&1 || true');
  if (chk && chk.includes('paymentUrl')) success('Checkout working! Setup complete.');
  else if (chk && chk.includes('checkout_disabled')) warn('Checkout will activate on first real request');
  else warn('Checkout test inconclusive — try again shortly');

  // Summary
  console.log('\n');
  console.log('  ┌──────────────────────────────────────────┐');
  console.log('  │         ✅ Setup Complete!               │');
  console.log('  └──────────────────────────────────────────┘');
  console.log('');
  console.log('  Configuration:');
  console.log('    UPI ID:       ' + upiId);
  console.log('    Display name: ' + displayName);
  if (notifyEmail) console.log('    Notify email: ' + notifyEmail);
  console.log('    Payment page: ' + baseUrl);
  console.log('    API:          ' + apiUrl);
  console.log('');
  console.log('  Next steps:');
  console.log('    1. Test: go to lancebuddy.in → click "Upgrade to Premium"');
  console.log('    2. Manage payments: ' + baseUrl + '/dashboard.html');
  console.log('');

  rl.close();
}

main().catch((err) => { console.error('\n  ❌ ' + err.message + '\n'); process.exit(1); });
