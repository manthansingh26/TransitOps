"""FastAPI application entrypoint."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import auth
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    debug=settings.DEBUG,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["system"])
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": settings.PROJECT_NAME}


# --- Routers ---
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)

# Registered as they are built:
# app.include_router(vehicles.router, prefix=settings.API_V1_PREFIX)
# app.include_router(drivers.router, prefix=settings.API_V1_PREFIX)
# app.include_router(trips.router, prefix=settings.API_V1_PREFIX)
