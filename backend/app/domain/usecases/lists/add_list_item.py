from app.domain.errors import NotFoundError
from app.domain.entities.lists import ListDetail
from app.domain.repositories.i_list_repository import IListRepository


class AddListItemUseCase:
    def __init__(self, list_repo: IListRepository) -> None:
        self._list_repo = list_repo

    async def execute(self, list_id: int, user_id: int, tmdb_id: int, media_type: str) -> ListDetail:
        detail = await self._list_repo.add_item(list_id, user_id, tmdb_id, media_type)
        if detail is None:
            raise NotFoundError("List not found")
        return detail
