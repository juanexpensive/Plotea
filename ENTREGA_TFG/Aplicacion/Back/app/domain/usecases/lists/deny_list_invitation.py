from app.domain.errors import NotFoundError
from app.domain.repositories.i_list_repository import IListRepository


class DenyListInvitationUseCase:
    def __init__(self, list_repo: IListRepository) -> None:
        self._list_repo = list_repo

    async def execute(self, invitation_id: int, invitee_user_id: int) -> None:
        denied = await self._list_repo.deny_invitation(invitation_id, invitee_user_id)
        if not denied:
            raise NotFoundError("Invitation not found")
