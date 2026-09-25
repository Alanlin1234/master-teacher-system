"""名师多维基因合成工坊路由"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, List
from app.database import get_db
from app.services.db_service import TeacherService, SynthTeacherService
from app.services.teacher_compose.schema import ComposeRequest, ComposeRecipe
from app.services.teacher_compose.pipeline import build_composed_recipe, DIMENSION_NAME_MAP

router = APIRouter(prefix="/api/teacher-compose", tags=["teacher_compose"])

@router.get("/catalog")
async def get_composition_catalog(db: AsyncSession = Depends(get_db)):
    """返回所有可选名师及其五维解构基因卡，供合成工坊选择"""
    teachers = await TeacherService.list_all(db)
    catalog = []
    for t in teachers:
        catalog.append({
            "id": t.id,
            "name": t.name,
            "subject": t.subject,
            "avatar": t.avatar,
            "photoUrl": t.photo_url,
            "dimensions": {
                "style": {"label": "上课风格", "value": t.style},
                "personality": {"label": "人格特征", "value": t.personality},
                "strengths": {"label": "核心优点", "value": "、".join(t.strengths[:2]) if t.strengths else "逻辑严密"},
                "method": {"label": "教学方法", "value": f"{t.style}引导"},
                "communication": {"label": "沟通方式", "value": f"{t.personality}沟通"}
            },
            "dimScores": t.dim_scores
        })
    return {"ok": True, "catalog": catalog, "dimensionNames": DIMENSION_NAME_MAP}

@router.post("/synthesize")
async def synthesize_teacher(req: ComposeRequest, db: AsyncSession = Depends(get_db)):
    """执行多维基因重组合成算法，生成专属名师并持久化入库"""
    teachers = await TeacherService.list_all(db)
    t_map = {t.id: t for t in teachers}
    
    # 算法管线生成配方
    recipe: ComposeRecipe = build_composed_recipe(req, t_map)
    
    # 保存入库
    saved = await SynthTeacherService.create(
        db=db,
        id=recipe.id,
        name=recipe.name,
        source_teachers=recipe.source_teachers,
        recipe=recipe.dict(),
        mode=recipe.mode,
        agent_prompt=recipe.agent_prompt,
        critic_log=[{"text": n} for n in recipe.critic_notes]
    )
    
    return {
        "ok": True,
        "recipe": recipe.dict()
    }
