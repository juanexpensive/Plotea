from datetime import datetime, timezone

from sqlalchemy import BigInteger, Boolean, CheckConstraint, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (
        CheckConstraint("media_type IN ('movie', 'tv')", name="ck_reviews_media_type"),
        CheckConstraint("rating >= 1 AND rating <= 10", name="ck_reviews_rating"),
        UniqueConstraint("user_id", "tmdb_id", "media_type", name="uq_reviews_user_media"),
    )

    id: Mapped[int] = mapped_column(Integer().with_variant(BigInteger(), "postgresql"), primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer().with_variant(BigInteger(), "postgresql"), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    tmdb_id: Mapped[int] = mapped_column(Integer, nullable=False)
    media_type: Mapped[str] = mapped_column(String(10), nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    contains_spoilers: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow)
