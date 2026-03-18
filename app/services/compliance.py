"""
Rule-based compliance check for setups (MVP).
Checks presence of keywords/fields in decision text or payload.
"""

from typing import Any, List

from app.models import Setup
from app.schemas.setup import RuleCheckResult


def _text_from_payload(payload: dict[str, Any]) -> str:
    parts = []
    for v in payload.values():
        if isinstance(v, str):
            parts.append(v)
        elif isinstance(v, list):
            parts.extend(str(x) for x in v)
        elif isinstance(v, dict):
            parts.append(_text_from_payload(v))
        elif v is not None:
            parts.append(str(v))
    return " ".join(parts).lower()


def _check_rule_simple(rule: str, text: str) -> tuple[bool, str | None]:
    """
    MVP: rule is treated as required keywords (e.g. "stop loss" or "checklist").
    If rule contains "no X" then we check absence of X.
    """
    rule_lower = rule.lower().strip()
    # Simple heuristic: if rule starts with "no " then we want absence
    if rule_lower.startswith("no ") or rule_lower.startswith("never "):
        keyword = rule_lower.replace("no ", "").replace("never ", "").split()[0] if rule_lower else ""
        if keyword in text:
            return False, f"Found '{keyword}' (rule: {rule})"
        return True, None
    # Otherwise require at least one significant word from rule
    words = [w for w in rule_lower.split() if len(w) > 2 and w not in ("the", "and", "for", "with")]
    if not words:
        return True, None
    for w in words:
        if w in text:
            return True, None
    return False, f"Missing keywords from rule: {rule}"


def check_setup_compliance(setup: Setup, decision_text: str) -> List[RuleCheckResult]:
    """Run rule-based compliance for a setup against decision text."""
    results = []
    for rule in setup.rules or []:
        passed, deviation = _check_rule_simple(rule, decision_text)
        results.append(RuleCheckResult(rule=rule, passed=passed, deviation=deviation))
    return results


def get_decision_text_for_check(decision_payload: dict[str, Any] | None, decision_obj: Any | None) -> str:
    """Build a single text from decision (payload or ORM) for compliance check."""
    if decision_payload:
        return _text_from_payload(decision_payload)
    if decision_obj is None:
        return ""
    # From ORM: title, description, outcome, and JSON fields
    payload = {
        "title": getattr(decision_obj, "title", None),
        "description": getattr(decision_obj, "description", None),
        "outcome": getattr(decision_obj, "outcome", None),
        "trade_data": getattr(decision_obj, "trade_data", None),
        "investment_data": getattr(decision_obj, "investment_data", None),
        "business_data": getattr(decision_obj, "business_data", None),
        "personal_data": getattr(decision_obj, "personal_data", None),
    }
    return _text_from_payload({k: v for k, v in payload.items() if v is not None})
