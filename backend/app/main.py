"""FastAPI application entrypoint for TransitOps (local PostgreSQL backend)."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import (
    auth,
    drivers,
    finance,
    maintenance,
    reports,
    trips,
    users,
    vehicles,
)
from app.core.config import settings
from app.core.database import Base, engine

# Create tables on startup if they don't exist (dev convenience).
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    debug=settings.DEBUG,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    # Allow any localhost/127.0.0.1 port during dev so the frontend works
    # regardless of which port Vite picks (8080, 8081, ...).
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["system"])
def health() -> dict[str, str]:
    return {"status": "ok", "service": settings.PROJECT_NAME}


p = settings.API_V1_PREFIX
app.include_router(auth.router, prefix=p)
app.include_router(vehicles.router, prefix=p)
app.include_router(drivers.router, prefix=p)
app.include_router(trips.router, prefix=p)
app.include_router(maintenance.router, prefix=p)
app.include_router(finance.router, prefix=p)
app.include_router(reports.router, prefix=p)
app.include_router(users.router, prefix=p)
