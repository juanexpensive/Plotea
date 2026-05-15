"""add list collaboration and invitations

Revision ID: 9c0d1e2f3a4b
Revises: 8b9c0d1e2f3a
Create Date: 2026-05-15
"""

from alembic import op
import sqlalchemy as sa

revision = "9c0d1e2f3a4b"
down_revision = "8b9c0d1e2f3a"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("list_items", sa.Column("added_by_user_id", sa.BigInteger(), nullable=True))
    op.create_foreign_key(
        "fk_list_items_added_by_user_id_users",
        "list_items",
        "users",
        ["added_by_user_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_index("ix_list_items_added_by_user_id", "list_items", ["added_by_user_id"])
    op.execute(
        """
        UPDATE list_items
        SET added_by_user_id = lists.user_id
        FROM lists
        WHERE list_items.list_id = lists.id
        """
    )
    op.alter_column("list_items", "added_by_user_id", nullable=False)

    op.create_table(
        "list_collaborators",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("list_id", sa.BigInteger(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("invited_by_user_id", sa.BigInteger(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["invited_by_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["list_id"], ["lists.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("list_id", "user_id", name="uq_list_collaborators_pair"),
    )
    op.create_index("ix_list_collaborators_list_id", "list_collaborators", ["list_id"])
    op.create_index("ix_list_collaborators_user_id", "list_collaborators", ["user_id"])

    op.create_table(
        "list_invitations",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("list_id", sa.BigInteger(), nullable=False),
        sa.Column("inviter_user_id", sa.BigInteger(), nullable=False),
        sa.Column("invitee_user_id", sa.BigInteger(), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("responded_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("status IN ('pending', 'accepted', 'denied')", name="ck_list_invitations_status"),
        sa.ForeignKeyConstraint(["invitee_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["inviter_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["list_id"], ["lists.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_list_invitations_list_id", "list_invitations", ["list_id"])
    op.create_index("ix_list_invitations_invitee_user_id", "list_invitations", ["invitee_user_id"])


def downgrade() -> None:
    op.drop_index("ix_list_invitations_invitee_user_id", table_name="list_invitations")
    op.drop_index("ix_list_invitations_list_id", table_name="list_invitations")
    op.drop_table("list_invitations")

    op.drop_index("ix_list_collaborators_user_id", table_name="list_collaborators")
    op.drop_index("ix_list_collaborators_list_id", table_name="list_collaborators")
    op.drop_table("list_collaborators")

    op.drop_index("ix_list_items_added_by_user_id", table_name="list_items")
    op.drop_constraint("fk_list_items_added_by_user_id_users", "list_items", type_="foreignkey")
    op.drop_column("list_items", "added_by_user_id")
