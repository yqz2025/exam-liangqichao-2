@echo off
chcp 65001
echo ======================================
echo    梁启超家风知识竞赛系统 启动中
echo ======================================
echo 正在安装依赖...
npm install
echo 启动服务...
node index.js
pause