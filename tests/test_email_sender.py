from types import SimpleNamespace

import pytest

from app.infrastructure.email import GmailSmtpEmailSender


class FakeSmtpClient:
    def __init__(self, host: str, port: int, timeout: int) -> None:
        self.host = host
        self.port = port
        self.timeout = timeout
        self.ehlo_calls = 0
        self.starttls_calls = 0
        self.login_calls: list[tuple[str, str]] = []
        self.sent_messages = []

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        return None

    def ehlo(self) -> None:
        self.ehlo_calls += 1

    def starttls(self) -> None:
        self.starttls_calls += 1

    def login(self, username: str, password: str) -> None:
        self.login_calls.append((username, password))

    def send_message(self, message) -> None:
        self.sent_messages.append(message)


@pytest.mark.asyncio
async def test_gmail_sender_sends_expected_message_with_reset_link(monkeypatch):
    settings = SimpleNamespace(
        smtp_host="smtp.gmail.com",
        smtp_port=587,
        smtp_username="sender@gmail.com",
        smtp_password="app-password",
        smtp_from_email="sender@gmail.com",
        smtp_use_starttls=True,
        password_reset_base_url="plotskip://reset-password",
    )
    fake_clients: list[FakeSmtpClient] = []

    def build_fake_client(host: str, port: int, timeout: int):
        client = FakeSmtpClient(host, port, timeout)
        fake_clients.append(client)
        return client

    monkeypatch.setattr("app.infrastructure.email.get_settings", lambda: settings)
    monkeypatch.setattr("app.infrastructure.email.smtplib.SMTP", build_fake_client)

    sender = GmailSmtpEmailSender()
    await sender.send_password_reset_email("target@example.com", "token-123")

    client = fake_clients[0]
    message = client.sent_messages[0]

    assert client.host == "smtp.gmail.com"
    assert client.port == 587
    assert client.starttls_calls == 1
    assert client.login_calls == [("sender@gmail.com", "app-password")]
    assert message["Subject"] == "Restablece tu contrasena de PlotSkip"
    assert message["From"] == "sender@gmail.com"
    assert message["To"] == "target@example.com"
    assert "plotskip://reset-password?token=token-123" in message.get_body(preferencelist=("plain",)).get_content()
    assert "plotskip://reset-password?token=token-123" in message.get_body(preferencelist=("html",)).get_content()


@pytest.mark.asyncio
async def test_gmail_sender_includes_manual_token_when_reset_base_url_missing(monkeypatch):
    settings = SimpleNamespace(
        smtp_host="smtp.gmail.com",
        smtp_port=587,
        smtp_username="sender@gmail.com",
        smtp_password="app-password",
        smtp_from_email="sender@gmail.com",
        smtp_use_starttls=True,
        password_reset_base_url="",
    )
    fake_clients: list[FakeSmtpClient] = []

    def build_fake_client(host: str, port: int, timeout: int):
        client = FakeSmtpClient(host, port, timeout)
        fake_clients.append(client)
        return client

    monkeypatch.setattr("app.infrastructure.email.get_settings", lambda: settings)
    monkeypatch.setattr("app.infrastructure.email.smtplib.SMTP", build_fake_client)

    sender = GmailSmtpEmailSender()
    await sender.send_password_reset_email("target@example.com", "token-456")

    message = fake_clients[0].sent_messages[0]
    plain_body = message.get_body(preferencelist=("plain",)).get_content()
    html_body = message.get_body(preferencelist=("html",)).get_content()

    assert "token-456" in plain_body
    assert "token-456" not in html_body
    assert "version de texto" in html_body
