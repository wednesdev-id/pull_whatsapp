import json
from datetime import datetime
import sys

# Get input filename from command line argument, default to example1.json if not provided
input_file = sys.argv[1] if len(sys.argv) > 1 else 'example1.json'

print(f"Processing file: {input_file}")

with open(input_file, 'r', encoding='utf-8') as f:
    content = json.load(f)
    # print("JSON loaded successfully. Number of items:", len(content) if isinstance(content, list) else "Not a list")

chats = []
for i in content:
    timestamp = i['timestamp']
    from_user = i['from']
    to_user = i['to']
    message = i['body']

    datetime_str = datetime.fromtimestamp(timestamp).strftime('%d/%m/%y %H:%M:%S')

    chat_dict = {
        "timestamp": timestamp,
        "from_user": from_user,
        "to_user": to_user,
        "message": message,
        "datetime": datetime_str
    }
    chats.append(chat_dict)
print(f"Processed {len(chats)} chats from {input_file}")

# Read existing data if file exists
try:
    with open('data_saya.json', 'r', encoding='utf-8') as f:
        existing_data = json.load(f)
except (FileNotFoundError, json.JSONDecodeError):
    existing_data = []
    print("File data_saya.json not found, creating new file...")

# Append new chats to existing data
existing_data.extend(chats)

# Write back to file with append mode
with open('data_saya.json', 'w', encoding='utf-8') as f:
    json.dump(existing_data, f, indent=4, ensure_ascii=False)

print(f"Successfully saved {len(chats)} new chats to data_saya.json (total: {len(existing_data)} chats)")
