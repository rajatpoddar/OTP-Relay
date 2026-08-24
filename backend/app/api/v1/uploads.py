import os
import re
import uuid
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.dependencies import require_super_admin
from app.models.subscription import AppVersion

router = APIRouter(prefix="/api", tags=["Uploads"])

# Upload directory
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "apk")

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload/apk")
async def upload_apk(
    file: UploadFile = File(...),
    release_notes: str = "",
    force_update: bool = False,
    current_user=Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload APK file for app distribution.
    
    - File must be .apk format
    - Maximum size: 100MB
    - Returns download URL for the uploaded file
    """
    # Validate file type
    if not file.filename or not file.filename.endswith('.apk'):
        raise HTTPException(status_code=400, detail="Only .apk files are allowed")
    
    # Generate unique filename
    file_id = str(uuid.uuid4())[:8]
    safe_name = file.filename.replace(' ', '_').replace('(', '').replace(')', '')
    filename = f"otp-relay-{file_id}-{safe_name}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    # Read and save file
    try:
        content = await file.read()
        
        # Check file size (100MB limit)
        if len(content) > 100 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size exceeds 100MB limit")
        
        with open(filepath, "wb") as f:
            f.write(content)
        
        # Generate download URL - use relative path for consistency
        download_url = f"/uploads/apk/{filename}"
        
        # Also get the file size in MB for display
        size_mb = round(len(content) / (1024 * 1024), 1)
        
        # Auto-extract version from filename (e.g., otp-relay-v1.2.0.apk → 1.2.0)
        version_match = re.search(r'v?(\d+\.\d+\.\d+)', file.filename or '')
        extracted_version = version_match.group(1) if version_match else "1.0.0"
        
        # Deactivate previous versions
        prev_result = await db.execute(select(AppVersion).where(AppVersion.is_active == True))
        for prev in prev_result.scalars().all():
            prev.is_active = False
            db.add(prev)
        
        # Auto-create AppVersion entry
        app_version = AppVersion(
            version=extracted_version,
            latest_version=extracted_version,
            force_update=force_update,
            release_notes=release_notes or f"Update to v{extracted_version}",
            download_url=download_url,
            is_active=True,
        )
        db.add(app_version)
        await db.flush()
        
        return {
            "filename": filename,
            "original_name": file.filename,
            "size": len(content),
            "size_mb": size_mb,
            "download_url": download_url,
            "version": extracted_version,
            "version_id": str(app_version.id),
            "message": f"APK uploaded and version v{extracted_version} published!",
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/uploads/apk/{filename}")
async def get_apk_download_url(filename: str):
    """
    Get direct download URL for an APK file.
    This endpoint is public (no auth required) for app downloads.
    """
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="APK file not found")
    
    from fastapi.responses import FileResponse
    return FileResponse(
        path=filepath,
        filename=filename,
        media_type="application/vnd.android.package-archive",
    )
