# LanceBuddy UPI Payment Gateway

Self-hosted UPI QR payment page with UTR-based verification. No payment aggregator needed.

```
payment/
  index.html        Customer payment page (QR, UPI link, UTR form, live status)
  dashboard.html    Merchant dashboard (orders, approve/reject payments)
  setup.js          One-command setup wizard (NEW)
  validate.js       Configuration checker (NEW)
  api/              Cloudflare Worker + D1 backend
    src/
      index.js          Router
      lib/              http, crypto (HMAC), validate, auth, notify, upi
      routes/           merchants, orders, payments
    schema.sql
    wrangler.toml
```

## Quick Start (1 minute)

```bash
cd payment/api

# 1. Login to Cloudflare (first time only)
npx wrangler login

# 2. Run the setup wizard
node setup.js
```

The wizard will ask for your UPI ID and handle everything else automatically.

## Manual Setup

```bash
cd payment/api

# 1. Create D1 database
npx wrangler d1 create lancebuddy-payments
# Copy the database_id into wrangler.toml

# 2. Apply schema
npx wrangler d1 execute lancebuddy-payments --file=schema.sql --remote

# 3. Set signing secret
wrangler secret put SIGNING_SECRET

# 4. Edit wrangler.toml: set DEFAULT_UPI_ID to your UPI ID

# 5. Deploy
npx wrangler deploy
```

## Configuration

### Required
- `DEFAULT_UPI_ID` — Your UPI ID (e.g. `yourname@paytm`). The system auto-creates a merchant on first checkout.

### Optional
- `DEFAULT_DISPLAY_NAME` — Name shown on payment page (default: "LanceBuddy")
- `DEFAULT_NOTIFICATION_EMAIL` — Email for payment alerts
- `RESEND_API_KEY` — Set via `wrangler secret put RESEND_API_KEY` for email notifications

### Advanced (optional)
- `CHECKOUT_MERCHANT_ID` — Set this instead of `DEFAULT_UPI_ID` if you created a merchant via the dashboard

## Verify Setup

```bash
node validate.js
```

## Payment Flow

1. User clicks "Upgrade to Premium" on lancebuddy.in
2. Your server creates an order and returns a signed payment URL
3. User is redirected to `payment/index.html?orderId=X&sig=Y`
4. Payment page shows QR code + UPI deep link
5. User pays via any UPI app and submits the 12-digit UTR
6. You review and approve/reject in the dashboard
7. User sees live status updates on the payment page

## Dashboard

Open `payment/dashboard.html` after payment is configured to:
- View all orders
- Approve or reject payments
- Generate manual payment links
