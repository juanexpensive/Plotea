"""add push devices

Revision ID: a1b2c3d4e5f6
Revises: 9c0d1e2f3a4b
Create Date: 2026-05-20
"""

from alembic import op
import sqlalchemy as sa

revision = "a1b2c3d4e5f6"
down_revision = "9c0d1e2f3a4b"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "push_devices",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("expo_push_token", sa.String(length=255), nullable=False),
        sa.Column("platform", sa.String(length=16), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("platform IN ('android', 'ios')", name="ck_push_devices_platform"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("expo_push_token", name="uq_push_devices_expo_push_token"),
    )
    op.create_index("ix_push_devices_user_id", "push_devices", ["user_id"])
    op.create_index("ix_push_devices_expo_push_token", "push_devices", ["expo_push_token"])


def downgrade() -> None:
    op.drop_index("ix_push_devices_expo_push_token", table_name="push_devices")
    op.drop_index("ix_push_devices_user_id", table_name="push_devices")
    op.drop_table("push_devices")
