module.exports = function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.statusCode = 200;
  res.end(
    JSON.stringify({
      enabled: Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
      clientId: process.env.PAYPAL_CLIENT_ID || "",
      currency: process.env.PAYPAL_CURRENCY || "USD",
    })
  );
};
