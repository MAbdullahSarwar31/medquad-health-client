const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env from server directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const Client = require('../models/Client');
const Equipment = require('../models/Equipment');
const ServiceTicket = require('../models/ServiceTicket');
const Inventory = require('../models/Inventory');
const MaintenancePrediction = require('../models/MaintenancePrediction');

const seedDatabase = async () => {
    try {
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(process.env.MONGODB_URI);
            console.log('✅ Connected to MongoDB for seeding...\n');
        }

        // Clear existing data
        await Promise.all([
            User.deleteMany({}),
            Client.deleteMany({}),
            Equipment.deleteMany({}),
            ServiceTicket.deleteMany({}),
            Inventory.deleteMany({}),
            MaintenancePrediction.deleteMany({}),
        ]);
        console.log('🗑️  Cleared existing data');

        // ===========================
        //  1. CREATE ADMIN USER
        // ===========================
        const admin = await User.create({
            name: 'Abdullah Sarwar',
            email: 'admin@medquad.com',
            password: 'Admin@2026',
            role: 'admin',
            phone: '+92-300-1234567',
        });
        console.log(`👤 Admin created: ${admin.email}`);

        // ===========================
        //  2. CREATE CLIENT ORGANIZATIONS (HOSPITALS)
        // ===========================
        const hospitals = await Client.create([
            {
                orgName: 'Shifa International Hospital',
                contactPerson: 'Dr. Ahmed Khan',
                email: 'biomedical@shifa.com.pk',
                phone: '+92-51-8464646',
                address: { street: 'Pitras Bukhari Road, H-8/4', city: 'Islamabad', state: 'ICT', zipCode: '44000', country: 'Pakistan' },
                contractExpiry: new Date('2027-12-31'),
                contractStatus: 'active',
            },
            {
                orgName: 'Aga Khan University Hospital',
                contactPerson: 'Dr. Sarah Malik',
                email: 'equipment@aku.edu',
                phone: '+92-21-34930051',
                address: { street: 'Stadium Road', city: 'Karachi', state: 'Sindh', zipCode: '74800', country: 'Pakistan' },
                contractExpiry: new Date('2027-06-30'),
                contractStatus: 'active',
            },
            {
                orgName: 'Combined Military Hospital Rawalpindi',
                contactPerson: 'Col. Rashid Mehmood',
                email: 'radiology@cmh.mil.pk',
                phone: '+92-51-9270614',
                address: { street: 'Rawal Road', city: 'Rawalpindi', state: 'Punjab', zipCode: '46000', country: 'Pakistan' },
                contractExpiry: new Date('2026-09-15'),
                contractStatus: 'active',
            },
        ]);
        console.log(`🏥 ${hospitals.length} hospitals created`);

        // ===========================
        //  3. CREATE USERS FOR EACH ROLE
        // ===========================
        const clientUsers = await User.create([
            { name: 'Dr. Ahmed Khan', email: 'ahmed@shifa.com.pk', password: 'Client@2026', role: 'client', clientId: hospitals[0]._id, phone: '+92-333-5551234' },
            { name: 'Dr. Sarah Malik', email: 'sarah@aku.edu', password: 'Client@2026', role: 'client', clientId: hospitals[1]._id, phone: '+92-321-6667890' },
        ]);

        const employees = await User.create([
            { name: 'Usman Rafiq', email: 'usman@medquad.com', password: 'Emp@2026', role: 'employee', phone: '+92-345-1112233' },
            { name: 'Fatima Noor', email: 'fatima@medquad.com', password: 'Emp@2026', role: 'employee', phone: '+92-312-4445566' },
            { name: 'Hassan Ali', email: 'hassan@medquad.com', password: 'Emp@2026', role: 'employee', phone: '+92-300-7778899' },
        ]);
        console.log(`👤 ${clientUsers.length} client users + ${employees.length} employees created`);

        // ===========================
        //  4. CREATE EQUIPMENT CATALOG
        // ===========================
        const equipmentData = [
            {
                name: 'MAGNETOM Vida 3T MRI System',
                model: 'MAGNETOM Vida',
                manufacturer: 'Siemens Healthineers',
                category: 'MRI',
                serialNumber: 'SH-MRI-2024-001',
                clientId: hospitals[0]._id,
                installDate: new Date('2024-03-15'),
                lastServiceDate: new Date('2025-11-20'),
                status: 'operational',
                description: 'Premium 3 Tesla MRI system with BioMatrix Technology for personalized, precise, and productive imaging. Features 70cm bore and TimTX TrueForm.',
                totalUsageHours: 12500,
                specifications: { fieldStrength: '3T', boreSize: '70cm', gradientAmplitude: '60 mT/m', software: 'syngo MR XA31' },
                imageUrl: '/images/equipment/siemens-vida-mri.jpg',
            },
            {
                name: 'Optima CT660 128-Slice CT Scanner',
                model: 'Optima CT660',
                manufacturer: 'GE Healthcare',
                category: 'CT',
                serialNumber: 'GE-CT-2023-045',
                clientId: hospitals[0]._id,
                installDate: new Date('2023-08-01'),
                lastServiceDate: new Date('2025-09-10'),
                status: 'operational',
                description: '128-slice CT scanner with ASiR-V iterative reconstruction technology. Delivers high image quality at reduced dose levels for routine and advanced clinical applications.',
                totalUsageHours: 18200,
                specifications: { slices: '128', rotationTime: '0.35s', detectorCoverage: '40mm', software: 'AW Server 3.2' },
                imageUrl: '/images/equipment/ge-optima-ct660.jpg',
            },
            {
                name: 'EPIQ Elite Ultrasound System',
                model: 'EPIQ Elite',
                manufacturer: 'Philips Healthcare',
                category: 'Ultrasound',
                serialNumber: 'PH-US-2024-112',
                clientId: hospitals[1]._id,
                installDate: new Date('2024-01-20'),
                lastServiceDate: new Date('2025-12-05'),
                status: 'operational',
                description: 'Premium ultrasound platform with Anatomical Intelligence and XRES Pro advanced image processing. Exceptional 2D and 3D imaging for cardiology, OB/GYN, and radiology.',
                totalUsageHours: 8900,
                specifications: { transducers: 'xMATRIX, PureWave', software: 'SmartExam', imaging: '2D/3D/4D', display: '23.8" LED' },
                imageUrl: '/images/equipment/philips-epiq-elite.jpg',
            },
            {
                name: 'Ysio Max Digital X-Ray System',
                model: 'Ysio Max',
                manufacturer: 'Siemens Healthineers',
                category: 'X-Ray',
                serialNumber: 'SH-XR-2022-078',
                clientId: hospitals[2]._id,
                installDate: new Date('2022-11-05'),
                lastServiceDate: new Date('2025-07-30'),
                status: 'maintenance',
                description: 'Ceiling-mounted digital radiography system with MAX positioning flexibility. Features Wi-D wireless detector technology and auto-positioning for consistent results.',
                totalUsageHours: 22400,
                specifications: { detectorSize: '43x43cm', generatorPower: '65kW', SID: '100-180cm', resolution: '3.2 lp/mm' },
                imageUrl: '/images/equipment/siemens-ysio-max.jpg',
            },
            {
                name: 'SIGNA Pioneer 3T MRI System',
                model: 'SIGNA Pioneer',
                manufacturer: 'GE Healthcare',
                category: 'MRI',
                serialNumber: 'GE-MRI-2023-034',
                clientId: hospitals[1]._id,
                installDate: new Date('2023-05-22'),
                lastServiceDate: new Date('2025-10-15'),
                status: 'operational',
                description: 'Wide-bore 3T MRI with Total Digital Imaging (TDI) architecture. AIR Technology coils provide high-density signal collection for exceptional image quality with patient comfort.',
                totalUsageHours: 15600,
                specifications: { fieldStrength: '3T', boreSize: '70cm', channels: '146', software: 'SIGNA Works' },
                imageUrl: '/images/equipment/ge-signa-pioneer.jpg',
            },
            {
                name: 'Revolution Apex CT System',
                model: 'Revolution Apex',
                manufacturer: 'GE Healthcare',
                category: 'CT',
                serialNumber: 'GE-CT-2024-089',
                clientId: hospitals[2]._id,
                installDate: new Date('2024-06-10'),
                lastServiceDate: new Date('2025-12-01'),
                status: 'operational',
                description: 'Next-generation spectral CT with TrueFidelity Deep Learning Image Reconstruction. 256-slice coverage, 0.23s rotation time for cardiac excellence.',
                totalUsageHours: 6800,
                specifications: { slices: '256', rotationTime: '0.23s', detectorCoverage: '160mm', spectral: 'GSI Xtream' },
                imageUrl: '/images/equipment/ge-revolution-apex.jpg',
            },
            {
                name: 'Vivid E95 Cardiovascular Ultrasound',
                model: 'Vivid E95',
                manufacturer: 'GE Healthcare',
                category: 'Ultrasound',
                serialNumber: 'GE-US-2023-056',
                clientId: hospitals[0]._id,
                installDate: new Date('2023-09-18'),
                lastServiceDate: new Date('2025-08-22'),
                status: 'operational',
                description: 'Premium cardiovascular ultrasound with cSound beamformer architecture delivering exceptional 4D TEE and TTE image quality. AI-powered cardiac measurements.',
                totalUsageHours: 10200,
                specifications: { beamformer: 'cSound', imaging: '4D TEE/TTE', AI: 'Auto EF, Auto AVA', display: 'Dual 23"' },
                imageUrl: '/images/equipment/ge-vivid-e95.jpg',
            },
            {
                name: 'Innova IGS 630 Cath Lab',
                model: 'Innova IGS 630',
                manufacturer: 'GE Healthcare',
                category: 'X-Ray',
                serialNumber: 'GE-CL-2022-023',
                clientId: hospitals[1]._id,
                installDate: new Date('2022-04-10'),
                lastServiceDate: new Date('2025-06-18'),
                status: 'operational',
                description: 'Interventional cardiology and radiology system with 30x40cm flat panel detector. Provides hemodynamic monitoring and 3D rotational angiography.',
                totalUsageHours: 25100,
                specifications: { detector: '30x40cm FPD', generator: '100kW', DoseTracking: 'DoseWatch', software: 'Centricity Cardio' },
                imageUrl: '/images/equipment/ge-innova-igs.jpg',
            },
        ];

        const equipment = await Equipment.create(equipmentData);
        console.log(`🔬 ${equipment.length} equipment items created`);

        // Link equipment to hospitals
        for (const eq of equipment) {
            await Client.findByIdAndUpdate(eq.clientId, { $push: { equipmentIds: eq._id } });
        }

        // ===========================
        //  5. CREATE SERVICE TICKETS
        // ===========================
        const tickets = await ServiceTicket.create([
            {
                clientId: hospitals[0]._id,
                equipmentId: equipment[0]._id, // MRI
                createdBy: clientUsers[0]._id,
                assignedEmployee: employees[0]._id,
                status: 'in-progress',
                priority: 'high',
                description: 'The bore of our MAGNETOM Vida 3T MRI is producing an intermittent loud clicking noise during gradient echo sequences. The gradient shim calibration is failing with error code E4521. Last occurrence was during a brain protocol scan at 08:45 AM today.',
                updates: [
                    { updatedBy: admin._id, message: 'Ticket reviewed and assigned to Usman Rafiq (MRI specialist).', status: 'assigned' },
                    { updatedBy: employees[0]._id, message: 'Initial remote diagnostic suggests gradient amplifier issue. Scheduling on-site visit for tomorrow 9 AM.', status: 'in-progress' },
                ],
            },
            {
                clientId: hospitals[1]._id,
                equipmentId: equipment[2]._id, // Ultrasound
                createdBy: clientUsers[1]._id,
                status: 'open',
                priority: 'medium',
                description: 'EPIQ Elite ultrasound system is showing image artifacts on the cardiac preset when using the xMATRIX probe. Artifacts appear as horizontal banding across the sector display. System software was recently updated to version 6.0.2.',
            },
            {
                clientId: hospitals[2]._id,
                equipmentId: equipment[3]._id, // X-Ray
                createdBy: admin._id,
                assignedEmployee: employees[1]._id,
                status: 'assigned',
                priority: 'critical',
                description: 'Ysio Max digital X-ray system is completely non-operational. The system fails to boot past the initialization screen and displays error "DETECTOR_COMM_FAIL". This is our only DR room and we are diverting patients to CR.',
                updates: [
                    { updatedBy: admin._id, message: 'Critical priority — only DR system at CMH. Fatima dispatched immediately.', status: 'assigned' },
                ],
            },
            {
                clientId: hospitals[0]._id,
                equipmentId: equipment[6]._id, // Vivid E95
                createdBy: clientUsers[0]._id,
                assignedEmployee: employees[2]._id,
                status: 'resolved',
                priority: 'low',
                description: 'Vivid E95 needs routine annual preventive maintenance. Last PM was 11 months ago. All functions are normal. Please schedule at earliest convenience.',
                resolvedAt: new Date('2025-12-15'),
                updates: [
                    { updatedBy: employees[2]._id, message: 'PM completed. Cleaned transducers, updated software to v204, calibrated monitors. All within specifications.', status: 'resolved' },
                ],
            },
        ]);
        console.log(`🎫 ${tickets.length} service tickets created`);

        // ===========================
        //  6. CREATE INVENTORY
        // ===========================
        const inventoryItems = await Inventory.create([
            { partName: 'MRI Gradient Amplifier Module', partNumber: 'SH-GA-003T', compatibleModels: ['MAGNETOM Vida', 'MAGNETOM Sola'], category: 'boards', quantityOnHand: 2, reorderThreshold: 1, unitCost: 45000, supplier: 'Siemens Parts Direct' },
            { partName: 'CT X-Ray Tube Assembly', partNumber: 'GE-XRT-128S', compatibleModels: ['Optima CT660', 'Revolution EVO'], category: 'tubes', quantityOnHand: 1, reorderThreshold: 2, unitCost: 85000, supplier: 'GE Parts Portal' },
            { partName: 'Ultrasound xMATRIX Probe', partNumber: 'PH-XM-X6-1', compatibleModels: ['EPIQ Elite', 'EPIQ CVx'], category: 'sensors', quantityOnHand: 3, reorderThreshold: 1, unitCost: 28000, supplier: 'Philips PartnerCare' },
            { partName: 'DR Flat Panel Detector 43x43', partNumber: 'SH-FPD-4343', compatibleModels: ['Ysio Max', 'Multix Impact'], category: 'sensors', quantityOnHand: 0, reorderThreshold: 1, unitCost: 52000, supplier: 'Siemens Parts Direct' },
            { partName: 'MRI RF Body Coil', partNumber: 'GE-RFC-BC70', compatibleModels: ['SIGNA Pioneer', 'SIGNA Artist'], category: 'coils', quantityOnHand: 4, reorderThreshold: 2, unitCost: 15000, supplier: 'GE Parts Portal' },
            { partName: 'Power Supply Board 24V/60A', partNumber: 'GEN-PSB-2460', compatibleModels: ['Optima CT660', 'Vivid E95', 'Innova IGS 630'], category: 'boards', quantityOnHand: 6, reorderThreshold: 3, unitCost: 2200, supplier: 'MedParts International' },
            { partName: 'High Voltage Cable 75kV', partNumber: 'GEN-HVC-75K', compatibleModels: ['Ysio Max', 'Optima CT660', 'Revolution Apex'], category: 'cables', quantityOnHand: 3, reorderThreshold: 2, unitCost: 4500, supplier: 'MedParts International' },
            { partName: 'CT Detector Row Module (16ch)', partNumber: 'GE-DRM-16CH', compatibleModels: ['Revolution Apex', 'Revolution CT'], category: 'sensors', quantityOnHand: 2, reorderThreshold: 1, unitCost: 38000, supplier: 'GE Parts Portal' },
        ]);
        console.log(`📦 ${inventoryItems.length} inventory items created`);

        // ===========================
        //  7. CREATE MAINTENANCE PREDICTIONS (AI demo data)
        // ===========================
        const predictions = await MaintenancePrediction.create([
            {
                equipmentId: equipment[3]._id, // Ysio Max X-Ray (already having issues)
                predictedFailureDate: new Date('2026-03-15'),
                confidence: 0.92,
                failureType: 'Detector Communication Failure',
                modelVersion: '1.0.0',
                recommendations: 'Replace flat panel detector communication board. Order part SH-FPD-COMM. Estimated repair time: 4 hours.',
            },
            {
                equipmentId: equipment[1]._id, // Optima CT660
                predictedFailureDate: new Date('2026-04-22'),
                confidence: 0.78,
                failureType: 'X-Ray Tube Degradation',
                modelVersion: '1.0.0',
                recommendations: 'X-ray tube approaching end of life at 18,200 hours (rated for 20,000). Schedule tube replacement within next 60 days. 1 tube in inventory — order backup.',
            },
            {
                equipmentId: equipment[7]._id, // Innova IGS
                predictedFailureDate: new Date('2026-05-10'),
                confidence: 0.65,
                failureType: 'Generator Output Instability',
                modelVersion: '1.0.0',
                recommendations: 'High voltage generator showing intermittent output fluctuations at high mA settings. Monitor closely and schedule preventive calibration.',
            },
        ]);
        console.log(`🤖 ${predictions.length} AI maintenance predictions created`);

        // ===========================
        //  SUMMARY
        // ===========================
        console.log('\n' + '='.repeat(50));
        console.log('  🌱 DATABASE SEEDED SUCCESSFULLY');
        console.log('='.repeat(50));
        console.log('\n📋 Login Credentials:');
        console.log('   Admin:      admin@medquad.com     / Admin@2026');
        console.log('   Client 1:   ahmed@shifa.com.pk    / Client@2026');
        console.log('   Client 2:   sarah@aku.edu         / Client@2026');
        console.log('   Employee: usman@medquad.com     / Emp@2026');
        console.log('   Employee: fatima@medquad.com    / Emp@2026');
        console.log('   Employee: hassan@medquad.com    / Emp@2026\n');

        if (require.main === module) {
            process.exit(0);
        }
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        if (require.main === module) {
            process.exit(1);
        }
    }
};

if (require.main === module) {
    seedDatabase();
}

module.exports = seedDatabase;
