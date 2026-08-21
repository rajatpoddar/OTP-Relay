"""Standalone OTP utility functions for extraction, masking, and validation."""
import re
from typing import Optional
from dataclasses import dataclass


@dataclass
class ExtractionResult:
    """Result of OTP extraction from a message."""
    otp_value: Optional[str] = None
    purpose: Optional[str] = None
    reference: Optional[str] = None


class OtpExtractor:
    """Standalone OTP extraction utilities."""

    @staticmethod
    def extract_otp(message: str, custom_regex: Optional[str] = None) -> ExtractionResult:
        """
        Extract OTP, purpose, and reference from an SMS message.

        Supports the VBGRAMG format:
        "OTP for VBGRAMG FTO Login for the Reference No.: 000* is: 980847. Do not share it with anyone."
        """
        otp_value = None
        purpose = None
        reference = None

        # Try custom regex first
        if custom_regex:
            try:
                match = re.search(custom_regex, message, re.IGNORECASE)
                if match:
                    otp_value = match.group(1) if match.groups() else match.group(0)
            except re.error:
                pass

        # Fallback: common OTP patterns
        if not otp_value:
            patterns = [
                r'(?:OTP|otp|Otp)[:\s]*(\d{4,8})',
                r'(?:code|Code)[:\s]*(\d{4,8})',
                r'(?:verification|Verification)[:\s]*(\d{4,8})',
                r'(?:is|Is)[:\s]*(\d{4,8})\.',
                r'\b(\d{4,8})\b',
            ]
            for pattern in patterns:
                match = re.search(pattern, message)
                if match:
                    otp_value = match.group(1)
                    break

        # Extract purpose
        # First try: skip optional service name (uppercase word) before purpose
        purpose_match = re.search(
            r'(?:for|For)\s+(?:[A-Z][A-Z0-9_]+\s+)?(.+?)(?:\s+for|\s+is|\.|\s+Do\s+not)',
            message, re.IGNORECASE
        )
        if purpose_match:
            purpose = purpose_match.group(1).strip()

        # Extract reference
        ref_match = re.search(
            r'(?:Reference|reference|Ref|ref)\s+(?:No\.?|number)?\s*[:\s]*(\S+)',
            message, re.IGNORECASE
        )
        if ref_match:
            reference = ref_match.group(1)

        return ExtractionResult(
            otp_value=otp_value,
            purpose=purpose,
            reference=reference,
        )

    @staticmethod
    def mask_otp(otp_value: Optional[str]) -> str:
        """Mask OTP for display: show first 2 and last 2 chars."""
        if not otp_value or len(otp_value) < 4:
            return "••••••"
        return f"{otp_value[:2]}••{otp_value[-2:]}"

    @staticmethod
    def validate_otp_length(otp_value: str, expected_length: int) -> bool:
        """Validate OTP has expected length."""
        return len(otp_value) == expected_length

    @staticmethod
    def find_authorized_sender(sender_id_text: str, authorized_senders: list) -> Optional[dict]:
        """Find matching authorized sender from a list."""
        for sender in authorized_senders:
            if sender.get("sender_id") == sender_id_text:
                return sender
        return None
