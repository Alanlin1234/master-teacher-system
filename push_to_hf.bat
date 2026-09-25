@echo off
chcp 65001 >nul
echo ========================================================
echo   循智导学 · AI名师与数字人系统 - Hugging Face Spaces 部署工具
echo ========================================================
echo.
echo 提示：
echo 1. 请确保您已在 https://huggingface.co 创建了 Docker 类型的 Space。
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

git remote remove hf 2>nul
git remote add hf %SPACE_URL%

echo.
echo [2/3] 暂存必要部署文件 (已自动忽略 node_modules 等多余数据)...
git add Dockerfile .dockerignore README.md backend frontend/dist .gitignore

echo.
echo [3/3] 提交并推送到 Hugging Face Space...
git commit -m "feat: deploy to hugging face spaces"
echo.
echo 正在推送到云端，请根据弹出的提示输入用户名和 Token...
git push hf main --force

echo.
if %errorlevel% equ 0 (
    echo ========================================================
    echo   恭喜！代码已成功推送到 Hugging Face Spaces！
    echo   Space 正在云端进行自动构建，约 1~2 分钟即可完成。
    echo ========================================================
) else (
    echo.
    echo [提示] 推送若遇到身份验证问题，您也可直接在网页端上传：
    echo 1. 打开您的 Space 页面 -> 点击 "Files" 标签 -> "Upload files"；
    echo 2. 将 Dockerfile、README.md、backend 文件夹、frontend/dist 文件夹拖入上传即可！
)

echo.
pause
