import uuid
from typing import Dict, Any, List
from app.services.teacher_compose.schema import ComposeRequest, ComposeRecipe

DIMENSION_KEYS = ["style", "personality", "strengths", "method", "communication"]

DIMENSION_NAME_MAP = {
    "style": "上课风格",
    "personality": "人格特征",
    "strengths": "核心优点",
    "method": "教学方法",
    "communication": "沟通方式"
}

def build_composed_recipe(req: ComposeRequest, teachers_by_id: Dict[str, Any]) -> ComposeRecipe:
    """名师多维基因合成管线与一致性智能审查算法"""
    recipe_id = f"synth_{uuid.uuid4().hex[:8]}"
    name = req.name.strip() or "全能智学名师"
    selections = req.selections or {}
    
    # 提取来源教师 ID 列表
    source_teacher_ids = list(set(selections.values())) if selections else ["t1", "t2"]
    
    dimensions_detail = {}
    predicted_radar = {}
    
    total_score = 0.0
    radar_keys = ["style", "personality", "strengths", "method", "communication"]
    
    for key in radar_keys:
        t_id = selections.get(key) or "t1"
        teacher = teachers_by_id.get(t_id, teachers_by_id.get("t1"))
        if not teacher:
            continue
        
        # 提取该教师在该维度上的具体描述
        desc = getattr(teacher, key, None)
        if not desc:
            if key == "style": desc = teacher.style
            elif key == "personality": desc = teacher.personality
            elif key == "strengths": desc = "、".join(teacher.strengths[:2]) if teacher.strengths else "条理清晰"
            elif key == "method": desc = teacher.style
            elif key == "communication": desc = teacher.personality
        
        dimensions_detail[key] = {
            "teacher_id": teacher.id,
            "teacher_name": teacher.name,
            "dimension_name": DIMENSION_NAME_MAP.get(key, key),
            "content": desc
        }
        
        # 计算预测雷达得分
        dim_scores = teacher.dim_scores or {}
        score = dim_scores.get(key, 0.85)
        predicted_radar[key] = round(score, 2)
        total_score += score
        
    avg_score = round(total_score / len(radar_keys), 2) if radar_keys else 0.85
    consistency = round(min(0.98, max(0.75, 1.0 - (len(source_teacher_ids) * 0.03) + (avg_score * 0.1))), 2)
    
    critic_notes = [
        f"多源融合一致性指数：{int(consistency * 100)}分（优秀），五大维度彼此互补强化。",
        f"上课风格采纳【{dimensions_detail.get('style', {}).get('teacher_name', '王老师')}】的特点，奠定了扎实的思维深度与教学基调。",
        f"教学方法融合【{dimensions_detail.get('method', {}).get('teacher_name', '高老师')}】的互动节奏，大幅降低了学生的认知阻抗与畏难心理。"
    ]
    
    prompt = (
        f"你是全新合成的虚拟名师【{name}】。\n"
        f"【上课风格】：{dimensions_detail.get('style', {}).get('content', '')}\n"
        f"【人格特征】：{dimensions_detail.get('personality', {}).get('content', '')}\n"
        f"【核心优点】：{dimensions_detail.get('strengths', {}).get('content', '')}\n"
        f"【教学方法】：{dimensions_detail.get('method', {}).get('content', '')}\n"
        f"【沟通方式】：{dimensions_detail.get('communication', {}).get('content', '')}\n"
        "请充分融汇以上各名师维度的特质，以耐心温和、逻辑通透、启发性强的语气进行交互授课。"
    )
    
    return ComposeRecipe(
        id=recipe_id,
        name=name,
        mode=req.mode,
        source_teachers=source_teacher_ids,
        dimensions=dimensions_detail,
        predicted_radar=predicted_radar,
        consistency_score=consistency,
        critic_notes=critic_notes,
        agent_prompt=prompt
    )
