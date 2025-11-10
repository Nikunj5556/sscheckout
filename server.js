// server.js
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const fetch = require('node-fetch');
const Razorpay = require('razorpay');
const serverless = require('serverless-http');

const app = express();

// ---------- Config & safety ----------
const {
  SHOPIFY_STORE,
  SHOPIFY_ACCESS_TOKEN,
  RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET,
  PORT = 8787,
  FRONTEND_ORIGINS = '*'
} = process.env;

if (!SHOPIFY_STORE || !SHOPIFY_ACCESS_TOKEN || !RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.warn('WARNING: Required env vars are missing. Please set SHOPIFY_STORE, SHOPIFY_ACCESS_TOKEN, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET');
}

const allowedOrigins = FRONTEND_ORIGINS === '*' ? ['*'] : FRONTEND_ORIGINS.split(',').map(s => s.trim());

// Basic middleware
app.use(helmet());
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // allow server-to-server or mobile clients
    if (allowedOrigins[0] === '*' || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('CORS not allowed'));
  },
  methods: ['GET','POST','OPTIONS']
}));

// rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: 'Too many requests from this IP, please try again later.' }
});
app.use('/api/', limiter);

// Razorpay client
const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET
});

// Helper to call Shopify Admin API
async function shopifyRequest(path, options = {}) {
  const url = `https://${SHOPIFY_STORE}${path}`;
  const opts = {
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN
    },
    ...options
  };
  const res = await fetch(url, opts);
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

// ---------- API Routes ----------

