"""OTP processing and extraction tests."""
import pytest
from app.services.otp_service import OTPService
from app.util import OtpExtractor


class TestOtpExtraction:
    """Test OTP extraction from messages."""

    def test_extract_otp_vbgramg(self):
        """Test OTP extraction from VBGRAMG message."""
        message = "OTP for VBGRAMG FTO Login for the Reference No.: 000* is: 980847. Do not share it with anyone."
        result = OtpExtractor.extract_otp(message)

        assert result.otp_value == "980847"
        assert result.purpose == "FTO Login"
        assert result.reference == "000*"

    def test_extract_otp_generic(self):
        """Test OTP extraction from generic message."""
        message = "Your OTP is 123456. Valid for 5 minutes."
        result = OtpExtractor.extract_otp(message)

        assert result.otp_value == "123456"

    def test_extract_otp_code_keyword(self):
        """Test OTP extraction with 'code' keyword."""
        message = "Your verification code is 654321"
        result = OtpExtractor.extract_otp(message)

        assert result.otp_value == "654321"

    def test_mask_otp(self):
        """Test OTP masking."""
        assert OtpExtractor.mask_otp("123456") == "12••56"
        assert OtpExtractor.mask_otp("1234") == "12••34"
        assert OtpExtractor.mask_otp("12") == "••••••"
        assert OtpExtractor.mask_otp(None) == "••••••"

    def test_validate_otp_length(self):
        """Test OTP length validation."""
        assert OtpExtractor.validate_otp_length("123456", 6) is True
        assert OtpExtractor.validate_otp_length("1234", 4) is True
        assert OtpExtractor.validate_otp_length("123", 4) is False


class TestValidators:
    """Test input validators."""

    def test_validate_email_valid(self):
        from app.core.validators import validate_email
        assert validate_email("test@example.com") is True
        assert validate_email("admin@otp-relay.gov.in") is True

    def test_validate_email_invalid(self):
        from app.core.validators import validate_email
        assert validate_email("invalid") is False
        assert validate_email("@example.com") is False
        assert validate_email("test@") is False

    def test_validate_password_valid(self):
        from app.core.validators import validate_password
        is_valid, msg = validate_password("StrongPass1")
        assert is_valid is True

    def test_validate_password_too_short(self):
        from app.core.validators import validate_password
        is_valid, msg = validate_password("Short1")
        assert is_valid is False
        assert "8 characters" in msg

    def test_validate_password_no_uppercase(self):
        from app.core.validators import validate_password
        is_valid, msg = validate_password("nouppercase1")
        assert is_valid is False
        assert "uppercase" in msg

    def test_validate_phone_valid(self):
        from app.core.validators import validate_phone
        assert validate_phone("9876543210") is True
        assert validate_phone("+919876543210") is True

    def test_validate_phone_invalid(self):
        from app.core.validators import validate_phone
        assert validate_phone("12345") is False
        assert validate_phone("abc123") is False

    def test_validate_sender_id(self):
        from app.core.validators import validate_sender_id
        assert validate_sender_id("BT-VBGRAM-G") is True
        assert validate_sender_id("AX_MKUBER_S") is True
        assert validate_sender_id("invalid sender!") is False

    def test_validate_otp(self):
        from app.core.validators import validate_otp
        assert validate_otp("123456") is True
        assert validate_otp("1234") is True
        assert validate_otp("123") is False
        assert validate_otp("abcdef") is False
