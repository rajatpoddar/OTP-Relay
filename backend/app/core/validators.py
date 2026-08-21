"""Input validation and sanitization utilities."""
import re
from typing import Optional


def validate_email(email: str) -> bool:
    """Validate email format."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_password(password: str) -> tuple[bool, str]:
    """Validate password strength. Returns (is_valid, message)."""
    if len(password) < 8:
        return False, "Password must be at least 8 characters"
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    return True, "Valid"


def validate_phone(phone: str) -> bool:
    """Validate Indian phone number format."""
    # Remove spaces and dashes
    cleaned = phone.replace(' ', '').replace('-', '')
    # Indian phone numbers: 10 digits starting with 6-9, or with country code +91
    pattern = r'^(\+91)?[6-9]\d{9}$'
    return bool(re.match(pattern, cleaned))


def sanitize_string(value: str, max_length: int = 255) -> str:
    """Sanitize string input."""
    if not value:
        return value
    # Strip whitespace
    value = value.strip()
    # Limit length
    value = value[:max_length]
    # Remove null bytes
    value = value.replace('\x00', '')
    return value


def validate_sender_id(sender_id: str) -> bool:
    """Validate sender ID format (alphanumeric, hyphens, underscores)."""
    pattern = r'^[A-Za-z0-9_-]{1,20}$'
    return bool(re.match(pattern, sender_id))


def validate_otp(otp: str) -> bool:
    """Validate OTP format (4-8 digits)."""
    pattern = r'^\d{4,8}$'
    return bool(re.match(pattern, otp))


def validate_uuid(uuid_str: str) -> bool:
    """Validate UUID format."""
    pattern = r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    return bool(re.match(pattern, uuid_str.lower()))
