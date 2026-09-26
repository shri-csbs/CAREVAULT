from fastapi import FastAPI
from backend.routers.events import router as events_router
from backend.routers.patients import router as patients_router

app = FastAPI(title="CAREVAULT API")

app.include_router(patients_router)
app.include_router(events_router)


@app.get("/health")
def health_check():
    return {
        "system": "CAREVAULT",
        "status": "running"
    }