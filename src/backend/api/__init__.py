from fastapi import APIRouter
from src.backend.api.auth import router as auth_router
from src.backend.api.qr import qr
from src.backend.api.short_link import router as short_link_router
from src.backend.api.index import router as index_router
from src.backend.api.refresh import router as refresh_router
from src.backend.api.qr import router as qr_router
from src.backend.api.account import router as account_router

main_router = APIRouter()
main_router.include_router(refresh_router)
main_router.include_router(auth_router)
main_router.include_router(index_router)
main_router.include_router(account_router)
main_router.include_router(qr_router)
main_router.include_router(short_link_router)
