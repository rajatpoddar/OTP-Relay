"""Authentication tests."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    """Test successful login."""
    response = await client.post(
        "/api/auth/login",
        json={"email": "admin@otp-relay.gov.in", "password": "admin123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["role"] == "SUPER_ADMIN"


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    """Test login with wrong password."""
    response = await client.post(
        "/api/auth/login",
        json={"email": "admin@otp-relay.gov.in", "password": "wrongpassword"}
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_nonexistent_user(client: AsyncClient):
    """Test login with nonexistent user."""
    response = await client.post(
        "/api/auth/login",
        json={"email": "nonexistent@example.com", "password": "password"}
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_current_user(client: AsyncClient, super_admin_token: str):
    """Test get current user endpoint."""
    response = await client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {super_admin_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "admin@otp-relay.gov.in"
    assert data["role"] == "SUPER_ADMIN"


@pytest.mark.asyncio
async def test_get_current_user_no_token(client: AsyncClient):
    """Test get current user without token."""
    response = await client.get("/api/auth/me")
    assert response.status_code == 403  # HTTPBearer returns 403


@pytest.mark.asyncio
async def test_get_current_user_invalid_token(client: AsyncClient):
    """Test get current user with invalid token."""
    response = await client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer invalid_token"}
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token(client: AsyncClient):
    """Test token refresh."""
    # Login first
    login_response = await client.post(
        "/api/auth/login",
        json={"email": "admin@otp-relay.gov.in", "password": "admin123"}
    )
    refresh_token = login_response.json()["refresh_token"]

    # Refresh
    response = await client.post(
        "/api/auth/refresh",
        json={"refresh_token": refresh_token}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
