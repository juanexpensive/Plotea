from typing import Literal

from pydantic import BaseModel, Field


class ExpoPushTokenRegisterRequest(BaseModel):
    token: str = Field(min_length=1)
    platform: Literal["android", "ios"]


class ExpoPushTokenDeleteRequest(BaseModel):
    token: str = Field(min_length=1)
