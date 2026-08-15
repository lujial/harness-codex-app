# img-gen-plugin — ComfyUI AI 生图

让 DeepSeek Harness 通过本地 [ComfyUI](https://github.com/comfyanonymous/ComfyUI) 生成图像。
这是动态 Cordis 插件的**参考源码**（对应运行中的 `imgp-6` 插件、`pkg-21` 版本），
不是独立安装包 —— 动态插件通过 Harness 的插件工具直接定义/运行。

## 功能

| 入口 | 位置 | 说明 |
| --- | --- | --- |
| **AI 生图** | 设置 → AI 生图（`settings.section` id `img-gen`, order 26） | 表单页：workflow 路径、Checkpoint 模型、正/反向提示词、Seed/Steps/CFG、宽高，生成后直接预览 |
| **ComfyUI** | 设置 → ComfyUI（`settings.section` id `comfyui`, order 27） | iframe 嵌入完整 ComfyUI 界面，可编辑工作流、排队生成；支持「⛶ 全屏打开」与「独立窗口打开」 |
| **全屏浮层** | `shell.overlay` id `comfyui-full` | 全屏 iframe，顶部栏带「独立窗口打开」与「✕ 关闭」 |

- 默认使用用户工作流：`E:\xiazai\airi-aom3-blue-watercolor-fullbody-2k.json`（AOM3 水彩风，含 ControlNet 姿态 + 放大链）。
- 生成结果同时在对话中内嵌显示（通过 `http://127.0.0.1:3080/gen-img/<filename>` 绝对 URL）。

## 架构

- **Host**（`host.js`）
  - `harness.handle('imggen', args)` — 读取 workflow JSON → 按参数覆写节点（Checkpoint / CLIP 正负文本 / KSampler seed·steps·cfg / EmptyLatentImage 宽高 / SaveImage 前缀）→ POST 到 ComfyUI `/prompt` → 轮询 `/history/{id}` → 经 `/view` 拉取 PNG 转 base64，同时返回对话可用的 `/gen-img` URL。
  - `harness.handle('imgModels')` — 从 `/object_info` 探测 checkpoint / ControlNet / 放大模型列表。
  - `webServer` 前缀路由 `/gen-img/<filename>` — 从 ComfyUI 输出目录 serve 图片（校验文件名防穿越，经 `fs` 服务读取）。
- **Client**（`client.js`）— 三个 React 组件注册到 `settings.section` 与 `shell.overlay`；全屏开关用极简跨组件 store 共享。

## 沙箱注意（关键）

- Host 侧没有全局 `fetch`/`process`/`AbortController`；所有 HTTP 走 `subprocess` + `node -e` 脚本（`fetch` 在子进程里执行，stdout 传回 JSON/base64）。
- `inject: ['timer']` 是必须的，轮询用 `ctx.timeout`（回退 `setTimeout`）。
- `/gen-img` 路由**必须裸注册**：若用 `ctx.effect(() => dispose())` 包裹，动态插件会在 `apply` 后立刻清理路由（探针已验证）。前缀路由可重复注册（重复时被 try/catch 吞掉），精确路由重复会抛错。
- 读 workflow JSON 也用 `node -e`（PowerShell `ConvertFrom-Json` 对中文 JSON 有编码问题）。

## 依赖（运行前提）

- ComfyUI 已在 `127.0.0.1:8188` 运行（示例：`D:\ComfyUI\.venv\Scripts\python.exe D:\ComfyUI\ComfyUI\main.py --listen 127.0.0.1 --port 8188 --lowvram --disable-mmap --disable-pinned-memory --cpu-vae --cache-none`）。
- 低显存 GPU（如 RTX 3050 Ti 4GB）请勿加 `--reserve-vram`，否则 CUDA OOM；生成时关闭占用显存的其他程序。
- 输出目录：`D:\ComfyUI\ComfyUI\output`。

## 在 Harness 中运行

动态插件定义在会话内（Client 代码存活于页面内存，刷新/重启后需重新 `cordis_run`）。
可参考源码通过 Cordis 插件工具逐字定义并运行；或直接阅读 `host.js` / `client.js` 了解实现。
