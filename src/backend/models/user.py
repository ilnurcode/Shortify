from sqlalchemy.orm import Mapped, mapped_column
from src.backend.models.base import Base
import uuid
from sqlalchemy import select


class UsersModel(Base):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True)
    username: Mapped[str]
    email: Mapped[str]
    password: Mapped[str]

    @classmethod
    async def find_by_email(cls, email, session):
        query = select(cls).where(cls.email == email)
        result = await session.execute(query)
        return result.scalar_one_or_none()

    @classmethod
    async def find_by_id(cls, user_id, session):
        query = select(cls).where(cls.id == user_id)
        result = await session.execute(query)
        return result.scalar_one_or_none()
