from app.domain.entities.user import User
from app.domain.repositories.i_user_repository import IUserRepository


class UpdateMyProfileUseCase:
    def __init__(self, user_repo: IUserRepository) -> None:
        self._user_repo = user_repo

    async def execute(
        self,
        user_id: int,
        display_name: str | None,
        bio: str | None,
        avatar_url: str | None,
    ) -> User:
        return await self._user_repo.update_profile(
            user_id=user_id,
            display_name=display_name,
            bio=bio,
            avatar_url=avatar_url,
        )
