export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    // keyPrefix 확인용 (확인 후 삭제할 예정)
    return res.status(200).json({ keyPrefix: apiKey.slice(0, 15) });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
