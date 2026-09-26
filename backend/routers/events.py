from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import ClinicalEvent, Patient

router = APIRouter(tags=["Clinical Events"])


class ClinicalEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    event_id: str
    patient_id: str
    clinician_id: Optional[str] = None
    event_type: str
    event_details: str
    event_timestamp: datetime
    source: str
    status: str
    event_hash: str
    integrity_status: str
    created_at: datetime


@router.get("/patients/{patient_id}/events", response_model=List[ClinicalEventResponse])
def get_patient_events(patient_id: str, db: Session = Depends(get_db)):
    # Verify patient exists
    patient = db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient '{patient_id}' not found",
        )

    # Return clinical events belonging to patient
    events = (
        db.query(ClinicalEvent)
        .filter(ClinicalEvent.patient_id == patient_id)
        .order_by(ClinicalEvent.event_timestamp.asc(), ClinicalEvent.event_id.asc())
        .all()
    )
    return events
