const mongoose = require('mongoose');
const dns = require('dns');

// Force Node.js to use Google DNS to resolve Atlas SRV records
// (Windows local DNS resolver sometimes fails on SRV lookups)
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const connectDB = async () => {
    try {
        let uri = process.env.MONGODB_URI;

        if (process.env.USE_MEMORY_DB === 'true') {
            const { MongoMemoryServer } = require('mongodb-memory-server');
            const mongoServer = await MongoMemoryServer.create();
            uri = mongoServer.getUri();
            console.log(`🧠 Using Local In-Memory MongoDB Server`);
        }

        const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: process.env.USE_MEMORY_DB === 'true' ? 5000 : 30000,
            socketTimeoutMS: 45000,
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`   Database: ${conn.connection.name}`);

        // Auto-seed if using memory DB so the app isn't empty
        if (process.env.USE_MEMORY_DB === 'true') {
            console.log(`🌱 Running database seeder for In-Memory Database...`);
            const seedDatabase = require('../utils/seed');
            await seedDatabase();
        }

    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        process.exit(1);
    }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected. Attempting reconnection...');
});

mongoose.connection.on('error', (err) => {
    console.error(`❌ MongoDB connection error: ${err.message}`);
});

module.exports = connectDB;
