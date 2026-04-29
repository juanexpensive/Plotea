from fastapi import HTTPException

from app.domain.repositories.i_watch_log_repository import IWatchLogRepository


class DeleteWatchLogUseCase:
    def __init__(self, watch_log_repo: IWatchLogRepository) -> None:
        self._watch_log_repo = watch_log_repo

    async def execute(self, user_id: int, watch_log_id: int) -> None:
        watch_log = await self._watch_log_repo.get_by_id(watch_log_id)
        if watch_log is None or watch_log.user_id != user_id:
            raise HTTPException(status_code=404, detail="Watch log entry not found")

        await self._watch_log_repo.delete(watch_log_id)
