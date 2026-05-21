"""allow watched and watchlist to coexist

Revision ID: b7c8d9e0f1a2
Revises: a1b2c3d4e5f6
Create Date: 2026-05-21
"""

from alembic import op

revision = "b7c8d9e0f1a2"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_constraint("uq_user_media_status_user_media", "user_media_status", type_="unique")
    op.create_unique_constraint(
        "uq_user_media_status_user_media_status",
        "user_media_status",
        ["user_id", "tmdb_id", "media_type", "status"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_user_media_status_user_media_status", "user_media_status", type_="unique")
    op.create_unique_constraint(
        "uq_user_media_status_user_media",
        "user_media_status",
        ["user_id", "tmdb_id", "media_type"],
    )
