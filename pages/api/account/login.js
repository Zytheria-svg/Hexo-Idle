import { generateToken, getSupabaseAdmin } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { username, passwordHash } = req.body;

  if (!username || !passwordHash) return res.status(400).json({ error: 'Missing fields.' });

  const sb = getSupabaseAdmin();
  const { data, error } = await sb.from('cloud_saves').select('*').eq('slot_name', username).maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Account not found.' });

  const storedHash = data.save_data?.__pwHash;
  if (!storedHash || storedHash !== passwordHash) return res.status(401).json({ error: 'Wrong password.' });

  const saveData = { ...data.save_data };
  delete saveData.__pwHash;

  const token = generateToken(username);
  res.status(200).json({ token, username, saveData: saveData?.level ? saveData : null, updatedAt: data.updated_at });
}
