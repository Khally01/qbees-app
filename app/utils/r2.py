import uuid

import boto3
from botocore.config import Config

from app.config import get_settings

settings = get_settings()


def get_r2_client():
    """Get S3-compatible client for Cloudflare R2."""
    if not settings.r2_account_id:
        return None

    return boto3.client(
        "s3",
        endpoint_url=f"https://{settings.r2_account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=settings.r2_access_key_id,
        aws_secret_access_key=settings.r2_secret_access_key,
        config=Config(signature_version="s3v4"),
    )


def generate_upload_key(tenant_id: uuid.UUID, task_id: uuid.UUID, filename: str) -> str:
    """Generate a unique R2 object key for a photo upload."""
    ext = filename.rsplit(".", 1)[-1] if "." in filename else "jpg"
    unique = uuid.uuid4().hex[:8]
    return f"{tenant_id}/{task_id}/{unique}.{ext}"


def create_presigned_upload_url(r2_key: str, content_type: str = "image/jpeg", expires_in: int = 3600) -> str:
    """Create a presigned URL for uploading a photo to R2."""
    client = get_r2_client()
    if not client:
        # Dev mode: return a fake URL
        return f"http://localhost:8000/dev/upload/{r2_key}"

    return client.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": settings.r2_bucket_name,
            "Key": r2_key,
            "ContentType": content_type,
        },
        ExpiresIn=expires_in,
    )


def get_photo_url(r2_key: str) -> str:
    """Get the public URL for a photo."""
    if settings.r2_public_url:
        return f"{settings.r2_public_url}/{r2_key}"

    # Fallback to presigned read URL
    client = get_r2_client()
    if not client:
        return f"http://localhost:8000/dev/photos/{r2_key}"

    return client.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.r2_bucket_name, "Key": r2_key},
        ExpiresIn=3600,
    )
