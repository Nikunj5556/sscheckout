export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_ORIGINS || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { checkoutData } = req.body;

    if (!checkoutData || !checkoutData.cart) {
      return res.status(400).json({ error: 'Invalid checkout data' });
    }

    // Create Shopify order for COD
    const shopifyOrderPayload = {
      order: {
        email: checkoutData.email || '',
        line_items: checkoutData.cart.items.map(item => ({
          variant_id: parseInt(item.variant_id),
          quantity: item.quantity,
        })),
        customer: {
          first_name: checkoutData.name?.split(' ')[0] || '',
          last_name: checkoutData.name?.split(' ').slice(1).join(' ') || '',
          email: checkoutData.email || '',
        },
        shipping_address: {
          first_name: checkoutData.name?.split(' ')[0] || '',
          last_name: checkoutData.name?.split(' ').slice(1).join(' ') || '',
          address1: checkoutData.shipping?.address || '',
          city: checkoutData.shipping?.city || '',
          province: checkoutData.shipping?.state || '',
          country: 'India',
          zip: checkoutData.shipping?.zip || '',
          phone: checkoutData.phone || '',
        },
        financial_status: 'pending',
        note_attributes: [
          { name: 'Payment Method', value: 'Cash on Delivery' },
        ],
        tags: 'SSCheckout, COD',
      },
    };

    const shopifyResponse = await fetch(
      `https://${process.env.SHOPIFY_STORE}/admin/api/2025-01/orders.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
        },
        body: JSON.stringify(shopifyOrderPayload),
      }
    );

    const shopifyData = await shopifyResponse.json();

    if (!shopifyResponse.ok) {
      console.error('❌ Shopify order creation failed:', shopifyData);
      return res.status(500).json({
        success: false,
        error: 'Failed to create Shopify order',
        details: shopifyData,
      });
    }

    console.log('✅ Shopify COD order created:', shopifyData.order.id);

    return res.status(200).json({
      success: true,
      shopify_order_id: shopifyData.order.id,
      order_number: shopifyData.order.order_number,
    });
  } catch (error) {
    console.error('❌ Order creation error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Order creation failed',
    });
  }
}
