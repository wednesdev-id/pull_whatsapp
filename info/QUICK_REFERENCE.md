# ⚡ WAHA Automation - Quick Reference

## 🚀 One-Liner Commands

### Setup & Install
```bash
cd "d:\MY WORK\Wednes.Dev\pull whatsapp"
pip install requests schedule python-dotenv
```

### Test Commands
```bash
# Test connection
npm run waha-test
# atau
python waha_automator.py --test-connection

# Test dengan mock data
npm run waha-mock
# atau
python waha_automator.py --mock-data --limit 10
```

### Production Commands
```bash
# Pull messages (setelah QR scan)
npm run waha-fetch
# atau
python waha_automator.py --limit 100

# Start scheduler automation
npm run waha-scheduler
# atau
python waha_scheduler.py
```

### Custom Commands
```bash
# Custom chat ID & limit
python waha_automator.py --chat-id "628123456789@c.us" --limit 50

# Custom timeout
python waha_automator.py --timeout 60

# Custom sorting
python waha_automator.py --sort-order asc --sort-by timestamp
```

## 📱 Common Issues & Solutions

### QR Code Needed
```bash
# Jika muncul error 422 - SCAN_QR_CODE
# 1. Buka http://localhost:3000
# 2. Login: admin / e44213b43dc349709991dbb1a6343e47
# 3. Scan QR dengan WhatsApp mobile
# 4. Test kembali
```

### Connection Timeout
```bash
# Increase timeout
python waha_automator.py --timeout 60
```

### Use Mock Data for Development
```bash
# Selalu gunakan mock data jika WA session belum siap
python waha_automator.py --mock-data
```

## 📊 File Locations
```
Main Scripts:
├── waha_automator.py      # Script utama
├── waha_scheduler.py      # Scheduler automation
├── waha_config.json       # Configuration file
└── requirements.txt       # Dependencies

Output Files:
└── output/
    ├── waha_messages_*.json    # Hasil pull messages
    └── ...                     # File JSON lainnya

Documentation:
├── GUIDE_WAHA_SETUP.md         # Panduan lengkap
├── README_WAHA_AUTOMATION.md   # Technical documentation
└── QUICK_REFERENCE.md          # This file
```

## 🔧 Default Configuration
```json
{
  "base_url": "http://localhost:3000",
  "username": "admin",
  "password": "e44213b43dc349709991dbb1a6343e47",
  "api_key": "c79b6529186c44aa9d536657ffea710b",
  "chat_id": "6282243673017@c.us",
  "timeout": 30,
  "limit": 100
}
```

## ✅ Status Indicators

| Status | Meaning | Action |
|--------|---------|--------|
| ✅ `200 OK` | Connection successful | Ready to use |
| ⚠️ `422 SCAN_QR_CODE` | Need QR scan | Scan QR first |
| ❌ `401 Unauthorized` | Auth failed | Check credentials |
| ❌ `Timeout` | Server not responding | Increase timeout or check server |
| ✅ `Mock data working` | Development ready | Use for testing |

## 🎯 Typical Workflow

### 1. First Time Setup
```bash
# Install & test
pip install requests schedule python-dotenv
npm run waha-test
npm run waha-mock
```

### 2. WhatsApp Session Setup
```bash
# Check status
python waha_automator.py --limit 1
# If 422 error: scan QR at http://localhost:3000
```

### 3. Production Usage
```bash
# Manual pull
npm run waha-fetch

# Or automation
npm run waha-scheduler
```

### 4. Monitor Results
```bash
# Check output files
ls -la output/waha_messages*.json

# Check logs
tail -f waha_scheduler.log
```

## 🆘 Emergency Commands

### Reset Everything
```bash
# Stop scheduler
pkill -f waha_scheduler

# Clear output (optional)
rm output/waha_messages_*.json

# Restart WAHA server (if needed)
# Then test again
npm run waha-test
```

### Debug Mode
```bash
# Verbose output with custom timeout
python waha_automator.py --timeout 120 --auto-retry 1 --retry-delay 10
```

---

**Need Help?** 📖 See `GUIDE_WAHA_SETUP.md` for detailed documentation