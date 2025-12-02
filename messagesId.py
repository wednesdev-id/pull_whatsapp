import json
from datetime import datetime
import os
import argparse

def parse_arguments():
    parser = argparse.ArgumentParser(description='Process WhatsApp messages from JSON to customizable output format')
    parser.add_argument('input_file', nargs='?', default='example1.json',
                       help='Input JSON file (default: example1.json)')
    parser.add_argument('-o', '--output', default='output/data_saya.json',
                       help='Output JSON file (default: output/data_saya.json)')
    parser.add_argument('--fields', default='timestamp,from_user,from_name,to_user,to_name,message,datetime',
                       help='Comma-separated fields to include in output (default: timestamp,from_user,from_name,to_user,to_name,message,datetime)')
    parser.add_argument('--pretty', action='store_true',
                       help='Pretty print JSON to terminal')
    parser.add_argument('--terminal-only', action='store_true',
                       help='Only display to terminal, don\'t save to file')
    return parser.parse_args()

def load_kontak_saya():
    """Load kontak data from kontak_saya.json and create ID to name mapping"""
    try:
        with open('output/kontak_saya.json', 'r', encoding='utf-8') as f:
            kontak_data = json.load(f)

        # Create mapping from ID to name
        kontak_map = {}
        for kontak in kontak_data:
            contact_id = kontak.get('id')
            name = kontak.get('name')
            if contact_id and name:
                kontak_map[contact_id] = name

        print(f"Loaded {len(kontak_map)} contacts from output/kontak_saya.json")
        return kontak_map
    except FileNotFoundError:
        print("Warning: output/kontak_saya.json not found. Contact names will not be added.")
        return {}
    except json.JSONDecodeError:
        print("Warning: Error parsing output/kontak_saya.json. Contact names will not be added.")
        return {}

def get_custom_fields(data, fields_list, kontak_map=None):
    """Extract custom fields from the data based on user specification"""
    result = {}

    # Always include timestamp if requested
    if 'timestamp' in fields_list and 'timestamp' in data:
        result['timestamp'] = data['timestamp']

    # User fields with custom naming
    if 'from_user' in fields_list and 'from' in data:
        from_user = data['from']
        result['from_user'] = from_user

        # Add from_name if kontak_map is available
        if kontak_map and from_user in kontak_map:
            result['from_name'] = kontak_map[from_user]

    if 'to_user' in fields_list and 'to' in data:
        to_user = data['to']
        result['to_user'] = to_user

        # Add to_name if kontak_map is available
        if kontak_map and to_user in kontak_map:
            result['to_name'] = kontak_map[to_user]

    # Message content
    if 'message' in fields_list and 'body' in data:
        result['message'] = data['body']

    # Formatted datetime
    if 'datetime' in fields_list and 'timestamp' in data:
        datetime_str = datetime.fromtimestamp(data['timestamp']).strftime('%d/%m/%y %H:%M:%S')
        result['datetime'] = datetime_str

    # Additional raw fields
    raw_fields = ['id', 'fromMe', 'source', 'hasMedia']
    for field in raw_fields:
        if field in fields_list and field in data:
            result[field] = data[field]

    return result

# Parse command line arguments
args = parse_arguments()

# Load contact data from kontak_saya.json
kontak_map = load_kontak_saya()

# Determine input file path
if '/' not in args.input_file and '\\' not in args.input_file:
    FILE_PATH = os.path.join(os.path.dirname(__file__), "messagesId", args.input_file)
else:
    FILE_PATH = args.input_file

print(f"Processing file: {FILE_PATH}")
print(f"Output fields: {args.fields}")

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = json.load(f)
    print(f"JSON loaded successfully. Number of items: {len(content) if isinstance(content, list) else 'Not a list'}")

# Parse custom fields
fields_list = [field.strip() for field in args.fields.split(',')]

chats = []
for i in content:
    chat_dict = get_custom_fields(i, fields_list, kontak_map)
    chats.append(chat_dict)

print(f"Processed {len(chats)} chats from {FILE_PATH}")

# Display to terminal if pretty flag is set
if args.pretty:
    print("\n" + "="*50)
    print("OUTPUT TO TERMINAL:")
    print("="*50)
    if args.terminal_only:
        print(json.dumps(chats, indent=2, ensure_ascii=False))
    else:
        print(json.dumps(chats[:5], indent=2, ensure_ascii=False))  # Show first 5 items as preview
        if len(chats) > 5:
            print(f"... and {len(chats) - 5} more items")
    print("="*50 + "\n")

# Handle file output
if not args.terminal_only:
    # Ensure output directory exists
    os.makedirs(os.path.dirname(args.output), exist_ok=True)

    # Read existing data if file exists
    try:
        with open(args.output, 'r', encoding='utf-8') as f:
            existing_data = json.load(f)
        print(f"Existing data loaded from {args.output}")
    except (FileNotFoundError, json.JSONDecodeError):
        existing_data = []
        print(f"File {args.output} not found, creating new file...")

    # Append new chats to existing data
    existing_data.extend(chats)

    # Write back to file with append mode
    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(existing_data, f, indent=4, ensure_ascii=False)

    print(f"Successfully saved {len(chats)} new chats to {args.output} (total: {len(existing_data)} chats)")
else:
    print("Terminal-only mode: No file saved")

print(f"\nUsage examples:")
print(f"  python messagesId.py                                    # Use default settings")
print(f"  python messagesId.py example2.json                      # Use different input file")
print(f"  python messagesId.py --fields 'timestamp,message'       # Custom fields")
print(f"  python messagesId.py -o output/output.json --fields 'from_user,to_user,message'")
print(f"  python messagesId.py --pretty --terminal-only           # Show to terminal only")