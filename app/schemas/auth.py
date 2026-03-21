from pydantic import BaseModel


class OTPRequest(BaseModel):
    phone: str  # E.164 format, e.g. +61412345678


class OTPVerify(BaseModel):
    phone: str
    code: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    role: str
    name: str
