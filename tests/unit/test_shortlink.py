import pytest
import uuid
from src.backend.services.short_link import ShortLinkService
from tests.fakes.session import FakeSession


@pytest.mark.asyncio
async def test_create_short_link_new(monkeypatch):
    session = FakeSession(dublicate=None, next_id=11)
    user_id = uuid.uuid4()
    monkeypatch.setattr(
        "src.backend.services.short_link.ShortLinkService.encode_base62",
        lambda x: "short_link",
    )
    result = await ShortLinkService.create_short_link(
        long="https://example.com", user=user_id, session=session
    )
    assert result == "short_link"
    assert session.add_called is True
    assert session.commit_called is True
    assert session.refresh_called is True
