from fastapi import APIRouter, Depends

from app.domain.entities.user import User
from app.domain.services.push_notifications_service import PushNotificationsService
from app.presentation.dependencies import get_current_user, get_push_notifications_service
from app.presentation.schemas.auth import MessageResponse
from app.presentation.schemas.notifications import ExpoPushTokenDeleteRequest, ExpoPushTokenRegisterRequest

router = APIRouter(tags=["notifications"])


@router.post("/notifications/expo-push-token", response_model=MessageResponse)
async def register_expo_push_token(
    data: ExpoPushTokenRegisterRequest,
    current_user: User = Depends(get_current_user),
    notifications_service: PushNotificationsService = Depends(get_push_notifications_service),
) -> MessageResponse:
    await notifications_service.register_expo_push_token(current_user.id, data.token, data.platform)
    return MessageResponse(message="Expo push token registered")


@router.delete("/notifications/expo-push-token", response_model=MessageResponse)
async def unregister_expo_push_token(
    data: ExpoPushTokenDeleteRequest,
    current_user: User = Depends(get_current_user),
    notifications_service: PushNotificationsService = Depends(get_push_notifications_service),
) -> MessageResponse:
    await notifications_service.unregister_expo_push_token(current_user.id, data.token)
    return MessageResponse(message="Expo push token removed")
