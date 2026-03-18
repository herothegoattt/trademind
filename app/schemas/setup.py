"""Setups and compliance check schemas."""

from typing import Any, List

from pydantic import BaseModel


class SetupCreate(BaseModel):
    name: str
    description: str | None = None
    rules: List[str]


class SetupUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    rules: List[str] | None = None


class SetupResponse(BaseModel):
    id: int
    name: str
    description: str | None
    rules: List[str]

    class Config:
        from_attributes = True


class CheckComplianceRequest(BaseModel):
    """Either decision_id (existing) or decision payload for rule-based check."""
    decision_id: int | None = None
    decision_payload: dict[str, Any] | None = None


class RuleCheckResult(BaseModel):
    rule: str
    passed: bool
    deviation: str | None = None


class ComplianceReport(BaseModel):
    setup_id: int
    setup_name: str
    compliant: bool
    results: List[RuleCheckResult]
