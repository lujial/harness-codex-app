// DeepSeek 额度查询 — Host half
// 函数体（与 cordis_define 的 code.host 一致）。用 subprocess + node fetch 查询余额，
// 绕过 DSH shell 沙箱下 curl Schannel TLS 凭据失败（SEC_E_NO_CREDENTIALS）的问题。
return {
  inject: ['timer'],
  apply(ctx) {
    const credentials = ctx.get('credentials')
    const sub = ctx.get('subprocess')

    harness.handle('balance', async () => {
      const key = await resolveKey()
      if (!key) return { ok: false, error: '未找到 DeepSeek API Key（请先在 设置→模型 中配置）' }
      return await fetchBalance(key)
    })

    async function resolveKey() {
      try {
        if (credentials && credentials.resolve) {
          const hit = await credentials.resolve('DEEPSEEK_API_KEY')
          if (hit && hit.value) return hit.value
        }
      } catch (e) {
        console.error('resolve credential failed:', e && e.message)
      }
      return undefined
    }

    async function fetchBalance(apiKey) {
      if (!sub || !sub.resolveExecutable || !sub.spawn) {
        return { ok: false, error: 'subprocess 服务不可用，无法查询余额' }
      }
      let h = null
      let timer = null
      try {
        const nodePath = await sub.resolveExecutable('node')
        const script = "const r = await fetch('https://api.deepseek.com/user/balance', { headers: { Authorization: 'Bearer " + apiKey + "', Accept: 'application/json' } }); const t = await r.text(); console.log(JSON.stringify({ status: r.status, body: t }));"
        h = sub.spawn({
          argv: [nodePath, '-e', script],
          cwd: 'E:\\harness',
          stdio: { stdin: 'ignore', stdout: { maxBytes: 1 * 1024 * 1024 }, stderr: { maxBytes: 64 * 1024 } },
          graceMs: 3000,
        })
        try {
          timer = ctx.timeout ? ctx.timeout(() => { if (h) h.terminate() }, 20000) : null
        } catch (e) {
          timer = null
        }
        const outcome = await h.done
        if (timer) { try { timer() } catch (e) { } timer = null }
        const stdout = h.collected && h.collected.stdout ? h.collected.stdout.readFrom(0).text : ''
        const stderr = h.collected && h.collected.stderr ? h.collected.stderr.readFrom(0).text : ''
        if (outcome.exitCode !== 0) {
          return { ok: false, error: '余额查询失败（exit ' + outcome.exitCode + '）：' + (stderr || '').slice(0, 200) }
        }
        let parsed
        try {
          parsed = JSON.parse(stdout.trim())
        } catch (e) {
          return { ok: false, error: '余额接口返回异常：' + stdout.slice(0, 200) }
        }
        if (!parsed || parsed.status !== 200) {
          return { ok: false, error: '余额接口返回状态 ' + (parsed && parsed.status) + '：' + String((parsed && parsed.body) || '').slice(0, 200) }
        }
        let json
        try {
          json = JSON.parse(parsed.body)
        } catch (e) {
          return { ok: false, error: '余额接口返回非 JSON：' + String(parsed.body).slice(0, 200) }
        }
        if (!json || typeof json !== 'object') return { ok: false, error: '余额接口返回异常' }
        return { ok: true, balance: json }
      } catch (e) {
        if (timer) { try { timer() } catch (e2) { } }
        return { ok: false, error: String((e && e.message) || e) }
      }
    }
  },
}
