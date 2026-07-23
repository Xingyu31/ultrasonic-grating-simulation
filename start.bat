@echo off
cd /d "%~dp0"
echo 正在启动超声光栅衍射虚拟仿真实验...
echo.
echo 请等待服务器启动，然后在浏览器中访问 http://localhost:5174/
echo.
echo 按 Ctrl+C 停止服务器
echo.
npm run dev
pause