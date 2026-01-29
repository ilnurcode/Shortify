from fastapi import APIRouter, Depends, Request
from src.backend.api.index import templates
from src.backend.schemas.schemas import AccountOutSchema
from src.backend.services.database import SessionDep
from src.backend.services.depends import get_current_user
from src.backend.services.short_link import ShortLinkService

router = APIRouter()


@router.get("/account", summary="Отображение личного кабинета", tags=["Веб"])
def index(request: Request):
    return templates.TemplateResponse("account.html", {"request": request})


@router.get("/account-info")
async def account_info(session: SessionDep, user=Depends(get_current_user)):
    links = await ShortLinkService.find_links_by_user(session, user.id)
    return AccountOutSchema(username=user.username, links=links)
