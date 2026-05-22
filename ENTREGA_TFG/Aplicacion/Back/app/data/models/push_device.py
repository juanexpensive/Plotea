from datetime import datetime, timezone

from sqlalchemy import BigInteger, CheckConstraint, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class PushDevice(Base):
    __tablename__ = "push_devices"
    __table_args__ = (
        CheckConstraint("platform IN ('android', 'ios')", name="ck_push_devices_platform"),
        UniqueConstraint("expo_push_token", name="uq_push_devices_expo_push_token"),
    )

    id: Mapped[int] = mapped_column(Integer().with_variant(BigInteger(), "postgresql"), primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer().with_variant(BigInteger(), "postgresql"),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    expo_push_token: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    platform: Mapped[str] = mapped_column(String(16), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=_utcnow,
        onupdate=_utcnow,
    )
