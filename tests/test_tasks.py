import pytest
from httpx import AsyncClient

from app.models.property import Property
from app.models.user import User


@pytest.mark.asyncio
async def test_create_and_list_tasks(client: AsyncClient, admin_token: str, admin_user: User, db_session):
    # Create a property first
    prop = Property(tenant_id=admin_user.tenant_id, name="Task Test Property")
    db_session.add(prop)
    await db_session.commit()
    await db_session.refresh(prop)

    # Create a task
    response = await client.post(
        "/api/v1/tasks/",
        json={
            "property_id": str(prop.id),
            "name": "Standard Clean",
            "scheduled_date": "2026-03-22",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Standard Clean"
    assert data["status"] == "pending"
    assert data["property_name"] == "Task Test Property"

    # List tasks
    response = await client.get(
        "/api/v1/tasks/",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert len(response.json()) >= 1


@pytest.mark.asyncio
async def test_task_with_assignment(
    client: AsyncClient, admin_token: str, admin_user: User, cleaner_user: User, db_session
):
    # Create property
    prop = Property(tenant_id=admin_user.tenant_id, name="Assignment Test Property")
    db_session.add(prop)
    await db_session.commit()
    await db_session.refresh(prop)

    # Create task with assignment
    response = await client.post(
        "/api/v1/tasks/",
        json={
            "property_id": str(prop.id),
            "name": "Deep Clean",
            "scheduled_date": "2026-03-22",
            "assignee_ids": [str(cleaner_user.id)],
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "assigned"
    assert len(data["assignments"]) == 1
    assert data["assignments"][0]["user_name"] == "Test Cleaner"


@pytest.mark.asyncio
async def test_task_status_update(
    client: AsyncClient, cleaner_token: str, admin_token: str, admin_user: User, cleaner_user: User, db_session
):
    # Create property and task
    prop = Property(tenant_id=admin_user.tenant_id, name="Status Test Property")
    db_session.add(prop)
    await db_session.commit()
    await db_session.refresh(prop)

    response = await client.post(
        "/api/v1/tasks/",
        json={
            "property_id": str(prop.id),
            "name": "Turnover Clean",
            "scheduled_date": "2026-03-22",
            "assignee_ids": [str(cleaner_user.id)],
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    task_id = response.json()["id"]

    # Cleaner marks in progress
    response = await client.post(
        f"/api/v1/tasks/{task_id}/status",
        json={"status": "in_progress"},
        headers={"Authorization": f"Bearer {cleaner_token}"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "in_progress"
    assert response.json()["started_at"] is not None

    # Cleaner marks completed
    response = await client.post(
        f"/api/v1/tasks/{task_id}/status",
        json={"status": "completed"},
        headers={"Authorization": f"Bearer {cleaner_token}"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "completed"
    assert response.json()["completed_at"] is not None
