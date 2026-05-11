from datetime import datetime, timezone

from sqlalchemy import BigInteger, CheckConstraint, DateTime, ForeignKey, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Activity(Base):
    __tablename__ = "activities"
    __table_args__ = (
        CheckConstraint(
            "activity_type IN ('review', 'watch_log', 'follow', 'list_created')",
            name="ck_activities_type",
        ),
        Index("ix_activities_user_created", "user_id", "created_at", "id"),
    )

    id: Mapped[int] = mapped_column(Integer().with_variant(BigInteger(), "postgresql"), primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer().with_variant(BigInteger(), "postgresql"),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    activity_type: Mapped[str] = mapped_column(String(32), nullable=False)
    review_id: Mapped[int | None] = mapped_column(
        Integer().with_variant(BigInteger(), "postgresql"),
        ForeignKey("reviews.id", ondelete="CASCADE"),
        nullable=True,
    )
    watch_log_id: Mapped[int | None] = mapped_column(
        Integer().with_variant(BigInteger(), "postgresql"),
        ForeignKey("watch_log.id", ondelete="CASCADE"),
        nullable=True,
    )
    followed_user_id: Mapped[int | None] = mapped_column(
        Integer().with_variant(BigInteger(), "postgresql"),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
    )
    list_id: Mapped[int | None] = mapped_column(Integer().with_variant(BigInteger(), "postgresql"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_utcnow)
