const { sb, validCode, envReady } = require('./_lib');

module.exports = async (req, res) => {
  const code = String(req.query.code || '').trim().toUpperCase();
  if (!validCode(code)) return res.status(404).json({ valid: false });
  if (!envReady()) return res.status(200).json({ valid: true, registered: false, setupRequired: true });

  try {
    const rows = await sb(`qr_codes?qr_code=eq.${encodeURIComponent(code)}&select=qr_code,owner_phone,is_registered&limit=1`);
    const registered = !!(rows && rows[0] && (rows[0].owner_phone || rows[0].is_registered));
    res.json({ valid: true, registered });
  } catch (e) {
    res.status(500).json({ error: 'DB 조회 오류' });
  }
};
