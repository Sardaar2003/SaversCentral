import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sales-portal';
    console.log(`[DEBUG][DB] Connecting to MongoDB...`);
    console.log(`[DEBUG][DB] URI: ${mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}`);

    const conn = await mongoose.connect(mongoUri);
    console.log(`[DEBUG][DB] MongoDB Connected: ${conn.connection.host}`);
    console.log(`[DEBUG][DB] Database name: ${conn.connection.name}`);
    console.log(`[DEBUG][DB] Connection state: ${conn.connection.readyState === 1 ? 'CONNECTED' : 'NOT CONNECTED'}`);
  } catch (error) {
    console.error(`[DEBUG][DB] MongoDB Connection FAILED: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
