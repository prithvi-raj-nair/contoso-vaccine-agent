import { MongoClient } from 'mongodb';

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient> | null = null;

export default function getClientPromise(): Promise<MongoClient> {
  if (clientPromise) {
    return clientPromise;
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('Please add MONGODB_URI environment variable');
  }

  if (process.env.NODE_ENV === 'development') {
    // In development, use a global variable to preserve the connection
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    // In production, create a new client
    const client = new MongoClient(uri);
    clientPromise = client.connect();
  }

  return clientPromise;
}
