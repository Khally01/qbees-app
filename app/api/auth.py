import re

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from app.database import AsyncSession, get_db
from app.middleware.auth import create_access_token
from app.models.user import User
from app.schemas.auth import OTPRequest, OTPVerify, TokenResponse
from app.services.auth_service import send_otp, verify_otp

router = APIRouter(prefix="/auth", tags=["auth"])


def normalize_phone(phone: str) -> str:
    """Normalize Australian phone numbers to E.164 format (+61...)."""
    digits = re.sub(r"[^\d+]", "", phone)
    # Remove leading + for processing
    if digits.startswith("+"):
        digits = digits[1:]
    # Australian mobile: 04XX -> +614XX
    if digits.startswith("04"):
        digits = "61" + digits[1:]
    # Already has country code
    if digits.startswith("61") and len(digits) >= 11:
        return "+" + digits
    # Just digits, assume Australian
    if digits.startswith("4") and len(digits) == 9:
        return "+61" + digits
    return "+" + digits


@router.post("/otp/send")
async def request_otp(body: OTPRequest, db: AsyncSession = Depends(get_db)):
    """Send OTP to phone number."""
    phone = normalize_phone(body.phone)

    result = await db.execute(select(User).where(User.phone == phone, User.is_active == True))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found for this phone number. Contact your admin.",
        )

    success = await send_otp(phone)
    if not success:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to send OTP")

    return {"message": "OTP sent", "phone": phone}


@router.post("/otp/verify", response_model=TokenResponse)
async def verify_otp_code(body: OTPVerify, db: AsyncSession = Depends(get_db)):
    """Verify OTP and return JWT token."""
    phone = normalize_phone(body.phone)

    valid = await verify_otp(phone, body.code)
    if not valid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired code")

    result = await db.execute(select(User).where(User.phone == phone, User.is_active == True))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    token = create_access_token(user.id, user.tenant_id, user.role)

    return TokenResponse(
        access_token=token,
        user_id=str(user.id),
        role=user.role,
        name=user.name,
    )
