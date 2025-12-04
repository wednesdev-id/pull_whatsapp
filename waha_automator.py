#!/usr/bin/env python3
"""
WAHA API Automation Script
Script untuk automatisasi request ke WAHA API dengan auth barrier
"""

import requests
import json
import os
import time
from datetime import datetime
from typing import Dict, List, Optional, Any
import argparse
import base64


class WahaAPIClient:
    """
    Client untuk mengakses WAHA API dengan authentication barrier
    """

    def __init__(self, base_url: str = "http://localhost:3000",
                 username: str = "admin",
                 password: str = "e44213b43dc349709991dbb1a6343e47",
                 api_key: str = "c79b6529186c44aa9d536657ffea710b",
                 timeout: int = 30):
        """
        Initialize WAHA API Client

        Args:
            base_url: Base URL untuk WAHA API
            username: Username untuk basic auth
            password: Password untuk basic auth
            api_key: API key untuk request
            timeout: Request timeout in seconds
        """
        self.base_url = base_url.rstrip('/')
        self.username = username
        self.password = password
        self.api_key = api_key
        self.timeout = timeout
        self.session = requests.Session()

        # Setup authentication headers
        self._setup_auth()

    def _setup_auth(self):
        """Setup basic authentication untuk session"""
        # Basic Auth credentials
        auth_string = f"{self.username}:{self.password}"
        auth_bytes = auth_string.encode('ascii')
        auth_b64 = base64.b64encode(auth_bytes).decode('ascii')

        # Set headers
        self.session.headers.update({
            'Authorization': f'Basic {auth_b64}',
            'X-API-Key': self.api_key,
            'Content-Type': 'application/json',
            'User-Agent': 'WAHA-Automator/1.0'
        })

    def test_connection(self) -> bool:
        """
        Test koneksi ke WAHA API

        Returns:
            bool: True jika berhasil, False jika gagal
        """
        try:
            # Try to access a general endpoint first
            response = self.session.get(f"{self.base_url}/", timeout=self.timeout)
            print(f"Testing connection to {self.base_url}/")
            print(f"Status Code: {response.status_code}")

            # Also try the specific WAHA endpoint structure
            test_endpoint = f"{self.base_url}/api/default/chats/test@c.us/messages?limit=1"
            test_response = self.session.get(test_endpoint, timeout=self.timeout)
            print(f"Testing WAHA endpoint: {test_endpoint}")
            print(f"WAHA Status Code: {test_response.status_code}")

            if response.status_code in [200, 404]:  # 404 might mean server is up but endpoint doesn't exist
                print("Server is reachable!")
                if test_response.status_code == 200:
                    print("WAHA API endpoint is working!")
                    return True
                elif test_response.status_code == 401:
                    print("WAHA API found, but authentication required - this is expected!")
                    return True
                elif test_response.status_code == 422:
                    print("WAHA API found, session validation working - this is expected!")
                    return True
                else:
                    print(f"WAHA API responded with: {test_response.status_code}")
                    return True  # Server is up, might be different endpoint structure
            else:
                print(f"Connection failed: {response.text}")
                return False

        except requests.exceptions.Timeout:
            print("Connection timeout - WAHA server might be starting up, try again later")
            return False
        except requests.exceptions.ConnectionError as e:
            print(f"Connection error: {str(e)}")
            print("Make sure WAHA server is running at the specified URL")
            return False
        except requests.exceptions.RequestException as e:
            print(f"Connection error: {str(e)}")
            return False

    def generate_mock_data(self, chat_id: str, limit: int = 100) -> Dict[str, Any]:
        """
        Generate mock WhatsApp messages untuk testing

        Args:
            chat_id: Chat ID
            limit: Number of messages to generate

        Returns:
            Dict: Mock response data
        """
        import random
        from datetime import datetime, timedelta

        messages = []
        base_time = datetime.now()

        sample_messages = [
            "Halo, bagaimana kabarnya?",
            "Baik-baik saja, terima kasih!",
            "Apakah project sudah selesai?",
            "Sudah, tinggal testing final",
            "Oke, saya cek dulu ya",
            "Siap, saya tunggu update nya",
            "Documents sudah saya kirim",
            "Terima kasih atas bantuannya",
            "Sampai jumpa besok!",
            "Have a great day!"
        ]

        for i in range(min(limit, 20)):  # Max 20 messages for demo
            timestamp = int((base_time - timedelta(hours=i*2)).timestamp())
            is_from_me = random.choice([True, False])

            message = {
                "id": f"mock_msg_{i}_{timestamp}",
                "timestamp": timestamp,
                "from": chat_id if not is_from_me else "6282243673017@c.us",
                "to": "6282243673017@c.us" if not is_from_me else chat_id,
                "body": random.choice(sample_messages),
                "fromMe": is_from_me,
                "hasMedia": False,
                "mediaType": None,
                "mediaCaption": None,
                "ack": random.randint(1, 3)
            }
            messages.append(message)

        return {
            "messages": messages,
            "total": len(messages),
            "hasMore": len(messages) >= limit,
            "mock": True,
            "generated_at": datetime.now().isoformat()
        }

    def get_chat_messages(self, chat_id: str,
                         limit: int = 100,
                         offset: int = 0,
                         sort_by: str = "timestamp",
                         sort_order: str = "desc",
                         use_mock: bool = False) -> Optional[Dict[str, Any]]:
        """
        Mendapatkan pesan dari chat tertentu

        Args:
            chat_id: ID chat (WhatsApp number)
            limit: Jumlah maksimal pesan
            offset: Offset untuk pagination
            sort_by: Field untuk sorting
            sort_order: Urutan sorting (asc/desc)
            use_mock: Gunakan mock data untuk testing

        Returns:
            Dict: Response dari API atau None jika error
        """
        if use_mock:
            print("Using mock data for testing...")
            return self.generate_mock_data(chat_id, limit)

        try:
            # Build URL
            encoded_chat_id = requests.utils.quote(chat_id, safe='')
            url = f"{self.base_url}/api/default/chats/{encoded_chat_id}/messages"

            # Parameters
            params = {
                'sortBy': sort_by,
                'sortOrder': sort_order,
                'limit': limit,
                'offset': offset
            }

            print(f"Requesting messages from: {url}")
            print(f"Parameters: {params}")

            # Make request
            response = self.session.get(url, params=params, timeout=self.timeout)

            print(f"Response Status: {response.status_code}")

            if response.status_code == 200:
                data = response.json()
                # Handle different response structures
                if isinstance(data, list):
                    messages = data
                elif isinstance(data, dict):
                    messages = data.get('messages', data.get('data', []))
                else:
                    messages = []

                print(f"Success! Retrieved {len(messages)} messages")
                return data
            else:
                error_text = response.text
                print(f"Error: {response.status_code} - {error_text}")

                # Detect session issues and suggest mock data
                if response.status_code == 422:
                    if "SCAN_QR_CODE" in error_text:
                        print("\nTip: WhatsApp session needs QR code scan.")
                        print("     Use --mock-data flag for testing development:")
                        print("     python waha_automator.py --mock-data --limit 10")
                    elif "DISCONNECTED" in error_text:
                        print("\nTip: WhatsApp session is disconnected.")
                        print("     Please reconnect and try again.")

                return None

        except requests.exceptions.RequestException as e:
            print(f"Request error: {str(e)}")
            return None
        except json.JSONDecodeError as e:
            print(f"JSON decode error: {str(e)}")
            return None

    def save_response_to_file(self, data: Dict[str, Any],
                             chat_id: str,
                             output_dir: str = "output") -> str:
        """
        Menyimpan response API ke file JSON

        Args:
            data: Response data dari API
            chat_id: ID chat untuk nama file
            output_dir: Directory output

        Returns:
            str: Path file yang disimpan
        """
        try:
            # Ensure output directory exists
            os.makedirs(output_dir, exist_ok=True)

            # Generate filename dengan timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            clean_chat_id = chat_id.replace('@c.us', '').replace('+', '')
            filename = f"waha_messages_{clean_chat_id}_{timestamp}.json"

            # Prepare data untuk disimpan
            # Handle different response structures
            if isinstance(data, list):
                messages = data
            elif isinstance(data, dict):
                messages = data.get('messages', data.get('data', []))
            else:
                messages = []

            save_data = {
                'metadata': {
                    'chat_id': chat_id,
                    'retrieved_at': datetime.now().isoformat(),
                    'total_messages': len(messages),
                    'api_response': {
                        'status': 'success',
                        'timestamp': datetime.now().isoformat()
                    }
                },
                'messages': messages
            }

            # Save to file
            filepath = os.path.join(output_dir, filename)
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(save_data, f, indent=2, ensure_ascii=False)

            print(f"Saved {len(save_data['messages'])} messages to: {filepath}")
            return filepath

        except Exception as e:
            print(f"Error saving file: {str(e)}")
            raise


