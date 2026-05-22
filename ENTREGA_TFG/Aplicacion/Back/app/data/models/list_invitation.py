from datetime import datetime, timezone

from sqlalchemy import BigInteger, CheckConstraint, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ListInvitation(Base):
    __tablename__ = "list_invitations"
    __table_args__ = (
        CheckConstraint("status IN ('pending', 'accepted', 'denied')", name="ck_list_invitations_status"),
    )

    id: Mapped[int] = mapped_column(Integer().with_variant(BigInteger(), "postgresql"), primary_key=True, autoincrement=True)
    list_id: Mapped[int] = mapped_column(
        Integer().with_variant(BigInteger(), "postgresql"),
        ForeignKey("lists.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    inviter_user_id: Mapped[int] = mapped_column(
        Integer().with_variant(BigInteger(), "postgresql"),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    invitee_user_id: Mapped[int] = mapped_column(
        Integer().with_variant(BigInteger(), "postgresql"),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_utcnow)
    responded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
