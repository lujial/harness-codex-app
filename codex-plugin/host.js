async function __hostWrap() {
const BG_PATH = 'E:\\harness\\codex-app\\file_000000008c5482308b72a1c4d0367ceb.png'
return {
  apply(ctx) {
    const llm = ctx.get('llm')
    const adm = ctx.get('agentDefaultModel')
    const planMode = ctx.get('planMode')
    const agents = ctx.get('agents')
    const webServer = ctx.get('webServer')
    const fsService = ctx.get('fs')

    if (webServer && fsService) {
      try {
        const dispose = webServer.register({
          kind: 'exact',
          path: '/codex-bg.png',
          handler: async (req, res) => {
            try {
              const target = await fsService.resolve(BG_PATH)
              const bytes = await fsService.readBytes(target, undefined, 20 * 1024 * 1024)
              res.writeHead(200, { 'Content-Type': 'image/png', 'Content-Length': bytes.length })
              res.end(bytes)
            } catch (e) {
              res.writeHead(404, { 'Content-Type': 'text/plain' })
              res.end('background image not found')
            }
          },
        })
        ctx.effect(() => dispose())
      } catch (e) {
        console.log('codex bg route already registered, reusing existing route:', e && e.message)
      }
    }

    harness.handle('models', async () => {
      const providers = []
      const infos = llm && llm.listProviders ? llm.listProviders() : []
      for (const p of infos) {
        let models = []
        try {
          const ms = await llm.listModels(p.id)
          models = (ms || []).map((m) => ({ id: m.id, name: m.name }))
        } catch (e) {
          models = []
        }
        providers.push({ id: p.id, name: p.name, models })
      }
      let current = null
      try {
        const sel = adm && adm.currentSelection ? adm.currentSelection() : null
        if (sel && sel.provider) current = { provider: sel.provider, model: sel.model }
      } catch (e) {
        current = null
      }
      return { providers, current }
    })

    harness.handle('saveModel', async (args) => {
      const a = args || {}
      if (!adm || !adm.saveSelection) return { ok: false, error: 'no agentDefaultModel service' }
      try {
        await adm.saveSelection({ provider: a.provider, model: a.model })
        return { ok: true }
      } catch (e) {
        return { ok: false, error: String((e && e.message) || e) }
      }
    })

    harness.handle('plan', async (args) => {
      const a = args || {}
      const agent = agents && agents.get ? agents.get(a.sessionId) : undefined
      if (!agent || !planMode || !planMode.get) return { active: false }
      try {
        const st = planMode.get(agent)
        return { active: !!(st && st.active) }
      } catch (e) {
        return { active: false }
      }
    })

    harness.handle('planSet', async (args) => {
      const a = args || {}
      const agent = agents && agents.get ? agents.get(a.sessionId) : undefined
      if (!agent || !planMode || !planMode.set) return { ok: false, error: 'no planMode service' }
      try {
        planMode.set(agent, !!a.active)
        return { ok: true }
      } catch (e) {
        return { ok: false, error: String((e && e.message) || e) }
      }
    })
  },
}
}