def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='WAHA API Automation Tool')

    # WAHA API configuration
    parser.add_argument('--url', default='http://localhost:3000',
                       help='WAHA API base URL (default: http://localhost:3000)')
    parser.add_argument('--username', default='admin',
                       help='Username for basic auth (default: admin)')
    parser.add_argument('--password', default='e44213b43dc349709991dbb1a6343e47',
                       help='Password for basic auth')
    parser.add_argument('--api-key', default='c79b6529186c44aa9d536657ffea710b',
                       help='API key for WAHA')

    # Chat configuration
    parser.add_argument('--chat-id', default='6282243673017@c.us',
                       help='Chat ID (format: 628123456789@c.us). Available: 6282243673017@c.us, 628123456789@c.us, etc.')
    parser.add_argument('--limit', type=int, default=100,
                       help='Limit messages per request (default: 100, max: 1000)')
    parser.add_argument('--offset', type=int, default=0, choices=[0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000],
                       help='Offset for pagination. Options: 0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000 (default: 0)')
    parser.add_argument('--sort-by', default='timestamp',
                       help='Sort field (default: timestamp)')
    parser.add_argument('--sort-order', default='desc',
                       choices=['asc', 'desc'], help='Sort order (default: desc)')

    # Output configuration
    parser.add_argument('--output-dir', default='output',
                       help='Output directory (default: output)')
    parser.add_argument('--test-connection', action='store_true',
                       help='Test connection to WAHA API only')

    # Automation options
    parser.add_argument('--auto-retry', type=int, default=3,
                       help='Number of retry attempts (default: 3)')
    parser.add_argument('--retry-delay', type=int, default=5,
                       help='Delay between retries in seconds (default: 5)')
    parser.add_argument('--timeout', type=int, default=30,
                       help='Request timeout in seconds (default: 30)')
    parser.add_argument('--mock-data', action='store_true',
                       help='Use mock data for testing when WA session is not ready')

    return parser.parse_args()


