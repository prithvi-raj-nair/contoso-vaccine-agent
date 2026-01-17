import clientPromise from '../lib/mongodb.js';

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const client = await clientPromise;
    const db = client.db('gpt-hello-app');
    const collection = db.collection('messages');

    // Get messages from the last 5 minutes, sorted by newest first
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const messages = await collection
      .find({ timestamp: { $gte: fiveMinutesAgo } })
      .sort({ timestamp: -1 })
      .limit(20)
      .toArray();

    res.status(200).json({ messages });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
}
