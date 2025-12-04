import json
import os
import sys

# Get input filename from command line, default to chatId/ex1.json if not provided
if len(sys.argv) > 1:
    input_filename = sys.argv[1]
    # If no directory provided, assume chatId folder
    if '/' not in input_filename and '\\' not in input_filename:
        FILE_PATH = os.path.join(os.path.dirname(__file__), "chatId", input_filename)
    else:
        FILE_PATH = input_filename
else:
    BASE_DIR = os.path.dirname(__file__)
    FILE_PATH = os.path.join(BASE_DIR, "chatId", "ex1.json")

with open(FILE_PATH, "r", encoding="utf-8") as f:
    content = json.load(f)

contacts = []
for item in content:
    name_id = item['id']
    name = item['name']

    # Check if lastMessage exists
    if 'lastMessage' in item and item['lastMessage']:
        last_message_data = item['lastMessage']
        last_message = last_message_data.get('body', 'No message body')
        last_from = last_message_data.get('from', 'No sender')
    else:
        last_message = 'No last message'
        last_from = 'No sender'

    chat_dict = {
        "id": name_id,
        "name": name,
        "last_message": last_message,
        "last_from": last_from
    }
    contacts.append(chat_dict)
# Get output filename from command line, default to kontak_saya.json if not provided
output_filename = sys.argv[2] if len(sys.argv) > 2 else 'kontak_saya.json'

# Read existing data if file exists
try:
    with open(output_filename, 'r', encoding='utf-8') as f:
        existing_data = json.load(f)
    print(f"Loaded {len(existing_data)} existing contacts from {output_filename}")
except (FileNotFoundError, json.JSONDecodeError):
    existing_data = []
    print(f"File {output_filename} not found, creating new file...")

# Create a new list to store the updated data
existing_data.extend(contacts)

with open (output_filename, 'w', encoding='utf-8') as f:
    json.dump(existing_data, f, indent=4, ensure_ascii=False)


print(f"Processed {len(contacts)} contacts from {FILE_PATH}")

