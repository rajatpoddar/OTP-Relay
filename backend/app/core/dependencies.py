from functools import wraps
from typing import Callable, List
import uuid

from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.core.database import get_db


class RoleChecker:
    """Dependency class that checks if the current user has one of the allowed roles."""

    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    async def __call__(self, current_user=Depends(get_current_user)):
        if current_user.role.value not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user.role.value}' not authorized. Required: {self.allowed_roles}",
            )
        return current_user


class TenantContext:
    """Extracts and enforces tenant context from the authenticated user."""

    def __init__(self, require_org: bool = True):
        self.require_org = require_org

    async def __call__(self, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
        organization_id = None
        if self.require_org:
            if current_user.role.value == "SUPER_ADMIN":
                # Super admins can access any tenant via explicit query params
                pass
            else:
                organization_id = current_user.organization_id
                if organization_id is None:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="No organization assigned to this user",
                    )
        return TenantContextResult(
            user=current_user,
            organization_id=organization_id,
            db=db,
        )


class TenantContextResult:
    """Holds the authenticated user, their organization, and the DB session."""

    def __init__(self, user, organization_id, db):
        self.user = user
        self.organization_id = organization_id
        self.db = db

    @property
    def user_id(self):
        return self.user.id

    @property
    def role(self):
        return self.user.role.value

    @property
    def is_super_admin(self):
        return self.role == "SUPER_ADMIN"


# Pre-built role checkers
require_super_admin = RoleChecker(["SUPER_ADMIN"])
require_office_admin = RoleChecker(["SUPER_ADMIN", "OFFICE_ADMIN"])
require_operator = RoleChecker(["SUPER_ADMIN", "OFFICE_ADMIN", "OPERATOR"])
require_staff = RoleChecker(["SUPER_ADMIN", "OFFICE_ADMIN", "OPERATOR", "STAFF"])
require_authenticated = RoleChecker(["SUPER_ADMIN", "OFFICE_ADMIN", "OPERATOR", "STAFF"])


async def get_tenant_context(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TenantContextResult:
    """Get tenant context for non-super-admin users."""
    organization_id = None
    if current_user.role.value != "SUPER_ADMIN":
        organization_id = current_user.organization_id
        if organization_id is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No organization assigned",
            )
    return TenantContextResult(
        user=current_user,
        organization_id=organization_id,
        db=db,
    )


async def get_super_admin_context(
    current_user=Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
) -> TenantContextResult:
    """Get context for super admin users only."""
    return TenantContextResult(
        user=current_user,
        organization_id=None,
        db=db,
    )


def require_organization_id(tenant_ctx: TenantContextResult, org_id: uuid.UUID):
    """Verify that the requested organization matches the tenant context."""
    if not tenant_ctx.is_super_admin:
        if tenant_ctx.organization_id != org_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: cross-tenant violation",
            )
