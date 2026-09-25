@echo off
chcp 65001 >nul
title 循智导学 · 名师与数字人系统 - 后端服务
echo ========================================================
echo   循智导学 · 名师与数字人系统 [FastAPI 独立后端]
echo   端口: 8001
echo ========================================================
cd /d "%~dp0backend"
python -m uvicorn main:app --host 127.0.0.1 --port 8001 --reload
pause
