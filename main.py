import json
from datetime import datetime


with open ('example1.json', 'r', encoding='utf-8') as f:
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
print(chats)

with open('data_saya.json', 'w', encoding='utf-8') as f:
    json.dump(chats, f, indent=4, ensure_ascii=False)
