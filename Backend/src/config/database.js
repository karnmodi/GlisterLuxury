const mongoose = require('mongoose');

let cachedConnection = null;
let isConnecting = false;
let connectionPromise = null;

// Retry connection with exponential backoff
async function connectWithRetry(uri, maxRetries = 5, retryDelay = 1000) {
  // Check if already connected
  if (mongoose.connection.readyState === 1) {
    console.log('MongoDB already connected, reusing existing connection');
    return mongoose.connection;
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Close existing connection if in a bad state
      if (mongoose.connection.readyState === 3) { // 3 = disconnecting
        await mongoose.connection.close();
      }

      const connection = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 30000, // Increased to 30s for better reliability
        socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
        connectTimeoutMS: 30000, // Connection timeout
        maxPoolSize: 10, // Maintain up to 10 socket connections
        minPoolSize: 1, // Maintain at least 1 socket connection
        bufferCommands: false, // Disable mongoose buffering
        retryWrites: true,
        retryReads: true,
      });
      return connection;
    } catch (error) {
      console.error(`MongoDB connection attempt ${attempt}/${maxRetries} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw new Error(`Failed to connect to MongoDB after ${maxRetries} attempts: ${error.message}`);
      }
      
      // Exponential backoff: wait longer between each retry
      const delay = retryDelay * Math.pow(2, attempt - 1);
      console.log(`⏳ Retrying connection in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function connectToDatabase() {
  // If we have a cached connection and it's ready, return it
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  // If already connecting, wait for that connection
  if (isConnecting && connectionPromise) {
    return connectionPromise;
  }

  // If connection is in progress, wait for it
  if (mongoose.connection.readyState === 2) { // 2 = connecting
    return new Promise((resolve, reject) => {
      mongoose.connection.once('connected', () => {
        cachedConnection = mongoose.connection;
        resolve(cachedConnection);
      });
      mongoose.connection.once('error', reject);
    });
  }

  // Start new connection
  isConnecting = true;
  connectionPromise = (async () => {
    try {
      // Set mongoose options
      mongoose.set('strictQuery', false);
      
      const MONGODB_URI = process.env.MONGODB_URI;
      
      if (!MONGODB_URI) {
        throw new Error('MONGODB_URI environment variable is not defined');
      }

      // Connect to MongoDB with retry logic
      const connection = await connectWithRetry(MONGODB_URI);

      console.log('✅ MongoDB connection established successfully');
      cachedConnection = connection;
      isConnecting = false;
      connectionPromise = null;
      return connection;
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      isConnecting = false;
      connectionPromise = null;
      throw error;
    }
  })();

  return connectionPromise;
}

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to MongoDB');
  cachedConnection = mongoose.connection;
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
  cachedConnection = null;
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose disconnected from MongoDB');
  cachedConnection = null;
  // Attempt to reconnect
  if (!isConnecting) {
    console.log('🔄 Attempting to reconnect to MongoDB...');
    connectToDatabase().catch(err => {
      console.error('❌ Reconnection attempt failed:', err.message);
    });
  }
});

// Handle process termination
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed through app termination');
  process.exit(0);
});

module.exports = connectToDatabase;

