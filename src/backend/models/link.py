from sqlalchemy.orm import Mapped, mapped_column
from src.backend.models.base import Base
import uuid
from sqlalchemy import ForeignKey, DateTime, UniqueConstraint
import datetime


class LinkModel(Base):
    __tablename__ = "links"
    __table_args__ = (
        UniqueConstraint("user_id", "long", name="unique_links_user_long"),
    )
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    short: Mapped[str]
    long: Mapped[str]
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True))
    last_click_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), default=None
    )
    clicks: Mapped[int]
