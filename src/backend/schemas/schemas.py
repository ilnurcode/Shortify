from pydantic_settings import BaseSettings, SettingsConfigDict
import asyncpg
from pydantic import BaseModel, Field, EmailStr
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
ENV_PATH = BASE_DIR / ".env"


class Settings(BaseSettings):
    SECRET_KEY: str
    ALGORITHM: str
    DB_USERNAME: str
    DB_PASSWORD: str
    DB_PORT: int
    DB_HOST: str
    DB_NAME: str
    SECRET_KEY: str
    ALGORITHM: str
    BASE_URL: str
    REDIS_URL: str
    REDIS_PORT: int

    @property
    def db_url(self):
        return f"postgresql+asyncpg://{self.DB_USERNAME}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    @property
    def base_url(self):
        return self.BASE_URL

    model_config = SettingsConfigDict(env_file=ENV_PATH)


settings = Settings()


class LoginCredsSchema(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=25, pattern=r"^[^\u0400-\u04FF]*$")


class CredsSchema(LoginCredsSchema):
    username: str = Field(min_length=1, max_length=25, pattern=r"^[A-Za-z0-9_]*$")


class LinkSchema(BaseModel):
    link: str = Field(min_length=1, max_length=2048, pattern=r"^.+/..+")
