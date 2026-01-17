import clientPromise from '../lib/mongodb.js';

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const client = await clientPromise;
    const db = client.db('gpt-hello-app');
    const collection = db.collection('messages');

    const message = {
      text: 'Hello!',
      timestamp: new Date(),
      source: 'chatgpt'
    };

    // Store message in MongoDB
    await collection.insertOne(message);

    // Return response
    res.status(200).json({
      message: message.text,
      timestamp: message.timestamp.toISOString()
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to store message' });
  }
}
