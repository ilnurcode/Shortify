from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select
from src.backend.models.link import LinkModel
from datetime import datetime, timezone


class ShortLinkService:
    @staticmethod
    def encode_base62(num: int) -> str:
        alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
        result = ""
        if num == 0:
            return alphabet[0]
        while num > 0:
            num, rem = divmod(num, 62)
            result = alphabet[rem] + result
        return result

    @classmethod
    async def create_short_link(cls, long: str, session: AsyncSession, user: UUID):
        result = await session.execute(
            select(LinkModel).where(LinkModel.long == long, LinkModel.user_id == user)
        )
        dublicate = result.scalar_one_or_none()
        if dublicate:
            return dublicate.short
        result = await session.execute(
            text("SELECT nextval(pg_get_serial_sequence('links','id'))")
        )
        next_id = result.scalar_one_or_none()
        short_code = cls.encode_base62(next_id)
        link = LinkModel(
            long=long,
            user_id=user,
            short=short_code,
            created_at=datetime.now(tz=timezone.utc),
            clicks=0,
            last_click_at=datetime.now(tz=timezone.utc),
        )
        session.add(link)
        await session.commit()
        await session.refresh(link)
        return link.short

    @classmethod
    async def find_links_by_user(cls, session: AsyncSession, user_id: UUID):
        result = await session.execute(
            select(LinkModel).where(LinkModel.user_id == user_id)
        )
        return result.scalars().all()
