from sqlalchemy.orm import Mapped, mapped_column
from src.backend.models.base import Base
import uuid
from sqlalchemy import ForeignKey, DateTime, select
import datetime


class TokensModel(Base):
    __tablename__ = "refresh_tokens"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    hashed_token: Mapped[str]
    exp_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True))

    @classmethod
    async def find_token_by_user_id(cls, user_id: uuid.UUID, session):
        query = select(cls).where(cls.user_id == user_id)
        result = await session.execute(query)
        return result.scalar_one_or_none()
