@echo off
REM DeepSeek Harness Codex —— 零依赖独立窗口启动脚本
REM 用 Edge/Chrome 的 --app 模式打开独立窗口（无地址栏/标签页，像桌面应用）
setlocal
set "URL=http://127.0.0.1:3080"

REM 依次探测 Edge 与 Chrome
set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
set "EDGE2=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
set "CHROME2=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"

set "BROWSER="
if exist "%EDGE%" set "BROWSER=%EDGE%"
if exist "%EDGE2%" set "BROWSER=%EDGE2%"
if exist "%CHROME%" set "BROWSER=%CHROME%"
if exist "%CHROME2%" set "BROWSER=%CHROME2%"

if "%BROWSER%"=="" (
  echo 未找到 Edge 或 Chrome，请先安装其一，或改用 Electron 方案（见 README.md）
  pause
  exit /b 1
)

start "" "%BROWSER%" --app="%URL%" --window-size=1280,840 --window-position=center
endlocal
