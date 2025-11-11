export default async function handler(req, res) {
  const shop = req.query.shop;
  if (!shop) {
    return res.status(400).send("Missing ?shop parameter");
  }

  const redirectUri = `${process.env.BASE_URL}/api/auth-callback`;
  const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_API_KEY}&scope=${process.env.SCOPES}&redirect_uri=${redirectUri}`;

  return res.redirect(installUrl);
}
