// pages/api/store-order.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supabase";

type OrderItem = {
  product_title: string;
  variant?: string | null;
  quantity: number;
  price: number; // extended price for line (qty * unit)
};

type StoreOrderBody = {
  order_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;

  payment_method: "COD" | "Online";
  payment_status: "Paid" | "Pending" | "Failed";

  subtotal: number;
  discount: number;
  total_amount: number;

  delivery_status: string; // e.g., "pending"
  order_progress: number;  // e.g., 1

  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    state: string;
    postal_code: string;
  };

  items: OrderItem[];
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const body = req.body as StoreOrderBody;

    // Basic validation
    if (!body.order_id || !body.razorpay_payment_id || !body.customer?.email) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Insert order (parent)
    const { error: orderError } = await supabase.from("orders").insert([
      {
        order_id: body.order_id,
        customer_name: body.customer.name,
        email: body.customer.email,
        phone: body.customer.phone,
        address: body.customer.address,
        state: body.customer.state,
        postal_code: body.customer.postal_code,
        payment_method: body.payment_method,
        payment_status: body.payment_status,
        razorpay_order_id: body.razorpay_order_id,
        razorpay_payment_id: body.razorpay_payment_id,
        subtotal: body.subtotal,
        discount: body.discount,
        total_amount: body.total_amount,
        delivery_status: body.delivery_status,
        order_progress: body.order_progress
      }
    ]);

    if (orderError) {
      console.error("store-order parent insert error:", orderError);
      return res.status(500).json({ error: "Failed to insert order" });
    }

    // Insert order items (children)
    const itemsPayload = body.items.map((item) => ({
      order_id: body.order_id,
      product_title: item.product_title,
      variant: item.variant || null,
      quantity: item.quantity,
      price: item.price
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(itemsPayload);

    if (itemsError) {
      console.error("store-order items insert error:", itemsError);
      // Optionally: rollback parent or mark with an error flag
      return res.status(500).json({ error: "Failed to insert order items" });
    }

    return res.status(200).json({ ok: true });
  } catch (error: any) {
    console.error("store-order error:", error?.message || error);
    return res.status(500).json({ error: "Store order failed" });
  }
}
