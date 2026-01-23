import uuid


class FakeUser:
    def __init__(self):
        self.id = uuid.uuid4()
        self.username = "Testusername"
        self.email = "test@example.com"
        self.password = "Test_password"


async def find_user_none(email, session):
    return None


async def find_user_exists(email, session):
    return FakeUser()