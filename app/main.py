import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select

from app.config import get_settings
from app.database import engine, Base, async_session
from app.models import Tenant, User  # noqa: F401 — ensure models are registered
from app.api import auth, properties, tasks, photos, admin

settings = get_settings()


async def seed_default_tenant():
    """Create default Qbees tenant and admin user if they don't exist."""
    async with async_session() as session:
        result = await session.execute(select(Tenant).where(Tenant.slug == settings.default_tenant_slug))
        tenant = result.scalar_one_or_none()

        if not tenant:
            tenant = Tenant(name=settings.default_tenant_name, slug=settings.default_tenant_slug)
            session.add(tenant)
            await session.flush()

            # Create admin user (Khally)
            admin_user = User(
                tenant_id=tenant.id,
                name="Khally",
                email="khally@qbees.com.au",
                phone="+61400000000",  # Update with real number
                role="admin",
                language="en",
            )
            session.add(admin_user)
            await session.commit()
            print(f"Seeded tenant '{tenant.name}' with admin user")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and seed
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await seed_default_tenant()
    yield
    # Shutdown
    await engine.dispose()


app = FastAPI(
    title="Qbees App",
    description="Cleaning task management for short-term rental properties",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — allow PWA frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(auth.router, prefix="/api/v1")
app.include_router(properties.router, prefix="/api/v1")
app.include_router(tasks.router, prefix="/api/v1")
app.include_router(photos.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok"}


# Serve frontend static files (built React PWA)
FRONTEND_DIR = Path(__file__).parent.parent / "frontend" / "dist"

if FRONTEND_DIR.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIR / "assets"), name="static")

    @app.get("/{path:path}")
    async def serve_frontend(path: str):
        """Serve frontend SPA — all non-API routes return index.html."""
        file_path = FRONTEND_DIR / path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIR / "index.html")
else:
    @app.get("/")
    async def root():
        return {"app": "Qbees", "version": "0.1.0", "status": "running"}
