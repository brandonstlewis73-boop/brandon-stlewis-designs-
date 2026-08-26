const PACKAGES = {
  starter: { name: "Starter Design Package", amount: "95.00" },
  brand: { name: "Brand Identity Package", amount: "275.00" },
  premium: { name: "Website / Premium Build", amount: "650.00" },
  social: { name: "Social Media Management", amount: "220.00" },
};

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
    const plan = PACKAGES[String(body.packageId || "")];
    if (!plan) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: "Invalid package" }));
      return;
    }

    const token = await accessToken();
    const currency = process.env.PAYPAL_CURRENCY || "USD";
    const response = await fetch(`${paypalBaseUrl()}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            description: plan.name,
            amount: {
              currency_code: currency,
              value: plan.amount,
            },
          },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      res.statusCode = 502;
      res.end(JSON.stringify({ error: "PayPal order creation failed" }));
      return;
    }

    res.statusCode = 200;
    res.end(JSON.stringify({ id: data.id }));
  } catch {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "PayPal unavailable" }));
  }
};
