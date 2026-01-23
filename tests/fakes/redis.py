class FakeRedis:
    def __init__(self):
        self.store = {}

    async def expire(self, key, ttl):
        return True

    async def zadd(self, key, value):
        if key not in self.store:
            self.store[key] = {}
        self.store[key].update(value)

    async def zremrangebyscore(self, key, min, max):
        if key in self.store:
            self.store[key] = {
                k: v for k, v in self.store[key].items() if not (min <= v <= max)
            }

    async def zcard(self, key):
        if key in self.store:
            return len(self.store[key].keys())
        return 0

