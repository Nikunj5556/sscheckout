export default async function handler(req, res) {
  const shop = req.query.shop;

  console.log('=== Auth Request ===');
  console.log('Shop:', shop);
  console.log('Full URL:', req.url);
  console.log('Query:', req.query);

  // Validate shop parameter
  if (!shop) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error - Missing Shop</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
          }
          .error-box {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 500px;
          }
          h1 { color: #f44336; }
          code {
            background: #f5f5f5;
            padding: 0.5rem;
            border-radius: 4px;
            display: block;
            margin: 1rem 0;
          }
        </style>
      </head>
      <body>
        <div class="error-box">
          <h1>❌ Missing Shop Parameter</h1>
          <p>The shop parameter is required for authentication.</p>
          <code>Example: /api/auth?shop=your-store.myshopify.com</code>
        </div>
      </body>
      </html>
    `);
  }

  // Validate shop format
  const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/;
  if (!shopRegex.test(shop)) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error - Invalid Shop</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
          }
          .error-box {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 500px;
          }
          h1 { color: #f44336; }
        </style>
      </head>
      <body>
        <div class="error-box">
          <h1>❌ Invalid Shop Format</h1>
          <p>Shop must be in format: <code>your-store.myshopify.com</code></p>
          <p>You provided: <code>${shop}</code></p>
        </div>
      </body>
      </html>
    `);
  }

  // Get environment variables
  const apiKey = process.env.SHOPIFY_API_KEY;
  const scopes = process.env.SCOPES || 'read_products,write_orders,read_discounts';
  const baseUrl = process.env.BASE_URL || 'https://sscheckout.vercel.app';
  const redirectUri = `${baseUrl}/api/auth-callback`;

  // Check for required env vars
  if (!apiKey) {
    console.error('❌ Missing SHOPIFY_API_KEY environment variable');
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Configuration Error</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
          }
          .error-box {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 500px;
          }
          h1 { color: #f44336; }
        </style>
      </head>
      <body>
        <div class="error-box">
          <h1>⚙️ Configuration Error</h1>
          <p>SHOPIFY_API_KEY is not configured in environment variables.</p>
          <p>Please add it in Vercel dashboard.</p>
        </div>
      </body>
      </html>
    `);
  }

  // Build OAuth URL
  const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${apiKey}&scope=${scopes}&redirect_uri=${redirectUri}`;

  console.log('✅ Redirecting to Shopify OAuth');
  console.log('Install URL:', installUrl);

  // Redirect to Shopify OAuth
  return res.redirect(302, installUrl);
}
