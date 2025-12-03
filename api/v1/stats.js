const { CONFIG, Utils } = require('./config');

export default async function handler(req, res) {
  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return handleGet(req, res);
    default:
      return res.status(CONFIG.HTTP_STATUS.METHOD_NOT_ALLOWED)
        .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.ERROR, null,
          `Method ${req.method} not allowed`));
  }
}

// GET /api/v1/stats - Get statistics
async function handleGet(req, res) {
  try {
    const {
      type = 'summary',
      file = null,
      contact_id = null,
      date_range = null,
      include_details = false
    } = req.query;

    let statistics = {};

    switch (type) {
      case 'summary':
        statistics = await getSummaryStats(file, contact_id, date_range);
        break;
      case 'contacts':
        statistics = await getContactStats(file);
        break;
      case 'messages':
        statistics = await getMessageStats(file, contact_id, date_range, include_details === 'true');
        break;
      case 'files':
        statistics = await getFileStats();
        break;
      case 'activity':
        statistics = await getActivityStats(file, contact_id, date_range);
        break;
      default:
        return res.status(CONFIG.HTTP_STATUS.BAD_REQUEST)
          .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.ERROR, null,
            `Invalid statistics type: ${type}`));
    }

    const metadata = {
      type,
      generated_at: new Date().toISOString(),
      filters: { file, contact_id, date_range },
      performance_ms: process.hrtime.bigint()
    };

    return res.status(CONFIG.HTTP_STATUS.OK)
      .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.SUCCESS, statistics,
        `Generated ${type} statistics`, metadata));

  } catch (error) {
    console.error('Error in GET /api/v1/stats:', error);
    return res.status(CONFIG.HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.ERROR, null,
        error.message));
  }
}

// Get summary statistics
async function getSummaryStats(file, contact_id, date_range) {
  const summary = {
    files: await getFileStats(),
    contacts: await getContactStats(file),
    messages: await getMessageStats(file, contact_id, date_range),
    activity: await getActivityStats(file, contact_id, date_range)
  };

  // Add derived statistics
  const totalMessages = summary.messages.total_messages || 0;
  const totalContacts = summary.contacts.total_contacts || 0;
  const totalSize = summary.files.total_size || 0;

  summary.derived = {
    average_messages_per_contact: totalContacts > 0 ? Math.round(totalMessages / totalContacts) : 0,
    average_file_size: summary.files.total_files > 0 ? Math.round(totalSize / summary.files.total_files / 1024) : 0, // KB
    storage_usage_mb: Math.round(totalSize / (1024 * 1024)),
    active_contacts_rate: totalContacts > 0 ? Math.round((summary.contacts.active_contacts / totalContacts) * 100) : 0,
    media_message_rate: totalMessages > 0 ? Math.round((summary.messages.media_messages / totalMessages) * 100) : 0
  };

  return summary;
}

// Get contact statistics
async function getContactStats(file) {
  let allContacts = [];
  const filesToProcess = file ? [file] : getContactFiles();

  // Load all contacts
  for (const filename of filesToProcess) {
    try {
      const filePath = path.join(CONFIG.OUTPUT_DIR, filename);
      if (Utils.validateFile(filePath)) {
        const contacts = Utils.parseJSONFile(filePath);
        allContacts.push(...contacts.map(contact => ({
          ...contact,
          source_file: filename
        })));
      }
    } catch (error) {
      console.error(`Error loading contacts from ${filename}:`, error.message);
    }
  }

  // Get unique contacts
  const uniqueContacts = new Map();
  allContacts.forEach(contact => {
    if (contact.id && !uniqueContacts.has(contact.id)) {
      uniqueContacts.set(contact.id, {
        id: contact.id,
        name: contact.name,
        first_seen: contact.created_at || contact.timestamp,
        last_message: contact.last_message,
        last_active: contact.updated_at || contact.timestamp,
        sources: [contact.source_file]
      });
    } else if (contact.id && uniqueContacts.has(contact.id)) {
      const existing = uniqueContacts.get(contact.id);
      existing.sources.push(contact.source_file);
    }
  });

  const contacts = Array.from(uniqueContacts.values());

  // Calculate statistics
  const stats = {
    total_contacts: contacts.length,
    active_contacts: contacts.filter(c => c.last_message && c.last_message !== 'No last message').length,
    contacts_with_names: contacts.filter(c => c.name && c.name !== 'Unknown').length,
    contact_sources: [...new Set(contacts.flatMap(c => c.sources))].sort(),
    contacts_by_source: {},
    name_lengths: contacts.filter(c => c.name).map(c => c.name.length),
    phone_formats: contacts.map(c => {
      const phone = Utils.extractPhone(c.id);
      return phone ? {
        format: phone.startsWith('+62') ? 'indonesia' : 'international',
        digits: phone.replace(/[^0-9]/g, '').length
      } : null;
    }).filter(Boolean)
  };

  // Group by source
  contacts.forEach(contact => {
    contact.sources.forEach(source => {
      if (!stats.contacts_by_source[source]) {
        stats.contacts_by_source[source] = 0;
      }
      stats.contacts_by_source[source]++;
    });
  });

  // Add derived stats
  stats.average_name_length = stats.name_lengths.length > 0
    ? Math.round(stats.name_lengths.reduce((a, b) => a + b, 0) / stats.name_lengths.length)
    : 0;

  stats.phone_format_distribution = stats.phone_formats.reduce((acc, phone) => {
    if (!acc[phone.format]) {
      acc[phone.format] = 0;
    }
    acc[phone.format]++;
    return acc;
  }, {});

  return stats;
}

