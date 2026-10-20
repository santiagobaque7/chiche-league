'use strict';

// Vercel Serverless Function: /api/chiche-identity
// El perfil se guarda aparte de la partida oficial para que un DT no tenga
// permiso de sobrescribir formaciones, puntajes o resultados.
const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';
// Ediciones independientes; conservar la misma edición que solicita el cliente.
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
// Supabase entrega dos URLs habituales: la URL del proyecto y la de la Data API.
// Ambas deben conducir a /rest/v1 exactamente una vez.
function supabaseApiBase() {
  const supplied=SUPABASE_URL.replace(/^['"]|['"]$/g,'').replace(/\/+$/,'');
  let parsed;
  try {parsed=new URL(supplied);} catch {
    throw new Error('SUPABASE_URL inválida. Usá https://TU_PROYECTO.supabase.co (sin otras rutas).');
  }
  const path=parsed.pathname.replace(/\/+$/,'');
  if(parsed.protocol!=='https:' || parsed.username || parsed.password || parsed.search || parsed.hash ||
    (path!=='' && path!=='/rest/v1')){
    throw new Error('SUPABASE_URL tiene una ruta incorrecta. Usá https://TU_PROYECTO.supabase.co (sin otras rutas).');
  }
  return `${parsed.origin}/rest/v1`;
}
async function supabaseRest(query, {method = 'GET', body} = {}) {
  const url = `${supabaseApiBase()}/${TABLE}?${query}`;
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
  if(typeof league!=='string'||!(/^[a-z0-9-]{3,80}$/).test(league))return respond(res,400,{message:'Torneo inválido.'});
  try {
    if (req.method==='GET') {
      const items=await supabaseRest(`league_id=eq.${encodeURIComponent(league)}&select=manager,profile,updated_at&order=manager.asc`);
      return respond(res,200,{items:Array.isArray(items)?items:[]});
    }
    const manager=body.manager;
    if(typeof manager!=='string'||!manager.trim()||manager.length>50||!(/^[\p{L}\p{N} ._'-]+$/u).test(manager))
      return respond(res,400,{message:'DT inválido.'});
    const profile=safeProfile(body.profile);
    const now=new Date().toISOString();
    const items=await supabaseRest('on_conflict=league_id,manager',{
      method:'POST',body:[{league_id:league,manager,profile,updated_at:now}]
    });
    return respond(res,200,{item:items?.[0]||{league_id:league,manager,profile,updated_at:now}});
  }catch(error){
    console.error('[chiche-identity]',error);
    const msg=error?.message||'Error de servidor.';
    const invalid=/^(Perfil inválido|El campo|DT inválido)/.test(msg);
    const invalidUrl=/^SUPABASE_URL (inválida|tiene una ruta incorrecta)/.test(msg);
    const missingTable=/Could not find the table|relation .* does not exist|PGRST205/.test(msg);
    const invalidPath=/Invalid path specified in request URL|PGRST125/.test(msg);
    return respond(res,invalid?400:invalidUrl||missingTable||invalidPath?503:502,{
      message:invalidUrl?msg:missingTable?'Falta crear la tabla chiche_club_identities en Supabase (ver SQL incluido).':
        invalidPath?'Supabase rechazó la ruta REST. Verificá SUPABASE_URL en Vercel: debe ser la URL del proyecto, sin rutas adicionales.':
        invalid?msg:'Error al consultar o guardar la identidad en Supabase.'
    });
  }
};
