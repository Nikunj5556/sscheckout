export default async function handler(req, res) {
  const { shop, code } = req.query;

  if (!shop || !code) {
    return res.status(400).send("Missing shop or code");
  }

  try {
    const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_API_KEY,
        client_secret: process.env.SHOPIFY_API_SECRET,
        code
      }),
    });

    const data = await response.json();
    console.log("✅ ACCESS TOKEN:", data.access_token);

    return res.send(
      "<h2>✅ App installed successfully! Check your Vercel logs for the Admin API access token.</h2>"
    );
  } catch (error) {
    console.error("❌ OAuth error:", error);
    res.status(500).send("OAuth failed: " + error.message);
  }
}
