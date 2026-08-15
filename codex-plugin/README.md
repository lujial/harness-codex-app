# codex-plugin — Codex 风格界面动态插件

这是 DeepSeek Harness 的动态 Cordis 插件源码（Host + Client），负责把 Harness Web GUI 的中间对话栏替换为 Codex 风格界面，并新增左侧任务列表。

## 文件说明

| 文件 | 内容 |
| --- | --- |
| `client.js` | Client half：注册到 `conversation` 与 `sidebar.workspaces` 槽位，渲染 Codex 风格界面（函数体，返回 Cordis Plugin） |
| `host.js` | Host half：`harness.handle` 提供 `models` / `saveModel` / `plan` / `planSet` RPC，并用 `webServer.register` 从磁盘 serve 背景图（函数体，返回 Cordis Plugin） |

> 两个文件都是**函数体**（`return { apply(ctx) { ... } }` 形式），与 `cordis_define` 的 `code.host` / `code.client` 参数一致。

## 在 Harness 中使用

1. 在 Harness 会话中定义插件（把 `client.js` / `host.js` 内容作为 `cordis_define` 的 `code.client` / `code.host`）：

```
cordis_define → plugin.kind: new, idPrefix: codex
```

2. 激活：

```
cordis_run → pluginId: codex-1, packageId: pkg-1, mode: run
```

3. 浏览器端授权后，界面即被替换为 Codex 风格；`cordis_stop(codex-1)` 恢复原生界面。

## 功能

- **中间栏**：会话头部（标题、运行状态、模型选择、Plan/Auto、停止）、消息流（用户/助手气泡、Markdown、思考折叠、工具卡片、流式输出、排队、审批提示、错误、token 用量）、底部 Composer（Enter 发送 / Shift+Enter 换行）
- **侧边栏**：`⌘ Tasks` 任务列表（新建任务、历史任务按时间倒序、运行状态点）
- **背景图**：Host 通过 `webServer.register('/codex-bg.png')` 从磁盘读取图片 serve，Client CSS 以 URL 引用（图片不内嵌进代码）

## 注意

- 插件定义位于进程内存，Harness 服务重启后需重新 `cordis_define` + `cordis_run`。
- 背景图路径在 `host.js` 顶部的 `BG_PATH` 常量，替换图片只需改该路径。
