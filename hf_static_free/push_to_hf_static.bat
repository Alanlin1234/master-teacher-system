@echo off
chcp 65001 >nul
echo ===============================================================
echo   循智导学 · AI名师系统 - Hugging Face 静态免费空间一键推送
echo ===============================================================
echo.
echo 提示：
echo 1. Space SDK 请选择第一个绿色的【静止的】(Static)，完全免费，不需要一分钱！
echo 2. Git 推送时，密码请填写您的 Hugging Face Access Token (具有 write 权限)。
echo    (获取地址: https://huggingface.co/settings/tokens)
echo.

set /p SPACE_URL="请输入您的 Space Git 地址 (如 https://huggingface.co/spaces/用户名/仓库名): "

if "%SPACE_URL%"=="" (
    echo [错误] Space Git 地址不能为空！
    pause
    exit /b 1
)

echo.
echo [1/3] 检查并配置 Git 仓库...
if not exist ".git" (
    git init
    git branch -M main
)

git remote remove origin 2>nul
git remote add origin %SPACE_URL%

echo.
echo [2/3] 暂存静态部署文件...
git add index.html README.md assets photos demo_videos

echo.
echo [3/3] 推送到 Hugging Face Space...
git commit -m "feat: deploy static free master teacher system"
echo.
echo 正在推送到云端，请根据弹出的提示输入用户名和 Token...
git push origin main --force

echo.
if %errorlevel% equ 0 (
    echo ===============================================================
    echo   恭喜！代码已成功推送到 Hugging Face 静态免费空间！
    echo   Space 正在上线，约 10 秒即可通过公网链接访问！
    echo ===============================================================
) else (
    echo.
    echo [提示] 如遇到网络问题，也可以直接在 Space 网页端上传：
    echo 1. 打开 Space 页面 -> 点击 "Files" 标签 -> "Upload files"；
    echo 2. 将当前文件夹内的 index.html, README.md, assets, photos, demo_videos 拖入上传即可！
)

echo.
pause
