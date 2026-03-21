import pytest
from httpx import AsyncClient

from app.models.user import User


@pytest.mark.asyncio
async def test_create_property(client: AsyncClient, admin_token: str):
    response = await client.post(
        "/api/v1/properties/",
        json={
            "name": "Beach House Mornington",
            "address": "123 Beach Rd",
            "suburb": "Mornington",
            "beds": 3,
            "baths": 2.0,
            "property_type": "house",
            "owner_name": "John Smith",
            "owner_email": "john@example.com",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Beach House Mornington"
    assert data["beds"] == 3
    return data["id"]


@pytest.mark.asyncio
async def test_list_properties(client: AsyncClient, admin_token: str):
    # Create a property first
    await client.post(
        "/api/v1/properties/",
        json={"name": "Test Property"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    response = await client.get(
        "/api/v1/properties/",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1


@pytest.mark.asyncio
async def test_create_property_requires_admin(client: AsyncClient, cleaner_token: str):
    response = await client.post(
        "/api/v1/properties/",
        json={"name": "Unauthorized Property"},
        headers={"Authorization": f"Bearer {cleaner_token}"},
    )
    assert response.status_code == 403
