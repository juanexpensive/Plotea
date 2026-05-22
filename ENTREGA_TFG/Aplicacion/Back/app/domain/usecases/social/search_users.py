from app.domain.entities.social import PublicUserSummary
from app.domain.repositories.i_user_repository import IUserRepository


class SearchUsersUseCase:
    def __init__(self, user_repo: IUserRepository) -> None:
        self._user_repo = user_repo

    async def execute(self, current_user_id: int, query: str) -> list[PublicUserSummary]:
        return await self._user_repo.search_public(query.strip(), current_user_id)
