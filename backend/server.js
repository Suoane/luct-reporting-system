const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Import middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

// Security middleware
app.use(helmet());

// CORS configuration with multiple origins
const allowedOrigins = [
  'http://localhost:3000',
  'https://luct-reporting-system-frontend-delta.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// Import Routes
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const coursesRoutes = require('./routes/courses');
const classesRoutes = require('./routes/classes');
const reportsRoutes = require('./routes/reports');
const dashboardRoutes = require('./routes/dashboard');
const streamsRoutes = require('./routes/streams');

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to LUCT Reporting System API',
    version: '1.0.0',
    status: 'active',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      courses: '/api/courses',
      classes: '/api/classes',
      reports: '/api/reports',
      dashboard: '/api/dashboard',
      streams: '/api/streams',
    },
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'LUCT Reporting System API is running',
    database: process.env.DB_NAME || 'luct_report_tumelo',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/classes', classesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/streams', streamsRoutes);

// 404 handler - must be after all routes
app.use(notFound);

// Global error handling middleware - must be last
app.use(errorHandler);

// Server configuration
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Important for Render!

// Start server with HOST binding
const server = app.listen(PORT, HOST, () => {
  console.log('='.repeat(50));
  console.log(`🚀 LUCT Reporting System Server`);
  console.log(`📡 Server running on ${HOST}:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: ${process.env.DB_NAME || 'luct_report_tumelo'}`);
  console.log(`🔒 CORS Origins: ${allowedOrigins.join(', ')}`);
  console.log(`🔑 JWT Secret: ${process.env.JWT_SECRET ? '✓ Configured' : '✗ Not configured'}`);
  console.log('='.repeat(50));
  console.log('📋 Available Endpoints:');
  console.log(`   GET  /                    - API Info`);
  console.log(`   GET  /api/health          - Health Check`);
  console.log(`   POST /api/auth/login      - User Login`);
  console.log(`   POST /api/auth/register   - User Registration`);
  console.log(`   GET  /api/streams         - Get All Streams`);
  console.log(`   GET  /api/courses         - Get All Courses`);
  console.log(`   GET  /api/classes         - Get All Classes`);
  console.log(`   GET  /api/reports         - Get All Reports`);
  console.log(`   GET  /api/dashboard/:role - Get Dashboard Data`);
  console.log('='.repeat(50));
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  // Don't exit immediately on uncaught exception during startup
  if (server && server.listening) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});

module.exports = app;
