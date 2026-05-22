from app.domain.errors import NotFoundError
from app.domain.repositories.i_list_repository import IListRepository


class DeleteListUseCase:
    def __init__(self, list_repo: IListRepository) -> None:
        self._list_repo = list_repo

    async def execute(self, list_id: int, user_id: int) -> None:
        deleted = await self._list_repo.delete(list_id, user_id)
        if not deleted:
            raise NotFoundError("List not found")
