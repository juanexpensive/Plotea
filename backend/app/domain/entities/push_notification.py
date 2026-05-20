from dataclasses import dataclass, field


@dataclass(frozen=True)
class PushDevice:
    id: int
    user_id: int
    expo_push_token: str
    platform: str


@dataclass(frozen=True)
class PushMessage:
    to: str
    title: str
    body: str
    data: dict[str, str] = field(default_factory=dict)
