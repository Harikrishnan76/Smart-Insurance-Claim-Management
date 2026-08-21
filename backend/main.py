import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import init_db
from routers.auth_router import router as auth_router
from routers.claims_router import router as claims_router
from routers.users_router import router as users_router

# ─── App Init ─────────────────────────────────────────────────────────────────

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "ClaimSphere Smart Insurance Claim Management API — "
        "Powered by FastAPI + SQLite with Guidewire ClaimCenter integration simulation."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS ─────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Database Init ────────────────────────────────────────────────────────────

@app.on_event("startup")
def startup():
    init_db()
    print(f"\n🚀 {settings.APP_NAME} v{settings.APP_VERSION} started")
    print(f"📚 API docs: http://localhost:8000/docs")
    print(f"💾 Database: {settings.DATABASE_URL}")

# ─── Routers ──────────────────────────────────────────────────────────────────

app.include_router(auth_router)
app.include_router(claims_router)
app.include_router(users_router)

# ─── Health Check ─────────────────────────────────────────────────────────────

@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}


@app.get("/", tags=["Health"])
def root():
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "endpoints": {
            "auth": "/api/auth",
            "claims": "/api/claims",
            "users": "/api/users",
        }
    }


# ─── Entry Point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
