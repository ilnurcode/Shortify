import pytest
from httpx import AsyncClient, ASGITransport
from src.backend.services.security import (
    PasswordService,
    RefreshTokenService,
    AccessTokenService,
)
from src.main import app
from tests.fakes.security import fake_get_hashed_password, fake_verify_password
from tests.fakes.session import fake_session_dep
from tests.fakes.tokens import (
    fake_create_save_refresh_token,
    fake_create_access_token,
    fake_delete_refresh_token,
)
from tests.fakes.users import find_user_none, find_user_exists
from src.backend.models.user import UsersModel
from src.backend.services.database import get_session


class FakeSession:
    def __init__(self):
        self.added = None
        self.flushed = False
        self.commited = False

    def add(self, instance):
        self.added = instance

    def flush(self):
        self.flushed = True

    def commit(self):
        self.commited = True


@pytest.mark.asyncio
async def test_registration_success(monkeypatch):
    app.dependency_overrides[get_session] = fake_session_dep
    monkeypatch.setattr(UsersModel, "find_by_email", find_user_none)
    monkeypatch.setattr(PasswordService, "get_hash_password", fake_get_hashed_password)
    monkeypatch.setattr(
        RefreshTokenService,
        "create_and_save_refresh_token",
        fake_create_save_refresh_token,
    )
    monkeypatch.setattr(
        AccessTokenService, "create_access_token", fake_create_access_token
    )
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.post(
            "/registration",
            json={
                "username": "Test",
                "email": "test@example.com",
                "password": "test_password",
            },
        )
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Пользователь успешно зарегистрирован"
    assert data["access_token"] == "access_token"


@pytest.mark.asyncio
async def test_registration_failure(monkeypatch):
    app.dependency_overrides[get_session] = fake_session_dep
    monkeypatch.setattr(UsersModel, "find_by_email", find_user_exists)
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.post(
            "/registration",
            json={
                "username": "Test",
                "email": "test@example.com",
                "password": "test_password",
            },
        )
    assert response.status_code == 400
    data = response.json()
    assert data["detail"] == "Пользователь с таким email уже зарегистрирован"


@pytest.mark.asyncio
async def test_login_success(monkeypatch):
    app.dependency_overrides[get_session] = fake_session_dep
    monkeypatch.setattr(UsersModel, "find_by_email", find_user_exists)
    monkeypatch.setattr(PasswordService, "verify_password", fake_verify_password)
    monkeypatch.setattr(
        RefreshTokenService, "delete_refresh_tokens", fake_delete_refresh_token
    )
    monkeypatch.setattr(
        RefreshTokenService,
        "create_and_save_refresh_token",
        fake_create_save_refresh_token,
    )
    monkeypatch.setattr(
        AccessTokenService, "create_access_token", fake_create_access_token
    )
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.post(
            url="/login",
            json={"email": "test@example.com", "password": "Test_password"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["access_token"] == "access_token"
        assert data["message"] == "Произведен вход в аккаунт"


@pytest.mark.asyncio
async def test_login_failure(monkeypatch):
    app.dependency_overrides[get_session] = fake_session_dep
    monkeypatch.setattr(UsersModel, "find_by_email", find_user_none)
    monkeypatch.setattr(PasswordService, "verify_password", fake_verify_password)
    monkeypatch.setattr(
        RefreshTokenService, "delete_refresh_tokens", fake_delete_refresh_token
    )
    monkeypatch.setattr(
        AccessTokenService, "create_access_token", fake_create_access_token
    )

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.post(
            url="/login",
            json={"email": "test@example.com", "password": "Test_password"},
        )
        assert response.status_code == 401
        data = response.json()
        assert data["detail"] == "Неверный логин или пароль"

