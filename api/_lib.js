const fs=require('fs');const path=require('path');
const SUPABASE_URL=process.env.SUPABASE_URL;
const SERVICE_KEY=process.env.SUPABASE_SERVICE_ROLE_KEY;
function envReady(){return !!(SUPABASE_URL&&SERVICE_KEY)}
async function sb(pathname,opts={}){if(!envReady())throw new Error('Supabase environment variables are not set');
const r=await fetch(SUPABASE_URL+'/rest/v1/'+pathname,{...opts,headers:{apikey:SERVICE_KEY,Authorization:'Bearer '+SERVICE_KEY,'Content-Type':'application/json',...(opts.headers||{})}});
const t=await r.text();if(!r.ok)throw new Error(t||'Supabase request failed');return t?JSON.parse(t):null}
function validCode(code){return /^GJ-GK-(00[1-9]|0[1-9]\d|100)-STORE0001$/.test(code||'')}
function maskPhone(p){return p?p.slice(0,3)+'-****-'+p.slice(-4):null}
module.exports={sb,validCode,maskPhone,envReady};