import asyncio
from collections import Counter

from app.domain.entities.social import GenreStat, PublicUserStats
from app.domain.entities.watch_log import WatchLog
from app.domain.services.i_tmdb_client import ITmdbClient
from app.domain.usecases.media.get_media_detail import GetMediaDetailUseCase


class UserStatsAggregator:
    def __init__(self, tmdb: ITmdbClient) -> None:
        self._get_media_detail = GetMediaDetailUseCase(tmdb)

    async def build(self, watch_logs: list[WatchLog]) -> PublicUserStats:
        ratings = [item.rating for item in watch_logs if item.rating is not None]
        total_runtime_minutes = 0
        genre_counts: Counter[str] = Counter()

        details = await asyncio.gather(
            *(self._get_media_detail.execute(item.media_type, item.tmdb_id) for item in watch_logs),
            return_exceptions=True,
        )

        for detail in details:
            if isinstance(detail, Exception):
                continue

            if detail.runtime is not None:
                total_runtime_minutes += detail.runtime

            genre_counts.update(detail.genres)

        top_genres = [
            GenreStat(name=name, count=count)
            for name, count in sorted(
                genre_counts.items(),
                key=lambda pair: (-pair[1], pair[0]),
            )[:3]
        ]

        average_rating = None
        if ratings:
            average_rating = round(sum(ratings) / len(ratings), 1)

        return PublicUserStats(
            watched_count=len(watch_logs),
            estimated_hours=round(total_runtime_minutes / 60, 1),
            top_genres=top_genres,
            average_rating=average_rating,
        )
