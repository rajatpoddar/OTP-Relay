"""Pytest fixtures for OTP Relay tests."""
import pytest
from httpx import AsyncClient, ASGITransport


@pytest.fixture
async def client():
    """Create an async test client with fresh DB session per test."""
    from app.core.database import engine

    # Dispose existing pool connections so they don't cross event loops
    await engine.dispose()

    from app.main import app
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


@pytest.fixture
async def super_admin_token(client):
    """Get super admin authentication token."""
    response = await client.post(
        "/api/auth/login",
        json={"email": "admin@otp-relay.gov.in", "password": "admin123"}
    )
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture
async def office_admin_token(client):
    """Get office admin authentication token."""
    response = await client.post(
        "/api/auth/login",
        json={"email": "office.admin@palojori.gov.in", "password": "admin123"}
    )
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture
async def operator_token(client):
    """Get operator authentication token."""
    response = await client.post(
        "/api/auth/login",
        json={"email": "amit.kumar@palojori.gov.in", "password": "operator123"}
    )
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture
async def staff_token(client):
    """Get staff authentication token."""
    response = await client.post(
        "/api/auth/login",
        json={"email": "rajesh.kumar@palojori.gov.in", "password": "staff123"}
    )
    assert response.status_code == 200
    return response.json()["access_token"]
