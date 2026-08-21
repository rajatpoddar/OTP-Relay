"""RBAC authorization tests."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_super_admin_access_organizations(client: AsyncClient, super_admin_token: str):
    """Test super admin can access organizations."""
    response = await client.get(
        "/api/super-admin/organizations",
        headers={"Authorization": f"Bearer {super_admin_token}"}
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_office_admin_cannot_access_organizations(client: AsyncClient, office_admin_token: str):
    """Test office admin cannot access super admin endpoints."""
    response = await client.get(
        "/api/super-admin/organizations",
        headers={"Authorization": f"Bearer {office_admin_token}"}
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_operator_cannot_access_organizations(client: AsyncClient, operator_token: str):
    """Test operator cannot access super admin endpoints."""
    response = await client.get(
        "/api/super-admin/organizations",
        headers={"Authorization": f"Bearer {operator_token}"}
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_staff_cannot_access_organizations(client: AsyncClient, staff_token: str):
    """Test staff cannot access super admin endpoints."""
    response = await client.get(
        "/api/super-admin/organizations",
        headers={"Authorization": f"Bearer {staff_token}"}
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_office_admin_access_staff(client: AsyncClient, office_admin_token: str):
    """Test office admin can access staff management."""
    response = await client.get(
        "/api/admin/staff",
        headers={"Authorization": f"Bearer {office_admin_token}"}
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_operator_cannot_access_staff(client: AsyncClient, operator_token: str):
    """Test operator cannot access staff management."""
    response = await client.get(
        "/api/admin/staff",
        headers={"Authorization": f"Bearer {operator_token}"}
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_operator_access_own_otps(client: AsyncClient, operator_token: str):
    """Test operator can access their OTPs."""
    response = await client.get(
        "/api/operator/otp",
        headers={"Authorization": f"Bearer {operator_token}"}
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_staff_access_authorizations(client: AsyncClient, staff_token: str):
    """Test staff can access their authorizations."""
    response = await client.get(
        "/api/staff/authorizations",
        headers={"Authorization": f"Bearer {staff_token}"}
    )
    assert response.status_code == 200
