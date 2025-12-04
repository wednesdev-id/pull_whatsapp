const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3002; // Use different port to avoid conflicts

// Middleware
app.use(cors());
app.use(express.json());

// Helper functions
const parseJSONFile = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error.message);
    return [];
  }
};

const formatTimestamp = (timestamp) => {
  return new Date(timestamp * 1000).toISOString();
};

// Get messages endpoint
app.get('/api/messages', (req, res) => {
  try {
    const {
      contact_id,
      limit = 50,
      offset = 0,
      sort = 'timestamp',
      order = 'asc'
    } = req.query;

    const dataFile = path.join(__dirname, 'output', 'data_saya.json');
    let messages = parseJSONFile(dataFile);

    // Filter by contact
    if (contact_id) {
      messages = messages.filter(msg =>
        msg.from_user === contact_id || msg.to_user === contact_id
      );
    }

    // Sort messages
    messages.sort((a, b) => {
      const aVal = a[sort] || 0;
      const bVal = b[sort] || 0;
      const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      return order === 'desc' ? -comparison : comparison;
    });

    // Pagination
    const total = messages.length;
    const startIndex = parseInt(offset) || 0;
    const limitCount = parseInt(limit) || 50;
    messages = messages.slice(startIndex, startIndex + limitCount);

    res.json({
      success: true,
      data: messages,
      message: `Retrieved ${messages.length} messages`,
      metadata: {
        total,
        count: messages.length,
        pagination: {
          limit: limitCount,
          offset: startIndex,
          hasMore: startIndex + limitCount < total
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in GET /api/messages:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get contacts endpoint
app.get('/api/contacts', (req, res) => {
  try {
    const { limit = 100, offset = 0, search } = req.query;

    const contactsFile = path.join(__dirname, 'output', 'kontak_saya.json');
    let contacts = parseJSONFile(contactsFile);

    // Search filter
    if (search) {
      const searchTerm = search.toLowerCase();
      contacts = contacts.filter(contact =>
        (contact.name && contact.name.toLowerCase().includes(searchTerm)) ||
        (contact.id && contact.id.toLowerCase().includes(searchTerm))
      );
    }

    // Sort by name
    contacts.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    // Pagination
    const total = contacts.length;
    const startIndex = parseInt(offset) || 0;
    const limitCount = parseInt(limit) || 100;
    contacts = contacts.slice(startIndex, startIndex + limitCount);

    res.json({
      success: true,
      data: contacts,
      message: `Retrieved ${contacts.length} contacts`,
      metadata: {
        total,
        count: contacts.length,
        pagination: {
          limit: limitCount,
          offset: startIndex,
          hasMore: startIndex + limitCount < total
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in GET /api/contacts:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get conversations (latest message per contact)
app.get('/api/conversations', (req, res) => {
  try {
    const messagesFile = path.join(__dirname, 'output', 'data_saya.json');
    const contactsFile = path.join(__dirname, 'output', 'kontak_saya.json');

    const messages = parseJSONFile(messagesFile);
    const contacts = parseJSONFile(contactsFile);

    // Create contact map for names
    const contactMap = {};
    contacts.forEach(contact => {
      if (contact.id && contact.name) {
        contactMap[contact.id] = contact.name;
      }
    });

    // Group messages by contact and get latest
    const latestMessages = {};
    messages.forEach(msg => {
      const contactId = msg.from_user === '6283197301645@c.us' ? msg.to_user : msg.from_user;
      if (!latestMessages[contactId] || msg.timestamp > latestMessages[contactId].timestamp) {
        latestMessages[contactId] = msg;
      }
    });

    // Create conversations array
    const conversations = Object.entries(latestMessages).map(([contactId, msg]) => ({
      id: contactId,
      name: contactMap[contactId] || contactId,
      phone: contactId.replace('@c.us', '').replace('@g.us', ''),
      lastMessage: msg.message || 'Media message',
      timestamp: msg.timestamp,
      time: formatMessageTime(msg.timestamp),
      unread: Math.floor(Math.random() * 5), // Simulated unread count
      isOnline: Math.random() > 0.5, // Simulated online status
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(contactMap[contactId] || contactId)}&background=random`
    }));

    // Sort by latest message
    conversations.sort((a, b) => b.timestamp - a.timestamp);

    res.json({
      success: true,
      data: conversations,
      message: `Retrieved ${conversations.length} conversations`,
      metadata: {
        count: conversations.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in GET /api/conversations:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Helper function to format time
function formatMessageTime(timestamp) {
  const now = new Date();
  const messageDate = new Date(timestamp * 1000);
  const diffInHours = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60));

  if (diffInHours < 1) {
    const diffInMinutes = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60));
    return `${diffInMinutes}m`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h`;
  } else if (diffInHours < 24 * 7) {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d`;
  } else {
    return messageDate.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Serve static files
app.use('/output', express.static(path.join(__dirname, 'output')));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple WhatsApp API Server running on http://localhost:${PORT}`);
  console.log(`📊 Available endpoints:`);
  console.log(`   GET  http://localhost:${PORT}/api/messages - Get messages`);
  console.log(`   GET  http://localhost:${PORT}/api/contacts - Get contacts`);
  console.log(`   GET  http://localhost:${PORT}/api/conversations - Get conversations`);
  console.log(`   GET  http://localhost:${PORT}/health - Health check`);
});

module.exports = app;