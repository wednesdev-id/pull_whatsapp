const { CONFIG, Utils } = require('./config');

export default async function handler(req, res) {
  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return handleGet(req, res);
    case 'POST':
      return handlePost(req, res);
    case 'DELETE':
      return handleDelete(req, res);
    default:
      return res.status(CONFIG.HTTP_STATUS.METHOD_NOT_ALLOWED)
        .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.ERROR, null,
          `Method ${req.method} not allowed`));
  }
}

// GET /api/v1/files - List and retrieve files
async function handleGet(req, res) {
  try {
    const {
      directory = null,
      type = null,
      search = null,
      action = 'list'
    } = req.query;

    if (action === 'download' && search) {
      // Handle file download
      return handleDownload(req, res, search);
    }

    // Determine which directory to list
    let searchDirs = [];
    switch (directory) {
      case 'input':
        searchDirs = [CONFIG.INPUT_DIR];
        break;
      case 'output':
        searchDirs = [CONFIG.OUTPUT_DIR];
        break;
      case 'chatId':
        searchDirs = [CONFIG.CHATID_DIR];
        break;
      case 'messagesId':
        searchDirs = [CONFIG.MESSAGESID_DIR];
        break;
      case 'all':
        searchDirs = [
          CONFIG.INPUT_DIR,
          CONFIG.OUTPUT_DIR,
          CONFIG.CHATID_DIR,
          CONFIG.MESSAGESID_DIR
        ];
        break;
      default:
        searchDirs = [CONFIG.OUTPUT_DIR];
    }

    let allFiles = [];

    // Collect files from all directories
    for (const dir of searchDirs) {
      const files = Utils.getFilesInDir(dir);
      allFiles.push(...files.map(file => ({
        ...file,
        directory: path.basename(dir),
        relative_path: path.relative(process.cwd(), file.path)
      })));
    }

    // Apply type filter
    if (type) {
      allFiles = allFiles.filter(file =>
        Utils.getFileType(file.name) === type
      );
    }

    // Apply search filter
    if (search) {
      const searchTerm = search.toLowerCase();
      allFiles = allFiles.filter(file =>
        file.name.toLowerCase().includes(searchTerm) ||
        file.relative_path.toLowerCase().includes(searchTerm)
      );
    }

    // Sort files by modification time (newest first)
    allFiles.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());

    // Add file statistics
    const stats = {
      total_files: allFiles.length,
      total_size: allFiles.reduce((sum, file) => sum + file.size, 0),
      directories: [...new Set(allFiles.map(f => f.directory))].sort(),
      types: [...new Set(allFiles.map(f => Utils.getFileType(f.name)))].sort()
    };

    // Format file sizes
    const formattedFiles = allFiles.map(file => ({
      ...file,
      size_formatted: formatFileSize(file.size),
      modified_formatted: file.modified.toLocaleString('id-ID'),
      type: Utils.getFileType(file.name)
    }));

    const metadata = {
      searched_directories: searchDirs,
      filters: { directory, type, search },
      statistics: stats,
      timestamp: new Date().toISOString()
    };

    return res.status(CONFIG.HTTP_STATUS.OK)
      .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.SUCCESS, formattedFiles,
        `Found ${allFiles.length} files`, metadata));

  } catch (error) {
    console.error('Error in GET /api/v1/files:', error);
    return res.status(CONFIG.HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.ERROR, null,
        error.message));
  }
}

// POST /api/v1/files - Create/upload files
async function handlePost(req, res) {
  try {
    const {
      action = null,
      filename = null,
      data = null,
      directory = 'output',
      backup = true
    } = req.body;

    if (action === 'process_chat') {
      return handleProcessChat(req, res);
    }

    if (action === 'process_messages') {
      return handleProcessMessages(req, res);
    }

    if (!filename || !data) {
      return res.status(CONFIG.HTTP_STATUS.BAD_REQUEST)
        .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.ERROR, null,
          'Filename and data are required'));
    }

    // Sanitize filename
    const safeFilename = Utils.sanitizeFilename(filename);
    if (!safeFilename) {
      return res.status(CONFIG.HTTP_STATUS.BAD_REQUEST)
        .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.ERROR, null,
          'Invalid filename'));
    }

    // Determine target directory
    let targetDir;
    switch (directory) {
      case 'input':
        targetDir = CONFIG.INPUT_DIR;
        break;
      case 'chatId':
        targetDir = CONFIG.CHATID_DIR;
        break;
      case 'messagesId':
        targetDir = CONFIG.MESSAGESID_DIR;
        break;
      default:
        targetDir = CONFIG.OUTPUT_DIR;
    }

    const filePath = path.join(targetDir, safeFilename);

    // Check if file exists and backup option
    if (backup && Utils.validateFile(filePath)) {
      const backupPath = filePath + CONFIG.BACKUP_EXT;
      try {
        fs.copyFileSync(filePath, backupPath);
      } catch (error) {
        console.warn('Failed to create backup:', error.message);
      }
    }

    // Validate and parse data
    let jsonData;
    try {
      jsonData = typeof data === 'string' ? JSON.parse(data) : data;
    } catch (error) {
      return res.status(CONFIG.HTTP_STATUS.BAD_REQUEST)
        .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.ERROR, null,
          'Invalid JSON data'));
    }

    // Save file
    Utils.saveJSONFile(filePath, jsonData);

    const metadata = {
      filename: safeFilename,
      directory: path.basename(targetDir),
      file_path: filePath,
      backup_created: backup && fs.existsSync(filePath + CONFIG.BACKUP_EXT),
      timestamp: new Date().toISOString()
    };

    return res.status(CONFIG.HTTP_STATUS.CREATED)
      .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.SUCCESS, null,
        `File ${safeFilename} created successfully`, metadata));

  } catch (error) {
    console.error('Error in POST /api/v1/files:', error);
    return res.status(CONFIG.HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.ERROR, null,
        error.message));
  }
}

