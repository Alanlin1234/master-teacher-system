FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 安装系统依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 创建 Hugging Face Spaces 要求的非 root 用户 (UID 1000)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR $HOME/app

# 安装 Python 依赖
COPY --chown=user:user backend/requirements.txt $HOME/app/backend/requirements.txt
RUN pip install --no-cache-dir --user -r $HOME/app/backend/requirements.txt

# 拷贝后端代码与静态数据目录
COPY --chown=user:user backend $HOME/app/backend

# 拷贝已编译好的前端产物（含 HTML/CSS/JS、高清名师肖像与数字人演示视频）
COPY --chown=user:user frontend/dist $HOME/app/frontend/dist

# Hugging Face Spaces 默认应用端口
ENV PORT=7860
EXPOSE 7860

WORKDIR $HOME/app/backend

# 启动 FastAPI 服务
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
