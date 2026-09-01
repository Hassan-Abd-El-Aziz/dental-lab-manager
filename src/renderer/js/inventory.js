import { Router } from './router.js'
import { API } from './api.js'
import { Modal } from './components/modal.js'
import { Toast } from './components/toast.js'
import { Auth } from './auth.js'
import { formatDate, escapeHtml } from './utilities.js'

const InventoryPage = {
  items: [],
  searchQuery: '',

  async render(container) {
    this.container = container
    await this.loadData()
  },

  async loadData() {
    this.items = await API.inventory.getAll()
    this.renderUI()
  },

  get filteredItems() {
    if (!this.searchQuery.trim()) return this.items
    const q = this.searchQuery.trim().toLowerCase()
    return this.items.filter(i => i.name.toLowerCase().includes(q))
  },

  renderUI() {
    const el = this.container
    if (!el) return
    const filtered = this.filteredItems
    const isAdmin = Auth.isAdmin()
    el.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">📦 المخزن</h1>
        <div class="btn-group">
          <button class="btn btn-sm btn-primary" id="btnAddItem">➕ إضافة صنف</button>
          <button class="btn btn-sm btn-outline" id="btnStocktake">🔍 جرد سريع</button>
        </div>
      </div>
      <div class="filter-bar">
        <div class="search-box" style="flex:1;max-width:400px">
          <input type="text" class="form-input" id="inventorySearch" placeholder="بحث باسم الصنف..." value="${escapeHtml(this.searchQuery)}">
        </div>
      </div>
      <div class="card">
        <table class="data-table">
          <thead><tr><th>الصنف</th><th>الكمية</th><th>المسحوب</th><th>المتبقي</th><th>سعر الواحدة</th><th style="width:220px">الإجراءات</th></tr></thead>
          <tbody id="inventoryTableBody">${filtered.length === 0
            ? '<tr><td colspan="6"><div class="table-empty"><div class="empty-state"><div class="empty-state-icon">📦</div><div class="empty-state-text">لا توجد أصناف في المخزن</div></div></div></td></tr>'
            : filtered.map((i) => {
              const remainingClass = i.remaining === 0 ? 'amount-negative' : i.remaining < 10 ? 'amount-warning' : 'amount-positive'
              return `<tr>
                <td class="name-cell">${escapeHtml(i.name)}</td>
                <td class="number-cell" style="font-weight:600">${i.quantity}</td>
                <td class="number-cell" style="color:var(--warning)">${i.withdrawn}</td>
                <td class="${remainingClass}" style="font-weight:600">${i.remaining}</td>
                <td class="number-cell">${i.price ? i.price + ' ج.م' : '-'}</td>
                <td>
                  <div class="table-actions">
                    <button class="btn btn-sm btn-outline" data-action="set" data-id="${i.id}">تعديل</button>
                    <button class="btn btn-sm btn-primary" data-action="withdraw" data-id="${i.id}" ${i.remaining > 0 ? '' : 'disabled'}>سحب</button>
                    <button class="btn btn-sm btn-danger" data-action="reset" data-id="${i.id}" title="تصفير">🗑️</button>
                    ${isAdmin ? `<button class="btn btn-sm btn-danger" data-action="delete" data-id="${i.id}" title="حذف">❌</button>` : ''}
                  </div>
                </td>
              </tr>`
            }).join('')}
          </tbody>
        </table>
      </div>
    `

    document.getElementById('btnAddItem').addEventListener('click', () => this.showAddItemModal())
    document.getElementById('btnStocktake').addEventListener('click', () => this.showStocktakeModal())
    const searchInput = document.getElementById('inventorySearch')
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value
        this.updateTable()
      })
    }

    el.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.dataset.action === 'set') this.showSetQtyModal(btn.dataset.id)
        else if (btn.dataset.action === 'withdraw') this.showWithdrawModal(btn.dataset.id)
        else if (btn.dataset.action === 'reset') this.showResetModal(btn.dataset.id)
        else if (btn.dataset.action === 'delete') this.showDeleteModal(btn.dataset.id)
      })
    })
  },

  updateTable() {
    const tbody = document.getElementById('inventoryTableBody')
    if (!tbody) return
    const filtered = this.filteredItems
    const isAdmin = Auth.isAdmin()
    tbody.innerHTML = filtered.length === 0
      ? '<tr><td colspan="6"><div class="table-empty"><div class="empty-state"><div class="empty-state-icon">📦</div><div class="empty-state-text">لا توجد أصناف في المخزن</div></div></div></td></tr>'
      : filtered.map((i) => {
        const remainingClass = i.remaining === 0 ? 'amount-negative' : i.remaining < 10 ? 'amount-warning' : 'amount-positive'
        return `<tr>
          <td class="name-cell">${escapeHtml(i.name)}</td>
          <td class="number-cell" style="font-weight:600">${i.quantity}</td>
          <td class="number-cell" style="color:var(--warning)">${i.withdrawn}</td>
          <td class="${remainingClass}" style="font-weight:600">${i.remaining}</td>
          <td class="number-cell">${i.price ? i.price + ' ج.م' : '-'}</td>
          <td>
            <div class="table-actions">
              <button class="btn btn-sm btn-outline" data-action="set" data-id="${i.id}">تعديل</button>
              <button class="btn btn-sm btn-primary" data-action="withdraw" data-id="${i.id}" ${i.remaining > 0 ? '' : 'disabled'}>سحب</button>
              <button class="btn btn-sm btn-danger" data-action="reset" data-id="${i.id}" title="تصفير">🗑️</button>
              ${isAdmin ? `<button class="btn btn-sm btn-danger" data-action="delete" data-id="${i.id}" title="حذف">❌</button>` : ''}
            </div>
          </td>
        </tr>`
      }).join('')

    tbody.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.dataset.action === 'set') this.showSetQtyModal(btn.dataset.id)
        else if (btn.dataset.action === 'withdraw') this.showWithdrawModal(btn.dataset.id)
        else if (btn.dataset.action === 'reset') this.showResetModal(btn.dataset.id)
        else if (btn.dataset.action === 'delete') this.showDeleteModal(btn.dataset.id)
      })
    })
  },

  showDeleteModal(id) {
    const item = this.items.find(i => i.id === id)
    if (!item) return
    Modal.confirm(
      `هل أنت متأكد من حذف "${item.name}" من المخزن؟`,
      async () => {
        try {
          await API.items.delete(id)
          Toast.success('تم حذف الصنف بنجاح')
          await this.loadData()
        } catch (error) {
          Toast.error(error.message || 'حدث خطأ في الحذف')
        }
      },
      { title: 'تأكيد الحذف', confirmText: 'نعم، حذف', confirmClass: 'btn-danger' }
    )
  },

  showAddItemModal() {
    const content = `
      <form id="addItemForm">
        <div class="form-group"><label class="form-label">اسم الصنف <span class="required">*</span></label><input type="text" class="form-input" id="itemName" required placeholder="مثال: خامة porcelaine"></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">الكمية <span class="required">*</span></label><input type="number" class="form-input" id="itemQty" min="0" value="0" required></div>
          <div class="form-group"><label class="form-label">سعر الوحدة (ج.م)</label><input type="number" class="form-input" id="itemPrice" min="0" step="0.01" value="0" placeholder="0.00"></div>
        </div>
        <div class="form-actions"><button type="submit" class="btn btn-primary">إضافة</button><button type="button" class="btn btn-outline" id="modalCancelBtn">إلغاء</button></div>
      </form>
    `
    Modal.show('إضافة صنف جديد', content, { size: 'md' })
    document.getElementById('modalCancelBtn').addEventListener('click', () => Modal.close())
    document.getElementById('addItemForm').addEventListener('submit', async (e) => {
      e.preventDefault()
      const name = document.getElementById('itemName').value.trim()
      const quantity = parseInt(document.getElementById('itemQty').value) || 0
      const price = parseFloat(document.getElementById('itemPrice').value) || 0
      if (!name) { Toast.error('اسم الصنف مطلوب'); return }
      try {
        await API.items.create({ name, categoryId: '', price, quantity, inventory: true })
        Toast.success('تم إضافة الصنف بنجاح')
        Modal.close()
        await this.loadData()
      } catch (error) {
        Toast.error(error.message || 'حدث خطأ')
      }
    })
  },

  showSetQtyModal(id) {
    const item = this.items.find(i => i.id === id)
    if (!item) return

    const content = `
      <form id="setQtyForm">
        <div class="form-group"><label class="form-label">الصنف</label><div class="form-input" style="background:#f8fafc;padding:8px;border-radius:6px">${escapeHtml(item.name)}</div></div>
        <div class="form-group"><label class="form-label">الكمية الحالية</label><div class="form-input" style="background:#f8fafc;padding:8px;border-radius:6px">${item.quantity || 0}</div></div>
        <div class="form-group"><label class="form-label">الكمية المضافة</label><input type="number" class="form-input" id="newQty" value="0" min="0"></div>
        <div class="form-group"><label class="form-label">الصندوق</label><input type="text" class="form-input" id="itemBox" value="${escapeHtml(item.box || '')}" placeholder="مثال: الرف 3، الصندوق أ"></div>
        <div class="form-group"><label class="form-label">ملاحظات</label><input type="text" class="form-input" id="itemNotes" placeholder="مثال: شراء جديد، استعاصم"></div>
        <div class="form-actions"><button type="submit" class="btn btn-primary">حفظ</button><button type="button" class="btn btn-outline" id="modalCancelBtn">إلغاء</button></div>
      </form>
    `

    Modal.show('تعديل الكمية', content, { size: 'md' })
    document.getElementById('modalCancelBtn').addEventListener('click', () => Modal.close())
    document.getElementById('setQtyForm').addEventListener('submit', async (e) => {
      e.preventDefault()
      const qty = parseInt(document.getElementById('newQty').value) || 0
      const box = document.getElementById('itemBox').value.trim()
      const notes = document.getElementById('itemNotes').value.trim()
      try {
        await API.inventory.setQuantity(id, qty, box, notes)
        Toast.success('تم تحديث الكمية')
        Modal.close()
        await this.loadData()
      } catch (error) {
        Toast.error(error.message || 'حدث خطأ')
      }
    })
  },

  showWithdrawModal(id) {
    const item = this.items.find(i => i.id === id)
    if (!item) return

    const content = `
      <form id="withdrawForm">
        <div class="form-group"><label class="form-label">الصنف</label><div class="form-input" style="background:#f8fafc;padding:8px;border-radius:6px">${escapeHtml(item.name)}</div></div>
        <div class="form-group"><label class="form-label">المتبقي في المخزن</label><div class="form-input" style="background:#f8fafc;padding:8px;border-radius:6px;color:var(--success);font-weight:600">${item.remaining}</div></div>
        <div class="form-group"><label class="form-label">الكمية للسحب</label><input type="number" class="form-input" id="withdrawQty" min="1" max="${item.remaining}" value="1" required></div>
        <div class="form-group"><label class="form-label">ملاحظات (اختياري)</label><input type="text" class="form-input" id="withdrawNotes" placeholder="مثال: استخدم في طلب #12345"></div>
        <div class="form-actions"><button type="submit" class="btn btn-primary">سحب</button><button type="button" class="btn btn-outline" id="modalCancelBtn">إلغاء</button></div>
      </form>
    `

    Modal.show('سحب من المخزن', content, { size: 'md' })
    document.getElementById('modalCancelBtn').addEventListener('click', () => Modal.close())
    document.getElementById('withdrawForm').addEventListener('submit', async (e) => {
      e.preventDefault()
      const qty = parseInt(document.getElementById('withdrawQty').value) || 0
      const notes = document.getElementById('withdrawNotes').value.trim()
      if (qty <= 0) { Toast.error('الكمية يجب أن تكون أكبر من الصفر'); return }
      if (qty > item.remaining) { Toast.error('الكمية المطلوبة غير متوفرة'); return }
      try {
        await API.inventory.withdraw(id, qty, null, notes)
        Toast.success(`تم سحب ${qty} وحدة من ${item.name}`)
        Modal.close()
        await this.loadData()
      } catch (error) {
        Toast.error(error.message || 'حدث خطأ')
      }
    })
  },

  showResetModal(id) {
    const item = this.items.find(i => i.id === id)
    if (!item) return

    Modal.confirm(
      `هل أنت متأكد من تصفير مخزون "${item.name}"؟ سيتم حذف الكمية والمسحوب والمتبقي.`,
      async () => {
        try {
          await API.inventory.reset(id)
          Toast.success('تم تصفير المخزون بنجاح')
          await this.loadData()
        } catch (error) {
          Toast.error(error.message || 'حدث خطأ')
        }
      },
      { title: 'تأكيد تصفير المخزون', confirmText: 'نعم، تصفير', confirmClass: 'btn-danger' }
    )
  },

  showStocktakeModal() {
    const content = `
      <div style="max-height:500px;overflow-y:auto">
        <table class="order-items-table" id="stocktakeTable">
          <thead><tr><th style="width:30%">الصنف</th><th style="width:15%">الكمية</th><th style="width:15%">المسحوب</th><th style="width:15%">المتبقي</th><th style="width:15%">سعر الواحدة</th></tr></thead>
          <tbody>${this.items.map((i) => {
            return `<tr>
              <td><input type="text" class="form-input" value="${escapeHtml(i.name)}" readonly style="background:#f8fafc"></td>
              <td><input type="number" value="${i.quantity}" readonly style="background:#f8fafc"></td>
              <td><input type="number" value="${i.withdrawn}" readonly style="background:#f8fafc"></td>
              <td><input type="number" value="${i.remaining}" readonly style="background:#f8fafc"></td>
              <td><input type="text" value="${i.price ? i.price + ' ج.م' : '-'}" readonly style="background:#f8fafc"></td>
            </tr>`
          }).join('')}
          </tbody>
        </table>
      </div>
      <div class="form-actions" style="margin-top:16px">
        <button class="btn btn-outline" id="btnPrintStocktake">🖨️ طباعة</button>
        <button type="button" class="btn btn-outline" id="modalCancelBtn">إلغاء</button>
      </div>
    `

    Modal.show('🔍 جرد سريع للمخزن', content, { size: 'lg' })
    document.getElementById('modalCancelBtn').addEventListener('click', () => Modal.close())
    document.getElementById('btnPrintStocktake').addEventListener('click', async () => await this.printStocktake())
  },

  async printStocktake() {
    const settings = await API.settings.get()
    const labName = settings?.labName || 'معمل الأسنان'
    const dateStr = formatDate(new Date())
    let itemsHtml = this.items.map((i) => `<tr><td>${escapeHtml(i.name)}</td><td>${i.quantity}</td><td>${i.withdrawn}</td><td>${i.remaining}</td><td>${i.price ? i.price + ' ج.م' : '-'}</td></tr>`).join('')
    const html = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>جرد المخزن</title><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Cairo',sans-serif;padding:20mm;color:#1e293b;line-height:1.6}@page{size:A4;margin:10mm}.header{text-align:center;margin-bottom:20px;padding-bottom:15px;border-bottom:2px solid #1e293b}.lab-icon{font-size:48px;margin-bottom:8px}.lab-name{font-size:24px;font-weight:800}.doc-title{font-size:20px;font-weight:700;margin-top:12px}.date{font-size:14px;color:#64748b;margin-top:8px}table{width:100%;border-collapse:collapse;margin:20px 0}th{padding:10px;text-align:right;font-size:14px;font-weight:700;background:#f1f5f9;border:1px solid #e2e8f0}td{padding:10px;border:1px solid #e2e8f0;font-size:13px}.footer{margin-top:30px;padding-top:15px;border-top:1px solid #e2e8f0;text-align:center;font-size:11px;color:#94a3b8}@media print{body{padding:15mm}}</style></head><body><div class="header"><div class="lab-icon">🦷</div><div class="lab-name">${escapeHtml(labName)}</div><div class="doc-title">جرد المخزن</div><div class="date">التاريخ: ${dateStr}</div></div><table><thead><tr><th>الصنف</th><th>الكمية</th><th>المسحوب</th><th>المتبقي</th><th>سعر الواحدة</th></tr></thead><tbody>${itemsHtml}</tbody></table><div class="footer">شكرا لتعاملكم معنا</div></body></html>`
    const pw = window.open('', '_blank', 'width=900,height=700')
    if (pw) {
      pw.document.write(html)
      pw.document.close()
      pw.onload = () => pw.print()
    }
  }
}

Router.register('inventory', (c) => InventoryPage.render(c))
