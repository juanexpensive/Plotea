from datetime import datetime, timezone

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.models.push_device import PushDevice as PushDeviceModel
from app.domain.entities.push_notification import PushDevice
from app.domain.repositories.i_push_device_repository import IPushDeviceRepository


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class PushDeviceRepository(IPushDeviceRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def upsert(self, user_id: int, expo_push_token: str, platform: str) -> PushDevice:
        existing = await self._session.scalar(
            select(PushDeviceModel).where(PushDeviceModel.expo_push_token == expo_push_token)
        )

        if existing is None:
            existing = PushDeviceModel(
                user_id=user_id,
                expo_push_token=expo_push_token,
                platform=platform,
            )
            self._session.add(existing)
        else:
            existing.user_id = user_id
            existing.platform = platform
            existing.updated_at = _utcnow()

        await self._session.commit()
        await self._session.refresh(existing)
        return self._to_entity(existing)

    async def delete(self, user_id: int, expo_push_token: str) -> bool:
        result = await self._session.execute(
            delete(PushDeviceModel).where(
                PushDeviceModel.user_id == user_id,
                PushDeviceModel.expo_push_token == expo_push_token,
            )
        )
        await self._session.commit()
        return bool(result.rowcount)

    async def list_tokens_for_user(self, user_id: int) -> list[str]:
        result = await self._session.execute(
            select(PushDeviceModel.expo_push_token).where(PushDeviceModel.user_id == user_id)
        )
        return list(result.scalars().all())

    def _to_entity(self, model: PushDeviceModel) -> PushDevice:
        return PushDevice(
            id=model.id,
            user_id=model.user_id,
            expo_push_token=model.expo_push_token,
            platform=model.platform,
        )
