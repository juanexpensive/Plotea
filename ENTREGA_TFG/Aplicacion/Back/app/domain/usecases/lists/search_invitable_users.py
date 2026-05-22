from app.domain.entities.lists import ListUser
from app.domain.errors import NotFoundError
from app.domain.repositories.i_list_repository import IListRepository
from app.domain.repositories.i_user_repository import IUserRepository


class SearchInvitableUsersUseCase:
    def __init__(
        self,
        list_repo: IListRepository,
        user_repo: IUserRepository,
    ) -> None:
        self._list_repo = list_repo
        self._user_repo = user_repo

    async def execute(
        self,
        *,
        list_id: int,
        current_user_id: int,
        query: str,
    ) -> list[ListUser]:
        if not await self._list_repo.is_owner(list_id, current_user_id):
            raise NotFoundError("List not found")

        users = await self._user_repo.search_mutual_followers(query, current_user_id)
        collaborator_ids = {
            collaborator.id
            for collaborator in await self._list_repo.list_collaborators(list_id)
        }

        results: list[ListUser] = []
        for user in users:
            if user.id in collaborator_ids or user.id == current_user_id:
                continue
            if await self._list_repo.has_pending_invitation(list_id, user.id):
                continue
            results.append(
                ListUser(
                    id=user.id,
                    username=user.username,
                    display_name=user.display_name,
                    avatar_url=user.avatar_url,
                )
            )
        return results
