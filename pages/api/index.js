// server.js
const path = require("path");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");
const fetch = require("node-fetch");
const Razorpay = require("razorpay");
const serverless = require("serverless-http");
require("dotenv").config();

const app = express();

// ---------- Config & safety ----------
const {
  SHOPIFY_STORE,
  SHOPIFY_ACCESS_TOKEN,
  RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET,
  PORT = 8787,
  FRONTEND_ORIGINS = "*",
  SHOPIFY_API_KEY,
  SHOPIFY_API_SECRET,
  BASE_URL = "https://sscheckout.vercel.app",
} = process.env;

if (!SHOPIFY_STORE || !RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.warn(
    "⚠️ Missing required env vars. Make sure you set SHOPIFY_STORE, SHOPIFY_ACCESS_TOKEN (after OAuth), RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET"
  );
}

// ---------- Middleware ----------
app.use(helmet());
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (FRONTEND_ORIGINS === "*" || FRONTEND_ORIGINS.split(",").includes(origin))
        return cb(null, true);
      cb(new Error("CORS not allowed"));
    },
  })
);

// ---------- Rate limit ----------
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: "Too many requests. Try again later." },
});
app.use("/api/", limiter);

// ---------- Razorpay ----------
const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

// ---------- Shopify Helper ----------
async function shopifyRequest(path, options = {}) {
  const url = `https://${SHOPIFY_STORE}${path}`;
  const opts = {
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
    },
    ...options,
  };
  const res = await fetch(url, opts);
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

// ---------- Routes ----------

// Serve checkout.html as homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "checkout.html"));
});

// Health check
app.get("/api/health", (req, res) => res.json({ ok: true, ts: Date.now() }));

// Shopify OAuth Step 1: Redirect
app.get("/auth", (req, res) => {
  const shop = req.query.shop;
  const redirectUri = `${BASE_URL}/auth/callback`;
  const scopes = "read_products,write_orders,read_discounts";
  const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=${scopes}&redirect_uri=${redirectUri}`;
  res.redirect(installUrl);
});

// Shopify OAuth Step 2: Callback
app.get("/auth/callback", async (req, res) => {
  const { shop, code } = req.query;
  try {
    const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: SHOPIFY_API_KEY,
        client_secret: SHOPIFY_API_SECRET,
        code,
      }),
    });
    const data = await response.json();
    console.log("✅ ACCESS TOKEN:", data.access_token);
    res.send(
      "<h2>✅ App installed successfully! Check your Vercel logs for your Admin API access token.</h2>"
    );
  } catch (err) {
    console.error(err);
    res.status(500).send("Error during OAuth callback");
  }
});

// Razorpay Order
app.post("/api/create-razorpay-order", async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || Number(amount) <= 0)
      return res.status(400).json({ message: "Invalid amount" });

    const order = await razorpay.orders.create({
      amount: Number(amount),
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    });

    return res.json({ success: true, order, key_id: RAZORPAY_KEY_ID });
  } catch (err) {
    console.error("create-razorpay-order error", err);
    return res
      .status(500)
      .json({ message: err.message || "Razorpay order creation failed" });
  }
});

// Create Shopify order after Razorpay success
app.post("/api/verify-payment", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      checkoutData,
    } = req.body;
    const hmac = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (hmac !== razorpay_signature)
      return res.status(400).json({ message: "Invalid Razorpay signature" });

    const cart = checkoutData?.cart || { items: [] };
    const items = (cart.items || []).map((i) => ({
      variant_id: i.variant_id || i.id,
      quantity: i.quantity || 1,
    }));

    const orderPayload = {
      order: {
        email: checkoutData.email || "",
        line_items: items,
        financial_status: "paid",
      },
    };

    const shopResp = await shopifyRequest("/admin/api/2025-01/orders.json", {
      method: "POST",
      body: JSON.stringify(orderPayload),
    });

    if (!shopResp.ok)
      return res
        .status(500)
        .json({ message: "Shopify order creation failed", details: shopResp });

    return res.json({ success: true, order: shopResp.json.order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "verify-payment failed" });
  }
});

// ---------- Local run ----------
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

// ---------- Export for Vercel ----------
export default serverless(app);

