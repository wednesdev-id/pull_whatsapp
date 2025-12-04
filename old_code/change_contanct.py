import json
import sys

# Set encoding untuk output
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

# Load data dari response.json (data sumber untuk id dan name)
with open("response.json", 'r', encoding='utf-8') as f:
    response_data = json.load(f)

# Load data dari kontak_saya.json (data yang akan diupdate)
with open("output/kontak_saya.json", 'r', encoding='utf-8') as f:
    kontak_saya_data = json.load(f)

# Create mapping dari response data berdasarkan ID untuk quick lookup
response_map = {}
for item in response_data:
    contact_id = item.get("id")
    if contact_id:
        response_map[contact_id] = item

print(f"Total kontak di response.json: {len(response_data)}")
print(f"Total kontak di kontak_saya.json: {len(kontak_saya_data)}")
print(f"Total mapping yang dibuat: {len(response_map)}")

# Proses replacement - update kontak_saya.json dengan id dan name dari response.json
updated_count = 0
for kontak in kontak_saya_data:
    contact_id = kontak.get("id")

    if contact_id in response_map:
        response_contact = response_map[contact_id]

        # Update field name dari response.json
        if "name" in response_contact:
            old_name = kontak.get("name", "N/A")
            new_name = response_contact["name"]
            kontak["name"] = new_name
            updated_count += 1
            print(f"Updated ID: {contact_id}")
            print(f"  Old name: {old_name}")
            print(f"  New name: {new_name}")
            print()

print(f"\nTotal kontak yang diupdate: {updated_count}")

# Simpan hasil yang sudah diupdate ke file kontak_saya.json
with open("output/kontak_saya_updated.json", 'w', encoding='utf-8') as f:
    json.dump(kontak_saya_data, f, indent=2, ensure_ascii=False)

print("Hasil update disimpan ke file: output/kontak_saya_updated.json")

# Tampilkan contoh hasil
print("\n=== CONTOH HASIL UPDATE ===")
for i, kontak in enumerate(kontak_saya_data[:5]):  # Tampilkan 5 pertama
    print(f"{i+1}. ID: {kontak.get('id')}")
    print(f"   Name: {kontak.get('name', 'N/A')}")
    print()

    