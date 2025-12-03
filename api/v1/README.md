# WhatsApp JSON API v1

Modern, RESTful API for WhatsApp JSON data processing and retrieval.

## 🚀 Quick Start

### Base URL
```
https://your-domain.vercel.app/api/v1
```

### Authentication
Currently, the API does not require authentication. Consider implementing authentication for production use.

## 📋 Available Endpoints

### 1. 📚 API Documentation & Status
```http
GET /api/v1                    # API documentation (JSON)
GET /api/v1?action=status      # System status
GET /api/v1?action=health     # Health check
GET /api/v1?action=info&format=html  # HTML documentation
```

### 2. 👥 Contacts Management
```http
GET    /api/v1/contacts           # Get all contacts
GET    /api/v1/contacts?file=kontak_saya.json&search=john&limit=10
POST   /api/v1/contacts           # Create new contacts
PUT    /api/v1/contacts?id=628123456789@c.us  # Update contact
DELETE /api/v1/contacts?id=628123456789@c.us  # Delete contact
```

### 3. 💬 Messages Management
```http
GET    /api/v1/messages           # Get all messages
GET    /api/v1/messages?contact_id=628123456789@c.us&limit=50
POST   /api/v1/messages           # Create new message
```

### 4. 📁 Files Management
```http
GET    /api/v1/files              # List all files
GET    /api/v1/files?directory=all&type=contacts
POST   /api/v1/files?action=create   # Create new file
DELETE /api/v1/files?filename=example.json  # Delete file
```

### 5. 📊 Statistics & Analytics
```http
GET /api/v1/stats?type=summary           # Summary statistics
GET /api/v1/stats?type=contacts          # Contact statistics
GET /api/v1/stats?type=messages&contact_id=xxx
GET /api/v1/stats?type=files
GET /api/v1/stats?type=activity
```

## 📋 Response Format

### Success Response
```json
{
  "success": true,
  "type": "success",
  "data": [...],
  "message": "Operation completed successfully",
  "metadata": {
    "total": 100,
    "count": 50,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### Error Response
```json
{
  "success": false,
  "type": "error",
  "data": null,
  "message": "Error description",
  "metadata": {
    "status_code": 400,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## 🔧 Parameters Reference

### Common Parameters
- `file` (string): Specific JSON file to load
- `limit` (number, default: 100): Maximum results
- `offset` (number, default: 0): Pagination offset
- `search` (string): Search term
- `sort` (string): Sort field
- `order` (string, default: asc): Sort order (asc/desc)

### Message Parameters
- `contact_id` (string): Filter by contact ID
- `from_user` (string): Filter by sender
- `to_user` (string): Filter by receiver
- `fields` (string): Comma-separated fields
- `start_date` (string): ISO date string
- `end_date` (string): ISO date string
- `has_media` (boolean): Filter by media
- `from_me` (boolean): Filter sent/received

### File Parameters
- `directory` (string): input/output/chatId/messagesId/all
- `type` (string): contacts/messages/backup/unknown

## 📊 Statistics Types

### Summary (`type=summary`)
- Overall system statistics
- Contact summary
- Message summary
- File statistics
- Activity metrics

### Contacts (`type=contacts`)
- Total contacts
- Active contacts
- Contacts by source
- Name length distribution
- Phone format analysis

### Messages (`type=messages`)
- Total messages
- Media vs text ratio
- Sent/received ratio
- Activity by hour/day/month
- Message length statistics

### Files (`type=files`)
- Total files and size
- File type distribution
- Size distribution
- Created/modified dates

### Activity (`type=activity`)
- Activity score
- Engagement level
- Conversation patterns
- Response time metrics

## 📱 WhatsApp ID Formats

### Individual Contacts
```
628123456789@c.us
```

### Groups
```
628123456789-123456789@g.us
```

### Phone Number Validation
- Must be numeric
- Minimum 10 digits
- Can include country code (+62 for Indonesia)

## 📁 File Structure

### Input Files
```
chatId/
├── ex1.json    # Example chat data
├── ex2.json
├── ex3.json
└── ex4.json

messagesId/
├── example1.json  # Example message data
├── example2.json
└── example3.json
```

### Output Files
```
output/
├── kontak_saya.json    # Processed contacts
├── data_saya.json      # Processed messages
├── coworker.json       # Coworker contacts
├── devteam.json        # Dev team contacts
└── [custom].json       # Custom output files
```

## 🚀 Usage Examples

### Get Contacts with Pagination
```bash
curl "https://your-domain.vercel.app/api/v1/contacts?limit=10&offset=0"
```

### Search Messages
```bash
curl "https://your-domain.vercel.app/api/v1/messages?search=hello&limit=20"
```

### Get Messages by Date Range
```bash
curl "https://your-domain.vercel.app/api/v1/messages?start_date=2024-01-01&end_date=2024-01-31"
```

### Create New Contact
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '[{"id": "628123456789@c.us", "name": "John Doe"}]' \
  "https://your-domain.vercel.app/api/v1/contacts"
```

### Get System Statistics
```bash
curl "https://your-domain.vercel.app/api/v1/stats?type=summary"
```

## 🛠️ Local Development

### Prerequisites
- Node.js 18+
- JSON data files in proper directories

### Setup
1. Clone the repository
2. Place your WhatsApp JSON data in the appropriate directories
3. Deploy to Vercel or use local development server

### Testing
```bash
# Test API endpoints
curl http://localhost:3000/api/v1
curl http://localhost:3000/api/v1/contacts
curl http://localhost:3000/api/v1/messages
```

## 📝 Error Codes

| Code | Description |
|------|-------------|
| 200  | Success |
| 201  | Created |
| 400  | Bad Request |
| 401  | Unauthorized |
| 403  | Forbidden |
| 404  | Not Found |
| 409  | Conflict |
| 422  | Unprocessable Entity |
| 429  | Too Many Requests |
| 500  | Internal Server Error |
| 503  | Service Unavailable |

## 🔒 Security Considerations

- Input validation and sanitization
- File path traversal protection
- Size limits (10MB max)
- JSON format validation
- CORS headers configured
- XSS protection headers
- Content-Type enforcement

## 📊 Performance Features

- In-memory caching (configurable TTL)
- Pagination support
- Field selection (reduce payload)
- File size validation
- Efficient file operations
- Automatic backups

## 🔧 Configuration

All configuration is in `api/v1/config.js`:

- **MAX_FILE_SIZE**: 10MB default
- **CACHE_TTL**: 5 minutes default
- **ALLOWED_MIME_TYPES**: application/json only
- **BACKUP_EXT**: .bak for backups

## 📄 Migration Guide

### From Legacy API
Old endpoints are still supported:
- `/` → `/api/v1?action=info&format=html`
- `/kontak_saya` → `/api/v1/contacts?file=kontak_saya.json`
- `/devteam` → `/api/v1/contacts?file=devteam.json`

### Recommended Migration
1. Update base URL to `/api/v1`
2. Use new parameter names
3. Implement error handling for new response format
4. Add pagination support

## 🤝 Contributing

1. Follow RESTful conventions
2. Use consistent response format
3. Add proper error handling
4. Include input validation
5. Update documentation

## 📄 License

MIT License - feel free to use and modify for your projects.

## 🆘 Support

For issues and questions:
1. Check the documentation
2. Test with `/api/v1?action=health`
3. Review error responses
4. Check Vercel deployment logs