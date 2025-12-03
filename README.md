# WhatsApp Data Processor

A Python application for processing WhatsApp contact and message data exported from Evolution API. Extracts contacts and messages from JSON files with customizable output options.

## Features

- **Contact Processing** - Extract WhatsApp contact information from chat data
- **Message Processing** - Process WhatsApp messages with customizable field selection
- **Customizable Output** - Choose specific fields to include in output JSON
- **Flexible File Handling** - Support for custom input/output files
- **Terminal Preview** - Preview results in terminal with pretty printing
- **Data Append** - Automatically appends new data to existing output files
- **Readable Timestamps** - Converts Unix timestamps to human-readable format
- **Auto Output Folder** - Automatically creates output/ folder for organized data storage
- **UTF-8 Support** - Proper handling of international characters and emojis
- **Error Handling** - Comprehensive error handling for missing files and invalid JSON
- **Vercel Deployment** - Deploy output files to Vercel with automatic JSON API endpoints

## Project Structure

```
.
├── chatsId.py              # Contact processing script
├── messagesId.py            # Message processing script with customizable output
├── requirements.txt         # Python dependencies
├── CARA_PAKAI.txt          # Detailed usage instructions (Indonesian)
├── chatId/                 # Contact data files
│   ├── ex1.json           # 20 contacts sample
│   ├── ex2.json           # 20 contacts sample
│   ├── ex3.json           # 20 contacts sample
│   ├── ex4.json           # 20 contacts sample
│   └── ex5.json           # 20 contacts sample
├── messagesId/             # Message data files
│   ├── example1.json      # 100 messages sample
│   ├── example2.json      # 100 messages sample
│   ├── example3.json      # 100 messages sample
│   └── example4.json      # 100 messages sample
├── output/                 # Output folder for processed data (auto-generated)
│   ├── kontak_saya.json   # Output file for contacts (auto-generated)
│   ├── coworker.json      # Output file for coworker contacts
│   ├── devteam.json       # Output file for devteam contacts
│   ├── response.json      # Response data file
│   └── data_saya.json     # Output file for messages (auto-generated)
├── info/                   # Analysis and documentation files
│   └── analysis_messagesId.py.md  # Script analysis report
├── api/                    # Vercel API routes
│   ├── index.js           # Root overview endpoint
│   ├── [file].js          # Dynamic file endpoint
│   ├── kontak_saya.js     # Contacts endpoint
│   ├── coworker.js        # Coworker endpoint
│   └── devteam.js         # Devteam endpoint
├── vercel.json            # Vercel configuration
├── package.json           # Vercel deployment package
├── kontak_saya.json        # Output file for contacts (legacy)
└── data_saya.json         # Output file for messages (legacy)
```

## Quick Start

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Process contacts:**
   ```bash
   python chatsId.py
   ```

3. **Process messages:**
   ```bash
   python messagesId.py
   ```

## Usage Examples

### Contact Processing (chatsId.py)

```bash
# Basic usage - uses default ex1.json -> kontak_saya.json
python chatsId.py

# Specify input file
python chatsId.py ex2.json

# Specify input and output files
python chatsId.py ex3.json custom_contacts.json

# Use full path
python chatsId.py /path/to/contacts.json /path/to/output.json
```

### Message Processing (messagesId.py)

```bash
# Basic usage - default fields (timestamp,from_user,to_user,message,datetime)
python messagesId.py

# Custom fields selection
python messagesId.py --fields "timestamp,message,datetime"

# Custom output file (automatically saved in output folder)
python messagesId.py -o custom_messages.json

# Terminal preview with pretty printing
python messagesId.py --pretty

# Terminal only mode (no file saved)
python messagesId.py --terminal-only --pretty

# Combined options (output saved in output/ folder)
python messagesId.py example2.json --fields "from_user,to_user,message" -o output.json --pretty

# Available fields for messages:
# - timestamp: Unix timestamp
# - from_user: Sender phone number
# - to_user: Receiver phone number
# - message: Message content
# - datetime: Formatted timestamp (DD/MM/YY HH:MM:SS)
# - id: Message unique ID
# - fromMe: Boolean (from yourself?)
# - source: Message source
# - hasMedia: Boolean (has media attachment?)
```

## Configuration

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

## Vercel Deployment

Deploy your processed JSON files to Vercel for easy API access:

### 🚀 Quick Deployment

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy from project directory:**
   ```bash
   vercel
   ```

### 🌐 Available Endpoints

After deployment, your data will be accessible at:

- **Root Overview**: `https://your-domain.vercel.app/`
  - Interactive HTML page showing all available JSON files
  - File size and last modified information
  - Direct links to view each JSON file

- **Specific JSON Files**:
  - `https://your-domain.vercel.app/kontak_saya.json` - Contacts data
  - `https://your-domain.vercel.app/coworker.json` - Coworker contacts
  - `https://your-domain.vercel.app/devteam.json` - Devteam contacts
  - `https://your-domain.vercel.app/any-file.json` - Any JSON file in output/

- **Dynamic Endpoint**:
  - `https://your-domain.vercel.app/api/[file]?file=filename.json`
  - Use for any JSON file with query parameters

### 📁 File Structure for Vercel

```
├── api/                    # Serverless functions
│   ├── index.js           # Root overview HTML page
│   ├── [file].js          # Dynamic JSON file server
│   ├── kontak_saya.js     # Specific contact endpoint
│   ├── coworker.js        # Coworker endpoint
│   └── devteam.js         # Devteam endpoint
├── output/                 # Your JSON files
│   ├── kontak_saya.json
│   ├── coworker.json
│   ├── devteam.json
│   └── *.json
├── vercel.json            # Routing configuration
└── package.json           # Deployment metadata
```

### 🔧 Vercel Configuration

The `vercel.json` file handles:
- **Clean URLs** - No .html extensions
- **Routing** - Maps file requests to API endpoints
- **Rewrites** - Automatically serves JSON files from output/ folder

### 📊 Features

- **Automatic Discovery** - Finds all JSON files in output/ folder
- **Interactive UI** - Beautiful overview page with file information
- **Security** - Path sanitization prevents directory traversal
- **Error Handling** - Proper 404 and error responses
- **JSON API** - Clean RESTful endpoints for all data

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