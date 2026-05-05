const mongoose = require('mongoose');
const dns = require('dns');

const connectDB = async () => {
  try {
    if (process.env.MONGO_URI?.startsWith('mongodb+srv://')) {
      const dnsServers = (process.env.DNS_SERVERS || '8.8.8.8,1.1.1.1')
        .split(',')
        .map((server) => server.trim())
        .filter(Boolean);

      if (dnsServers.length > 0) {
        dns.setServers(dnsServers);
      }
    }

    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
