const rateLimit = new Map();

function readJson(req) {
  if (req.body && typeof req.body === "object") return Promise.resolve(req.body);
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 20_000) {
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

function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  return String(Array.isArray(forwarded) ? forwarded[0] : forwarded || req.socket?.remoteAddress || "unknown")
    .split(",")[0]
    .trim();
}

function limited(req) {
  const ip = clientIp(req);
  const now = Date.now();
  const hit = rateLimit.get(ip) || { count: 0, reset: now + 10 * 60 * 1000 };
  if (now > hit.reset) {
    hit.count = 0;
    hit.reset = now + 10 * 60 * 1000;
  }
  hit.count += 1;
  rateLimit.set(ip, hit);
  return hit.count > 5;
}

function text(value, max = 1200) {
  return String(value || "").trim().slice(0, max);
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function sendEmail({ subject, html, replyTo }) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.BSD_EMAIL_TO || "brandonstlewis73@gmail.com";
  const from = process.env.BSD_EMAIL_FROM || "BSD Website <onboarding@resend.dev>";
  if (!apiKey) return { configured: false };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html, reply_to: replyTo }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Email send failed");
  }

  return { configured: true };
}

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  if (limited(req)) {
    res.statusCode = 429;
    res.end(JSON.stringify({ error: "Too many requests" }));
    return;
  }

  try {
    const body = await readJson(req);
    if (text(body.website_url)) {
      res.statusCode = 202;
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    const name = text(body.name, 120);
    const email = text(body.email, 160);
    const business = text(body.business, 180);
    const service = text(body.service, 180);
    const budget = text(body.budget, 120);
    const timeline = text(body.timeline, 120);
    const message = text(body.message, 2200);
    const phone = text(body.phone, 80);

    if (!name || !validEmail(email) || !business || !service || !budget || !timeline || !message) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: "Missing required fields" }));
      return;
    }

    const html = `
      <h1>New BSD project request</h1>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(phone || "Not provided")}</p>
      <p><strong>Business:</strong> ${escapeHtml(business)}</p>
      <p><strong>Service:</strong> ${escapeHtml(service)}</p>
      <p><strong>Budget:</strong> ${escapeHtml(budget)}</p>
      <p><strong>Timeline:</strong> ${escapeHtml(timeline)}</p>
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
    `;

    const result = await sendEmail({ subject: `New BSD lead: ${service}`, html, replyTo: email });
    res.statusCode = result.configured ? 200 : 202;
    res.end(JSON.stringify({ ok: true, emailConfigured: result.configured }));
  } catch (error) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Submission failed" }));
  }
};
