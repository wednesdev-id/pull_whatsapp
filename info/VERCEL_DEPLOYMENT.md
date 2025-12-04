# Vercel Deployment Guide

## Overview

Project WhatsApp JSON Output ini sudah dikonfigurasi untuk deployment ke Vercel dengan API endpoints otomatis untuk semua file JSON di folder `output/`.

## 🚀 Cara Deployment

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Login ke Vercel
```bash
vercel login
```

### 3. Deploy Project
```bash
# Dari directory project
vercel

# Atau deploy ke production
vercel --prod
```

## 🌐 API Endpoints

Setelah deployment, Anda akan mendapatkan URL seperti: `https://your-project-name.vercel.app`

### Root Overview Page
```
https://your-domain.vercel.app/
```
- Menampilkan halaman HTML overview semua file JSON
- Info file size dan last modified
- Link langsung untuk view setiap file

### Specific JSON Files
```
https://your-domain.vercel.app/kontak_saya.json     # Data kontak utama
https://your-domain.vercel.app/coworker.json        # Data coworker
https://your-domain.vercel.app/devteam.json         # Data dev team
https://your-domain.vercel.app/nama-file.json       # Semua file JSON lainnya
```

### Dynamic API Endpoint
```
https://your-domain.vercel.app/api/[file]?file=filename.json
```
- Gunakan query parameter `file` untuk spesifik file
- Otomatis serves semua JSON file dari folder `output/`

## 📁 Struktur File untuk Vercel

```
project-root/
├── api/                    # Vercel Serverless Functions
│   ├── index.js           # Root overview endpoint
│   ├── [file].js          # Dynamic file server
│   ├── kontak_saya.js     # Contacts endpoint
│   ├── coworker.js        # Coworker endpoint
│   └── devteam.js         # Devteam endpoint
├── output/                 # Folder JSON files
│   ├── kontak_saya.json   # Contacts data
│   ├── coworker.json      # Coworker data
│   ├── devteam.json       # Devteam data
│   └── *.json             # Other JSON files
├── vercel.json            # Vercel configuration
├── package.json           # Deployment metadata
└── README.md              # Project documentation
```

## ⚙️ Konfigurasi Vercel

### vercel.json
```json
{
  "version": 2,
  "cleanUrls": true,
  "trailingSlash": false,
  "rewrites": [
    { "source": "/", "destination": "/api/index" },
    { "source": "/kontak_saya", "destination": "/api/kontak_saya" },
    { "source": "/coworker", "destination": "/api/coworker" },
    { "source": "/devteam", "destination": "/api/devteam" },
    { "source": "/(.*)", "destination": "/api/[file]?file=$1" }
  ]
}
```

### package.json
```json
{
  "name": "whatsapp-output-vercel",
  "version": "1.0.0",
  "description": "Vercel deployment for WhatsApp JSON outputs"
}
```

## 🔧 API Routes Detail

### 1. Root Overview (`api/index.js`)
- **Method**: GET
- **Path**: `/`
- **Response**: HTML page dengan overview semua file JSON
- **Features**:
  - List semua file JSON di folder `output/`
  - Show file size dan last modified
  - Interactive UI dengan WhatsApp green theme
  - Direct links ke setiap file

### 2. Dynamic File Server (`api/[file].js`)
- **Method**: GET
- **Path**: `/api/[file]`
- **Query**: `?file=filename.json`
- **Response**: JSON content dari file yang diminta
- **Security**: Path sanitization mencegah directory traversal

### 3. Specific Endpoints
- **`/api/kontak_saya`** - Serves `kontak_saya.json`
- **`/api/coworker`** - Serves `coworker.json`
- **`/api/devteam`** - Serves `devteam.json`

## 📊 Features

### ✅ Automatic Discovery
- Otomatis mendeteksi semua file JSON di folder `output/`
- Tidak perlu manual konfigurasi untuk setiap file baru

### ✅ Security
- Path sanitization mencegah directory traversal attacks
- Hanya JSON files yang di-allow
- Error handling untuk missing files

### ✅ User Experience
- Clean URLs tanpa extensions
- Interactive overview page
- Responsive design untuk mobile
- WhatsApp-style green theme

### ✅ Error Handling
- 404 untuk missing files
- 400 untuk invalid file requests
- 500 untuk server errors
- Proper JSON error responses

## 🔄 Update Process

### Untuk Menambah File JSON Baru:
1. Add JSON file ke folder `output/`
2. Redeploy ke Vercel:
   ```bash
   vercel --prod
   ```
3. File baru otomatis tersedia di:
   - Root overview page
   - Direct URL: `https://your-domain.vercel.app/filename.json`

### Untuk Update File:
1. Update file di folder `output/`
2. Redeploy ke Vercel
3. Changes otomatis reflected di API

## 🐛 Troubleshooting

### Common Issues:

1. **File Not Found (404)**
   - Pastikan file ada di folder `output/`
   - Check filename spelling
   - Ensure file ends with `.json`

2. **Invalid JSON (500)**
   - Validate JSON format
   - Check untuk trailing commas
   - Ensure proper string escaping

3. **Deployment Issues**
   - Check `vercel.json` syntax
   - Ensure all API files exist
   - Verify `package.json` format

### Debug Commands:
```bash
# Local development
vercel dev

# Check logs
vercel logs

# Inspect deployment
vercel inspect
```

## 📱 Preview di Production

Setelah deployment, Anda akan mendapatkan:
- **Production URL**: `https://your-project.vercel.app`
- **Preview URL**: Untuk testing (jika menggunakan git integration)
- **Analytics**: Via Vercel dashboard
- **Logs**: Real-time logs di Vercel dashboard

## 🎯 Use Cases

### 1. **Public Data API**
- Share processed WhatsApp data dengan public
- RESTful API untuk integrasi dengan aplikasi lain
- Real-time access ke latest JSON data

### 2. **Internal Dashboard**
- Internal monitoring untuk WhatsApp data
- Quick access untuk team members
- File browsing interface

### 3. **Data Export Service**
- Export processed data ke external systems
- API endpoints untuk data consumption
- Backup dan archival access

## 🔮 Future Enhancements

- [ ] Authentication untuk private data
- [ ] Rate limiting untuk API endpoints
- [ ] Caching untuk performance
- [ ] CORS configuration untuk cross-origin requests
- [ ] Custom domain setup
- [ ] Analytics integration
- [ ] API documentation generation