from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app.core.config import settings
from app.core.security_middleware import (
    RateLimitMiddleware,
    SecurityHeadersMiddleware,
    RequestLoggingMiddleware,
)
from app.api.v1.auth import router as auth_router
from app.api.v1.organizations import router as org_router
from app.api.v1.users import router as users_router
from app.api.v1.otp import router as otp_router
from app.api.v1.services import router as services_router
from app.api.v1.device import router as device_router
from app.api.v1.subscriptions import router as subscriptions_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.audit import router as audit_router
from app.api.v1.reports import router as reports_router
from app.api.v1.websocket import router as ws_router

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="OTP Relay - Government Portal OTP Routing SaaS Platform",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# Security middleware (order matters - last added = first executed)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware, requests_per_minute=60, requests_per_hour=1000)
app.add_middleware(RequestLoggingMiddleware)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(org_router)
app.include_router(users_router)
app.include_router(otp_router)
app.include_router(services_router)
app.include_router(device_router)
app.include_router(subscriptions_router)
app.include_router(dashboard_router)
app.include_router(audit_router)
app.include_router(reports_router)
app.include_router(ws_router)


@app.get("/")
async def root():
    return {"message": "OTP Relay API", "version": settings.APP_VERSION}


@app.get("/health")
async def health():
    return {"status": "healthy"}
