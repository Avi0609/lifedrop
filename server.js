const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./db');
const donorsRouter = require('./routes/donors');
const searchRouter = require('./routes/search');
const centersRouter = require('./routes/centers');
const requestsRouter = require('./routes/requests');
const statsRouter = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static assets (HTML, CSS, JS, etc.)
app.use(express.static(path.join(__dirname)));

// API Routes
app.use('/api/donors', donorsRouter);
app.use('/api/search', searchRouter);
app.use('/api/centers', centersRouter);
app.use('/api/requests', requestsRouter);
app.use('/api/stats', statsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    database: db.type
  });
});

// Explicit route for homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 404 handler for unmatched API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, error: 'API endpoint not found' });
  }
  next();
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});

// Initialize database and start listening
async function startServer() {
  try {
    await db.initDb();
    app.listen(PORT, '0.0.0.0', () => {
      console.log('====================================================');
      console.log(`🩸 LifeDrop Blood Donation & Search Server Running!`);
      console.log(`📡 Local Web & API: http://localhost:${PORT}`);
      console.log(`🌐 Also accessible: http://127.0.0.1:${PORT}`);
      console.log(`🔍 Search Endpoint: http://localhost:${PORT}/api/search`);
      console.log(`❤️  Donors Endpoint: http://localhost:${PORT}/api/donors`);
      console.log(`🏥 Centers Endpoint: http://localhost:${PORT}/api/centers`);
      console.log(`📊 Stats Endpoint:   http://localhost:${PORT}/api/stats`);
      console.log(`💾 Database:         ${db.type.toUpperCase()}`);
      console.log('====================================================');
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
