import asyncio
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from src.backend.services.database import get_session
from src.backend.models.link import LinkModel
from sqlalchemy import select
from fastapi import Depends, FastAPI
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger


async def cleaner():
    """
    Функция для очищения ссылок по которым не переходили более 30 дней
    """
    async with get_session() as session:
        date = datetime.now(tz=timezone.utc) - timedelta(days=30)
        old_links = await session.execute(
            select(LinkModel).where(LinkModel.last_click_at < date)
        )
        for link in old_links.scalars():
            await session.delete(link)
        await session.commit()


@asynccontextmanager
async def scheduler(app: FastAPI):
    """
    Функция для исполнения очистки каждые сутки
    """
    scheduler = AsyncIOScheduler(timezone=timezone.utc)
    scheduler.add_job(func=cleaner, trigger=IntervalTrigger(hours=24), id="cleaner")
    scheduler.start()
    try:
        yield
        while True:
            await asyncio.sleep(3600)
    finally:
        scheduler.shutdown()
