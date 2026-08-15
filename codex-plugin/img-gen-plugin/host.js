// ComfyUI AI 生图 — Host half
// 函数体（与 cordis_define 的 code.host 一致）。
// 提供：
//   1. harness.handle('imggen') — 提交 workflow 到 ComfyUI 生成图像，轮询结果，返回 base64 + URL
//   2. harness.handle('imgModels') — 列出 ComfyUI 可用模型（checkpoint/controlnet/放大模型）
//   3. webServer /gen-img 路由 — 从 ComfyUI 输出目录 serve 图片（供对话内嵌显示）
// 注意：所有 HTTP 走 subprocess + node fetch（沙箱无全局 fetch，且 curl 有 Schannel 问题）。
const DEFAULT_WORKFLOW = 'E:\\xiazai\\airi-aom3-blue-watercolor-fullbody-2k.json'
const COMFY_BASE = 'http://127.0.0.1:8188'
const COMFY_OUTPUT = 'D:\\ComfyUI\\ComfyUI\\output'
return {
  inject: ['timer'],
  apply(ctx) {
    const sub = ctx.get('subprocess')
    const webServer = ctx.get('webServer')
    const fsService = ctx.get('fs')

    // 注册 /gen-img/<filename> 路由：从 ComfyUI output 目录 serve 图片（供对话内嵌显示）
    if (webServer && fsService) {
      try {
        // 注意：不用 ctx.effect 包裹 dispose —— 动态插件里 ctx.effect 会在 apply 后立即清理路由，
        // 导致 /gen-img 注册后马上失效（探针已证实）。裸注册可保持路由长期有效。
        webServer.register({
          kind: 'prefix',
          path: '/gen-img',
          handler: async (req, res) => {
            try {
              const u = new URL(req.url || '/', 'http://x')
              const filename = decodeURIComponent(u.pathname.replace(/^\/gen-img\//, ''))
              if (!filename || filename.indexOf('..') !== -1 || filename.indexOf('/') !== -1) {
                res.writeHead(400, { 'Content-Type': 'text/plain' })
                res.end('bad filename')
                return
              }
              const target = await fsService.resolve(COMFY_OUTPUT + '\\' + filename)
              const bytes = await fsService.readBytes(target, undefined, 64 * 1024 * 1024)
              res.writeHead(200, { 'Content-Type': 'image/png', 'Content-Length': bytes.length })
              res.end(bytes)
            } catch (e) {
              res.writeHead(404, { 'Content-Type': 'text/plain' })
              res.end('image not found')
            }
          },
        })
      } catch (e) {
        console.log('gen-img route already registered:', e && e.message)
      }
    }

    harness.handle('imgModels', async () => {
      return await listModels()
    })

    harness.handle('imggen', async (args) => {
      const a = args || {}
      const workflowPath = a.workflowPath || DEFAULT_WORKFLOW
      const workflow = await readJson(workflowPath)
      if (!workflow) return { ok: false, error: '无法读取 workflow 文件：' + workflowPath }
      try {
        const graph = buildGraph(workflow, a)
        const result = await runComfy(graph)
        return result
      } catch (e) {
        return { ok: false, error: String((e && e.message) || e) }
      }
    })

    async function listModels() {
      const info = await fetchJson(COMFY_BASE + '/object_info')
      if (!info) return { ok: false, error: '无法连接 ComfyUI（' + COMFY_BASE + '）' }
      const ckpts = (info.CheckpointLoaderSimple && info.CheckpointLoaderSimple.input && info.CheckpointLoaderSimple.input.required && info.CheckpointLoaderSimple.input.required.ckpt_name && info.CheckpointLoaderSimple.input.required.ckpt_name[0]) || []
      const cns = (info.ControlNetLoader && info.ControlNetLoader.input && info.ControlNetLoader.input.required && info.ControlNetLoader.input.required.control_net_name && info.ControlNetLoader.input.required.control_net_name[0]) || []
      const upscales = (info.UpscaleModelLoader && info.UpscaleModelLoader.input && info.UpscaleModelLoader.input.required && info.UpscaleModelLoader.input.required.model_name && info.UpscaleModelLoader.input.required.model_name[0]) || []
      return { ok: true, checkpoints: ckpts, controlnets: cns, upscaleModels: upscales }
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
      const promptRes = await fetchJson(COMFY_BASE + '/prompt', {
        method: 'POST',
        body: JSON.stringify({ prompt: graph }),
        headers: { 'Content-Type': 'application/json' },
      })
      if (!promptRes) return { ok: false, error: '提交到 ComfyUI 失败' }
      if (promptRes.error) return { ok: false, error: 'ComfyUI 错误: ' + JSON.stringify(promptRes.error).slice(0, 300) }
      const promptId = promptRes.prompt_id
      if (!promptId) return { ok: false, error: 'ComfyUI 未返回 prompt_id' }

      let history = null
      const deadline = Date.now() + 120000
      while (Date.now() < deadline) {
        await sleep(1000)
        history = await fetchJson(COMFY_BASE + '/history/' + promptId)
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
        const r = await fetchBytes(COMFY_BASE + '/view?' + q)
        if (!r) return null
        let bin = ''
        const CHUNK = 0x8000
        for (let i = 0; i < r.length; i += CHUNK) {
          bin += String.fromCharCode.apply(null, r.subarray(i, i + CHUNK))
        }
        return btoa(bin)
      } catch (e) {
        console.error('view image failed:', e && e.message)
        return null
      }
    }

    async function httpRequest(url, opts) {
      const method = (opts && opts.method) || 'GET'
      const body = opts && opts.body
      const script = "const r = await fetch(process.argv[1], { method: process.argv[2], body: process.argv[3] || undefined, headers: { 'Content-Type': 'application/json' } }); const t = await r.text(); console.log(JSON.stringify({ status: r.status, text: t }));"
      const nodePath = await sub.resolveExecutable('node')
      const h = sub.spawn({
        argv: [nodePath, '-e', script, url, method, body || ''],
        cwd: 'E:\\harness',
        stdio: { stdin: 'ignore', stdout: { maxBytes: 64 * 1024 * 1024 }, stderr: { maxBytes: 64 * 1024 } },
        graceMs: 3000,
      })
      const outcome = await h.done
      const stdout = h.collected && h.collected.stdout ? h.collected.stdout.readFrom(0).text : ''
      if (outcome.exitCode !== 0) return null
      try {
        return JSON.parse(stdout.trim())
      } catch (e) {
        return null
      }
    }

    async function fetchJson(url, opts) {
      const r = await httpRequest(url, opts)
      if (!r || r.status < 200 || r.status >= 300) {
        if (opts && opts.method === 'POST') return r || null
        return null
      }
      try { return JSON.parse(r.text) } catch (e) { return null }
    }

    async function fetchBytes(url) {
      const script = "const r = await fetch(process.argv[1]); const b = Buffer.from(await r.arrayBuffer()); console.log(b.toString('base64'));"
      const nodePath = await sub.resolveExecutable('node')
      const h = sub.spawn({
        argv: [nodePath, '-e', script, url],
        cwd: 'E:\\harness',
        stdio: { stdin: 'ignore', stdout: { maxBytes: 128 * 1024 * 1024 }, stderr: { maxBytes: 64 * 1024 } },
        graceMs: 3000,
      })
      const outcome = await h.done
      const stdout = h.collected && h.collected.stdout ? h.collected.stdout.readFrom(0).text.trim() : ''
      if (outcome.exitCode !== 0 || !stdout) return null
      return decodeBase64(stdout)
    }

    function decodeBase64(b64) {
      const bin = atob(b64)
      const bytes = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
      return bytes
    }

    async function readJson(path) {
      try {
        const script = "const fs = require('fs'); const p = process.argv[1]; console.log(fs.readFileSync(p, 'utf8'));"
        const nodePath = await sub.resolveExecutable('node')
        const h = sub.spawn({
          argv: [nodePath, '-e', script, path],
          cwd: 'E:\\harness',
          stdio: { stdin: 'ignore', stdout: { maxBytes: 4 * 1024 * 1024 }, stderr: { maxBytes: 64 * 1024 } },
          graceMs: 3000,
        })
        const outcome = await h.done
        const stdout = h.collected && h.collected.stdout ? h.collected.stdout.readFrom(0).text : ''
        if (outcome.exitCode !== 0) return null
        return JSON.parse(stdout)
      } catch (e) {
        console.error('read workflow failed:', e && e.message)
        return null
      }
    }

    function sleep(ms) {
      return new Promise((resolve) => {
        try { ctx.timeout(resolve, ms) } catch (e) { setTimeout(resolve, ms) }
      })
    }
  },
}
