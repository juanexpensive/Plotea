from app.domain.entities.social import PublicUserProfile
from app.domain.repositories.i_user_repository import IUserRepository


class GetPublicProfileUseCase:
    def __init__(self, user_repo: IUserRepository) -> None:
        self._user_repo = user_repo

    async def execute(self, current_user_id: int, username: str) -> PublicUserProfile | None:
        return await self._user_repo.get_public_profile(username, current_user_id)
