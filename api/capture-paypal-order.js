function paypalBaseUrl() {
  return process.env.PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

function readJson(req) {
  if (req.body && typeof req.body === "object") return Promise.resolve(req.body);
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 5000) {
        req.destroy();
        reject(new Error("Request too large"));
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

async function accessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret) throw new Error("PayPal is not configured");

  const response = await fetch(`${paypalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) throw new Error("PayPal auth failed");
  const data = await response.json();
  return data.access_token;
}

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  try {
    const body = await readJson(req);
    const orderId = String(body.orderId || "").trim();
    if (!/^[A-Z0-9-]{6,80}$/i.test(orderId)) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: "Invalid order ID" }));
      return;
    }

    const token = await accessToken();
    const response = await fetch(`${paypalBaseUrl()}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    if (!response.ok || data.status !== "COMPLETED") {
      res.statusCode = 502;
      res.end(JSON.stringify({ error: "PayPal capture failed" }));
      return;
    }

    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true, status: data.status, id: data.id }));
  } catch {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "PayPal unavailable" }));
  }
};
