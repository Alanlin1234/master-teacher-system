@echo off
chcp 65001 >nul
title 循智导学 · 名师与数字人系统 - 前端服务
echo ========================================================
echo   循智导学 · 名师与数字人系统 [Vite 前端]
echo   地址: http://localhost:5174
echo ========================================================
cd /d "%~dp0frontend"
call node_modules\.bin\vite.cmd --port 5174
pause
