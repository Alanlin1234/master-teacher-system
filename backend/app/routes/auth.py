"""认证与用户管理路由"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db, User
from app.services.db_service import UserService

router = APIRouter(prefix="/api/auth", tags=["auth"])

class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    password: str
    role: str = "user"
    portal_role: str = "student"
    email: Optional[str] = ""

@router.post("/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    u = await UserService.get_by_username(db, req.username.strip())
    if not u:
        # 如果是内置演示账号，支持即时免密或默认密码自动兼容
        if req.username in ["demo_student", "demo_teacher", "admin"]:
            portal = "teacher" if "teacher" in req.username or req.username == "admin" else "student"
            role = "admin" if req.username == "admin" else "user"
            u = await UserService.create(db, req.username, req.password, role=role, portal_role=portal)
        else:
            raise HTTPException(status_code=400, detail="用户名或密码错误，若无账号请先注册")
    
    if u.password_hash and u.password_hash != req.password:
        raise HTTPException(status_code=400, detail="密码不正确")

    return {
        "ok": True,
        "id": u.id,
        "username": u.username,
        "role": u.role,
        "portalRole": u.portal_role,
        "token": f"token_{u.id}_{u.username}"
    }

@router.post("/register")
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await UserService.get_by_username(db, req.username.strip())
    if existing:
        raise HTTPException(status_code=400, detail="该用户名已存在，请直接登录或更换名称")
    
    user = await UserService.create(
        db=db,
        username=req.username.strip(),
        password_hash=req.password,
        role=req.role,
        portal_role=req.portal_role,
        email=req.email or ""
    )
    return {
        "ok": True,
        "id": user.id,
        "username": user.username,
        "role": user.role,
        "portalRole": user.portal_role,
        "token": f"token_{user.id}_{user.username}"
    }

@router.get("/demo-accounts")
async def get_demo_accounts():
    """提供一键体验账号列表"""
    return [
        {"username": "demo_student", "label": "学生体验账号", "portalRole": "student", "role": "user", "password": "123"},
        {"username": "demo_teacher", "label": "名师教研账号", "portalRole": "teacher", "role": "user", "password": "123"},
        {"username": "admin", "label": "系统管理账号", "portalRole": "teacher", "role": "admin", "password": "admin"}
    ]
