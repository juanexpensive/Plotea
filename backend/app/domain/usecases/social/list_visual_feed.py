from collections import OrderedDict

from app.domain.entities.media import MediaItem
from app.domain.entities.social import BaseActivity, ReviewActivity, VisualFeedItem, VisualFeedParticipant, WatchLogActivity
from app.domain.repositories.i_activity_repository import IActivityRepository
from app.domain.services.media_summary_loader import MediaSummaryLoader
from app.domain.usecases.social.list_feed import decode_feed_cursor


class ListVisualFeedUseCase:
    def __init__(
        self,
        activity_repo: IActivityRepository,
        media_loader: MediaSummaryLoader,
    ) -> None:
        self._activity_repo = activity_repo
        self._media_loader = media_loader

    async def execute(self, user_id: int, limit: int, cursor: str | None = None) -> list[VisualFeedItem]:
        activities = await self._activity_repo.list_feed(user_id, max(limit * 4, 20), decode_feed_cursor(cursor) if cursor else None)
        grouped: "OrderedDict[tuple[str, int], list[ReviewActivity | WatchLogActivity]]" = OrderedDict()
        for activity in activities:
            if not isinstance(activity, (ReviewActivity, WatchLogActivity)):
                continue
            key = (activity.media_type, activity.tmdb_id)
            grouped.setdefault(key, []).append(activity)

        items: list[VisualFeedItem] = []
        for (media_type, tmdb_id), group in grouped.items():
            media = await self._media_loader.load(media_type, tmdb_id)
            participants: list[VisualFeedParticipant] = []
            seen_users: set[int] = set()
            for activity in group:
                if activity.actor.id in seen_users:
                    continue
                seen_users.add(activity.actor.id)
                participants.append(
                    VisualFeedParticipant(
                        id=activity.actor.id,
                        username=activity.actor.username,
                        display_name=activity.actor.display_name,
                        avatar_url=activity.actor.avatar_url,
                        activity_type=activity.activity_type,
                        rating=activity.rating if hasattr(activity, "rating") else None,
                        created_at=activity.created_at,
                        review_id=activity.review_id if isinstance(activity, ReviewActivity) else None,
                        review_body_preview=activity.body_preview if isinstance(activity, ReviewActivity) else None,
                        review_contains_spoilers=activity.contains_spoilers if isinstance(activity, ReviewActivity) else None,
                    )
                )

            items.append(
                VisualFeedItem(
                    media=MediaItem(
                        tmdb_id=media.tmdb_id,
                        media_type=media.media_type,
                        title=media.title,
                        poster_path=media.poster_path,
                        vote_average=media.vote_average,
                        release_date=media.release_date,
                    ),
                    participants=participants[:4],
                    recent_activity_count=len(group),
                    latest_activity_at=max(activity.created_at for activity in group),
                )
            )
            if len(items) >= limit:
                break

        return items
