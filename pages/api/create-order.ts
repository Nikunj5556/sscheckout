// pages/api/create-order.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { razorpay } from "@/utils/razorpay";

type CreateOrderBody = {
  amountPaise: number; // e.g. 179800 for ₹1798
  receipt: string;     // your internal ID e.g. SS173...
  notes?: Record<string, string>;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const { amountPaise, receipt, notes } = req.body as CreateOrderBody;

    if (!amountPaise || !receipt) {
      return res.status(400).json({ error: "amountPaise and receipt are required" });
    }

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt,
      notes,
      payment_capture: 1
    });

    // Return only the fields the client needs
    return res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt
    });
  } catch (error: any) {
    console.error("create-order error:", error?.message || error);
    return res.status(500).json({ error: "Order creation failed" });
  }
}
