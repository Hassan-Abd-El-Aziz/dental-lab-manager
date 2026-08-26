export const Toast = {
  show(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container')
    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' }

    const toast = document.createElement('div')
    toast.className = `toast toast-${type}`
    toast.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`
    container.appendChild(toast)

    setTimeout(() => {
      toast.style.opacity = '0'
      toast.style.transform = 'translateX(-20px)'
      toast.style.transition = 'all 0.3s ease'
      setTimeout(() => toast.remove(), 300)
    }, duration)
  },
  success(msg) { this.show(msg, 'success') },
  error(msg) { this.show(msg, 'error', 5000) },
  warning(msg) { this.show(msg, 'warning', 4000) },
  info(msg) { this.show(msg, 'info') }
}
