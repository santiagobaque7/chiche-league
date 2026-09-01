const SUPABASE_URL = "https://nhncljaqxhlapfsjqrql.supabase.co";
const SUPABASE_KEY = "sb_publishable_GaMB23nh1tEtytzPS2c3gA_S_4YwYr3";
const OWNER_UID = "b9a49f4d-5e26-4f0e-8892-b6b958e4a59b";

function sbHeaders(token) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${token || SUPABASE_KEY}`,
    "Content-Type": "application/json"
  };
}

async function sbFetch(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function parseResponse(r) {
  const text = await r.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = { message: text }; }
  }
  if (!r.ok) {
    const err = new Error(data?.error_description || data?.msg || data?.message || `Supabase ${r.status}`);
    err.status = r.status;
    throw err;
  }
  return data;
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  const action = String(req.query.action || "");

  try {
    if (action === "state" && req.method === "GET") {
      const leagueId = String(req.query.league_id || "clausura-2026");
      const r = await sbFetch(`${SUPABASE_URL}/rest/v1/chiche_league_state?id=eq.${encodeURIComponent(leagueId)}&select=state,updated_at`, {
        headers: sbHeaders()
      });
      const rows = await parseResponse(r);
      return res.status(200).json({ row: rows?.[0] || null });
    }

    if (action === "login" && req.method === "POST") {
      const { email, password } = req.body || {};
      if (!email || !password) return res.status(400).json({ message: "Faltan email o contraseña." });
      const r = await sbFetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: "POST", headers: sbHeaders(), body: JSON.stringify({ email, password })
      });
      const session = await parseResponse(r);
      if (session?.user?.id !== OWNER_UID) return res.status(403).json({ message: "Este usuario no es el administrador de la Chiche League." });
      return res.status(200).json(session);
    }

    if (action === "refresh" && req.method === "POST") {
      const { refresh_token } = req.body || {};
      if (!refresh_token) return res.status(400).json({ message: "Falta refresh token." });
      const r = await sbFetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: "POST", headers: sbHeaders(), body: JSON.stringify({ refresh_token })
      });
      const session = await parseResponse(r);
      if (session?.user?.id !== OWNER_UID) return res.status(403).json({ message: "Sesión no autorizada." });
      return res.status(200).json(session);
    }

    if (action === "logout" && req.method === "POST") {
      const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
      if (!token) return res.status(204).end();
      const r = await sbFetch(`${SUPABASE_URL}/auth/v1/logout`, { method: "POST", headers: sbHeaders(token) });
      if (!r.ok && r.status !== 401) await parseResponse(r);
      return res.status(204).end();
    }

    if (action === "state" && req.method === "PATCH") {
      const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
      if (!token) return res.status(401).json({ message: "Falta sesión de administrador." });
      const { league_id, state, updated_at } = req.body || {};
      if (!league_id || !state) return res.status(400).json({ message: "Faltan datos de la partida." });
      const r = await sbFetch(`${SUPABASE_URL}/rest/v1/chiche_league_state?id=eq.${encodeURIComponent(league_id)}`, {
        method: "PATCH",
        headers: { ...sbHeaders(token), Prefer: "return=minimal" },
        body: JSON.stringify({ state, updated_at: updated_at || new Date().toISOString() })
      });
      await parseResponse(r);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ message: "Acción no válida." });
  } catch (e) {
    console.error("Chiche cloud proxy error:", e);
    if (e?.name === "AbortError") return res.status(504).json({ message: "Supabase no respondió a tiempo." });
    return res.status(Number(e.status) || 502).json({ message: e.message || "No se pudo acceder a la nube." });
  }
};
