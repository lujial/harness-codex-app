// @dsh-external/dsh-plugin-comfyui — Client half
// 标准 dsh client bundle（window.__ModuleLoader__.load 格式）。
// 浏览器加载后经 client-modules 注入 boot graph，页面每次刷新自动激活（无需 cordis_run）。
// 与 host 的通信走同源 fetch('/comfy-api/...')，不依赖动态插件的 harness.handle/host.call。
window.__ModuleLoader__.load({
  id: '@dsh-external/dsh-plugin-comfyui',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })

    const React = require('react')

    const CSS = `
.ig-root{display:flex;flex-direction:column;gap:14px;padding:4px 2px;font-size:13px;line-height:1.6}
.ig-head{font-size:16px;font-weight:700;margin:0 0 4px}
.ig-desc{color:var(--dsw-alias-label-secondary);font-size:12px;margin:0 0 8px}
.ig-card{background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-radius:12px;padding:14px 16px}
.ig-label{font-size:12px;color:var(--dsw-alias-label-secondary);margin:0 0 4px;font-weight:600}
.ig-input{width:100%;box-sizing:border-box;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l1);border-radius:8px;padding:8px 10px;font-size:13px;font-family:inherit}
.ig-input:focus{outline:none;border-color:var(--dsw-alias-brand-primary)}
.ig-textarea{width:100%;box-sizing:border-box;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l1);border-radius:8px;padding:8px 10px;font-size:13px;font-family:inherit;resize:vertical;min-height:80px;line-height:1.5}
.ig-row{display:flex;gap:10px;align-items:flex-end}
.ig-col{flex:1;min-width:0}
.ig-btn{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);border-radius:8px;padding:7px 18px;font-size:13px;cursor:pointer}
.ig-btn:hover{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary)}
.ig-btn:disabled{opacity:.5;cursor:default}
.ig-btn-primary{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);color:#fff}
.ig-btn-primary:hover{color:#fff;opacity:.9}
.ig-status{font-size:12px;padding:8px 12px;border-radius:8px}
.ig-status-ok{color:var(--dsw-alias-state-success-primary);background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-state-success-primary)}
.ig-status-err{color:var(--dsw-alias-state-error-primary);background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-state-error-primary)}
.ig-status-run{color:var(--dsw-alias-state-warn-primary);background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-state-warn-primary)}
.ig-preview{max-width:100%;border-radius:10px;border:1px solid var(--dsw-alias-border-l1);display:block}
.ig-preview-wrap{text-align:center}
.ig-hint{font-size:11px;color:var(--dsw-alias-label-secondary)}
/* ComfyUI 设置页嵌入 */
.cf-root{display:flex;flex-direction:column;gap:12px;padding:2px;font-size:13px}
.cf-head{font-size:16px;font-weight:700}
.cf-desc{color:var(--dsw-alias-label-secondary);font-size:12px}
.cf-frame-wrap{position:relative;width:100%;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;overflow:hidden;background:var(--dsw-alias-bg-layer-1)}
.cf-frame{width:100%;height:calc(100vh - 280px);min-height:520px;border:none;display:block}
.cf-open{display:inline-flex;align-items:center;gap:6px}
.cf-hint{font-size:11px;color:var(--dsw-alias-label-secondary)}
.cf-toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
/* 全屏浮层 */
.cf-full{position:fixed;inset:0;z-index:9999;background:var(--dsw-alias-bg-base);display:flex;flex-direction:column}
.cf-full-bar{display:flex;align-items:center;gap:10px;padding:8px 14px;border-bottom:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);flex:none}
.cf-full-title{font-size:14px;font-weight:600;flex:1}
.cf-full-frame{flex:1;min-height:0;width:100%;border:none}
/* 额度查询页 */
.bc-root{display:flex;flex-direction:column;gap:14px;padding:4px 2px;font-size:13px;line-height:1.6}
.bc-head{font-size:16px;font-weight:700;margin:0 0 4px}
.bc-desc{color:var(--dsw-alias-label-secondary);font-size:12px;margin:0 0 8px}
.bc-card{background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-radius:12px;padding:14px 16px}
.bc-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--dsw-alias-border-l1)}
.bc-row:last-child{border-bottom:none}
.bc-k{font-size:12px;color:var(--dsw-alias-label-secondary)}
.bc-v{font-size:14px;font-weight:600}
.bc-ok{color:var(--dsw-alias-state-success-primary)}
/* === 修复：deep-whale 主题侧边栏遮挡 ===
   注意：
   1. 绝不修改 mascot/companion（人物）的任何样式（位置/透明度/层级）——
      主题自己控制昼夜切换与定位，任何覆盖都会破坏它。
   2. 绝不添加命中 mascot 的侧边栏内容层级规则（主题原版 :not() 已排除 mascot，
      我们自己写时必须同样排除，否则 mascot 会被改成 position:relative 而错位）。
   这里只处理真正遮挡选项的四角边框与底部飘带。 */
/* 四角边框装饰：置于内容之下 + 半透明，不再盖住选项 */
body[data-dsh-maid-atelier] [data-skin-chrome='sidebar-corners'] {
  z-index:0 !important;
  pointer-events:none !important;
  opacity:.6 !important;
}
/* 底部飘带恢复正常高度，避免挤压设置区 */
body[data-dsh-maid-atelier] [data-maid-sidebar-footer] {
  flex:0 0 auto !important;
  min-height:0 !important;
  padding:8px 12px !important;
  z-index:auto !important;
}
/* 设置区与底部操作区保证在最上层可点可见（只作用于设置区本身，不影响人物） */
body[data-dsh-maid-atelier] [data-slot='sidebar.settings'],
body[data-dsh-maid-atelier] [data-slot='sidebar.footer.action'] {
  z-index:3 !important;
  position:relative !important;
}
`

    // CSS 注入（与主题 bundle 相同的 style 标签约定，可被 client-modules 统计与清理）
    const tagId = '@dsh-external/dsh-plugin-comfyui/comfyui.css'
    if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css=' + JSON.stringify(tagId) + ']') === null) {
      const tag = document.createElement('style')
      tag.dataset.plugin = '@dsh-external/dsh-plugin-comfyui'
      tag.dataset.pluginCss = tagId
      tag.textContent = CSS
      document.head.appendChild(tag)
    }

    // 极简跨组件状态 store（全屏浮层开关）
    const fullscreenStore = {
      open: false,
      listeners: new Set(),
      set(v) {
        this.open = !!v
        this.listeners.forEach((l) => l(this.open))
      },
      subscribe(l) {
        this.listeners.add(l)
        return () => this.listeners.delete(l)
      },
    }

    // ---- Host RPC（同源 fetch）----
    function callApi(path, args) {
      return fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args || {}),
      }).then((r) => r.json()).catch((e) => ({ ok: false, error: String((e && e.message) || e) }))
    }
    function getApi(path) {
      return fetch(path).then((r) => r.json()).catch((e) => ({ ok: false, error: String((e && e.message) || e) }))
    }

    function ComfyFullscreen() {
      const [open, setOpen] = React.useState(fullscreenStore.open)
      React.useEffect(() => fullscreenStore.subscribe(setOpen), [])
      if (!open) return null
      return React.createElement('div', { className: 'cf-full' },
        React.createElement('div', { className: 'cf-full-bar' },
          React.createElement('span', { className: 'cf-full-title' }, 'ComfyUI'),
          React.createElement('a', {
            className: 'ig-btn cf-open',
            href: 'http://127.0.0.1:8188/',
            target: '_blank',
            rel: 'noreferrer',
          }, '独立窗口打开'),
          React.createElement('button', { className: 'ig-btn ig-btn-primary', onClick: () => fullscreenStore.set(false) }, '✕ 关闭')),
        React.createElement('iframe', {
          className: 'cf-full-frame',
          src: 'http://127.0.0.1:8188/',
          title: 'ComfyUI 全屏',
          allowFullScreen: true,
          sandbox: 'allow-scripts allow-same-origin allow-forms allow-popups allow-downloads',
        }))
    }

    function ComfyUIPage() {
      return React.createElement('div', { className: 'cf-root' },
        React.createElement('div', { className: 'cf-head' }, 'ComfyUI'),
        React.createElement('div', { className: 'cf-desc' }, '完整 ComfyUI 界面。可在此打开/编辑任意工作流、调整节点、排队生成。生成结果保存在 ComfyUI 输出目录。'),
        React.createElement('div', { className: 'cf-toolbar' },
          React.createElement('button', { className: 'ig-btn ig-btn-primary', onClick: () => fullscreenStore.set(true) }, '⛶ 全屏打开'),
          React.createElement('a', {
            className: 'ig-btn cf-open',
            href: 'http://127.0.0.1:8188/',
            target: '_blank',
            rel: 'noreferrer',
          }, '在独立窗口打开')),
        React.createElement('div', { className: 'cf-frame-wrap' },
          React.createElement('iframe', {
            className: 'cf-frame',
            src: 'http://127.0.0.1:8188/',
            title: 'ComfyUI',
            allowFullScreen: true,
            sandbox: 'allow-scripts allow-same-origin allow-forms allow-popups allow-downloads',
          })))
    }

    function ImgGenPage() {
      const [state, setState] = React.useState({ status: 'idle', error: null, image: null, filename: null, url: null })
      const [models, setModels] = React.useState({ checkpoints: [], controlnets: [], upscaleModels: [] })
      const [cfg, setCfg] = React.useState({
        workflowPath: 'E:\\xiazai\\airi-aom3-blue-watercolor-fullbody-2k.json',
        checkpoint: '',
        prompt: '',
        negative: '',
        seed: '',
        steps: '',
        cfgVal: '',
        width: '',
        height: '',
      })

      React.useEffect(() => {
        getApi('/comfy-api/imgModels').then((r) => {
          if (r && r.ok) setModels({ checkpoints: r.checkpoints || [], controlnets: r.controlnets || [], upscaleModels: r.upscaleModels || [] })
        }).catch(() => {})
      }, [])

      const setField = (key, val) => setCfg((prev) => ({ ...prev, [key]: val }))

      const generate = () => {
        setState({ status: 'running', error: null, image: null, filename: null, url: null })
        callApi('/comfy-api/imggen', {
          workflowPath: cfg.workflowPath || undefined,
          checkpoint: cfg.checkpoint || undefined,
          prompt: cfg.prompt || undefined,
          negative: cfg.negative || undefined,
          seed: cfg.seed || undefined,
          steps: cfg.steps || undefined,
          cfg: cfg.cfgVal || undefined,
          width: cfg.width || undefined,
          height: cfg.height || undefined,
          prefix: 'dsh_gen_' + Date.now(),
        })
          .then((r) => {
            if (r && r.ok) setState({ status: 'ok', error: null, image: r.image, filename: r.filename, url: r.url || null })
            else setState({ status: 'error', error: (r && r.error) || '生成失败', image: null, filename: null, url: null })
          })
          .catch((e) => setState({ status: 'error', error: String((e && e.message) || e), image: null, filename: null, url: null }))
      }

      const children = []
      children.push(React.createElement('div', { key: 'head', className: 'ig-head' }, 'AI 生图'))
      children.push(React.createElement('div', { key: 'desc', className: 'ig-desc' }, '通过本地 ComfyUI 生成图像。默认使用你的 AOM3 水彩工作流，可自行选择模型、调整提示词与参数。'))

      children.push(React.createElement('div', { key: 'wf', className: 'ig-card' },
        React.createElement('div', { className: 'ig-label' }, 'Workflow 文件路径'),
        React.createElement('input', {
          className: 'ig-input',
          value: cfg.workflowPath,
          onChange: (e) => setField('workflowPath', e.target.value),
          placeholder: 'workflow JSON 路径',
        })))

      children.push(React.createElement('div', { key: 'model', className: 'ig-card' },
        React.createElement('div', { className: 'ig-label' }, 'Checkpoint 模型（留空用工作流默认）'),
        React.createElement('select', {
          className: 'ig-input',
          value: cfg.checkpoint,
          onChange: (e) => setField('checkpoint', e.target.value),
        },
          React.createElement('option', { value: '' }, '（工作流默认）'),
          (models.checkpoints || []).map((m) => React.createElement('option', { key: m, value: m }, m)))))

      children.push(React.createElement('div', { key: 'prompt', className: 'ig-card' },
        React.createElement('div', { className: 'ig-label' }, '正向提示词（留空用工作流默认）'),
        React.createElement('textarea', {
          className: 'ig-textarea',
          value: cfg.prompt,
          onChange: (e) => setField('prompt', e.target.value),
          placeholder: '输入提示词…',
        }),
        React.createElement('div', { className: 'ig-label', style: { marginTop: 10 } }, '反向提示词（留空用工作流默认）'),
        React.createElement('textarea', {
          className: 'ig-textarea',
          value: cfg.negative,
          onChange: (e) => setField('negative', e.target.value),
          placeholder: '输入反向提示词…',
        })))

      children.push(React.createElement('div', { key: 'params', className: 'ig-card' },
        React.createElement('div', { className: 'ig-row' },
          React.createElement('div', { className: 'ig-col' },
            React.createElement('div', { className: 'ig-label' }, 'Seed'),
            React.createElement('input', { className: 'ig-input', value: cfg.seed, onChange: (e) => setField('seed', e.target.value), placeholder: '随机' })),
          React.createElement('div', { className: 'ig-col' },
            React.createElement('div', { className: 'ig-label' }, 'Steps'),
            React.createElement('input', { className: 'ig-input', value: cfg.steps, onChange: (e) => setField('steps', e.target.value), placeholder: '默认' })),
          React.createElement('div', { className: 'ig-col' },
            React.createElement('div', { className: 'ig-label' }, 'CFG'),
            React.createElement('input', { className: 'ig-input', value: cfg.cfgVal, onChange: (e) => setField('cfgVal', e.target.value), placeholder: '默认' }))),
        React.createElement('div', { className: 'ig-row', style: { marginTop: 10 } },
          React.createElement('div', { className: 'ig-col' },
            React.createElement('div', { className: 'ig-label' }, '宽度'),
            React.createElement('input', { className: 'ig-input', value: cfg.width, onChange: (e) => setField('width', e.target.value), placeholder: '默认' })),
          React.createElement('div', { className: 'ig-col' },
            React.createElement('div', { className: 'ig-label' }, '高度'),
            React.createElement('input', { className: 'ig-input', value: cfg.height, onChange: (e) => setField('height', e.target.value), placeholder: '默认' })))))

      if (state.status === 'running') {
        children.push(React.createElement('div', { key: 'st', className: 'ig-status ig-status-run' }, '生成中…（本地 ComfyUI 推理，可能需要 1-2 分钟）'))
      } else if (state.status === 'error') {
        children.push(React.createElement('div', { key: 'st', className: 'ig-status ig-status-err' }, state.error))
      } else if (state.status === 'ok' && state.image) {
        children.push(React.createElement('div', { key: 'st', className: 'ig-status ig-status-ok' }, '生成成功' + (state.filename ? '：' + state.filename : '')))
        children.push(React.createElement('div', { key: 'pv', className: 'ig-preview-wrap' },
          React.createElement('img', { className: 'ig-preview', src: 'data:image/png;base64,' + state.image, alt: '生成结果' })))
      }

      children.push(React.createElement('div', { key: 'act', className: 'ig-row' },
        React.createElement('button', {
          className: 'ig-btn ig-btn-primary',
          disabled: state.status === 'running',
          onClick: generate,
        }, state.status === 'running' ? '生成中…' : '开始生成')))

      children.push(React.createElement('div', { key: 'hint', className: 'ig-hint' }, '提示：生成在本地 ComfyUI（127.0.0.1:8188）执行，不消耗 DeepSeek 额度。可用模型列表由 ComfyUI 自动探测。'))

      return React.createElement('div', { className: 'ig-root' }, ...children)
    }

    function BalancePage() {
      const [state, setState] = React.useState({ status: 'idle', balance: null, error: null })

      const query = () => {
        setState({ status: 'running', balance: null, error: null })
        getApi('/comfy-api/balance')
          .then((r) => {
            if (r && r.ok) setState({ status: 'ok', balance: r.balance, error: null })
            else setState({ status: 'error', balance: null, error: (r && r.error) || '查询失败' })
          })
          .catch((e) => setState({ status: 'error', balance: null, error: String((e && e.message) || e) }))
      }

      const infos = (state.balance && state.balance.balance_infos) || []
      const children = []
      children.push(React.createElement('div', { key: 'head', className: 'bc-head' }, '额度查询'))
      children.push(React.createElement('div', { key: 'desc', className: 'bc-desc' }, '查询 DeepSeek 账户剩余额度（使用 设置→模型 中配置的 API Key）。'))
      children.push(React.createElement('div', { key: 'act', className: 'ig-row' },
        React.createElement('button', {
          className: 'ig-btn ig-btn-primary',
          disabled: state.status === 'running',
          onClick: query,
        }, state.status === 'running' ? '查询中…' : '查询余额')))

      if (state.status === 'running') {
        children.push(React.createElement('div', { key: 'st', className: 'ig-status ig-status-run' }, '查询中…'))
      } else if (state.status === 'error') {
        children.push(React.createElement('div', { key: 'st', className: 'ig-status ig-status-err' }, state.error))
      } else if (state.status === 'ok' && state.balance) {
        const rows = []
        rows.push(React.createElement('div', { key: 'avail', className: 'bc-row' },
          React.createElement('span', { className: 'bc-k' }, '账户状态'),
          React.createElement('span', { className: 'bc-v ' + (state.balance.is_available ? 'bc-ok' : 'ig-status-err') }, state.balance.is_available ? '可用' : '不可用')))
        if (infos.length === 0) {
          rows.push(React.createElement('div', { key: 'empty', className: 'bc-row' },
            React.createElement('span', { className: 'bc-k' }, '余额信息'),
            React.createElement('span', { className: 'bc-v' }, '无')))
        } else {
          infos.forEach((info, i) => {
            rows.push(React.createElement('div', { key: 'r' + i, className: 'bc-row' },
              React.createElement('span', { className: 'bc-k' }, '余额（' + (info.currency || '') + '）'),
              React.createElement('span', { className: 'bc-v bc-ok' }, info.total_balance !== undefined ? Number(info.total_balance).toFixed(2) : '—')))
          })
        }
        children.push(React.createElement('div', { key: 'card', className: 'bc-card' }, ...rows))
      }
      return React.createElement('div', { className: 'bc-root' }, ...children)
    }

    const inject = ['slots']

    function apply(ctx) {
      const slots = ctx.get('slots')
      if (slots === undefined) return

      slots.inject('settings.section', () => slots.register(
        { name: 'settings.section', id: 'img-gen', order: 26, label: 'AI 生图' },
        () => React.createElement(ImgGenPage, null)))

      slots.inject('settings.section', () => slots.register(
        { name: 'settings.section', id: 'comfyui', order: 27, label: 'ComfyUI' },
        () => React.createElement(ComfyUIPage, null)))

      slots.inject('settings.section', () => slots.register(
        { name: 'settings.section', id: 'balance', order: 25, label: '额度查询' },
        () => React.createElement(BalancePage, null)))

      slots.inject('shell.overlay', () => slots.register(
        { name: 'shell.overlay', id: 'comfyui-full', order: 0, label: 'ComfyUI 全屏' },
        () => React.createElement(ComfyFullscreen, null)))
    }

    exports.apply = apply
    exports.inject = inject
    return module.exports
  },
})
