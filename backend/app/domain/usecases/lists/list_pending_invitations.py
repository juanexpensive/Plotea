from app.domain.entities.lists import ListInvitationSummary
from app.domain.repositories.i_list_repository import IListRepository


class ListPendingInvitationsUseCase:
    def __init__(self, list_repo: IListRepository) -> None:
        self._list_repo = list_repo

    async def execute(self, user_id: int) -> list[ListInvitationSummary]:
        return await self._list_repo.list_pending_invitations_received(user_id)
