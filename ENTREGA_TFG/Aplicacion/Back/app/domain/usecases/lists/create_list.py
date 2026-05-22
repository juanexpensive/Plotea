from app.domain.entities.lists import ListSummary
from app.domain.repositories.i_list_repository import IListRepository
from app.domain.services.activity_publisher import ActivityPublisher


class CreateListUseCase:
    def __init__(self, list_repo: IListRepository, activity_publisher: ActivityPublisher) -> None:
        self._list_repo = list_repo
        self._activity_publisher = activity_publisher

    async def execute(
        self,
        user_id: int,
        name: str,
        description: str | None,
        is_public: bool,
    ) -> ListSummary:
        created = await self._list_repo.create(user_id, name, description, is_public)
        if created.is_public:
            await self._activity_publisher.publish_list_created(user_id, created.id)
        return created
