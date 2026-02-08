const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://surplusbackend-production.up.railway.app/",
  
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Log all requests with timing
app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl} - Origin: ${req.headers.origin}`);
    next();
});

// Health Check (Bypass DB check)
app.get('/health', (req, res) => res.status(200).json({ status: 'OK', message: 'Server is running' }));

// DB Status Middleware
app.use((req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ message: 'Database not connected yet. Server is starting up or failed to connect.' });
    }
    next();
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/listings', require('./routes/listingRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/vendors', require('./routes/vendorRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/users', require('./routes/userRoutes'));






// DB Connection Logic with Fallback
const startServer = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
        console.log('MongoDB Connected Successfully');
        
        // Start automatic listing expiration scheduler
        const { startExpirationScheduler } = require('./utils/expirationScheduler');
        startExpirationScheduler();
    } catch (err) {
        console.error('CRITICAL: Initial MongoDB Connection Error:', err.message);
        console.log('--------------------------------------------------');
        console.log('ATTENTION: FALLING BACK TO IN-MEMORY DATABASE');
        console.log('DATA WILL BE LOST UPON RESTART. THIS IS LIKELY');
        console.log('BECAUSE MONGO_URI IS MISSING OR INCORRECT IN ENVIRONMENT');
        console.log('--------------------------------------------------');
        try {
            // Check if package exists before requiring
            require.resolve('mongodb-memory-server');
            const { MongoMemoryServer } = require('mongodb-memory-server');
            const mongod = await MongoMemoryServer.create();
            const uri = mongod.getUri();
            await mongoose.connect(uri);
            console.log(`MongoDB Connected Successfully (In-Memory Fallback at ${uri})`);
            
            const { startExpirationScheduler } = require('./utils/expirationScheduler');
            startExpirationScheduler();
        } catch (memErr) {
            console.error('DB FALLBACK FAILED:', memErr.message);
            console.log('Please ensure MONGO_URI is correct in .env');
        }
    }
};
startServer();

// Routes (Placeholder)
app.get('/', (req, res) => {
    res.send('Surplus Food Marketplace API is running');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
