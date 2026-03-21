import uuid

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import Base, get_db
from app.main import app
from app.middleware.auth import create_access_token
from app.models.tenant import Tenant
from app.models.user import User

# Use SQLite for tests (no Postgres needed)
TEST_DATABASE_URL = "sqlite+aiosqlite://"  # in-memory

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
test_session_factory = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


@pytest_asyncio.fixture(autouse=True)
async def setup_database():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


async def override_get_db():
    async with test_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture
async def db_session():
    async with test_session_factory() as session:
        yield session


@pytest_asyncio.fixture
async def tenant(db_session: AsyncSession):
    t = Tenant(name="Test Qbees", slug="test-qbees")
    db_session.add(t)
    await db_session.commit()
    await db_session.refresh(t)
    return t


@pytest_asyncio.fixture
async def admin_user(db_session: AsyncSession, tenant: Tenant):
    user = User(
        tenant_id=tenant.id,
        name="Test Admin",
        email="admin@test.com",
        phone="+61400000001",
        role="admin",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def cleaner_user(db_session: AsyncSession, tenant: Tenant):
    user = User(
        tenant_id=tenant.id,
        name="Test Cleaner",
        phone="+61400000002",
        role="cleaner",
        language="en",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
def admin_token(admin_user: User):
    return create_access_token(admin_user.id, admin_user.tenant_id, admin_user.role)


@pytest_asyncio.fixture
def cleaner_token(cleaner_user: User):
    return create_access_token(cleaner_user.id, cleaner_user.tenant_id, cleaner_user.role)


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
