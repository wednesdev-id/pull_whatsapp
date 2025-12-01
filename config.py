"""Configuration settings for WhatsApp Message Parser."""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class Config:
    """Application configuration class."""

    # File and directory settings
    JSON_DIRECTORY = os.getenv("JSON_DIRECTORY", ".")
    JSON_FILE_PATTERN = os.getenv("JSON_FILE_PATTERN", "response_*.json")

    # Display settings
    DEFAULT_MESSAGE_LIMIT = int(os.getenv("DEFAULT_MESSAGE_LIMIT", "20"))
    DATETIME_FORMAT = os.getenv("DATETIME_FORMAT", "%Y-%m-%d %H:%M:%S")

    # Logging settings
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    LOG_FORMAT = os.getenv(
        "LOG_FORMAT",
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )

    # Message filtering
    CASE_SENSITIVE_SEARCH = os.getenv("CASE_SENSITIVE_SEARCH", "false").lower() == "true"

    # Output settings
    SHOW_DIRECTION_INDICATORS = os.getenv("SHOW_DIRECTION_INDICATORS", "true").lower() == "true"
    HIDE_PHONE_SUFFIX = os.getenv("HIDE_PHONE_SUFFIX", "true").lower() == "true"

    @classmethod
    def get_display_name(cls, phone_number: str) -> str:
        """
        Convert phone number to display name.

        Args:
            phone_number: Phone number string

        Returns:
            Formatted display name
        """
        if cls.HIDE_PHONE_SUFFIX and phone_number.endswith("@c.us"):
            return phone_number.replace("@c.us", "")
        return phone_number


class MessageConfig:
    """Configuration for message processing and display."""

    # Message fields to extract
    REQUIRED_FIELDS = ["timestamp", "from", "to", "body"]
    OPTIONAL_FIELDS = ["fromMe", "hasMedia", "media", "ack", "location", "vCards"]

    # Message type indicators
    MEDIA_TYPES = {
        "image": "🖼️",
        "video": "🎥",
        "audio": "🎵",
        "document": "📄",
        "sticker": "😀"
    }

    ACK_STATUS = {
        0: "⏳ PENDING",
        1: "✓ SENT",
        2: "✓✓ RECEIVED",
        3: "✓✓✓ READ"
    }


# Database configuration (for future enhancements)
class DatabaseConfig:
    """Database configuration settings."""

    DATABASE_TYPE = os.getenv("DATABASE_TYPE", "sqlite")
    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        "sqlite:///messages.db"
    )

    # PostgreSQL settings (if used)
    POSTGRES_USER = os.getenv("POSTGRES_USER", "evolution")
    POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "evolution123")
    POSTGRES_DB = os.getenv("POSTGRES_DB", "evolution")
    POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
    POSTGRES_PORT = int(os.getenv("POSTGRES_PORT", "5432"))


# Export configuration
class ExportConfig:
    """Configuration for message export functionality."""

    SUPPORTED_FORMATS = ["json", "csv", "xlsx", "txt"]
    DEFAULT_EXPORT_FORMAT = os.getenv("DEFAULT_EXPORT_FORMAT", "json")
    EXPORT_DIRECTORY = os.getenv("EXPORT_DIRECTORY", "exports")

    # CSV export settings
    CSV_ENCODING = os.getenv("CSV_ENCODING", "utf-8")
    CSV_DELIMITER = os.getenv("CSV_DELIMITER", ",")

    # Excel export settings
    EXCEL_SHEET_NAME = os.getenv("EXCEL_SHEET_NAME", "Messages")
    MAX_EXCEL_ROWS = 1048576  # Excel row limit