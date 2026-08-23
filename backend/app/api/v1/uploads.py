import os
import uuid
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from app.core.dependencies import require_super_admin

router = APIRouter(prefix="/api", tags=["Uploads"])

# Upload directory
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "apk")

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload/apk")
async def upload_apk(
    file: UploadFile = File(...),
    current_user=Depends(require_super_admin),
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
        
        # Generate download URL
        download_url = f"/uploads/apk/{filename}"
        
        return {
            "filename": filename,
            "original_name": file.filename,
            "size": len(content),
            "download_url": download_url,
            "message": "APK uploaded successfully",
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
