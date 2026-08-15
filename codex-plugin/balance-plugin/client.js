// DeepSeek 额度查询 — Client half
// 函数体（与 cordis_define 的 code.client 一致）。注册设置页"额度查询"，
// 并叠加 deep-whale 主题侧边栏遮挡修复（不修改人物任何样式）。
const CSS = `
.bl-root{display:flex;flex-direction:column;gap:16px;padding:4px 2px;font-size:13px;line-height:1.6}
.bl-head{font-size:16px;font-weight:700;margin:0 0 4px}
.bl-desc{color:var(--dsw-alias-label-secondary);font-size:12px;margin:0 0 8px}
.bl-card{background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-radius:12px;padding:14px 16px}
.bl-card-title{font-size:12px;color:var(--dsw-alias-label-secondary);margin:0 0 6px;text-transform:uppercase;letter-spacing:.4px}
.bl-amount{font-size:26px;font-weight:700;color:var(--dsw-alias-label-primary)}
.bl-amount-sub{font-size:12px;color:var(--dsw-alias-label-secondary);margin-left:6px}
.bl-row{display:flex;justify-content:space-between;gap:10px;padding:6px 0;border-bottom:1px solid var(--dsw-alias-border-l1)}
.bl-row:last-child{border-bottom:none}
.bl-row-label{color:var(--dsw-alias-label-secondary)}
.bl-row-value{font-weight:600;color:var(--dsw-alias-label-primary)}
.bl-status{display:inline-flex;align-items:center;gap:6px;font-size:12px;margin-bottom:8px}
.bl-status-dot{width:8px;height:8px;border-radius:50%}
.bl-status-ok{color:var(--dsw-alias-state-success-primary)}
.bl-status-ok .bl-status-dot{background:var(--dsw-alias-state-success-primary)}
.bl-status-err{color:var(--dsw-alias-state-error-primary)}
.bl-status-err .bl-status-dot{background:var(--dsw-alias-state-error-primary)}
.bl-actions{display:flex;gap:8px;align-items:center}
.bl-btn{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);border-radius:8px;padding:6px 16px;font-size:13px;cursor:pointer}
.bl-btn:hover{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary)}
.bl-btn:disabled{opacity:.5;cursor:default}
.bl-btn-primary{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);color:#fff}
.bl-btn-primary:hover{color:#fff;opacity:.9}
.bl-err{color:var(--dsw-alias-state-error-primary);font-size:12px;padding:8px 12px;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-state-error-primary);border-radius:8px}
.bl-loading{color:var(--dsw-alias-label-secondary);font-size:12px}
.bl-hint{font-size:11px;color:var(--dsw-alias-label-secondary);margin-top:8px}
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

return {
  apply(ctx) {
    const slots = ctx.get('slots')
    if (slots === undefined) return
    ctx.effect(() => styles.insert(CSS))

    function fmt(n) {
      if (n === null || n === undefined || Number.isNaN(Number(n))) return '—'
      return Number(n).toFixed(2)
    }

    function BalancePage() {
      const [state, setState] = React.useState({ status: 'idle', data: null, error: null })

      const query = () => {
        setState({ status: 'loading', data: null, error: null })
        host.call('balance')
          .then((r) => {
            if (r && r.ok) setState({ status: 'ok', data: r.balance, error: null })
            else setState({ status: 'error', data: null, error: (r && r.error) || '查询失败' })
          })
          .catch((e) => setState({ status: 'error', data: null, error: String((e && e.message) || e) }))
      }

      const children = []
      children.push(React.createElement('div', { key: 'head', className: 'bl-head' }, '额度查询'))
      children.push(React.createElement('div', { key: 'desc', className: 'bl-desc' }, '查询 DeepSeek API 账户的剩余额度与可用状态（数据来自官方 /user/balance 接口）。'))

      if (state.status === 'loading') {
        children.push(React.createElement('div', { key: 'load', className: 'bl-loading' }, '查询中…'))
      } else if (state.status === 'error') {
        children.push(React.createElement('div', { key: 'err', className: 'bl-err' }, state.error))
      } else if (state.status === 'ok' && state.data) {
        const b = state.data
        const available = !!b.is_available
        const infos = (b.balance_infos || []).map((bi) => {
          const total = Number(bi.total_balance || 0)
          const granted = Number(bi.granted_balance || 0)
          const topped = Number(bi.topped_up_balance || 0)
          const used = Math.max(0, total - granted - topped)
          const rows = []
          rows.push(React.createElement('div', { key: 'total', className: 'bl-row' },
            React.createElement('span', { className: 'bl-row-label' }, '账户总额（' + (bi.currency || 'CNY') + '）'),
            React.createElement('span', { className: 'bl-row-value' }, fmt(total))))
          rows.push(React.createElement('div', { key: 'used', className: 'bl-row' },
            React.createElement('span', { className: 'bl-row-label' }, '已用'),
            React.createElement('span', { className: 'bl-row-value' }, fmt(used))))
          rows.push(React.createElement('div', { key: 'topped', className: 'bl-row' },
            React.createElement('span', { className: 'bl-row-label' }, '充值余额'),
            React.createElement('span', { className: 'bl-row-value' }, fmt(topped))))
          rows.push(React.createElement('div', { key: 'granted', className: 'bl-row' },
            React.createElement('span', { className: 'bl-row-label' }, '赠送余额'),
            React.createElement('span', { className: 'bl-row-value' }, fmt(granted))))
          return React.createElement('div', { key: bi.currency || 'default', className: 'bl-card' },
            React.createElement('div', { className: 'bl-card-title' }, '余额 ' + (bi.currency || 'CNY')),
            React.createElement('div', { className: 'bl-amount' }, fmt(granted + topped),
              React.createElement('span', { className: 'bl-amount-sub' }, '可用 / ' + fmt(total) + ' 总额')),
            rows)
        })
        const statusEl = React.createElement('div', { key: 'status', className: 'bl-status ' + (available ? 'bl-status-ok' : 'bl-status-err') },
          React.createElement('span', { className: 'bl-status-dot' }),
          React.createElement('span', null, available ? '账户可用' : '账户不可用'))
        children.push(statusEl)
        if (infos.length) children.push.apply(children, infos)
        else children.push(React.createElement('div', { key: 'noinfos', className: 'bl-card' }, '接口未返回余额明细'))
      }

      children.push(React.createElement('div', { key: 'actions', className: 'bl-actions' },
        React.createElement('button', {
          className: 'bl-btn bl-btn-primary',
          disabled: state.status === 'loading',
          onClick: query,
        }, state.status === 'loading' ? '查询中…' : '查询余额'),
        state.status === 'ok' ? React.createElement('button', { key: 'again', className: 'bl-btn', onClick: query }, '刷新') : null))

      children.push(React.createElement('div', { key: 'hint', className: 'bl-hint' }, '提示：API Key 读取自 DeepSeek 凭据（设置→模型 或 ~/.dsh/.credentials.yaml）。余额仅反映 DeepSeek 官方账户，非其他 provider。'))

      return React.createElement('div', { className: 'bl-root' }, ...children)
    }

    slots.inject('settings.section', () => slots.register(
      { name: 'settings.section', id: 'balance', order: 25, label: '额度查询' },
      () => React.createElement(BalancePage, null)))
  },
}
