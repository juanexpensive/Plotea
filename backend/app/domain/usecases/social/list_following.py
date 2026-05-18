from app.domain.entities.social import PublicUserSummary
from app.domain.repositories.i_user_repository import IUserRepository


class ListFollowingUseCase:
    def __init__(self, user_repo: IUserRepository) -> None:
        self._user_repo = user_repo

    async def execute(self, current_user_id: int) -> list[PublicUserSummary]:
        return await self._user_repo.list_following(current_user_id)
