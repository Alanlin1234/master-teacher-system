"""名师库、名师画像与流式对话路由"""
import json
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db, Teacher, SynthesizedTeacher
from app.services.db_service import TeacherService, SynthTeacherService
from app.services.qwen_service import stream_chat_service

router = APIRouter(prefix="/api/teachers", tags=["teachers"])

class ChatMessage(BaseModel):
    role: str
    content: str

class TeacherChatRequest(BaseModel):
    teacher_id: str
    messages: List[ChatMessage]
    synth_recipe: Optional[Dict[str, Any]] = None

@router.get("/list")
async def list_teachers(db: AsyncSession = Depends(get_db)):
    teachers = await TeacherService.list_all(db)
    return {
        "ok": True,
        "teachers": [
            {
                "id": t.id,
                "name": t.name,
                "subject": t.subject,
                "avatar": t.avatar,
                "photoUrl": t.photo_url,
                "description": t.description,
                "style": t.style,
                "personality": t.personality,
                "strengths": t.strengths,
                "weaknesses": t.weaknesses,
                "materials": t.materials,
                "isPublished": t.is_published,
                "isDigital": t.is_digital,
                "dhModelName": t.dh_model_name,
                "dhVoiceTrained": t.dh_voice_trained,
                "dhModelVideoUrl": t.dh_model_video_url,
                "dimScores": t.dim_scores
            }
            for t in teachers
        ]
    }

@router.get("/synthesized")
async def list_synthesized_teachers(db: AsyncSession = Depends(get_db)):
    synths = await SynthTeacherService.list_all(db)
    return {
        "ok": True,
        "teachers": [
            {
                "id": s.id,
                "name": s.name,
                "sourceTeachers": s.source_teachers,
                "recipe": s.recipe,
                "mode": s.mode,
                "agentPrompt": s.agent_prompt,
                "criticLog": s.critic_log,
                "createdAt": s.created_at.strftime("%Y-%m-%d %H:%M") if s.created_at else ""
            }
            for s in synths
        ]
    }

@router.get("/{teacher_id}")
async def get_teacher_detail(teacher_id: str, db: AsyncSession = Depends(get_db)):
    t = await TeacherService.get_by_id(db, teacher_id)
    if not t:
        raise HTTPException(status_code=404, detail="未找到该名师档案")
    return {
        "ok": True,
        "teacher": {
            "id": t.id,
            "name": t.name,
            "subject": t.subject,
            "avatar": t.avatar,
            "photoUrl": t.photo_url,
            "description": t.description,
            "style": t.style,
            "personality": t.personality,
            "strengths": t.strengths,
            "weaknesses": t.weaknesses,
            "materials": t.materials,
            "isPublished": t.is_published,
            "isDigital": t.is_digital,
            "dhModelName": t.dh_model_name,
            "dhVoiceTrained": t.dh_voice_trained,
            "dhModelVideoUrl": t.dh_model_video_url,
            "dimScores": t.dim_scores
        }
    }

@router.post("/chat")
async def chat_with_teacher(req: TeacherChatRequest, db: AsyncSession = Depends(get_db)):
    teacher = await TeacherService.get_by_id(db, req.teacher_id)
    t_name = teacher.name if teacher else "名师导师"
    subject = teacher.subject if teacher else "综合学科"
    style = teacher.style if teacher else "启发式教学"
    personality = teacher.personality if teacher else "和蔼严谨"

    # 如果有合成名师配方，从配方中提取
    if req.synth_recipe and "name" in req.synth_recipe:
        t_name = req.synth_recipe.get("name", t_name)

    async def event_generator():
        try:
            msgs = [{"role": m.role, "content": m.content} for m in req.messages]
            async for chunk in stream_chat_service(t_name, subject, style, personality, msgs, req.synth_recipe):
                data = json.dumps({"delta": chunk}, ensure_ascii=False)
                yield f"data: {data}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            err_data = json.dumps({"error": str(e)}, ensure_ascii=False)
            yield f"data: {err_data}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
