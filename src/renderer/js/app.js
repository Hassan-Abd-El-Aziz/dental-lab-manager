import { Router } from './router.js'
import { API } from './api.js'
import { Charts } from './charts.js'
import { Toast } from './components/toast.js'

import './dashboard.js'
import './dentists.js'
import './orders.js'
import './invoices.js'
import './payments.js'
import './expenses.js'
import './reports.js'
import './settings.js'

document.addEventListener('DOMContentLoaded', async () => {
  try {
    Router.init()
    Charts.init()

    const settings = await API.settings.get()
    if (settings) {
      const labNameEl = document.getElementById('labNameSidebar')
      if (labNameEl) labNameEl.textContent = settings.labName || 'معمل الأسنان'
    }

    Router.navigate('dashboard')
  } catch (error) {
    console.error('App initialization error:', error)
    document.getElementById('page-container').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-text">حدث خطأ أثناء تحميل التطبيق</div>
        <p style="margin-top:12px;color:var(--text-secondary)">يرجى إعادة تشغيل التطبيق</p>
      </div>
    `
  }

  const downloadBtn = document.getElementById('downloadBtn')
  if (downloadBtn) {
    downloadBtn.addEventListener('click', async () => {
      try {
        const result = await API.backup.create()
        if (result?.success) {
          Toast.success('تم إنشاء النسخة الاحتياطية بنجاح')
        }
      } catch (e) {
        console.error('Download error:', e)
      }
    })
  }

  const lockScreenBtn = document.getElementById('lockScreenBtn')
  const lockScreen = document.getElementById('lockScreen')
  const unlockBtn = document.getElementById('unlockBtn')

  if (lockScreenBtn && lockScreen) {
    lockScreenBtn.addEventListener('click', () => {
      lockScreen.classList.add('active')
    })
  }

  if (unlockBtn && lockScreen) {
    unlockBtn.addEventListener('click', () => {
      lockScreen.classList.remove('active')
    })
  }
})
