import { Router } from './router.js'
import { API } from './api.js'
import { Toast } from './components/toast.js'
import { formatDate, escapeHtml } from './utilities.js'

const AUDIT_ACTIONS = {
  CREATE: { label: 'إنشاء', class: 'status-info' },
  UPDATE: { label: 'تعديل', class: 'status-warning' },
  DELETE: { label: 'حذف', class: 'status-cancelled' },
  LOGIN: { label: 'تسجيل دخول', class: 'status-paid' },
  LOGOUT: { label: 'تسجيل خروج', class: 'status-info' },
  INVENTORY_SET: { label: 'تعديل كمية', class: 'status-warning' },
  INVENTORY_IN: { label: 'إضافة مخزون', class: 'status-info' },
  INVENTORY_OUT: { label: 'سحب من المخزن', class: 'status-warning' },
  INVENTORY_RESET: { label: 'تصفير مخزون', class: 'status-cancelled' },
  PAYMENT_CREATE: { label: 'دفعة', class: 'status-paid' },
  INVOICE_CREATE: { label: 'فاتورة', class: 'status-info' },
  EXPENSE_CREATE: { label: 'مصروف', class: 'status-warning' },
  ORDER_CREATE: { label: 'طلب', class: 'status-info' }
}

const AuditLogPage = {
  logs: [],
  selectedAction: '',

  async render(container) {
    this.container = container
    await this.loadData()
  },

  async loadData(query = '', filters = {}) {
    this.logs = await API.audit.getAll(filters)
    this.renderUI()
  },

  renderUI() {
    const el = this.container
    if (!el) return
    el.innerHTML = `
      <div class="page-header"><h1 class="page-title">📋 سجل التدقيق</h1></div>
      <div class="card">
        <div class="filter-bar">
          <select class="form-select" id="auditAction" style="width:160px">
            <option value="">جميع الإجراءات</option>
            ${Object.entries(AUDIT_ACTIONS).map(([val, meta]) => `<option value="${val}" ${this.selectedAction === val ? 'selected' : ''}>${meta.label}</option>`).join('')}
          </select>
          <input type="date" class="form-input" id="auditFromDate" style="width:160px">
          <span style="color:var(--text-secondary)">إلى</span>
          <input type="date" class="form-input" id="auditToDate" style="width:160px">
          <button class="btn btn-sm btn-outline" id="btnAuditFilter">🔍 بحث</button>
        </div>
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead><tr><th>التاريخ</th><th>المستخدم</th><th>الإجراء</th><th>التفاصيل</th></tr></thead>
            <tbody>${this.logs.length === 0
              ? '<tr><td colspan="4"><div class="table-empty"><div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-text">لا توجد سجلات</div></div></div></td></tr>'
              : this.logs.map((l) => {
                const actionMeta = AUDIT_ACTIONS[l.action] || { label: l.action, class: '' }
                const dateStr = new Date(l.timestamp).toLocaleString('ar-EG')
                return `<tr>
                  <td class="date-cell">${dateStr}</td>
                  <td class="name-cell">${escapeHtml(l.username || '')}</td>
                  <td><span class="status-badge ${actionMeta.class}">${actionMeta.label}</span></td>
                  <td>${escapeHtml(l.details || '')}</td>
                </tr>`
              }).join('')}
          </tbody>
          </table>
        </div>
      </div>
    `

    document.getElementById('btnAuditFilter').addEventListener('click', () => {
      const action = document.getElementById('auditAction').value
      const fromDate = document.getElementById('auditFromDate').value
      const toDate = document.getElementById('auditToDate').value
      this.selectedAction = action
      const filters = {}
      if (action) filters.action = action
      if (fromDate && toDate) { filters.fromDate = fromDate; filters.toDate = toDate }
      this.loadData('', filters)
    })
  }
}

Router.register('audit', (c) => AuditLogPage.render(c))