// Get message statistics
async function getMessageStats(file, contact_id, date_range, include_details) {
  let allMessages = [];
  const filesToProcess = file ? [file] : getMessageFiles();

  // Load all messages
  for (const filename of filesToProcess) {
    try {
      const filePath = path.join(CONFIG.OUTPUT_DIR, filename);
      if (Utils.validateFile(filePath)) {
        const messages = Utils.parseJSONFile(filePath);
        allMessages.push(...messages.map(msg => ({
          ...msg,
          source_file: filename
        })));
      }
    } catch (error) {
      console.error(`Error loading messages from ${filename}:`, error.message);
    }
  }

  // Apply filters
  if (contact_id) {
    allMessages = allMessages.filter(msg =>
      msg.from === contact_id || msg.to === contact_id
    );
  }

  if (date_range) {
    const { start, end } = JSON.parse(date_range);
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();

    allMessages = allMessages.filter(msg => {
      const msgTime = (msg.timestamp || 0) * 1000; // Convert to milliseconds if needed
      return msgTime >= startTime && msgTime <= endTime;
    });
  }

  // Basic statistics
  const stats = {
    total_messages: allMessages.length,
    media_messages: allMessages.filter(msg => msg.hasMedia).length,
    text_messages: allMessages.filter(msg => !msg.hasMedia).length,
    sent_messages: allMessages.filter(msg => msg.fromMe).length,
    received_messages: allMessages.filter(msg => !msg.fromMe).length,
    unique_senders: new Set(allMessages.map(msg => msg.from)).size,
    unique_receivers: new Set(allMessages.map(msg => msg.to)).size,
    unique_contacts: new Set(allMessages.flatMap(msg => [msg.from, msg.to])).size,
    source_files: [...new Set(allMessages.map(msg => msg.source_file))].sort()
  };

  // Time-based statistics
  if (allMessages.length > 0) {
    const timestamps = allMessages.map(msg => msg.timestamp * 1000).filter(t => t > 0);
    const dates = timestamps.map(t => new Date(t));

    stats.time_range = {
      earliest: new Date(Math.min(...timestamps)).toISOString(),
      latest: new Date(Math.max(...timestamps)).toISOString(),
      span_days: Math.ceil((Math.max(...timestamps) - Math.min(...timestamps)) / (1000 * 60 * 60 * 24))
    };

    // Activity by hour
    stats.activity_by_hour = Array(24).fill(0);
    dates.forEach(date => {
      stats.activity_by_hour[date.getHours()]++;
    });

    // Activity by day of week
    stats.activity_by_day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => ({
      day,
      count: 0
    }));
    dates.forEach(date => {
      const dayIndex = date.getDay();
      stats.activity_by_day[dayIndex].count++;
    });

    // Activity by month
    stats.activity_by_month = [];
    const monthCounts = {};
    dates.forEach(date => {
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
    });
    Object.entries(monthCounts).sort().forEach(([month, count]) => {
      const [year, monthNum] = month.split('-');
      const monthName = new Date(year, monthNum - 1).toLocaleString('default', { month: 'short' });
      stats.activity_by_month.push({ month: `${monthName} ${year}`, count });
    });
  }

  // Message length statistics
  const messageLengths = allMessages
    .filter(msg => msg.body && typeof msg.body === 'string')
    .map(msg => msg.body.length)
    .filter(length => length > 0);

  if (messageLengths.length > 0) {
    stats.message_lengths = {
      average: Math.round(messageLengths.reduce((a, b) => a + b, 0) / messageLengths.length),
      min: Math.min(...messageLengths),
      max: Math.max(...messageLengths),
      median: getMedian(messageLengths)
    };
  }

  // Media statistics
  const mediaMessages = allMessages.filter(msg => msg.hasMedia);
  if (mediaMessages.length > 0) {
    const mediaTypes = {};
    mediaMessages.forEach(msg => {
      const type = msg.mediaType || 'unknown';
      mediaTypes[type] = (mediaTypes[type] || 0) + 1;
    });
    stats.media_types = mediaTypes;
  }

  // Add message details if requested
  if (include_details) {
    stats.recent_messages = allMessages
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, 50)
      .map(msg => ({
        id: msg.id,
        from: msg.from,
        to: msg.to,
        body: msg.body || msg.message || '',
        hasMedia: msg.hasMedia,
        mediaType: msg.mediaType,
        timestamp: msg.timestamp,
        datetime: new Date(msg.timestamp * 1000).toISOString(),
        fromMe: msg.fromMe
      }));
  }

  // Add derived statistics
  stats.derived = {
    average_messages_per_day: stats.time_range && stats.time_range.span_days > 0
      ? Math.round(stats.total_messages / stats.time_range.span_days)
      : 0,
    media_message_rate: stats.total_messages > 0
      ? Math.round((stats.media_messages / stats.total_messages) * 100)
      : 0,
    sent_message_rate: stats.total_messages > 0
      ? Math.round((stats.sent_messages / stats.total_messages) * 100)
      : 0,
    peak_hour: stats.activity_by_hour.indexOf(Math.max(...stats.activity_by_hour)),
    peak_day: stats.activity_by_day.reduce((max, day) =>
      day.count > max.count ? day : max, { day: 'Unknown', count: 0 }).day
  };

  return stats;
}

