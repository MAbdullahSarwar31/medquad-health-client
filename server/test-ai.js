const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Equipment = require('./models/Equipment');
const Client = require('./models/Client');
const { generatePredictions } = require('./services/predictiveMaintenanceService');

const runTest = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // AI-02: Find an operational equipment and set its usage hours very high
        const equip = await Equipment.findOne({ status: 'operational' });
        if (!equip) throw new Error('No operational equipment found');

        console.log(`Updating ${equip.name} totalUsageHours to 9500...`);
        equip.totalUsageHours = 9500;
        await equip.save();

        // AI-01: Trigger the predictive maintenance analysis (simulating the cron)
        console.log('[Cron] Triggering nightly predictive maintenance analysis...');
        await generatePredictions();

        console.log('\n✅ AI Test Script Complete. Check the DB or Admin Dashboard for the new Critical Risk prediction!');
        process.exit(0);
    } catch (err) {
        console.error('Test failed:', err);
        process.exit(1);
    }
};

runTest();
