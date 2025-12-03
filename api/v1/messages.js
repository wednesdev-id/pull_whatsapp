const { CONFIG, Utils } = require('./config');

export default async function handler(req, res) {
  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return handleGet(req, res);
    case 'POST':
      return handlePost(req, res);
    default:
      return res.status(CONFIG.HTTP_STATUS.METHOD_NOT_ALLOWED)
        .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.ERROR, null,
          `Method ${req.method} not allowed`));
  }
}

// GET /api/v1/messages - Retrieve messages
async function handleGet(req, res) {
  try {
    const {
      file = null,
      contact_id = null,
      from_user = null,
      to_user = null,
      fields = CONFIG.DEFAULT_FIELDS.messages,
      search = null,
      limit = 100,
      offset = 0,
      start_date = null,
      end_date = null,
      has_media = null,
      from_me = null,
      sort = 'timestamp',
      order = 'asc'
    } = req.query;

    let messages = [];
    let sourceFile = null;

    // Determine source file
    if (file) {
      const filename = Utils.sanitizeFilename(file);
      if (!filename) {
        return res.status(CONFIG.HTTP_STATUS.BAD_REQUEST)
          .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.ERROR, null,
            'Invalid file parameter'));
      }

      const filePath = path.join(CONFIG.OUTPUT_DIR, filename);
      if (!Utils.validateFile(filePath)) {
        return res.status(CONFIG.HTTP_STATUS.NOT_FOUND)
          .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.ERROR, null,
            `File ${filename} not found`));
      }

      messages = Utils.parseJSONFile(filePath);
      sourceFile = filename;
    } else {
      // Get all message files
      const files = Utils.getFilesInDir(CONFIG.OUTPUT_DIR,
        file => Utils.getFileType(file.name) === 'messages');

      // Merge all messages
      for (const fileMetadata of files) {
        try {
          const fileMessages = Utils.parseJSONFile(fileMetadata.path);
          messages.push(...fileMessages.map(msg => ({
            ...msg,
            source: fileMetadata.name
          })));
        } catch (error) {
          console.error(`Error parsing ${fileMetadata.name}:`, error.message);
        }
      }
    }

    // Apply filters
    if (contact_id) {
      messages = messages.filter(msg =>
        msg.from === contact_id || msg.to === contact_id
      );
    }

    if (from_user) {
      messages = messages.filter(msg =>
        msg.from === from_user || msg.from_user === from_user
      );
    }

    if (to_user) {
      messages = messages.filter(msg =>
        msg.to === to_user || msg.to_user === to_user
      );
    }

    // Date range filter
    if (start_date || end_date) {
      const startDate = start_date ? new Date(start_date).getTime() : 0;
      const endDate = end_date ? new Date(end_date).getTime() : Date.now();

      messages = messages.filter(msg => {
        const msgTime = msg.timestamp * 1000; // Convert to milliseconds if in seconds
        return msgTime >= startDate && msgTime <= endDate;
      });
    }

    // Search filter
    if (search) {
      const searchTerm = search.toLowerCase();
      messages = messages.filter(msg =>
        (msg.body && msg.body.toLowerCase().includes(searchTerm)) ||
        (msg.message && msg.message.toLowerCase().includes(searchTerm)) ||
        (msg.from && msg.from.toLowerCase().includes(searchTerm)) ||
        (msg.to && msg.to.toLowerCase().includes(searchTerm))
      );
    }

    // Media filter
    if (has_media !== null) {
      const hasMediaFilter = has_media === 'true';
      messages = messages.filter(msg => !!msg.hasMedia === hasMediaFilter);
    }

    // FromMe filter
    if (from_me !== null) {
      const fromMeFilter = from_me === 'true';
      messages = messages.filter(msg => !!msg.fromMe === fromMeFilter);
    }

    // Sort messages
    messages.sort((a, b) => {
      const aVal = a[sort] || 0;
      const bVal = b[sort] || 0;
      const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      return order === 'desc' ? -comparison : comparison;
    });

    // Get total count before pagination
    const total = messages.length;

    // Apply pagination
    const startIndex = parseInt(offset) || 0;
    const limitCount = parseInt(limit) || 100;
    messages = messages.slice(startIndex, startIndex + limitCount);

    // Extract requested fields
    if (fields) {
      const requestedFields = fields.split(',').map(f => f.trim());
      messages = messages.map(msg => {
        const result = {};
        requestedFields.forEach(field => {
          if (msg[field] !== undefined) {
            result[field] = msg[field];
          }
        });
        return result;
      });
    }

    // Add datetime if timestamp is requested
    if (fields && fields.includes('datetime')) {
      messages = messages.map(msg => {
        if (msg.timestamp) {
          msg.datetime = new Date(msg.timestamp * 1000).toISOString();
        }
        return msg;
      });
    }

    // Calculate statistics
    const stats = {
      total_messages: total,
      media_messages: messages.filter(msg => msg.hasMedia).length,
      text_messages: messages.filter(msg => !msg.hasMedia).length,
      sent_messages: messages.filter(msg => msg.fromMe).length,
      received_messages: messages.filter(msg => !msg.fromMe).length,
      unique_contacts: new Set(messages.map(msg => msg.from || msg.to)).size,
      date_range: {
        earliest: messages.length > 0 ? new Date(Math.min(...messages.map(m => m.timestamp)) * 1000).toISOString() : null,
        latest: messages.length > 0 ? new Date(Math.max(...messages.map(m => m.timestamp)) * 1000).toISOString() : null
      }
    };

    // Add metadata
    const metadata = {
      total,
      count: messages.length,
      source: sourceFile || 'multiple',
      fields: fields ? fields.split(',') : CONFIG.DEFAULT_FIELDS.messages,
      search,
      filters: { contact_id, from_user, to_user, has_media, from_me },
      date_range: { start_date, end_date },
      pagination: {
        limit: limitCount,
        offset: startIndex,
        hasMore: startIndex + limitCount < total
      },
      statistics: stats,
      timestamp: new Date().toISOString()
    };

    return res.status(CONFIG.HTTP_STATUS.OK)
      .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.SUCCESS, messages,
        `Retrieved ${messages.length} messages`, metadata));

  } catch (error) {
    console.error('Error in GET /api/v1/messages:', error);
    return res.status(CONFIG.HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.ERROR, null,
        error.message));
  }
}

