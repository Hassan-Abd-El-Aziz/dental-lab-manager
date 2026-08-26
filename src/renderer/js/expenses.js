import { Router } from './router.js'
import { API } from './api.js'
import { Modal } from './components/modal.js'
import { Toast } from './components/toast.js'
import { formatCurrency, todayString, toDateString, escapeHtml } from './utilities.js'

const ExpensesPage = {
  expenseCategories: ['خامات', 'مواصلات', 'كهرباء', 'صيانة', 'إيجار', 'رواتب', 'أخرى'],

  async render(container) {
    const now = new Date()
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">💸 المصروفات</h1>
        <button class="btn btn-primary" id="btnAddExpense">+ إضافة مصروف</button>
      </div>
      <div class="filter-bar">
        <input type="date" class="form-input" id="expFromDate" value="${toDateString(new Date(now.getFullYear(), now.getMonth(), 1))}" style="width:160px">
        <span style="color:var(--text-secondary)">إلى</span>
        <input type="date" class="form-input" id="expToDate" value="${todayString()}" style="width:160px">
        <button class="btn btn-sm btn-outline" id="btnExpMonth">هذا الشهر</button>
        <button class="btn btn-sm btn-outline" id="btnExpAll">كل المصروفات</button>
      </div>
      <div id="expensesTable"></div>
    `
    document.getElementById('btnAddExpense').addEventListener('click', () => this.showAddModal())
    document.getElementById('expFromDate').addEventListener('change', () => this.loadData())
    document.getElementById('expToDate').addEventListener('change', () => this.loadData())
    document.getElementById('btnExpMonth').addEventListener('click', () => { const n = new Date(); document.getElementById('expFromDate').value = toDateString(new Date(n.getFullYear(), n.getMonth(), 1)); document.getElementById('expToDate').value = todayString(); this.loadData() })
    document.getElementById('btnExpAll').addEventListener('click', () => { document.getElementById('expFromDate').value = '2020-01-01'; document.getElementById('expToDate').value = todayString(); this.loadData() })
    await this.loadData()
  },

  async loadData() {
    const from = document.getElementById('expFromDate')?.value
    const to = document.getElementById('expToDate')?.value
    const filters = {}
    if (from && to) { filters.fromDate = from; filters.toDate = to }
    const expenses = await API.expenses.getAll(filters)
    this.renderTable(expenses)
  },

  renderTable(expenses) {
    const el = document.getElementById('expensesTable')
    if (!el) return
    if (expenses.length === 0) { el.innerHTML = '<div class="data-table-wrapper"><div class="table-empty"><div class="empty-state"><div class="empty-state-icon">💸</div><div class="empty-state-text">لا توجد مصروفات</div></div></div></div>'; return }
    let totalAll = 0
    let html = '<div class="data-table-wrapper"><table class="data-table"><thead><tr><th>التاريخ</th><th>النوع</th><th>المبلغ</th><th>ملاحظات</th><th>الإجراءات</th></tr></thead><tbody>'
    expenses.forEach((e) => { totalAll += e.amount; html += `<tr><td class="date-cell">${new Date(e.date).toLocaleDateString('ar-EG')}</td><td>${escapeHtml(e.category)}</td><td class="number-cell amount-negative">${formatCurrency(e.amount)} ج.م</td><td>${escapeHtml(e.notes)}</td><td><button class="btn btn-sm btn-danger" data-action="delete" data-id="${e.id}">حذف</button></td></tr>` })
    html += '</tbody></table></div>'
    html += `<div class="table-footer"><span>الإجمالي: ${formatCurrency(totalAll)} ج.م</span></div>`
    el.innerHTML = html
    el.querySelectorAll('[data-action="delete"]').forEach((btn) => {
      btn.addEventListener('click', () => this.deleteExpense(btn.dataset.id))
    })
  },

  showAddModal() {
    const catOpts = this.expenseCategories.map(c => `<option value="${c}">${c}</option>`).join('')
    const content = `
      <form id="addExpenseForm">
        <div class="form-row">
          <div class="form-group"><label class="form-label">التاريخ</label><input type="date" class="form-input" id="expDate" value="${todayString()}"></div>
          <div class="form-group"><label class="form-label">نوع المصروف <span class="required">*</span></label><select class="form-select" id="expCategory" required><option value="">اختر النوع</option>${catOpts}</select></div>
        </div>
        <div class="form-group"><label class="form-label">المبلغ <span class="required">*</span></label><input type="number" class="form-input" id="expAmount" min="1" required placeholder="0"></div>
        <div class="form-group"><label class="form-label">ملاحظات</label><textarea class="form-textarea" id="expNotes" placeholder="ملاحظات"></textarea></div>
        <div class="form-actions"><button type="submit" class="btn btn-primary">حفظ</button><button type="button" class="btn btn-outline" id="modalCancelBtn">إلغاء</button></div>
      </form>
    `
    Modal.show('إضافة مصروف', content)
    document.getElementById('addExpenseForm').addEventListener('submit', (e) => this.saveExpense(e))
    document.getElementById('modalCancelBtn').addEventListener('click', () => Modal.close())
  },

  async saveExpense(event) {
    event.preventDefault()
    const category = document.getElementById('expCategory').value
    const amount = parseFloat(document.getElementById('expAmount').value)
    if (!category) { Toast.error('يرجى اختيار نوع المصروف'); return }
    if (!amount || amount <= 0) { Toast.error('يرجى إدخال مبلغ صحيح'); return }
    try {
      await API.expenses.create({ date: document.getElementById('expDate').value, category, amount, notes: document.getElementById('expNotes').value.trim() })
      Modal.close()
      Toast.success('تم حفظ المصروف بنجاح')
      await this.loadData()
    } catch (error) { Toast.error('حدث خطأ أثناء حفظ المصروف') }
  },

  async deleteExpense(id) {
    Modal.confirm('هل أنت متأكد من حذف هذا المصروف؟', async () => {
      try { await API.expenses.delete(id); Toast.success('تم حذف المصروف'); await this.loadData() } catch (e) { Toast.error('حدث خطأ') }
    })
  }
}

Router.register('expenses', (c) => ExpensesPage.render(c))
