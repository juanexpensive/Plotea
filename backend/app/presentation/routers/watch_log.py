from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.repositories.activity_repository import ActivityRepository
from app.data.repositories.media_status_repository import MediaStatusRepository
from app.data.repositories.watch_log_repository import WatchLogRepository
from app.domain.entities.user import User
from app.domain.entities.watch_log import WatchLog
from app.domain.services.activity_publisher import ActivityPublisher
from app.domain.usecases.watchlog.create_watch_log import CreateWatchLogUseCase
from app.domain.usecases.watchlog.delete_watch_log import DeleteWatchLogUseCase
from app.domain.usecases.watchlog.list_watch_log import ListWatchLogUseCase
from app.infrastructure.database import get_db
from app.presentation.dependencies import get_current_user
from app.presentation.schemas.watch_log import WatchLogCreateRequest, WatchLogResponse

router = APIRouter(prefix="/watchlog", tags=["watchlog"])


def _to_response(watch_log: WatchLog) -> WatchLogResponse:
    return WatchLogResponse(
        id=watch_log.id,
        tmdb_id=watch_log.tmdb_id,
        media_type=watch_log.media_type,
        watched_at=watch_log.watched_at,
        rating=watch_log.rating,
        created_at=watch_log.created_at,
    )


@router.post("", response_model=WatchLogResponse, status_code=status.HTTP_201_CREATED)
async def create_watch_log(
    data: WatchLogCreateRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> WatchLogResponse:
    watch_log = await CreateWatchLogUseCase(
        WatchLogRepository(session),
        MediaStatusRepository(session),
        ActivityPublisher(ActivityRepository(session)),
    ).execute(
        current_user.id,
        data.tmdb_id,
        data.media_type,
        data.watched_at,
        data.rating,
    )
    return _to_response(watch_log)


@router.get("/me", response_model=list[WatchLogResponse])
async def list_my_watch_log(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> list[WatchLogResponse]:
    watch_logs = await ListWatchLogUseCase(WatchLogRepository(session)).execute(current_user.id)
    return [_to_response(watch_log) for watch_log in watch_logs]


@router.delete("/{watch_log_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_watch_log(
    watch_log_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> None:
    await DeleteWatchLogUseCase(WatchLogRepository(session)).execute(
        current_user.id,
        watch_log_id,
    )
