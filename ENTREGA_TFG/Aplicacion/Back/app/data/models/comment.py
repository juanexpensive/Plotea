from datetime import datetime, timezone

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[int] = mapped_column(Integer().with_variant(BigInteger(), "postgresql"), primary_key=True, autoincrement=True)
    review_id: Mapped[int] = mapped_column(Integer().with_variant(BigInteger(), "postgresql"), ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(Integer().with_variant(BigInteger(), "postgresql"), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_comment_id: Mapped[int | None] = mapped_column(Integer().with_variant(BigInteger(), "postgresql"), ForeignKey("comments.id", ondelete="CASCADE"), nullable=True)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow)
