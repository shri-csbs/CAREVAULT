import csv
import sys
from datetime import datetime, timezone
from pathlib import Path

# Add project root to sys.path so backend imports work seamlessly
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.database import Base, SessionLocal, engine
from backend.models import ClinicalEvent, Clinician, Patient


def parse_iso_datetime(dt_str: str) -> datetime:
    """Parse ISO-formatted datetime string, attaching UTC timezone if none exists."""
    dt = datetime.fromisoformat(dt_str.strip())
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def import_carevault_csvs(data_dir: Path = None):
    if data_dir is None:
        data_dir = PROJECT_ROOT / "data"

    patients_csv = data_dir / "patients.csv"
    clinicians_csv = data_dir / "clinicians.csv"
    events_csv = data_dir / "clinical_events.csv"

    # Verify all 3 files exist
    for f in [patients_csv, clinicians_csv, events_csv]:
        if not f.exists():
            raise FileNotFoundError(f"Authoritative dataset file not found: {f}")

    # Ensure database tables exist
    Base.metadata.create_all(bind=engine)

    stats = {
        "patients_imported": 0,
        "patients_skipped": 0,
        "clinicians_imported": 0,
        "clinicians_skipped": 0,
        "events_imported": 0,
        "events_skipped": 0,
        "errors": [],
    }

    db = SessionLocal()
    try:
        # 1. Import Patients (comma-delimited, utf-8-sig)
        with open(patients_csv, mode="r", encoding="utf-8-sig") as pf:
            reader = csv.DictReader(pf)
            for row in reader:
                try:
                    patient_id = row["PATIENT_ID"].strip()
                    existing = db.get(Patient, patient_id)
                    if existing:
                        stats["patients_skipped"] += 1
                        continue

                    patient = Patient(
                        patient_id=patient_id,
                        full_name=row["FULL_NAME"].strip(),
                        age=int(row["AGE"].strip()),
                        gender=row["GENDER"].strip(),
                        ward=row["WARD"].strip(),
                        bed_number=row["BED_NUMBER"].strip(),
                        blood_group=row["BLOOD_GROUP"].strip(),
                        allergies=row["ALLERGIES"].strip(),
                        critical_diagnosis=row["CRITICAL_DIAGNOSIS"].strip(),
                        current_medications=row["CURRENT_MEDICATIONS"].strip(),
                        recent_investigations=row["RECENT_INVESTIGATIONS"].strip(),
                        recent_results=row["RECENT_RESULTS"].strip(),
                        last_synchronized=parse_iso_datetime(row["LAST_SYNCHRONIZED"]),
                        record_version=row["RECORD_VERSION"].strip(),
                    )
                    db.add(patient)
                    stats["patients_imported"] += 1
                except Exception as e:
                    stats["errors"].append(f"Error importing patient {row.get('PATIENT_ID')}: {e}")

            db.commit()

        # 2. Import Clinicians (tab-delimited, utf-8-sig)
        with open(clinicians_csv, mode="r", encoding="utf-8-sig") as cf:
            reader = csv.DictReader(cf, delimiter="\t")
            for row in reader:
                try:
                    clinician_id = row["CLINICIAN_ID"].strip()
                    existing = db.get(Clinician, clinician_id)
                    if existing:
                        stats["clinicians_skipped"] += 1
                        continue

                    is_active = row["ACTIVE"].strip().upper() in ("TRUE", "1", "YES")
                    clinician = Clinician(
                        clinician_id=clinician_id,
                        name=row["NAME"].strip(),
                        role=row["ROLE"].strip(),
                        nfc_id=row["NFC_ID"].strip() if row.get("NFC_ID") else None,
                        fingerprint_id=row["FINGERPRINT_ID"].strip() if row.get("FINGERPRINT_ID") else None,
                        active=is_active,
                    )
                    db.add(clinician)
                    stats["clinicians_imported"] += 1
                except Exception as e:
                    stats["errors"].append(f"Error importing clinician {row.get('CLINICIAN_ID')}: {e}")

            db.commit()

        # 3. Import Clinical Events (comma-delimited, utf-8-sig)
        with open(events_csv, mode="r", encoding="utf-8-sig") as ef:
            reader = csv.DictReader(ef)
            for row in reader:
                try:
                    event_id = row["EVENT_ID"].strip()
                    existing = db.get(ClinicalEvent, event_id)
                    if existing:
                        stats["events_skipped"] += 1
                        continue

                    # Preserve unlisted clinician IDs (MG001, AD001) exactly as in CSV without fabricating records
                    clinician_id = row["CLINICIAN_ID"].strip() if row.get("CLINICIAN_ID") else None

                    event = ClinicalEvent(
                        event_id=event_id,
                        patient_id=row["PATIENT_ID"].strip(),
                        clinician_id=clinician_id,
                        event_type=row["EVENT_TYPE"].strip(),
                        event_details=row["EVENT_DETAILS"].strip(),
                        event_timestamp=parse_iso_datetime(row["EVENT_TIMESTAMP"]),
                        source=row["SOURCE"].strip(),
                        status=row["STATUS"].strip(),
                        event_hash=row["EVENT_HASH"].strip(),
                        integrity_status=row["INTEGRITY_STATUS"].strip(),
                        created_at=parse_iso_datetime(row["CREATED_AT"]),
                    )
                    db.add(event)
                    stats["events_imported"] += 1
                except Exception as e:
                    stats["errors"].append(f"Error importing clinical event {row.get('EVENT_ID')}: {e}")

            db.commit()

    except Exception as e:
        db.rollback()
        stats["errors"].append(f"Fatal error during import: {e}")
        raise
    finally:
        db.close()

    # Print clear summary
    print("\n" + "=" * 50)
    print("      CAREVAULT CSV IMPORT SUMMARY")
    print("=" * 50)
    print(f"  patients imported:        {stats['patients_imported']}")
    print(f"  clinicians imported:      {stats['clinicians_imported']}")
    print(f"  clinical events imported: {stats['events_imported']}")
    total_skipped = stats["patients_skipped"] + stats["clinicians_skipped"] + stats["events_skipped"]
    print(f"  skipped/duplicate records: {total_skipped}")
    print(f"    - patients skipped:       {stats['patients_skipped']}")
    print(f"    - clinicians skipped:     {stats['clinicians_skipped']}")
    print(f"    - clinical events skipped: {stats['events_skipped']}")
    print(f"  errors:                   {len(stats['errors'])}")
    if stats["errors"]:
        print("\nError Details:")
        for err in stats["errors"]:
            print(f"  - {err}")
    print("=" * 50 + "\n")

    return stats


if __name__ == "__main__":
    import_carevault_csvs()
