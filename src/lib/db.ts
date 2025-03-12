import mongoose from 'mongoose';

// הוספת הגדרת טיפוס ל-global
declare global {
  // eslint-disable-next-line no-var
  var mongoose: any;
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  console.log('dbConnect: Connecting to MongoDB...');
  
  if (cached.conn) {
    console.log('dbConnect: Using cached connection');
    return cached.conn;
  }

  if (!cached.promise) {
    console.log('dbConnect: Creating new connection to MongoDB');
    const opts = {
      bufferCommands: false,
    };

    try {
      cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
        console.log('dbConnect: Successfully connected to MongoDB');
        return mongoose;
      });
    } catch (error) {
      console.error('dbConnect: Error connecting to MongoDB:', error);
      throw error;
    }
  } else {
    console.log('dbConnect: Using existing connection promise');
  }
  
  try {
    cached.conn = await cached.promise;
    console.log('dbConnect: Connection established');
    return cached.conn;
  } catch (error) {
    console.error('dbConnect: Error awaiting connection promise:', error);
    throw error;
  }
}

export default dbConnect; 