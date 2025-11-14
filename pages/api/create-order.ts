// pages/api/create-order.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const { amountPaise, receipt, notes } = req.body;

    if (!amountPaise || !receipt) {
      return res.status(400).json({ error: "Missing amount or receipt" });
    }

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt,
      notes,
      payment_capture: 1
    });

    res.status(200).json({ orderId: order.id });
  } catch (error: any) {
    console.error("Create order error:", error.message);
    res.status(500).json({ error: "Order creation failed" });
  }
}
