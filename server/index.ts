/**
 * server/index.ts
 * Express app bootstrap with CORS, JSON body, static uploads, routes, and error handling.
 * 后台首页改为「管理员登录/管理面板」（中文）。
 */

import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'node:path'
import { getDB, getSettings } from './db'

// Routers
import authRoutes from './routes/auth'
import userRoutes from './routes/users'
import walletRoutes from './routes/wallet'
import ledgerRoutes from './routes/ledger'
import depositRoutes from './routes/deposits'
import withdrawalRoutes from './routes/withdrawals'
import exchangeRoutes from './routes/exchange'
import transferRoutes from './routes/transfer'
import kycRoutes from './routes/kyc'
import notificationsRoutes from './routes/notifications'
import adminRoutes from './routes/admin'

const app = express()
const PORT = Number(process.env.PORT || 8787)

// CORS
app.use(
  cors({
    origin: '*', // Dev only. Lock down in production.
  }),
)

// Body parsers
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true }))

// Static uploads
const uploadsDir = path.resolve(process.cwd(), 'server', 'uploads')
app.use('/uploads', express.static(uploadsDir))

/**
 * GET /
 * 管理后台（中文）：未登录显示“管理员登录”，登录成功显示“管理面板”。
 * 说明：采用前端 localStorage 保存 admin_token，所有设置接口使用 Authorization: Bearer <token>。
 */
