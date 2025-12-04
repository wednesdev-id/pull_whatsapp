const express = require('express');
const cors = require('cors');
const path = require('path');

// Import API handlers
const messagesHandler = require('./api/v1/messages');
const contactsHandler = require('./api/v1/contacts');
const indexHandler = require('./api/index');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from output directory
app.use('/output', express.static(path.join(__dirname, 'output')));
app.use('/messagesId', express.static(path.join(__dirname, 'messagesId')));

// API Routes
app.get('/', indexHandler);
app.get('/api', indexHandler);

// Messages API
app.all('/api/v1/messages', messagesHandler);

// Contacts API
app.all('/api/v1/contacts', contactsHandler);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    type: 'error',
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    type: 'error',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 WhatsApp Data API Server running on http://localhost:${PORT}`);
  console.log(`📊 API Documentation:`);
  console.log(`   GET  http://localhost:${PORT}/api/v1/messages - Get messages`);
  console.log(`   GET  http://localhost:${PORT}/api/v1/contacts - Get contacts`);
  console.log(`   GET  http://localhost:${PORT}/output - View JSON files`);
  console.log(`   GET  http://localhost:${PORT}/health - Health check`);
});

module.exports = app;