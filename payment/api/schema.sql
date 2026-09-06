-- LanceBuddy UPI Payment Gateway - D1 (SQLite) schema
-- Apply: wrangler d1 execute lancebuddy-payments --local --file=./schema.sql

DROP TABLE IF EXISTS webhook_deliveries;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS merchants;

CREATE TABLE merchants (
  id                 TEXT PRIMARY KEY,
  upi_id             TEXT NOT NULL,
  display_name       TEXT,
  logo_url           TEXT,
  webhook_url        TEXT,
  notification_email TEXT,
  api_key_hash       TEXT UNIQUE NOT NULL,
  api_key_prefix     TEXT NOT NULL,
  created_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

CREATE TABLE orders (
  id          TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  amount      REAL NOT NULL,
  currency    TEXT NOT NULL DEFAULT 'INR',
  note        TEXT,
  status      TEXT NOT NULL DEFAULT 'CREATED',
  expires_at  TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  verified_at TEXT,
  client_hash TEXT,
  CHECK (status IN ('CREATED','PENDING','VERIFIED','REJECTED','EXPIRED'))
);

CREATE INDEX idx_orders_merchant ON orders(merchant_id, created_at DESC);
CREATE INDEX idx_orders_status   ON orders(status);
CREATE INDEX idx_orders_client   ON orders(client_hash, created_at DESC);

CREATE TABLE transactions (
  id             TEXT PRIMARY KEY,
  order_id       TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  utr            TEXT NOT NULL,
  customer_name  TEXT,
  customer_email TEXT,
  submitted_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  verified_at    TEXT,
  UNIQUE (order_id, utr)
);

CREATE INDEX idx_tx_order ON transactions(order_id);
CREATE INDEX idx_tx_utr   ON transactions(utr);

CREATE TABLE webhook_deliveries (
  id           TEXT PRIMARY KEY,
  merchant_id  TEXT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  order_id     TEXT,
  event        TEXT NOT NULL,
  url          TEXT NOT NULL,
  payload      TEXT NOT NULL,
  attempts     INTEGER NOT NULL DEFAULT 0,
  status_code  INTEGER,
  delivered    INTEGER NOT NULL DEFAULT 0,
  last_error   TEXT,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at   TEXT
);

CREATE INDEX idx_wh_merchant ON webhook_deliveries(merchant_id, created_at DESC);
