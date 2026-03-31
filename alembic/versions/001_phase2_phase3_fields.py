"""Phase 2+3: Add property cleaning fields and user cleaner profile fields

Revision ID: 001_phase2_phase3
Revises:
Create Date: 2026-03-30

"""
from alembic import op
import sqlalchemy as sa

revision = "001_phase2_phase3"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- properties: Phase 2 cleaning fields ---
    conn = op.get_bind()

    # Check if columns already exist before adding (idempotent)
    insp = sa.inspect(conn)
    existing_property_cols = {c["name"] for c in insp.get_columns("properties")}
    existing_user_cols = {c["name"] for c in insp.get_columns("users")}

    property_cols = {
        "cleaning_instructions": sa.Column("cleaning_instructions", sa.Text, nullable=True),
        "access_method": sa.Column("access_method", sa.String(50), nullable=True),
        "access_code": sa.Column("access_code", sa.String(100), nullable=True),
        "parking_instructions": sa.Column("parking_instructions", sa.Text, nullable=True),
        "wifi_name": sa.Column("wifi_name", sa.String(100), nullable=True),
        "wifi_password": sa.Column("wifi_password", sa.String(100), nullable=True),
        "consumables": sa.Column("consumables", sa.JSON, nullable=True),
        "bedrooms": sa.Column("bedrooms", sa.Integer, nullable=True),
        "bathrooms": sa.Column("bathrooms", sa.Integer, nullable=True),
        "living_areas": sa.Column("living_areas", sa.Integer, nullable=True),
    }

    for col_name, col_def in property_cols.items():
        if col_name not in existing_property_cols:
            op.add_column("properties", col_def)

    # --- users: Phase 3 cleaner profile fields ---
    user_cols = {
        "nickname": sa.Column("nickname", sa.String(100), nullable=True),
        "address": sa.Column("address", sa.String(500), nullable=True),
        "suburb": sa.Column("suburb", sa.String(100), nullable=True),
        "transport": sa.Column("transport", sa.String(50), nullable=True),
        "skills": sa.Column("skills", sa.JSON, nullable=True),
        "regions": sa.Column("regions", sa.JSON, nullable=True),
        "notes": sa.Column("notes", sa.Text, nullable=True),
        "start_date": sa.Column("start_date", sa.Date, nullable=True),
    }

    for col_name, col_def in user_cols.items():
        if col_name not in existing_user_cols:
            op.add_column("users", col_def)


def downgrade() -> None:
    property_cols = [
        "cleaning_instructions", "access_method", "access_code",
        "parking_instructions", "wifi_name", "wifi_password",
        "consumables", "bedrooms", "bathrooms", "living_areas",
    ]
    for col in property_cols:
        op.drop_column("properties", col)

    user_cols = ["nickname", "address", "suburb", "transport", "skills", "regions", "notes", "start_date"]
    for col in user_cols:
        op.drop_column("users", col)
