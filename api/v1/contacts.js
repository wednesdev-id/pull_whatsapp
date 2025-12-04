const path = require('path');
const { CONFIG, Utils } = require('./config');

module.exports = async function handler(req, res) {
  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return handleGet(req, res);
    case 'POST':
      return handlePost(req, res);
    case 'PUT':
      return handlePut(req, res);
    case 'DELETE':
      return handleDelete(req, res);
    default:
      return res.status(CONFIG.HTTP_STATUS.METHOD_NOT_ALLOWED)
        .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.ERROR, null,
          `Method ${req.method} not allowed`));
  }
}

// GET /api/v1/contacts - Retrieve contacts
async function handleGet(req, res) {
  try {
    const {
      file = null,
      fields = CONFIG.DEFAULT_FIELDS.contacts,
      search = null,
      limit = 100,
      offset = 0,
      sort = 'name',
      order = 'asc'
    } = req.query;

    let contacts = [];
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

      contacts = Utils.parseJSONFile(filePath);
      sourceFile = filename;
    } else {
      // Get all contact files
      const files = Utils.getFilesInDir(CONFIG.OUTPUT_DIR,
        file => Utils.getFileType(file.name) === 'contacts');

      // Merge all contacts
      for (const fileMetadata of files) {
        try {
          const fileContacts = Utils.parseJSONFile(fileMetadata.path);
          contacts.push(...fileContacts.map(contact => ({
            ...contact,
            source: fileMetadata.name
          })));
        } catch (error) {
          console.error(`Error parsing ${fileMetadata.name}:`, error.message);
        }
      }
    }

    // Apply search filter
    if (search) {
      const searchTerm = search.toLowerCase();
      contacts = contacts.filter(contact =>
        (contact.name && contact.name.toLowerCase().includes(searchTerm)) ||
        (contact.id && contact.id.toLowerCase().includes(searchTerm)) ||
        (contact.phone && contact.phone.toLowerCase().includes(searchTerm))
      );
    }

    // Sort contacts
    contacts.sort((a, b) => {
      const aVal = a[sort] || '';
      const bVal = b[sort] || '';
      const comparison = aVal.localeCompare(bVal);
      return order === 'desc' ? -comparison : comparison;
    });

    // Get total count before pagination
    const total = contacts.length;

    // Apply pagination
    const startIndex = parseInt(offset) || 0;
    const limitCount = parseInt(limit) || 100;
    contacts = contacts.slice(startIndex, startIndex + limitCount);

    // Extract requested fields
    if (fields && typeof fields === 'string') {
      const requestedFields = fields.split(',').map(f => f.trim());
      contacts = contacts.map(contact => {
        const result = {};
        requestedFields.forEach(field => {
          if (contact[field] !== undefined) {
            result[field] = contact[field];
          }
        });
        return result;
      });
    }

    // Add metadata
    const metadata = {
      total,
      count: contacts.length,
      source: sourceFile || 'multiple',
      fields: fields ? fields.split(',') : CONFIG.DEFAULT_FIELDS.contacts,
      search,
      pagination: {
        limit: limitCount,
        offset: startIndex,
        hasMore: startIndex + limitCount < total
      },
      timestamp: new Date().toISOString()
    };

    return res.status(CONFIG.HTTP_STATUS.OK)
      .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.SUCCESS, contacts,
        `Retrieved ${contacts.length} contacts`, metadata));

  } catch (error) {
    console.error('Error in GET /api/v1/contacts:', error);
    return res.status(CONFIG.HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.ERROR, null,
        error.message));
  }
}

// POST /api/v1/contacts - Create new contact
async function handlePost(req, res) {
  try {
    let newContacts;
    try {
      newContacts = JSON.parse(req.body);
    } catch (error) {
      return res.status(CONFIG.HTTP_STATUS.BAD_REQUEST)
        .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.ERROR, null,
          'Invalid JSON in request body'));
    }

    if (!Array.isArray(newContacts)) {
      newContacts = [newContacts];
    }

    // Validate contacts
    const validContacts = newContacts.filter(contact => {
      return contact.id && contact.name;
    });

    if (validContacts.length === 0) {
      return res.status(CONFIG.HTTP_STATUS.BAD_REQUEST)
        .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.ERROR, null,
          'No valid contacts provided'));
    }

    // Save to default contacts file
    const outputDir = path.join(CONFIG.OUTPUT_DIR, 'kontak_saya.json');

    // Read existing contacts
    let existingContacts = [];
    if (Utils.validateFile(outputDir)) {
      existingContacts = Utils.parseJSONFile(outputDir);
    }

    // Add timestamps and merge
    const timestamp = Date.now();
    const contactsToSave = validContacts.map(contact => ({
      ...contact,
      created_at: contact.created_at || timestamp,
      updated_at: timestamp
    }));

    existingContacts.push(...contactsToSave);

    // Save to file
    Utils.saveJSONFile(outputDir, existingContacts);

    const metadata = {
      saved: contactsToSave.length,
      total: existingContacts.length,
      source: 'api_v1',
      timestamp: new Date().toISOString()
    };

    return res.status(CONFIG.HTTP_STATUS.CREATED)
      .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.SUCCESS, contactsToSave,
        `Saved ${contactsToSave.length} new contacts`, metadata));

  } catch (error) {
    console.error('Error in POST /api/v1/contacts:', error);
    return res.status(CONFIG.HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.ERROR, null,
        error.message));
  }
}

