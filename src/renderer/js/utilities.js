export function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

export function formatDateTime(date) {
  if (!date) return ''
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${day}/${month}/${year} ${hours}:${minutes}`
}

export function formatCurrency(amount) {
  if (amount === undefined || amount === null) return '0'
  return Number(amount).toLocaleString('ar-EG')
}

export function formatCurrencyWithEGP(amount) {
  if (amount === undefined || amount === null) return '0 جنيه'
  return `${Number(amount).toLocaleString('ar-EG')} جنيه`
}

export function todayString() {
  const d = new Date()
  return d.toISOString().split('T')[0]
}

export function toDateString(date) {
  if (!date) return todayString()
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

export function getStatusLabel(status) {
  const labels = {
    'PAID': 'مدفوعة',
    'PARTIAL': 'مدفوعة جزئيًا',
    'UNPAID': 'غير مدفوعة',
    'CANCELLED': 'ملغاة',
    'COMPLETED': 'مكتمل',
    'PENDING': 'قيد الانتظار'
  }
  return labels[status] || status
}

export function getStatusClass(status) {
  const classes = {
    'PAID': 'status-paid',
    'PARTIAL': 'status-partial',
    'UNPAID': 'status-unpaid',
    'CANCELLED': 'status-cancelled',
    'COMPLETED': 'status-paid',
    'PENDING': 'status-partial'
  }
  return classes[status] || ''
}

export function escapeHtml(text) {
  if (!text) return ''
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}
