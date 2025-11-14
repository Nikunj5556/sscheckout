// pages/api/verify-payment.ts
import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const { orderId, paymentId, signature } = req.body;

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ error: "Missing verification parameters" });
    }

    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!);
    hmac.update(`${orderId}|${paymentId}`);
    const expectedSignature = hmac.digest("hex");

    const valid = expectedSignature === signature;
    res.status(200).json({ valid });
  } catch (error: any) {
    console.error("Verify payment error:", error.message);
    res.status(500).json({ error: "Verification failed" });
  }
}
