const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Client = require('../models/Client');
const Equipment = require('../models/Equipment');

router.get('/', async (req, res) => {
    try {
        const clients = await Client.find();
        const orphanUsers = await User.find({ role: 'client', clientId: null });
        let log = [];

        log.push(`Found ${clients.length} Client organizations.`);
        log.push(`Found ${orphanUsers.length} Client Users without an organization link.`);

        for (const user of orphanUsers) {
            const userDomain = user.email.split('@')[1];
            let matchedClient = clients.find(c => c.email.includes(userDomain) || user.email === c.email);
            
            if (!matchedClient) {
                matchedClient = clients.find(c => 
                    c.orgName.toLowerCase().includes(user.name.split(' ')[0].toLowerCase()) ||
                    c.contactPerson.toLowerCase().includes(user.name.split(' ')[0].toLowerCase())
                );
            }

            if (matchedClient) {
                user.clientId = matchedClient._id;
                await user.save();
                log.push(`✅ Linked User '${user.name}' to Organization '${matchedClient.orgName}'.`);
                
                const updateRes = await Equipment.updateMany(
                    { clientId: user._id },
                    { $set: { clientId: matchedClient._id } }
                );
                if (updateRes.modifiedCount > 0) {
                    log.push(`   -> Transferred ${updateRes.modifiedCount} equipment records.`);
                }
            } else {
                log.push(`❌ Could not find an organization for '${user.name}'.`);
            }
        }

        res.json({ success: true, message: 'Data repair completed successfully', log });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
