const fs = require('fs');
const path = require('path');

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  'https://dcysjuxyjqtvkihdsjvv.supabase.co';

const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'sb_publishable_RZBX7u1v8MLBCfEJT0-eRg_jPcIulG2';

function envReady() {
  return !!(SUPABASE_URL && SERVICE_KEY);
}

async function sb(pathname, opts = {}) {
  if (!envReady()) {
    throw new Error('Supabase environment variables are not set');
  }
  const r = await fetch(SUPABASE_URL + '/rest/v1/' + pathname, {
    ...opts,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: 'Bearer ' + SERVICE_KEY,
      'Content-Type': 'application/json',
      ...(opts.headers || {})
    }
  });
  const t = await r.text();
  if (!r.ok) {
    throw new Error(t || 'Supabase request failed');
  }
  return t ? JSON.parse(t) : null;
}

function validCode(code) {
  return /^[A-Z0-9_-]{4,60}$/i.test(String(code || '').trim());
}

function maskPhone(p) {
  return p ? p.slice(0, 3) + '-****-' + p.slice(-4) : null;
}

module.exports = {
  sb,
  validCode,
  maskPhone,
  envReady,
  SUPABASE_URL,
  SERVICE_KEY
};
