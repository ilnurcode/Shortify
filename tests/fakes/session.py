class FakeSession:
    def __init__(self, dublicate=None, next_id=None):
        self.added_obj = None
        self.dublicate = dublicate
        self.next_id = next_id
        self.add_called = False
        self.flush_called = False
        self.commit_called = False
        self.refresh_called = False

    async def execute(self, query):
        qstr = str(query)
        if "nextval" in qstr:
            return FakeResult(self.next_id)
        return FakeResult(self.added_obj)

    def add(self, obj):
        self.add_called = True

    async def flush(self):
        self.flush_called = True

    async def commit(self):
        self.commit_called = True

    async def refresh(self, link):
        self.refresh_called = True


def fake_session_dep():
    return FakeSession()


class FakeResult:
    def __init__(self, value):
        self.value = value

    def scalar_one_or_none(self):
        return self.value


class FakeExisting:
    def __init__(self, short):
        self.short = short