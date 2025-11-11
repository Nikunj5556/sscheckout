export default async function handler(req, res) {
  // Log everything for debugging
  console.log('========================================');
  console.log('🔵 AUTH CALLBACK TRIGGERED');
  console.log('========================================');
  console.log('Query params:', req.query);
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  const { shop, code, hmac, timestamp } = req.query;

  console.log('Shop:', shop);
  console.log('Code:', code ? 'Present ✓' : 'Missing ✗');
  console.log('HMAC:', hmac ? 'Present ✓' : 'Missing ✗');

  // Check for required parameters
  if (!shop || !code) {
    console.error('❌ Missing required parameters');
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
            max-width: 500px;
          }
        </style>
      </head>
      <body>
        <div class="error-box">
          <h1>❌ Authentication Failed</h1>
          <p>Missing required parameters</p>
          <p>Shop: ${shop || 'Not provided'}</p>
          <p>Code: ${code ? 'Present' : 'Not provided'}</p>
        </div>
      </body>
      </html>
    `);
  }

  // Check environment variables
  const apiKey = process.env.SHOPIFY_API_KEY;
  const apiSecret = process.env.SHOPIFY_API_SECRET;

  console.log('API Key present:', apiKey ? 'Yes ✓' : 'No ✗');
  console.log('API Secret present:', apiSecret ? 'Yes ✓' : 'No ✗');

  if (!apiKey || !apiSecret) {
    console.error('❌ Missing environment variables');
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Configuration Error</title></head>
      <body>
        <h1>❌ Server Configuration Error</h1>
        <p>Missing SHOPIFY_API_KEY or SHOPIFY_API_SECRET</p>
      </body>
      </html>
    `);
  }

  try {
    console.log('🔄 Exchanging code for access token...');
    console.log('Request URL:', `https://${shop}/admin/oauth/access_token`);

    const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: apiKey,
        client_secret: apiSecret,
        code,
      }),
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    const responseText = await response.text();
    console.log('Raw response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Failed to parse response as JSON');
      throw new Error(`Invalid JSON response: ${responseText}`);
    }

    if (!response.ok) {
      console.error('❌ HTTP error:', response.status);
      console.error('Error data:', data);
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
    }

    // SUCCESS - Log the token
    console.log('========================================');
    console.log('✅✅✅ SUCCESS! ACCESS TOKEN RECEIVED ✅✅✅');
    console.log('========================================');
    console.log('ACCESS TOKEN:', data.access_token);
    console.log('Shop:', shop);
    console.log('Scope:', data.scope);
    console.log('========================================');
    console.log('📋 COPY THIS TOKEN TO VERCEL:');
    console.log(`   ${data.access_token}`);
    console.log('========================================');
    console.log('⚠️  Add as SHOPIFY_ACCESS_TOKEN in Vercel env');
    console.log('========================================');

    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>App Installed Successfully</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
          }
          .container {
            background: white;
            padding: 3rem;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 700px;
            width: 100%;
            text-align: center;
          }
          .status { font-size: 5rem; margin-bottom: 1rem; }
          h1 { color: #11998e; margin-bottom: 1rem; }
          .alert {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 1.5rem;
            margin: 2rem 0;
            text-align: left;
            border-radius: 4px;
          }
          .alert strong { display: block; margin-bottom: 0.5rem; }
          .alert ol { margin: 1rem 0; padding-left: 1.5rem; }
          .alert li { margin: 0.5rem 0; }
          .token-box {
            background: #f5f5f5;
            padding: 1rem;
            border-radius: 4px;
            word-break: break-all;
            font-family: 'Courier New', monospace;
            font-size: 0.9rem;
            margin: 1rem 0;
            border: 2px solid #11998e;
          }
          .btn {
            display: inline-block;
            padding: 14px 28px;
            background: #11998e;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            margin-top: 1rem;
            font-weight: 600;
            transition: background 0.2s;
          }
          .btn:hover {
            background: #0e8074;
          }
          code {
            background: #f5f5f5;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: monospace;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="status">✅</div>
          <h1>App Installed Successfully!</h1>
          <p style="color: #666; margin-bottom: 2rem;">
            <strong>Store:</strong> ${shop}
          </p>
          
          <div class="alert">
            <strong>⚠️ IMPORTANT - Next Steps:</strong>
            <ol>
              <li><strong>Check Vercel Logs</strong> - Your access token has been logged</li>
              <li><strong>Look for:</strong> <code>✅✅✅ SUCCESS! ACCESS TOKEN RECEIVED</code></li>
              <li><strong>Copy the token</strong> that starts with <code>shpat_</code></li>
              <li><strong>Add to Vercel:</strong>
                <ul style="margin-top: 0.5rem;">
                  <li>Go to Settings → Environment Variables</li>
                  <li>Add <code>SHOPIFY_ACCESS_TOKEN</code></li>
                  <li>Paste the token</li>
                  <li>Select all environments</li>
                </ul>
              </li>
              <li><strong>Redeploy</strong> your app</li>
            </ol>
          </div>

          <div class="token-box">
            <strong>Access Token Preview:</strong><br>
            ${data.access_token.substring(0, 15)}...${data.access_token.substring(data.access_token.length - 10)}
          </div>

          <p style="color: #666; margin-top: 2rem; font-size: 0.9rem;">
            The full token is in your Vercel logs. After adding it, your checkout will be ready to create orders in Shopify.
          </p>

          <a href="https://vercel.com/${process.env.VERCEL_PROJECT_ID || ''}" class="btn" target="_blank">
            Open Vercel Dashboard →
          </a>
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('========================================');
    console.error('❌❌❌ ERROR DURING TOKEN EXCHANGE ❌❌❌');
    console.error('========================================');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('========================================');

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
            padding: 1rem;
          }
          .error-box {
            background: rgba(255,255,255,0.1);
            padding: 2rem;
            border-radius: 12px;
            text-align: center;
            max-width: 600px;
          }
          code {
            background: rgba(0,0,0,0.2);
            padding: 0.5rem;
            border-radius: 4px;
            display: block;
            margin: 1rem 0;
            word-break: break-all;
          }
        </style>
      </head>
      <body>
        <div class="error-box">
          <h1>❌ Authentication Failed</h1>
          <p><strong>Error:</strong></p>
          <code>${error.message}</code>
          <p style="margin-top: 1rem;">Check Vercel logs for more details.</p>
        </div>
      </body>
      </html>
    `);
  }
}
