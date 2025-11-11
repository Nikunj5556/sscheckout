export default async function handler(req, res) {
  const shop = req.query.shop;

  if (!shop) {
    return res.status(400).send("Missing ?shop parameter");
  }

  const redirectUri = `${process.env.BASE_URL}/api/auth-callback`;
  const scopes = process.env.SCOPES || 'read_products,write_orders,read_discounts';
  
  const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_API_KEY}&scope=${scopes}&redirect_uri=${redirectUri}`;
  
  return res.redirect(installUrl);
}
