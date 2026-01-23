from src.backend.services.redis import get_redis
from datetime import datetime, timezone
import uuid


class RedisLimiter:
    """
    Класс для ограничения создания ссылок в минуту
    """

    @staticmethod
    async def add_link_limit(user_id: uuid.UUID) -> bool:
        """
        Проверяет сколько было созданно ссылок за последнюю минуту. Возвращает True если их меньше 10, иначе False
        """

        user_id = str(user_id)
        now = datetime.now(tz=timezone.utc).timestamp()
        redis = await get_redis()
        await redis.expire(user_id, 120)
        await redis.zadd(user_id, {str(uuid.uuid4()): now})
        await redis.zremrangebyscore(user_id, 0, now - 60)
        if await redis.zcard(user_id) > 10:
            return True
        return False