// Health
app.get('/api/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

/**
 * Create Razorpay order (server side)
 * Body: { amount }  // amount in paise (integer)
 */
app.post('/api/create-razorpay-order', async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Invalid amount (must be integer paise)' });
    }

    const order = await razorpay.orders.create({
      amount: Number(amount),             // paise
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`
    });

    // return the order + public key for frontend
    return res.json({ success: true, order, key_id: RAZORPAY_KEY_ID });
  } catch (err) {
    console.error('create-razorpay-order error', err);
    return res.status(500).json({ message: err.message || 'Razorpay order creation failed' });
  }
});

/**
 * Verify payment and create Shopify order
 * Body: {
 *   razorpay_order_id,
 *   razorpay_payment_id,
 *   razorpay_signature,
 *   checkoutData  // object containing customer, shipping, checkout.cart (from /cart.js)
 * }
 */
app.post('/api/verify-payment', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, checkoutData } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing Razorpay fields' });
    }

    // verify signature
    const hmac = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
    const generated = hmac.digest('hex');
    if (generated !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid Razorpay signature' });
    }

    // (Optional) Double-check payment status via Razorpay API
    let paymentDetails = null;
    try {
      paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
    } catch (e) {
      console.warn('Could not fetch payment details from Razorpay:', e.message || e);
    }
    if (paymentDetails && paymentDetails.status && paymentDetails.status !== 'captured' && paymentDetails.status !== 'authorized' && paymentDetails.status !== 'completed') {
      // Not a blocking error — you can decide policy. We'll return error here.
      return res.status(400).json({ message: `Payment status is not successful: ${paymentDetails.status}` });
    }

    // Create Shopify order
    const cart = (checkoutData && checkoutData.cart) || { items: [], total_price: 0, items_subtotal_price: 0 };
    const items = (cart.items || []).map(i => {
      const variantId = i.variant_id || i.id || i.variant?.id;
      return {
        variant_id: variantId ? Number(variantId) : undefined,
        quantity: Number(i.quantity || 1)
      };
    }).filter(it => it.variant_id);

    const shippingAddress = {
      first_name: checkoutData.fullName || 'Customer',
      address1: checkoutData.street || '',
      city: checkoutData.city || '',
      province: checkoutData.state || '',
      zip: checkoutData.postal || '',
      country: checkoutData.country || 'India'
    };

    const orderPayload = {
      order: {
        email: checkoutData.email || '',
        line_items: items,
        financial_status: "paid",
        transactions: [
          {
            kind: "sale",
            status: "success",
            amount: ((cart.total_price || cart.items_subtotal_price || 0) / 100).toFixed(2),
            gateway: "Razorpay",
            authorization: razorpay_payment_id
          }
        ],
        shipping_address: shippingAddress,
        billing_address: shippingAddress,
        note_attributes: [
          { name: 'razorpay_order_id', value: razorpay_order_id },
          { name: 'razorpay_payment_id', value: razorpay_payment_id }
        ]
      }
    };

    const shopResp = await shopifyRequest('/admin/api/2025-01/orders.json', {
      method: 'POST',
      body: JSON.stringify(orderPayload)
    });

    if (!shopResp.ok) {
      console.error('Shopify order create failed', shopResp.status, shopResp.json);
      return res.status(500).json({ message: 'Shopify order creation failed', details: shopResp.json });
    }

    return res.json({
      success: true,
      shopify_order_id: shopResp.json.order && shopResp.json.order.id,
      shopify_order: shopResp.json.order
    });
  } catch (err) {
    console.error('verify-payment error', err);
    return res.status(500).json({ message: err.message || 'verify-payment failed' });
  }
});

/**
 * Create Shopify order for non-online payment (e.g., COD)
 * Body: { checkout, opts? }
 */
app.post('/api/create-shopify-order', async (req, res) => {
  try {
    const { checkout, opts } = req.body || {};
    const cart = (checkout && checkout.cart) || { items: [] };
    const items = (cart.items || []).map(i => ({ variant_id: Number(i.variant_id || i.id), quantity: Number(i.quantity || 1) }));

    const address = {
      first_name: checkout.fullName || 'Customer',
      address1: checkout.street || '',
      city: checkout.city || '',
      province: checkout.state || '',
      zip: checkout.postal || '',
      country: checkout.country || 'India'
    };

    const orderPayload = {
      order: {
        email: checkout.email || '',
        line_items: items,
        financial_status: "pending",
        shipping_address: address,
        billing_address: address,
        note: opts && opts.note || ''
      }
    };

    const shopResp = await shopifyRequest('/admin/api/2025-01/orders.json', {
      method: 'POST',
      body: JSON.stringify(orderPayload)
    });
    if (!shopResp.ok) return res.status(500).json({ message: 'Shopify order creation failed', details: shopResp.json });

    return res.json({ success: true, shopify_order_id: shopResp.json.order.id, shopify_order: shopResp.json.order });
  } catch (err) {
    console.error('create-shopify-order error', err);
    return res.status(500).json({ message: err.message || 'create-shopify-order failed' });
  }
});

/**
 * Fetch products (read_products)
 * Optional ?limit=50
 */
app.get('/api/products', async (req, res) => {
  try {
    const limit = Math.min(250, Number(req.query.limit) || 50);
    const shopResp = await shopifyRequest(`/admin/api/2025-01/products.json?limit=${limit}`, { method: 'GET' });
    if (!shopResp.ok) return res.status(500).json({ message: 'Failed to fetch products', details: shopResp.json });
    return res.json({ success: true, products: shopResp.json.products });
  } catch (err) {
    console.error('products error', err);
    return res.status(500).json({ message: err.message || 'products failed' });
  }
});

/**
 * Fetch discount codes (read_discount_codes)
 * This returns all price_rules and their codes (paginated naive). Use with care.
 */
app.get('/api/discounts', async (req, res) => {
  try {
    const rulesResp = await shopifyRequest('/admin/api/2025-01/price_rules.json', { method: 'GET' });
    if (!rulesResp.ok) return res.status(500).json({ message: 'Failed to fetch price rules', details: rulesResp.json });

    const priceRules = rulesResp.json.price_rules || [];
    const results = [];

    for (const rule of priceRules) {
      const codesResp = await shopifyRequest(`/admin/api/2025-01/price_rules/${rule.id}/discount_codes.json`, { method: 'GET' });
      if (codesResp.ok) {
        results.push({ price_rule: rule, discount_codes: codesResp.json.discount_codes || [] });
      } else {
        results.push({ price_rule: rule, discount_codes: [], error: codesResp.json });
      }
    }

    return res.json({ success: true, data: results });
  } catch (err) {
    console.error('discounts error', err);
    return res.status(500).json({ message: err.message || 'discounts failed' });
  }
});

// Simple OAuth callback placeholder (so Shopify app redirect URL is valid)
app.get('/auth/callback', (req, res) => {
  // Custom apps do not use OAuth, but Shopify requires a redirect URL: keep a stub here.
  res.send(`<html><body><h3>Auth callback (OK)</h3><p>This endpoint is intentionally minimal for a custom app. You can convert to public OAuth later.</p></body></html>`);
});

// ---------- Local run support ----------
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

// Export for serverless (Vercel)
module.exports = serverless(app);