// DELETE /api/v1/files - Delete files
async function handleDelete(req, res) {
  try {
    const { filename, directory, create_backup = true } = req.query;

    if (!filename) {
      return res.status(CONFIG.HTTP_STATUS.BAD_REQUEST)
        .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.ERROR, null,
          'Filename is required'));
    }

    const safeFilename = Utils.sanitizeFilename(filename);
    if (!safeFilename) {
      return res.status(CONFIG.HTTP_STATUS.BAD_REQUEST)
        .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.ERROR, null,
          'Invalid filename'));
    }

    // Determine target directory
    let targetDir;
    switch (directory) {
      case 'input':
        targetDir = CONFIG.INPUT_DIR;
        break;
      case 'chatId':
        targetDir = CONFIG.CHATID_DIR;
        break;
      case 'messagesId':
        targetDir = CONFIG.MESSAGESID_DIR;
        break;
      default:
        targetDir = CONFIG.OUTPUT_DIR;
    }

    const filePath = path.join(targetDir, safeFilename);

    if (!Utils.validateFile(filePath)) {
      return res.status(CONFIG.HTTP_STATUS.NOT_FOUND)
        .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.ERROR, null,
          `File ${safeFilename} not found`));
    }

    // Create backup if requested
    let backupPath = null;
    if (create_backup === 'true') {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      backupPath = path.join(targetDir, `${safeFilename}.backup.${timestamp}`);
      try {
        fs.copyFileSync(filePath, backupPath);
      } catch (error) {
        console.warn('Failed to create backup:', error.message);
        backupPath = null;
      }
    }

    // Get file metadata before deletion
    const fileMetadata = Utils.getFileMetadata(filePath);

    // Delete file
    fs.unlinkSync(filePath);

    const metadata = {
      filename: safeFilename,
      directory: path.basename(targetDir),
      deleted_at: new Date().toISOString(),
      backup_created: !!backupPath,
      backup_path: backupPath,
      original_size: fileMetadata.size,
      original_modified: fileMetadata.modified
    };

    return res.status(CONFIG.HTTP_STATUS.OK)
      .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.SUCCESS, null,
        `File ${safeFilename} deleted successfully`, metadata));

  } catch (error) {
    console.error('Error in DELETE /api/v1/files:', error);
    return res.status(CONFIG.HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.ERROR, null,
        error.message));
  }
}

// Helper function to download file content
async function handleDownload(req, res, filename) {
  try {
    const safeFilename = Utils.sanitizeFilename(filename);
    if (!safeFilename) {
      return res.status(CONFIG.HTTP_STATUS.BAD_REQUEST)
        .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.ERROR, null,
          'Invalid filename'));
    }

    // Search for file in all directories
    const searchDirs = [
      CONFIG.INPUT_DIR,
      CONFIG.OUTPUT_DIR,
      CONFIG.CHATID_DIR,
      CONFIG.MESSAGESID_DIR
    ];

    let filePath = null;
    for (const dir of searchDirs) {
      const testPath = path.join(dir, safeFilename);
      if (Utils.validateFile(testPath)) {
        filePath = testPath;
        break;
      }
    }

    if (!filePath) {
      return res.status(CONFIG.HTTP_STATUS.NOT_FOUND)
        .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.ERROR, null,
          `File ${safeFilename} not found`));
    }

    // Read file
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    const metadata = {
      filename: safeFilename,
      directory: path.basename(path.dirname(filePath)),
      downloaded_at: new Date().toISOString()
    };

    return res.status(CONFIG.HTTP_STATUS.OK)
      .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.SUCCESS,
        JSON.parse(fileContent), `Downloaded ${safeFilename}`, metadata));

  } catch (error) {
    console.error('Error in download:', error);
    return res.status(CONFIG.HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.ERROR, null,
        error.message));
  }
}

// Helper function to process chat data
async function handleProcessChat(req, res) {
  try {
    const { input_file, output_file = 'kontak_saya.json' } = req.body;

    if (!input_file) {
      return res.status(CONFIG.HTTP_STATUS.BAD_REQUEST)
        .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.ERROR, null,
          'Input file is required'));
    }

    // This would normally call the Python script
    // For now, return success response
    const metadata = {
      input_file,
      output_file,
      processed_at: new Date().toISOString(),
      note: 'Use Python script: python chatsId.py ' + input_file + ' ' + output_file
    };

    return res.status(CONFIG.HTTP_STATUS.ACCEPTED)
      .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.SUCCESS, null,
        'Chat processing initiated', metadata));

  } catch (error) {
    console.error('Error in process_chat:', error);
    return res.status(CONFIG.HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.ERROR, null,
        error.message));
  }
}

// Helper function to process message data
async function handleProcessMessages(req, res) {
  try {
    const {
      input_file = 'example1.json',
      output_file = 'output/data_saya.json',
      fields = 'timestamp,from_user,from_name,to_user,to_name,message,datetime'
    } = req.body;

    // This would normally call the Python script
    // For now, return success response
    const metadata = {
      input_file,
      output_file,
      fields,
      processed_at: new Date().toISOString(),
      note: 'Use Python script: python messagesId.py --fields "' + fields + '" -o ' + output_file + ' ' + input_file
    };

    return res.status(CONFIG.HTTP_STATUS.ACCEPTED)
      .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.SUCCESS, null,
        'Message processing initiated', metadata));

  } catch (error) {
    console.error('Error in process_messages:', error);
    return res.status(CONFIG.HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.ERROR, null,
        error.message));
  }
}

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}