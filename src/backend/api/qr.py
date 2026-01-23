from fastapi import APIRouter, Response, Request, Depends

from src.backend.schemas.schemas import LinkSchema
from src.backend.services.depends import get_current_user
from src.backend.services.qr import create_qr_code
from src.backend.api.index import templates

router = APIRouter()


@router.get("/qr")
def qr(request: Request):
    return templates.TemplateResponse("qr.html", {"request": request})


@router.post("/qr/generate")
def qr_generate(link: LinkSchema, user=Depends(get_current_user)):
    """
    Эндпоинт для генерации qr кода по ссылке.
    """
    qr = create_qr_code(link.link)
    return Response(qr, media_type="image/svg+xml")