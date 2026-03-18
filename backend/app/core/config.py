from pydantic import BaseSettings, Field, RedisDsn, AnyUrl

class Settings(BaseSettings):
    APP_NAME: str = "TradeMind AI Backend"
    DEBUG: bool = False

    # database
    DATABASE_URL: str

    # redis
    REDIS_URL: RedisDsn

    # JWT
    JWT_SECRET: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    CORS_ORIGINS: list[str] = Field(default_factory=lambda: ["http://localhost:3000", "http://localhost:3001"])

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()