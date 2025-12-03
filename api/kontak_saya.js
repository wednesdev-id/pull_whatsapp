const fs = require('fs');
const path = require('path');

export default function handler(req, res) {
  try {
    const filePath = path.join(process.cwd(), 'output', 'kontak_saya.json');

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File kontak_saya.json not found' });
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const jsonData = JSON.parse(fileContent);

    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(jsonData);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}