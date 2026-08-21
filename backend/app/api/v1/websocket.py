"""WebSocket and SSE endpoints for real-time OTP updates."""
import asyncio
import json
from datetime import datetime, timezone
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import select

from app.core.security import decode_token
from app.core.database import get_db
from app.realtime.events import manager, sse_manager, create_otp_event, create_status_event
from app.models.user import User

router = APIRouter(tags=["Real-time"])


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
    organization_id: str = Query(...),
):
    """
    WebSocket endpoint for real-time OTP updates.
    Client connects with: ws://localhost:8000/ws?token=<jwt>&organization_id=<org_id>
    """
    # Authenticate
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        role = payload.get("role", "OPERATOR")
    except Exception:
        await websocket.close(code=4001, reason="Invalid token")
        return

    # Connect
    await manager.connect(websocket, organization_id, user_id, role)

    try:
        # Send connection confirmation
        await websocket.send_json(create_status_event("connected", "WebSocket connected"))

        # Keep connection alive and listen for client messages
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                # Handle ping/pong
                if msg.get("type") == "ping":
                    await websocket.send_json(create_status_event("pong", "pong"))
                # Handle client ack
                elif msg.get("type") == "ack":
                    otp_id = msg.get("otp_id")
                    if otp_id:
                        # Mark as viewed
                        pass
            except json.JSONDecodeError:
                pass

    except WebSocketDisconnect:
        await manager.disconnect(websocket, organization_id, user_id)
    except Exception:
        await manager.disconnect(websocket, organization_id, user_id)


@router.get("/sse")
async def sse_endpoint(
    organization_id: str = Query(...),
    token: str = Query(...),
):
    """
    Server-Sent Events endpoint for real-time OTP updates.
    Fallback for environments without WebSocket support.
    """
    # Authenticate
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        role = payload.get("role", "OPERATOR")
    except Exception:
        return {"error": "Invalid token"}

    queue = sse_manager.create_queue(organization_id, user_id)

    async def event_generator():
        try:
            # Send initial connection event
            yield f"data: {json.dumps(create_status_event('connected', 'SSE connected'))}\n\n"

            while True:
                try:
                    message = await asyncio.wait_for(queue.get(), timeout=30)
                    yield f"data: {message}\n\n"
                except asyncio.TimeoutError:
                    # Send keepalive
                    yield f": keepalive {datetime.now(timezone.utc).isoformat()}\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            sse_manager.remove_queue(organization_id, user_id)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


async def broadcast_new_otp(organization_id: str, otp_data: dict):
    """Broadcast a new OTP event to all connected clients."""
    event = create_otp_event(otp_data, "new_otp")
    await manager.broadcast_to_organization(organization_id, event, target_role="OPERATOR")
    await sse_manager.push_event(organization_id, event, target_role="OPERATOR")


async def broadcast_otp_update(organization_id: str, otp_data: dict):
    """Broadcast an OTP update (used, expired, etc)."""
    event = create_otp_event(otp_data, "otp_update")
    await manager.broadcast_to_organization(organization_id, event)
    await sse_manager.push_event(organization_id, event)
