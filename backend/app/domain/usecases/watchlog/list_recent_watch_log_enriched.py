from app.domain.entities.social import RecentWatchLogEntry
from app.domain.repositories.i_watch_log_repository import IWatchLogRepository
from app.domain.services.media_summary_loader import MediaSummaryLoader


class ListRecentWatchLogEnrichedUseCase:
    def __init__(
        self,
        watch_log_repo: IWatchLogRepository,
        media_loader: MediaSummaryLoader,
    ) -> None:
        self._watch_log_repo = watch_log_repo
        self._media_loader = media_loader

    async def execute(self, user_id: int, limit: int) -> list[RecentWatchLogEntry]:
        watch_logs = await self._watch_log_repo.list_by_user(user_id)
        items: list[RecentWatchLogEntry] = []
        for watch_log in watch_logs[:limit]:
            items.append(
                RecentWatchLogEntry(
                    id=watch_log.id,
                    tmdb_id=watch_log.tmdb_id,
                    media_type=watch_log.media_type,
                    watched_at=watch_log.watched_at,
                    rating=watch_log.rating,
                    created_at=watch_log.created_at,
                    media=await self._media_loader.load(watch_log.media_type, watch_log.tmdb_id),
                )
            )
        return items
