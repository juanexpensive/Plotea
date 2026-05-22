"""add watch log

Revision ID: 3c4d5e6f7a8b
Revises: 2b3c4d5e6f7a
Create Date: 2026-04-29
"""

from alembic import op
import sqlalchemy as sa

revision = "3c4d5e6f7a8b"
down_revision = "2b3c4d5e6f7a"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "watch_log",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("tmdb_id", sa.Integer(), nullable=False),
        sa.Column("media_type", sa.String(10), nullable=False),
        sa.Column("watched_at", sa.Date(), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("media_type IN ('movie', 'tv')", name="ck_watch_log_media_type"),
        sa.CheckConstraint("rating IS NULL OR (rating >= 1 AND rating <= 10)", name="ck_watch_log_rating"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_watch_log_user_id", "watch_log", ["user_id"])


def downgrade() -> None:
    op.drop_table("watch_log")
