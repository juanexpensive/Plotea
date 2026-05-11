from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

from app.domain.entities.lists import ListDetail
from app.domain.repositories.i_list_repository import IListRepository


class AddListItemUseCase:
    def __init__(self, list_repo: IListRepository) -> None:
        self._list_repo = list_repo

    async def execute(self, list_id: int, user_id: int, tmdb_id: int, media_type: str) -> ListDetail:
        try:
            detail = await self._list_repo.add_item(list_id, user_id, tmdb_id, media_type)
        except IntegrityError as exc:
            raise HTTPException(status_code=409, detail="Item already exists in list") from exc

        if detail is None:
            raise HTTPException(status_code=404, detail="List not found")
        return detail
