const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/* ================= CORS CONFIG ================= */

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://surpluz.vercel.app"
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow Postman / curl / mobile apps
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.log("Blocked by CORS:", origin);
      return callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Enable CORS FIRST
app.use(cors(corsOptions));

// Express v5 preflight fix
app.options(/.*/, cors(corsOptions));

/* ================================================= */

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl} - Origin: ${req.headers.origin}`);
  next();
});

// Health Check
app.get('/health', (req, res) =>
  res.status(200).json({ status: 'OK', message: 'Server is running' })
);

// DB Status Middleware
app.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message:
        'Database connection failed. Add MONGO_URI in environment variables.',
      status: mongoose.connection.readyState,
    });
  }
  next();
});

/* ================= ROUTES ================= */

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/listings', require('./routes/listingRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/vendors', require('./routes/vendorRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

/* ================= DB CONNECTION ================= */

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('MongoDB Connected Successfully');

    const { startExpirationScheduler } = require('./utils/expirationScheduler');
    startExpirationScheduler();
  } catch (err) {
    console.error('MongoDB Connection Error:', err.message);
    console.log('Falling back to in-memory DB');

    try {
      require.resolve('mongodb-memory-server');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      await mongoose.connect(uri);
      console.log(`MongoDB Connected (Memory at ${uri})`);

      const { startExpirationScheduler } = require('./utils/expirationScheduler');
      startExpirationScheduler();
    } catch (memErr) {
      console.error('Memory DB Failed:', memErr.message);
    }
  }
};

startServer();

/* ================= ROOT ================= */

app.get('/', (req, res) => {
  res.send('Surplus Food Marketplace API is running');
});

/* ================= START SERVER ================= */

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
