// DeepSeek Harness Codex —— Electron 独立应用壳
// 作用：把 Harness Web 服务（默认 http://127.0.0.1:3080）包装为一个独立原生窗口。
// 打开窗口后，在 Harness 会话中运行 codex-1 插件即可看到 Codex 风格界面。
const { app, BrowserWindow, shell } = require('electron')

const HARNESS_URL = process.env.DSH_URL || 'http://127.0.0.1:3080'

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 900,
    minHeight: 600,
    title: 'DeepSeek Harness — Codex',
    backgroundColor: '#141414',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  win.loadURL(HARNESS_URL)

  // 目标为外部地址的链接交给系统浏览器，应用窗口保持独立
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(HARNESS_URL)) shell.openExternal(url)
    return { action: 'deny' }
  })

  win.on('page-title-updated', (event, title) => {
    if (title && !title.includes('Codex')) event.preventDefault()
  })

  return win
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
