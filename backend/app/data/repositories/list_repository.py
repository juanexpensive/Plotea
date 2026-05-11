from datetime import datetime, timezone

from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.models.list import List as ListModel
from app.data.models.list_item import ListItem as ListItemModel
from app.data.models.user import User as UserModel
from app.domain.entities.lists import ListDetail, ListEntry, ListItemRef, ListOwner, ListSummary
from app.domain.repositories.i_list_repository import IListRepository


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ListRepository(IListRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(
        self,
        user_id: int,
        name: str,
        description: str | None,
        is_public: bool,
    ) -> ListSummary:
        model = ListModel(user_id=user_id, name=name, description=description, is_public=is_public)
        self._session.add(model)
        await self._session.commit()
        return (await self._get_summary_by_id(model.id))  # type: ignore[arg-type]

    async def list_owned_by_user(self, user_id: int) -> list[ListSummary]:
        items_count = (
            select(func.count())
            .select_from(ListItemModel)
            .where(ListItemModel.list_id == ListModel.id)
            .scalar_subquery()
        )
        result = await self._session.execute(
            select(ListModel, UserModel, items_count.label("items_count"))
            .join(UserModel, UserModel.id == ListModel.user_id)
            .where(ListModel.user_id == user_id)
            .order_by(ListModel.updated_at.desc(), ListModel.id.desc())
        )
        return [self._to_summary(list_model, user_model, count) for list_model, user_model, count in result.all()]

    async def list_public_by_username(self, username: str) -> list[ListSummary]:
        items_count = (
            select(func.count())
            .select_from(ListItemModel)
            .where(ListItemModel.list_id == ListModel.id)
            .scalar_subquery()
        )
        result = await self._session.execute(
            select(ListModel, UserModel, items_count.label("items_count"))
            .join(UserModel, UserModel.id == ListModel.user_id)
            .where(UserModel.username == username, ListModel.is_public.is_(True))
            .order_by(ListModel.updated_at.desc(), ListModel.id.desc())
        )
        return [self._to_summary(list_model, user_model, count) for list_model, user_model, count in result.all()]

    async def get_owned_detail(self, list_id: int, user_id: int) -> ListDetail | None:
        summary = await self._get_detail_summary(list_id, ListModel.user_id == user_id)
        if summary is None:
            return None
        return await self._get_detail_with_items(summary)

    async def get_visible_detail(self, list_id: int, viewer_id: int) -> ListDetail | None:
        summary = await self._get_detail_summary(
            list_id,
            (ListModel.user_id == viewer_id) | (ListModel.is_public.is_(True)),
        )
        if summary is None:
            return None
        return await self._get_detail_with_items(summary)

    async def update(
        self,
        list_id: int,
        user_id: int,
        name: str,
        description: str | None,
        is_public: bool,
    ) -> ListSummary | None:
        result = await self._session.execute(
            update(ListModel)
            .where(ListModel.id == list_id, ListModel.user_id == user_id)
            .values(
                name=name,
                description=description,
                is_public=is_public,
                updated_at=_utcnow(),
            )
        )
        if result.rowcount == 0:
            await self._session.rollback()
            return None
        await self._session.commit()
        return await self._get_summary_by_id(list_id)

    async def delete(self, list_id: int, user_id: int) -> bool:
        result = await self._session.execute(
            delete(ListModel).where(ListModel.id == list_id, ListModel.user_id == user_id)
        )
        await self._session.commit()
        return bool(result.rowcount)

    async def add_item(
        self,
        list_id: int,
        user_id: int,
        tmdb_id: int,
        media_type: str,
    ) -> ListDetail | None:
        if not await self.exists_owned_by_user(list_id, user_id):
            return None

        next_position_query = select(func.coalesce(func.max(ListItemModel.position), -1) + 1).where(
            ListItemModel.list_id == list_id
        )
        next_position = await self._session.scalar(next_position_query)
        self._session.add(
            ListItemModel(
                list_id=list_id,
                tmdb_id=tmdb_id,
                media_type=media_type,
                position=int(next_position or 0),
            )
        )
        await self._touch_list(list_id)
        await self._session.commit()
        return await self.get_owned_detail(list_id, user_id)

    async def remove_item(
        self,
        list_id: int,
        user_id: int,
        item: ListItemRef,
    ) -> ListDetail | None:
        if not await self.exists_owned_by_user(list_id, user_id):
            return None

        await self._session.execute(
            delete(ListItemModel).where(
                ListItemModel.list_id == list_id,
                ListItemModel.tmdb_id == item.tmdb_id,
                ListItemModel.media_type == item.media_type,
            )
        )
        await self._touch_list(list_id)
        await self._session.commit()
        return await self.get_owned_detail(list_id, user_id)

    async def swap_item_positions(
        self,
        list_id: int,
        user_id: int,
        source: ListItemRef,
        target: ListItemRef,
    ) -> ListDetail | None:
        if not await self.exists_owned_by_user(list_id, user_id):
            return None

        result = await self._session.execute(
            select(ListItemModel).where(
                ListItemModel.list_id == list_id,
                (
                    (ListItemModel.tmdb_id == source.tmdb_id)
                    & (ListItemModel.media_type == source.media_type)
                )
                | (
                    (ListItemModel.tmdb_id == target.tmdb_id)
                    & (ListItemModel.media_type == target.media_type)
                ),
            )
        )
        items = result.scalars().all()
        if len(items) != 2:
            return None

        source_item = next(
            (
                item
                for item in items
                if item.tmdb_id == source.tmdb_id and item.media_type == source.media_type
            ),
            None,
        )
        target_item = next(
            (
                item
                for item in items
                if item.tmdb_id == target.tmdb_id and item.media_type == target.media_type
            ),
            None,
        )
        if source_item is None or target_item is None:
            return None

        source_item.position, target_item.position = target_item.position, source_item.position
        await self._touch_list(list_id)
        await self._session.commit()
        return await self.get_owned_detail(list_id, user_id)

    async def exists_owned_by_user(self, list_id: int, user_id: int) -> bool:
        result = await self._session.execute(
            select(ListModel.id).where(ListModel.id == list_id, ListModel.user_id == user_id)
        )
        return result.scalar_one_or_none() is not None

    async def _touch_list(self, list_id: int) -> None:
        await self._session.execute(
            update(ListModel).where(ListModel.id == list_id).values(updated_at=_utcnow())
        )

    async def _get_summary_by_id(self, list_id: int) -> ListSummary:
        items_count = (
            select(func.count())
            .select_from(ListItemModel)
            .where(ListItemModel.list_id == ListModel.id)
            .scalar_subquery()
        )
        result = await self._session.execute(
            select(ListModel, UserModel, items_count.label("items_count"))
            .join(UserModel, UserModel.id == ListModel.user_id)
            .where(ListModel.id == list_id)
        )
        list_model, user_model, count = result.one()
        return self._to_summary(list_model, user_model, count)

    async def _get_detail_summary(self, list_id: int, visibility_clause) -> ListSummary | None:
        items_count = (
            select(func.count())
            .select_from(ListItemModel)
            .where(ListItemModel.list_id == ListModel.id)
            .scalar_subquery()
        )
        result = await self._session.execute(
            select(ListModel, UserModel, items_count.label("items_count"))
            .join(UserModel, UserModel.id == ListModel.user_id)
            .where(ListModel.id == list_id)
            .where(visibility_clause)
        )
        row = result.first()
        if row is None:
            return None
        list_model, user_model, count = row
        return self._to_summary(list_model, user_model, count)

    async def _get_detail_with_items(self, summary: ListSummary) -> ListDetail:
        result = await self._session.execute(
            select(ListItemModel)
            .where(ListItemModel.list_id == summary.id)
            .order_by(ListItemModel.position.asc(), ListItemModel.id.asc())
        )
        items = [
            ListEntry(
                tmdb_id=item.tmdb_id,
                media_type=item.media_type,
                position=item.position,
                added_at=item.added_at,
            )
            for item in result.scalars().all()
        ]
        return ListDetail(**summary.__dict__, items=items)

    def _to_summary(self, list_model: ListModel, user_model: UserModel, items_count: int | None) -> ListSummary:
        return ListSummary(
            id=list_model.id,
            name=list_model.name,
            description=list_model.description,
            is_public=list_model.is_public,
            owner=ListOwner(
                id=user_model.id,
                username=user_model.username,
                display_name=user_model.display_name,
                avatar_url=user_model.avatar_url,
            ),
            items_count=int(items_count or 0),
            created_at=list_model.created_at,
            updated_at=list_model.updated_at,
        )
