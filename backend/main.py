"""循智导学 · AI名师与数字人沉浸式教学系统 — FastAPI 独立后端主入口"""
import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import BASE_DIR, DATA_DIR, UPLOAD_DIR, CORS_ORIGINS
from app.database import init_db, AsyncSessionLocal
from app.services.db_service import UserService, TeacherService
from app.routes import auth, teachers, teacher_compose, teacher_studio

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 数据库初始化与预置种子
    await init_db()
    async with AsyncSessionLocal() as session:
        await UserService.ensure_default_users(session)
        await TeacherService.seed_teachers(session)
    print(">>> 独立名师与数字人系统数据库及种子数据初始化完成！")
    yield

app = FastAPI(
    title="循智导学 · AI名师与数字人教学系统",
    description="支持名师五维解构、多维基因重组、全拟真数字人1对1伴学与微课工坊的独立微服务",
    version="2.0.0",
    lifespan=lifespan
)

# 允许跨域
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

frontend_public = BASE_DIR.parent / "frontend" / "public"
frontend_dist = BASE_DIR.parent / "frontend" / "dist"

# 静态资源挂载：名师肖像与数字人演示视频 (支持 public 或 dist 目录)
photos_dir = (frontend_public / "photos") if (frontend_public / "photos").exists() else (frontend_dist / "photos")
if photos_dir.exists():
    app.mount("/photos", StaticFiles(directory=str(photos_dir)), name="photos")

videos_dir = (frontend_public / "demo_videos") if (frontend_public / "demo_videos").exists() else (frontend_dist / "demo_videos")
if videos_dir.exists():
    app.mount("/demo_videos", StaticFiles(directory=str(videos_dir)), name="demo_videos")

# 挂载业务路由
app.include_router(auth.router)
app.include_router(teachers.router)
app.include_router(teacher_compose.router)
app.include_router(teacher_studio.router)

from fastapi.responses import FileResponse

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "master_teacher_backend",
        "version": "2.0.0"
    }

if frontend_dist.exists():
    if (frontend_dist / "assets").exists():
        app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        target = frontend_dist / full_path
        if target.is_file():
            return FileResponse(target)
        return FileResponse(frontend_dist / "index.html")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8001"))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=False)

