from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional

class ComposeRequest(BaseModel):
    name: str = Field(..., description="合成名师名称")
    mode: str = Field("user", description="user | auto | whole")
    selections: Dict[str, str] = Field(
        default_factory=dict,
        description="五维挑选: {'style': 't1', 'personality': 't2', 'strengths': 't1', 'teachingApproach': 't3', 'communicationStyle': 't2'}"
    )
    learner_id: Optional[int] = None

class ComposeRecipe(BaseModel):
    id: str
    name: str
    mode: str
    source_teachers: List[str]
    dimensions: Dict[str, Any]
    predicted_radar: Dict[str, float]
    consistency_score: float
    critic_notes: List[str]
    agent_prompt: str
