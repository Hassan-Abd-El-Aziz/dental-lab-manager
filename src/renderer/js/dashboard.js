import { Router } from './router.js'
import { API } from './api.js'
import { formatCurrency, formatCurrencyWithEGP, formatDate, formatDateTime, todayString, escapeHtml } from './utilities.js'
import { Charts } from './charts.js'
import { Auth } from './auth.js'

const DashboardPage = {
  currentDate: todayString(),

  async render(container) {
    if (!Auth.isAdmin()) {
      this.renderEmployeeView(container)
      return
    }
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

  renderEmployeeView(container) {
    if (this.clockInterval) {
      clearInterval(this.clockInterval)
      this.clockInterval = null
    }
    container.innerHTML = `
      <div class="employee-dashboard">
        <div class="clock-container">
          <div class="clock">
            <div class="clock-face">
              <div class="hand hour-hand" id="hourHand"></div>
              <div class="hand minute-hand" id="minuteHand"></div>
              <div class="hand second-hand" id="secondHand"></div>
              <div class="center-dot"></div>
              <div class="clock-marks">
                <span style="top:8px;left:50%;transform:translateX(-50%)">12</span>
                <span style="top:50%;right:8px;transform:translateY(-50%)">3</span>
                <span style="bottom:8px;left:50%;transform:translateX(-50%)">6</span>
                <span style="top:50%;left:8px;transform:translateY(-50%)">9</span>
              </div>
            </div>
          </div>
          <div class="digital-time" id="digitalTime"></div>
          <div class="current-date" id="currentDate"></div>
        </div>
      </div>
    `
    this.startClock()
  },

  startClock() {
    const hourHand = document.getElementById('hourHand')
    const minuteHand = document.getElementById('minuteHand')
    const secondHand = document.getElementById('secondHand')
    const digitalTime = document.getElementById('digitalTime')
    const currentDate = document.getElementById('currentDate')

    const updateClock = () => {
      const now = new Date()
      const hours = now.getHours()
      const minutes = now.getMinutes()
      const seconds = now.getSeconds()

      if (hourHand) {
        const hourDeg = (hours % 12) * 30 + minutes * 0.5
        hourHand.style.transform = `rotate(${hourDeg}deg)`
      }
      if (minuteHand) {
        const minuteDeg = minutes * 6 + seconds * 0.1
        minuteHand.style.transform = `rotate(${minuteDeg}deg)`
      }
      if (secondHand) {
        const secondDeg = seconds * 6
        secondHand.style.transform = `rotate(${secondDeg}deg)`
      }
      if (digitalTime) {
        digitalTime.textContent = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      }
      if (currentDate) {
        currentDate.textContent = now.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      }
    }

    updateClock()
    this.clockInterval = setInterval(updateClock, 1000)
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
