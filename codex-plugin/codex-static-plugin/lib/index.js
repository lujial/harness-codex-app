// @dsh-external/dsh-plugin-codex-ui — Host half
// 静态 profile bundle（ESM，完整 Node 环境）：Codex 风格界面的 Host 支持。
// 原动态插件（codex-1）用 harness.handle 提供 RPC；静态版改为 webServer HTTP 路由：
//   GET  /codex-api/models      — 模型/提供方列表 + 当前选择
//   POST /codex-api/saveModel   — 保存模型选择
//   GET  /codex-api/plan        — 查询会话 Plan 模式
//   POST /codex-api/planSet     — 设置会话 Plan 模式
//   GET  /codex-bg.png          — 界面背景图
// Client 半通过同源 fetch 调用这些路由。
import { readFile } from 'node:fs/promises'

export const name = 'codex-static'
export const inject = ['webServer']

const BG_PATH = 'E:\\harness\\codex-app\\file_000000008c5482308b72a1c4d0367ceb.png'

async function readBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return Buffer.concat(chunks).toString('utf8')
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  })
  res.end(body)
}

export function apply(ctx) {
  const webServer = ctx.get('webServer')
  if (webServer === undefined) return

  // 背景图
  try {
    ctx.effect(() => webServer.register({
      kind: 'exact',
      path: '/codex-bg.png',
      handler: async (req, res) => {
        try {
          const bytes = await readFile(BG_PATH)
          res.writeHead(200, { 'Content-Type': 'image/png', 'Content-Length': bytes.length })
          res.end(bytes)
        } catch (e) {
          res.writeHead(404, { 'Content-Type': 'text/plain' })
          res.end('background image not found')
        }
      },
    }), 'codex-static: /codex-bg.png')
  } catch (e) {
    // 已存在则忽略（历史动态插件残留）
  }

  // GET /codex-api/models
  ctx.effect(() => webServer.register({
    kind: 'exact',
    path: '/codex-api/models',
    handler: async (req, res) => {
      const llm = ctx.get('llm')
      const adm = ctx.get('agentDefaultModel')
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
      sendJson(res, 200, { providers, current })
    },
  }), 'codex-static: models')

  // POST /codex-api/saveModel
  ctx.effect(() => webServer.register({
    kind: 'exact',
    path: '/codex-api/saveModel',
    handler: async (req, res) => {
      let a = {}
      if (req.method === 'POST') {
        try {
          a = JSON.parse(await readBody(req) || '{}')
        } catch (e) {
          sendJson(res, 200, { ok: false, error: '请求体不是合法 JSON' })
          return
        }
      }
      const adm = ctx.get('agentDefaultModel')
      if (!adm || !adm.saveSelection) {
        sendJson(res, 200, { ok: false, error: 'no agentDefaultModel service' })
        return
      }
      try {
        await adm.saveSelection({ provider: a.provider, model: a.model })
        sendJson(res, 200, { ok: true })
      } catch (e) {
        sendJson(res, 200, { ok: false, error: String((e && e.message) || e) })
      }
    },
  }), 'codex-static: saveModel')

  // GET /codex-api/plan?sessionId=...
  ctx.effect(() => webServer.register({
    kind: 'exact',
    path: '/codex-api/plan',
    handler: async (req, res) => {
      const agents = ctx.get('agents')
      const planMode = ctx.get('planMode')
      let sessionId = ''
      try {
        sessionId = new URL(req.url || '', 'http://x').searchParams.get('sessionId') || ''
      } catch (e) { /* ignore */ }
      const agent = agents && agents.get ? agents.get(sessionId) : undefined
      if (!agent || !planMode || !planMode.get) {
        sendJson(res, 200, { active: false })
        return
      }
      try {
        const st = planMode.get(agent)
        sendJson(res, 200, { active: !!(st && st.active) })
      } catch (e) {
        sendJson(res, 200, { active: false })
      }
    },
  }), 'codex-static: plan')

  // POST /codex-api/planSet
  ctx.effect(() => webServer.register({
    kind: 'exact',
    path: '/codex-api/planSet',
    handler: async (req, res) => {
      let a = {}
      if (req.method === 'POST') {
        try {
          a = JSON.parse(await readBody(req) || '{}')
        } catch (e) {
          sendJson(res, 200, { ok: false, error: '请求体不是合法 JSON' })
          return
        }
      }
      const agents = ctx.get('agents')
      const planMode = ctx.get('planMode')
      const agent = agents && agents.get ? agents.get(a.sessionId) : undefined
      if (!agent || !planMode || !planMode.set) {
        sendJson(res, 200, { ok: false, error: 'no planMode service' })
        return
      }
      try {
        planMode.set(agent, !!a.active)
        sendJson(res, 200, { ok: true })
      } catch (e) {
        sendJson(res, 200, { ok: false, error: String((e && e.message) || e) })
      }
    },
  }), 'codex-static: planSet')
}