// Get file statistics
async function getFileStats() {
  const allFiles = Utils.getFilesInDir(CONFIG.OUTPUT_DIR);

  const stats = {
    total_files: allFiles.length,
    total_size: allFiles.reduce((sum, file) => sum + file.size, 0),
    file_types: {},
    size_distribution: {
      small: 0,    // < 1KB
      medium: 0,   // 1KB - 100KB
      large: 0,    // 100KB - 1MB
      xlarge: 0    // > 1MB
    },
    created_dates: {},
    modified_dates: {},
    largest_files: allFiles.sort((a, b) => b.size - a.size).slice(0, 10)
  };

  allFiles.forEach(file => {
    // File types
    const type = Utils.getFileType(file.name);
    if (!stats.file_types[type]) {
      stats.file_types[type] = 0;
    }
    stats.file_types[type]++;

    // Size distribution
    const sizeKB = file.size / 1024;
    if (sizeKB < 1) {
      stats.size_distribution.small++;
    } else if (sizeKB < 100) {
      stats.size_distribution.medium++;
    } else if (sizeKB < 1024) {
      stats.size_distribution.large++;
    } else {
      stats.size_distribution.xlarge++;
    }

    // Date statistics
    const createdDate = file.created.toLocaleDateString();
    const modifiedDate = file.modified.toLocaleDateString();

    if (!stats.created_dates[createdDate]) {
      stats.created_dates[createdDate] = 0;
    }
    stats.created_dates[createdDate]++;

    if (!stats.modified_dates[modifiedDate]) {
      stats.modified_dates[modifiedDate] = 0;
    }
    stats.modified_dates[modifiedDate]++;
  });

  return stats;
}

// Get activity statistics
async function getActivityStats(file, contact_id, date_range) {
  // This would typically involve more complex analysis
  // For now, return basic activity metrics
  const messageStats = await getMessageStats(file, contact_id, date_range, false);

  return {
    activity_score: calculateActivityScore(messageStats),
    engagement_level: getEngagementLevel(messageStats),
    conversation_patterns: getConversationPatterns(messageStats),
    response_times: await getAverageResponseTimes(file, contact_id)
  };
}

// Helper functions
function getMedian(numbers) {
  const sorted = numbers.sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function getContactFiles() {
  return Utils.getFilesInDir(CONFIG.OUTPUT_DIR, file =>
    Utils.getFileType(file.name) === 'contacts'
  ).map(file => file.name);
}

function getMessageFiles() {
  return Utils.getFilesInDir(CONFIG.OUTPUT_DIR, file =>
    Utils.getFileType(file.name) === 'messages'
  ).map(file => file.name);
}

function calculateActivityScore(messageStats) {
  if (!messageStats.total_messages) return 0;

  const { total_messages, unique_contacts, media_messages } = messageStats;
  const contactScore = (unique_contacts / total_messages) * 100;
  const mediaScore = (media_messages / total_messages) * 50;

  return Math.min(100, Math.round(contactScore + mediaScore));
}

function getEngagementLevel(messageStats) {
  const score = calculateActivityScore(messageStats);
  if (score >= 80) return 'high';
  if (score >= 50) return 'medium';
  if (score >= 20) return 'low';
  return 'minimal';
}

function getConversationPatterns(messageStats) {
  return {
    most_active_hour: messageStats.activity_by_hour ?
      messageStats.activity_by_hour.indexOf(Math.max(...messageStats.activity_by_hour)) : null,
    most_active_day: messageStats.activity_by_day ?
      messageStats.activity_by_day.reduce((max, day) =>
        day.count > max.count ? day : max, { day: 'Unknown', count: 0 }).day : null,
    conversation_ratio: messageStats.sent_messages && messageStats.received_messages ?
      Math.round((messageStats.sent_messages / messageStats.received_messages) * 100) : null
  };
}

async function getAverageResponseTimes(file, contact_id) {
  // This would require more complex analysis of message timestamps
  // For now, return placeholder data
  return {
    average_response_time_minutes: 0, // Would calculate from consecutive messages
    fastest_response_minutes: 0,
    slowest_response_minutes: 0,
    response_rate_percentage: 0
  };
}