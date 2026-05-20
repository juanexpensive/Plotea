from fastapi import HTTPException

from app.domain.repositories.i_list_repository import IListRepository


class LeaveListUseCase:
    def __init__(self, list_repo: IListRepository) -> None:
        self._list_repo = list_repo

    async def execute(self, list_id: int, user_id: int) -> None:
        left = await self._list_repo.leave(list_id, user_id)
        if not left:
            raise HTTPException(status_code=404, detail="List not found")
