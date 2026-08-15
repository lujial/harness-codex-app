# balance-plugin — DeepSeek 额度查询

在 DeepSeek Harness 的设置中新增 **"额度查询"** 页：读取 DeepSeek API Key，查询账户剩余额度与可用状态（数据来自官方 `/user/balance` 接口）。

## 文件说明

| 文件 | 内容 |
| --- | --- |
| `client.js` | Client half：注册 `settings.section`（id: `balance`），渲染额度查询页；并叠加 deep-whale 主题侧边栏遮挡修复 CSS |
| `host.js` | Host half：`harness.handle('balance')` 提供余额查询 RPC |

## 技术要点

### 余额查询链路（host.js）
1. `credentials.resolve('DEEPSEEK_API_KEY')` 获取 API Key（官方凭据层，来源 `~/.dsh/.credentials.yaml`）
2. `subprocess` 启动 `node -e` 内联脚本，用 Node 原生 `fetch` 调用 `https://api.deepseek.com/user/balance`
3. 20 秒超时（`ctx.timeout` + `subprocess.terminate()`）

> **为什么不用 shell/curl**：DSH 的 shell 服务在 Windows 沙箱（workspace-write）里运行时，curl 的 Schannel TLS 无法获取系统凭据（`SEC_E_NO_CREDENTIALS`），HTTPS 请求在握手阶段失败。Node 原生 fetch（undici）走系统网络栈，不受此限制。

### 沙箱适配（踩坑记录）
| 问题 | 修复 |
| --- | --- |
| `curl` 别名冲突（PowerShell `Invoke-WebRequest`） | 改用 subprocess + node fetch |
| curl Schannel TLS 凭据失败 | 同上 |
| `AbortController` 未定义（沙箱屏蔽） | 移除，改用 `ctx.timeout` + `terminate()` |
| `timer` 服务未注入（Host 守卫拒绝） | 声明 `inject: ['timer']` |

### 侧边栏遮挡修复（client.js CSS）
deep-whale 主题会在侧边栏注入装饰（四角边框、底部飘带、Q 版宠物）。本插件的 CSS 只处理**真正遮挡选项**的元素：

- **四角边框** → `z-index:0` 内容之下 + 半透明
- **底部飘带** → 恢复正常高度，不挤压设置区
- **设置区** → 保持最上层可点

**重要**：绝不修改 mascot/companion（人物）的任何样式——主题自己用 opacity 控制昼夜切换与定位，任何覆盖都会导致人物消失、错位或昼夜人物同时显示。

## 使用

1. 在 Harness 会话中定义插件（`client.js` / `host.js` 作为 `cordis_define` 的 `code.client` / `code.host`，idPrefix 如 `balc`）
2. 激活后，打开 设置 → 额度查询 → 查询余额
3. 前提：DeepSeek API Key 已配置（设置→模型 或 `~/.dsh/.credentials.yaml`）
