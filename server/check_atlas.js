const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function main() {
    try {
        console.log('Connecting to Atlas...');
        console.log('URI:', process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/:([^:@]{1,}@)/, ':***@') : 'NOT SET');
        await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
        console.log('Connected to:', mongoose.connection.host);

        const users = await User.find({}).select('name email role isActive').lean();
        console.log('\n=== USERS IN ATLAS ===');
        if (users.length === 0) {
            console.log('  EMPTY - No users exist in Atlas yet');
        } else {
            users.forEach(u => console.log(`  [${u.role.toUpperCase()}] ${u.name} <${u.email}> active=${u.isActive}`));
        }
        console.log(`\nTotal users: ${users.length}`);
        process.exit(0);
    } catch (err) {
        console.error('ERROR:', err.message);
        process.exit(1);
    }
}
main();