// POST /api/v1/messages - Create new message
async function handlePost(req, res) {
  try {
    let newMessages;
    try {
      newMessages = JSON.parse(req.body);
    } catch (error) {
      return res.status(CONFIG.HTTP_STATUS.BAD_REQUEST)
        .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.ERROR, null,
          'Invalid JSON in request body'));
    }

    if (!Array.isArray(newMessages)) {
      newMessages = [newMessages];
    }

    // Validate messages
    const validMessages = newMessages.filter(msg => {
      return msg.from && msg.to && (msg.body || msg.message || msg.hasMedia);
    });

    if (validMessages.length === 0) {
      return res.status(CONFIG.HTTP_STATUS.BAD_REQUEST)
        .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.ERROR, null,
          'No valid messages provided. Required: from, to, and body/message or hasMedia'));
    }

    // Save to default messages file
    const outputDir = path.join(CONFIG.OUTPUT_DIR, 'data_saya.json');

    // Read existing messages
    let existingMessages = [];
    if (Utils.validateFile(outputDir)) {
      existingMessages = Utils.parseJSONFile(outputDir);
    }

    // Add timestamps and required fields
    const timestamp = Date.now();
    const messagesToSave = validMessages.map((msg, index) => ({
      id: msg.id || `${timestamp}_${index}`,
      from: msg.from,
      to: msg.to,
      body: msg.body || msg.message || '',
      message: msg.message || msg.body || '',
      timestamp: msg.timestamp || Math.floor(timestamp / 1000),
      fromMe: msg.fromMe !== undefined ? msg.fromMe : false,
      source: msg.source || 'api_v1',
      hasMedia: msg.hasMedia || false,
      mediaType: msg.mediaType || null,
      mediaCaption: msg.mediaCaption || null,
      created_at: timestamp,
      datetime: new Date().toISOString()
    }));

    existingMessages.push(...messagesToSave);

    // Save to file
    Utils.saveJSONFile(outputDir, existingMessages);

    const metadata = {
      saved: messagesToSave.length,
      total: existingMessages.length,
      source: 'api_v1',
      timestamp: new Date().toISOString()
    };

    return res.status(CONFIG.HTTP_STATUS.CREATED)
      .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.SUCCESS, messagesToSave,
        `Saved ${messagesToSave.length} new messages`, metadata));

  } catch (error) {
    console.error('Error in POST /api/v1/messages:', error);
    return res.status(CONFIG.HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.ERROR, null,
        error.message));
  }
}