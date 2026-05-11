from app.domain.entities.lists import ListSummary
from app.domain.repositories.i_list_repository import IListRepository


class ListPublicListsUseCase:
    def __init__(self, list_repo: IListRepository) -> None:
        self._list_repo = list_repo

    async def execute(self, username: str) -> list[ListSummary]:
        return await self._list_repo.list_public_by_username(username)
