const fs = require('fs');
const path = require('path');

export default function handler(req, res) {
  try {
    const { file } = req.query;

    if (!file) {
      return res.status(400).json({ error: 'File parameter is required' });
    }

    // Sanitize file path to prevent directory traversal
    const fileName = file.replace(/[^a-zA-Z0-9._-]/g, '');
    const filePath = path.join(process.cwd(), 'output', fileName);

    // Check if file exists and is a JSON file
    if (!fileName.endsWith('.json')) {
      return res.status(400).json({ error: 'Only JSON files are allowed' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const jsonData = JSON.parse(fileContent);

    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(jsonData);
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.status(404).json({ error: 'File not found' });
    } else if (error instanceof SyntaxError) {
      res.status(500).json({ error: 'Invalid JSON format' });
    } else {
      res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
  }
}