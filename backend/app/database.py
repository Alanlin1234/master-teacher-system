"""SQLAlchemy 2.0 Async 数据库模型定义与会话工厂"""
from datetime import datetime
from typing import Optional, Dict, Any, List
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, Text, Boolean, DateTime, JSON, Integer, Float

from app.config import DATABASE_URL

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    role: Mapped[str] = mapped_column(String(20), default="user")  # admin | user
    portal_role: Mapped[str] = mapped_column(String(20), default="student")  # student | teacher | auditor
    password_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Teacher(Base):
    __tablename__ = "teachers"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    subject: Mapped[str] = mapped_column(String(50), default="数学")
    avatar: Mapped[str] = mapped_column(String(200), default="👩‍🏫")
    photo_url: Mapped[str] = mapped_column(String(255), default="")
    description: Mapped[str] = mapped_column(Text, default="")
    style: Mapped[str] = mapped_column(String(200), default="")
    personality: Mapped[str] = mapped_column(String(200), default="")
    strengths: Mapped[List[str]] = mapped_column(JSON, default=list)
    weaknesses: Mapped[List[str]] = mapped_column(JSON, default=list)
    materials: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True)
    is_digital: Mapped[bool] = mapped_column(Boolean, default=True)
    agent_prompt: Mapped[str] = mapped_column(Text, default="")
    dh_model_name: Mapped[str] = mapped_column(String(100), default="default_avatar")
    dh_voice_trained: Mapped[bool] = mapped_column(Boolean, default=True)
    dh_model_video_url: Mapped[str] = mapped_column(String(255), default="/demo_videos/model.mp4")
    dim_scores: Mapped[Dict[str, float]] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class SynthesizedTeacher(Base):
    __tablename__ = "synthesized_teachers"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    source_teachers: Mapped[List[str]] = mapped_column(JSON, default=list)
    recipe: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    mode: Mapped[str] = mapped_column(String(30), default="user")  # user | auto | whole
    agent_prompt: Mapped[str] = mapped_column(Text, default="")
    critic_log: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class StudioJob(Base):
    __tablename__ = "studio_jobs"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    topic: Mapped[str] = mapped_column(String(200), default="")
    teacher_id: Mapped[str] = mapped_column(String(50), default="")
    model_name: Mapped[str] = mapped_column(String(100), default="")
    segments: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)
    status: Mapped[str] = mapped_column(String(20), default="draft")  # draft | processing | done | error
    merged_video_url: Mapped[str] = mapped_column(String(255), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class TeachingStrategy(Base):
    __tablename__ = "teaching_strategies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    slug: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    tags: Mapped[List[str]] = mapped_column(JSON, default=list)
    steps: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)
    merge_hints: Mapped[List[str]] = mapped_column(JSON, default=list)

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
