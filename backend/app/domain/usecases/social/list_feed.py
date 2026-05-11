import base64
from datetime import datetime

from fastapi import HTTPException

from app.domain.entities.social import BaseActivity, FeedCursor
from app.domain.repositories.i_activity_repository import IActivityRepository


def encode_feed_cursor(activity: BaseActivity) -> str:
    raw_value = f"{activity.created_at.isoformat()}|{activity.id}"
    return base64.urlsafe_b64encode(raw_value.encode("utf-8")).decode("utf-8")


def decode_feed_cursor(value: str) -> FeedCursor:
    try:
        decoded = base64.urlsafe_b64decode(value.encode("utf-8")).decode("utf-8")
        created_at_raw, activity_id_raw = decoded.rsplit("|", 1)
        return FeedCursor(created_at=datetime.fromisoformat(created_at_raw), activity_id=int(activity_id_raw))
    except Exception as exc:  # pragma: no cover - defensive invalid cursor handling
        raise HTTPException(status_code=400, detail="Invalid cursor") from exc


class ListFeedUseCase:
    def __init__(self, activity_repo: IActivityRepository) -> None:
        self._activity_repo = activity_repo

    async def execute(
        self,
        current_user_id: int,
        limit: int,
        cursor: str | None,
    ) -> tuple[list[BaseActivity], str | None]:
        decoded_cursor = decode_feed_cursor(cursor) if cursor else None
        items = await self._activity_repo.list_feed(current_user_id, limit + 1, decoded_cursor)

        has_more = len(items) > limit
        page_items = items[:limit]
        next_cursor = encode_feed_cursor(page_items[-1]) if has_more and page_items else None
        return page_items, next_cursor
