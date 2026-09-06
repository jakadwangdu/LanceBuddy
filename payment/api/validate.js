#!/usr/bin/env node
/**
 * LanceBuddy Payments - Environment Validator
 *
 * Run: node validate.js
 *
 * Checks that the payment system is properly configured.
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

const cwd = process.cwd();
let issues = 0;
let warnings = 0;

function ok(msg) {
  console.log('  [PASS] ' + msg);
}
function bad(msg) {
  console.log('  [FAIL] ' + msg);
  issues++;
}
function warn(msg) {
  console.log('  [WARN] ' + msg);
  warnings++;
}

function shCapture(cmd) {
  try {
    return execSync(cmd, {
      cwd,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch (e) {
    return null;
  }
}

function main() {
  console.log('\n  LanceBuddy Payments - Environment Check\n');

  // 1. Check wrangler.toml
  console.log('  -- wrangler.toml --');

  let toml;
  try {
    toml = readFileSync(cwd + '/wrangler.toml', 'utf8');
    ok('wrangler.toml found');
  } catch (e) {
    bad('wrangler.toml not found');
    console.log('\n  Cannot proceed without wrangler.toml');
    process.exit(1);
  }

  if (/database_id\s*=\s*"REPLACE_WITH_D1_DATABASE_ID"/.test(toml)) {
    bad('database_id still has placeholder - run setup first');
  } else if (/database_id\s*=\s*"[a-f0-9-]+"/.test(toml)) {
    ok('database_id configured');
  } else {
    bad('database_id missing or invalid');
  }

  if (/CHECKOUT_MERCHANT_ID\s*=\s*""/.test(toml)) {
    bad('CHECKOUT_MERCHANT_ID is empty - checkout will be disabled');
  } else if (/CHECKOUT_MERCHANT_ID\s*=\s*"mer_/.test(toml)) {
    ok('CHECKOUT_MERCHANT_ID configured');
  } else {
    bad('CHECKOUT_MERCHANT_ID missing or invalid');
  }

  if (/PUBLIC_BASE_URL\s*=\s*"https?:\/\/.+"/.test(toml)) {
    ok('PUBLIC_BASE_URL configured');
  } else {
    bad('PUBLIC_BASE_URL missing or invalid');
  }

  if (/API_BASE_URL\s*=\s*"https?:\/\/.+"/.test(toml)) {
    ok('API_BASE_URL configured');
  } else {
    warn('API_BASE_URL not set - using default');
  }

  if (/ALLOWED_ORIGINS\s*=/.test(toml)) {
    ok('ALLOWED_ORIGINS configured');
  } else {
    bad('ALLOWED_ORIGINS missing');
  }

  // 2. Check Cloudflare auth
  console.log('\n  -- Cloudflare --');
  const whoami = shCapture('npx wrangler whoami 2>&1 || true');
  if (whoami && whoami.indexOf('not authenticated') === -1) {
    ok('Authenticated with Cloudflare');
  } else {
    bad('Not authenticated - run: wrangler login');
  }

  // 3. Check D1 database
  console.log('\n  -- D1 Database --');
  const d1List = shCapture('npx wrangler d1 list 2>&1 || true');
  if (d1List && d1List.indexOf('lancebuddy-payments') !== -1) {
    ok('Database "lancebuddy-payments" exists');
  } else {
    bad('Database "lancebuddy-payments" not found - run setup');
  }

  // 4. Extract API URL for live tests
  const apiMatch = toml.match(/API_BASE_URL\s*=\s*"([^"]+)"/);
  const apiUrl = apiMatch ? apiMatch[1] : 'https://lancebuddy-upi-api.workers.dev';

  // 5. Live API tests
  console.log('\n  -- Live API Tests --');

  const health = shCapture('curl -s "' + apiUrl + '/api/health" 2>&1 || true');
  if (health && health.indexOf('lancebuddy-upi-api') !== -1) {
    ok('Health endpoint responding');
  } else {
    bad('Health endpoint not responding - is the worker deployed?');
  }

  const checkout = shCapture(
    'curl -s -X POST "' + apiUrl + '/api/checkout" -H "Content-Type: application/json" -d "{\\"plan\\":\\"premium_monthly\\"}" 2>&1 || true'
  );
  if (checkout && checkout.indexOf('paymentUrl') !== -1) {
    ok('Checkout endpoint working - payments ready!');
  } else if (checkout && checkout.indexOf('checkout_disabled') !== -1) {
    bad('Checkout disabled - CHECKOUT_MERCHANT_ID not configured');
  } else {
    warn('Checkout response: ' + (checkout ? checkout.slice(0, 100) : 'no response'));
  }

  // Summary
  console.log('\n  -- Summary --');
  if (issues === 0) {
    console.log('\n  All checks passed! Your payment system is ready.');
  } else {
    console.log('\n  ' + issues + ' issue(s) found. Fix them above to enable payments.');
  }
  if (warnings > 0) {
    console.log('  ' + warnings + ' warning(s) - non-critical but worth addressing.');
  }
  console.log('');
  process.exit(issues > 0 ? 1 : 0);
}

main();
