from abc import ABC, abstractmethod


class ITmdbClient(ABC):
    @abstractmethod
    async def get(self, path: str, params: dict | None = None) -> dict: ...
