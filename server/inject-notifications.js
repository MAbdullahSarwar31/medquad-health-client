/**
 * Phase 3 Notification Injector
 * Run this once with: node inject-notifications.js
 * It patches ticketController, expenseController, inventoryController, and equipmentController
 * to inject notify() calls at all critical events.
 */
const fs = require('fs');
const path = require('path');

const CTRL_DIR = path.join(__dirname, 'controllers');
const SVC_DIR = path.join(__dirname, 'services');

/* ─────────────────────────────────────────────────────────────
   1. TICKET CONTROLLER
   ───────────────────────────────────────────────────────────── */
let ticketCtrl = fs.readFileSync(path.join(CTRL_DIR, 'ticketController.js'), 'utf8');

// Add import if not present
if (!ticketCtrl.includes('notificationService')) {
    ticketCtrl = ticketCtrl.replace(
        "const { analyzeTicketDescription } = require('../services/ticketAIService');",
        "const { analyzeTicketDescription } = require('../services/ticketAIService');\nconst { notify, getAdminIds } = require('../services/notificationService');"
    );
}

// Inject after ticket create + socket emit
if (!ticketCtrl.includes('// NOTIF: ticket_created')) {
    ticketCtrl = ticketCtrl.replace(
        "res.status(201).json({ success: true, data: { ticket: populated } });\n    } catch (error) {\n        next(error);\n    }\n};\n\n/**\n * @desc    Analyze ticket",
        `// NOTIF: ticket_created
        const io2 = req.app.get('io');
        const adminIds = await getAdminIds();
        const equipName2 = populated.equipmentId?.name || 'equipment';
        const clientName2 = populated.clientId?.orgName || 'a client';
        await notify({ recipientId: adminIds, type: 'ticket_created', title: 'New Service Ticket Submitted', message: \`A new \${ticketData.priority || 'medium'} priority ticket for \${equipName2} at \${clientName2}.\`, link: '/admin/tickets', buttonText: 'View Ticket', metadata: { ticketId: ticket._id }, sendEmail: true, io: io2 });
        if (ticketData.assignedEmployee) {
            await notify({ recipientId: ticketData.assignedEmployee, type: 'ticket_assigned', title: 'New Ticket Assigned to You', message: \`You have a new \${ticketData.priority || 'medium'} priority ticket for \${equipName2} at \${clientName2}.\`, link: '/employee/tickets', buttonText: 'View My Tickets', metadata: { ticketId: ticket._id }, sendEmail: true, io: io2 });
        }

        res.status(201).json({ success: true, data: { ticket: populated } });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Analyze ticket`
    );
}

// Inject after update ticket + socket emit (updateTicket)
if (!ticketCtrl.includes('// NOTIF: ticket_updated')) {
    ticketCtrl = ticketCtrl.replace(
        "res.status(200).json({ success: true, data: { ticket: updated } });\n    } catch (error) {\n        next(error);\n    }\n};\n\n/**\n * @desc    Add an update",
        `// NOTIF: ticket_updated
        const io3 = req.app.get('io');
        const adminIds3 = await getAdminIds();
        const equipName3 = updated.equipmentId?.name || 'equipment';
        if (assignedEmployee) {
            await notify({ recipientId: assignedEmployee, type: 'ticket_assigned', title: 'Ticket Assigned to You', message: \`You have been assigned a \${updated.priority} priority ticket for \${equipName3}.\`, link: '/employee/tickets', buttonText: 'View My Tickets', metadata: { ticketId: updated._id }, sendEmail: true, io: io3 });
        }
        if (status && ['resolved','closed'].includes(status) && updated.createdBy) {
            await notify({ recipientId: updated.createdBy, type: 'ticket_resolved', title: 'Your Service Ticket Is Resolved', message: \`Your ticket for \${equipName3} has been marked as \${status} by our team.\`, link: '/client/tickets', buttonText: 'View Ticket', metadata: { ticketId: updated._id }, sendEmail: true, io: io3 });
        }

        res.status(200).json({ success: true, data: { ticket: updated } });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Add an update`
    );
}

