"""Run seed to initialize database."""
import asyncio
from app.services.seed import seed

if __name__ == "__main__":
    asyncio.run(seed())
