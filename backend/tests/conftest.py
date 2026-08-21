"""Pytest fixtures for OTP Relay tests."""
import pytest
import asyncio
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport

from app.main import app


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Create an async test client."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


@pytest.fixture
async def super_admin_token(client: AsyncClient) -> str:
    """Get super admin authentication token."""
    response = await client.post(
        "/api/auth/login",
        json={"email": "admin@otp-relay.gov.in", "password": "admin123"}
    )
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture
async def office_admin_token(client: AsyncClient) -> str:
    """Get office admin authentication token."""
    response = await client.post(
        "/api/auth/login",
        json={"email": "office.admin@palojori.gov.in", "password": "admin123"}
    )
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture
async def operator_token(client: AsyncClient) -> str:
    """Get operator authentication token."""
    response = await client.post(
        "/api/auth/login",
        json={"email": "amit.kumar@palojori.gov.in", "password": "operator123"}
    )
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.fixture
async def staff_token(client: AsyncClient) -> str:
    """Get staff authentication token."""
    response = await client.post(
        "/api/auth/login",
        json={"email": "rajesh.kumar@palojori.gov.in", "password": "staff123"}
    )
    assert response.status_code == 200
    return response.json()["access_token"]
