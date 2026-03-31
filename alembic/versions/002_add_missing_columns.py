"""Add missing Phase 2+3 columns (fix for 001 which ran but skipped SQL)

Revision ID: 002_add_missing_columns
Revises: 001_phase2_phase3
Create Date: 2026-03-31

"""
from alembic import op

revision = "002_add_missing_columns"
down_revision = "001_phase2_phase3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Properties: Phase 2 cleaning-specific fields
    op.execute("ALTER TABLE properties ADD COLUMN IF NOT EXISTS cleaning_instructions TEXT")
    op.execute("ALTER TABLE properties ADD COLUMN IF NOT EXISTS access_method VARCHAR(50)")
    op.execute("ALTER TABLE properties ADD COLUMN IF NOT EXISTS access_code VARCHAR(100)")
    op.execute("ALTER TABLE properties ADD COLUMN IF NOT EXISTS parking_instructions TEXT")
    op.execute("ALTER TABLE properties ADD COLUMN IF NOT EXISTS wifi_name VARCHAR(100)")
    op.execute("ALTER TABLE properties ADD COLUMN IF NOT EXISTS wifi_password VARCHAR(100)")
    op.execute("ALTER TABLE properties ADD COLUMN IF NOT EXISTS consumables JSON")
    op.execute("ALTER TABLE properties ADD COLUMN IF NOT EXISTS bedrooms INTEGER")
    op.execute("ALTER TABLE properties ADD COLUMN IF NOT EXISTS bathrooms INTEGER")
    op.execute("ALTER TABLE properties ADD COLUMN IF NOT EXISTS living_areas INTEGER")

    # Users: Phase 3 cleaner profile fields
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname VARCHAR(100)")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS address VARCHAR(500)")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS suburb VARCHAR(100)")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS transport VARCHAR(50)")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS skills JSON")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS regions JSON")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS notes TEXT")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS start_date DATE")


def downgrade() -> None:
    for col in ["cleaning_instructions", "access_method", "access_code",
                "parking_instructions", "wifi_name", "wifi_password",
                "consumables", "bedrooms", "bathrooms", "living_areas"]:
        op.execute(f"ALTER TABLE properties DROP COLUMN IF EXISTS {col}")

    for col in ["nickname", "address", "suburb", "transport", "skills", "regions", "notes", "start_date"]:
        op.execute(f"ALTER TABLE users DROP COLUMN IF EXISTS {col}")
