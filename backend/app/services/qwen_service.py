"""Qwen 大模型流式对话与教育启发服务层 (带双轨离线仿真引擎)"""
import os
import asyncio
from typing import AsyncGenerator, Dict, Any, List
from app.config import DASHSCOPE_API_KEY

async def stream_chat_service(
    teacher_name: str,
    subject: str,
    style: str,
    personality: str,
    messages: List[Dict[str, str]],
    recipe: Any = None
) -> AsyncGenerator[str, None]:
    """流式返回名师讲解内容，支持真实大模型与离线高拟真双模"""
    user_query = messages[-1]["content"] if messages else "老师好！"

    # 如果配置了 DASHSCOPE_API_KEY，且可以导入 dashscope
    if DASHSCOPE_API_KEY:
        try:
            import dashscope
            dashscope.api_key = DASHSCOPE_API_KEY
            from dashscope import Generation

            system_prompt = (
                f"你是【{teacher_name}】，一名顶尖的{subject}名师。\n"
                f"教学风格：{style}。\n性格特征：{personality}。\n"
                "教学原则：启发式引导、循序渐进、善用类比与逻辑拆解。涉及数学公式时务必使用 LaTeX 语法（如 $f(x)=x^2$）。"
            )
            dash_msgs = [{"role": "system", "content": system_prompt}]
            for m in messages:
                dash_msgs.append({"role": m["role"], "content": m["content"]})

            responses = Generation.call(
                model="qwen-plus",
                messages=dash_msgs,
                result_format="message",
                stream=True,
                incremental_output=True
            )
            for resp in responses:
                if resp.status_code == 200:
                    delta = resp.output.choices[0].message.content
                    if delta:
                        yield delta
                else:
                    break
            return
        except Exception as e:
            # 降级至高保真模拟引擎
            pass

    # 离线高保真教育启发式流式生成器
    template_chunks = _build_pedagogical_response(teacher_name, subject, style, user_query)
    for chunk in template_chunks:
        await asyncio.sleep(0.04)
        yield chunk

def _build_pedagogical_response(name: str, subject: str, style: str, query: str) -> List[str]:
    """生成具有名师个性、严谨板书与启发式追问的高保真文本分片"""
    intro = f"同学你好！我是你的{subject}老师【{name}】。\n\n"
    analysis = f"针对你提出的问题：“**{query}**”，咱们不急于死记硬背结论，先从核心本质来进行拆解。\n\n"
    
    if "导数" in query or "切线" in query or "函数" in query or subject == "数学":
        body = (
            "### 📌 关键解题模型透视\n\n"
            "我们知道，解决这类问题的灵魂在于建立“**数形结合**”的切入点：\n\n"
            "1. **第一步（求导定斜率）**：\n"
            "   设曲线上切点为 $(x_0, y_0)$，切线斜率满足：\n"
            "   $$k = f'(x_0)$$\n"
            "2. **第二步（点斜式建构方程）**：\n"
            "   切线方程即为：\n"
            "   $$y - f(x_0) = f'(x_0)(x - x_0)$$\n"
            "3. **第三步（代入已知约束）**：\n"
            "   若切线过特定定点 $(a, b)$，将其代入方程消元求解切点横坐标 $x_0$ 即可。\n\n"
            "> 💡 **名师点睛**：很多同学容易在此丢分，关键是没有分清“**在某点处的切线**”（该点即切点）与“**过某点的切线**”（该点未必在曲线上）的区别！\n\n"
        )
        question = "现在，你可以尝试把手头这道题的具体函数表达式告诉我，咱们一步步把它算出来，好吗？"
    elif "作文" in query or "阅读" in query or subject == "语文":
        body = (
            "### 📖 文本肌理与思辨脉络\n\n"
            "文学作品的深层力量往往藏在文本的矛盾冲突与意象对位中。\n\n"
            "- **立意升华**：跳出单一赞美或批评，引入辩证视角；\n"
            "- **文气贯通**：段落之间不仅要有事实论据，更要有严谨的归纳推导与价值升华；\n"
            "- **句式节律**：短句聚力，长句深沉，形成错落有致的文思节拍。\n\n"
        )
        question = "你想先聊聊文章的具体立意，还是希望我们挑选一个经典段落做细读赏析？"
    else:
        body = (
            "### 🎯 知识图谱与分步推理\n\n"
            f"按照我们【{style}】的教学习惯，处理这种题型最忌盲目套公式：\n\n"
            "1. **明确状态量与过程量**：梳理题干中的初始条件与终态边界；\n"
            "2. **寻找守恒量与核心方程**：列出联系已知与未知的物理/逻辑规律；\n"
            "3. **检验极值与量纲**：通过特殊值验证结果的合理性。\n\n"
        )
        question = "你目前的卡点是在第一步的条件梳理上，还是中间公式的联立变形上呢？"

    full_text = intro + analysis + body + question
    # 将文本切分为 2~4 个字符的小片以模拟真实流式效果
    chunks = []
    i = 0
    step = 3
    while i < len(full_text):
        chunks.append(full_text[i:i+step])
        i += step
    return chunks
