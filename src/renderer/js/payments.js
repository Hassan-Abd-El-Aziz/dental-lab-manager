import { Router } from './router.js'
import { API } from './api.js'
import { Modal } from './components/modal.js'
import { Toast } from './components/toast.js'
import { formatCurrency, formatDate, todayString, toDateString, escapeHtml } from './utilities.js'
import { Auth } from './auth.js'

const PaymentsPage = {
  async render(container) {
    const now = new Date()
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">💰 المدفوعات</h1>
        <button class="btn btn-primary" id="btnAddPayment">+ إضافة دفعة</button>
      </div>
      <div class="filter-bar">
        <input type="date" class="form-input" id="payFromDate" value="${toDateString(new Date(now.getFullYear(), now.getMonth(), 1))}" style="width:160px">
        <span style="color:var(--text-secondary)">إلى</span>
        <input type="date" class="form-input" id="payToDate" value="${todayString()}" style="width:160px">
        <button class="btn btn-sm btn-outline" id="btnPayMonth">هذا الشهر</button>
        <button class="btn btn-sm btn-outline" id="btnPayAll">كل المدفوعات</button>
      </div>
      <div id="paymentsTable"></div>
    `
    document.getElementById('btnAddPayment').addEventListener('click', () => this.showAddModal())
    document.getElementById('payFromDate').addEventListener('change', () => this.loadData())
    document.getElementById('payToDate').addEventListener('change', () => this.loadData())
    document.getElementById('btnPayMonth').addEventListener('click', () => { const n = new Date(); document.getElementById('payFromDate').value = toDateString(new Date(n.getFullYear(), n.getMonth(), 1)); document.getElementById('payToDate').value = todayString(); this.loadData() })
    document.getElementById('btnPayAll').addEventListener('click', () => { document.getElementById('payFromDate').value = '2020-01-01'; document.getElementById('payToDate').value = todayString(); this.loadData() })
    await this.loadData()
  },

  async loadData() {
    const from = document.getElementById('payFromDate')?.value
    const to = document.getElementById('payToDate')?.value
    const filters = {}
    if (from && to) { filters.fromDate = from; filters.toDate = to }
    try {
      const payments = await API.payments.getAll(filters)
      this.renderTable(payments)
    } catch (error) {
      console.error('Error loading payments:', error)
      Toast.error(error.message || 'حدث خطأ في تحميل المدفوعات')
      const el = document.getElementById('paymentsTable')
      if (el) el.innerHTML = ''
    }
  },

  renderTable(payments) {
    const el = document.getElementById('paymentsTable')
    if (!el) return
    if (payments.length === 0) { el.innerHTML = '<div class="data-table-wrapper"><div class="table-empty"><div class="empty-state"><div class="empty-state-icon">💰</div><div class="empty-state-text">لا توجد مدفوعات</div></div></div></div>'; return }
    let totalAll = 0
    let html = '<div class="data-table-wrapper"><table class="data-table"><thead><tr><th>رقم الدفعة</th><th>التاريخ</th><th>الطبيب</th><th>المبلغ</th><th>ملاحظات</th><th>الإجراءات</th></tr></thead><tbody>'
    payments.forEach((p) => { totalAll += p.amount; html += `<tr><td class="code-cell">${p.paymentNumber}</td><td class="date-cell">${formatDate(p.date)}</td><td class="name-cell">${escapeHtml(p.dentistName)}</td><td class="number-cell amount-positive">${formatCurrency(p.amount)} ج.م</td><td>${escapeHtml(p.notes)}</td><td><div class="table-actions">${Auth.isAdmin() ? `<button class="btn btn-sm btn-danger" data-action="delete" data-id="${p.id}">🗑️</button>` : ''}</div></td></tr>` })
    html += '</tbody></table></div>'
    html += `<div class="table-footer"><span>الإجمالي: ${formatCurrency(totalAll)} ج.م</span></div>`
    el.innerHTML = html

    el.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (btn.dataset.action === 'delete') await this.deletePayment(btn.dataset.id)
      })
    })
  },

  async showAddModal() {
    const dentists = await API.dentists.getAll()
    const dOpts = dentists.filter(d => d.active).map(d => `<option value="${d.id}">${d.dentistCode} - ${d.name}</option>`).join('')
    const content = `
      <form id="addPaymentForm">
        <div class="form-group"><label class="form-label">الطبيب <span class="required">*</span></label><select class="form-select" id="payDentist" required><option value="">اختر الطبيب</option>${dOpts}</select></div>
        <div class="form-group"><label class="form-label">رقم الفاتورة (اختياري)</label><select class="form-select" id="payInvoice"><option value="">بدون فاتورة محددة</option></select></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">التاريخ</label><input type="date" class="form-input" id="payDate" value="${todayString()}"></div>
          <div class="form-group"><label class="form-label">المبلغ <span class="required">*</span></label><input type="number" class="form-input" id="payAmount" min="1" required placeholder="0"></div>
        </div>
        <div class="form-group"><label class="form-label">ملاحظات</label><textarea class="form-textarea" id="payNotes" placeholder="ملاحظات"></textarea></div>
        <div class="form-actions"><button type="submit" class="btn btn-primary">حفظ الدفعة</button><button type="button" class="btn btn-outline" id="modalCancelBtn">إلغاء</button></div>
      </form>
    `
    Modal.show('إضافة دفعة جديدة', content)
    document.getElementById('addPaymentForm').addEventListener('submit', (e) => this.savePayment(e))
    document.getElementById('modalCancelBtn').addEventListener('click', () => Modal.close())
    document.getElementById('payDentist').addEventListener('change', async (e) => {
      const sel = document.getElementById('payInvoice')
      if (!e.target.value) { sel.innerHTML = '<option value="">بدون فاتورة محددة</option>'; return }
      const invoices = await API.invoices.getAll({ dentistId: e.target.value })
      const unpaid = invoices.filter(i => i.status !== 'PAID' && i.status !== 'CANCELLED')
      sel.innerHTML = '<option value="">بدون فاتورة محددة</option>'
      unpaid.forEach((inv) => { sel.innerHTML += `<option value="${inv.id}">${inv.invoiceNumber} - المتبقي: ${formatCurrency(inv.remaining)} ج.م</option>` })
    })
  },

  async savePayment(event) {
    event.preventDefault()
    const dentistId = document.getElementById('payDentist').value
    const amount = parseFloat(document.getElementById('payAmount').value)
    if (!dentistId) { Toast.error('يرجى اختيار الطبيب'); return }
    if (!amount || amount <= 0) { Toast.error('يرجى إدخال مبلغ صحيح'); return }
    try {
      const result = await API.payments.create({ dentistId, invoiceId: document.getElementById('payInvoice').value || null, amount, date: document.getElementById('payDate').value, notes: document.getElementById('payNotes').value.trim() })
      Modal.close()
      Toast.success(`تم حفظ الدفعة ${result.paymentNumber}`)
      await this.loadData()
    } catch (error) {
      console.error('Error saving payment:', error)
      Toast.error(error.message || 'حدث خطأ أثناء حفظ الدفعة')
    }
  },

  async deletePayment(id) {
    Modal.confirm('هل أنت متأكد من حذف هذه الدفعة؟\n\nسيتم حذف الدفعة نهائياً.', async () => {
      try {
        await API.payments.delete(id)
        Toast.success('تم حذف الدفعة بنجاح')
        await this.loadData()
      } catch (error) {
        Toast.error(error.message || 'حدث خطأ في حذف الدفعة')
      }
    }, { title: 'تأكيد الحذف', confirmText: 'نعم، حذف', confirmClass: 'btn-danger' })
  }
}

Router.register('payments', (c) => PaymentsPage.render(c))
