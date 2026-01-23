import jwt
from fastapi.params import Depends
from src.backend.models.user import UsersModel
from src.backend.services.security import AccessTokenService
from src.backend.services.database import SessionDep
from fastapi import HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

auth_scheme = HTTPBearer()


async def get_current_user(
    session: SessionDep,
    credentials: HTTPAuthorizationCredentials = Depends(auth_scheme),
):
    """
    Функция для получения текущего пользователя по access token
    """
    token = credentials.credentials
    try:
        payload = AccessTokenService.decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Неверный токен")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Неверный токен")
    user = await session.get(UsersModel, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="Пользователь не найден")
    return user
