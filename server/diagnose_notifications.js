/**
 * NOTIFICATION SYSTEM DIAGNOSTIC
 * Tests every single layer of the notification pipeline
 */
require('dotenv').config();
const mongoose = require('mongoose');

async function diagnose() {
    console.log('\n========== MEDQUAD NOTIFICATION DIAGNOSTIC ==========\n');

    // 1. Connect to DB (same logic as config/db.js)
    try {
        let uri = process.env.MONGODB_URI;
        if (process.env.USE_MEMORY_DB === 'true') {
            console.log('⚠️  USE_MEMORY_DB=true detected!');
            console.log('   The server uses an IN-MEMORY database.');
            console.log('   This script CANNOT connect to the same in-memory instance.');
            console.log('   Testing against a FRESH in-memory DB instead...\n');
            const { MongoMemoryServer } = require('mongodb-memory-server');
            const mongoServer = await MongoMemoryServer.create();
            uri = mongoServer.getUri();
        }
        await mongoose.connect(uri);
        console.log('✅ [1] MongoDB connected successfully');
    } catch (e) {
        console.error('❌ [1] MongoDB connection FAILED:', e.message);
        process.exit(1);
    }

    // 2. Check Notification model
    const Notification = require('./models/Notification');
    const User = require('./models/User');

    // 3. Count all notifications in DB
    try {
        const totalNotifs = await Notification.countDocuments();
        console.log(`\n📊 [2] Total notifications in database: ${totalNotifs}`);
        
        if (totalNotifs > 0) {
            const latest = await Notification.find().sort({ createdAt: -1 }).limit(3).lean();
            console.log('   Latest 3 notifications:');
            latest.forEach(n => {
                console.log(`   - [${n.type}] "${n.title}" → recipient: ${n.recipient} | read: ${n.isRead} | ${n.createdAt}`);
            });
        } else {
            console.log('   ⚠️  ZERO notifications exist. The notify() function has NEVER successfully created one.');
        }
    } catch (e) {
        console.error('❌ [2] Failed to query notifications:', e.message);
    }

    // 4. Check admin users
    try {
        const admins = await User.find({ role: 'admin' }).select('_id name email isActive').lean();
        console.log(`\n👤 [3] Admin users found: ${admins.length}`);
        admins.forEach(a => {
            console.log(`   - ${a.name} (${a.email}) | _id: ${a._id} | isActive: ${a.isActive}`);
        });

        // Also check with the getAdminIds filter
        const filteredAdmins = await User.find({ role: 'admin', isActive: { $ne: false } }).select('_id').lean();
        console.log(`   getAdminIds() would return: ${filteredAdmins.length} admin(s)`);
        
        if (filteredAdmins.length === 0) {
            console.log('   ❌ CRITICAL: getAdminIds() returns EMPTY array! No admin will ever receive notifications!');
        }
    } catch (e) {
        console.error('❌ [3] Failed to query users:', e.message);
    }

    // 5. Check employee users  
    try {
        const employees = await User.find({ role: 'employee' }).select('_id name email').lean();
        console.log(`\n👷 [4] Employee users found: ${employees.length}`);
        employees.forEach(e => {
            console.log(`   - ${e.name} (${e.email}) | _id: ${e._id}`);
        });
    } catch (e) {
        console.error('❌ [4] Failed to query employees:', e.message);
    }

    // 6. Try creating a notification directly
    console.log('\n🔨 [5] Attempting to CREATE a test notification directly...');
    try {
        const admins = await User.find({ role: 'admin', isActive: { $ne: false } }).select('_id').lean();
        
        if (admins.length === 0) {
            console.log('   ❌ No admin users to send to! Trying first user in DB...');
            const anyUser = await User.findOne().select('_id name').lean();
            if (anyUser) {
                admins.push(anyUser);
                console.log(`   Using fallback user: ${anyUser.name} (${anyUser._id})`);
            }
        }

        if (admins.length > 0) {
            const testNotif = await Notification.create({
                recipient: admins[0]._id,
                type: 'general',
                title: '🔔 Diagnostic Test Notification',
                message: 'This notification was created by the diagnostic script to verify the system works.',
                link: '/',
                metadata: { test: true, timestamp: new Date().toISOString() },
                isEmailed: false,
            });
            console.log(`   ✅ Notification CREATED successfully! ID: ${testNotif._id}`);
            console.log(`   Recipient: ${admins[0]._id}`);
            
            // Verify it's readable
            const verify = await Notification.findById(testNotif._id).lean();
            if (verify) {
                console.log(`   ✅ Notification VERIFIED in database - readable!`);
            } else {
                console.log(`   ❌ Notification NOT found after creation!`);
            }
        }
    } catch (e) {
        console.error(`   ❌ FAILED to create notification:`, e.message);
        console.error(`   Full error:`, e);
    }

    // 7. Test the notify() service function
    console.log('\n🔨 [6] Testing notify() service function...');
    try {
        const { notify, getAdminIds } = require('./services/notificationService');
        
        const adminIds = await getAdminIds();
        console.log(`   getAdminIds() returned: ${JSON.stringify(adminIds)}`);
        
        if (adminIds.length > 0) {
            await notify({
                recipientId: adminIds[0],
                type: 'general',
                title: '🔔 Service Function Test',
                message: 'This was created via the notify() service function directly.',
                link: '/',
                sendEmail: false,
                io: null,
            });
            console.log('   ✅ notify() completed without error');
            
            // Verify
            const latest = await Notification.findOne({ title: '🔔 Service Function Test' }).lean();
            if (latest) {
                console.log(`   ✅ CONFIRMED: notify() successfully persisted notification ID: ${latest._id}`);
            } else {
                console.log('   ❌ notify() did NOT throw an error but notification was NOT found in DB!');
            }
        } else {
            console.log('   ❌ Cannot test - no admin IDs returned');
        }
    } catch (e) {
        console.error(`   ❌ notify() service THREW an error:`, e.message);
        console.error(`   Stack:`, e.stack);
    }

    // 8. Check if notification_errors.log exists
    const fs = require('fs');
    const errorLogPath = require('path').join(__dirname, 'notification_errors.log');
    if (fs.existsSync(errorLogPath)) {
        const content = fs.readFileSync(errorLogPath, 'utf8');
        console.log('\n📋 [7] notification_errors.log EXISTS:');
        console.log(content.substring(0, 2000));
    } else {
        console.log('\n📋 [7] notification_errors.log does NOT exist (no errors logged)');
    }

    // 9. Final count
    const finalCount = await Notification.countDocuments();
    console.log(`\n📊 [8] Final notification count in DB: ${finalCount}`);

    // 10. Check unread count for each admin
    const admins = await User.find({ role: 'admin', isActive: { $ne: false } }).select('_id name').lean();
    for (const admin of admins) {
        const unread = await Notification.countDocuments({ recipient: admin._id, isRead: false });
        console.log(`   ${admin.name}: ${unread} unread notifications`);
    }

    console.log('\n========== DIAGNOSTIC COMPLETE ==========\n');
    await mongoose.disconnect();
}

diagnose().catch(e => { console.error('FATAL:', e); process.exit(1); });
