import { Router } from './router.js'
import { API } from './api.js'
import { Modal } from './components/modal.js'
import { Toast } from './components/toast.js'
import { formatCurrency, formatCurrencyWithEGP, formatDate, todayString, escapeHtml, debounce } from './utilities.js'
import { Printing } from './printing.js'

const DentistsPage = {
  async render(container) {
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">👨‍⚕️ الأطباء</h1>
        <button class="btn btn-primary" id="btnAddDentist">+ إضافة طبيب</button>
      </div>
      <div class="filter-bar">
        <div class="search-box">
          <input type="text" class="form-input" id="dentistSearch" placeholder="بحث بالاسم أو الهاتف..." style="width:300px">
        </div>
      </div>
      <div id="dentistsTable"></div>
    `
    document.getElementById('btnAddDentist').addEventListener('click', () => this.showAddModal())
    document.getElementById('dentistSearch').addEventListener('input', debounce((e) => this.onSearch(e.target.value), 300))
    await this.loadData()
  },

  async loadData() {
    const dentists = await API.dentists.getAll()
    this.renderTable(dentists)
  },

  renderTable(dentists) {
    const el = document.getElementById('dentistsTable')
    if (!el) return
    if (dentists.length === 0) {
      el.innerHTML = '<div class="data-table-wrapper"><div class="table-empty"><div class="empty-state"><div class="empty-state-icon">👨‍⚕️</div><div class="empty-state-text">لا يوجد أطباء بعد</div></div></div></div>'
      return
    }
    let html = '<div class="data-table-wrapper"><table class="data-table"><thead><tr><th>الكود</th><th>الاسم</th><th>الهاتف</th><th>عدد الفواتير</th><th>إجمالي الفواتير</th><th>المدفوع</th><th>المتبقي</th><th>الإجراءات</th></tr></thead><tbody>'
    dentists.forEach((d) => {
      const rc = d.remaining > 0 ? 'amount-negative' : ''
      html += `<tr>
        <td class="code-cell">${d.dentistCode}</td>
        <td class="name-cell">${escapeHtml(d.name)}</td>
        <td>${escapeHtml(d.phone)}</td>
        <td class="text-center">${d.invoiceCount}</td>
        <td class="number-cell">${formatCurrency(d.totalInvoices)} ج.م</td>
        <td class="number-cell amount-positive">${formatCurrency(d.totalPaid)} ج.م</td>
        <td class="number-cell ${rc}">${formatCurrency(d.remaining)} ج.م</td>
        <td><div class="table-actions">
          <button class="btn btn-sm btn-primary" data-action="account" data-id="${d.id}">عرض الحساب</button>
          <button class="btn btn-sm btn-outline" data-action="edit" data-id="${d.id}">تعديل</button>
          <button class="btn btn-sm ${d.active ? 'btn-warning' : 'btn-success'}" data-action="toggle" data-id="${d.id}">${d.active ? 'تعطيل' : 'تفعيل'}</button>
        </div></td>
      </tr>`
    })
    html += '</tbody></table></div>'
    el.innerHTML = html

    el.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action
        const id = btn.dataset.id
        if (action === 'account') this.showAccount(id)
        else if (action === 'edit') this.showEditModal(id)
        else if (action === 'toggle') this.toggleActive(id)
      })
    })
  },

  async onSearch(query) {
    if (!query) { this.loadData(); return }
    const results = await API.dentists.search(query)
    this.renderTable(results)
  },

  showAddModal() {
    const content = `
      <form id="addDentistForm">
        <div class="form-group"><label class="form-label">اسم الطبيب <span class="required">*</span></label><input type="text" class="form-input" id="dentistName" required placeholder="أدخل اسم الطبيب"></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">رقم الهاتف</label><input type="text" class="form-input" id="dentistPhone" placeholder="01xxxxxxxxx"></div>
          <div class="form-group"><label class="form-label">اسم العيادة</label><input type="text" class="form-input" id="dentistClinic" placeholder="اسم العيادة"></div>
        </div>
        <div class="form-group"><label class="form-label">العنوان</label><input type="text" class="form-input" id="dentistAddress" placeholder="العنوان"></div>
        <div class="form-group"><label class="form-label">ملاحظات</label><textarea class="form-textarea" id="dentistNotes" placeholder="ملاحظات إضافية"></textarea></div>
        <div class="form-actions"><button type="submit" class="btn btn-primary">حفظ</button><button type="button" class="btn btn-outline" id="modalCancelBtn">إلغاء</button></div>
      </form>
    `
    Modal.show('إضافة طبيب جديد', content)
    document.getElementById('addDentistForm').addEventListener('submit', (e) => this.saveDentist(e))
    document.getElementById('modalCancelBtn').addEventListener('click', () => Modal.close())
  },

  async saveDentist(event) {
    event.preventDefault()
    const name = document.getElementById('dentistName').value.trim()
    if (!name) { Toast.error('اسم الطبيب مطلوب'); return }
    try {
      await API.dentists.create({ name, phone: document.getElementById('dentistPhone').value.trim(), clinic: document.getElementById('dentistClinic').value.trim(), address: document.getElementById('dentistAddress').value.trim(), notes: document.getElementById('dentistNotes').value.trim() })
      Modal.close()
      Toast.success('تم إضافة الطبيب بنجاح')
      await this.loadData()
    } catch (error) { Toast.error('حدث خطأ أثناء حفظ البيانات') }
  },

  async showEditModal(id) {
    const dentist = await API.dentists.getById(id)
    if (!dentist) return
    const content = `
      <form id="editDentistForm">
        <div class="form-group"><label class="form-label">اسم الطبيب <span class="required">*</span></label><input type="text" class="form-input" id="editDentistName" value="${escapeHtml(dentist.name)}" required></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">رقم الهاتف</label><input type="text" class="form-input" id="editDentistPhone" value="${escapeHtml(dentist.phone)}"></div>
          <div class="form-group"><label class="form-label">اسم العيادة</label><input type="text" class="form-input" id="editDentistClinic" value="${escapeHtml(dentist.clinic)}"></div>
        </div>
        <div class="form-group"><label class="form-label">العنوان</label><input type="text" class="form-input" id="editDentistAddress" value="${escapeHtml(dentist.address)}"></div>
        <div class="form-group"><label class="form-label">ملاحظات</label><textarea class="form-textarea" id="editDentistNotes">${escapeHtml(dentist.notes)}</textarea></div>
        <div class="form-actions"><button type="submit" class="btn btn-primary">حفظ التعديلات</button><button type="button" class="btn btn-outline" id="modalCancelBtn">إلغاء</button></div>
      </form>
    `
    Modal.show('تعديل بيانات الطبيب', content)
    document.getElementById('editDentistForm').addEventListener('submit', (e) => this.updateDentist(e, id))
    document.getElementById('modalCancelBtn').addEventListener('click', () => Modal.close())
  },

  async updateDentist(event, id) {
    event.preventDefault()
    try {
      await API.dentists.update(id, { name: document.getElementById('editDentistName').value.trim(), phone: document.getElementById('editDentistPhone').value.trim(), clinic: document.getElementById('editDentistClinic').value.trim(), address: document.getElementById('editDentistAddress').value.trim(), notes: document.getElementById('editDentistNotes').value.trim() })
      Modal.close()
      Toast.success('تم تعديل البيانات بنجاح')
      await this.loadData()
    } catch (error) { Toast.error('حدث خطأ أثناء حفظ التعديلات') }
  },

  async toggleActive(id) {
    Modal.confirm('هل أنت متأكد من تنفيذ هذه العملية؟', async () => {
      try { await API.dentists.deactivate(id); Toast.success('تم تحديث الحالة بنجاح'); await this.loadData() } catch (error) { Toast.error('حدث خطأ') }
    })
  },

  async showAccount(id) {
    const account = await API.dentists.getAccount(id)
    if (!account) return
    const container = document.getElementById('page-container')
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">كشف حساب الطبيب</h1>
        <div class="btn-group">
          <button class="btn btn-primary" id="btnPrintStatement">🖨 طباعة كشف الحساب</button>
          <button class="btn btn-outline" id="btnBackToDentists">العودة</button>
        </div>
      </div>
      <div class="account-header">
        <div class="account-info">
          <div class="account-info-item"><span class="account-info-label">الاسم:</span><span>${escapeHtml(account.dentist.name)}</span></div>
          <div class="account-info-item"><span class="account-info-label">الهاتف:</span><span>${escapeHtml(account.dentist.phone)}</span></div>
          <div class="account-info-item"><span class="account-info-label">العيادة:</span><span>${escapeHtml(account.dentist.clinic)}</span></div>
        </div>
      </div>
      <div class="kpi-grid">
        <div class="kpi-card info"><div class="kpi-label">عدد الفواتير</div><div class="kpi-value">${account.summary.invoiceCount}</div></div>
        <div class="kpi-card"><div class="kpi-label">إجمالي الفواتير</div><div class="kpi-value">${formatCurrencyWithEGP(account.summary.totalInvoices)}</div></div>
        <div class="kpi-card success"><div class="kpi-label">إجمالي المدفوع</div><div class="kpi-value">${formatCurrencyWithEGP(account.summary.totalPaid)}</div></div>
        <div class="kpi-card ${account.summary.remaining > 0 ? 'danger' : 'success'}"><div class="kpi-label">إجمالي المتبقي</div><div class="kpi-value">${formatCurrencyWithEGP(account.summary.remaining)}</div></div>
      </div>
      <div class="filter-bar">
        <span class="date-label" style="font-weight:600;color:var(--text-secondary)">من تاريخ:</span>
        <input type="date" class="form-input" id="accountFrom" value="2020-01-01" style="width:160px">
        <span style="color:var(--text-secondary)">إلى</span>
        <input type="date" class="form-input" id="accountTo" value="${todayString()}" style="width:160px">
        <button class="btn btn-sm btn-outline" id="btnAccToday">اليوم</button>
        <button class="btn btn-sm btn-outline" id="btnAccMonth">هذا الشهر</button>
        <button class="btn btn-sm btn-outline" id="btnAccAll">كل الحساب</button>
        <button class="btn btn-sm btn-primary" id="btnAccSearch">بحث</button>
      </div>
      <div id="accountLedger"></div>
    `
    document.getElementById('btnPrintStatement').addEventListener('click', () => Printing.printDentistStatement(id))
    document.getElementById('btnBackToDentists').addEventListener('click', () => Router.navigate('dentists'))
    document.getElementById('btnAccToday').addEventListener('click', () => this.filterAccount(id, 'today'))
    document.getElementById('btnAccMonth').addEventListener('click', () => this.filterAccount(id, 'month'))
    document.getElementById('btnAccAll').addEventListener('click', () => this.filterAccount(id, 'all'))
    document.getElementById('btnAccSearch').addEventListener('click', () => this.filterAccount(id, 'search'))
    this.renderLedger(account.ledger)
  },

  renderLedger(ledger) {
    const el = document.getElementById('accountLedger')
    if (!el) return
    if (ledger.length === 0) { el.innerHTML = '<div class="data-table-wrapper"><div class="table-empty"><div class="empty-state"><div class="empty-state-text">لا توجد حركات</div></div></div></div>'; return }
    let html = '<div class="data-table-wrapper"><table class="data-table"><thead><tr><th>التاريخ</th><th>نوع العملية</th><th>البيان</th><th>مدين</th><th>دائن</th><th>الرصيد</th></tr></thead><tbody>'
    ledger.forEach((e) => {
      const bc = e.balance > 0 ? 'amount-negative' : e.balance < 0 ? 'amount-positive' : ''
      html += `<tr>
        <td class="date-cell">${formatDate(e.date)}</td>
        <td><span class="activity-type ${e.type === 'INVOICE' ? 'invoice' : 'payment'}">${e.type === 'INVOICE' ? 'فاتورة' : 'دفعة'}</span></td>
        <td>${escapeHtml(e.description)}</td>
        <td class="number-cell ${e.debit > 0 ? 'amount-negative' : ''}">${e.debit > 0 ? formatCurrency(e.debit) + ' ج.م' : '-'}</td>
        <td class="number-cell ${e.credit > 0 ? 'amount-positive' : ''}">${e.credit > 0 ? formatCurrency(e.credit) + ' ج.م' : '-'}</td>
        <td class="number-cell ${bc}">${formatCurrency(e.balance)} ج.م</td>
      </tr>`
    })
    html += '</tbody></table></div>'
    el.innerHTML = html
  },

  async filterAccount(dentistId, type) {
    let from, to
    if (type === 'today') { from = to = todayString() }
    else if (type === 'month') { const n = new Date(); from = new Date(n.getFullYear(), n.getMonth(), 1).toISOString().split('T')[0]; to = todayString() }
    else if (type === 'all') { from = '2020-01-01'; to = todayString() }
    else { from = document.getElementById('accountFrom').value; to = document.getElementById('accountTo').value }
    document.getElementById('accountFrom').value = from
    document.getElementById('accountTo').value = to
    const account = await API.dentists.getAccount(dentistId, from, to)
    this.renderLedger(account.ledger)
  }
}

Router.register('dentists', (c) => DentistsPage.render(c))
