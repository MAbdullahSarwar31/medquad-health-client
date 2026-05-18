const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const cron = require('node-cron');
const connectDB = require('./config/db');
const http = require('http');
const { Server } = require('socket.io');
const { generatePredictions } = require('./services/predictiveMaintenanceService');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Allow multiple origins: localhost (dev), Vercel deploy, and custom domain
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.CLIENT_URL,
    'https://medquadhealth.com',
    'https://www.medquadhealth.com',
    'https://medquad-health-client.vercel.app',
].filter(Boolean);

// Setup Socket.io
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Make io accessible in routes/controllers
app.set('io', io);

io.on('connection', (socket) => {
    console.log(`Client connected to socket: ${socket.id}`);

    socket.on('joinRoom', (room) => {
        socket.join(room);
        console.log(`Socket ${socket.id} joined room ${room}`);
    });

    // Join personal user room for targeted notifications
    socket.on('joinUserRoom', (userId) => {
        if (userId) {
            socket.join(`room:user:${userId}`);
            console.log(`Socket ${socket.id} joined personal room: room:user:${userId}`);
        }
    });

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

// ---------------------
//   SECURITY MIDDLEWARE
// ---------------------
app.use(helmet());

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS policy: Origin ${origin} is not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ---------------------
//   PARSING MIDDLEWARE
// ---------------------
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ---------------------
//   LOGGING
// ---------------------
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// ---------------------
//   API ROUTES
// ---------------------
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/users', require('./routes/userRoutes'));
app.use('/api/v1/clients', require('./routes/clientRoutes'));
app.use('/api/v1/equipment', require('./routes/equipmentRoutes'));
app.use('/api/v1/tickets', require('./routes/ticketRoutes'));
app.use('/api/v1/inventory', require('./routes/inventoryRoutes'));
app.use('/api/v1/expenses', require('./routes/expenseRoutes'));
app.use('/api/v1/invoices', require('./routes/invoiceRoutes'));
app.use('/api/v1/chat',          require('./routes/chatRoutes'));           // AI chatbot (public)
app.use('/api/v1/predictions',   require('./routes/predictionRoutes'));    // AI Predictive Maintenance
app.use('/api/v1/notifications', require('./routes/notificationRoutes')); // Notification Center
app.use('/api/v1/equipment-requests', require('./routes/equipmentRequestRoutes')); // Equipment Add/Remove Requests
app.use('/api/v1/fix', require('./routes/fixRoutes')); // Temporary fix route



// ---------------------
//   HEALTH CHECK
// ---------------------
app.get('/api/v1/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
    });
});

// ---------------------
//   404 HANDLER
// ---------------------
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
});

// ---------------------
//   GLOBAL ERROR HANDLER
// ---------------------
app.use(require('./middleware/errorHandler'));

// ---------------------
//   CRON JOBS
// ---------------------
// Run predictive maintenance analysis every night at 2:00 AM
cron.schedule('0 2 * * *', () => {
    console.log('[Cron] Triggering nightly predictive maintenance analysis...');
    generatePredictions();
});

// Run it once on startup for demonstration/testing purposes
if (process.env.NODE_ENV === 'development') {
    setTimeout(() => {
        generatePredictions();
    }, 5000);
}

// ---------------------
//   START SERVER
// ---------------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`\n🚀 Medquad Health Solutions API Server`);
    console.log(`   Environment : ${process.env.NODE_ENV}`);
    console.log(`   Port        : ${PORT}`);
    console.log(`   Client URL  : ${process.env.CLIENT_URL}`);
    console.log(`   Health Check: http://localhost:${PORT}/api/v1/health\n`);
});
