import { Router } from './router.js'
import { API } from './api.js'
import { Modal } from './components/modal.js'
import { Toast } from './components/toast.js'
import { formatCurrency, formatCurrencyWithEGP, formatDate, todayString, toDateString, escapeHtml, debounce, getStatusLabel, getStatusClass } from './utilities.js'
import { Printing } from './printing.js'

const InvoicesPage = {
  async render(container) {
    const now = new Date()
    container.innerHTML = `
      <div class="page-header"><h1 class="page-title">🧾 الفواتير</h1></div>
      <div class="filter-bar">
        <input type="text" class="form-input" id="invoiceSearch" placeholder="بحث برقم الفاتورة..." style="width:250px">
        <select class="form-select" id="invoiceStatusFilter" style="width:180px"><option value="">كل الحالات</option><option value="PAID">مدفوعة</option><option value="PARTIAL">مدفوعة جزئيًا</option><option value="UNPAID">غير مدفوعة</option></select>
        <input type="date" class="form-input" id="invoiceFromDate" value="${toDateString(new Date(now.getFullYear(), now.getMonth(), 1))}" style="width:160px">
        <span style="color:var(--text-secondary)">إلى</span>
        <input type="date" class="form-input" id="invoiceToDate" value="${todayString()}" style="width:160px">
      </div>
      <div id="invoicesTable"></div>
    `
    document.getElementById('invoiceSearch').addEventListener('input', debounce((e) => this.onSearch(e.target.value), 300))
    document.getElementById('invoiceStatusFilter').addEventListener('change', () => this.loadData())
    document.getElementById('invoiceFromDate').addEventListener('change', () => this.loadData())
    document.getElementById('invoiceToDate').addEventListener('change', () => this.loadData())
    await this.loadData()
  },

  async loadData() {
    const filters = {}
    const status = document.getElementById('invoiceStatusFilter')?.value
    const from = document.getElementById('invoiceFromDate')?.value
    const to = document.getElementById('invoiceToDate')?.value
    if (status) filters.status = status
    if (from && to) { filters.fromDate = from; filters.toDate = to }
    const invoices = await API.invoices.getAll(filters)
    this.renderTable(invoices)
  },

  renderTable(invoices) {
    const el = document.getElementById('invoicesTable')
    if (!el) return
    if (invoices.length === 0) { el.innerHTML = '<div class="data-table-wrapper"><div class="table-empty"><div class="empty-state"><div class="empty-state-icon">🧾</div><div class="empty-state-text">لا توجد فواتير</div></div></div></div>'; return }
    let totalAll = 0, paidAll = 0, remainAll = 0
    let html = '<div class="data-table-wrapper"><table class="data-table"><thead><tr><th>رقم الفاتورة</th><th>التاريخ</th><th>الطبيب</th><th>الإجمالي</th><th>المدفوع</th><th>المتبقي</th><th>الحالة</th><th>الإجراءات</th></tr></thead><tbody>'
    invoices.forEach((inv) => {
      totalAll += inv.total; paidAll += inv.paid; remainAll += inv.remaining
      html += `<tr>
        <td class="code-cell">${inv.invoiceNumber}</td>
        <td class="date-cell">${formatDate(inv.date)}</td>
        <td class="name-cell">${escapeHtml(inv.dentistName)}</td>
        <td class="number-cell">${formatCurrency(inv.total)} ج.م</td>
        <td class="number-cell amount-positive">${formatCurrency(inv.paid)} ج.م</td>
        <td class="number-cell ${inv.remaining > 0 ? 'amount-negative' : ''}">${formatCurrency(inv.remaining)} ج.م</td>
        <td><span class="status-badge ${getStatusClass(inv.status)}">${getStatusLabel(inv.status)}</span></td>
        <td><div class="table-actions">
          <button class="btn btn-sm btn-primary" data-action="view" data-id="${inv.id}">عرض</button>
          <button class="btn btn-sm btn-outline" data-action="print" data-id="${inv.id}">طباعة</button>
          ${inv.status !== 'CANCELLED' && inv.status !== 'PAID' ? `<button class="btn btn-sm btn-warning" data-action="cancel" data-id="${inv.id}">إلغاء</button>` : ''}
        </div></td>
      </tr>`
    })
    html += '</tbody></table></div>'
    html += `<div class="table-footer"><span>الإجمالي: ${formatCurrency(totalAll)} ج.م | المدفوع: ${formatCurrency(paidAll)} ج.م | المتبقي: ${formatCurrency(remainAll)} ج.م</span></div>`
    el.innerHTML = html
    el.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (btn.dataset.action === 'view') this.viewInvoice(btn.dataset.id)
        else if (btn.dataset.action === 'print') { const inv = await API.invoices.getById(btn.dataset.id); if (inv) Printing.printInvoice(inv) }
        else if (btn.dataset.action === 'cancel') this.cancelInvoice(btn.dataset.id)
      })
    })
  },

  async onSearch(query) { if (!query) { this.loadData(); return } const invoices = await API.invoices.getAll({ search: query }); this.renderTable(invoices) },

  async viewInvoice(id) {
    const inv = await API.invoices.getById(id)
    if (!inv) return
    let itemsHtml = ''
    if (inv.items?.length) {
      itemsHtml = '<table class="order-items-table"><thead><tr><th>الصنف</th><th>السعر</th><th>الكمية</th><th>الإجمالي</th></tr></thead><tbody>'
      inv.items.forEach((i) => { itemsHtml += `<tr><td>${escapeHtml(i.itemNameSnapshot)}</td><td>${formatCurrency(i.unitPriceSnapshot)} ج.م</td><td>${i.quantity}</td><td>${formatCurrency(i.lineTotal)} ج.م</td></tr>` })
      itemsHtml += '</tbody></table>'
    }
    const content = `
      <div class="mb-2"><strong>الطبيب:</strong> ${escapeHtml(inv.dentistName)}</div>
      <div class="mb-2"><strong>التاريخ:</strong> ${formatDate(inv.date)}</div>
      <div class="mb-2"><strong>التشخيص:</strong> ${escapeHtml(inv.diagnosis)}</div>
      <div class="mb-2"><strong>الأسنان:</strong> ${escapeHtml(inv.teeth)}</div>
      <div class="mb-2"><strong>التصنيف:</strong> ${escapeHtml(inv.category)}</div>
      ${inv.categoryComment ? `<div class="mb-2"><strong>تعليق:</strong> ${escapeHtml(inv.categoryComment)}</div>` : ''}
      <div class="mt-2">${itemsHtml}</div>
      <div class="order-summary mt-2">
        <div class="summary-item"><div class="label">الإجمالي</div><div class="value">${formatCurrencyWithEGP(inv.total)}</div></div>
        <div class="summary-item"><div class="label">المدفوع</div><div class="value" style="color:var(--success)">${formatCurrencyWithEGP(inv.paid)}</div></div>
        <div class="summary-item"><div class="label">المتبقي</div><div class="value danger">${formatCurrencyWithEGP(inv.remaining)}</div></div>
      </div>
      <div class="mt-2"><span class="status-badge ${getStatusClass(inv.status)}" style="font-size:14px;padding:6px 16px">${getStatusLabel(inv.status)}</span></div>
    `
    Modal.show(`فاتورة ${inv.invoiceNumber}`, content, { size: 'lg' })
  },

  async cancelInvoice(id) {
    Modal.confirm('هل أنت متأكد من إلغاء هذه الفاتورة؟', async () => {
      try { await API.invoices.cancel(id); Toast.success('تم إلغاء الفاتورة'); await this.loadData() } catch (e) { Toast.error('حدث خطأ') }
    })
  }
}

Router.register('invoices', (c) => InvoicesPage.render(c))
