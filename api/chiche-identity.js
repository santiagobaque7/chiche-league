'use strict';

// Vercel Serverless Function: /api/chiche-identity
// El perfil se guarda aparte de la partida oficial para que un DT no tenga
// permiso de sobrescribir formaciones, puntajes o resultados.
const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';
const LEAGUE_ID = 'clausura-2026';
const TABLE = 'chiche_club_identities';
const LIMITS = {clubName:40,description:1200,founded:100,stadium:100,motto:240};

function respond(res, status, payload) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  return res.status(status).json(payload);
}
function safeProfile(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Perfil inválido.');
  const out = {};
  for (const [field, max] of Object.entries(LIMITS)) {
    if (typeof input[field] !== 'string') throw new Error(`El campo ${field} debe ser texto.`);
    const value = input[field].trim();
    if (!value || value.length > max) throw new Error(`El campo ${field} debe tener entre 1 y ${max} caracteres.`);
    out[field] = value;
  }
  return out;
}
async function supabaseRest(query, {method = 'GET', body} = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${TABLE}?${query}`;
  const response = await fetch(url, {
    method,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type':'application/json',
      Prefer:'resolution=merge-duplicates,return=representation'
    },
    ...(body===undefined?{}:{body:JSON.stringify(body)}),
    signal:AbortSignal.timeout(10000)
  });
  const raw=await response.text();
  let json;
  try {json=raw?JSON.parse(raw):null;}catch {json=null;}
  if (!response.ok) {
    const err=new Error(json?.message || `Supabase respondió HTTP ${response.status}`);
    err.httpCode=response.status;
    throw err;
  }
  return json;
}

module.exports = async function handler(req, res) {
  if (req.method!=='GET' && req.method!=='PATCH') {
    res.setHeader('Allow','GET, PATCH');
    return respond(res,405,{message:'Método no permitido.'});
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return respond(res,503,{message:'Configurar SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en Vercel.'});
  }
  let body;
  try {body=typeof req.body==='string'?JSON.parse(req.body):req.body||{};}
  catch {return respond(res,400,{message:'JSON inválido.'});}
  const league=(req.method==='GET'?req.query?.league_id:body?.league_id)||'';
  if(league!==LEAGUE_ID)return respond(res,400,{message:'Torneo inválido.'});
  try {
    if (req.method==='GET') {
      const items=await supabaseRest(`league_id=eq.${encodeURIComponent(LEAGUE_ID)}&select=manager,profile,updated_at&order=manager.asc`);
      return respond(res,200,{items:Array.isArray(items)?items:[]});
    }
    const manager=body.manager;
    if(typeof manager!=='string'||!manager.trim()||manager.length>50||!(/^[\p{L}\p{N} ._'-]+$/u).test(manager))
      return respond(res,400,{message:'DT inválido.'});
    const profile=safeProfile(body.profile);
    const now=new Date().toISOString();
    const items=await supabaseRest('on_conflict=league_id,manager',{
      method:'POST',body:[{league_id:LEAGUE_ID,manager,profile,updated_at:now}]
    });
    return respond(res,200,{item:items?.[0]||{league_id:LEAGUE_ID,manager,profile,updated_at:now}});
  }catch(error){
    console.error('[chiche-identity]',error);
    const msg=error?.message||'Error de servidor.';
    const invalid=/^(Perfil inválido|El campo|DT inválido)/.test(msg);
    const missingTable=/Could not find the table|relation .* does not exist|PGRST205/.test(msg);
    return respond(res,invalid?400:missingTable?503:502,{
      message:missingTable?'Falta crear la tabla chiche_club_identities en Supabase (ver SQL incluido).':invalid?msg:'Error al consultar o guardar la identidad en Supabase.'
    });
  }
};
