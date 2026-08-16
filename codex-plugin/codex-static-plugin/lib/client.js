// @dsh-external/dsh-plugin-codex-ui — Client half
// 标准 dsh client bundle（window.__ModuleLoader__.load 格式）。
// Codex 风格会话界面（conversation + sidebar.workspaces 槽位替换），静态加载：
// 页面刷新/服务重启后自动激活，无需 cordis_run。
// 与 host 通信走同源 fetch('/codex-api/...')，不依赖动态插件的 host.call。
window.__ModuleLoader__.load({
  id: '@dsh-external/dsh-plugin-codex-ui',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })

    const React = require('react')

    const CSS = `
.cx-root{display:flex;flex-direction:column;height:100%;min-height:0;background:transparent;color:var(--dsw-alias-label-primary)}
.cx-header{display:flex;align-items:center;gap:10px;padding:10px 18px;border-bottom:1px solid var(--dsw-alias-border-l1);flex:none;background:transparent}
.cx-title{font-size:14px;font-weight:600;color:var(--dsw-alias-label-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;flex:1}
.cx-dot{width:8px;height:8px;border-radius:50%;flex:none;background:var(--dsw-alias-label-secondary)}
.cx-dot-run{background:var(--dsw-alias-state-success-primary);animation:cx-pulse 1.2s ease-in-out infinite}
@keyframes cx-pulse{0%,100%{opacity:1}50%{opacity:.35}}
.cx-btn{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);border-radius:8px;padding:4px 12px;font-size:12px;cursor:pointer;white-space:nowrap}
.cx-btn:hover{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary)}
.cx-btn-primary{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);color:#fff}
.cx-btn-primary:hover{color:#fff;opacity:.9}
.cx-btn-on{border-color:var(--dsw-alias-state-warn-primary);color:var(--dsw-alias-state-warn-primary)}
.cx-btn-stop{border-color:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-state-error-primary)}
.cx-btn-stop:hover{color:var(--dsw-alias-state-error-primary)}
.cx-scroll{flex:1;min-height:0;overflow-y:auto;padding:18px 18px 8px}
.cx-msglist{max-width:820px;margin:0 auto;display:flex;flex-direction:column;gap:12px}
.cx-row{display:flex;gap:10px;align-items:flex-start}
.cx-user{flex-direction:row-reverse}
.cx-avatar{width:26px;height:26px;border-radius:50%;background:var(--dsw-alias-brand-primary);color:#fff;font-size:11px;display:flex;align-items:center;justify-content:center;flex:none;margin-top:2px}
.cx-bubble{max-width:78%;border-radius:12px;padding:8px 12px;font-size:13px;line-height:1.6;overflow-wrap:break-word;min-width:0}
.cx-bubble-user{background:var(--dsw-alias-brand-primary);color:#fff;border-top-right-radius:4px;white-space:pre-wrap}
.cx-bubble-assistant{background:rgba(0,0,0,.16);border:1px solid var(--dsw-alias-border-l1);border-top-left-radius:4px}
.cx-bubble p{margin:0 0 8px}
.cx-bubble p:last-child{margin-bottom:0}
.cx-bubble h1,.cx-bubble h2,.cx-bubble h3,.cx-bubble h4{margin:10px 0 6px;font-weight:600;line-height:1.3}
.cx-bubble ul,.cx-bubble ol{margin:0 0 8px;padding-left:20px}
.cx-bubble li{margin:2px 0}
.cx-bubble pre{background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);border-radius:8px;padding:8px 10px;overflow-x:auto;font-size:12px;margin:6px 0}
.cx-bubble code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;background:var(--dsw-alias-bg-layer-2);border-radius:4px;padding:1px 4px}
.cx-bubble pre code{background:none;padding:0}
.cx-bubble a{color:var(--dsw-alias-brand-primary)}
.cx-reasoning{margin:6px 0;border-left:3px solid var(--dsw-alias-border-l2);padding-left:10px;color:var(--dsw-alias-label-secondary);font-size:12px}
.cx-reasoning summary{cursor:pointer;font-size:12px;color:var(--dsw-alias-label-secondary)}
.cx-tool{border:1px solid var(--dsw-alias-border-l1);border-radius:8px;overflow:hidden;background:var(--dsw-alias-bg-layer-1);max-width:100%}
.cx-tool-head{display:flex;align-items:center;gap:6px;padding:6px 10px;font-size:12px;font-weight:600;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2);border-bottom:1px solid var(--dsw-alias-border-l1)}
.cx-tool-body{margin:0;padding:8px 10px;font-size:12px;white-space:pre-wrap;overflow-wrap:break-word;color:var(--dsw-alias-label-secondary);max-height:200px;overflow-y:auto}
.cx-tool-running .cx-tool-head{color:var(--dsw-alias-state-warn-primary)}
.cx-meta{font-size:12px;color:var(--dsw-alias-label-secondary);text-align:center;padding:4px 0}
.cx-err{font-size:12px;color:var(--dsw-alias-state-error-primary);text-align:center;padding:4px 0}
.cx-caret{display:inline-block;width:7px;height:14px;background:var(--dsw-alias-label-primary);vertical-align:text-bottom;margin-left:2px;animation:cx-blink 1s step-end infinite}
@keyframes cx-blink{50%{opacity:0}}
.cx-composer{flex:none;padding:10px 18px 14px;border-top:1px solid var(--dsw-alias-border-l1);background:transparent}
.cx-composer-inner{max-width:820px;margin:0 auto}
.cx-composer-box{border:1px solid var(--dsw-alias-border-l2);border-radius:14px;background:rgba(0,0,0,.18);padding:10px 12px}
.cx-textarea{width:100%;border:none;outline:none;resize:none;background:transparent;color:var(--dsw-alias-label-primary);font-size:14px;line-height:1.6;font-family:inherit;min-height:44px;max-height:180px}
.cx-textarea::placeholder{color:var(--dsw-alias-label-secondary)}
.cx-composer-foot{display:flex;align-items:center;gap:8px;margin-top:8px}
.cx-spacer{flex:1}
.cx-model{position:relative}
.cx-model-menu{position:absolute;bottom:calc(100% + 6px);left:0;min-width:220px;max-height:300px;overflow-y:auto;background:var(--dsw-alias-bg-overlay);border:1px solid var(--dsw-alias-border-l2);border-radius:10px;padding:6px;z-index:20;box-shadow:0 4px 16px rgba(0,0,0,.18)}
.cx-model-group{font-size:11px;color:var(--dsw-alias-label-secondary);padding:6px 8px 2px;font-weight:600}
.cx-model-item{display:block;width:100%;text-align:left;border:none;background:none;color:var(--dsw-alias-label-primary);font-size:12px;padding:5px 8px;border-radius:6px;cursor:pointer}
.cx-model-item:hover{background:var(--dsw-alias-bg-layer-2)}
.cx-model-item-sel{color:var(--dsw-alias-brand-primary);font-weight:600}
.cx-token{font-size:11px;color:var(--dsw-alias-label-secondary);margin-top:6px}
.cx-hero{flex:1;display:flex;align-items:center;justify-content:center;min-height:0;padding:24px}
.cx-hero-inner{max-width:460px;width:100%;text-align:center}
.cx-hero-logo{font-size:52px;font-weight:700;color:var(--dsw-alias-brand-primary);margin-bottom:8px}
.cx-hero-h1{font-size:20px;font-weight:700;margin:0 0 6px}
.cx-hero-p{font-size:13px;color:var(--dsw-alias-label-secondary);margin:0 0 20px}
.cx-hero-btn{font-size:14px;padding:8px 22px;border-radius:10px}
.cx-hero-ws{margin-top:24px;text-align:left}
.cx-hero-ws-label{font-size:12px;color:var(--dsw-alias-label-secondary);margin-bottom:8px}
.cx-hero-ws-item{display:flex;align-items:center;gap:10px;width:100%;text-align:left;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);border-radius:10px;padding:10px 12px;margin-bottom:6px;cursor:pointer;color:var(--dsw-alias-label-primary)}
.cx-hero-ws-item:hover{border-color:var(--dsw-alias-brand-primary)}
.cx-hero-ws-title{font-size:13px;font-weight:600}
.cx-hero-ws-path{font-size:11px;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cx-side{display:flex;flex-direction:column;height:100%;min-height:0;background:transparent;border-right:1px solid var(--dsw-alias-border-l1)}
.cx-side-head{display:flex;align-items:center;gap:8px;padding:14px 16px 10px;font-weight:700;font-size:15px;flex:none}
.cx-side-logo{color:var(--dsw-alias-brand-primary)}
.cx-side-new{margin:0 12px 10px;flex:none}
.cx-side-label{font-size:11px;color:var(--dsw-alias-label-secondary);padding:6px 16px 4px;text-transform:uppercase;letter-spacing:.5px;flex:none}
.cx-side-list{flex:1;min-height:0;overflow-y:auto;padding:0 8px 12px}
.cx-side-item{display:flex;flex-direction:column;gap:2px;width:100%;text-align:left;border:none;background:none;color:var(--dsw-alias-label-primary);border-radius:8px;padding:8px 10px;margin-bottom:2px;cursor:pointer}
.cx-side-item:hover{background:var(--dsw-alias-bg-layer-2)}
.cx-side-item-cur{background:var(--dsw-alias-bg-layer-2)}
.cx-side-item-top{display:flex;align-items:center;gap:6px;min-width:0}
.cx-side-item-dot{width:7px;height:7px;border-radius:50%;flex:none;background:var(--dsw-alias-label-secondary)}
.cx-side-item-dot-run{background:var(--dsw-alias-state-success-primary);animation:cx-pulse 1.2s ease-in-out infinite}
.cx-side-item-title{font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.cx-side-item-time{font-size:11px;color:var(--dsw-alias-label-secondary);padding-left:13px}
.cx-side-empty{font-size:12px;color:var(--dsw-alias-label-secondary);text-align:center;padding:20px 8px}
.cx-side-rail{display:flex;flex-direction:column;align-items:center;gap:8px;padding:12px 0;height:100%;box-sizing:border-box;background:transparent;border-right:1px solid var(--dsw-alias-border-l1)}
.cx-rail-btn{width:32px;height:32px;border:none;background:none;color:var(--dsw-alias-label-primary);font-size:16px;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center}
.cx-rail-btn:hover{background:var(--dsw-alias-bg-layer-2)}
`

    // CSS 注入（与主题 bundle 相同的 style 标签约定）
    const tagId = '@dsh-external/dsh-plugin-codex-ui/codex.css'
    if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css=' + JSON.stringify(tagId) + ']') === null) {
      const tag = document.createElement('style')
      tag.dataset.plugin = '@dsh-external/dsh-plugin-codex-ui'
      tag.dataset.pluginCss = tagId
      tag.textContent = CSS
      document.head.appendChild(tag)
    }

    // ---- Host RPC（同源 fetch）----
    function getApi(path) {
      return fetch(path).then((r) => r.json()).catch(() => null)
    }
    function postApi(path, args) {
      return fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args || {}),
      }).then((r) => r.json()).catch(() => null)
    }

    function inline(text) {
      const out = []
      const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(\[[^\]]+\]\([^)]+\))/g
      let last = 0
      let m = null
      let k = 0
      while ((m = re.exec(text)) !== null) {
        if (m.index > last) out.push(text.slice(last, m.index))
        if (m[1]) out.push(React.createElement('code', { key: 'c' + k++ }, m[1].slice(1, -1)))
        else if (m[2]) out.push(React.createElement('strong', { key: 'b' + k++ }, m[2].slice(2, -2)))
        else if (m[3]) out.push(React.createElement('em', { key: 'i' + k++ }, m[3].slice(1, -1)))
        else if (m[4]) {
          const mm = /^\[([^\]]+)\]\(([^)]+)\)/.exec(m[4])
          if (mm) out.push(React.createElement('a', { key: 'a' + k++, href: mm[2], target: '_blank', rel: 'noreferrer' }, mm[1]))
        }
        last = re.lastIndex
      }
      if (last < text.length) out.push(text.slice(last))
      return out
    }

    function renderMd(text) {
      const lines = String(text || '').split('\n')
      const out = []
      let i = 0
      let inCode = false
      let codeBuf = []
      let listBuf = []
      let k = 0
      while (i < lines.length) {
        const line = lines[i]
        if (/^```/.test(line)) {
          if (inCode) {
            out.push(React.createElement('pre', { key: 'code' + k++ }, React.createElement('code', null, codeBuf.join('\n'))))
            codeBuf = []
            inCode = false
          } else {
            inCode = true
          }
          i++
          continue
        }
        if (inCode) {
          codeBuf.push(line)
          i++
          continue
        }
        const h = /^(#{1,4})\s+(.*)/.exec(line)
        if (h) {
          if (listBuf.length) {
            out.push(React.createElement('ul', { key: 'ul' + k++ }, listBuf))
            listBuf = []
          }
          out.push(React.createElement('h' + h[1].length, { key: 'h' + k++ }, ...inline(h[2])))
          i++
          continue
        }
        const li = /^\s*[-*]\s+(.*)/.exec(line)
        if (li) {
          listBuf.push(React.createElement('li', { key: 'li' + k++ }, ...inline(li[1])))
          i++
          continue
        }
        if (listBuf.length) {
          out.push(React.createElement('ul', { key: 'ul' + k++ }, listBuf))
          listBuf = []
        }
        if (/^\s*$/.test(line)) {
          i++
          continue
        }
        out.push(React.createElement('p', { key: 'p' + k++ }, ...inline(line)))
        i++
      }
      if (inCode && codeBuf.length) {
        out.push(React.createElement('pre', { key: 'code' + k++ }, React.createElement('code', null, codeBuf.join('\n'))))
      }
      if (listBuf.length) {
        out.push(React.createElement('ul', { key: 'ul' + k++ }, listBuf))
      }
      return out
    }

    function nodeText(node) {
      const blocks = node.content || []
      return blocks.filter((b) => b.type === 'text').map((b) => b.text).join('\n')
    }

    function renderBlocks(blocks, base) {
      const out = []
      let k = 0
      for (const b of blocks || []) {
        if (b.kind === 'text') {
          out.push(React.createElement('div', { key: base + 't' + k++ }, ...renderMd(b.text)))
        } else if (b.kind === 'reasoning') {
          out.push(React.createElement('details', { key: base + 'r' + k++, className: 'cx-reasoning' },
            React.createElement('summary', null, '思考过程'),
            React.createElement('div', null, ...renderMd(b.text))))
        } else if (b.kind === 'tool-call') {
          out.push(React.createElement('div', { key: base + 'tc' + k++, className: 'cx-tool' },
            React.createElement('div', { className: 'cx-tool-head' }, '🔧 ' + b.name),
            React.createElement('pre', { className: 'cx-tool-body' }, String(b.argsRaw || '').slice(0, 400))))
        }
      }
      return out
    }

    function renderNode(node) {
      switch (node.kind) {
        case 'user':
        case 'steering':
          return React.createElement('div', { key: node.seq, className: 'cx-row cx-user' },
            React.createElement('div', { className: 'cx-avatar' }, '你'),
            React.createElement('div', { className: 'cx-bubble cx-bubble-user' }, nodeText(node) || '…'))
        case 'assistant': {
          const kids = renderBlocks(node.blocks, 'n' + node.seq + '-')
          if (node.interrupted) kids.push(React.createElement('div', { key: 'int', className: 'cx-meta' }, '⏹ 已停止'))
          return React.createElement('div', { key: node.seq, className: 'cx-row' },
            React.createElement('div', { className: 'cx-avatar' }, 'AI'),
            React.createElement('div', { className: 'cx-bubble cx-bubble-assistant' }, ...kids))
        }
        case 'tool-result': {
          const name = (node.call && node.call.name) || node.callId
          const text = nodeText(node).slice(0, 500) || '…'
          return React.createElement('div', { key: node.seq, className: 'cx-tool' },
            React.createElement('div', { className: 'cx-tool-head' }, name, node.isError ? React.createElement('span', null, ' ✗') : React.createElement('span', null, ' ✓')),
            React.createElement('pre', { className: 'cx-tool-body' }, text))
        }
        case 'command': {
          const line = '/' + (node.name || '命令') + (node.outcome ? (node.outcome.kind === 'success' ? ' ✓' : ' ✗') : ' …')
          return React.createElement('div', { key: node.seq, className: 'cx-meta' }, '⌘ ' + line)
        }
        case 'compaction': {
          const s = node.summary ? '：' + node.summary.slice(0, 80) : ''
          return React.createElement('div', { key: node.seq, className: 'cx-meta' }, '📦 已压缩历史' + s)
        }
        case 'turn-error':
          return React.createElement('div', { key: node.seq, className: 'cx-err' }, '✗ ' + (node.message || '回合失败'))
        case 'turn-max-tokens':
          return React.createElement('div', { key: node.seq, className: 'cx-meta' }, '⚠ 达到输出 token 上限')
        case 'model-retry':
          return React.createElement('div', { key: node.seq, className: 'cx-meta' }, '🔄 模型请求重试中…')
        case 'context':
          return React.createElement('div', { key: node.seq, className: 'cx-meta' }, '📎 上下文注入')
        default:
          return null
      }
    }

    function timeAgo(ts) {
      if (!ts) return ''
      const n = typeof ts === 'number' && ts < 1e12 ? ts * 1000 : ts
      const diff = Date.now() - n
      if (diff < 60e3) return '刚刚'
      if (diff < 3600e3) return Math.floor(diff / 60e3) + ' 分钟前'
      if (diff < 86400e3) return Math.floor(diff / 3600e3) + ' 小时前'
      if (diff < 7 * 86400e3) return Math.floor(diff / 86400e3) + ' 天前'
      const d = new Date(n)
      return (d.getMonth() + 1) + '/' + d.getDate()
    }

    const inject = ['slots']

    function apply(ctx) {
      const slots = ctx.get('slots')
      if (slots === undefined) return
      const sessionsSvc = ctx.get('sessions')
      const workspacesSvc = ctx.get('workspaces')

      function Hero(props) {
        const workspaces = props.workspaces
        const items = (workspaces && workspaces.items) || []
        const start = () => { if (workspacesSvc && workspacesSvc.startSession) workspacesSvc.startSession() }
        const openWs = (id) => { if (workspacesSvc && workspacesSvc.startSession) workspacesSvc.startSession(id) }
        const wsList = items.map((w) => React.createElement('button', {
          key: w.workspaceId,
          className: 'cx-hero-ws-item',
          onClick: () => openWs(w.workspaceId),
        },
          React.createElement('span', { className: 'cx-hero-ws-title' }, w.title),
          React.createElement('span', { className: 'cx-hero-ws-path' }, w.path)))
        const wsBlock = items.length > 0
          ? React.createElement('div', { className: 'cx-hero-ws' },
              React.createElement('div', { className: 'cx-hero-ws-label' }, '工作区'),
              ...wsList)
          : null
        return React.createElement('div', { className: 'cx-hero' },
          React.createElement('div', { className: 'cx-hero-inner' },
            React.createElement('div', { className: 'cx-hero-logo' }, '⌘'),
            React.createElement('div', { className: 'cx-hero-h1' }, 'DeepSeek Harness'),
            React.createElement('div', { className: 'cx-hero-p' }, 'Codex 风格任务界面 · 选择工作区或新建任务'),
            React.createElement('button', { className: 'cx-btn cx-btn-primary cx-hero-btn', onClick: start }, '＋ 新建任务'),
            wsBlock))
      }

      function CodexSidebar(props) {
        const sessions = props.useSessions((s) => s)
        const wide = props.wide
        const expandSidebar = props.expandSidebar
        if (!wide) {
          return React.createElement('div', { className: 'cx-side-rail' },
            React.createElement('button', { className: 'cx-rail-btn', title: '新建任务', onClick: () => { if (workspacesSvc && workspacesSvc.startSession) workspacesSvc.startSession() } }, '⌘'),
            React.createElement('button', { className: 'cx-rail-btn', title: '展开', onClick: () => { if (expandSidebar) expandSidebar() } }, '»'))
        }
        const ids = (sessions && sessions.ids) || []
        const rows = ids
          .map((id) => sessions.byId[id])
          .filter((s) => s && !s.blank)
          .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
        const items = rows.map((s) => React.createElement('button', {
          key: s.id,
          className: 'cx-side-item' + (sessions.current === s.id ? ' cx-side-item-cur' : ''),
          onClick: () => { if (sessionsSvc && sessionsSvc.open) sessionsSvc.open(s.id) },
        },
          React.createElement('div', { className: 'cx-side-item-top' },
            React.createElement('span', { className: 'cx-side-item-dot' + (s.running ? ' cx-side-item-dot-run' : '') }),
            React.createElement('span', { className: 'cx-side-item-title' }, s.displayTitle || s.id)),
          React.createElement('span', { className: 'cx-side-item-time' }, timeAgo(s.updatedAt))))
        return React.createElement('div', { className: 'cx-side' },
          React.createElement('div', { className: 'cx-side-head' },
            React.createElement('span', { className: 'cx-side-logo' }, '⌘'),
            React.createElement('span', null, 'Tasks')),
          React.createElement('button', { className: 'cx-btn cx-btn-primary cx-side-new', onClick: () => { if (workspacesSvc && workspacesSvc.startSession) workspacesSvc.startSession() } }, '＋ New Task'),
          React.createElement('div', { className: 'cx-side-label' }, '历史任务'),
          React.createElement('div', { className: 'cx-side-list' },
            items.length === 0 ? React.createElement('div', { className: 'cx-side-empty' }, '暂无任务，点击 New Task 开始') : items))
      }

      function ModelPicker(props) {
        const data = props.data
        const current = props.current
        const onChange = props.onChange
        const [open, setOpen] = React.useState(false)
        const label = current && current.model ? current.model : '选择模型'
        const providers = (data && data.providers) || []
        const items = providers.map((p) => React.createElement('div', { key: p.id },
          React.createElement('div', { className: 'cx-model-group' }, p.name),
          (p.models || []).map((m) => {
            const sel = current && current.provider === p.id && current.model === m.id
            return React.createElement('button', {
              key: m.id,
              className: 'cx-model-item' + (sel ? ' cx-model-item-sel' : ''),
              onClick: () => { onChange(p.id, m.id); setOpen(false) },
            }, m.name)
          })))
        const empty = providers.length === 0 ? React.createElement('div', { className: 'cx-model-group' }, '无可用模型') : null
        return React.createElement('div', { className: 'cx-model' },
          React.createElement('button', { className: 'cx-btn', onClick: () => setOpen(!open) }, '⚙ ' + label),
          open ? React.createElement('div', { className: 'cx-model-menu' }, empty, ...items) : null)
      }

      function SessionView(props) {
        const snap = props.snap
        const input = props.input
        const inputActions = props.inputActions
        const sessionId = props.sessionId
        const sessions = props.sessions
        const useProjection = props.useProjection
        const [models, setModels] = React.useState(null)
        const [planActive, setPlanActive] = React.useState(false)
        const [listEl, setListEl] = React.useState(null)
        const summary = sessions && sessions.byId ? sessions.byId[sessionId] : undefined
        const title = summary ? summary.displayTitle : sessionId
        const running = !!snap.running
        const nodes = snap.nodes || []
        const partial = snap.partial
        const runningCalls = snap.runningCalls || []
        const queue = snap.queue || []
        const pending = snap.pending || []
        const tokenUsage = useProjection('tokenUsage')

        React.useEffect(() => {
          let alive = true
          getApi('/codex-api/models').then((r) => { if (alive) setModels(r) }).catch(() => {})
          getApi('/codex-api/plan?sessionId=' + encodeURIComponent(sessionId)).then((r) => { if (alive && r) setPlanActive(!!r.active) }).catch(() => {})
          return () => { alive = false }
        }, [sessionId])

        React.useEffect(() => {
          if (listEl) listEl.scrollTop = listEl.scrollHeight
        }, [listEl, nodes.length, !!partial, runningCalls.length, queue.length])

        const saveModel = (provider, model) => {
          postApi('/codex-api/saveModel', { provider, model }).then((r) => {
            if (r && r.ok) setModels((prev) => prev ? { ...prev, current: { provider, model } } : prev)
          }).catch(() => {})
        }
        const togglePlan = () => {
          const next = !planActive
          setPlanActive(next)
          postApi('/codex-api/planSet', { sessionId, active: next }).catch(() => {})
        }
        const stop = () => {
          const b = sessionsSvc && sessionsSvc.binding ? sessionsSvc.binding(sessionId) : undefined
          if (b && b.session && b.session.cancel) b.session.cancel().catch(() => {})
        }
        const send = () => {
          if (inputActions && input && input.draft && input.draft.trim()) inputActions.submit()
        }
        const onKey = (e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault()
            send()
          }
        }

        const msgChildren = []
        if (snap.openState === 'loading') msgChildren.push(React.createElement('div', { key: 'st-load', className: 'cx-meta' }, '加载中…'))
        if (snap.openError) msgChildren.push(React.createElement('div', { key: 'st-open-err', className: 'cx-err' }, '打开失败：' + String((snap.openError && snap.openError.message) || snap.openError)))
        if (snap.promptError) {
          const op = snap.promptError.op === 'send' ? '发送失败' : '停止失败'
          msgChildren.push(React.createElement('div', { key: 'st-prompt-err', className: 'cx-err' }, op + '：' + String((snap.promptError.error && snap.promptError.error.message) || snap.promptError.error)))
        }
        for (const node of nodes) {
          const el = renderNode(node)
          if (el) msgChildren.push(el)
        }
        for (const p of pending) {
          msgChildren.push(React.createElement('div', { key: p.key, className: 'cx-meta' }, '⏸ 等待' + (p.kind === 'approval' ? '审批' : '交互') + '…'))
        }
        for (const rc of runningCalls) {
          msgChildren.push(React.createElement('div', { key: rc.callId, className: 'cx-tool cx-tool-running' },
            React.createElement('div', { className: 'cx-tool-head' }, '⚙ ' + rc.name),
            React.createElement('pre', { className: 'cx-tool-body' }, String(rc.argsRaw || '').slice(0, 300))))
        }
        for (const q of queue) {
          msgChildren.push(React.createElement('div', { key: q.messageId, className: 'cx-meta' }, '⏳ 排队：' + (q.preview || '…')))
        }
        if (partial) {
          const partialText = partial.blocks.filter((b) => b.kind === 'text').map((b) => b.text).join('')
          msgChildren.push(React.createElement('div', { key: 'partial', className: 'cx-row' },
            React.createElement('div', { className: 'cx-avatar' }, 'AI'),
            React.createElement('div', { className: 'cx-bubble cx-bubble-assistant' },
              partialText ? renderMd(partialText) : null,
              React.createElement('span', { className: 'cx-caret' }))))
        }

        const tokenLine = tokenUsage ? 'Tokens · 输入 ' + (tokenUsage.uncachedInputTokens || 0) + ' · 输出 ' + (tokenUsage.outputTokens || 0) + ' · 缓存 ' + ((tokenUsage.cacheReadTokens || 0) + (tokenUsage.cacheWriteTokens || 0)) : ''
        const canSend = !!(input && input.draft && input.draft.trim())
        const newTask = () => { if (workspacesSvc && workspacesSvc.startSession) workspacesSvc.startSession() }

        const headerChildren = []
        headerChildren.push(React.createElement('div', { key: 'title', className: 'cx-title' }, title))
        headerChildren.push(React.createElement('span', { key: 'dot', className: 'cx-dot' + (running ? ' cx-dot-run' : '') }))
        headerChildren.push(React.createElement('button', { key: 'new', className: 'cx-btn', onClick: newTask }, '＋ 新任务'))
        headerChildren.push(React.createElement(ModelPicker, { key: 'model', data: models, current: models && models.current, onChange: saveModel }))
        headerChildren.push(React.createElement('button', { key: 'plan', className: 'cx-btn' + (planActive ? ' cx-btn-on' : ''), onClick: togglePlan }, planActive ? 'Plan' : 'Auto'))
        if (running) headerChildren.push(React.createElement('button', { key: 'stop', className: 'cx-btn cx-btn-stop', onClick: stop }, '⏹ 停止'))

        const footChildren = []
        footChildren.push(React.createElement('span', { key: 'tok', className: 'cx-token' }, tokenLine))
        footChildren.push(React.createElement('div', { key: 'sp', className: 'cx-spacer' }))
        if (running) footChildren.push(React.createElement('button', { key: 'stop', className: 'cx-btn cx-btn-stop', onClick: stop }, '⏹ 停止'))
        footChildren.push(React.createElement('button', { key: 'send', className: 'cx-btn cx-btn-primary', onClick: send, disabled: !canSend }, '发送'))

        const header = React.createElement('div', { className: 'cx-header' }, ...headerChildren)
        const scroll = React.createElement('div', { className: 'cx-scroll', ref: (el) => { if (el !== listEl) setListEl(el) } },
          React.createElement('div', { className: 'cx-msglist' }, ...msgChildren))
        const textarea = React.createElement('textarea', {
          className: 'cx-textarea',
          placeholder: running ? '运行中 · 输入可排队或干预' : '描述你的任务…',
          value: input ? input.draft : '',
          onChange: (e) => { if (inputActions) inputActions.setDraft(e.target.value) },
          onKeyDown: onKey,
          rows: 2,
        })
        const foot = React.createElement('div', { className: 'cx-composer-foot' }, ...footChildren)
        const box = React.createElement('div', { className: 'cx-composer-box' }, textarea, foot)
        const composer = React.createElement('div', { className: 'cx-composer' },
          React.createElement('div', { className: 'cx-composer-inner' }, box))
        return React.createElement('div', { className: 'cx-root' }, header, scroll, composer)
      }

      function CodexApp(props) {
        const sessions = props.useSessions((s) => s)
        const workspaces = props.useWorkspaces((s) => s)
        const snap = props.useSession((s) => s)
        const input = props.useInput((s) => s)
        const sessionId = props.sessionId
        if (!sessionId || !snap) {
          return React.createElement(Hero, { workspaces, sessions })
        }
        return React.createElement(SessionView, {
          snap,
          input,
          inputActions: props.inputActions,
          sessionId,
          sessions,
          useProjection: props.useProjection,
        })
      }

      slots.inject('conversation', () => slots.register(
        { name: 'conversation', priority: -1 },
        (props) => React.createElement(CodexApp, props)))

      slots.inject('sidebar.workspaces', () => slots.register(
        { name: 'sidebar.workspaces', priority: -1 },
        (props) => React.createElement(CodexSidebar, props)))
    }

    exports.apply = apply
    exports.inject = inject
    return module.exports
  },
})
