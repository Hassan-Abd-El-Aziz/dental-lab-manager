import { ipcMain, dialog, app } from 'electron'
import fs from 'fs'
import path from 'path'
import { getRealm } from '../database/realm.js'

export function registerBackupHandlers() {
  ipcMain.handle('backup:create', async () => {
    try {
      const result = await dialog.showSaveDialog({
        title: 'إنشاء نسخة احتياطية',
        defaultPath: `DentalLab_Backup_${new Date().toISOString().split('T')[0]}.realmbackup`,
        filters: [{ name: 'نسخة احتياطية', extensions: ['realmbackup'] }]
      })
      if (result.canceled) return { canceled: true }
      const realm = getRealm()
      fs.copyFileSync(realm.path, result.filePath)
      return { success: true, path: result.filePath }
    } catch (error) {
      console.error('Backup error:', error)
      throw new Error('حدث خطأ أثناء إنشاء النسخة الاحتياطية')
    }
  })

  ipcMain.handle('reset:financialWithBackup', async () => {
    try {
      const result = await dialog.showSaveDialog({
        title: 'حفظ نسخة احتياطية قبل التصفير',
        defaultPath: `DentalLab_Backup_BeforeReset_${new Date().toISOString().split('T')[0]}.realmbackup`,
        filters: [{ name: 'نسخة احتياطية', extensions: ['realmbackup'] }]
      })
      if (result.canceled) return { canceled: true }
      const realm = getRealm()
      fs.copyFileSync(realm.path, result.filePath)
      const { resetFinancialData } = await import('../database/services/resetService.js')
      resetFinancialData()
      return { success: true, path: result.filePath }
    } catch (error) {
      console.error('Reset with backup error:', error)
      throw new Error('حدث خطأ أثناء العملية')
    }
  })

  ipcMain.handle('backup:restore', async () => {
    try {
      const result = await dialog.showOpenDialog({
        title: 'استعادة نسخة احتياطية',
        filters: [{ name: 'نسخة احتياطية', extensions: ['realmbackup'] }],
        properties: ['openFile']
      })
      if (result.canceled) return { canceled: true }
      const backupPath = result.filePaths[0]
      if (!fs.existsSync(backupPath)) throw new Error('الملف غير موجود')

      const realm = getRealm()
      const realmPath = realm.path
      realm.close()

      if (fs.existsSync(realmPath)) {
        const backupOldPath = realmPath + '.old'
        if (fs.existsSync(backupOldPath)) fs.unlinkSync(backupOldPath)
        fs.renameSync(realmPath, backupOldPath)
      }
      fs.copyFileSync(backupPath, realmPath)

      const lockPath = realmPath + '.lock'
      if (fs.existsSync(lockPath)) fs.unlinkSync(lockPath)

      return { success: true, needsRestart: true }
    } catch (error) {
      console.error('Restore error:', error)
      throw new Error('حدث خطأ أثناء استعادة النسخة الاحتياطية')
    }
  })

  ipcMain.handle('app:restart', async () => {
    const realm = getRealm()
    if (realm && !realm.isClosed) {
      realm.close()
    }
    app.relaunch()
    app.exit(0)
  })
}
