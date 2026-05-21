from app.domain.errors import NotFoundError
from app.domain.entities.social import PublicUserStats
from app.domain.repositories.i_user_repository import IUserRepository
from app.domain.repositories.i_watch_log_repository import IWatchLogRepository
from app.domain.services.user_stats_aggregator import UserStatsAggregator


class GetUserStatsUseCase:
    def __init__(
        self,
        user_repo: IUserRepository,
        watch_log_repo: IWatchLogRepository,
        aggregator: UserStatsAggregator,
    ) -> None:
        self._user_repo = user_repo
        self._watch_log_repo = watch_log_repo
        self._aggregator = aggregator

    async def execute(self, username: str) -> PublicUserStats:
        user = await self._user_repo.get_by_username(username)
        if user is None:
            raise NotFoundError("User not found")

        watch_logs = await self._watch_log_repo.list_by_user(user.id)
        return await self._aggregator.build(watch_logs)
