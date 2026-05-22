from abc import ABC, abstractmethod


class IAuthTokenService(ABC):
    @abstractmethod
    def create_access_token(self, subject: str) -> str: ...

    @abstractmethod
    def decode_access_token(self, token: str) -> str: ...

    @abstractmethod
    def create_refresh_token(self) -> str: ...

    @abstractmethod
    def hash_token(self, token: str) -> str: ...
