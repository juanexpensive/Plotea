from fastapi import HTTPException

from app.domain.entities.social import FavoriteMediaSelection
from app.domain.repositories.i_user_favorite_media_repository import IUserFavoriteMediaRepository


class UpdateMyFavoriteMediaUseCase:
    def __init__(self, favorite_repo: IUserFavoriteMediaRepository) -> None:
        self._favorite_repo = favorite_repo

    async def execute(self, user_id: int, items: list[FavoriteMediaSelection]) -> list[FavoriteMediaSelection]:
        positions = {item.position for item in items}
        if len(positions) != len(items):
            raise HTTPException(status_code=422, detail="favorite positions must be unique")

        media_keys = {(item.media_type, item.tmdb_id) for item in items}
        if len(media_keys) != len(items):
            raise HTTPException(status_code=422, detail="favorite media entries must be unique")

        return await self._favorite_repo.replace_all(user_id, items)
