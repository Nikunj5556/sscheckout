export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/html');
  return res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>SSCheckout - Connected</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
          background: white;
          padding: 3rem;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          text-align: center;
        }
        h1 { color: #333; margin-bottom: 1rem; }
        .status { font-size: 4rem; margin-bottom: 1rem; }
        p { color: #666; line-height: 1.6; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="status">✅</div>
        <h1>SSCheckout is Connected!</h1>
        <p>Your custom Shopify checkout app is successfully deployed.</p>
        <p><strong>Store:</strong> ${process.env.SHOPIFY_STORE || 'Not configured'}</p>
      </div>
    </body>
    </html>
  `);
}