def main():
    """Main function"""
    args = parse_arguments()

    print("WAHA API Automation Tool")
    print("=" * 50)

    # Validate parameters
    if args.limit > 1000:
        print("Error: Maximum limit is 1000 messages per request")
        return 1

    if args.limit <= 0:
        print("Error: Limit must be greater than 0")
        return 1

    print(f"Chat ID: {args.chat_id}")
    print(f"Limit: {args.limit} messages")
    print(f"Offset: {args.offset}")
    print(f"Sort: {args.sort_by} ({args.sort_order})")
    print("-" * 50)

    # Initialize client
    client = WahaAPIClient(
        base_url=args.url,
        username=args.username,
        password=args.password,
        api_key=args.api_key,
        timeout=args.timeout
    )

    # Test connection if requested
    if args.test_connection:
        if client.test_connection():
            print("Connection test passed!")
        else:
            print("Connection test failed!")
            return 1
        return 0

    # Test connection first
    print("Testing connection...")
    if not client.test_connection():
        print("Cannot proceed with automation - connection failed!")
        return 1

    # Get messages with retry mechanism
    for attempt in range(args.auto_retry + 1):
        if attempt > 0:
            print(f"Retry attempt {attempt}/{args.auto_retry}...")
            time.sleep(args.retry_delay)

        print(f"Attempt {attempt + 1}: Getting messages for chat {args.chat_id}")

        response_data = client.get_chat_messages(
            chat_id=args.chat_id,
            limit=args.limit,
            offset=args.offset,
            sort_by=args.sort_by,
            sort_order=args.sort_order,
            use_mock=args.mock_data
        )

        if response_data:
            # Save response to file
            try:
                saved_file = client.save_response_to_file(
                    data=response_data,
                    chat_id=args.chat_id,
                    output_dir=args.output_dir
                )
                print("Automation completed successfully!")
                print(f"Output file: {saved_file}")

                # Print summary
                # Handle different response structures
                if isinstance(response_data, list):
                    messages = response_data
                elif isinstance(response_data, dict):
                    messages = response_data.get('messages', response_data.get('data', []))
                else:
                    messages = []

                print("Summary:")
                print(f"   - Total messages: {len(messages)}")
                if messages:
                    first_msg = messages[0]
                    last_msg = messages[-1]
                    print(f"   - Date range: {first_msg.get('timestamp')} to {last_msg.get('timestamp')}")

                return 0

            except Exception as e:
                print(f"Error saving response: {str(e)}")
                if attempt == args.auto_retry:
                    return 1
        else:
            print(f"Failed to get messages on attempt {attempt + 1}")
            if attempt == args.auto_retry:
                return 1

    return 1


if __name__ == "__main__":
    exit_code = main()
    exit(exit_code)