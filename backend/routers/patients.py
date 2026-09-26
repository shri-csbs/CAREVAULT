from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Patient

router = APIRouter(prefix="/patients", tags=["Patients"])


class PatientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    patient_id: str
    full_name: str
    age: int
    gender: str
    ward: str
    bed_number: str
    blood_group: str
    allergies: str
    critical_diagnosis: str
    current_medications: str
    recent_investigations: str
    recent_results: str
    last_synchronized: datetime
    record_version: str


@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: str, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient '{patient_id}' not found",
        )
    return patient
