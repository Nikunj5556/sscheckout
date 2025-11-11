export default async function handler(req, res) {
  const { shop, code, hmac } = req.query;

  console.log('=== Auth Callback ===');
  console.log('Shop:', shop);
  console.log('Code:', code ? 'Present' : 'Missing');
  console.log('HMAC:', hmac ? 'Present' : 'Missing');

  if (!shop || !code) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Authentication Error</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: #f44336;
            margin: 0;
            color: white;
          }
          .error-box {
            background: rgba(255,255,255,0.1);
            padding: 2rem;
            border-radius: 12px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="error-box">
          <h1>❌ Authentication Failed</h1>
          <p>Missing required parameters (shop or code)</p>
        </div>
      </body>
      </html>
    `);
  }

  try {
    const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_API_KEY,
        client_secret: process.env.SHOPIFY_API_SECRET,
        code,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Log the access token
    console.log('=================================');
    console.log('✅ ACCESS TOKEN:', data.access_token);
    console.log('🔑 Shop:', shop);
    console.log('📋 Scopes:', data.scope);
    console.log('=================================');
    console.log('⚠️  IMPORTANT: Copy the access token above and add it to Vercel environment variables as SHOPIFY_ACCESS_TOKEN');
    console.log('=================================');

    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>App Installed Successfully</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
          }
          .container {
            background: white;
            padding: 3rem;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 600px;
            text-align: center;
          }
          .status { font-size: 5rem; margin-bottom: 1rem; }
          h1 { color: #11998e; margin-bottom: 1rem; }
          .alert {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 1rem;
            margin: 2rem 0;
            text-align: left;
            border-radius: 4px;
          }
          .token-box {
            background: #f5f5f5;
            padding: 1rem;
            border-radius: 4px;
            word-break: break-all;
            font-family: monospace;
            margin: 1rem 0;
          }
          .btn {
            display: inline-block;
            padding: 12px 24px;
            background: #11998e;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin-top: 1rem;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="status">✅</div>
          <h1>App Installed Successfully!</h1>
          <p><strong>Store:</strong> ${shop}</p>
          
          <div class="alert">
            <strong>⚠️ IMPORTANT - Next Steps:</strong>
            <ol style="margin: 1rem 0; padding-left: 1.5rem;">
              <li>Check your Vercel deployment logs</li>
              <li>Copy the access token that starts with <code>shpat_</code></li>
              <li>Add it to Vercel environment variables as <code>SHOPIFY_ACCESS_TOKEN</code></li>
              <li>Redeploy your app</li>
            </ol>
          </div>

          <p style="color: #666; margin-top: 2rem;">
            After adding the token, your checkout will be ready to process orders.
          </p>

          <a href="https://vercel.com/dashboard" class="btn" target="_blank">
            Open Vercel Dashboard
          </a>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('❌ OAuth token exchange failed:', error);
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Authentication Error</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: #f44336;
            margin: 0;
            color: white;
          }
        </style>
      </head>
      <body>
        <div style="text-align: center;">
          <h1>❌ Authentication Failed</h1>
          <p>${error.message}</p>
        </div>
      </body>
      </html>
    `);
  }
}
