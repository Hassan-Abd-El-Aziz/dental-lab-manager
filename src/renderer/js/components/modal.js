export const Modal = {
  show(title, content, options = {}) {
    const container = document.getElementById('modal-container')
    const size = options.size || 'md'
    const sizeStyle = size === 'lg' ? 'max-width: 800px' : size === 'sm' ? 'max-width: 400px' : ''

    container.innerHTML = `
      <div class="modal-overlay" id="activeModal">
        <div class="modal" style="${sizeStyle}">
          <div class="modal-header">
            <h3 class="modal-title">${title}</h3>
            <button class="modal-close" id="modalCloseBtn">&times;</button>
          </div>
          <div class="modal-body">${content}</div>
          ${options.footer ? `<div class="modal-footer">${options.footer}</div>` : ''}
        </div>
      </div>
    `

    document.getElementById('modalCloseBtn').addEventListener('click', () => Modal.close())

    const overlay = document.getElementById('activeModal')
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) Modal.close()
    })

    document.addEventListener('keydown', Modal._escHandler)
  },

  close() {
    const container = document.getElementById('modal-container')
    container.innerHTML = ''
    document.removeEventListener('keydown', Modal._escHandler)
  },

  _escHandler(e) {
    if (e.key === 'Escape') Modal.close()
  },

  confirm(message, onConfirm, options = {}) {
    const title = options.title || 'تأكيد'
    const confirmText = options.confirmText || 'نعم'
    const cancelText = options.cancelText || 'إلغاء'
    const confirmClass = options.confirmClass || 'btn-danger'

    const footer = `
      <button class="btn btn-outline" id="modalCancelBtn">${cancelText}</button>
      <button class="btn ${confirmClass}" id="modalConfirmBtn">${confirmText}</button>
    `

    Modal.show(title, `<p style="font-size:15px;line-height:1.8;">${message}</p>`, { footer, size: 'sm' })

    document.getElementById('modalConfirmBtn').addEventListener('click', () => {
      Modal.close()
      onConfirm()
    })
    document.getElementById('modalCancelBtn').addEventListener('click', () => Modal.close())
  }
}
