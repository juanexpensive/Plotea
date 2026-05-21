import asyncio
import smtplib
from email.message import EmailMessage

from app.domain.services.i_email_sender import IEmailSender
from app.infrastructure.config import get_settings


class GmailSmtpEmailSender(IEmailSender):
    async def send_password_reset_email(self, to_email: str, reset_token: str) -> None:
        settings = get_settings()
        reset_url = self._build_reset_url(reset_token)
        message = EmailMessage()
        message["Subject"] = "Restablece tu contrasena de PlotSkip"
        message["From"] = settings.smtp_from_email
        message["To"] = to_email
        message.set_content(self._build_text_body(reset_url, reset_token))
        message.add_alternative(self._build_html_body(reset_url), subtype="html")

        await asyncio.to_thread(self._send_message, message)

    def _send_message(self, message: EmailMessage) -> None:
        settings = get_settings()

        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=30) as smtp:
            smtp.ehlo()
            if settings.smtp_use_starttls:
                smtp.starttls()
                smtp.ehlo()
            if settings.smtp_username:
                smtp.login(settings.smtp_username, settings.smtp_password)
            smtp.send_message(message)

    def _build_reset_url(self, reset_token: str) -> str:
        settings = get_settings()
        reset_url = settings.password_reset_base_url.rstrip("/")
        if reset_url:
            return f"{reset_url}?token={reset_token}"

        return reset_token

    def _build_text_body(self, reset_url: str, reset_token: str) -> str:
        settings = get_settings()
        if settings.password_reset_base_url:
            return (
                "Hemos recibido una solicitud para restablecer tu contraseña en Plotea.\n\n"
                f"Abre este enlace para continuar:\n{reset_url}\n\n"
                f"Si el enlace no funciona, usa este token manualmente:\n{reset_token}\n\n"
                "Si no has solicitado este cambio, puedes ignorar este correo."
            )

        return (
            "Hemos recibido una solicitud para restablecer tu contraseña en Plotea.\n\n"
            f"Tu token de restablecimiento es:\n{reset_token}\n\n"
            "Si no has solicitado este cambio, puedes ignorar este correo."
        )

    def _build_html_body(self, reset_url: str) -> str:
        settings = get_settings()
        if not settings.password_reset_base_url:
            return (
                "<p>Hemos recibido una solicitud para restablecer tu contraseña en Plotea.</p>"
                "<p>Revisa el token incluido en la version de texto del correo.</p>"
            )

        return (
            "<p>Hemos recibido una solicitud para restablecer tu contraseña en Plotea.</p>"
            f'<p><a href="{reset_url}" '
            'style="display:inline-block;padding:12px 18px;background:#18181b;color:#ffffff;'
            'text-decoration:none;border-radius:8px;">Abrir recuperacion en la app</a></p>'
            f"<p>Si el boton no funciona, copia este enlace:</p><p>{reset_url}</p>"
        )
