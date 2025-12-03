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

// GET /api/v1 - API Documentation and Status
async function handleGet(req, res) {
  try {
    const {
      action = 'info',
      format = 'json'
    } = req.query;

    if (action === 'status') {
      return handleStatus(req, res);
    }

    if (action === 'health') {
      return handleHealth(req, res);
    }

    // API Documentation
    const apiInfo = {
      api_version: CONFIG.API_VERSION,
      timestamp: new Date().toISOString(),
      documentation: {
        title: 'WhatsApp JSON API',
        description: 'RESTful API for WhatsApp JSON data processing and retrieval',
        version: '1.0.0',
        base_url: process.env.NEXT_PUBLIC_URL || 'https://your-domain.vercel.app',
        endpoints: {
          contacts: {
            path: '/api/v1/contacts',
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            description: 'Manage WhatsApp contacts',
            parameters: {
              GET: {
                file: 'string - Specific JSON file to load (optional)',
                fields: 'string - Comma-separated fields to return (optional)',
                search: 'string - Search term (optional)',
                limit: 'number - Maximum results (default: 100)',
                offset: 'number - Pagination offset (default: 0)',
                sort: 'string - Sort field (default: name)',
                order: 'string - Sort order: asc/desc (default: asc)'
              },
              POST: {
                body: 'Array of contact objects with id, name, and optional fields'
              },
              PUT: {
                id: 'string - Contact ID to update (query param)',
                file: 'string - Target file (query param)',
                body: 'Contact object with fields to update'
              },
              DELETE: {
                id: 'string - Contact ID to delete (query param)',
                file: 'string - Target file (query param)'
              }
            }
          },
          messages: {
            path: '/api/v1/messages',
            methods: ['GET', 'POST'],
            description: 'Manage WhatsApp messages',
            parameters: {
              GET: {
                file: 'string - Specific JSON file to load (optional)',
                contact_id: 'string - Filter by contact ID (optional)',
                from_user: 'string - Filter by sender (optional)',
                to_user: 'string - Filter by receiver (optional)',
                fields: 'string - Comma-separated fields to return (optional)',
                search: 'string - Search in message content (optional)',
                limit: 'number - Maximum results (default: 100)',
                offset: 'number - Pagination offset (default: 0)',
                start_date: 'string - ISO date string (optional)',
                end_date: 'string - ISO date string (optional)',
                has_media: 'boolean - Filter by media (optional)',
                from_me: 'boolean - Filter sent/received (optional)',
                sort: 'string - Sort field (default: timestamp)',
                order: 'string - Sort order: asc/desc (default: asc)'
              },
              POST: {
                body: 'Array of message objects with from, to, and body/message or hasMedia'
              }
            }
          },
          files: {
            path: '/api/v1/files',
            methods: ['GET', 'POST', 'DELETE'],
            description: 'Manage JSON files',
            parameters: {
              GET: {
                directory: 'string - Directory: input/output/chatId/messagesId/all (default: output)',
                type: 'string - File type: contacts/messages/backup/unknown (optional)',
                search: 'string - Search filename (optional)',
                action: 'string - Action: list/download (default: list)'
              },
              POST: {
                action: 'string - Action: create/process_chat/process_messages',
                filename: 'string - Target filename (required for create)',
                directory: 'string - Target directory (default: output)',
                data: 'object - JSON data or array (required for create)',
                backup: 'boolean - Create backup before overwrite (default: true)'
              },
              DELETE: {
                filename: 'string - File to delete (required)',
                directory: 'string - Directory containing file (default: output)',
                create_backup: 'boolean - Create backup before deletion (default: true)'
              }
            }
          },
          stats: {
            path: '/api/v1/stats',
            methods: ['GET'],
            description: 'Get statistics and analytics',
            parameters: {
              type: 'string - Statistics type: summary/contacts/messages/files/activity (default: summary)',
              file: 'string - Specific JSON file to analyze (optional)',
              contact_id: 'string - Filter by contact ID (optional)',
              date_range: 'string - JSON object with start/end dates (optional)',
              include_details: 'boolean - Include detailed data (default: false)'
            }
          }
        },
        response_format: {
          success: {
            success: true,
            type: 'success',
            data: 'Response data (array or object)',
            message: 'Human-readable message (optional)',
            metadata: 'Additional information (optional)',
            timestamp: 'ISO timestamp'
          },
          error: {
            success: false,
            type: 'error',
            data: null,
            message: 'Error description',
            metadata: 'Additional error info (optional)',
            timestamp: 'ISO timestamp'
          }
        },
        file_types: {
          contacts: 'Files containing contact information',
          messages: 'Files containing message data',
          backup: 'Backup copies of files',
          unknown: 'Uncategorized files'
        },
        http_status_codes: Object.entries(CONFIG.HTTP_STATUS).reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {})
      },
      examples: {
        get_contacts: '/api/v1/contacts?search=john&limit=10',
        get_messages: '/api/v1/messages?contact_id=628123456789@c.us&limit=50',
        create_message: {
          method: 'POST',
          url: '/api/v1/messages',
          body: [
            {
              from: '628123456789@c.us',
              to: '628987654321@c.us',
              body: 'Hello world!',
              fromMe: true
            }
          ]
        },
        get_stats: '/api/v1/stats?type=summary&include_details=true',
        list_files: '/api/v1/files?directory=all&type=contacts'
      },
      limitations: {
        max_file_size: `${Math.round(CONFIG.MAX_FILE_SIZE / (1024 * 1024))}MB`,
        allowed_extensions: [CONFIG.JSON_EXT],
        rate_limiting: 'Not implemented (consider implementing for production)',
        authentication: 'Not implemented (consider implementing for production)',
        backup_policy: 'Automatic backups created on overwrites'
      }
    };

    if (format === 'html') {
      return handleHTMLDocumentation(apiInfo, res);
    }

    return res.status(CONFIG.HTTP_STATUS.OK)
      .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.SUCCESS, apiInfo,
        'API Documentation retrieved successfully'));

  } catch (error) {
    console.error('Error in GET /api/v1:', error);
    return res.status(CONFIG.HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.ERROR, null,
        error.message));
  }
}