fs.writeFileSync(path.join(CTRL_DIR, 'ticketController.js'), ticketCtrl, 'utf8');
console.log('✅ ticketController.js patched');

/* ─────────────────────────────────────────────────────────────
   2. EXPENSE CONTROLLER
   ───────────────────────────────────────────────────────────── */
let expenseCtrl = fs.readFileSync(path.join(CTRL_DIR, 'expenseController.js'), 'utf8');

if (!expenseCtrl.includes('notificationService')) {
    expenseCtrl = "const { notify, getAdminIds } = require('../services/notificationService');\n" + expenseCtrl;
}

// After createExpense success
if (!expenseCtrl.includes('// NOTIF: expense_submitted')) {
    expenseCtrl = expenseCtrl.replace(
        "res.status(201).json({\n            success: true,\n            message: 'Expense claim submitted successfully',\n            data: { claim: populated },\n        });",
        `// NOTIF: expense_submitted
        const io4 = req.app.get('io');
        const adminIds4 = await getAdminIds();
        await notify({ recipientId: adminIds4, type: 'expense_submitted', title: 'New Expense Claim Submitted', message: \`An employee has submitted a new expense claim of \${populated.amount} \${populated.currency} (\${populated.type}). Please review.\`, link: '/admin/expenses', buttonText: 'Review Claim', metadata: { expenseId: claim._id }, sendEmail: true, io: io4 });

        res.status(201).json({
            success: true,
            message: 'Expense claim submitted successfully',
            data: { claim: populated },
        });`
    );
}

// After updateExpenseStatus success
if (!expenseCtrl.includes('// NOTIF: expense_reviewed')) {
    expenseCtrl = expenseCtrl.replace(
        "res.status(200).json({\n            success: true,\n            message: `Expense claim ${status}`,\n            data: { claim: populated },\n        });",
        `// NOTIF: expense_reviewed
        const io5 = req.app.get('io');
        const isApproved = status === 'approved';
        await notify({
            recipientId: populated.employeeId._id,
            type: isApproved ? 'expense_approved' : 'expense_rejected',
            title: isApproved ? '🎉 Expense Claim Approved' : '❌ Expense Claim Rejected',
            message: isApproved
                ? \`Your expense claim \${populated.claimNumber} for \${populated.amountPKR?.toLocaleString()} PKR has been approved.\`
                : \`Your expense claim \${populated.claimNumber} was rejected. Admin note: \${adminNote || 'No note provided.'}\`,
            link: '/employee/expenses',
            buttonText: 'View My Claims',
            metadata: { expenseId: claim._id },
            sendEmail: true,
            io: io5,
        });

        res.status(200).json({
            success: true,
            message: \`Expense claim \${status}\`,
            data: { claim: populated },
        });`
    );
}

fs.writeFileSync(path.join(CTRL_DIR, 'expenseController.js'), expenseCtrl, 'utf8');
console.log('✅ expenseController.js patched');

/* ─────────────────────────────────────────────────────────────
   3. EQUIPMENT CONTROLLER
   ───────────────────────────────────────────────────────────── */
let equipCtrl = fs.readFileSync(path.join(CTRL_DIR, 'equipmentController.js'), 'utf8');

if (!equipCtrl.includes('notificationService')) {
    equipCtrl = "const { notify, getAdminIds } = require('../services/notificationService');\n" + equipCtrl;
}

