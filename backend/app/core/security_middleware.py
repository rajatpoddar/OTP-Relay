"""Security middleware for OTP Relay."""
import time
from collections import defaultdict
from typing import Dict, Tuple
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple in-memory rate limiter."""

    def __init__(self, app, requests_per_minute: int = 60, requests_per_hour: int = 1000):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.requests_per_hour = requests_per_hour
        self._minute_counts: Dict[str, list] = defaultdict(list)
        self._hour_counts: Dict[str, list] = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()

        # Clean old entries
        self._minute_counts[client_ip] = [
            t for t in self._minute_counts[client_ip] if now - t < 60
        ]
        self._hour_counts[client_ip] = [
            t for t in self._hour_counts[client_ip] if now - t < 3600
        ]

        # Check limits
        if len(self._minute_counts[client_ip]) >= self.requests_per_minute:
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded. Try again in a minute."}
            )

        if len(self._hour_counts[client_ip]) >= self.requests_per_hour:
            return JSONResponse(
                status_code=429,
                content={"detail": "Hourly rate limit exceeded. Try again later."}
            )

        # Record request
        self._minute_counts[client_ip].append(now)
        self._hour_counts[client_ip].append(now)

        response = await call_next(request)
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to responses."""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"

        # HSTS (only in production)
        if not request.url.hostname in ("localhost", "127.0.0.1"):
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        return response


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log request details for audit."""

    async def dispatch(self, request: Request, call_next):
        start_time = time.time()

        response = await call_next(request)

        duration = time.time() - start_time

        # Log: method, path, status, duration
        # In production, this would write to a log file/service
        print(f"[{request.method}] {request.url.path} - {response.status_code} - {duration:.3f}s")

        return response
