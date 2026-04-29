from datetime import date, datetime, timezone

from sqlalchemy import BigInteger, CheckConstraint, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class WatchLog(Base):
    __tablename__ = "watch_log"
    __table_args__ = (
        CheckConstraint("media_type IN ('movie', 'tv')", name="ck_watch_log_media_type"),
        CheckConstraint("rating IS NULL OR (rating >= 1 AND rating <= 10)", name="ck_watch_log_rating"),
    )

    id: Mapped[int] = mapped_column(Integer().with_variant(BigInteger(), "postgresql"), primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer().with_variant(BigInteger(), "postgresql"), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    tmdb_id: Mapped[int] = mapped_column(Integer, nullable=False)
    media_type: Mapped[str] = mapped_column(String(10), nullable=False)
    watched_at: Mapped[date] = mapped_column(Date, nullable=False)
    rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_utcnow)
