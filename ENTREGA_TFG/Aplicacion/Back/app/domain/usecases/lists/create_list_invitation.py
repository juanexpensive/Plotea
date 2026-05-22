from app.domain.errors import BadRequestError, ConflictError, NotFoundError
from app.domain.entities.lists import ListInvitationSummary
from app.domain.repositories.i_follow_repository import IFollowRepository
from app.domain.repositories.i_list_repository import IListRepository
from app.domain.repositories.i_user_repository import IUserRepository
from app.domain.services.push_notifications_service import PushNotificationsService


class CreateListInvitationUseCase:
    def __init__(
        self,
        user_repo: IUserRepository,
        follow_repo: IFollowRepository,
        list_repo: IListRepository,
        push_notifications_service: PushNotificationsService,
    ) -> None:
        self._user_repo = user_repo
        self._follow_repo = follow_repo
        self._list_repo = list_repo
        self._push_notifications_service = push_notifications_service

    async def execute(
        self,
        *,
        list_id: int,
        inviter_user_id: int,
        invitee_user_id: int,
    ) -> ListInvitationSummary:
        if invitee_user_id == inviter_user_id:
            raise BadRequestError("You cannot invite yourself")

        invitee = await self._user_repo.get_by_id(invitee_user_id)
        if invitee is None:
            raise NotFoundError("User not found")
        if not await self._list_repo.is_owner(list_id, inviter_user_id):
            raise NotFoundError("List not found")
        if await self._list_repo.is_collaborator(list_id, invitee_user_id):
            raise ConflictError("User is already a collaborator")
        if await self._list_repo.has_pending_invitation(list_id, invitee_user_id):
            raise ConflictError("Pending invitation already exists")
        if not await self._follow_repo.are_mutual_followers(inviter_user_id, invitee_user_id):
            raise BadRequestError("Mutual follow is required to invite collaborators")

        invitation = await self._list_repo.create_invitation(list_id, inviter_user_id, invitee_user_id)
        if invitation is None:
            raise BadRequestError("Could not create invitation")

        await self._push_notifications_service.notify_list_invitation(
            recipient_user_id=invitee_user_id,
            actor_username=invitation.invited_by.username,
        )
        return invitation
