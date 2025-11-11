import Razorpay from 'razorpay';
import crypto from 'crypto';

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
    const { amount } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount. Must be greater than 0.' });
    }

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Create order
    const receipt = `rcpt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const order = await razorpay.orders.create({
      amount: parseInt(amount), // amount in paise
      currency: 'INR',
      receipt,
    });

    console.log('✅ Razorpay order created:', order.id);

    return res.status(200).json({
      success: true,
      order,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('❌ Razorpay order creation error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create Razorpay order',
    });
  }
}