app.get('/', (_req, res) => {
  const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <title>管理后台</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root { color-scheme: light dark; }
    * { box-sizing: border-box; }
    body { margin:0; padding:24px; font: 14px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif; background:#0b1020; color:#e5e7eb; }
    .wrap { max-width: 980px; margin: 0 auto; }
    .card { background: rgba(17, 24, 39, 0.7); border: 1px solid rgba(55,65,81,.6); border-radius: 16px; padding: 16px 18px; backdrop-filter: blur(8px); box-shadow: 0 10px 30px rgba(0,0,0,.2); }
    .title { font-size: 22px; font-weight: 700; margin: 0 0 6px; }
    .muted { color: #94a3b8; font-size: 12px; margin: 0; }
    .grid { display: grid; gap: 14px; }
    .grid.cols-2 { grid-template-columns: 1fr; }
    @media (min-width: 900px) { .grid.cols-2 { grid-template-columns: 1fr 1fr; } }
    .btn { display:inline-flex; align-items:center; gap:8px; background:#4f46e5; color:#fff; border:0; border-radius:10px; padding:10px 14px; cursor:pointer; font-weight:600; }
    .btn:active { transform: scale(.99); }
    .btn.secondary { background: #0ea5e9; }
    .btn.ghost { background: transparent; border: 1px solid rgba(148,163,184,.4); color:#cbd5e1; }
    .input, .select, .textarea { width: 100%; background: rgba(2,6,23,.7); color:#e5e7eb; border: 1px solid rgba(71,85,105,.6); border-radius: 10px; padding: 10px 12px; font: inherit; }
    .textarea { min-height: 120px; resize: vertical; }
    .row { display:grid; grid-template-columns: 110px 1fr; gap:10px; align-items:center; }
    .mt-2{ margin-top:8px; } .mt-3{ margin-top:12px; } .mt-4{ margin-top:16px; } .mt-6{ margin-top:24px; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
    pre { background: rgba(2,6,23,.7); color:#e5e7eb; padding:12px; border-radius:12px; border:1px solid rgba(71,85,105,.6); overflow:auto; max-height:50vh; }
    .badge { display:inline-block; padding:2px 8px; border-radius:999px; font-size:12px; border:1px solid rgba(148,163,184,.4); color:#bfdbfe; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <h1 class="title">管理后台 <span class="badge">Admin</span></h1>
      <p class="muted">默认管理员：<span class="mono">admin / admin123</span>（可通过环境变量 ADMIN_USER / ADMIN_PASS 修改）</p>
    </div>

    <!-- 登录卡片 -->
    <section id="loginCard" class="card mt-4" style="display:none;">
      <h2 class="title">管理员登录</h2>
      <div class="grid">
        <div class="row mt-2">
          <label for="user">用户名</label>
          <input id="user" class="input" placeholder="admin" />
        </div>
        <div class="row">
          <label for="pass">密码</label>
          <input id="pass" type="password" class="input" placeholder="••••••••" />
        </div>
        <div>
          <button id="btnLogin" class="btn">登录</button>
        </div>
        <div>
          <pre id="loginOut">请输入管理员账号密码并点击“登录”。</pre>
        </div>
      </div>
    </section>

    <!-- 面板卡片 -->
    <section id="panelCard" class="card mt-4" style="display:none;">
      <h2 class="title">管理面板</h2>
      <p class="muted">在这里可管理前端的所有可配置项。修改后点击“保存设置”。</p>

      <div class="grid cols-2 mt-3">
        <div>
          <h3 class="title">品牌设置</h3>
          <div class="row mt-2">
            <label for="brand_name">品牌名称</label>
            <input id="brand_name" class="input" placeholder="例如：CCRC" />
          </div>
          <div class="row mt-2">
            <label for="brand_logo">Logo 链接</label>
            <input id="brand_logo" class="input" placeholder="https://..." />
          </div>
          <div class="row mt-2">
            <label for="theme_default">默认主题</label>
            <select id="theme_default" class="select">
              <option value="light">浅色</option>
              <option value="dark">深色</option>
            </select>
          </div>
        </div>

        <div>
          <h3 class="title">首页轮播</h3>
          <p class="muted">每行一个图片链接。</p>
          <textarea id="hero_images" class="textarea" placeholder="https://.../a.jpg\nhttps://.../b.jpg"></textarea>
        </div>

        <div>
          <h3 class="title">合作伙伴</h3>
          <p class="muted">JSON 数组：[{ "name": "...", "src": "图片", "gradient": "from-... to-..." }]</p>
          <textarea id="partners" class="textarea" placeholder='[{"name":"Facebook","src":"https://...","gradient":"from-blue-600 to-indigo-600"}]'></textarea>
        </div>

        <div>
          <h3 class="title">合规说明</h3>
          <div class="row mt-2">
            <label for="compliance_title">标题</label>
            <input id="compliance_title" class="input" placeholder="合规与合作声明" />
          </div>
          <p class="muted mt-2">要点：每行一条</p>
          <textarea id="compliance_points" class="textarea" placeholder="要点一\n要点二"></textarea>
        </div>
      </div>

      <div class="mt-3">
        <button id="btnLoad" class="btn ghost">重新加载</button>
        <button id="btnSave" class="btn">保存设置</button>
        <button id="btnLogout" class="btn secondary">退出登录</button>
      </div>

      <div class="mt-3">
        <pre id="panelOut">点击“重新加载”来获取当前设置。</pre>
      </div>
    </section>

    <section class="card mt-4">
      <h2 class="title">公开配置接口</h2>
      <p class="muted">GET <span class="mono">/config</span> 返回对前端公开的配置（无需登录）。</p>
      <div class="mt-2"><button id="btnGetConfig" class="btn ghost">查看 /config</button></div>
      <pre id="configOut" class="mt-2">点击“查看 /config”以预览。</pre>
    </section>

    <section class="card mt-4">
      <h2 class="title">开发者工具</h2>
      <p class="muted">原“后端开发面板”已移动至 <a href="/dev" target="_blank" rel="noreferrer" style="color:#93c5fd;text-decoration:none;">/dev</a></p>
    </section>
  </div>

  <script>
    const LS_TOKEN_KEY = 'admin_token'

    function hasToken() {
      try { return !!localStorage.getItem(LS_TOKEN_KEY) } catch { return false }
    }
    function saveToken(t) {
      try { localStorage.setItem(LS_TOKEN_KEY, t) } catch {}
    }
    function readToken() {
      try { return localStorage.getItem(LS_TOKEN_KEY) || '' } catch { return '' }
    }
    function clearToken() {
      try { localStorage.removeItem(LS_TOKEN_KEY) } catch {}
    }

    function showLogin() {
      document.getElementById('loginCard').style.display = ''
      document.getElementById('panelCard').style.display = 'none'
    }
    function showPanel() {
      document.getElementById('loginCard').style.display = 'none'
      document.getElementById('panelCard').style.display = ''
    }

    // 初始化：根据是否有 token 决定显示哪个卡片
    if (hasToken()) showPanel(); else showLogin();

    // 登录
    document.getElementById('btnLogin').addEventListener('click', async () => {
      const out = document.getElementById('loginOut')
      out.textContent = '正在登录...'
      try {
        const username = document.getElementById('user').value.trim()
        const password = document.getElementById('pass').value.trim()
        const res = await fetch('/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        })
        const data = await res.json()
        if (!res.ok) { out.textContent = '登录失败：' + (data && data.error || res.statusText); return }
        saveToken(data.token)
        out.textContent = '登录成功'
        showPanel()
      } catch (e) {
        out.textContent = '请求错误：' + (e && e.message || e)
      }
    })

    // 退出
    document.getElementById('btnLogout').addEventListener('click', () => {
      clearToken()
      showLogin()
      document.getElementById('panelOut').textContent = '已退出登录。'
    })

    // 重新加载设置
    document.getElementById('btnLoad').addEventListener('click', async () => {
      const out = document.getElementById('panelOut')
      out.textContent = '正在加载设置...'
      try {
        const res = await fetch('/admin/settings', {
          headers: { Authorization: 'Bearer ' + readToken() },
        })
        const data = await res.json()
        if (!res.ok) { out.textContent = '加载失败：' + (data && data.error || res.statusText); return }

        const s = data.settings || {}
        document.getElementById('brand_name').value = s.brand_name || ''
        document.getElementById('brand_logo').value = s.brand_logo || ''
        document.getElementById('theme_default').value = s.theme_default === 'dark' ? 'dark' : 'light'
        document.getElementById('hero_images').value = Array.isArray(s.hero_images) ? s.hero_images.join('\\n') : ''
        document.getElementById('compliance_title').value = s.compliance_title || ''
        document.getElementById('compliance_points').value = Array.isArray(s.compliance_points) ? s.compliance_points.join('\\n') : ''
        document.getElementById('partners').value = s.partners ? JSON.stringify(s.partners, null, 2) : '[]'

        out.textContent = JSON.stringify(s, null, 2)
      } catch (e) {
        out.textContent = '请求错误：' + (e && e.message || e)
      }
    })

    // 保存设置
    document.getElementById('btnSave').addEventListener('click', async () => {
      const out = document.getElementById('panelOut')
      out.textContent = '正在保存...'
      try {
        const body = {}
        body.brand_name = document.getElementById('brand_name').value.trim()
        body.brand_logo = document.getElementById('brand_logo').value.trim()
        body.theme_default = document.getElementById('theme_default').value

        const heroRaw = document.getElementById('hero_images').value
        body.hero_images = heroRaw.split(/\\r?\\n/).map(s => s.trim()).filter(Boolean)

        body.compliance_title = document.getElementById('compliance_title').value.trim()
        const compRaw = document.getElementById('compliance_points').value
        body.compliance_points = compRaw.split(/\\r?\\n/).map(s => s.trim()).filter(Boolean)

        try {
          const partnersRaw = document.getElementById('partners').value.trim()
          body.partners = partnersRaw ? JSON.parse(partnersRaw) : []
        } catch (e) {
          out.textContent = '保存失败：合作伙伴 JSON 解析错误 - ' + e.message
          return
        }

        const res = await fetch('/admin/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + readToken() },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (!res.ok) { out.textContent = '保存失败：' + (data && data.error || res.statusText); return }
        out.textContent = '保存成功\\n\\n' + JSON.stringify(data.settings, null, 2)
      } catch (e) {
        out.textContent = '请求错误：' + (e && e.message || e)
      }
    })

    // 查看公开配置
    document.getElementById('btnGetConfig').addEventListener('click', async () => {
      const out = document.getElementById('configOut')
      out.textContent = '请求中...'
      try {
        const r = await fetch('/config')
        const t = await r.text()
        try { out.textContent = JSON.stringify(JSON.parse(t), null, 2) } catch { out.textContent = t }
      } catch (e) {
        out.textContent = '请求错误：' + (e && e.message || e)
      }
    })
  </script>
</body>
</html>`
  res.type('html').send(html)
})

/**
 * GET /dev
 * 原“后端开发面板”，保留便于调试。
 */
app.get('/dev', (_req, res) => {
  // 旧版开发面板（简化 caption）
  const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <title>开发者面板</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root { color-scheme: light dark; } * { box-sizing: border-box }
    body { margin:0; padding:24px; background:#0b1020; color:#e5e7eb; font: 14px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans" }
    .wrap { max-width:980px; margin:0 auto } .card{ background: rgba(17,24,39,.7); border:1px solid rgba(55,65,81,.6); border-radius:16px; padding:16px 18px; backdrop-filter: blur(8px) }
    .title{ font-size:22px; font-weight:700; margin:0 0 6px } .btn{ background:#4f46e5; color:#fff; border:0; border-radius:10px; padding:10px 14px; font-weight:600; cursor:pointer }
    .input,.textarea,.select{ width:100%; background: rgba(2,6,23,.7); color:#e5e7eb; border:1px solid rgba(71,85,105,.6); border-radius:10px; padding:10px 12px; font: inherit }
    pre{ background: rgba(2,6,23,.7); color:#e5e7eb; padding:12px; border-radius:12px; border:1px solid rgba(71,85,105,.6); overflow:auto; max-height:50vh }
    .grid{ display:grid; gap:14px } .row{ display:grid; grid-template-columns: 120px 1fr; gap:10px; align-items:center }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <h1 class="title">开发者面板</h1>
      <p>健康检查、REST 调试等。</p>
    </div>
    <section class="card" style="margin-top:16px">
      <h2 class="title">健康检查</h2>
      <button id="btnHealth" class="btn">GET /health</button>
      <pre id="healthOut" style="margin-top:12px">点击按钮发起请求</pre>
    </section>

    <section class="card" style="margin-top:16px">
      <h2 class="title">REST 调试</h2>
      <div class="grid">
        <div class="row"><label>Method</label><select id="method" class="select"><option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option></select></div>
        <div class="row"><label>Path</label><input id="path" class="input" value="/health" /></div>
        <div class="row"><label>Bearer</label><input id="token" class="input" placeholder="可选：粘贴 token" /></div>
        <div><label>Body(JSON)</label><textarea id="body" class="textarea" placeholder='{"email":"a@b.com","password":"***"}'></textarea></div>
        <div><button id="sendBtn" class="btn">发送</button></div>
        <div><pre id="respOut">响应显示区域</pre></div>
      </div>
    </section>
  </div>
  <script>
    document.getElementById('btnHealth').addEventListener('click', async () => {
      const out = document.getElementById('healthOut'); out.textContent = '请求中...'
      try { const r = await fetch('/health'); const t = await r.text(); try { out.textContent = JSON.stringify(JSON.parse(t), null, 2) } catch { out.textContent = t } } catch(e){ out.textContent = '错误：' + (e && e.message || e) }
    })
    document.getElementById('sendBtn').addEventListener('click', async () => {
      const m = document.getElementById('method').value
      const p = document.getElementById('path').value.trim() || '/health'
      const token = document.getElementById('token').value.trim()
      const bodyRaw = document.getElementById('body').value.trim()
      const out = document.getElementById('respOut'); out.textContent = '请求 ' + m + ' ' + p + ' ...'
      const headers = {}; if (token) headers['Authorization'] = 'Bearer ' + token
      let body = undefined
      if (!/^GET|HEAD$/i.test(m) && bodyRaw) { try { body = JSON.stringify(JSON.parse(bodyRaw)); headers['Content-Type'] = 'application/json' } catch(err){ out.textContent = 'JSON 格式错误：' + err.message; return } }
      try {
        const res = await fetch(p, { method: m, headers, body })
        const text = await res.text(); let parsed; try { parsed = JSON.parse(text) } catch { parsed = text }
        const headersObj = {}; res.headers.forEach((v,k)=> headersObj[k]=v)
        out.textContent = JSON.stringify({ ok: res.ok, status: res.status, statusText: res.statusText, headers: headersObj, body: parsed }, null, 2)
      } catch(e){ out.textContent = '请求错误：' + (e && e.message || e) }
    })
  </script>
</body>
</html>`
  res.type('html').send(html)
})

/**
 * GET /health
 * Health check. Touch DB to ensure initialized.
 */
app.get('/health', (_req, res) => {
  // Touch DB to ensure initialized
  try {
    getDB()
    res.json({ ok: true, db: true, version: '1.0.0' })
  } catch {
    res.status(500).json({ ok: false, db: false })
  }
})

// 公开配置（给前端读取）
app.get('/config', (_req, res) => {
  try {
    const s = getSettings()
    // 可公开的键
    const pub: Record<string, any> = {
      brand_name: s.brand_name || 'CCRC',
      brand_logo: s.brand_logo || '',
      theme_default: s.theme_default === 'dark' ? 'dark' : 'light',
      hero_images: Array.isArray(s.hero_images) ? s.hero_images : [],
      partners: Array.isArray(s.partners) ? s.partners : [],
      compliance_title: s.compliance_title || '合规与合作声明',
      compliance_points: Array.isArray(s.compliance_points) ? s.compliance_points : [],
    }
    res.json(pub)
  } catch (e: any) {
    res.status(500).json({ error: e?.message || '读取配置失败' })
  }
})

// Mount routes
app.use('/auth', authRoutes)
app.use('/users', userRoutes)
app.use('/wallet', walletRoutes)
app.use('/ledger', ledgerRoutes)
app.use('/deposits', depositRoutes)
app.use('/withdrawals', withdrawalRoutes)
app.use('/exchange', exchangeRoutes)
app.use('/transfer', transferRoutes)
app.use('/kyc', kycRoutes)
app.use('/notifications', notificationsRoutes)
app.use('/admin', adminRoutes)

// Fallback 404
app.use((_req, res) => res.status(404).json({ error: 'Not found' }))

// Start
app.listen(PORT, () => {
  console.log('[server] listening on http://localhost:' + PORT)
})
