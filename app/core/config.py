"""
Application configuration settings.
"""

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""

    app_name: str = "TradeMind AI"
    app_version: str = "1.0.0"
    app_description: str = (
        "AI-движок для автоматического разбора убыточных сделок "
        "по техническим и психологическим паттернам"
    )

    # API
    api_prefix: str = "/api/v1"
    debug: bool = False

    # Database (SQLite by default; use Postgres in production)
    database_url: str = "sqlite:///./trademind.db"

    # CORS (comma-separated origins, or * for development)
    cors_origins: str = "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173,http://localhost:3001"

    # Auth
    secret_key: str = "change-me-in-production-use-openssl-rand-hex-32"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    # Google Sign-In (optional; set to validate id_token aud)
    google_client_id: str | None = None

    # Public URL of the frontend (used for OAuth/redirect/payment return URLs)
    frontend_url: str = "http://localhost:3000"

    # AI Models
    anthropic_api_key: str | None = None  # Anthropic Claude API key (https://console.anthropic.com)
    gemini_api_key: str | None = None  # Google Gemini API key
    openai_api_key: str | None = None  # OpenAI / ChatGPT API key

    # News APIs (optional; if not set, uses mock data)
    newsdata_api_key: str | None = None  # NewsData.io (free tier: https://newsdata.io)
    newsapi_api_key: str | None = None  # NewsAPI.org (requires API key)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",  # tolerate extra keys in .env instead of crashing on import
    )

    # Lemon Squeezy payments
    lemonsqueezy_api_key: str | None = None
    lemonsqueezy_store_id: str | None = None
    lemonsqueezy_webhook_secret: str | None = None
    lemonsqueezy_test_mode: bool = True  # bypass LS checkout, activate plans directly
    # Lemon Squeezy Variant IDs — set these in .env after creating products in Lemon Squeezy Dashboard
    ls_variant_edge_monthly: str | None = None
    ls_variant_edge_annual: str | None = None
    ls_variant_apex_monthly: str | None = None
    ls_variant_apex_annual: str | None = None

    # Resend (transactional emails)
    resend_api_key: str | None = None
    resend_from_email: str = "TradeMind <noreply@trademind.ai>"

    # Market Data APIs
    oanda_api_key: str | None = None  # OANDA v20 API key (https://developer.oanda.com)
    oanda_account_id: str | None = None  # OANDA account ID (e.g., 101-001-123456-001)
    trading_economics_api_key: str | None = None  # Trading Economics (https://tradingeconomics.com/api)
    # ForexFactory (optional): public API or proxy URL returning JSON calendar/events
    forexfactory_api_url: str | None = None
    forexfactory_api_key: str | None = None

    def get_cors_origins_list(self) -> List[str]:
        if self.cors_origins.strip() == "*":
            return ["*"]
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
