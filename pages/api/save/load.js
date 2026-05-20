import { verifyToken, getSupabaseAdmin } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { token } = req.body;

  const username = verifyToken(token);
  if (!username) return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });

  const sb = getSupabaseAdmin();
  const { data, error } = await sb.from('cloud_saves').select('*').eq('slot_name', username).maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'No save found.' });

  const saveData = { ...data.save_data };
  delete saveData.__pwHash;

  res.status(200).json({ saveData: saveData?.level ? saveData : null, updatedAt: data.updated_at });
}
