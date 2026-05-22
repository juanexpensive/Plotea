"""add follows and activities

Revision ID: 6f7a8b9c0d1e
Revises: 5e6f7a8b9c0d
Create Date: 2026-05-11
"""

from alembic import op
import sqlalchemy as sa

revision = "6f7a8b9c0d1e"
down_revision = "5e6f7a8b9c0d"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "follows",
        sa.Column("follower_id", sa.BigInteger(), nullable=False),
        sa.Column("followed_id", sa.BigInteger(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("follower_id != followed_id", name="ck_follows_no_self_follow"),
        sa.ForeignKeyConstraint(["followed_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["follower_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("follower_id", "followed_id"),
        sa.UniqueConstraint("follower_id", "followed_id", name="uq_follows_pair"),
    )

    op.create_table(
        "activities",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("activity_type", sa.String(length=32), nullable=False),
        sa.Column("review_id", sa.BigInteger(), nullable=True),
        sa.Column("watch_log_id", sa.BigInteger(), nullable=True),
        sa.Column("followed_user_id", sa.BigInteger(), nullable=True),
        sa.Column("list_id", sa.BigInteger(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "activity_type IN ('review', 'watch_log', 'follow', 'list_created')",
            name="ck_activities_type",
        ),
        sa.ForeignKeyConstraint(["followed_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["review_id"], ["reviews.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["watch_log_id"], ["watch_log.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_activities_user_created", "activities", ["user_id", "created_at", "id"])
    op.create_index("ix_activities_user_id", "activities", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_activities_user_id", table_name="activities")
    op.drop_index("ix_activities_user_created", table_name="activities")
    op.drop_table("activities")
    op.drop_table("follows")
