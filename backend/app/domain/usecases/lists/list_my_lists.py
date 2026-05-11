from app.domain.entities.lists import ListSummary
from app.domain.repositories.i_list_repository import IListRepository


class ListMyListsUseCase:
    def __init__(self, list_repo: IListRepository) -> None:
        self._list_repo = list_repo

    async def execute(self, user_id: int) -> list[ListSummary]:
        return await self._list_repo.list_owned_by_user(user_id)
