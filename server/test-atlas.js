const mongoose = require('mongoose');

const uri = 'mongodb+srv://Radynex:absip3731@cluster0.blv3uaj.mongodb.net/medquad_health?retryWrites=true&w=majority&appName=Cluster0';

console.log('Testing connection to MongoDB Atlas...');

mongoose.connect(uri, {
    serverSelectionTimeoutMS: 15000, // 15 seconds wait
}).then(() => {
    console.log('\n✅ SUCCESS: Connection to MongoDB Atlas established flawlessly!');
    process.exit(0);
}).catch(err => {
    console.log('\n❌ FAILED: Could not connect to Atlas.');
    console.error('Error Details:', err.message);
    process.exit(1);
});
