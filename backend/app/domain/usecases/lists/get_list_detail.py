from app.domain.errors import NotFoundError
from app.domain.entities.lists import ListDetail
from app.domain.repositories.i_list_repository import IListRepository


class GetListDetailUseCase:
    def __init__(self, list_repo: IListRepository) -> None:
        self._list_repo = list_repo

    async def execute(self, list_id: int, viewer_id: int) -> ListDetail:
        detail = await self._list_repo.get_visible_detail(list_id, viewer_id)
        if detail is None:
            raise NotFoundError("List not found")
        return detail
