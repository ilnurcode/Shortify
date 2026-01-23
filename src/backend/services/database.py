from fastapi import Depends
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from src.backend.schemas.schemas import settings
from typing import Annotated


engine = create_async_engine(settings.db_url)
new_session = async_sessionmaker(engine)


async def get_session():
    async with new_session() as session:
        yield session


SessionDep = Annotated[AsyncSession, Depends(get_session)]
