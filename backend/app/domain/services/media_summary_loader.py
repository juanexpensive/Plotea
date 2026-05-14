from app.domain.entities.media import MediaItem
from app.domain.usecases.media.get_media_detail import GetMediaDetailUseCase


class MediaSummaryLoader:
    def __init__(self, detail_use_case: GetMediaDetailUseCase) -> None:
        self._detail_use_case = detail_use_case

    async def load(self, media_type: str, tmdb_id: int) -> MediaItem:
        try:
            detail = await self._detail_use_case.execute(media_type, tmdb_id)
            return MediaItem(
                tmdb_id=detail.tmdb_id,
                media_type=detail.media_type,
                title=detail.title or self._fallback_title(media_type, tmdb_id),
                poster_path=detail.poster_path,
                vote_average=detail.vote_average,
                release_date=detail.release_date,
            )
        except Exception:
            return MediaItem(
                tmdb_id=tmdb_id,
                media_type=media_type,
                title=self._fallback_title(media_type, tmdb_id),
                poster_path=None,
                vote_average=0.0,
                release_date=None,
            )

    @staticmethod
    def _fallback_title(media_type: str, tmdb_id: int) -> str:
        label = "Pelicula" if media_type == "movie" else "Serie"
        return f"{label} #{tmdb_id}"
