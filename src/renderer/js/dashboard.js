import { Router } from './router.js'
import { API } from './api.js'
import { formatCurrency, formatCurrencyWithEGP, formatDate, formatDateTime, todayString, escapeHtml } from './utilities.js'
import { Charts } from './charts.js'

const DashboardPage = {
  currentDate: todayString(),

  async render(container) {
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">🏠 لوحة التحكم</h1>
      </div>
      <div class="dashboard-date-bar">
        <span class="date-label">التاريخ:</span>
        <input type="date" id="dashboardDate" value="${this.currentDate}">
        <button class="btn btn-sm btn-primary" id="btnToday">اليوم</button>
        <button class="btn btn-sm btn-outline" id="btnPickDate">اختيار تاريخ</button>
      </div>
      <div id="dashboardKpis" class="kpi-grid"></div>
      <div class="charts-grid">
        <div class="chart-card">
          <div class="chart-card-title">الإيرادات والمصروفات</div>
          <div class="chart-container"><canvas id="chartIncomeExpenses"></canvas></div>
        </div>
        <div class="chart-card">
          <div class="chart-card-title">حالة الفواتير</div>
          <div class="chart-container"><canvas id="chartInvoiceStatus"></canvas></div>
        </div>
        <div class="chart-card">
          <div class="chart-card-title">الأطباء حسب قيمة التعاملات</div>
          <div class="chart-container"><canvas id="chartTopDentists"></canvas></div>
        </div>
        <div class="chart-card">
          <div class="chart-card-title">الحركة المالية الشهرية</div>
          <div class="chart-container"><canvas id="chartMonthlyFinancial"></canvas></div>
        </div>
      </div>
      <div class="recent-activity">
        <div class="activity-title">آخر العمليات</div>
        <div id="recentActivity"></div>
      </div>
    `

    document.getElementById('dashboardDate').addEventListener('change', (e) => {
      this.currentDate = e.target.value
      this.loadData()
    })
    document.getElementById('btnToday').addEventListener('click', () => {
      this.currentDate = todayString()
      document.getElementById('dashboardDate').value = this.currentDate
      this.loadData()
    })

    await this.loadData()
  },

  async loadData() {
    await Promise.all([this.loadKpis(), this.loadCharts(), this.loadRecentActivity()])
  },

  async loadKpis() {
    const stats = await API.dashboard.getStats(this.currentDate)
    const el = document.getElementById('dashboardKpis')
    if (!el) return
    el.innerHTML = `
      <div class="kpi-card"><div class="kpi-label">عدد الطلبات</div><div class="kpi-value">${stats.orderCount}</div></div>
      <div class="kpi-card info"><div class="kpi-label">عدد الفواتير</div><div class="kpi-value">${stats.invoiceCount}</div></div>
      <div class="kpi-card"><div class="kpi-label">إجمالي الفواتير</div><div class="kpi-value">${formatCurrencyWithEGP(stats.totalInvoices)}</div></div>
      <div class="kpi-card success"><div class="kpi-label">إجمالي المدفوعات</div><div class="kpi-value">${formatCurrencyWithEGP(stats.totalPayments)}</div></div>
      <div class="kpi-card warning"><div class="kpi-label">إجمالي المتبقي</div><div class="kpi-value">${formatCurrencyWithEGP(stats.totalRemaining)}</div></div>
      <div class="kpi-card danger"><div class="kpi-label">إجمالي المصروفات</div><div class="kpi-value">${formatCurrencyWithEGP(stats.totalExpenses)}</div></div>
      <div class="kpi-card success"><div class="kpi-label">صافي الإيراد</div><div class="kpi-value">${formatCurrencyWithEGP(stats.netIncome)}</div></div>
    `
  },

  async loadCharts() {
    Charts.init()
    const d = new Date(this.currentDate)
    Charts.renderIncomeVsExpenses('chartIncomeExpenses', d.getFullYear(), d.getMonth())
    Charts.renderInvoiceStatus('chartInvoiceStatus')
    Charts.renderTopDentists('chartTopDentists', this.currentDate, this.currentDate)
    Charts.renderMonthlyFinancial('chartMonthlyFinancial', 6)
  },

  async loadRecentActivity() {
    const activity = await API.dashboard.getRecentActivity(this.currentDate, 20)
    const el = document.getElementById('recentActivity')
    if (!el) return

    if (activity.length === 0) {
      el.innerHTML = '<div class="empty-state" style="padding:24px"><div class="empty-state-text">لا توجد عمليات اليوم</div></div>'
      return
    }

    let html = '<table class="activity-table"><thead><tr><th>الوقت</th><th>العملية</th><th>الرقم</th><th>الطبيب</th><th>المبلغ</th><th>الملاحظات</th></tr></thead><tbody>'
    activity.forEach((act) => {
      const tc = act.type === 'طلب جديد' ? 'order' : act.type === 'فاتورة' ? 'invoice' : act.type === 'دفعة' ? 'payment' : 'expense'
      html += `<tr>
        <td class="date-cell">${formatDateTime(act.time)}</td>
        <td><span class="activity-type ${tc}">${act.type}</span></td>
        <td class="code-cell">${act.number}</td>
        <td class="name-cell">${escapeHtml(act.dentist)}</td>
        <td class="number-cell">${formatCurrency(act.amount)} ج.م</td>
        <td>${escapeHtml(act.notes)}</td>
      </tr>`
    })
    html += '</tbody></table>'
    el.innerHTML = html
  }
}

Router.register('dashboard', (c) => DashboardPage.render(c))
