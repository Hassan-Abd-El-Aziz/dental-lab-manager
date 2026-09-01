import { Router } from './router.js'
import { API } from './api.js'
import { Toast } from './components/toast.js'
import { Auth } from './auth.js'

const LoginPage = {
  render(container) {
    container.innerHTML = `
      <div class="login-screen">
        <div class="login-card">
          <div class="login-header">
            <div class="login-logo">🦷</div>
            <h1 class="login-title">نظام إدارة معمل الأسنان</h1>
            <p class="login-subtitle">تسجيل الدخول للمتابعة</p>
          </div>
          <form id="loginForm">
            <div class="form-group">
              <label class="form-label">اسم المستخدم</label>
              <input type="text" class="form-input" id="loginUsername" placeholder="أدخل اسم المستخدم" autocomplete="username" required>
            </div>
            <div class="form-group">
              <label class="form-label">كلمة المرور</label>
              <input type="password" class="form-input" id="loginPassword" placeholder="أدخل كلمة المرور" autocomplete="current-password" required>
            </div>
            <div id="loginError" class="form-error" style="display:none;margin-top:8px"></div>
            <button type="submit" class="btn btn-lg btn-primary w-full" style="margin-top:16px">تسجيل الدخول</button>
          </form>
          <div class="login-footer" style="margin-top:20px;text-align:center;font-size:12px;color:var(--text-secondary)">
            مدير المستخدم الافتراضي: admin / admin123
          </div>
        </div>
      </div>
    `

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault()
      const username = document.getElementById('loginUsername').value.trim()
      const password = document.getElementById('loginPassword').value
      const errorEl = document.getElementById('loginError')
      errorEl.style.display = 'none'
      errorEl.textContent = ''

      if (!username || !password) {
        errorEl.textContent = 'يرجى إدخال اسم المستخدم وكلمة المرور'
        errorEl.style.display = 'block'
        return
      }

      try {
        const user = await API.auth.login(username, password)
        Auth.user = user
        const appEl = document.getElementById('app')
        appEl.classList.remove('login-mode')
        document.querySelectorAll('.nav-item[data-admin="true"]').forEach((item) => {
          item.style.display = Auth.isAdmin() ? '' : 'none'
        })
        const logoutBtn = document.getElementById('logoutBtn')
        if (logoutBtn) logoutBtn.style.display = 'block'
        const navUserName = document.getElementById('navUserName')
        if (navUserName) navUserName.textContent = user.name || user.username
        Router.navigate('dashboard')
        Toast.success(`مرحباً ${user.name || user.username}`)
      } catch (error) {
        errorEl.textContent = 'اسم المستخدم او كلمة المرور غير صحيحه'
        errorEl.style.display = 'block'
      }
    })
  }
}

Router.register('login', (c) => LoginPage.render(c))
