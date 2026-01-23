from redis.asyncio import Redis
from src.backend.schemas.schemas import settings

redis_client = None


async def get_redis():
    global redis_client
    if not redis_client:
        redis_client = Redis(host=settings.REDIS_URL, port=settings.REDIS_PORT)
    return redis_client
