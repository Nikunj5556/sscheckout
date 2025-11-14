// pages/api/verify-payment.ts
import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";

type VerifyBody = {
  orderId: string;    // response.razorpay_order_id
  paymentId: string;  // response.razorpay_payment_id
  signature: string;  // response.razorpay_signature
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const { orderId, paymentId, signature } = req.body as VerifyBody;

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ error: "Missing verification params" });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(`${orderId}|${paymentId}`);
    const expectedSignature = hmac.digest("hex");

    const valid = expectedSignature === signature;
    return res.status(200).json({ valid });
  } catch (error: any) {
    console.error("verify-payment error:", error?.message || error);
    return res.status(500).json({ error: "Verification failed" });
  }
}
