from app.domain.entities.watch_log import WatchLog
from app.domain.repositories.i_watch_log_repository import IWatchLogRepository


class ListWatchLogUseCase:
    def __init__(self, watch_log_repo: IWatchLogRepository) -> None:
        self._watch_log_repo = watch_log_repo

    async def execute(self, user_id: int) -> list[WatchLog]:
        return await self._watch_log_repo.list_by_user(user_id)
