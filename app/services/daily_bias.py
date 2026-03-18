"""Daily bias generation (mock)."""

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from sqlalchemy.orm import Session


def generate_daily_bias(db: "Session", date_str: str):
    """Generate and persist a mock daily bias for the date."""
    from app import crud
    brief = (
        "Indices holding above key MAs. VIX subdued. "
        "Bias: slight risk-on; watch for position squaring after 15:00."
    )
    warning_zones = [
        "Avoid new longs after 15:30",
        "VIX spike above 15 = reduce size",
    ]
    return crud.create_daily_bias(
        db, date=date_str, brief=brief, warning_zones=warning_zones, sentiment="bullish"
    )