// Inject after createEquipment response
if (!equipCtrl.includes('// NOTIF: equipment_added')) {
    equipCtrl = equipCtrl.replace(
        "res.status(201).json({ success: true, data: { equipment } });",
        `// NOTIF: equipment_added
        const io6 = req.app.get('io');
        const adminIds6 = await getAdminIds();
        await notify({ recipientId: adminIds6, type: 'equipment_added', title: 'New Equipment Added', message: \`New equipment "\${equipment.name}" (\${equipment.category}) has been registered in the system.\`, link: '/admin/equipment', buttonText: 'View Equipment', metadata: { equipmentId: equipment._id }, sendEmail: false, io: io6 });

        res.status(201).json({ success: true, data: { equipment } });`
    );
}

fs.writeFileSync(path.join(CTRL_DIR, 'equipmentController.js'), equipCtrl, 'utf8');
console.log('✅ equipmentController.js patched');

/* ─────────────────────────────────────────────────────────────
   4. INVENTORY CONTROLLER — low stock alert
   ───────────────────────────────────────────────────────────── */
let invCtrl = fs.readFileSync(path.join(CTRL_DIR, 'inventoryController.js'), 'utf8');

if (!invCtrl.includes('notificationService')) {
    invCtrl = "const { notify, getAdminIds } = require('../services/notificationService');\n" + invCtrl;
}

// After updateInventory, check for low stock
if (!invCtrl.includes('// NOTIF: inventory_low')) {
    invCtrl = invCtrl.replace(
        "res.status(200).json({ success: true, data: { item } });",
        `// NOTIF: inventory_low
        if (item.quantityOnHand <= item.reorderThreshold) {
            const io7 = req.app.get('io');
            const adminIds7 = await getAdminIds();
            await notify({ recipientId: adminIds7, type: 'inventory_low', title: '⚠️ Low Stock Alert', message: \`"\${item.partName}" (Part# \${item.partNumber}) is at or below reorder threshold. Current stock: \${item.quantityOnHand} units (threshold: \${item.reorderThreshold}).\`, link: '/admin/inventory', buttonText: 'Manage Inventory', metadata: { inventoryId: item._id }, sendEmail: true, io: io7 });
        }

        res.status(200).json({ success: true, data: { item } });`
    );
}

fs.writeFileSync(path.join(CTRL_DIR, 'inventoryController.js'), invCtrl, 'utf8');
console.log('✅ inventoryController.js patched');

/* ─────────────────────────────────────────────────────────────
   5. PREDICTIVE MAINTENANCE SERVICE — AI critical alert
   ───────────────────────────────────────────────────────────── */
let predSvc = fs.readFileSync(path.join(SVC_DIR, 'predictiveMaintenanceService.js'), 'utf8');

if (!predSvc.includes('notificationService')) {
    predSvc = "const { notify, getAdminIds } = require('./notificationService');\n" + predSvc;
}

// After upsert prediction, if confidence > 0.75, fire critical alert
if (!predSvc.includes('// NOTIF: ai_critical_alert')) {
    predSvc = predSvc.replace(
        'await MaintenancePrediction.findOneAndUpdate(',
        `// NOTIF: ai_critical_alert
            if (confidence >= 0.75) {
                try {
                    const adminIds8 = await getAdminIds();
                    await notify({ recipientId: adminIds8, type: 'ai_critical_alert', title: '🤖 AI Critical Risk Alert', message: \`MedQuad AI v2.0 detected CRITICAL risk for "\${eq.name}": \${getFailureTypeByCategory(eq.category)}. Confidence: \${Math.round(confidence * 100)}%. Estimated failure in ~\${daysUntilFailure} days.\`, link: '/admin', buttonText: 'View AI Dashboard', metadata: { equipmentId: eq._id, confidence, daysUntilFailure }, sendEmail: true });
                } catch(e) { console.warn('[Predictions] Notify failed:', e.message); }
            }

            await MaintenancePrediction.findOneAndUpdate(`
    );
}

fs.writeFileSync(path.join(SVC_DIR, 'predictiveMaintenanceService.js'), predSvc, 'utf8');
console.log('✅ predictiveMaintenanceService.js patched');

console.log('\n🎉 All controllers patched successfully! Notification injection complete.\n');
