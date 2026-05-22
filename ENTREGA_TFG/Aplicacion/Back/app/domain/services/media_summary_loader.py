import asyncio

from app.domain.entities.media import MediaItem
from app.domain.usecases.media.get_media_detail import GetMediaDetailUseCase


class MediaSummaryLoader:
    def __init__(self, detail_use_case: GetMediaDetailUseCase) -> None:
        self._detail_use_case = detail_use_case
        self._cache: dict[tuple[str, int], MediaItem] = {}

    async def load(self, media_type: str, tmdb_id: int) -> MediaItem:
        cache_key = (media_type, tmdb_id)
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached

        try:
            detail = await self._detail_use_case.execute(media_type, tmdb_id)
            item = MediaItem(
                tmdb_id=detail.tmdb_id,
                media_type=detail.media_type,
                title=detail.title or self._fallback_title(media_type, tmdb_id),
                poster_path=detail.poster_path,
                vote_average=detail.vote_average,
                release_date=detail.release_date,
            )
        except Exception:
            item = MediaItem(
                tmdb_id=tmdb_id,
                media_type=media_type,
                title=self._fallback_title(media_type, tmdb_id),
                poster_path=None,
                vote_average=0.0,
                release_date=None,
            )
        self._cache[cache_key] = item
        return item

    async def load_many(
        self,
        media_refs: list[tuple[str, int]],
    ) -> dict[tuple[str, int], MediaItem]:
        unique_refs = list(dict.fromkeys(media_refs))
        loaded_items = await asyncio.gather(
            *(self.load(media_type, tmdb_id) for media_type, tmdb_id in unique_refs)
        )
        return {
            media_ref: item
            for media_ref, item in zip(unique_refs, loaded_items, strict=True)
        }

    @staticmethod
    def _fallback_title(media_type: str, tmdb_id: int) -> str:
        label = "Pelicula" if media_type == "movie" else "Serie"
        return f"{label} #{tmdb_id}"
