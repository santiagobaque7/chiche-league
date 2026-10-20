'use strict';
// Multitorneo sin tablas ni variables nuevas: usa chiche_league_state ya existente.
const rawUrl=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL||'';
const url=rawUrl.replace(/\/+$/,'').replace(/\/rest\/v1$/,'');
const key=process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_SERVICE_KEY||'';
const owner='b9a49f4d-5e26-4f0e-8892-b6b958e4a59b';
const TABLE='chiche_league_state', MANIFEST='chiche-tournaments-manifest-v12';
function reply(res,n,p){res.setHeader('Cache-Control','no-store');return res.status(n).json(p)}
async function call(path,opts={}){
  const r=await fetch(`${url}${path}`,{...opts,headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',Prefer:'return=representation,resolution=merge-duplicates',...(opts.headers||{})},signal:AbortSignal.timeout(12000)});
  const raw=await r.text();let j;try{j=raw?JSON.parse(raw):null}catch{j={message:raw.slice(0,300)}}
  if(!r.ok){const e=new Error(j?.message||j?.error||`Supabase HTTP ${r.status}`);e.status=r.status;throw e}return j;
}
async function admin(req){
  const jwt=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'').trim();if(!jwt)return false;
  const r=await fetch(`${url}/auth/v1/user`,{headers:{apikey:key,Authorization:`Bearer ${jwt}`},signal:AbortSignal.timeout(10000)});
  if(!r.ok)return false;const u=await r.json();return u?.id===owner;
}
function validateId(id){return typeof id==='string'&&/^[a-z0-9-]{3,80}$/.test(id)}
function validateName(name){return typeof name==='string'&&name.trim().length>=3&&name.trim().length<=70}
async function rows(){return await call(`/rest/v1/${TABLE}?select=id,state&order=id.asc`)}
async function manifest(){
  const all=await rows();const m=all.find(x=>x.id===MANIFEST)?.state;
  const items=Array.isArray(m?.items)?m.items:[];
  if(!items.some(i=>i.id==='clausura-2026'))items.unshift({id:'clausura-2026',name:'Clausura 2026',year:2026,protected:true});
  // Los participantes se leen desde el estado oficial, no desde una copia vieja de los metadatos.
  return {items:items.filter(t=>all.some(r=>r.id===t.id)).map(t=>({...t,participants:all.find(r=>r.id===t.id)?.state?.participants||[]}))};
}
async function save(items){await call(`/rest/v1/${TABLE}?on_conflict=id`,{method:'POST',body:JSON.stringify([{id:MANIFEST,state:{items:items.map(({participants,...t})=>t)},updated_at:new Date().toISOString()}])})}
module.exports=async(req,res)=>{
 try{
  if(!url.startsWith('https://')||!key)return reply(res,503,{message:'La conexión actual de Supabase no está disponible.'});
  if(req.method==='GET')return reply(res,200,await manifest());
  if(!['POST','PATCH','DELETE'].includes(req.method))return reply(res,405,{message:'Método no permitido.'});
  if(!await admin(req))return reply(res,403,{message:'Solo el administrador puede gestionar torneos.'});
  const b=typeof req.body==='string'?JSON.parse(req.body):req.body||{};
  const index=await manifest(),items=index.items.map(({participants,...t})=>t);
  if(req.method==='POST'){
   if(!validateName(b.name)||!Number.isInteger(Number(b.year))||Number(b.year)<2025||Number(b.year)>2100)return reply(res,400,{message:'Nombre o año inválido.'});
   if(items.length>=50)return reply(res,400,{message:'Se alcanzó el límite de torneos.'});
   if(items.some(t=>t.name.toLowerCase()===b.name.trim().toLowerCase()))return reply(res,409,{message:'Ya existe esa edición.'});
   const s=b.initialState;if(!s||!Array.isArray(s.players)||!Array.isArray(s.participants)||!s.rounds||!s.confirmedTeams)return reply(res,400,{message:'Estado inicial inválido.'});
   const id='torneo-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
   await call(`/rest/v1/${TABLE}?on_conflict=id`,{method:'POST',body:JSON.stringify([{id,state:s,updated_at:new Date().toISOString()}])});
   items.push({id,name:b.name.trim(),year:Number(b.year)});
   try{await save(items)}catch(e){await call(`/rest/v1/${TABLE}?id=eq.${id}`,{method:'DELETE'});throw e}
   return reply(res,201,{item:{id,name:b.name.trim(),year:Number(b.year)}});
  }
  if(!validateId(b.id))return reply(res,400,{message:'ID inválido.'});
  const target=items.find(t=>t.id===b.id);if(!target)return reply(res,404,{message:'Torneo no encontrado.'});
  if(req.method==='PATCH'){
   if(!validateName(b.name)||!Number.isInteger(Number(b.year)))return reply(res,400,{message:'Nombre o año inválido.'});
   if(items.some(t=>t.id!==b.id&&t.name.toLowerCase()===b.name.trim().toLowerCase()))return reply(res,409,{message:'Ya existe ese nombre.'});
   target.name=b.name.trim();target.year=Number(b.year);await save(items);return reply(res,200,{item:target});
  }
  if(b.id==='clausura-2026')return reply(res,403,{message:'El Clausura 2026 está protegido.'});
  if(b.confirmName!==target.name)return reply(res,400,{message:'La confirmación no coincide con el nombre.'});
  // Borrado confirmado por nombre; no afecta otras ediciones.
  await call(`/rest/v1/chiche_club_identities?league_id=eq.${encodeURIComponent(b.id)}`,{method:'DELETE'});
  await call(`/rest/v1/${TABLE}?id=eq.${encodeURIComponent(b.id)}`,{method:'DELETE'});
  await save(items.filter(t=>t.id!==b.id));return reply(res,200,{ok:true});
 }catch(e){console.error('[chiche-tournaments]',e);return reply(res,e.status>=400&&e.status<500?e.status:502,{message:e.message||'Error de torneos.'})}
};
