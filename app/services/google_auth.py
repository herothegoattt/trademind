"""Verify Google id_token and return user info."""

from typing import Optional

import httpx
from app.core.config import settings


async def verify_google_id_token(id_token: str) -> Optional[dict]:
    """
    Verify Google id_token and return payload (sub, email, etc.).
    Uses tokeninfo endpoint. Requires GOOGLE_CLIENT_ID to validate aud.
    """
    if not id_token:
        return None
    async with httpx.AsyncClient() as client:
        try:
            r = await client.get(
                "https://oauth2.googleapis.com/tokeninfo",
                params={"id_token": id_token},
                timeout=10.0,
            )
            r.raise_for_status()
            data = r.json()
        except (httpx.HTTPError, ValueError):
            return None
    if settings.google_client_id and data.get("aud") != settings.google_client_id:
        return None
    return data
