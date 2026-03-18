"""Setups CRUD and compliance check."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from fastapi import status

from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.api.deps import get_current_user, get_current_user_optional
from app import crud
from app.schemas.setup import (
    SetupCreate,
    SetupUpdate,
    SetupResponse,
    CheckComplianceRequest,
    ComplianceReport,
)
from app.services.compliance import check_setup_compliance, get_decision_text_for_check

router = APIRouter(prefix="/api/v1", tags=["setups"])

# Suggested questions by section
SUGGESTED_QUESTIONS = {
    "Journal": [
        "What did I learn from yesterday?",
        "How did I manage risk this week?",
    ],
    "Setups": [
        "Which framework worked best last month?",
        "How can I adapt my entry rules?",
    ],
    "Analysis": [
        "Are there correlations I'm missing?",
        "What indicators are underperforming?",
    ],
    "Markets": [
        "Which sectors are overheating?",
        "Where is liquidity drying up?",
    ],
    "News": [
        "What recent headlines could move my positions?",
        "How is sentiment shifting?",
    ],
    "Daily Bias": [
        "Should I lean long or short today?",
        "What macro themes are strongest?",
    ],
}

# Warning zones by section
WARNING_ZONES = {
    "Journal": [
        "Avoid revenge trading after losses",
        "Watch for overtrading",
    ],
    "Setups": [
        "Do not force weak setups",
        "Keep stop distances realistic",
    ],
    "Analysis": [
        "Avoid confirmation bias in indicators",
        "Check data sources for reliability",
    ],
    "Markets": [
        "Beware of low-volume spikes",
        "Watch for geopolitical events",
    ],
    "News": [
        "Fake headlines can mislead",
        "Don't react to unconfirmed reports",
    ],
    "Daily Bias": [
        "Bias can lag price action",
        "Don't overcommit to one view",
    ],
}


@router.get("/setups/suggested-questions")
def get_suggested_questions(
    section: str = "Journal",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional),
):
    """Get suggested questions for a section."""
    questions = SUGGESTED_QUESTIONS.get(section, SUGGESTED_QUESTIONS["Journal"])
    return {"questions": questions}


@router.get("/setups/warning-zones")
def get_warning_zones(
    section: str = "Journal",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional),
):
    """Get warning zones for a section."""
    zones = WARNING_ZONES.get(section, WARNING_ZONES["Journal"])
    return {"zones": zones}


@router.get("/setups", response_model=List[SetupResponse])
def list_setups(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[SetupResponse]:
    """List all setups for the current user."""
    return crud.get_setups(db, current_user.id)


@router.post("/setups", response_model=SetupResponse, status_code=status.HTTP_201_CREATED)
def create_setup(
    data: SetupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SetupResponse:
    """Create a new setup/framework."""
    s = crud.create_setup(
        db, current_user.id, data.name, data.description, data.rules
    )
    return SetupResponse.model_validate(s)


@router.get("/setups/{setup_id}", response_model=SetupResponse)
def get_setup(
    setup_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SetupResponse:
    """Get a setup by ID."""
    s = crud.get_setup(db, setup_id, current_user.id)
    if not s:
        raise HTTPException(status_code=404, detail="Setup not found")
    return SetupResponse.model_validate(s)


@router.put("/setups/{setup_id}", response_model=SetupResponse)
def update_setup(
    setup_id: int,
    data: SetupUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SetupResponse:
    """Update a setup."""
    s = crud.update_setup(
        db, setup_id, current_user.id,
        name=data.name,
        description=data.description,
        rules=data.rules,
    )
    if not s:
        raise HTTPException(status_code=404, detail="Setup not found")
    return SetupResponse.model_validate(s)


@router.delete("/setups/{setup_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_setup(
    setup_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete a setup."""
    if not crud.delete_setup(db, setup_id, current_user.id):
        raise HTTPException(status_code=404, detail="Setup not found")


@router.post("/setups/{setup_id}/check", response_model=ComplianceReport)
def check_compliance(
    setup_id: int,
    body: CheckComplianceRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ComplianceReport:
    """
    Check compliance of a decision against this setup (rule-based MVP).
    Body: decision_id (existing) or decision_payload (inline).
    """
    s = crud.get_setup(db, setup_id, current_user.id)
    if not s:
        raise HTTPException(status_code=404, detail="Setup not found")

    decision_text = ""
    if body.decision_id:
        dec = crud.get_decision(db, body.decision_id, current_user.id)
        if not dec:
            raise HTTPException(status_code=404, detail="Decision not found")
        decision_text = get_decision_text_for_check(None, dec)
    elif body.decision_payload:
        decision_text = get_decision_text_for_check(body.decision_payload, None)
    else:
        raise HTTPException(
            status_code=400,
            detail="Provide decision_id or decision_payload",
        )

    results = check_setup_compliance(s, decision_text)
    compliant = all(r.passed for r in results)
    return ComplianceReport(
        setup_id=s.id,
        setup_name=s.name,
        compliant=compliant,
        results=results,
    )
