from datetime import datetime, timezone

from sqlalchemy import BigInteger, CheckConstraint, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class UserMediaStatus(Base):
    __tablename__ = "user_media_status"
    __table_args__ = (
        CheckConstraint("media_type IN ('movie', 'tv')", name="ck_user_media_status_media_type"),
        CheckConstraint("status IN ('watched', 'watchlist')", name="ck_user_media_status_status"),
        UniqueConstraint("user_id", "tmdb_id", "media_type", "status", name="uq_user_media_status_user_media_status"),
    )

    id: Mapped[int] = mapped_column(Integer().with_variant(BigInteger(), "postgresql"), primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer().with_variant(BigInteger(), "postgresql"), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    tmdb_id: Mapped[int] = mapped_column(Integer, nullable=False)
    media_type: Mapped[str] = mapped_column(String(10), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow)
