"""JWT and password hashing."""

from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# pbkdf2_sha256 is the active scheme; bcrypt is kept as legacy so that any
# passwords hashed with an older version of this app can still be verified.
# New passwords are always stored as pbkdf2_sha256.
# Passlib 1.7.4 has a known incompatibility with bcrypt>=4 — guard with try/except.
try:
    pwd_context = CryptContext(schemes=["pbkdf2_sha256", "bcrypt"], deprecated=["bcrypt"])
except Exception:
    pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return pwd_context.verify(plain, hashed)
    except Exception:
        # Passlib could not identify the hash scheme (e.g. a legacy bcrypt hash when
        # passlib's bcrypt backend is unavailable).  Try bcrypt directly as a fallback.
        try:
            import bcrypt as _bcrypt_lib
            if hashed.startswith(("$2b$", "$2a$", "$2y$")):
                return _bcrypt_lib.checkpw(plain.encode(), hashed.encode())
        except Exception:
            pass
        return False


def create_access_token(sub: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": str(sub), "exp": expire, "type": "access"}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_access_token(token: str) -> dict[str, Any] | None:
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    except JWTError:
        return None
