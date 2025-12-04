# WAHA API Automation Documentation

## 📋 Overview

Berikut adalah dokumentasi lengkap untuk sistem automasi WAHA API yang telah dibuat untuk pull WhatsApp messages secara otomatis dengan auth barrier.

## 🏗️ Struktur Project

```
pull whatsapp/
├── waha_automator.py          # Script utama untuk API requests
├── waha_scheduler.py          # Script untuk scheduling automasi periodik
├── waha_config.json           # Konfigurasi file
├── requirements.txt           # Python dependencies
├── output/                    # Folder untuk menyimpan hasil
│   ├── waha_messages_*.json   # Hasil pull messages
│   └── ...                    # File JSON lainnya
└── README_WAHA_AUTOMATION.md  # Documentation ini
```

## 🔧 Konfigurasi

### 1. WAHA API Credentials
```json
{
  "base_url": "http://localhost:3000",
  "username": "admin",
  "password": "e44213b43dc349709991dbb1a6343e47",
  "api_key": "c79b6529186c44aa9d536657ffea710b"
}
```

### 2. Chat Configuration
```json
{
  "chats": [
    {
      "chat_id": "6282243673017@c.us",
      "name": "Primary Chat",
      "enabled": true,
      "limit": 100,
      "sort_by": "timestamp",
      "sort_order": "desc"
    }
  ]
}
```

### 3. Schedule Configuration
```json
{
  "schedule": {
    "interval_minutes": 30,
    "enabled_hours": {
      "start": "08:00",
      "end": "22:00"
    }
  }
}
```

## 🚀 Cara Penggunaan

### 1. Install Dependencies
```bash
pip install -r requirements.txt
# atau
pip install requests schedule python-dotenv
```

### 2. Test Koneksi
```bash
# Test koneksi ke WAHA API
python waha_automator.py --test-connection

# Atau menggunakan npm script
npm run waha-test
```

### 3. Pull Messages Manual
```bash
# Pull messages dengan konfigurasi default
python waha_automator.py

# Pull dengan custom chat ID
python waha_automator.py --chat-id "6282243673017@c.us" --limit 50

# Pull dengan sorting ascending
python waha_automator.py --sort-order asc --limit 100

# Menggunakan npm script
npm run waha-fetch
```

### 4. Start Scheduler (Automasi Periodik)
```bash
# Start scheduler dengan konfigurasi file
python waha_scheduler.py

# Create sample config terlebih dahulu
python waha_scheduler.py --create-config

# Test run sekali saja
python waha_scheduler.py --test-run

# Custom interval (menit)
python waha_scheduler.py --interval 15

# Menggunakan npm script
npm run waha-scheduler
```

## 📝 Parameter Options

### waha_automator.py
```
--url              WAHA API base URL (default: http://localhost:3000)
--username         Username for basic auth (default: admin)
--password         Password for basic auth
--api-key          API key for WAHA
--chat-id          Chat ID (default: 6282243673017@c.us)
--limit            Limit messages per request (default: 100)
--offset           Offset for pagination (default: 0)
--sort-by          Sort field (default: timestamp)
--sort-order       Sort order asc/desc (default: desc)
--output-dir       Output directory (default: output)
--test-connection  Test connection only
--auto-retry       Number of retry attempts (default: 3)
--retry-delay      Delay between retries in seconds (default: 5)
--mock-data         Use mock data for testing when WA session is not ready
```

### waha_scheduler.py
```
--config           Configuration file path (default: waha_config.json)
--create-config    Create sample configuration file
--test-run         Run once for testing
--interval         Override schedule interval in minutes
```

## 📊 Output Format

File output akan disimpan di folder `output/` dengan format nama:
```
waha_messages_{chat_id}_{timestamp}.json
```

### Struktur JSON Output:
```json
{
  "metadata": {
    "chat_id": "6282243673017@c.us",
    "retrieved_at": "2025-12-04T12:00:00.000Z",
    "total_messages": 50,
    "api_response": {
      "status": "success",
      "timestamp": "2025-12-04T12:00:00.000Z"
    }
  },
  "messages": [
    {
      "id": "message_id",
      "timestamp": 1701234567,
      "from": "6282243673017@c.us",
      "to": "628123456789@c.us",
      "body": "Hello world",
      "fromMe": true,
      "hasMedia": false,
      "mediaType": null,
      "mediaCaption": null
    }
  ]
}
```

## 🔍 Troubleshooting

### 1. Connection Issues
- **Error: Connection failed**: Pastikan WAHA server berjalan di URL yang benar
- **Error: 404 Not Found**: Check jika WAHA API endpoint structure berbeda
- **Error: Timeout**: Increase timeout value atau check network connection

### 2. Authentication Issues
- **Error: 401 Unauthorized**: Check username, password, dan API key
- **Error: 403 Forbidden**: API key mungkin tidak valid atau expired

### 3. Session Issues
- **Error: 422 Session status is SCAN_QR_CODE**: WA perlu di-scan QR code terlebih dahulu
- **Error: 422 Session status is DISCONNECTED**: Need to reconnect WhatsApp session
- **Solution**: Gunakan `--mock-data` flag untuk testing development tanpa WA session aktif

### 4. File Issues
- **Error: Permission denied**: Check write permissions untuk folder `output/`
- **Error: Disk full**: Free up disk space

## ⚡ Advanced Usage

### 1. Multiple Chats
Edit `waha_config.json` untuk multiple chats:
```json
{
  "chats": [
    {
      "chat_id": "6282243673017@c.us",
      "name": "Primary Chat",
      "enabled": true,
      "limit": 100
    },
    {
      "chat_id": "628123456789@c.us",
      "name": "Secondary Chat",
      "enabled": true,
      "limit": 50
    }
  ]
}
```

### 2. Custom Schedule
```json
{
  "schedule": {
    "interval_minutes": 15,
    "enabled_hours": {
      "start": "09:00",
      "end": "17:00"
    }
  }
}
```

### 3. Retry Configuration
```json
{
  "retry": {
    "max_attempts": 5,
    "delay_seconds": 10
  }
}
```

## 📈 Monitoring

### Log Files
- `waha_scheduler.log`: Log dari scheduler operations
- Console output: Real-time progress information

### API Integration
Output files dapat di-integrasikan dengan:
- Existing Express API di `/api/v1/messages`
- Dashboard applications
- Analytics systems

## 🔒 Security Considerations

1. **API Credentials**: Store credentials di environment variables
2. **File Permissions**: Secure access ke output files
3. **Network**: Use HTTPS untuk production
4. **Rate Limiting**: Respect WAHA API rate limits

## 📞 Support

Jika ada issues:
1. Check logs untuk error details
2. Verify WAHA server status
3. Test connection dengan `--test-connection`
4. Review configuration file
5. Check WhatsApp session status

---

**Status**: ✅ Production Ready
**Last Updated**: December 4, 2025