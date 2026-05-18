from app.domain.entities.social import PublicUserSummary
from app.domain.repositories.i_user_repository import IUserRepository


class ListFollowersUseCase:
    def __init__(self, user_repo: IUserRepository) -> None:
        self._user_repo = user_repo

    async def execute(self, current_user_id: int) -> list[PublicUserSummary]:
        return await self._user_repo.list_followers(current_user_id)
