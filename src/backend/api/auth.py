import uuid
from fastapi import APIRouter, HTTPException, Response, Request
from src.backend.api.index import templates
from src.backend.schemas.schemas import CredsSchema, LoginCredsSchema
from src.backend.services.database import SessionDep
from src.backend.models.user import UsersModel
from src.backend.services.security import (
    PasswordService,
    RefreshTokenService,
    AccessTokenService,
)

router = APIRouter()


@router.get("/registration", summary="Отображение страницы регистрации", tags=["Веб"])
def registration(request: Request):
    return templates.TemplateResponse("registration.html", {"request": request})


@router.post("/registration", summary="Регистрация", tags=["Регистрация"])
async def registration(session: SessionDep, creds: CredsSchema, response: Response):
    """
    Эндпоинт для регистрации пользователя по имени пользователя, почте и паролю.
    При регистрации записывает данные в бд, создает новый refresh token в куки и передает access token клиенту
    """
    user = await UsersModel.find_by_email(creds.email, session)
    if user:
        raise HTTPException(
            status_code=400, detail="Пользователь с таким email уже зарегистрирован"
        )
    hashed_password = PasswordService.get_hash_password(creds.password)
    user_id = uuid.uuid4()
    new_user = UsersModel(
        id=user_id,
        email=str(creds.email),
        username=creds.username,
        password=hashed_password,
    )
    session.add(new_user)
    await session.flush()
    await RefreshTokenService.create_and_save_refresh_token(session, user_id, response)
    await session.commit()
    return {
        "message": "Пользователь успешно зарегистрирован",
        "access_token": AccessTokenService.create_access_token(user_id),
    }


@router.get("/login", summary="Отображение страницы входа", tags=["Веб"])
def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})


@router.post("/login", summary="Авторизация", tags=["Авторизация"])
async def login(session: SessionDep, creds: LoginCredsSchema, response: Response):
    """
    Эндпоинт для авторизации пользователя по почте и паролю.

    При авторизации удаляет старый refresh token, создает новый в куки и передает access token клиенту
    """
    user = await UsersModel.find_by_email(creds.email, session)
    if not user or not PasswordService.verify_password(creds.password, user.password):
        raise HTTPException(status_code=401, detail="Неверный логин или пароль")
    user_id = user.id
    await RefreshTokenService.delete_refresh_tokens(session, user_id)
    await RefreshTokenService.create_and_save_refresh_token(session, user_id, response)
    await session.commit()
    return {
        "message": "Произведен вход в аккаунт",
        "access_token": AccessTokenService.create_access_token(user_id),
    }
