import { Router } from './router.js'
import { API } from './api.js'
import { Modal } from './components/modal.js'
import { Toast } from './components/toast.js'
import { formatCurrency, escapeHtml } from './utilities.js'
import { Auth } from './auth.js'

const SettingsPage = {
  async render(container) {
    const settings = await API.settings.get()
    const items = await API.items.getAll()

    container.innerHTML = `
      <div class="page-header"><h1 class="page-title">⚙️ الإعدادات</h1></div>
      <div class="card mb-3">
        <div class="card-title">بيانات المعمل</div>
        <form id="settingsForm">
          <div class="form-row">
            <div class="form-group"><label class="form-label">اسم المعمل</label><input type="text" class="form-input" id="setLabName" value="${escapeHtml(settings.labName)}"></div>
            <div class="form-group"><label class="form-label">الهاتف</label><input type="text" class="form-input" id="setPhone" value="${escapeHtml(settings.phone)}"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">العنوان</label><input type="text" class="form-input" id="setAddress" value="${escapeHtml(settings.address)}"></div>
            <div class="form-group"><label class="form-label">واتساب</label><input type="text" class="form-input" id="setWhatsapp" value="${escapeHtml(settings.whatsapp)}"></div>
          </div>
          <div class="form-group"><label class="form-label">البريد الإلكتروني</label><input type="email" class="form-input" id="setEmail" value="${escapeHtml(settings.email)}"></div>
          <div class="form-actions"><button type="submit" class="btn btn-primary">حفظ الإعدادات</button></div>
        </form>
      </div>
      <div class="card mb-3">
        <div class="card-title">الأصناف</div>
        <div id="itemsList"></div>
        <button class="btn btn-primary mt-2" id="btnAddItem">+ إضافة صنف</button>
      </div>
      <div class="card">
        <div class="card-title">النسخ الاحتياطي</div>
        <div class="btn-group">
          <button class="btn btn-primary" id="btnBackup">إنشاء نسخة احتياطية</button>
          <button class="btn btn-warning" id="btnRestore">استعادة نسخة احتياطية</button>
        </div>
        ${Auth.isAdmin() ? `<div class="card-title" style="margin-top:20px;color:var(--danger)">منطقة خطرة</div>
        <button class="btn btn-danger" id="btnResetFinancial">🗑️ تصفير جميع التعاملات المالية</button>` : ''}
      </div>
    `
    document.getElementById('settingsForm').addEventListener('submit', (e) => this.saveSettings(e))
    document.getElementById('btnAddItem').addEventListener('click', () => this.showAddItemModal())
    document.getElementById('btnBackup').addEventListener('click', () => this.createBackup())
    document.getElementById('btnRestore').addEventListener('click', () => this.restoreBackup())
    const resetBtn = document.getElementById('btnResetFinancial')
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.showResetFinancialModal())
    }
    this.renderItems(items)
  },

  renderItems(items) {
    const el = document.getElementById('itemsList')
    if (!el) return
    if (items.length === 0) { el.innerHTML = '<div class="empty-state" style="padding:16px"><div class="empty-state-text">لا توجد أصناف بعد</div></div>'; return }
    let html = '<div class="data-table-wrapper"><table class="data-table"><thead><tr><th>الاسم</th><th>السعر</th><th>الحالة</th><th>الإجراءات</th></tr></thead><tbody>'
    items.forEach((item) => {
      html += `<tr><td class="name-cell">${escapeHtml(item.name)}</td><td class="number-cell">${formatCurrency(item.price)} ج.م</td><td><span class="status-badge ${item.active ? 'status-paid' : 'status-cancelled'}">${item.active ? 'نشط' : 'معطل'}</span></td><td><div class="table-actions"><button class="btn btn-sm btn-outline" data-action="editItem" data-id="${item.id}">تعديل</button><button class="btn btn-sm ${item.active ? 'btn-warning' : 'btn-success'}" data-action="toggleItem" data-id="${item.id}">${item.active ? 'تعطيل' : 'تفعيل'}</button><button class="btn btn-sm btn-danger" data-action="deleteItem" data-id="${item.id}" data-name="${escapeHtml(item.name)}">🗑️</button></div></td></tr>`
    })
    html += '</tbody></table></div>'
    el.innerHTML = html
    el.querySelectorAll('[data-action="toggleItem"]').forEach((btn) => { btn.addEventListener('click', () => this.toggleItem(btn.dataset.id)) })
    el.querySelectorAll('[data-action="editItem"]').forEach((btn) => { btn.addEventListener('click', () => this.showEditItemModal(btn.dataset.id)) })
    el.querySelectorAll('[data-action="deleteItem"]').forEach((btn) => { btn.addEventListener('click', () => this.deleteItem(btn.dataset.id, btn.dataset.name)) })
  },

  async saveSettings(event) {
    event.preventDefault()
    try {
      await API.settings.update({ labName: document.getElementById('setLabName').value.trim(), phone: document.getElementById('setPhone').value.trim(), address: document.getElementById('setAddress').value.trim(), whatsapp: document.getElementById('setWhatsapp').value.trim(), email: document.getElementById('setEmail').value.trim() })
      const s = await API.settings.get()
      document.getElementById('labNameSidebar').textContent = s.labName || 'معمل الأسنان'
      Toast.success('تم حفظ الإعدادات بنجاح')
    } catch (error) { Toast.error('حدث خطأ أثناء الحفظ') }
  },

  showAddItemModal() {
    const content = `
      <form id="addItemForm">
        <div class="form-group"><label class="form-label">اسم الصنف <span class="required">*</span></label><input type="text" class="form-input" id="itemName" required placeholder="اسم الصنف"></div>
        <div class="form-group"><label class="form-label">السعر <span class="required">*</span></label><input type="number" class="form-input" id="itemPrice" min="0" required placeholder="0"></div>
        <div class="form-actions"><button type="submit" class="btn btn-primary">حفظ</button><button type="button" class="btn btn-outline" id="modalCancelBtn">إلغاء</button></div>
      </form>
    `
    Modal.show('إضافة صنف جديد', content)
    document.getElementById('addItemForm').addEventListener('submit', (e) => this.saveItem(e))
    document.getElementById('modalCancelBtn').addEventListener('click', () => Modal.close())
  },

  async showEditItemModal(id) {
    const items = await API.items.getAll()
    const item = items.find(i => i.id === id)
    if (!item) return
    const content = `
      <form id="editItemForm">
        <div class="form-group"><label class="form-label">اسم الصنف</label><input type="text" class="form-input" id="editItemName" value="${escapeHtml(item.name)}" required></div>
        <div class="form-group"><label class="form-label">التصنيف</label><select class="form-select" id="editItemCategory"><option value="">اختر التصنيف</option></select></div>
        <div class="form-group"><label class="form-label">السعر</label><input type="number" class="form-input" id="editItemPrice" value="${item.price}" min="0" required></div>
        <div class="form-actions"><button type="submit" class="btn btn-primary">حفظ التعديلات</button><button type="button" class="btn btn-outline" id="modalCancelBtn">إلغاء</button></div>
      </form>
    `
    Modal.show('تعديل الصنف', content)
    document.getElementById('editItemForm').addEventListener('submit', (e) => this.updateItem(e, id))
    document.getElementById('modalCancelBtn').addEventListener('click', () => Modal.close())
    API.categories.getActive().then((cats) => {
      const sel = document.getElementById('editItemCategory')
      if (sel) cats.forEach((c) => { sel.innerHTML += `<option value="${c.id}" ${c.id === item.categoryId ? 'selected' : ''}>${escapeHtml(c.name)}</option>` })
    })
  },

  async saveItem(event) {
    event.preventDefault()
    try { await API.items.create({ name: document.getElementById('itemName').value.trim(), categoryId: '', price: parseFloat(document.getElementById('itemPrice').value) }); Modal.close(); Toast.success('تم إضافة الصنف بنجاح'); this.renderItems(await API.items.getAll()) } catch (e) { Toast.error('حدث خطأ') }
  },

  async updateItem(event, id) {
    event.preventDefault()
    try { await API.items.update(id, { name: document.getElementById('editItemName').value.trim(), categoryId: document.getElementById('editItemCategory').value, price: parseFloat(document.getElementById('editItemPrice').value) }); Modal.close(); Toast.success('تم تعديل الصنف بنجاح'); this.renderItems(await API.items.getAll()) } catch (e) { Toast.error('حدث خطأ') }
  },

  async toggleItem(id) {
    try { await API.items.deactivate(id); this.renderItems(await API.items.getAll()) } catch (e) { Toast.error('حدث خطأ') }
  },

  async deleteItem(id, name) {
    Modal.confirm(`هل أنت متأكد من حذف الصنف "${name}"؟`, async () => {
      try { await API.items.delete(id); Toast.success('تم حذف الصنف بنجاح'); this.renderItems(await API.items.getAll()) } catch (e) { Toast.error('حدث خطأ في حذف الصنف') }
    }, { confirmText: 'نعم، حذف', confirmClass: 'btn-danger' })
  },

  async createBackup() {
    try { const r = await API.backup.create(); if (!r.canceled) Toast.success('تم إنشاء النسخة الاحتياطية بنجاح') } catch (e) { Toast.error(e.message || 'حدث خطأ') }
  },

  async restoreBackup() {
    Modal.confirm('هل أنت متأكد من استعادة النسخة الاحتياطية؟', async () => {
      try { 
        const r = await API.backup.restore(); 
        if (!r.canceled) {
          Toast.success('تم اخذ النسخة الاحتياطية بنجاح')
          setTimeout(() => {
            Toast.info('يرجى إعادة تشغيل البرنامج مرة أخرى لجلب البيانات')
          }, 1500)
        }
      } catch (e) { Toast.error(e.message || 'حدث خطأ') }
    }, { confirmText: 'نعم، استعادة', confirmClass: 'btn-warning' })
  },

  showResetFinancialModal() {
    Modal.confirm('⚠️ تنبيه هام: سيتم أخذ نسخة احتياطية تلقائياً قبل هذه العملية.\n\nسيتم حذف جميع التعاملات المالية (الطلبات، الفواتير، الدفعات، المصروفات، سجل التدقيق) نهائياً.\n\nملاحظة: بيانات المخزن ستُحفظ.\n\nهل أنت متأكد؟', async () => {
      try {
        const result = await API.reset.financialWithBackup()
        if (result && !result.canceled) {
          Toast.success('تم حفظ النسخة الاحتياطية وتصفير جميع التعاملات المالية بنجاح')
        }
      } catch (e) {
        Toast.error(e.message || 'حدث خطأ أثناء العملية')
      }
    }, { title: 'تصفير جميع التعاملات المالية', confirmText: 'نعم، تصفير الكل', confirmClass: 'btn-danger' })
  }
}

Router.register('settings', (c) => SettingsPage.render(c))
