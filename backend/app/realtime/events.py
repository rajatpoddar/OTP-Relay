"""Real-time WebSocket and SSE event system for OTP push."""
import asyncio
import json
import uuid
from typing import Dict, Set, Optional
from datetime import datetime, timezone

from fastapi import WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState


class ConnectionManager:
    """Manages WebSocket connections for real-time OTP push."""

    def __init__(self):
        # organization_id -> set of (websocket, user_id, role)
        self._connections: Dict[str, Set[tuple]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, organization_id: str, user_id: str, role: str):
        """Accept and register a WebSocket connection."""
        await websocket.accept()
        async with self._lock:
            if organization_id not in self._connections:
                self._connections[organization_id] = set()
            self._connections[organization_id].add((websocket, user_id, role))

    async def disconnect(self, websocket: WebSocket, organization_id: str, user_id: str):
        """Remove a WebSocket connection."""
        async with self._lock:
            if organization_id in self._connections:
                self._connections[organization_id] = {
                    (ws, uid, role) for ws, uid, role in self._connections[organization_id]
                    if ws != websocket
                }

    async def broadcast_to_organization(self, organization_id: str, event: dict, target_role: Optional[str] = None):
        """Broadcast an event to all connections in an organization."""
        async with self._lock:
            if organization_id not in self._connections:
                return

            message = json.dumps(event)
            disconnected = []

            for websocket, user_id, role in self._connections[organization_id]:
                if target_role and role != target_role:
                    continue
                try:
                    if websocket.client_state == WebSocketState.CONNECTED:
                        await websocket.send_text(message)
                except Exception:
                    disconnected.append((websocket, user_id, role))

            # Clean up disconnected
            for ws, uid, role in disconnected:
                self._connections[organization_id].discard((ws, uid, role))

    async def send_to_user(self, organization_id: str, user_id: str, event: dict):
        """Send an event to a specific user."""
        async with self._lock:
            if organization_id not in self._connections:
                return

            message = json.dumps(event)
            for websocket, uid, role in self._connections[organization_id]:
                if uid == user_id:
                    try:
                        if websocket.client_state == WebSocketState.CONNECTED:
                            await websocket.send_text(message)
                    except Exception:
                        pass

    def get_online_count(self, organization_id: str) -> int:
        """Get count of online connections for an organization."""
        return len(self._connections.get(organization_id, set()))

    def get_online_users(self, organization_id: str) -> list:
        """Get list of online user IDs."""
        if organization_id not in self._connections:
            return []
        return [uid for _, uid, _ in self._connections[organization_id]]


# Global connection manager
manager = ConnectionManager()


class SSEManager:
    """Server-Sent Events manager for environments without WebSocket."""

    def __init__(self):
        self._queues: Dict[str, asyncio.Queue] = {}

    def create_queue(self, organization_id: str, user_id: str) -> asyncio.Queue:
        """Create a new SSE queue for a user."""
        key = f"{organization_id}:{user_id}"
        queue = asyncio.Queue()
        self._queues[key] = queue
        return queue

    def remove_queue(self, organization_id: str, user_id: str):
        """Remove an SSE queue."""
        key = f"{organization_id}:{user_id}"
        self._queues.pop(key, None)

    async def push_event(self, organization_id: str, event: dict, target_role: Optional[str] = None):
        """Push an event to all SSE queues in an organization."""
        message = json.dumps(event)
        for key, queue in list(self._queues.items()):
            if key.startswith(f"{organization_id}:"):
                try:
                    queue.put_nowait(message)
                except asyncio.QueueFull:
                    pass


# Global SSE manager
sse_manager = SSEManager()


def create_otp_event(otp_data: dict, event_type: str = "new_otp") -> dict:
    """Create a standardized OTP event for broadcasting."""
    return {
        "type": event_type,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data": otp_data,
    }


def create_status_event(status: str, message: str) -> dict:
    """Create a status event."""
    return {
        "type": "status",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data": {"status": status, "message": message},
    }
