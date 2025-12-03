const { CONFIG, Utils } = require('./config');

// Validation utilities
const Validator = {
  // Validate WhatsApp ID format
  isValidWhatsAppId: (id) => {
    if (!id || typeof id !== 'string') return false;
    // Basic validation - should contain numbers and end with @c.us or @g.us
    return /^([0-9]+)@(c\.us|g\.us)$/.test(id) || /^[0-9]+$/.test(id);
  },

  // Validate email format
  isValidEmail: (email) => {
    if (!email || typeof email !== 'string') return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  // Validate date string
  isValidDateString: (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  },

  // Validate file size within limits
  isValidFileSize: (size) => {
    return typeof size === 'number' && size >= 0 && size <= CONFIG.MAX_FILE_SIZE;
  },

  // Validate required fields for contact
  validateContact: (contact) => {
    const errors = [];

    if (!contact.id) errors.push('Contact ID is required');
    if (!contact.name) errors.push('Contact name is required');
    if (contact.id && !Validator.isValidWhatsAppId(contact.id)) {
      errors.push('Invalid WhatsApp ID format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Validate required fields for message
  validateMessage: (message) => {
    const errors = [];

    if (!message.from) errors.push('Message "from" field is required');
    if (!message.to) errors.push('Message "to" field is required');

    if (message.from && !Validator.isValidWhatsAppId(message.from)) {
      errors.push('Invalid "from" WhatsApp ID format');
    }

    if (message.to && !Validator.isValidWhatsAppId(message.to)) {
      errors.push('Invalid "to" WhatsApp ID format');
    }

    if (!message.body && !message.message && !message.hasMedia) {
      errors.push('Message must have body/message content or hasMedia=true');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Sanitize and validate query parameters
  sanitizeQuery: (query) => {
    const sanitized = {};

    for (const [key, value] of Object.entries(query)) {
      if (typeof value === 'string') {
        // Remove HTML and script tags
        sanitized[key] = value.replace(/<[^>]*>/g, '').trim();
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  },

  // Validate pagination parameters
  validatePagination: (limit = 100, offset = 0) => {
    const limitNum = parseInt(limit) || 100;
    const offsetNum = parseInt(offset) || 0;

    return {
      limit: Math.min(Math.max(limitNum, 1), 1000), // Between 1 and 1000
      offset: Math.max(offsetNum, 0) // Cannot be negative
    };
  },

  // Validate and parse date range
  validateDateRange: (start_date, end_date) => {
    let startDate = null;
    let endDate = null;

    if (start_date) {
      if (Validator.isValidDateString(start_date)) {
        startDate = new Date(start_date).getTime();
      } else {
        throw new Error('Invalid start_date format. Use ISO date string.');
      }
    }

    if (end_date) {
      if (Validator.isValidDateString(end_date)) {
        endDate = new Date(end_date).getTime();
      } else {
        throw new Error('Invalid end_date format. Use ISO date string.');
      }
    }

    if (startDate && endDate && startDate >= endDate) {
      throw new Error('start_date must be before end_date');
    }

    return { startDate, endDate };
  }
};

// Response utilities
const ResponseHelper = {
  // Create success response with metadata
  success: (data, message = null, metadata = {}) => {
    return Utils.createResponse(CONFIG.RESPONSE_TYPES.SUCCESS, data, message, {
      ...metadata,
      timestamp: new Date().toISOString()
    });
  },

  // Create error response with metadata
  error: (message, statusCode = 500, metadata = {}) => {
    return Utils.createResponse(CONFIG.RESPONSE_TYPES.ERROR, null, message, {
      ...metadata,
      status_code: statusCode,
      timestamp: new Date().toISOString()
    });
  },

  // Create pagination metadata
  paginationMeta: (total, count, limit, offset) => ({
    pagination: {
      total_items: total,
      current_items: count,
      items_per_page: limit,
      current_page: Math.floor(offset / limit) + 1,
      total_pages: Math.ceil(total / limit),
      has_next_page: offset + limit < total,
      has_prev_page: offset > 0,
      next_offset: offset + limit < total ? offset + limit : null,
      prev_offset: Math.max(0, offset - limit)
    }
  }),

  // Create filter metadata
  filterMeta: (filters) => ({
    filters_applied: filters,
    active_filters: Object.entries(filters)
      .filter(([key, value]) => value !== undefined && value !== null && value !== '')
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
  })
};

// File utilities
const FileHelper = {
  // Get safe filename
  getSafeFilename: (filename, maxLength = 255) => {
    if (!filename || typeof filename !== 'string') {
      return `file_${Date.now()}.json`;
    }

    // Remove directory traversal attempts
    let safeName = filename.replace(/.*[\/\\]/, '').replace(/[^a-zA-Z0-9._-]/g, '_');

    // Ensure .json extension
    if (!safeName.endsWith('.json')) {
      safeName += '.json';
    }

    // Limit length
    if (safeName.length > maxLength) {
      const nameWithoutExt = safeName.substring(0, maxLength - 5);
      safeName = nameWithoutExt + '.json';
    }

    return safeName;
  },

  // Create backup filename
  getBackupFilename: (originalFilename) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const nameWithoutExt = originalFilename.replace(/\.json$/, '');
    return `${nameWithoutExt}.backup.${timestamp}.json`;
  },

  // Ensure directory exists
  ensureDirectory: (dirPath) => {
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      return true;
    } catch (error) {
      console.error('Failed to create directory:', error.message);
      return false;
    }
  },

  // Check file accessibility
  isFileAccessible: (filePath) => {
    try {
      if (!fs.existsSync(filePath)) {
        return { accessible: false, reason: 'File does not exist' };
      }

      const stats = fs.statSync(filePath);
      if (!stats.isFile()) {
        return { accessible: false, reason: 'Path is not a file' };
      }

      if (stats.size > CONFIG.MAX_FILE_SIZE) {
        return { accessible: false, reason: 'File too large' };
      }

      // Try to read a small portion to verify it's accessible
      try {
        fs.readFileSync(filePath, { start: 0, end: 1 });
        return { accessible: true, reason: null, stats };
      } catch (readError) {
        return { accessible: false, reason: 'File not readable' };
      }
    } catch (error) {
      return { accessible: false, reason: error.message };
    }
  },

  // Get file statistics
  getFileStats: async (directory) => {
    try {
      if (!fs.existsSync(directory)) {
        return {
          total_files: 0,
          total_size: 0,
          file_types: {},
          error: null
        };
      }

      const files = fs.readdirSync(directory);
      let totalSize = 0;
      const fileTypes = {};

      for (const file of files) {
        const filePath = path.join(directory, file);
        try {
          const stats = fs.statSync(filePath);
          if (stats.isFile() && file.endsWith('.json')) {
            totalSize += stats.size;
            const type = Utils.getFileType(file);
            fileTypes[type] = (fileTypes[type] || 0) + 1;
          }
        } catch (error) {
          // Skip files that can't be accessed
        }
      }

      return {
        total_files: files.filter(f => f.endsWith('.json')).length,
        total_size: totalSize,
        file_types: fileTypes,
        error: null
      };
    } catch (error) {
      return {
        total_files: 0,
        total_size: 0,
        file_types: {},
        error: error.message
      };
    }
  }
};

// WhatsApp utilities
const WhatsAppHelper = {
  // Format phone number to WhatsApp ID
  formatPhoneToWhatsAppId: (phone) => {
    if (!phone) return null;

    // Remove all non-numeric characters
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    // Validate minimum length
    if (cleanPhone.length < 10) return null;

    // Add Indonesia country code if needed (starting with 0)
    let formattedPhone = cleanPhone;
    if (cleanPhone.startsWith('0')) {
      formattedPhone = '62' + cleanPhone.substring(1);
    }

    return formattedPhone + '@c.us';
  },

  // Extract phone number from WhatsApp ID
  extractPhoneFromId: (whatsappId) => {
    if (!whatsappId || typeof whatsappId !== 'string') return null;

    // Remove @c.us or @g.us suffix
    const cleanId = whatsappId.replace(/@(c\.us|g\.us)$/, '');

    // Validate that it's all numbers
    if (!/^[0-9]+$/.test(cleanId)) return null;

    return cleanId;
  },

  // Format WhatsApp ID for display
  formatWhatsAppIdForDisplay: (whatsappId) => {
    const phone = WhatsAppHelper.extractPhoneFromId(whatsappId);
    if (!phone) return whatsappId;

    // Add +62 prefix for Indonesia numbers if missing
    if (phone.startsWith('62')) {
      return '+' + phone;
    }

    return '+' + phone;
  },

  // Determine if ID is a group
  isGroupId: (whatsappId) => {
    return whatsappId && whatsappId.includes('@g.us');
  },

  // Determine if ID is individual
  isIndividualId: (whatsappId) => {
    return whatsappId && whatsappId.includes('@c.us');
  },

  // Get contact display name
  getContactDisplayName: (contact, fallbackId = true) => {
    if (!contact) return 'Unknown';

    // Priority: name > formatted ID > ID
    if (contact.name && contact.name.trim()) {
      return contact.name.trim();
    }

    if (fallbackId) {
      const formatted = WhatsAppHelper.formatWhatsAppIdForDisplay(contact.id);
      return formatted || contact.id || 'Unknown';
    }

    return 'Unknown';
  },

  // Get message preview text
  getMessagePreview: (message, maxLength = 50) => {
    if (!message) return 'No message';

    const text = message.body || message.message || '';
    if (!text && message.hasMedia) {
      const mediaType = message.mediaType || 'media';
      return `[${mediaType}]`;
    }

    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  },

  // Format message timestamp
  formatMessageTimestamp: (timestamp, format = 'relative') => {
    if (!timestamp) return null;

    const date = new Date(typeof timestamp === 'number' ? timestamp * 1000 : timestamp);
    const now = new Date();
    const diffMs = now - date;

    switch (format) {
      case 'relative':
        return WhatsAppHelper.getRelativeTimeString(diffMs);
      case 'time':
        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      case 'datetime':
        return date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      case 'iso':
        return date.toISOString();
      default:
        return date.toISOString();
    }
  },

  // Get relative time string
  getRelativeTimeString: (diffMs) => {
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return new Date(Date.now() - diffMs).toLocaleDateString();
  }
};

// Cache utilities (in-memory)
const Cache = {
  _cache: new Map(),

  // Set cache value with TTL
  set: (key, value, ttlSeconds = 300) => {
    const expiry = Date.now() + (ttlSeconds * 1000);
    Cache._cache.set(key, { value, expiry });
  },

  // Get cached value
  get: (key) => {
    const item = Cache._cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      Cache._cache.delete(key);
      return null;
    }

    return item.value;
  },

  // Delete cached value
  delete: (key) => {
    Cache._cache.delete(key);
  },

  // Clear all cache
  clear: () => {
    Cache._cache.clear();
  },

  // Get cache statistics
  stats: () => {
    const now = Date.now();
    let expired = 0;
    let active = 0;

    for (const [key, item] of Cache._cache.entries()) {
      if (now > item.expiry) {
        expired++;
      } else {
        active++;
      }
    }

    return {
      total_entries: Cache._cache.size,
      active_entries: active,
      expired_entries: expired,
      memory_usage_bytes: JSON.stringify([...Cache._cache.entries()]).length
    };
  },

  // Clean expired entries
  cleanup: () => {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of Cache._cache.entries()) {
      if (now > item.expiry) {
        Cache._cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }
};

// Rate limiting (simple in-memory implementation)
const RateLimiter = {
  _requests: new Map(),

  // Check if request should be allowed
  isAllowed: (clientId, limit = 100, windowMs = 60000) => {
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!RateLimiter._requests.has(clientId)) {
      RateLimiter._requests.set(clientId, []);
    }

    const requests = RateLimiter._requests.get(clientId);

    // Remove old requests outside the window
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    RateLimiter._requests.set(clientId, validRequests);

    // Check if limit exceeded
    if (validRequests.length >= limit) {
      return {
        allowed: false,
        count: validRequests.length,
        limit,
        reset_time: validRequests[0] + windowMs
      };
    }

    // Add current request
    validRequests.push(now);
    RateLimiter._requests.set(clientId, validRequests);

    return {
      allowed: true,
      count: validRequests.length,
      limit,
      remaining: limit - validRequests.length
    };
  },

  // Get current rate limit status
  getStatus: (clientId, limit = 100, windowMs = 60000) => {
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!RateLimiter._requests.has(clientId)) {
      return { count: 0, limit, remaining: limit, reset_time: now + windowMs };
    }

    const requests = RateLimiter._requests.get(clientId);
    const validRequests = requests.filter(timestamp => timestamp > windowStart);

    return {
      count: validRequests.length,
      limit,
      remaining: Math.max(0, limit - validRequests.length),
      reset_time: validRequests.length > 0 ? validRequests[0] + windowMs : now + windowMs
    };
  },

  // Clear rate limit for client
  clear: (clientId) => {
    RateLimiter._requests.delete(clientId);
  },

  // Clean old entries
  cleanup: (maxAge = 300000) => { // 5 minutes
    const now = Date.now();
    const cutoff = now - maxAge;
    let cleaned = 0;

    for (const [clientId, requests] of RateLimiter._requests.entries()) {
      const validRequests = requests.filter(timestamp => timestamp > cutoff);
      if (validRequests.length === 0) {
        RateLimiter._requests.delete(clientId);
        cleaned++;
      } else if (validRequests.length !== requests.length) {
        RateLimiter._requests.set(clientId, validRequests);
      }
    }

    return cleaned;
  }
};

module.exports = {
  Validator,
  ResponseHelper,
  FileHelper,
  WhatsAppHelper,
  Cache,
  RateLimiter
};