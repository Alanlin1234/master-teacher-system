# 《循智导学 · AI名师与数字人系统》免费云端托管与公网部署指南

本文档为您提供了将本系统快速免费托管至公网的 **三种最主流、最稳定的免付费方案**，让任何人在手机或电脑上都能直接打开访问。

---

## 方案选型速查表

| 方案 | 费用 | 是否需信用卡 | 国内访问速度 | 部署复杂度 | 适用场景 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **方案 1：Hugging Face Spaces**（首选推荐 ⭐⭐⭐⭐⭐） | **永久免费** | **否** | **优** (直连流畅) | 简单 (网页拖拽或Git) | 比赛路演、学术展示、永久作品集 |
| **方案 2：Render.com 云服务**（主流推荐 ⭐⭐⭐⭐） | **每月750h免费** | **否** | **良** | 简单 (关联GitHub自动部署) | 长期个人项目、团队敏捷开发 |
| **方案 3：cpolar / ngrok 极速穿透**（即时演示 ⭐⭐⭐⭐⭐） | **免费版** | **否** | **极快** (本地直连) | 极简 (1条命令秒级上线) | 答辩前突击展示、给老师/同学即时测试 |

---

## 方案 1：Hugging Face Spaces 部署步骤（最推荐 · 永久免费）

Hugging Face Spaces 免费为全球开发者提供 **2核 CPU、16GB 内存、50GB 存储** 的 Docker 容器，且国内访问顺畅，是 AI 全栈项目最理想的免费托管家园。

### 第 1 步：注册并创建 Space
1. 访问并注册 [Hugging Face 官网](https://huggingface.co/)（无需魔法，国内可直接注册）；
2. 登录后，点击右上角个人头像，选择 **"New Space"**；
3. 填写配置：
   - **Space name**：例如 `master-teacher-system`
   - **License**：选择 `mit`
   - **Space SDK**：选择 **`Docker`** -> **`Blank`**（非常重要，选 Docker）
   - **Space hardware**：保持默认的 **`Free - 2 vCPU · 16 GB`**
   - **Visibility**：选择 **`Public`**
4. 点击底部 **"Create Space"**。

### 第 2 步：上传项目代码
创建成功后，您可以通过以下任意一种方式上传：

#### 方式 A：网页端直接上传（适合新手）
1. 在刚创建好的 Space 页面，点击顶部导航栏的 **"Files"** 标签；
2. 点击右上角 **"Add file" -> "Upload files"**；
3. 将本地 `master_teacher_system` 目录下的核心文件直接拖拽上传：
   - `Dockerfile`（我们已为您生成好）
   - `backend/` 整个文件夹
   - `frontend/dist/` 整个文件夹（已包含编译好的 React 界面及高清肖像/演示视频）
4. 在页面底部点击 **"Commit changes to main"**。

#### 方式 B：通过 Git 命令行推送（适合开发者）
在本地终端执行（将 `<your-hf-username>` 替换为您自己的用户名）：
```bash
cd d:\Desktop\edu_agent2.5\master_teacher_system
git init
git remote add space https://huggingface.co/spaces/<your-hf-username>/master-teacher-system
git add Dockerfile backend frontend/dist
git commit -m "feat: deploy master teacher system"
git push space master --force
```

### 第 3 步：构建与公网访问
- 提交后，Space 页面会自动开始构建 Docker 镜像（状态会从 `Building` -> `Running`，耗时约 2 分钟）；
- 变为绿色 `Running` 后，您就拥有了专属公网地址：
  - **展示地址**：`https://huggingface.co/spaces/<your-username>/master-teacher-system`
  - **独立全屏地址**：`https://<your-username>-master-teacher-system.hf.space`
- 任何人点击即可无缝浏览名师展台、体验数字人 1对1 对话和基因合成！

---

## 方案 2：Render.com 托管步骤（GitHub 联动）

Render 是知名的现代化 PaaS 平台，支持 Docker 镜像且原生打通 GitHub。

### 第 1 步：将代码推送到 GitHub
1. 打开 [GitHub](https://github.com/) 并新建一个公开仓库，如 `master-teacher-system`；
2. 将 `master_teacher_system` 目录内容 push 到该仓库。

### 第 2 步：在 Render 创建 Web Service
1. 访问 [Render 官网](https://render.com/)，使用 GitHub 账号一键授权登录；
2. 点击右上角 **"New +" -> "Web Service"**；
3. 选择您刚才创建的 GitHub 仓库，点击 **"Connect"**；
4. 配置项：
   - **Name**：`master-teacher-system`
   - **Language**：选择 **`Docker`**
   - **Branch**：`main` 或 `master`
   - **Instance Type**：选择 **`Free`**
5. 点击最下方的 **"Create Web Service"**；
6. 等待约 3~5 分钟，构建成功后顶部会生成专属免费二级域名，例如：
   `https://master-teacher-system.onrender.com`

> **提示**：Render 免费版在 15 分钟无访客时会进入休眠状态，首次访问唤醒约需 30 秒，属于正常特性。

---

## 方案 3：cpolar / ngrok 极速公网穿透（0秒部署 · 适合即时演示）

如果您希望**现在立刻**把网站链接发给导师、投资人或评委体验，而不想注册云平台或上传代码，可以使用内网穿透技术，把本地正在运行的 `http://127.0.0.1:8001` 一秒映射为全球可访问的 HTTPS 网址。

### 使用 cpolar（国内服务器，速度极快）：
1. 访问 [cpolar 官网](https://www.cpolar.com/) 免费下载 Windows 客户端并解压；
2. 确保本系统的本地后端正在运行（通过 `start_all.bat` 或已在 8001 端口常驻）；
3. 在 PowerShell 中运行：
   ```powershell
   cpolar http 8001
   ```
4. 终端界面会直接显示一个公网 HTTPS 链接：
   ```
   Forwarding https://xxxxxx.cpolar.top -> http://127.0.0.1:8001
   ```
5. 将这个 `https://xxxxxx.cpolar.top` 复制发给任何人，他们就能在任何网络环境下直接访问您的名师系统！

---

## 环境变量配置说明（可选）

如果需要启用真实通义千问千问大模型的联网对话能力，您可以在云平台的 Environment 环境变量设置中添加：
- `DASHSCOPE_API_KEY`: 您的阿里 DashScope API Key

*(如果不配置，系统会自动无缝切换至高拟真学术仿真离线教学引擎，依然可以完整体验名师问答、雷达图谱与微课生成)*
