require('dotenv').config();
const mongoose = require('mongoose');
const { notify, getAdminIds } = require('./server/services/notificationService');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const adminIds = await getAdminIds();
        console.log('Admin IDs found:', adminIds);

        if (adminIds.length > 0) {
            await notify({
                recipientId: adminIds[0],
                type: 'general',
                title: 'Test Notification',
                message: 'This is a direct test of the Notification model to catch validation errors.',
                link: '/',
            });
            console.log('Notification created successfully');
        } else {
            console.log('No admins found, skipping notify test.');
        }

    } catch (e) {
        console.error('ERROR:', e);
    } finally {
        mongoose.disconnect();
    }
};
run();
