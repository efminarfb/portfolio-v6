// POST /api/lead — stores a portfolio enquiry in Supabase (table: portfolio_leads).
// Optional: the browser posts straight to Supabase if this route is absent.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ALLOWED_ORIGINS = [
  "https://portfolio-v6.vercel.app",
  "https://efminarfb.github.io",
];

const hits = new Map();
const WINDOW = 10 * 60 * 1000;
const MAX = 5;

function throttled(ip) {
  if (!ip) return false;
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < WINDOW);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 500) {
    for (const [key, times] of hits) {
      if (!times.some((t) => now - t < WINDOW)) hits.delete(key);
    }
  }
  return list.length > MAX;
}

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || "";
  const allow = ALLOWED_ORIGINS.indexOf(origin) >= 0 ? origin : ALLOWED_ORIGINS[0];

  res.setHeader("Access-Control-Allow-Origin", allow);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ ok: false, error: "Use POST." }); return; }
  if (!SUPABASE_URL || !SERVICE_KEY) {
    res.status(500).json({ ok: false, error: "The backend is not configured yet." });
    return;
  }

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  const str = (v, n) => (typeof v === "string" ? v.trim().slice(0, n) : "");
  const lead = {
    name: str(body.name, 120),
    email: str(body.email, 200),
    business: str(body.business, 160),
    budget: str(body.budget, 60),
    message: str(body.message, 4000),
    page: str(body.page, 120) || "/",
    source: "portfolio-v6",
    user_agent: str(req.headers["user-agent"], 300),
  };

  if (!lead.name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(lead.email)) {
    res.status(400).json({ ok: false, error: "A name and a valid email are required." });
    return;
  }
  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  if (throttled(ip)) { res.status(429).json({ ok: false, error: "Too many enquiries. Try later." }); return; }
  lead.ip = ip;

  try {
    const r = await fetch(SUPABASE_URL + "/rest/v1/portfolio_leads", {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: "Bearer " + SERVICE_KEY,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(lead),
    });
    if (!r.ok) {
      console.error("lead: supabase", r.status, await r.text());
      res.status(502).json({ ok: false, error: "Could not store the enquiry." });
      return;
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("lead: request failed", err);
    res.status(502).json({ ok: false, error: "Could not store the enquiry." });
  }
};
