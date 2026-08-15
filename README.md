# DeepSeek Harness Codex — 独立应用端

把 [DeepSeek Harness](https://github.com/deepseek-ai) 的 Web 服务包装为 **Codex 风格的独立桌面应用**。项目包含：

- **Electron 壳**（`main.js`）：把 `http://127.0.0.1:3080` 包装成无浏览器装饰的原生窗口
- **零依赖启动**（`launch-app.bat`）：Edge/Chrome `--app` 模式独立窗口
- **动态界面插件**（`codex-plugin/`）：注册到 Harness 的 `conversation` / `sidebar.workspaces` 槽位，提供 Codex 风格中间栏（会话头部、模型选择、Plan/Auto 切换、消息流、Composer）与左侧任务列表
- **额度查询插件**（`codex-plugin/balance-plugin/`）：在设置中新增"额度查询"页，查询 DeepSeek 账户余额（subprocess + node fetch 实现，附带 deep-whale 主题侧边栏遮挡修复）
- **主题集成**：可选集成 [deep-whale-day-night-theme](#attribution-引用与许可) 鲸鱼娘昼夜主题

> 原理说明：DSH 的前端本身就是 Web 渲染的（Codex 界面是构建在浏览器槽位系统上的动态插件），因此"独立应用"的务实形态是**桌面壳** —— 用原生窗口加载本机服务，而不是在浏览器标签页里使用。本项目提供两种壳：Electron（真正独立进程）与 Chromium `--app` 模式（零依赖）。

## 特性

- Codex 风格会话界面：用户/助手气泡、Markdown 渲染（代码块/标题/列表/行内样式）、思考过程折叠、工具调用与结果卡片、流式输出、排队消息、token 用量
- 左侧 Codex 风格任务列表：`⌘ Tasks` 标题、`＋ New Task`、历史任务（运行状态点 + 相对时间）
- 模型选择器（读取 `llm` providers/models）与 Plan/Auto 切换（`planMode` 服务）
- 背景图通过 Host 路由（`webServer.register`）从磁盘 serve，不内嵌进代码

## 前置条件

- DeepSeek Harness 正在运行，页面地址为 `http://127.0.0.1:3080`（可用环境变量 `DSH_URL` 覆盖）
- Node.js（Electron 方案需要）

## 快速开始

### 方案 A：Electron 独立应用

```powershell
cd codex-app
npm install
npm start
```

打包成单文件 exe：

```powershell
npm run dist
# 产物在 dist/DeepSeek Harness Codex-<version>-portable.exe
```

### 方案 B：Chromium --app 独立窗口（零依赖）

双击 `launch-app.bat`，或手动：

```powershell
msedge --app=http://127.0.0.1:3080 --window-size=1280,840
```

### 启用 Codex 风格界面

在 Harness 会话中运行动态插件（`codex-1`），即可把中间栏替换为 Codex 风格界面：

- 插件代码见 `codex-plugin/`（通过 `cordis_define` 定义、`cordis_run` 激活）
- 停止插件即可恢复原生界面

### 启用鲸鱼娘昼夜主题（可选）

主题通过 Harness 官方插件机制安装：

```sh
dsh plugin --profile web add <deep-whale-day-night-theme 路径>
```

安装后重启 Harness 服务，页面右上角主题按钮选择 **"鲸鱼娘昼夜工坊"**。

## 项目结构

```text
codex-app/
├── main.js              Electron 壳
├── package.json         依赖与打包配置（electron-builder）
├── launch-app.bat       零依赖独立窗口启动脚本
├── codex-plugin/        Codex 风格界面动态插件（Host + Client 源码）
├── start-dsh.ps1        后台运行 Harness 服务的脚本（可选）
└── README.md
```

## License

本项目代码（Electron 壳、插件源码、脚本）以 **MIT License** 发布，见 [LICENSE](LICENSE)。

## Attribution 引用与许可

本项目构建于以下开源项目之上，特此致谢并遵守其许可：

| 项目 | 说明 | 许可 |
| --- | --- | --- |
| [DeepSeek Harness](https://github.com/deepseek-ai) | 底层 Harness 平台（Web GUI、插件系统、Agent 运行时） | 见其仓库 |
| [deep-whale-day-night-theme](https://github.com/GGBond2424648901/deep-whale-day-night-theme) | 鲸鱼娘昼夜主题（Day & Night 皮肤，本项目可选集成） | **CC BY-NC-SA 4.0**（非商业用途，署名，相同方式共享） |
| [OpenAI Codex](https://github.com/openai/codex) | 界面风格的灵感来源（本项目为独立实现，与 OpenAI 无关联） | — |
| [Electron](https://www.electronjs.org/) | 桌面壳运行时 | MIT |

**deep-whale-day-night-theme 许可声明（CC BY-NC-SA 4.0）**：该主题仅允许保留署名的个人及非商业使用，禁止商业使用，衍生作品必须以相同许可证共享。本项目的主题集成部分遵守该许可。原始角色创作者：**上善**（[Pixiv](https://www.pixiv.net/users/62155430)）；DeepSeek 女仆二次设计：**zipzip**（[Pixiv](https://www.pixiv.net/users/18604994)）；主题适配与 UI 制作：**Small-tailqwq**。

> 免责声明：DeepSeek、Codex 等相关名称与标志归各自权利人所有。本项目为个人非商业用途的独立实现，不代表官方背书或关联。
