import { generateToken, getSupabaseAdmin } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { username, passwordHash } = req.body;

  if (!username || !passwordHash) return res.status(400).json({ error: 'Missing fields.' });
  if (!/^[a-z0-9_]{3,20}$/.test(username)) return res.status(400).json({ error: 'Username: 3-20 chars, letters/numbers/_ only.' });

  const sb = getSupabaseAdmin();
  const { data: existing } = await sb.from('cloud_saves').select('slot_name').eq('slot_name', username).maybeSingle();
  if (existing) return res.status(409).json({ error: 'Username already taken.' });

  const { error } = await sb.from('cloud_saves').insert({
    slot_name: username,
    char_name: '',
    level: 1,
    cls: '',
    save_data: { __pwHash: passwordHash },
    protected: false,
    pin: null,
    updated_at: new Date().toISOString()
  });

  if (error) return res.status(500).json({ error: error.message });

  const token = generateToken(username);
  res.status(200).json({ token, username });
}
