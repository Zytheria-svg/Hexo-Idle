import { verifyToken, getSupabaseAdmin } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { token, saveData } = req.body;

  const username = verifyToken(token);
  if (!username) return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });

  const sb = getSupabaseAdmin();

  // Preserve password hash
  const { data: existing } = await sb.from('cloud_saves').select('save_data').eq('slot_name', username).maybeSingle();
  const pwHash = existing?.save_data?.__pwHash || '';

  const { error } = await sb.from('cloud_saves').upsert({
    slot_name: username,
    char_name: saveData.charName || 'Hero',
    level: saveData.level || 1,
    cls: saveData.cls || '',
    save_data: { ...saveData, __pwHash: pwHash },
    protected: false,
    pin: null,
    updated_at: new Date().toISOString()
  }, { onConflict: 'slot_name' });

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ ok: true });
}