// API Status endpoint
async function handleStatus(req, res) {
  try {
    const fileStats = await getFileStats();
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    const status = {
      api: {
        version: CONFIG.API_VERSION,
        status: 'operational',
        uptime_seconds: Math.round(uptime),
        uptime_formatted: formatUptime(uptime)
      },
      system: {
        node_version: process.version,
        platform: process.platform,
        architecture: process.arch,
        memory: {
          used_mb: Math.round(memoryUsage.heapUsed / (1024 * 1024)),
          total_mb: Math.round(memoryUsage.heapTotal / (1024 * 1024)),
          external_mb: Math.round(memoryUsage.external / (1024 * 1024)),
          rss_mb: Math.round(memoryUsage.rss / (1024 * 1024))
        }
      },
      files: fileStats,
      performance: {
        memory_usage_percent: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
        file_count: fileStats.total_files,
        storage_size_mb: Math.round(fileStats.total_size / (1024 * 1024))
      },
      directories: {
        exists: {
          input: checkDirectoryExists(CONFIG.INPUT_DIR),
          output: checkDirectoryExists(CONFIG.OUTPUT_DIR),
          chatId: checkDirectoryExists(CONFIG.CHATID_DIR),
          messagesId: checkDirectoryExists(CONFIG.MESSAGESID_DIR)
        }
      },
      timestamp: new Date().toISOString()
    };

    return res.status(CONFIG.HTTP_STATUS.OK)
      .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.SUCCESS, status,
        'System status retrieved successfully'));

  } catch (error) {
    console.error('Error in status endpoint:', error);
    return res.status(CONFIG.HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.ERROR, null,
        error.message));
  }
}

