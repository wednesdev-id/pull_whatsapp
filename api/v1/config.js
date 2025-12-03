const fs = require('fs');
const path = require('path');

// Configuration constants
const CONFIG = {
  // Directories
  INPUT_DIR: path.join(process.cwd(), 'input'),
  OUTPUT_DIR: path.join(process.cwd(), 'output'),
  CHATID_DIR: path.join(process.cwd(), 'chatId'),
  MESSAGESID_DIR: path.join(process.cwd(), 'messagesId'),

  // File extensions
  JSON_EXT: '.json',
  BACKUP_EXT: '.bak',

  // API settings
  API_VERSION: 'v1',
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_MIME_TYPES: ['application/json'],

  // Response formats
  RESPONSE_TYPES: {
    SUCCESS: 'success',
    ERROR: 'error',
    PARTIAL: 'partial'
  },

  // HTTP status codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503
  },

  // File patterns
  FILE_PATTERNS: {
    CONTACTS: /kontak|contact|coworker|devteam|person/i,
    MESSAGES: /data|message|pesan|response/i,
    BACKUP: /backup|old|archive/i
  },

  // Default field mappings
  DEFAULT_FIELDS: {
    contacts: ['id', 'name', 'last_message', 'last_from', 'timestamp'],
    messages: ['timestamp', 'from', 'to', 'body', 'datetime', 'fromMe', 'source', 'hasMedia']
  }
};

// Utility functions
const Utils = {
  // Sanitize filename to prevent directory traversal
  sanitizeFilename: (filename) => {
    if (!filename || typeof filename !== 'string') {
      return null;
    }

    // Remove any path components and keep only the filename
    const baseName = filename.replace(/.*[\/\\]/, '').replace(/[^a-zA-Z0-9._-]/g, '');

    // Ensure .json extension
    if (!baseName.endsWith(CONFIG.JSON_EXT)) {
      return baseName + CONFIG.JSON_EXT;
    }

    return baseName;
  },

  // Validate if file exists and is readable
  validateFile: (filePath) => {
    try {
      const stats = fs.statSync(filePath);
      return stats.isFile() && stats.size <= CONFIG.MAX_FILE_SIZE;
    } catch (error) {
      return false;
    }
  },

  // Get file metadata
  getFileMetadata: (filePath) => {
    try {
      const stats = fs.statSync(filePath);
      const fileName = path.basename(filePath);

      return {
        name: fileName,
        path: filePath,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        extension: path.extname(fileName),
        type: Utils.getFileType(fileName)
      };
    } catch (error) {
      return null;
    }
  },

  // Determine file type based on filename
  getFileType: (filename) => {
    if (CONFIG.FILE_PATTERNS.CONTACTS.test(filename)) {
      return 'contacts';
    }
    if (CONFIG.FILE_PATTERNS.MESSAGES.test(filename)) {
      return 'messages';
    }
    if (CONFIG.FILE_PATTERNS.BACKUP.test(filename)) {
      return 'backup';
    }
    return 'unknown';
  },

  // Get list of files in directory
  getFilesInDir: (dir, filter = null) => {
    try {
      if (!fs.existsSync(dir)) {
        return [];
      }

      let files = fs.readdirSync(dir)
        .filter(file => file.endsWith(CONFIG.JSON_EXT));

      if (filter) {
        files = files.filter(filter);
      }

      return files.map(file => Utils.getFileMetadata(path.join(dir, file)))
        .filter(Boolean);
    } catch (error) {
      return [];
    }
  },

  // Parse and validate JSON file
  parseJSONFile: (filePath) => {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);

      // Ensure data is an array for consistency
      return Array.isArray(data) ? data : [data];
    } catch (error) {
      throw new Error(`Invalid JSON in file: ${error.message}`);
    }
  },

  // Save data to JSON file with backup
  saveJSONFile: (filePath, data) => {
    try {
      // Create backup if file exists
      if (fs.existsSync(filePath)) {
        const backupPath = filePath + CONFIG.BACKUP_EXT;
        fs.copyFileSync(filePath, backupPath);
      }

      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Save file with pretty formatting
      const jsonString = JSON.stringify(data, null, 2);
      fs.writeFileSync(filePath, jsonString, 'utf-8');

      return true;
    } catch (error) {
      throw new Error(`Failed to save file: ${error.message}`);
    }
  },

  // Create standard API response
  createResponse: (type, data = null, message = null, metadata = {}) => {
    const response = {
      success: type === CONFIG.RESPONSE_TYPES.SUCCESS,
      type,
      timestamp: new Date().toISOString(),
      ...metadata
    };

    if (data !== null) {
      response.data = data;
    }

    if (message) {
      response.message = message;
    }

    return response;
  },

  // Extract phone number from WhatsApp ID
  extractPhone: (whatsappId) => {
    if (!whatsappId || typeof whatsappId !== 'string') {
      return null;
    }

    // Remove @c.us or @g.us suffix
    const cleanId = whatsappId.replace(/@c\.us$|@g\.us$/, '');

    // Add + for international format if missing
    if (cleanId.startsWith('0')) {
      return cleanId.replace(/^0/, '+62'); // Indonesia default
    }

    return cleanId;
  },

  // Format WhatsApp ID
  formatWhatsAppId: (phone) => {
    if (!phone || typeof phone !== 'string') {
      return null;
    }

    // Remove all non-numeric characters
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    // Add @c.us for individual or @g.us for group
    if (cleanPhone.length < 10) {
      return null; // Invalid phone number
    }

    return cleanPhone + '@c.us';
  },

  // Format timestamp
  formatTimestamp: (timestamp) => {
    if (!timestamp) return null;

    const date = new Date(timestamp);
    return {
      iso: date.toISOString(),
      local: date.toLocaleString('id-ID'),
      unix: date.getTime(),
      readable: date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  }
};

module.exports = {
  CONFIG,
  Utils
};