from datetime import datetime, timezone

from sqlalchemy import BigInteger, CheckConstraint, DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Follow(Base):
    __tablename__ = "follows"
    __table_args__ = (
        CheckConstraint("follower_id != followed_id", name="ck_follows_no_self_follow"),
        UniqueConstraint("follower_id", "followed_id", name="uq_follows_pair"),
    )

    follower_id: Mapped[int] = mapped_column(
        Integer().with_variant(BigInteger(), "postgresql"),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    followed_id: Mapped[int] = mapped_column(
        Integer().with_variant(BigInteger(), "postgresql"),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_utcnow)
