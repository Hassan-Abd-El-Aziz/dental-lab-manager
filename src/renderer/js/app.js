import { Router } from './router.js'
import { API } from './api.js'
import { Charts } from './charts.js'
import { Toast } from './components/toast.js'
import { Auth } from './auth.js'

import './dashboard.js'
import './dentists.js'
import './orders.js'
import './invoices.js'
import './payments.js'
import './expenses.js'
import './reports.js'
import './settings.js'
import './orderTracking.js'
import './login.js'
import './users.js'
import './auditLog.js'
import './inventory.js'
import './activation.js'

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const activated = await API.license.check()
    if (!activated) {
      const appEl = document.getElementById('app')
      const topNavbar = document.getElementById('topNavbar')
      appEl.classList.add('login-mode')
      if (topNavbar) topNavbar.style.display = 'none'
      const logoutBtn = document.getElementById('logoutBtn')
      if (logoutBtn) logoutBtn.style.display = 'none'
      Router.navigate('activation')
      return
    }

    Router.init((page) => Auth.canAccess(page))
    Charts.init()

    const settings = await API.settings.get()
    if (settings) {
      const labNameEl = document.getElementById('labNameSidebar')
      if (labNameEl) labNameEl.textContent = settings.labName || 'معمل الأسنان'
    }

    const user = await Auth.init()
    const navUserName = document.getElementById('navUserName')
    const topNavbar = document.getElementById('topNavbar')
    const appEl = document.getElementById('app')
    if (topNavbar) topNavbar.style.display = 'flex'
    if (navUserName) navUserName.textContent = '---'
    if (user) {
      appEl.classList.remove('login-mode')
      if (navUserName) navUserName.textContent = user.name || user.username
      if (topNavbar) topNavbar.style.display = 'flex'

      document.querySelectorAll('.nav-item[data-admin="true"]').forEach((item) => {
        item.style.display = Auth.isAdmin() ? '' : 'none'
      })

      const logoutBtn = document.getElementById('logoutBtn')
      if (logoutBtn) {
        logoutBtn.style.display = 'block'
      }

      Router.navigate('dashboard')
    } else {
      appEl.classList.add('login-mode')
      if (topNavbar) topNavbar.style.display = 'none'

      const logoutBtn = document.getElementById('logoutBtn')
      if (logoutBtn) {
        logoutBtn.style.display = 'none'
      }

      Router.navigate('login')
    }
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

  const logoutBtn = document.getElementById('logoutBtn')
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await Auth.logout()
      const appEl = document.getElementById('app')
      appEl.classList.add('login-mode')
      document.querySelectorAll('.nav-item[data-admin="true"]').forEach((item) => {
        item.style.display = 'none'
      })
      const topNavbar = document.getElementById('topNavbar')
      if (topNavbar) topNavbar.style.display = 'none'
      const navUserName = document.getElementById('navUserName')
      if (navUserName) navUserName.textContent = '---'
    })
  }
})
