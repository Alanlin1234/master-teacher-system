---
title: Master Teacher & Avatar System
emoji: 🎓
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# 循智导学 · AI名师与数字人沉浸式教学系统 (Master Teacher & Avatar System)

> **全新独立重构版本**：从原学习助手工程中独立抽取「名师系统」与「数字人系统」，融合 **`taste`**、**`impeccable`** 与 **`gsap`** 顶尖前端设计规范重新设计界面布局、信息层级与交互质感。原工程代码 100% 完整保留。

---

## 🌟 核心特性与亮点

1. **沉浸式品牌首页 (Landing & Hub)**：
   - 非对称黄金分割布局，告别平庸 AI 模板感；
   - 首页悬浮可交互名师数字人，支持一键试听自然语音问候；
   - 交互式五维能力雷达与全流程业务矩阵直达。
2. **现代双栏登录与注册体系 (Auth)**：
   - 升级自《名师登录注册》原型，左侧学术蓝深邃微光展板 + 右侧极简表单；
   - 支持学生/名师/管理员一键免密体验账号，秒级进入系统。
3. **名师智库与全景能力画像 (Library)**：
   - 汇聚 17+ 各学科特级名师，支持学科与教学风格快速筛选；
   - 纯 SVG 高性能五维能力雷达图（上课风格、人格特征、核心优点、教学方法、沟通方式）；
   - 侧边抽屉式展开名师生平、讲义资料库与教研成果。
4. **名师1对1互动与多模态数字人伴学 (Chat & Avatar)**：
   - **双模数字人**：一键无缝切换 **SVG Viseme 骨骼表情动画**（支持眼神眨眼、口型随语音实时开合、三类情绪姿态）与 **DUIX 4K 拟真视频数字人**；
   - 深度支持 LaTeX 数学公式实时排版、代码高亮与启发式提问胶囊；
   - 支持麦克风实时双向语音问答与一键导出微课大纲。
5. **AI名师多维基因合成工坊 (Compose Studio)**：
   - 五大维度自由重组拼接（例如：王老师的启发思维 + 李老师的情境文学 + 高老师的幽默秒杀）；
   - 内置 AI 一致性审查引擎（Critic Engine），自动计算五维相容指数并生成专属配方卡入库。
6. **数字人微课视频工坊 (Video Studio)**：
   - 四步式闭环制作管线（选名师 -> 配模型 -> AI拆解微课大纲 -> 分段视频渲染与成品合并下载）。

---

## 🚀 极速启动指南

### 方式一：一键全量启动 (推荐)
直接双击运行根目录下的：
```bash
start_all.bat
```
脚本将自动在后台启动 FastAPI 后端（端口 `8001`）和 Vite 前端（端口 `5174`），并在浏览器中打开。

### 方式二：手动分步启动

#### 1. 启动独立后端 (FastAPI)
```bash
cd master_teacher_system/backend
python -m uvicorn main:app --host 127.0.0.1 --port 8001 --reload
```
后端将在首次启动时自动初始化独立的 SQLite 数据库（`data/teachers.db`）并预置 17 位特级名师档案、代表性讲义和测试账号。

#### 2. 启动现代前端 (Vite)
```bash
cd master_teacher_system/frontend
node_modules\.bin\vite.cmd --port 5174
```
在浏览器中打开：`http://localhost:5174` 即可体验！

---

## 🎨 设计技能集成 (Skills)
- `.agents/skills/impeccable/SKILL.md`：Impeccable 设计系统与反模板化规则。
- `.agents/skills/taste/SKILL.md`：Taste 前端品味与不对称平衡规范。
