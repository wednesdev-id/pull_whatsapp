# WhatsApp Message Parser

A clean and efficient Python application for parsing and analyzing WhatsApp message data exported from Evolution API.

## Features

- **Automatic file detection** - Finds all JSON response files automatically
- **Message statistics** - Provides insights about sent/received messages
- **Search functionality** - Filter messages by text content
- **Readable timestamps** - Converts Unix timestamps to human-readable format
- **Error handling** - Robust error handling for corrupt/missing files
- **Clean logging** - Informative logging for debugging and monitoring

## Project Structure

```
.
├── main.py                 # Main application file
├── config.py              # Configuration settings
├── requirements.txt       # Python dependencies
├── .env                   # Environment variables
├── docker-compose.yml     # PostgreSQL + Evolution API setup
└── response_*.json        # WhatsApp message export files
```

## Quick Start

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the application:**
   ```bash
   python main.py
   ```

## Usage Examples

### Basic Usage
```python
from main import WhatsAppMessageParser

# Initialize parser
parser = WhatsAppMessageParser(".")

# Load all JSON files
parser.load_all_files()

# Display messages
parser.display_messages(limit=20)
```

### Search Messages
```python
# Search for specific text
parser.display_messages(filter_text="hello")

# Get statistics
stats = parser.get_message_stats()
print(f"Total messages: {stats['total_messages']}")
```

## Configuration

The application can be configured using:

1. **Environment variables** (`.env` file)
2. **Configuration file** (`config.py`)
3. **Command-line arguments** (future feature)

## JSON File Format

Expected JSON format (from Evolution API):
```json
[
  {
    "id": "message_id",
    "timestamp": 1234567890,
    "from": "phone_number@c.us",
    "to": "phone_number@c.us",
    "body": "message content",
    "fromMe": false,
    "hasMedia": false
  }
]
```

## Docker Setup

This project includes Docker Compose setup for PostgreSQL and Evolution API:

```bash
docker-compose up -d
```

## Error Handling

The application handles various error conditions:
- Missing or corrupt JSON files
- Invalid JSON format
- File permission issues
- Invalid timestamps

## Logging

Logs are configured to show:
- File loading status
- Error messages
- Processing statistics
- Debug information

## Future Enhancements

- [ ] Database integration for persistent storage
- [ ] Export functionality (CSV, JSON, Excel)
- [ ] Web interface for browsing messages
- [ ] Message threading and conversation view
- [ ] Media file handling
- [ ] Real-time message processing