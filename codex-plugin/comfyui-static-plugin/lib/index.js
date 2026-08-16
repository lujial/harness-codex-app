// @dsh-external/dsh-plugin-comfyui — Host half
// 静态 profile bundle（ESM，运行在完整 Node 环境）：
//   - 全局 fetch / process / Buffer / setTimeout 都可用（无需动态插件的 subprocess hack）
//   - webServer 路由：
//       POST /comfy-api/imggen      — 提交 workflow 到本地 ComfyUI 生成图像，轮询结果，返回 base64 + URL
//       GET  /comfy-api/imgModels   — 列出 ComfyUI 可用模型（checkpoint/controlnet/放大模型）
//       GET  /comfy-api/balance     — 查询 DeepSeek 账户余额（credentials 服务解析 API Key）
//       GET  /gen-img/<filename>    — 从 ComfyUI 输出目录 serve 图片（供对话内嵌显示）
// 与动态插件不同，本插件是 profile 组合的静态行：服务启动即加载，页面刷新/重启不丢失。
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

export const name = 'comfyui-static'
export const inject = ['webServer']

const DEFAULT_WORKFLOW = 'E:\\xiazai\\airi-aom3-blue-watercolor-fullbody-2k.json'
const COMFY_BASE = 'http://127.0.0.1:8188'
const COMFY_OUTPUT = 'D:\\ComfyUI\\ComfyUI\\output'

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

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

  // /gen-img 前缀：serve ComfyUI 输出图片（对话内嵌 URL http://127.0.0.1:3080/gen-img/<file>）
  try {
    ctx.effect(() => webServer.register({
      kind: 'prefix',
      path: '/gen-img',
      handler: async (req, res) => {
        try {
          const u = new URL(req.url || '/', 'http://x')
          const filename = decodeURIComponent(u.pathname.replace(/^\/gen-img\//, ''))
          if (!filename || filename.includes('..') || filename.includes('/')) {
            res.writeHead(400, { 'Content-Type': 'text/plain' })
            res.end('bad filename')
            return
          }
          const bytes = await readFile(resolve(COMFY_OUTPUT, filename))
          res.writeHead(200, { 'Content-Type': 'image/png', 'Content-Length': bytes.length })
          res.end(bytes)
        } catch (e) {
          res.writeHead(404, { 'Content-Type': 'text/plain' })
          res.end('image not found')
        }
      },
    }), 'comfyui-static: /gen-img')
  } catch (e) {
    // 路由已存在（历史动态插件残留）时忽略
  }

  // GET /comfy-api/imgModels
  ctx.effect(() => webServer.register({
    kind: 'exact',
    path: '/comfy-api/imgModels',
    handler: async (req, res) => {
      try {
        const info = await fetchJson(COMFY_BASE + '/object_info')
        if (!info) {
          sendJson(res, 200, { ok: false, error: '无法连接 ComfyUI（' + COMFY_BASE + '）' })
          return
        }
        const ckpts = pickList(info, 'CheckpointLoaderSimple', 'ckpt_name')
        const cns = pickList(info, 'ControlNetLoader', 'control_net_name')
        const upscales = pickList(info, 'UpscaleModelLoader', 'model_name')
        sendJson(res, 200, { ok: true, checkpoints: ckpts, controlnets: cns, upscaleModels: upscales })
      } catch (e) {
        sendJson(res, 200, { ok: false, error: String((e && e.message) || e) })
      }
    },
  }), 'comfyui-static: imgModels')

  // POST /comfy-api/imggen
  ctx.effect(() => webServer.register({
    kind: 'exact',
    path: '/comfy-api/imggen',
    handler: async (req, res) => {
      let args = {}
      if (req.method === 'POST') {
        try {
          args = JSON.parse(await readBody(req) || '{}')
        } catch (e) {
          sendJson(res, 200, { ok: false, error: '请求体不是合法 JSON' })
          return
        }
      }
      const workflowPath = args.workflowPath || DEFAULT_WORKFLOW
      const workflow = await readJson(workflowPath)
      if (!workflow) {
        sendJson(res, 200, { ok: false, error: '无法读取 workflow 文件：' + workflowPath })
        return
      }
      try {
        const graph = buildGraph(workflow, args)
        const result = await runComfy(graph)
        sendJson(res, 200, result)
      } catch (e) {
        sendJson(res, 200, { ok: false, error: String((e && e.message) || e) })
      }
    },
  }), 'comfyui-static: imggen')

  // GET /comfy-api/balance
  ctx.effect(() => webServer.register({
    kind: 'exact',
    path: '/comfy-api/balance',
    handler: async (req, res) => {
      const credentials = ctx.get('credentials')
      let key
      try {
        if (credentials && credentials.resolve) {
          const hit = await credentials.resolve('DEEPSEEK_API_KEY')
          if (hit && hit.value) key = hit.value
        }
      } catch (e) {
        console.error('resolve credential failed:', e && e.message)
      }
      if (!key) {
        sendJson(res, 200, { ok: false, error: '未找到 DeepSeek API Key（请先在 设置→模型 中配置）' })
        return
      }
      try {
        const r = await fetch('https://api.deepseek.com/user/balance', {
          headers: { Authorization: 'Bearer ' + key, Accept: 'application/json' },
        })
        const body = await r.text()
        if (r.status !== 200) {
          sendJson(res, 200, { ok: false, error: '余额接口返回状态 ' + r.status + '：' + body.slice(0, 200) })
          return
        }
        const json = JSON.parse(body)
        sendJson(res, 200, { ok: true, balance: json })
      } catch (e) {
        sendJson(res, 200, { ok: false, error: String((e && e.message) || e) })
      }
    },
  }), 'comfyui-static: balance')

  // ---- 内部工具 ----

  function pickList(info, nodeType, field) {
    try {
      const node = info[nodeType]
      const req0 = node && node.input && node.input.required
      const list = req0 && req0[field] && req0[field][0]
      return Array.isArray(list) ? list : []
    } catch (e) {
      return []
    }
  }

  function buildGraph(workflow, opts) {
    const g = JSON.parse(JSON.stringify(workflow))
    for (const [id, node] of Object.entries(g)) {
      if (!node || !node.class_type) continue
      const ct = node.class_type
      if (ct === 'CheckpointLoaderSimple') {
        if (opts.checkpoint) node.inputs.ckpt_name = opts.checkpoint
      } else if (ct === 'CLIPTextEncode') {
        const title = (node._meta && node._meta.title) || ''
        if (title.indexOf('负') !== -1 || title.indexOf('Negative') !== -1) {
          if (opts.negative) node.inputs.text = opts.negative
        } else {
          if (opts.prompt) node.inputs.text = opts.prompt
        }
      } else if (ct === 'KSampler') {
        if (opts.seed !== undefined && opts.seed !== null && opts.seed !== '') node.inputs.seed = Number(opts.seed)
        if (opts.steps) node.inputs.steps = Number(opts.steps)
        if (opts.cfg) node.inputs.cfg = Number(opts.cfg)
        if (opts.sampler) node.inputs.sampler_name = opts.sampler
      } else if (ct === 'EmptyLatentImage') {
        if (opts.width) node.inputs.width = Number(opts.width)
        if (opts.height) node.inputs.height = Number(opts.height)
      } else if (ct === 'SaveImage') {
        if (opts.prefix) node.inputs.filename_prefix = opts.prefix
      }
    }
    return g
  }

  async function runComfy(graph) {
    const promptRes = await fetch(COMFY_BASE + '/prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: graph }),
    })
    if (!promptRes.ok) return { ok: false, error: '提交到 ComfyUI 失败: HTTP ' + promptRes.status }
    const promptData = await promptRes.json().catch(() => null)
    if (!promptData) return { ok: false, error: 'ComfyUI 无响应' }
    if (promptData.error) return { ok: false, error: 'ComfyUI 错误: ' + JSON.stringify(promptData.error).slice(0, 300) }
    const promptId = promptData.prompt_id
    if (!promptId) return { ok: false, error: 'ComfyUI 未返回 prompt_id' }

    let history = null
    const deadline = Date.now() + 120000
    while (Date.now() < deadline) {
      await sleep(1000)
      try {
        const hres = await fetch(COMFY_BASE + '/history/' + promptId)
        if (hres.ok) history = await hres.json().catch(() => null)
      } catch (e) { /* 重试 */ }
      if (history && history[promptId]) {
        const entry = history[promptId]
        if (entry.outputs) break
        if (entry.status && entry.status.status_str === 'error') {
          const msgs = (entry.status.messages || []).map((m) => JSON.stringify(m[1])).slice(0, 3)
          return { ok: false, error: '生成失败: ' + (msgs.join('; ') || '未知错误') }
        }
      }
    }
    if (!history || !history[promptId] || !history[promptId].outputs) {
      return { ok: false, error: '生成超时（120 秒）' }
    }
    const outputs = history[promptId].outputs
    const images = []
    for (const nodeId of Object.keys(outputs)) {
      const out = outputs[nodeId]
      if (out && out.images) {
        for (const img of out.images) images.push(img)
      }
    }
    if (images.length === 0) return { ok: false, error: '未找到生成结果' }
    const first = images[0]
    const b64 = await fetchImageBase64(first.filename, first.subfolder, first.type)
    if (!b64) return { ok: false, error: '无法读取生成图片' }
    // 同时返回 Harness 可访问的 URL（供对话内嵌显示）
    const url = 'http://127.0.0.1:3080/gen-img/' + encodeURIComponent(first.filename)
    return { ok: true, image: b64, filename: first.filename, width: first.width, height: first.height, url }
  }

  async function fetchImageBase64(filename, subfolder, type) {
    try {
      const q = 'filename=' + encodeURIComponent(filename) + (subfolder ? '&subfolder=' + encodeURIComponent(subfolder) : '') + '&type=' + encodeURIComponent(type || 'output')
      const r = await fetch(COMFY_BASE + '/view?' + q)
      if (!r.ok) return null
      const buf = Buffer.from(await r.arrayBuffer())
      return buf.toString('base64')
    } catch (e) {
      console.error('view image failed:', e && e.message)
      return null
    }
  }

  async function fetchJson(url) {
    try {
      const r = await fetch(url)
      if (!r.ok) return null
      return await r.json()
    } catch (e) {
      return null
    }
  }

  async function readJson(path) {
    try {
      const text = await readFile(path, 'utf8')
      return JSON.parse(text)
    } catch (e) {
      console.error('read workflow failed:', e && e.message)
      return null
    }
  }
}
