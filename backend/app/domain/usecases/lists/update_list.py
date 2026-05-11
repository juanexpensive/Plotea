from fastapi import HTTPException

from app.domain.entities.lists import ListSummary
from app.domain.repositories.i_list_repository import IListRepository


class UpdateListUseCase:
    def __init__(self, list_repo: IListRepository) -> None:
        self._list_repo = list_repo

    async def execute(
        self,
        list_id: int,
        user_id: int,
        name: str,
        description: str | None,
        is_public: bool,
    ) -> ListSummary:
        updated = await self._list_repo.update(list_id, user_id, name, description, is_public)
        if updated is None:
            raise HTTPException(status_code=404, detail="List not found")
        return updated