// Health check endpoint
async function handleHealth(req, res) {
  try {
    // Basic health checks
    const checks = {
      api_server: true,
      file_system: await checkFileSystem(),
      memory_usage: process.memoryUsage().heapUsed < 100 * 1024 * 1024, // Less than 100MB
      uptime: process.uptime() > 0
    };

    const allHealthy = Object.values(checks).every(check => check === true);

    return res.status(allHealthy ? CONFIG.HTTP_STATUS.OK : CONFIG.HTTP_STATUS.SERVICE_UNAVAILABLE)
      .json({
        healthy: allHealthy,
        checks,
        timestamp: new Date().toISOString()
      });

  } catch (error) {
    return res.status(CONFIG.HTTP_STATUS.SERVICE_UNAVAILABLE)
      .json({
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
  }
}

// HTML Documentation endpoint
function handleHTMLDocumentation(apiInfo, res) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WhatsApp JSON API - Documentation</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        .header {
            background: linear-gradient(135deg, #25D366, #128C7E);
            color: white;
            padding: 40px 20px;
            border-radius: 10px;
            margin-bottom: 30px;
            text-align: center;
        }
        .section {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .endpoint {
            background: white;
            border-left: 4px solid #25D366;
            padding: 15px;
            margin: 10px 0;
            border-radius: 0 5px 5px 0;
        }
        .method {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            color: white;
            font-weight: bold;
            font-size: 12px;
            margin-right: 10px;
        }
        .get { background: #28a745; }
        .post { background: #007bff; }
        .put { background: #ffc107; color: #000; }
        .delete { background: #dc3545; }
        .code {
            background: #f1f3f4;
            padding: 10px;
            border-radius: 4px;
            font-family: 'Monaco', 'Menlo', monospace;
            overflow-x: auto;
        }
        .response {
            background: #e8f5e8;
            border-left: 4px solid #28a745;
            padding: 15px;
            margin: 10px 0;
            border-radius: 0 5px 5px 0;
        }
        .error {
            background: #f8d7da;
            border-left: 4px solid #dc3545;
            padding: 15px;
            margin: 10px 0;
            border-radius: 0 5px 5px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📱 WhatsApp JSON API</h1>
        <p>RESTful API for WhatsApp JSON data processing and retrieval</p>
        <p><strong>Version:</strong> ${apiInfo.api_version}</p>
        <p><strong>Timestamp:</strong> ${apiInfo.timestamp}</p>
    </div>

    <div class="section">
        <h2>📚 Overview</h2>
        <p>${apiInfo.documentation.description}</p>
        <p><strong>Base URL:</strong> <code>${apiInfo.documentation.base_url}</code></p>
        <p><strong>API Version:</strong> ${apiInfo.documentation.version}</p>
    </div>

    <div class="section">
        <h2>🔌 Endpoints</h2>
        ${Object.entries(apiInfo.documentation.endpoints).map(([key, endpoint]) => `
            <div class="endpoint">
                <h3>${endpoint.path}</h3>
                <p><strong>Description:</strong> ${endpoint.description}</p>
                <p><strong>Methods:</strong>
                    ${endpoint.methods.map(method => `<span class="method ${method.toLowerCase()}">${method}</span>`).join(' ')}
                </p>
                ${Object.entries(endpoint.parameters).map(([method, params]) => `
                    <details>
                        <summary><strong>${method} Parameters</strong></summary>
                        ${Object.entries(params).map(([param, desc]) => `
                            <p><code>${param}</code>: ${desc}</p>
                        `).join('')}
                    </details>
                `).join('')}
            </div>
        `).join('')}
    </div>

    <div class="section">
        <h2>📊 Response Format</h2>
        <div class="response">
            <h3>Success Response</h3>
            <pre class="code">${JSON.stringify(apiInfo.response_format.success, null, 2)}</pre>
        </div>
        <div class="error">
            <h3>Error Response</h3>
            <pre class="code">${JSON.stringify(apiInfo.response_format.error, null, 2)}</pre>
        </div>
    </div>

    <div class="section">
        <h2>💡 Examples</h2>
        ${Object.entries(apiInfo.examples).map(([key, example]) => {
            if (typeof example === 'string') {
                return `<p><strong>${key}:</strong> <code>${example}</code></p>`;
            } else {
                return `
                    <p><strong>${key}:</strong></p>
                    <pre class="code">${JSON.stringify(example, null, 2)}</pre>
                `;
            }
        }).join('')}
    </div>

    <div class="section">
        <h2>⚠️ Limitations</h2>
        ${Object.entries(apiInfo.limitations).map(([key, limit]) => `
            <p><strong>${key}:</strong> ${limit}</p>
        `).join('')}
    </div>

    <div class="section">
        <h2>🛠️ Additional Endpoints</h2>
        <p><strong>API Documentation:</strong> <a href="/api/v1?action=info">GET /api/v1?action=info</a></p>
        <p><strong>System Status:</strong> <a href="/api/v1?action=status">GET /api/v1?action=status</a></p>
        <p><strong>Health Check:</strong> <a href="/api/v1?action=health">GET /api/v1?action=health</a></p>
    </div>

    <footer style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #666;">
        <p>WhatsApp JSON API v${apiInfo.api_version} - Generated ${apiInfo.timestamp}</p>
    </footer>
</body>
</html>`;

  return res.setHeader('Content-Type', 'text/html')
    .status(CONFIG.HTTP_STATUS.OK)
    .send(html);
}

// Helper functions
async function getFileStats() {
  try {
    const files = Utils.getFilesInDir(CONFIG.OUTPUT_DIR);
    return {
      total_files: files.length,
      total_size: files.reduce((sum, file) => sum + file.size, 0),
      file_types: [...new Set(files.map(f => Utils.getFileType(f.name)))],
      last_updated: files.length > 0 ? Math.max(...files.map(f => new Date(f.modified).getTime())) : null
    };
  } catch (error) {
    return {
      total_files: 0,
      total_size: 0,
      file_types: [],
      last_updated: null,
      error: error.message
    };
  }
}

function checkDirectoryExists(dirPath) {
  try {
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  } catch (error) {
    return false;
  }
}

function checkFileSystem() {
  try {
    const testDir = CONFIG.OUTPUT_DIR;
    const testFile = path.join(testDir, '.health_check');

    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    fs.writeFileSync(testFile, 'health-check-' + Date.now());
    fs.unlinkSync(testFile);

    return true;
  } catch (error) {
    return false;
  }
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);
  const secs = Math.floor(seconds % 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}