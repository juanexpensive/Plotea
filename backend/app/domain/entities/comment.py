from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class Comment:
    id: int
    review_id: int
    user_id: int
    username: str
    display_name: str | None
    parent_comment_id: int | None
    body: str
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
    replies: list["Comment"] = field(default_factory=list)
