# 📋 Panduan Lengkap Setup & Running WAHA Automation

## 🎯 Overview
Panduan ini menjelaskan cara setup dan menjalankan sistem automasi WAHA API untuk pull WhatsApp messages secara otomatis dengan auth barrier.

---

## 📋 Prerequisites

### 1. Software yang Dibutuhkan
```bash
# Python 3.7+
python --version

# Node.js & NPM (untuk existing API server)
node --version
npm --version

# Git (optional)
git --version
```

### 2. WAHA Server
Pastikan WAHA server sudah running di `http://localhost:3000`

---

## 🚀 Quick Start (5 Menit)

### Step 1: Install Dependencies
```bash
# Masuk ke project directory
cd "d:\MY WORK\Wednes.Dev\pull whatsapp"

# Install Python dependencies
pip install requests schedule python-dotenv

# Atau gunakan requirements file
pip install -r requirements.txt
```

### Step 2: Test Koneksi
```bash
# Test koneksi ke WAHA API
python waha_automator.py --test-connection

# Atau gunakan NPM script
npm run waha-test
```

**Expected Output:**
```
WAHA API Automation Tool
==================================================
Testing connection to http://localhost:3000/
Status Code: 200
Testing WAHA endpoint: http://localhost:3000/api/default/chats/test@c.us/messages?limit=1
WAHA Status Code: 422
Server is reachable!
WAHA API found, session validation working - this is expected!
Connection test passed!
```

### Step 3: Test dengan Mock Data (Development)
```bash
# Test dengan mock data (tanpa WhatsApp session)
python waha_automator.py --mock-data --limit 5

# Atau gunakan NPM script
npm run waha-mock
```

**Expected Output:**
```
WAHA API Automation Tool
==================================================
Testing connection...
Server is reachable!
WAHA API found, session validation working - this is expected!
Attempt 1: Getting messages for chat 6282243673017@c.us
Using mock data for testing...
Saved 5 messages to: output\waha_messages_6282243673017_20251204_140000.json
Automation completed successfully!
```

---

## 📱 WhatsApp Session Setup

### Status Check
```bash
# Cek session status
python waha_automator.py --limit 1
```

### Scenario 1: QR Code Scan Diperlukan
Jika muncul error:
```
Error: 422 - {"session":"default","status":"SCAN_QR_CODE","expected":["WORKING"]}
```

**Solution:**
1. Buka WAHA Interface di browser: `http://localhost:3000`
2. Login dengan credentials: admin / e44213b43dc349709991dbb1a6343e47
3. Scan QR code dengan WhatsApp mobile
4. Tunggu hingga status berubah menjadi "WORKING"

### Scenario 2: Session Terputus
Jika muncul error:
```
Error: 422 - {"session":"default","status":"DISCONNECTED"}
```

**Solution:**
1. Restart WAHA server
2. Login kembali ke WAHA interface
3. Scan QR code kembali

---

## 🔧 Configuration Setup

### 1. Basic Configuration (Default)
File: `waha_automator.py` (default values)
```python
# Default credentials
base_url = "http://localhost:3000"
username = "admin"
password = "e44213b43dc349709991dbb1a6343e47"
api_key = "c79b6529186c44aa9d536657ffea710b"
chat_id = "6282243673017@c.us"
```

### 2. Configuration File Setup
File: `waha_config.json`
```json
{
  "base_url": "http://localhost:3000",
  "username": "admin",
  "password": "e44213b43dc349709991dbb1a6343e47",
  "api_key": "c79b6529186c44aa9d536657ffea710b",
  "output_dir": "output",
  "chats": [
    {
      "chat_id": "6282243673017@c.us",
      "name": "Primary Chat",
      "enabled": true,
      "limit": 100,
      "sort_by": "timestamp",
      "sort_order": "desc"
    }
  ],
  "schedule": {
    "interval_minutes": 30,
    "enabled_hours": {
      "start": "08:00",
      "end": "22:00"
    }
  }
}
```

### 3. Environment Variables (Optional)
```bash
# Create .env file
WAHA_BASE_URL=http://localhost:3000
WAHA_USERNAME=admin
WAHA_PASSWORD=e44213b43dc349709991dbb1a6343e47
WAHA_API_KEY=c79b6529186c44aa9d536657ffea710b
```

---

## 🎮 Running Modes

### 1. Manual One-Time Fetch
```bash
# Basic usage (default settings)
python waha_automator.py

# Custom parameters
python waha_automator.py \
  --chat-id "6282243673017@c.us" \
  --limit 50 \
  --sort-order asc \
  --timeout 60

# NPM script
npm run waha-fetch
```

### 2. Development Testing dengan Mock Data
```bash
# Mock data testing
python waha_automator.py --mock-data --limit 10

# NPM script
npm run waha-mock
```

### 3. Scheduled Automation
```bash
# Start scheduler (periodik automation)
python waha_scheduler.py

# Custom interval (15 menit)
python waha_scheduler.py --interval 15

# Test run sekali saja
python waha_scheduler.py --test-run

# NPM script
npm run waha-scheduler
```

### 4. Connection Testing
```bash
# Test connection only
python waha_automator.py --test-connection

# Custom timeout
python waha_automator.py --test-connection --timeout 60

# NPM script
npm run waha-test
```

---

## 📊 Output Files

### File Structure
```
output/
├── waha_messages_6282243673017_20251204_140000.json
├── waha_messages_6282243673017_20251204_150000.json
└── ...
```

