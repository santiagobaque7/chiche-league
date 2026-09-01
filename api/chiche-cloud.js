const SUPABASE_URL = "https://nhncljaqxhlapfsjqrql.supabase.co";
const SUPABASE_KEY = "sb_publishable_GaMB23nh1tEtytzPS2c3gA_S_4YwYr3";
const OWNER_UID = "b9a49f4d-5e26-4f0e-8892-b6b958e4a59b";

function authHeaders() {
  return {
    apikey: SUPABASE_KEY,
    "Content-Type": "application/json"
  };
}

function restHeaders(token = null) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${token || SUPABASE_KEY}`,
    "Content-Type": "application/json"
  };
}

async function fetchTimed(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function parseSupabase(response) {
  const text = await response.text();
  let payload = null;
  if (text) {
    try { payload = JSON.parse(text); }
    catch { payload = { message: text }; }
  }

  if (!response.ok) {
    const err = new Error(
      payload?.error_description ||
      payload?.msg ||
      payload?.message ||
      `Supabase respondió ${response.status}`
    );
    err.status = response.status;
    throw err;
  }
  return payload;
}

function bearer(req) {
  return String(req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method === "OPTIONS") {
    res.setHeader("Allow", "GET,POST,PATCH,OPTIONS");
    return res.status(204).end();
  }

  const action = String(req.query.action || "");

  try {
    if (action === "health" && req.method === "GET") {
      return res.status(200).json({
        ok: true,
        service: "chiche-cloud",
        time: new Date().toISOString()
      });
    }

    if (action === "state" && req.method === "GET") {
      const leagueId = String(req.query.league_id || "clausura-2026");
      const url =
        `${SUPABASE_URL}/rest/v1/chiche_league_state` +
        `?id=eq.${encodeURIComponent(leagueId)}` +
        `&select=state,updated_at`;

      const response = await fetchTimed(url, {
        headers: restHeaders(),
        cache: "no-store"
      });
      const rows = await parseSupabase(response);
      return res.status(200).json({ row: Array.isArray(rows) ? (rows[0] || null) : null });
    }

    if (action === "login" && req.method === "POST") {
      const { email, password } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({ message: "Faltan email o contraseña." });
      }

      const response = await fetchTimed(
        `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ email, password })
        }
      );
      const session = await parseSupabase(response);

      if (session?.user?.id !== OWNER_UID) {
        return res.status(403).json({
          message: "Este usuario no es el administrador de la Chiche League."
        });
      }
      return res.status(200).json(session);
    }

    if (action === "refresh" && req.method === "POST") {
      const { refresh_token } = req.body || {};
      if (!refresh_token) {
        return res.status(400).json({ message: "Falta refresh token." });
      }

      const response = await fetchTimed(
        `${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ refresh_token })
        }
      );
      const session = await parseSupabase(response);

      if (session?.user?.id !== OWNER_UID) {
        return res.status(403).json({ message: "Sesión no autorizada." });
      }
      return res.status(200).json(session);
    }

    if (action === "logout" && req.method === "POST") {
      const token = bearer(req);
      if (!token) return res.status(204).end();

      const response = await fetchTimed(`${SUPABASE_URL}/auth/v1/logout`, {
        method: "POST",
        headers: restHeaders(token)
      });
      if (!response.ok && response.status !== 401) await parseSupabase(response);
      return res.status(204).end();
    }

    if (action === "state" && req.method === "PATCH") {
      const token = bearer(req);
      if (!token) {
        return res.status(401).json({ message: "Falta sesión de administrador." });
      }

      const { league_id, state, updated_at } = req.body || {};
      if (!league_id || !state) {
        return res.status(400).json({ message: "Faltan datos de la partida." });
      }

      const response = await fetchTimed(
        `${SUPABASE_URL}/rest/v1/chiche_league_state?id=eq.${encodeURIComponent(league_id)}`,
        {
          method: "PATCH",
          headers: {
            ...restHeaders(token),
            Prefer: "return=minimal"
          },
          body: JSON.stringify({
            state,
            updated_at: updated_at || new Date().toISOString()
          })
        }
      );
      await parseSupabase(response);
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "GET,POST,PATCH,OPTIONS");
    return res.status(405).json({
      message: `Acción o método no válido: ${req.method} ${action || "(sin action)"}`
    });
  } catch (e) {
    console.error("chiche-cloud:", e);

    if (e?.name === "AbortError") {
      return res.status(504).json({
        message: "Vercel pudo recibir la solicitud, pero Supabase no respondió a tiempo."
      });
    }

    return res.status(Number(e?.status) || 502).json({
      message: e?.message || "No se pudo acceder a Supabase desde Vercel."
    });
  }
};
