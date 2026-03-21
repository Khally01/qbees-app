from twilio.rest import Client

from app.config import get_settings

settings = get_settings()


def get_twilio_client() -> Client | None:
    if not settings.twilio_account_sid or not settings.twilio_auth_token:
        return None
    return Client(settings.twilio_account_sid, settings.twilio_auth_token)


async def send_otp(phone: str) -> bool:
    """Send OTP via Twilio Verify. Returns True if sent successfully."""
    client = get_twilio_client()
    if not client:
        # Dev mode: accept any phone, no real OTP
        return True

    verification = client.verify.v2.services(
        settings.twilio_verify_service_sid
    ).verifications.create(to=phone, channel="sms")

    return verification.status == "pending"


async def verify_otp(phone: str, code: str) -> bool:
    """Verify OTP code. Returns True if valid."""
    client = get_twilio_client()
    if not client:
        # Dev mode: accept "123456" as valid code
        return code == "123456"

    try:
        check = client.verify.v2.services(
            settings.twilio_verify_service_sid
        ).verification_checks.create(to=phone, code=code)
        return check.status == "approved"
    except Exception:
        return False
