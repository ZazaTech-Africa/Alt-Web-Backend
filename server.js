const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const passport = require('passport');
const session = require('express-session');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const businessRoutes = require('./routes/business');
const dashboardRoutes = require('./routes/dashboard');
const orderRoutes = require('./routes/orders');
const driverRoutes = require('./routes/drivers');
const shipmentRoutes = require('./routes/shipments');

const errorHandler = require('./middleware/errorHandler');
const corsErrorHandler = require('./middleware/cors');

require('./config/passport');

const app = express();

// Trust proxy for Render deployment
app.set('trust proxy', 1);

app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later."
  }
});
app.use(limiter);

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://alt-web-phi.vercel.app",
  "https://alt-web-frontend.vercel.app",
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`Blocked by CORS: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Content-Length", "X-Content-Type-Options"],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.options("*", cors());

// Store allowed origins in app settings for error handler to access
app.set('allowedOrigins', allowedOrigins);

// Use CORS error handler
app.use(corsErrorHandler);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  limits: { fileSize: process.env.MAX_FILE_SIZE || 5 * 1024 * 1024 },
}));


app.use(passport.initialize());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

const connectDB = async () => {
  try {
    const dbURI = process.env.NODE_ENV === 'test'
      ? process.env.MONGODB_TEST_URI
      : process.env.MONGODB_URI;

    await mongoose.connect(dbURI, { dbName: "alt-web-app" });

    console.log(`✅ MongoDB connected successfully (${process.env.NODE_ENV})`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/shipments", shipmentRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SHARPERLY Logistics API is running!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: "1.0.0",
    cors: {
      origin: req.headers.origin || 'No origin header',
      allowed: allowedOrigins.includes(req.headers.origin) || !req.headers.origin
    }
  });
});

app.get("/api/cors-test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "CORS is working correctly!",
    requestOrigin: req.headers.origin || 'No origin header',
    allowedOrigins: allowedOrigins,
    isAllowed: allowedOrigins.includes(req.headers.origin) || !req.headers.origin
  });
});

app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 SHARPERLY Logistics Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV}`);
    console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
  });
}

module.exports = app;
