import { Router } from './router.js'
import { API } from './api.js'
import { formatCurrency, formatCurrencyWithEGP, formatDate, todayString, toDateString } from './utilities.js'

const ReportsPage = {
  async render(container) {
    const now = new Date()
    container.innerHTML = `
      <div class="page-header"><h1 class="page-title">📊 التقارير</h1></div>
      <div class="filter-bar">
        <span class="date-label" style="font-weight:600;color:var(--text-secondary)">من تاريخ:</span>
        <input type="date" class="form-input" id="reportFrom" value="${toDateString(new Date(now.getFullYear(), now.getMonth(), 1))}" style="width:160px">
        <span style="color:var(--text-secondary)">إلى</span>
        <input type="date" class="form-input" id="reportTo" value="${todayString()}" style="width:160px">
        <button class="btn btn-sm btn-outline" id="btnRptToday">اليوم</button>
        <button class="btn btn-sm btn-outline" id="btnRptMonth">هذا الشهر</button>
        <button class="btn btn-sm btn-outline" id="btnRptLastMonth">الشهر الماضي</button>
        <button class="btn btn-sm btn-primary" id="btnRptGenerate">إنشاء التقرير</button>
      </div>
      <div id="reportResult"></div>
    `
    document.getElementById('btnRptToday').addEventListener('click', () => { document.getElementById('reportFrom').value = todayString(); document.getElementById('reportTo').value = todayString(); this.generate() })
    document.getElementById('btnRptMonth').addEventListener('click', () => { const n = new Date(); document.getElementById('reportFrom').value = toDateString(new Date(n.getFullYear(), n.getMonth(), 1)); document.getElementById('reportTo').value = todayString(); this.generate() })
    document.getElementById('btnRptLastMonth').addEventListener('click', () => { const n = new Date(); document.getElementById('reportFrom').value = toDateString(new Date(n.getFullYear(), n.getMonth() - 1, 1)); document.getElementById('reportTo').value = toDateString(new Date(n.getFullYear(), n.getMonth(), 0)); this.generate() })
    document.getElementById('btnRptGenerate').addEventListener('click', () => this.generate())
    await this.generate()
  },

  async generate() {
    const from = document.getElementById('reportFrom')?.value
    const to = document.getElementById('reportTo')?.value
    if (!from || !to) return
    const report = await API.reports.generate(from, to)
    const el = document.getElementById('reportResult')
    if (!el) return
    const nc = report.netIncome >= 0 ? 'success' : 'danger'
    el.innerHTML = `
      <div class="card">
        <div class="card-title">تقرير الفترة: ${formatDate(from)} - ${formatDate(to)}</div>
        <div class="kpi-grid">
          <div class="kpi-card info"><div class="kpi-label">عدد الطلبات</div><div class="kpi-value">${report.orderCount}</div></div>
          <div class="kpi-card info"><div class="kpi-label">عدد الفواتير</div><div class="kpi-value">${report.invoiceCount}</div></div>
          <div class="kpi-card"><div class="kpi-label">إجمالي الفواتير</div><div class="kpi-value">${formatCurrencyWithEGP(report.totalInvoices)}</div></div>
          <div class="kpi-card success"><div class="kpi-label">إجمالي المدفوعات</div><div class="kpi-value">${formatCurrencyWithEGP(report.totalPayments)}</div></div>
          <div class="kpi-card warning"><div class="kpi-label">إجمالي المتبقي</div><div class="kpi-value">${formatCurrencyWithEGP(report.totalRemaining)}</div></div>
          <div class="kpi-card danger"><div class="kpi-label">إجمالي المصروفات</div><div class="kpi-value">${formatCurrencyWithEGP(report.totalExpenses)}</div></div>
          <div class="kpi-card ${nc}"><div class="kpi-label">صافي الإيراد</div><div class="kpi-value">${formatCurrencyWithEGP(report.netIncome)}</div></div>
        </div>
        <div style="margin-top:16px;padding:16px;background:var(--bg);border-radius:var(--radius);font-size:14px">
          <strong>صافي الإيراد</strong> = إجمالي المدفوعات (${formatCurrency(report.totalPayments)} ج.م) - إجمالي المصروفات (${formatCurrency(report.totalExpenses)} ج.م) = <strong>${formatCurrency(report.netIncome)} ج.م</strong>
        </div>
      </div>
    `
  }
}

Router.register('reports', (c) => ReportsPage.render(c))
