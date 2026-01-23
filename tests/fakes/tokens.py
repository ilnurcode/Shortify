async def fake_delete_refresh_token(session, user_id):
    return None


def fake_create_access_token(user_id):
    return "access_token"


async def fake_create_save_refresh_token(session, user_id, response):
    return "refresh_token"