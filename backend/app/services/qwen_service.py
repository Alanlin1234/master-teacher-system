"""Qwen 大模型流式对话与教育启发服务层 (直连阿里云 DashScope Qwen-Plus 真实大模型)"""
import os
import json
import logging
import asyncio
from typing import AsyncGenerator, Dict, Any, List
import httpx
from app.config import DASHSCOPE_API_KEY, QWEN_BASE_URL, QWEN_MODEL

_logger = logging.getLogger(__name__)

async def stream_chat_service(
    teacher_name: str,
    subject: str,
    style: str,
    personality: str,
    messages: List[Dict[str, str]],
    recipe: Any = None
) -> AsyncGenerator[str, None]:
    """流式返回名师讲解内容，优先连接真实 DashScope Qwen-Plus 大模型"""
    user_query = messages[-1]["content"] if messages else "老师好！"

    if DASHSCOPE_API_KEY:
        try:
            url = f"{QWEN_BASE_URL.rstrip('/')}/chat/completions"
            headers = {
                "Authorization": f"Bearer {DASHSCOPE_API_KEY}",
                "Content-Type": "application/json"
            }
            system_prompt = (
                f"你是【{teacher_name}】，一名深耕教学数十年的顶尖特级{subject}名师。\n"
                f"【教学风格】：{style}。\n【性格特质】：{personality}。\n"
                "【教学准则】：\n"
                "1. 绝不直接灌输机械答案，坚持启发式拆解与因材施教，由浅入深引导学生领悟题眼本质；\n"
                "2. 语言沉稳儒雅、逻辑严密，富有鼓励性，展现名家大家学者风范；\n"
                "3. 遇到数学公式、物理推演与化学反应，务必使用标准 LaTeX 格式（行内公式用 $...$，独立公式块用 $$...$$）；\n"
                "4. 讲解末尾，给出一个能够检验本题思维掌握程度的启发性互动追问。"
            )
            dash_msgs = [{"role": "system", "content": system_prompt}]
            for m in messages:
                dash_msgs.append({"role": m["role"], "content": m["content"]})

            body = {
                "model": QWEN_MODEL or "qwen-plus",
                "messages": dash_msgs,
                "stream": True,
                "temperature": 0.7
            }

            async with httpx.AsyncClient(timeout=45.0) as client:
                async with client.stream("POST", url, headers=headers, json=body) as resp:
                    if resp.status_code == 200:
                        async for line in resp.aiter_lines():
                            if line.startswith("data: "):
                                chunk_str = line[6:].strip()
                                if chunk_str == "[DONE]":
                                    break
                                try:
                                    chunk_data = json.loads(chunk_str)
                                    delta = chunk_data["choices"][0]["delta"].get("content", "")
                                    if delta:
                                        yield delta
                                except Exception:
                                    pass
                        return
                    else:
                        _logger.warning("Qwen API returned HTTP %s", resp.status_code)
        except Exception as e:
            _logger.error("Call Qwen API error: %s", e)

    # 离线高保真教育启发式流式兜底生成器
    template_chunks = _build_pedagogical_response(teacher_name, subject, style, user_query)
    for chunk in template_chunks:
        await asyncio.sleep(0.03)
        yield chunk

def _build_pedagogical_response(name: str, subject: str, style: str, query: str) -> List[str]:
    """生成具有名师个性、严谨板书与启发式追问的高保真文本分片"""
    intro = f"同学你好！我是你的{subject}老师【{name}】。\n\n"
    analysis = f"针对你提出的问题：“**{query}**”，咱们不急于套用死板公式，先从核心本质来进行拆解。\n\n"
    
    if "导数" in query or "切线" in query or "函数" in query or subject == "数学":
        body = (
            "### 关键解题模型透视\n\n"
            "我们知道，解决这类微积分与函数综合大题，核心灵魂在于建立“**数形结合**”的切入点：\n\n"
            "1. **求导定斜率**：\n"
            "   设曲线上切点为 $(x_0, y_0)$，切线斜率满足导数极限定律：\n"
            "   $$k = f'(x_0) = \\lim_{\\Delta x \\to 0} \\frac{f(x_0+\\Delta x)-f(x_0)}{\\Delta x}$$\n"
            "2. **点斜式建构方程**：\n"
            "   切线方程即为：\n"
            "   $$y - f(x_0) = f'(x_0)(x - x_0)$$\n"
            "3. **代入已知约束与消元**：\n"
            "   若切线过特定定点 $(a, b)$，将其代入方程消元求解切点横坐标 $x_0$ 即可。\n\n"
            "> 💡 **名师点睛**：考场中最致命的陷阱就是混淆“在点 $P$ 处的切线”（$P$ 必为切点）与“过点 $P$ 的切线”（$P$ 未必在曲线上）！\n\n"
        )
        question = "现在，你可以尝试把手头这道题的具体函数解析式发给我，咱们一步步把它推导出来！"
    else:
        body = (
            "### 知识图谱与分步推理\n\n"
            f"按照我们【{style}】的解题习惯，切忌盲目下笔，理清以下三层脉络：\n\n"
            "1. **锁定核心定理与约束方程**：根据题干边界条件快速锁定知识节点；\n"
            "2. **分步严谨推演**：逐步建立逻辑等式并化简；\n"
            "3. **量纲与极值回代检验**：确保推导严密无漏洞。\n\n"
        )
        question = "你目前的卡点是在第一步的条件转化上，还是中间公式的变形运算上呢？"

    full_text = intro + analysis + body + question
    chunks = []
    i = 0
    while i < len(full_text):
        step = 3
        chunks.append(full_text[i:i+step])
        i += step
    return chunks