### File Format
```json
{
  "metadata": {
    "chat_id": "6282243673017@c.us",
    "retrieved_at": "2025-12-04T14:00:00.000Z",
    "total_messages": 50,
    "api_response": {
      "status": "success",
      "timestamp": "2025-12-04T14:00:00.000Z"
    }
  },
  "messages": [
    {
      "id": "message_id",
      "timestamp": 1701234567,
      "from": "6282243673017@c.us",
      "to": "628123456789@c.us",
      "body": "Message content",
      "fromMe": true,
      "hasMedia": false,
      "mediaType": null,
      "mediaCaption": null,
      "ack": 3
    }
  ]
}
```

---

## 🔍 Available Parameters

### waha_automator.py
```bash
# WAHA API Configuration
--url              WAHA API base URL (default: http://localhost:3000)
--username         Username untuk basic auth (default: admin)
--password         Password untuk basic auth
--api-key          API key untuk WAHA

# Chat Configuration
--chat-id          Chat ID target (default: 6282243673017@c.us)
--limit            Jumlah messages (default: 100)
--offset           Offset untuk pagination (default: 0)
--sort-by          Sort field (default: timestamp)
--sort-order       Sort order asc/desc (default: desc)

# Output Configuration
--output-dir       Output directory (default: output)

# Testing & Debugging
--test-connection  Test koneksi only
--mock-data        Gunakan mock data untuk testing

# Performance
--timeout          Request timeout in seconds (default: 30)
--auto-retry       Number of retry attempts (default: 3)
--retry-delay      Delay antara retries (default: 5)
```

### waha_scheduler.py
```bash
--config           Configuration file path (default: waha_config.json)
--create-config    Create sample configuration file
--test-run         Run once untuk testing
--interval         Override schedule interval in minutes
```

---

## 🛠️ NPM Scripts Quick Reference

```bash
# Start existing API server
npm start

# Development mode
npm run dev

# WAHA Automation Scripts
npm run waha-test      # Test koneksi WAHA
npm run waha-fetch     # Pull messages manual
npm run waha-mock      # Test dengan mock data
npm run waha-scheduler # Start scheduler automation
```

---

## 🔧 Troubleshooting Guide

### Common Issues & Solutions

#### 1. Connection Timeout
```
Error: Connection timeout
```
**Solution:**
```bash
# Increase timeout
python waha_automator.py --test-connection --timeout 60
```

#### 2. Authentication Failed
```
Error: 401 Unauthorized
```
**Solution:**
- Check username & password
- Verify API key
- Ensure WAHA server auth enabled

#### 3. WhatsApp Session Issues
```
Error: 422 - SCAN_QR_CODE
```
**Solution:**
- Buka `http://localhost:3000`
- Login dengan admin credentials
- Scan QR code dengan WhatsApp

#### 4. File Permission Issues
```
Error: Permission denied
```
**Solution:**
```bash
# Check folder permissions
ls -la output/
# Create output directory
mkdir -p output
```

#### 5. Python Module Not Found
```
ModuleNotFoundError: No module named 'requests'
```
**Solution:**
```bash
pip install requests schedule python-dotenv
```

---

## 📱 Integration dengan Existing System

### 1. API Integration
WAHA automation terintegrasi dengan existing Express API:
```bash
# Start existing API server
npm run dev

# Access API endpoints
http://localhost:3001/api/v1/messages  # View pulled messages
http://localhost:3001/                 # File browser
```

### 2. File Integration
Output files compatible dengan:
- `messagesId.py` untuk processing
- Existing API endpoints
- Dashboard applications

### 3. Database Integration (Future)
Output dapat di-import ke:
- MongoDB collections
- PostgreSQL tables
- Elasticsearch indices

---

## 🚀 Production Deployment

### 1. Environment Setup
```bash
# Production environment variables
export WAHA_BASE_URL=https://your-waha-server.com
export WAHA_USERNAME=admin
export WAHA_PASSWORD=your_secure_password
export WAHA_API_KEY=your_production_api_key
```

### 2. Process Management
```bash
# Use PM2 for Node.js processes
pm2 start server.js --name "whatsapp-api"

# Use systemd for Python scheduler
sudo systemctl start waha-scheduler
sudo systemctl enable waha-scheduler
```

### 3. Monitoring
```bash
# Log monitoring
tail -f waha_scheduler.log

# File monitoring
ls -la output/waha_messages_*.json
```

---

## 📞 Support & Help

### Quick Commands Checklist
```bash
# 1. Test everything works
npm run waha-test
npm run waha-mock

# 2. Start automation
npm run waha-scheduler

# 3. Check results
ls -la output/
```

### When to Contact Support
- Persistent connection errors
- Authentication failures
- WhatsApp session issues
- File corruption problems

---

## ✅ Success Checklist

Setelah setup selesai, pastikan:

- [ ] ✅ Dependencies terinstall
- [ ] ✅ WAHA server running di localhost:3000
- [ ] ✅ Connection test passed
- [ ] ✅ Mock data test berhasil
- [ ] ✅ WhatsApp session aktif (QR scan)
- [ ] ✅ Real API call berhasil
- [ ] ✅ Output files terbuat
- [ ] ✅ Scheduler berjalan
- [ ] ✅ Integration dengan existing API working

**🎉 Selamat! WAHA Automation System siap digunakan!**