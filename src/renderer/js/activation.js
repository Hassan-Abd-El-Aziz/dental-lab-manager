import { API } from './api.js'
import { Toast } from './components/toast.js'
import { Router } from './router.js'

const ActivationPage = {
  async render(container) {
    container.innerHTML = `
      <div class="activation-container">
        <div class="activation-card">
          <div class="activation-icon">🦷</div>
          <h1 class="activation-title">تفعيل البرنامج</h1>
          <p class="activation-subtitle">أدخل كود التفعيل لبدء استخدام البرنامج</p>

          <form id="activationForm">
            <div class="form-group">
              <label class="form-label">كود التفعيل</label>
              <input type="password" class="form-input activation-input" id="activationCode" placeholder="أدخل كود التفعيل هنا" autocomplete="off" required>
            </div>
            <button type="submit" class="btn btn-primary activation-btn" id="activationSubmitBtn">تفعيل البرنامج</button>
          </form>

          <div class="activation-footer">
            <p>هذا البرنامج مرخص لجهاز واحد فقط</p>
            <p class="activation-support">للحصول على كود التفعيل تواصل مع الدعم الفني</p>
            <p class="activation-support">📞 01009039628</p>
          </div>
        </div>
      </div>
    `

    document.getElementById('activationForm').addEventListener('submit', (e) => this.handleActivation(e))
  },

  async handleActivation(event) {
    event.preventDefault()
    const codeInput = document.getElementById('activationCode')
    const submitBtn = document.getElementById('activationSubmitBtn')
    const code = codeInput.value.trim()

    if (!code) {
      Toast.error('يرجى إدخال كود التفعيل')
      return
    }

    submitBtn.disabled = true
    submitBtn.textContent = 'جارٍ التفعيل...'
    submitBtn.style.opacity = '0.7'

    try {
      const result = await API.license.activate(code)
      if (result.success) {
        Toast.success(result.message)
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        Toast.error(result.message)
      }
    } catch (error) {
      Toast.error('حدث خطأ أثناء التفعيل')
    } finally {
      submitBtn.disabled = false
      submitBtn.textContent = 'تفعيل البرنامج'
      submitBtn.style.opacity = '1'
    }
  }
}

Router.register('activation', (c) => ActivationPage.render(c))

export default ActivationPage