// PUT /api/v1/contacts - Update contact
async function handlePut(req, res) {
  try {
    const { file, id } = req.query;
    let updatedContact;

    try {
      updatedContact = JSON.parse(req.body);
    } catch (error) {
      return res.status(CONFIG.HTTP_STATUS.BAD_REQUEST)
        .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.ERROR, null,
          'Invalid JSON in request body'));
    }

    if (!id || !updatedContact.name) {
      return res.status(CONFIG.HTTP_STATUS.BAD_REQUEST)
        .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.ERROR, null,
          'Contact ID and name are required'));
    }

    const filename = Utils.sanitizeFilename(file) || 'kontak_saya.json';
    const filePath = path.join(CONFIG.OUTPUT_DIR, filename);

    if (!Utils.validateFile(filePath)) {
      return res.status(CONFIG.HTTP_STATUS.NOT_FOUND)
        .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.ERROR, null,
          `File ${filename} not found`));
    }

    let contacts = Utils.parseJSONFile(filePath);
    const contactIndex = contacts.findIndex(c => c.id === id);

    if (contactIndex === -1) {
      return res.status(CONFIG.HTTP_STATUS.NOT_FOUND)
        .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.ERROR, null,
          `Contact with ID ${id} not found`));
    }

    // Update contact
    const timestamp = Date.now();
    contacts[contactIndex] = {
      ...contacts[contactIndex],
      ...updatedContact,
      updated_at: timestamp
    };

    // Save to file
    Utils.saveJSONFile(filePath, contacts);

    const metadata = {
      updated: true,
      file: filename,
      timestamp: new Date().toISOString()
    };

    return res.status(CONFIG.HTTP_STATUS.OK)
      .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.SUCCESS,
        contacts[contactIndex], `Contact ${id} updated successfully`, metadata));

  } catch (error) {
    console.error('Error in PUT /api/v1/contacts:', error);
    return res.status(CONFIG.HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.ERROR, null,
        error.message));
  }
}

// DELETE /api/v1/contacts - Delete contact
async function handleDelete(req, res) {
  try {
    const { file, id } = req.query;

    if (!id) {
      return res.status(CONFIG.HTTP_STATUS.BAD_REQUEST)
        .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.ERROR, null,
          'Contact ID is required'));
    }

    const filename = Utils.sanitizeFilename(file) || 'kontak_saya.json';
    const filePath = path.join(CONFIG.OUTPUT_DIR, filename);

    if (!Utils.validateFile(filePath)) {
      return res.status(CONFIG.HTTP_STATUS.NOT_FOUND)
        .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.ERROR, null,
          `File ${filename} not found`));
    }

    let contacts = Utils.parseJSONFile(filePath);
    const initialCount = contacts.length;
    contacts = contacts.filter(c => c.id !== id);

    if (contacts.length === initialCount) {
      return res.status(CONFIG.HTTP_STATUS.NOT_FOUND)
        .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.ERROR, null,
          `Contact with ID ${id} not found`));
    }

    // Save to file
    Utils.saveJSONFile(filePath, contacts);

    const metadata = {
      deleted: true,
      file: filename,
      removed_count: initialCount - contacts.length,
      timestamp: new Date().toISOString()
    };

    return res.status(CONFIG.HTTP_STATUS.OK)
      .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.SUCCESS, null,
        `Contact ${id} deleted successfully`, metadata));

  } catch (error) {
    console.error('Error in DELETE /api/v1/contacts:', error);
    return res.status(CONFIG.HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(Utils.createResponse(CONFIG.RESPONSE_TYPES.ERROR, null,
        error.message));
  }
}