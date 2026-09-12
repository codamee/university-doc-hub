require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const db = require('./config/db');
const { seedInitialData } = require('./seeds/seedData');

// Route imports
const authRoutes = require('./routes/authRoutes');
const caseRoutes = require('./routes/caseRoutes');
const documentRoutes = require('./routes/documentRoutes');
const aiRoutes = require('./routes/aiRoutes');
const exceptionRoutes = require('./routes/exceptionRoutes');
const validationRoutes = require('./routes/validationRoutes');
const supervisorRoutes = require('./routes/supervisorRoutes');
const reportRoutes = require('./routes/reportRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const userRoutes = require('./routes/userRoutes');
const auditRoutes = require('./routes/auditRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// Static uploads folder
const uploadDir = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadDir));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'Higher Education Intelligent Document Intake & Decision Hub API',
    timestamp: new Date().toISOString(),
    geminiModel: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
    database: db.isMongoConnected() ? 'MongoDB Atlas (Connected)' : 'Local File/Memory Store (Active)',
    uptimeSeconds: Math.floor(process.uptime())
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/exceptions', exceptionRoutes);
app.use('/api/validation', validationRoutes);
app.use('/api/supervisor', supervisorRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit', auditRoutes);

// Serve Frontend Production Build if present
const frontendDist = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// Boot server
const startServer = async () => {
  await db.initDB();
  await seedInitialData();

  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(` IntelliDoc Hub Server Running on Port: ${PORT}`);
    console.log(` Health check: http://localhost:${PORT}/api/health`);
    console.log(` Database: ${db.isMongoConnected() ? 'MongoDB Atlas' : 'Local Persistent Store'}`);
    console.log(` Gemini AI Model: ${process.env.GEMINI_MODEL || 'gemini-3.6-flash'}`);
    console.log(`=======================================================`);
  });
};

startServer();
