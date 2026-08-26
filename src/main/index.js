import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { initializeDatabase, getRealm } from './database/realm.js'
import { registerIpcHandlers } from './ipc/handlers.js'
import { registerBackupHandlers } from './ipc/backup.js'
import fs from 'fs'

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    show: false,
    autoScaleBufferSize: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#1a365d',
      symbolColor: '#ffffff',
      height: 40
    },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler(({ browserWindow: openerWin }) => {
    return {
      action: 'allow',
      overrideBrowserWindow: {
        width: 900,
        height: 700,
        resizable: true,
        parent: openerWin,
        webPreferences: {
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: false
        }
      }
    }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.dental-lab.manager')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  initializeDatabase()
  registerIpcHandlers()
  registerBackupHandlers()

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    const realm = getRealm()
    if (realm && !realm.isClosed) {
      realm.close()
    }
    app.quit()
  }
})

app.on('before-quit', () => {
  const realm = getRealm()
  if (realm && !realm.isClosed) {
    realm.close()
  }
})
