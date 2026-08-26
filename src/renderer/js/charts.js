import { API } from './api.js'

export const Charts = {
  instances: {},

  destroy(id) {
    if (this.instances[id]) {
      this.instances[id].destroy()
      delete this.instances[id]
    }
  },

  init() {
    if (typeof Chart !== 'undefined') {
      Chart.defaults.font.family = "'Cairo', sans-serif"
      Chart.defaults.font.size = 12
      Chart.defaults.plugins.legend.labels.usePointStyle = true
      Chart.defaults.plugins.legend.labels.padding = 16
    }
  },

  async renderIncomeVsExpenses(canvasId, year, month) {
    this.destroy(canvasId)
    const data = await API.dashboard.getMonthlyChart(year, month)
    const canvas = document.getElementById(canvasId)
    if (!canvas) return

    this.instances[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [
          { label: 'الإيرادات', data: data.income, backgroundColor: 'rgba(37,99,235,0.8)', borderColor: '#2563eb', borderWidth: 1, borderRadius: 4 },
          { label: 'المصروفات', data: data.expenses, backgroundColor: 'rgba(220,38,38,0.8)', borderColor: '#dc2626', borderWidth: 1, borderRadius: 4 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString('ar-EG')} ج.م` } } },
        scales: { y: { beginAtZero: true, ticks: { callback: (v) => v.toLocaleString('ar-EG') } }, x: { ticks: { maxRotation: 45, autoSkip: true, maxTicksLimit: 15 } } }
      }
    })
  },

  async renderInvoiceStatus(canvasId) {
    this.destroy(canvasId)
    const data = await API.dashboard.getInvoiceStatusChart()
    const canvas = document.getElementById(canvasId)
    if (!canvas) return
    if (data.paid + data.partial + data.unpaid === 0) return

    this.instances[canvasId] = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['مدفوعة', 'مدفوعة جزئيًا', 'غير مدفوعة'],
        datasets: [{ data: [data.paid, data.partial, data.unpaid], backgroundColor: ['rgba(22,163,74,0.85)', 'rgba(234,88,12,0.85)', 'rgba(220,38,38,0.85)'], borderColor: ['#16a34a', '#ea580c', '#dc2626'], borderWidth: 2, hoverOffset: 8 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, cutout: '55%' }
    })
  },

  async renderTopDentists(canvasId, fromDate, toDate) {
    this.destroy(canvasId)
    const data = await API.dashboard.getTopDentists(fromDate, toDate, 8)
    const canvas = document.getElementById(canvasId)
    if (!canvas || data.length === 0) return

    this.instances[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: { labels: data.map(d => d.name), datasets: [{ label: 'قيمة التعاملات', data: data.map(d => d.total), backgroundColor: 'rgba(37,99,235,0.7)', borderColor: '#2563eb', borderWidth: 1, borderRadius: 6 }] },
      options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { callback: (v) => v.toLocaleString('ar-EG') } } } }
    })
  },

  async renderMonthlyFinancial(canvasId, months = 6) {
    this.destroy(canvasId)
    const data = await API.dashboard.getMonthlyFinancial(months)
    const canvas = document.getElementById(canvasId)
    if (!canvas) return

    this.instances[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [
          { label: 'المدفوعات', data: data.payments, backgroundColor: 'rgba(22,163,74,0.8)', borderColor: '#16a34a', borderWidth: 1, borderRadius: 4 },
          { label: 'المصروفات', data: data.expenses, backgroundColor: 'rgba(220,38,38,0.8)', borderColor: '#dc2626', borderWidth: 1, borderRadius: 4 },
          { label: 'صافي الإيرادات', data: data.netIncome, backgroundColor: 'rgba(37,99,235,0.8)', borderColor: '#2563eb', borderWidth: 1, borderRadius: 4 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true, ticks: { callback: (v) => v.toLocaleString('ar-EG') } } } }
    })
  }
}
