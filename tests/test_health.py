import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_root_serves_frontend_or_api(client: AsyncClient):
    """Root serves either frontend HTML or API JSON depending on build state."""
    response = await client.get("/")
    assert response.status_code == 200
