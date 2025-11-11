export default async function handler(req, res) {
  const shop = req.query.shop;
  const host = req.query.host;
  const embedded = req.query.embedded;

  // Set proper headers for embedded app
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  
  // Allow Shopify to embed this page in an iframe
  if (shop) {
    res.setHeader('Content-Security-Policy', `frame-ancestors https://${shop} https://admin.shopify.com;`);
  }

  return res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SSCheckout - Connected</title>
      <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }
        
        .container {
          background: white;
          padding: 3rem 2rem;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          text-align: center;
          max-width: 600px;
          width: 100%;
          animation: slideUp 0.4s ease-out;
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .status-icon {
          font-size: 5rem;
          margin-bottom: 1rem;
          animation: bounce 0.6s ease-in-out;
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        h1 {
          color: #1a1a1a;
          font-size: 2rem;
          margin-bottom: 0.5rem;
          font-weight: 700;
        }
        
        .subtitle {
          color: #666;
          font-size: 1rem;
          margin-bottom: 2rem;
          line-height: 1.6;
        }
        
        .features {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 1.5rem;
          margin: 2rem 0;
          text-align: left;
        }
        
        .features-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 1rem;
          text-align: center;
        }
        
        .feature-item {
          display: flex;
          align-items: center;
          padding: 0.75rem 0;
          color: #333;
          font-size: 0.95rem;
        }
        
        .feature-item::before {
          content: "✓";
          display: inline-block;
          width: 24px;
          height: 24px;
          background: #4caf50;
          color: white;
          border-radius: 50%;
          text-align: center;
          line-height: 24px;
          margin-right: 12px;
          font-weight: bold;
          flex-shrink: 0;
        }
        
        .actions {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
          flex-wrap: wrap;
          justify-content: center;
        }
        
        .btn {
          flex: 1;
          min-width: 140px;
          padding: 14px 28px;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          display: inline-block;
        }
        
        .btn-primary {
          background: #667eea;
          color: white;
        }
        
        .btn-primary:hover {
          background: #5568d3;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        
        .btn-secondary {
          background: white;
          color: #667eea;
          border: 2px solid #667eea;
        }
        
        .btn-secondary:hover {
          background: #f0f3ff;
          transform: translateY(-2px);
        }
        
        .info-box {
          margin-top: 2rem;
          padding: 1rem;
          background: #e3f2fd;
          border-left: 4px solid #2196f3;
          border-radius: 4px;
          text-align: left;
          font-size: 0.875rem;
          color: #1565c0;
        }
        
        .info-box strong {
          display: block;
          margin-bottom: 0.25rem;
        }
        
        .debug-info {
          margin-top: 1.5rem;
          padding: 1rem;
          background: #f5f5f5;
          border-radius: 8px;
          font-size: 0.75rem;
          color: #666;
          text-align: left;
          font-family: 'Courier New', monospace;
        }
        
        .debug-info code {
          color: #e91e63;
        }
        
        .spinner {
          display: none;
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .loading .spinner {
          display: block;
        }
        
        @media (max-width: 600px) {
          .container {
            padding: 2rem 1.5rem;
          }
          
          h1 {
            font-size: 1.5rem;
          }
          
          .actions {
            flex-direction: column;
          }
          
          .btn {
            width: 100%;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="status-icon">✅</div>
        <h1>SSCheckout Connected</h1>
        <p class="subtitle">Your custom Shopify checkout app is successfully installed and ready to use.</p>
        
        <div class="features">
          <div class="features-title">Features</div>
          <div class="feature-item">Custom checkout with Razorpay integration</div>
          <div class="feature-item">COD (Cash on Delivery) support</div>
          <div class="feature-item">Automatic order sync to Shopify</div>
          <div class="feature-item">Real-time payment verification</div>
        </div>
        
        <div class="actions">
          <button onclick="openCheckout()" class="btn btn-primary">
            Open Checkout
          </button>
          <button onclick="viewOrders()" class="btn btn-secondary">
            View Orders
          </button>
        </div>

        <div class="info-box">
          <strong>💡 Quick Start</strong>
          Click "Open Checkout" to test the custom checkout page, or "View Orders" to see orders synced from SSCheckout.
        </div>

        <div class="debug-info" id="debug-info">
          <strong>System Status</strong><br>
          Loading app information...
        </div>
      </div>

      <script>
        // Parse URL parameters from Shopify
        const urlParams = new URLSearchParams(window.location.search);
        const shop = urlParams.get('shop') || '${shop || ''}';
        const host = urlParams.get('host') || '${host || ''}';
        const embedded = urlParams.get('embedded') || '${embedded || ''}';
        const apiKey = '${process.env.SHOPIFY_API_KEY || ''}';
        
        // Debug logging
        console.log('=== SSCheckout Debug Info ===');
        console.log('Shop:', shop);
        console.log('Host:', host);
        console.log('Embedded:', embedded);
        console.log('API Key:', apiKey ? 'Present' : 'Missing');
        console.log('Location:', window.location.href);
        console.log('In iframe:', window.self !== window.top);

        // Update debug info display
        const debugEl = document.getElementById('debug-info');
        debugEl.innerHTML = \`
          <strong>System Status</strong><br>
          <code>Shop:</code> \${shop || '<span style="color: #f44336;">Not provided</span>'}<br>
          <code>Host:</code> \${host || '<span style="color: #f44336;">Not provided</span>'}<br>
          <code>Embedded:</code> \${embedded || 'No'}<br>
          <code>Context:</code> \${window.self !== window.top ? 'Inside iframe' : 'Standalone'}<br>
          <code>API Key:</code> \${apiKey ? 'Configured ✓' : '<span style="color: #f44336;">Missing</span>'}
        \`;

        // Initialize Shopify App Bridge
        let app = null;
        
        if (typeof window['app-bridge'] !== 'undefined' && shop && host && apiKey) {
          try {
            const AppBridge = window['app-bridge'];
            const createApp = AppBridge.default;
            
            app = createApp({
              apiKey: apiKey,
              host: host,
            });

            console.log('✅ App Bridge initialized successfully');
            debugEl.innerHTML += '<br><code>App Bridge:</code> <span style="color: #4caf50;">Initialized ✓</span>';
            
            // Set up redirect action
            window.appRedirect = AppBridge.actions.Redirect.create(app);
            
          } catch (error) {
            console.error('❌ App Bridge initialization failed:', error);
            debugEl.innerHTML += '<br><code>App Bridge:</code> <span style="color: #f44336;">Error - ' + error.message + '</span>';
          }
        } else {
          const missingItems = [];
          if (!shop) missingItems.push('shop');
          if (!host) missingItems.push('host');
          if (!apiKey) missingItems.push('API key');
          
          console.warn('⚠️ App Bridge not initialized. Missing:', missingItems.join(', '));
          debugEl.innerHTML += '<br><code>App Bridge:</code> <span style="color: #ff9800;">Not initialized (missing: ' + missingItems.join(', ') + ')</span>';
        }

        // Open checkout page
        function openCheckout() {
          const checkoutUrl = 'https://sscheckout.vercel.app/checkout.html';
          
          if (app && window.appRedirect) {
            // Use App Bridge to open in new context (inside Shopify admin)
            try {
              const Redirect = window['app-bridge'].actions.Redirect;
              window.appRedirect.dispatch(Redirect.Action.REMOTE, {
                url: checkoutUrl,
                newContext: true,
              });
              console.log('✅ Opening checkout via App Bridge');
            } catch (error) {
              console.error('❌ App Bridge redirect failed:', error);
              window.open(checkoutUrl, '_blank');
            }
          } else {
            // Fallback: open in new tab
            console.log('ℹ️ Opening checkout in new tab (fallback)');
            window.open(checkoutUrl, '_blank');
          }
        }

        // View orders in Shopify admin
        function viewOrders() {
          if (app && window.appRedirect) {
            // Use App Bridge to navigate within Shopify admin
            try {
              const Redirect = window['app-bridge'].actions.Redirect;
              window.appRedirect.dispatch(Redirect.Action.ADMIN_PATH, '/orders');
              console.log('✅ Navigating to orders via App Bridge');
            } catch (error) {
              console.error('❌ App Bridge navigation failed:', error);
              if (shop) {
                window.open('https://' + shop + '/admin/orders', '_blank');
              }
            }
          } else if (shop) {
            // Fallback: open orders page directly
            console.log('ℹ️ Opening orders in new tab (fallback)');
            window.open('https://' + shop + '/admin/orders', '_blank');
          } else {
            alert('Cannot navigate to orders: Shop parameter missing');
          }
        }

        // Handle case where app is opened directly without proper context
        if (shop && !host && window.self === window.top) {
          console.log('⚠️ Missing embedded context. Redirecting to get proper parameters...');
          debugEl.innerHTML += '<br><br><span style="color: #ff9800;">⚠️ Redirecting to embedded context...</span>';
          
          // Redirect to Shopify admin to get proper embedded context
          setTimeout(() => {
            const redirectUrl = 'https://' + shop + '/admin/apps/${process.env.SHOPIFY_APP_HANDLE || 'sscheckout'}';
            window.location.href = redirectUrl;
          }, 2000);
        }

        // Log successful load
        console.log('=== SSCheckout loaded successfully ===');
      </script>
    </body>
    </html>
  `);
}
