from app.domain.errors import NotFoundError
from app.domain.entities.lists import ListDetail, ListItemRef
from app.domain.repositories.i_list_repository import IListRepository


class RemoveListItemUseCase:
    def __init__(self, list_repo: IListRepository) -> None:
        self._list_repo = list_repo

    async def execute(self, list_id: int, user_id: int, item: ListItemRef) -> ListDetail:
        detail = await self._list_repo.remove_item(list_id, user_id, item)
        if detail is None:
            raise NotFoundError("List not found")
        return detail
