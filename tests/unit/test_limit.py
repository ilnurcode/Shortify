import pytest
import uuid

from src.backend.services.limit import RedisLimiter
from tests.fakes.redis import FakeRedis


@pytest.mark.asyncio
async def test_limit_success(monkeypatch):
    fakeredis = FakeRedis()

    async def fake_get_redis():
        return fakeredis

    monkeypatch.setattr("src.backend.services.limit.get_redis", fake_get_redis)

    user_id = uuid.uuid4()
    result = await RedisLimiter.add_link_limit(user_id)
    assert result is False


@pytest.mark.asyncio
async def test_limit_failure(monkeypatch):
    fakeredis = FakeRedis()

    async def fake_get_redis():
        return fakeredis

    monkeypatch.setattr("src.backend.services.limit.get_redis", fake_get_redis)

    user_id = uuid.uuid4()
    for i in range(11):
        result = await RedisLimiter.add_link_limit(user_id)
    result = await RedisLimiter.add_link_limit(user_id)
    assert result is True
