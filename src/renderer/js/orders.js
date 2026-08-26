import { Router } from './router.js'
import { API } from './api.js'
import { Toast } from './components/toast.js'
import { formatCurrency, formatCurrencyWithEGP, todayString, escapeHtml } from './utilities.js'
import { Printing } from './printing.js'

const OrdersPage = {
  categories: [],
  dentists: [],
  items: [],

  async render(container) {
    this.categories = await API.categories.getActive()
    this.dentists = await API.dentists.getAll()
    this.items = await API.items.getAll()

    const teethOpts = '<option value="">-</option>' + [1,2,3,4,5,6,7,8].map(n => `<option value="${n}">${n}</option>`).join('')
    const catOpts = this.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">🦷 طلب جديد</h1>
        <button class="btn btn-outline" id="btnBack">العودة</button>
      </div>
      <div class="card">
        <div class="form-section">
          <div class="form-section-title">بيانات الطلب</div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">تاريخ الطلب</label><input type="date" class="form-input" id="orderDate" value="${todayString()}"></div>
            <div class="form-group"><label class="form-label">الطبيب <span class="required">*</span></label><select class="form-select" id="orderDentist" required><option value="">اختر الطبيب</option>${this.dentists.filter(d => d.active).map(d => `<option value="${d.id}">${d.dentistCode} - ${d.name}</option>`).join('')}</select></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">الحالة</label><select class="form-select" id="orderCondition"><option value="حالة جديدة">حالة جديدة</option><option value="تعديل">تعديل</option><option value="إعادة">إعادة</option><option value="أخرى">أخرى</option></select></div>
            <div class="form-group"><label class="form-label">التشخيص</label><input type="text" class="form-input" id="orderDiagnosis" placeholder="التشخيص"></div>
          </div>
          <div class="form-row-4">
            <div class="form-group"><label class="form-label">الأسنان العلوية 1</label><select class="form-select" id="orderUpperTooth1">${teethOpts}</select></div>
            <div class="form-group"><label class="form-label">الأسنان العلوية 2</label><select class="form-select" id="orderUpperTooth2">${teethOpts}</select></div>
            <div class="form-group"><label class="form-label">الأسنان السفلية 1</label><select class="form-select" id="orderLowerTooth1">${teethOpts}</select></div>
            <div class="form-group"><label class="form-label">الأسنان السفلية 2</label><select class="form-select" id="orderLowerTooth2">${teethOpts}</select></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">التصنيف</label><select class="form-select" id="orderCategory"><option value="">اختر التصنيف</option>${catOpts}</select></div>
            <div class="form-group"><label class="form-label">تعليق التصنيف</label><textarea class="form-textarea" id="orderCategoryComment" placeholder="مثال: لون A2، التسليم يوم الخميس" rows="2"></textarea></div>
          </div>
        </div>
        <div class="form-section">
          <div class="form-section-title">الأصناف</div>
          <table class="order-items-table" id="orderItemsTable">
            <thead><tr><th style="width:40%">الصنف</th><th style="width:15%">السعر</th><th style="width:15%">الكمية</th><th style="width:20%">الإجمالي</th><th style="width:10%"></th></tr></thead>
            <tbody id="orderItemsBody"></tbody>
          </table>
          <button class="btn btn-sm btn-outline mt-2" id="btnAddItem">+ إضافة صنف</button>
        </div>
        <div class="order-summary">
          <div class="summary-item"><div class="label">الإجمالي</div><div class="value" id="orderTotal">0 ج.م</div></div>
          <div class="summary-item"><div class="label">المدفوع</div><div class="value" id="orderPaidDisplay">0 ج.م</div></div>
          <div class="summary-item"><div class="label">الباقي</div><div class="value danger" id="orderRemainingDisplay">0 ج.م</div></div>
        </div>
        <div class="form-row mt-3">
          <div class="form-group"><label class="form-label">المدفوع</label><input type="number" class="form-input" id="orderPaid" value="0" min="0"></div>
        </div>
        <div class="form-actions">
          <button class="btn btn-lg btn-primary" id="btnSaveOrder">حفظ الطلب</button>
          <button class="btn btn-lg btn-success" id="btnSavePrint">حفظ وطباعة</button>
        </div>
      </div>
    `

    document.getElementById('btnBack').addEventListener('click', () => Router.navigate('dashboard'))
    document.getElementById('btnAddItem').addEventListener('click', () => this.addItemRow())
    document.getElementById('orderPaid').addEventListener('input', () => this.updatePayment())
    document.getElementById('btnSaveOrder').addEventListener('click', () => this.saveOrder())
    document.getElementById('btnSavePrint').addEventListener('click', () => this.saveAndPrint())
    this.addItemRow()
  },

  addItemRow() {
    const tbody = document.getElementById('orderItemsBody')
    const activeItems = this.items.filter(i => i.active)
    const itemOpts = activeItems.map(i => `<option value="${i.id}" data-price="${i.price}">${i.name} (${formatCurrency(i.price)} ج.م)</option>`).join('')
    const row = document.createElement('tr')
    row.innerHTML = `
      <td><select class="form-select item-select"><option value="">اختر الصنف</option>${itemOpts}</select></td>
      <td><input type="number" class="item-price" value="0" min="0"></td>
      <td><input type="number" class="item-qty" value="1" min="1"></td>
      <td><span class="item-total">0</span> ج.م</td>
      <td><button class="btn-remove btn-remove-item">✕</button></td>
    `
    row.querySelector('.item-select').addEventListener('change', (e) => {
      const opt = e.target.options[e.target.selectedIndex]
      const price = opt.dataset.price || 0
      row.querySelector('.item-price').value = price
      this.updateRowTotal(row)
    })
    row.querySelector('.item-price').addEventListener('input', () => this.updateRowTotal(row))
    row.querySelector('.item-qty').addEventListener('input', () => this.updateRowTotal(row))
    row.querySelector('.btn-remove-item').addEventListener('click', () => { row.remove(); this.updateTotals() })
    tbody.appendChild(row)
  },

  updateRowTotal(row) {
    const price = parseFloat(row.querySelector('.item-price')?.value) || 0
    const qty = parseInt(row.querySelector('.item-qty')?.value) || 1
    row.querySelector('.item-total').textContent = formatCurrency(price * qty)
    this.updateTotals()
  },

  updateTotals() {
    let total = 0
    document.querySelectorAll('#orderItemsBody tr').forEach((row) => {
      total += (parseFloat(row.querySelector('.item-price')?.value) || 0) * (parseInt(row.querySelector('.item-qty')?.value) || 1)
    })
    document.getElementById('orderTotal').textContent = formatCurrencyWithEGP(total)
    this.updatePayment()
  },

  updatePayment() {
    let total = 0
    document.querySelectorAll('#orderItemsBody tr').forEach((row) => {
      total += (parseFloat(row.querySelector('.item-price')?.value) || 0) * (parseInt(row.querySelector('.item-qty')?.value) || 1)
    })
    const paid = parseFloat(document.getElementById('orderPaid')?.value) || 0
    document.getElementById('orderPaidDisplay').textContent = formatCurrencyWithEGP(paid)
    document.getElementById('orderRemainingDisplay').textContent = formatCurrencyWithEGP(total - paid)
  },

  collectOrderData() {
    const dentistId = document.getElementById('orderDentist').value
    if (!dentistId) { Toast.error('يرجى اختيار الطبيب'); return null }
    const items = []
    let total = 0
    document.querySelectorAll('#orderItemsBody tr').forEach((row) => {
      const sel = row.querySelector('.item-select')
      const price = parseFloat(row.querySelector('.item-price')?.value) || 0
      const qty = parseInt(row.querySelector('.item-qty')?.value) || 1
      if (sel && sel.value) {
        const opt = sel.options[sel.selectedIndex]
        const lineTotal = price * qty
        items.push({ itemId: sel.value, itemName: opt.textContent.split('(')[0].trim(), unitPrice: price, quantity: qty, lineTotal })
        total += lineTotal
      }
    })
    if (items.length === 0) { Toast.error('يرجى إضافة صنف واحد على الأقل'); return null }
    const paid = parseFloat(document.getElementById('orderPaid').value) || 0
    if (paid > total) { Toast.error('المدفوع لا يمكن أن يكون أكبر من الإجمالي'); return null }
    const catId = document.getElementById('orderCategory').value
    return {
      orderDate: document.getElementById('orderDate').value, dentistId,
      condition: document.getElementById('orderCondition').value,
      diagnosis: document.getElementById('orderDiagnosis').value.trim(),
      upperTooth1: document.getElementById('orderUpperTooth1').value ? parseInt(document.getElementById('orderUpperTooth1').value) : null,
      upperTooth2: document.getElementById('orderUpperTooth2').value ? parseInt(document.getElementById('orderUpperTooth2').value) : null,
      lowerTooth1: document.getElementById('orderLowerTooth1').value ? parseInt(document.getElementById('orderLowerTooth1').value) : null,
      lowerTooth2: document.getElementById('orderLowerTooth2').value ? parseInt(document.getElementById('orderLowerTooth2').value) : null,
      categoryId: catId, categoryName: catId ? this.categories.find(c => c.id === catId)?.name || '' : '',
      categoryComment: document.getElementById('orderCategoryComment').value.trim(),
      items, total, paid, remaining: total - paid
    }
  },

  async saveOrder() {
    const data = this.collectOrderData()
    if (!data) return
    try {
      const result = await API.orders.create(data)
      Toast.success(`تم حفظ الطلب ${result.orderNumber} والفاتورة ${result.invoiceNumber}`)
      this.render(document.getElementById('page-container'))
    } catch (error) { Toast.error('حدث خطأ أثناء حفظ الطلب') }
  },

  async saveAndPrint() {
    const data = this.collectOrderData()
    if (!data) return
    try {
      const result = await API.orders.create(data)
      Toast.success(`تم حفظ الطلب ${result.orderNumber}`)
      const invoice = await API.invoices.getById(result.invoiceId)
      if (invoice) Printing.printInvoice(invoice)
      this.render(document.getElementById('page-container'))
    } catch (error) { Toast.error('حدث خطأ أثناء حفظ الطلب') }
  }
}

Router.register('new-order', (c) => OrdersPage.render(c))
