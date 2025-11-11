export default async function handler(req, res) {
  const { shop, code } = req.query;

  if (!shop || !code) {
    return res.status(400).send("Missing shop or code parameter");
  }

  try {
    const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_API_KEY,
        client_secret: process.env.SHOPIFY_API_SECRET,
        code,
      }),
    });

    const data = await response.json();
    
    // Log the access token for the developer to copy
    console.log("✅ ACCESS TOKEN:", data.access_token);
    console.log("🔑 Shop:", shop);
    console.log("📋 Copy this token to your Vercel environment as SHOPIFY_ACCESS_TOKEN");

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
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            max-width: 600px;
          }
          h1 { color: #11998e; margin-bottom: 1rem; }
          .status { font-size: 4rem; text-align: center; margin-bottom: 1rem; }
          code {
            background: #f4f4f4;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            display: block;
            margin: 1rem 0;
            word-break: break-all;
          }
          .alert {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 1rem;
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
            <strong>⚠️ Important:</strong> Check your Vercel deployment logs for the access token. 
            Add it to your Vercel environment variables as <code>SHOPIFY_ACCESS_TOKEN</code> and redeploy.
          </div>
          <p style="margin-top: 2rem; color: #666;">
            After adding the token, your checkout will be ready to process orders.
          </p>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error("❌ OAuth error:", error);
    return res.status(500).send(`Authentication failed: ${error.message}`);
  }
}
