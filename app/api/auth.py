from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from app.database import AsyncSession, get_db
from app.middleware.auth import create_access_token
from app.models.user import User
from app.schemas.auth import OTPRequest, OTPVerify, TokenResponse
from app.services.auth_service import send_otp, verify_otp

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/otp/send")
async def request_otp(body: OTPRequest, db: AsyncSession = Depends(get_db)):
    """Send OTP to phone number. Creates user if they don't exist yet (for dev)."""
    # Check user exists
    result = await db.execute(select(User).where(User.phone == body.phone, User.is_active == True))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found for this phone number. Contact your admin.",
        )

    success = await send_otp(body.phone)
    if not success:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to send OTP")

    return {"message": "OTP sent", "phone": body.phone}


@router.post("/otp/verify", response_model=TokenResponse)
async def verify_otp_code(body: OTPVerify, db: AsyncSession = Depends(get_db)):
    """Verify OTP and return JWT token."""
    valid = await verify_otp(body.phone, body.code)
    if not valid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired code")

    result = await db.execute(select(User).where(User.phone == body.phone, User.is_active == True))
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
