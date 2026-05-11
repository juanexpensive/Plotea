from fastapi import HTTPException

from app.domain.entities.lists import ListDetail, ListItemRef
from app.domain.repositories.i_list_repository import IListRepository


class SwapListItemsUseCase:
    def __init__(self, list_repo: IListRepository) -> None:
        self._list_repo = list_repo

    async def execute(
        self,
        list_id: int,
        user_id: int,
        source: ListItemRef,
        target: ListItemRef,
    ) -> ListDetail:
        detail = await self._list_repo.swap_item_positions(list_id, user_id, source, target)
        if detail is None:
            raise HTTPException(status_code=404, detail="List item not found")
        return detail
