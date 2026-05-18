const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
require('dotenv').config();
console.log('Loaded MONGODB_URI:', process.env.MONGODB_URI ? 'Yes' : 'No');

const User = require('./models/User');
const Client = require('./models/Client');
const Equipment = require('./models/Equipment');

async function fixClientLinks() {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB.');

        // 1. Find all clients (organizations)
        const clients = await Client.find();
        console.log(`Found ${clients.length} Client organizations.`);

        // 2. Find all 'client' role users who don't have a clientId set
        const orphanUsers = await User.find({ role: 'client', clientId: null });
        console.log(`Found ${orphanUsers.length} Client Users without an organization link.`);

        for (const user of orphanUsers) {
            console.log(`\nAttempting to link User: ${user.name} (${user.email})`);
            
            // Try to match by email domain or similar name
            const userDomain = user.email.split('@')[1];
            let matchedClient = clients.find(c => c.email.includes(userDomain) || user.email === c.email);
            
            if (!matchedClient) {
                // Fuzzy match by name
                matchedClient = clients.find(c => 
                    c.orgName.toLowerCase().includes(user.name.split(' ')[0].toLowerCase()) ||
                    c.contactPerson.toLowerCase().includes(user.name.split(' ')[0].toLowerCase())
                );
            }

            if (matchedClient) {
                user.clientId = matchedClient._id;
                await user.save();
                console.log(`✅ Linked User '${user.name}' to Organization '${matchedClient.orgName}'.`);
                
                // Also update any equipment that was accidentally assigned to the User's ID instead of the Client's ID
                const updateRes = await Equipment.updateMany(
                    { clientId: user._id },
                    { $set: { clientId: matchedClient._id } }
                );
                if (updateRes.modifiedCount > 0) {
                    console.log(`   -> Also transferred ${updateRes.modifiedCount} equipment records to the true organization ID.`);
                }
            } else {
                console.log(`❌ Could not automatically find an organization for '${user.name}'.`);
            }
        }

        console.log('\nFinished data repair. Exiting...');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixClientLinks();
