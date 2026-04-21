import asyncio

import resend

from app.domain.services.i_email_sender import IEmailSender
from app.infrastructure.config import get_settings


class ResendEmailSender(IEmailSender):
    async def send_password_reset_email(self, to_email: str, reset_token: str) -> None:
        settings = get_settings()
        resend.api_key = settings.resend_api_key

        await asyncio.to_thread(
            resend.Emails.send,
            {
                "from": settings.resend_from_email,
                "to": [to_email],
                "subject": "Restablece tu contrasena de PlotSkip",
                "text": self._build_text_body(reset_token),
            },
        )

    def _build_text_body(self, reset_token: str) -> str:
        settings = get_settings()
        reset_url = settings.password_reset_base_url.rstrip("/")
        if reset_url:
            return (
                "Hemos recibido una solicitud para restablecer tu contrasena en PlotSkip.\n\n"
                f"Abre este enlace para continuar:\n{reset_url}?token={reset_token}\n\n"
                "Si no has solicitado este cambio, puedes ignorar este correo."
            )

        return (
            "Hemos recibido una solicitud para restablecer tu contrasena en PlotSkip.\n\n"
            f"Tu token de restablecimiento es:\n{reset_token}\n\n"
            "Si no has solicitado este cambio, puedes ignorar este correo."
        )
