@echo off
chcp 65001 >nul
title 安装 BS小手机 3.77
echo 请先用数据线连接手机，并允许 USB 调试。
echo.
"E:\Codex\tools\android-sdk\platform-tools\adb.exe" install -r "%~dp0BS小手机_3.77.apk"
echo.
echo 如果显示 Success，就表示覆盖升级成功，旧数据会保留。
pause
