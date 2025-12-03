const fs = require('fs');
const path = require('path');

export default function handler(req, res) {
  try {
    const outputDir = path.join(process.cwd(), 'output');
    const files = fs.readdirSync(outputDir).filter(file => file.endsWith('.json'));

    const fileList = files.map(file => {
      const filePath = path.join(outputDir, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        url: `/${file}`,
        size: stats.size,
        lastModified: stats.mtime
      };
    });

    const html = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WhatsApp JSON Output Overview</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #25D366;
            text-align: center;
            margin-bottom: 30px;
        }
        .file-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .file-card {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .file-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .file-name {
            font-size: 18px;
            font-weight: 600;
            color: #495057;
            margin-bottom: 10px;
        }
        .file-info {
            font-size: 14px;
            color: #6c757d;
            margin-bottom: 15px;
        }
        .view-btn {
            background: #25D366;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 5px;
            text-decoration: none;
            display: inline-block;
            transition: background 0.2s ease;
        }
        .view-btn:hover {
            background: #128C7E;
        }
        .stats {
            background: #e3f2fd;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
            text-align: center;
        }
        .stats h3 {
            color: #1976d2;
            margin: 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📱 WhatsApp JSON Output Overview</h1>

        <div class="stats">
            <h3>Total File JSON: ${files.length}</h3>
        </div>

        <div class="file-grid">
            ${fileList.map(file => `
                <div class="file-card">
                    <div class="file-name">📄 ${file.name}</div>
                    <div class="file-info">
                        Size: ${(file.size / 1024).toFixed(2)} KB<br>
                        Modified: ${file.lastModified.toLocaleString('id-ID')}
                    </div>
                    <a href="/${file.name}" class="view-btn" target="_blank">View JSON</a>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}