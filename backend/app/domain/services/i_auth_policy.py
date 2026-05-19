from abc import ABC, abstractmethod


class IAuthPolicy(ABC):
    @property
    @abstractmethod
    def access_token_expire_minutes(self) -> int: ...

    @property
    @abstractmethod
    def refresh_token_expire_days(self) -> int: ...

    @property
    @abstractmethod
    def password_reset_token_expire_hours(self) -> int: ...
