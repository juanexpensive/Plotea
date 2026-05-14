from app.domain.entities.media import MediaItem
from app.domain.repositories.i_user_favorite_media_repository import IUserFavoriteMediaRepository
from app.domain.services.media_summary_loader import MediaSummaryLoader


class GetMyFavoriteMediaUseCase:
    def __init__(
        self,
        favorite_repo: IUserFavoriteMediaRepository,
        media_loader: MediaSummaryLoader,
    ) -> None:
        self._favorite_repo = favorite_repo
        self._media_loader = media_loader

    async def execute(self, user_id: int) -> list[tuple[int, MediaItem]]:
        selections = await self._favorite_repo.list_by_user(user_id)
        items: list[tuple[int, MediaItem]] = []
        for selection in selections:
            items.append(
                (
                    selection.position,
                    await self._media_loader.load(selection.media_type, selection.tmdb_id),
                )
            )
        return items
