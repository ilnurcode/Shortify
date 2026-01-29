from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.backend.schemas.schemas import settings
from src.backend.models.link import LinkModel
from src.backend.schemas.schemas import LinkSchema
from src.backend.services.database import SessionDep, get_session
from src.backend.services.depends import get_current_user
from src.backend.services.short_link import ShortLinkService
from datetime import timedelta, datetime, timezone
from src.backend.services.limit import RedisLimiter
from src.backend.api.index import templates

router = APIRouter()


@router.get(
    "/shortlink", summary="Отображение страницы работы со ссылками", tags=["Веб"]
)
def shortlink(request: Request):
    return templates.TemplateResponse("shortlink.html", {"request": request})


@router.post(
    "/shortlink", summary="Создание короткой ссылки", tags=["Работа со ссылками"]
)
async def create_short_link(
    link: LinkSchema, session: SessionDep, user=Depends(get_current_user)
):
    """
    Эндпоинт для создания короткой ссылки, принимает длинную ссылку и отдает короткую.
    """
    if await RedisLimiter.add_link_limit(user.id):
        raise HTTPException(status_code=429, detail="Слишком много запросов")
    short = await ShortLinkService.create_short_link(link.link, session, user.id)
    short_url = f"http://{settings.base_url}/{short}"
    return {"short_url": short_url}


@router.get("/{short_code}", summary="Редирект", tags=["Работа со ссылками"])
async def redirect_short_link(session: SessionDep, short_code: str):
    """
    Эндпоинт для редиректа.
    При переходе по короткой ссылке этот эндпоинт редиректит по длинной ссылке
    """
    result = await session.execute(
        select(LinkModel).where(LinkModel.short == short_code)
    )
    link = result.scalar_one_or_none()
    if not link:
        raise HTTPException(status_code=401, detail="Ссылка не найдена")
    if link.created_at + timedelta(days=30) < datetime.now(tz=timezone.utc):
        raise HTTPException(status_code=410, detail="Срок действия ссылки истек")
    long_url = link.long
    link.clicks += 1
    link.last_click_at = datetime.now(tz=timezone.utc)
    await session.commit()
    return RedirectResponse(url=long_url)
