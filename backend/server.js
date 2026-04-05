require('dotenv').config();
const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const connectDB  = require('./config/db');

// Routes
const authRoutes    = require('./routes/auth');
const uploadRoutes  = require('./routes/upload');
const orderRoutes   = require('./routes/orders');
const paymentRoutes = require('./routes/payment');
const userRoutes    = require('./routes/users');

const app    = express();
const server = http.createServer(app);

// ─── Socket.io ────────────────────────────────────────────────────────────────
const io = new Server(server, {
    cors: {
        origin:  process.env.CLIENT_URL || '*',
        methods: ['GET', 'POST', 'PATCH', 'DELETE']
    }
});

// Make io accessible in routes via req.app.get('io')
app.set('io', io);

io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Student joins their own room to receive personal order updates
    socket.on('join:user', (email) => {
        socket.join(email);
        console.log(`👤 ${email} joined their room`);
    });

    socket.on('disconnect', () => {
        console.log(`❌ Client disconnected: ${socket.id}`);
    });
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
    origin:      process.env.CLIENT_URL || '*',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/upload',  uploadRoutes);
app.use('/api/orders',  orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/users',   userRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'PrintEase API is running 🖨️', env: process.env.NODE_ENV });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err.message);
    res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error.' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`\n🚀 PrintEase API running on http://localhost:${PORT}`);
        console.log(`📡 Socket.io ready for real-time updates`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV}\n`);
    });
});
